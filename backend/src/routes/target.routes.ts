import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(verifyToken);

const upsertTargetSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  targetAmount: z.number().or(z.string()).refine((v) => Number(v) >= 0, 'Target amount must be non-negative'),
  currency: z.string().optional().default('INR'),
});

// GET /achievement - Target vs Achievement analysis
router.get('/achievement', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();
    const year = parseInt(req.query.year as string, 10) || currentYear;
    const targetUserId = req.user?.role === 'SALESPERSON' ? req.user.id : (req.query.userId as string | undefined);

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    // Fetch targets for year
    const targetWhere: any = { year };
    if (targetUserId) targetWhere.userId = targetUserId;

    const targets = await prisma.salesTarget.findMany({
      where: targetWhere,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Fetch confirmed/completed orders for that year
    const orderWhere: any = {
      orderDate: { gte: startOfYear, lte: endOfYear },
      status: { not: 'CANCELLED' },
    };

    if (targetUserId) {
      orderWhere.OR = [
        { lead: { accountOwnerId: targetUserId } },
        { quotation: { userId: targetUserId } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        orderDate: true,
        totalAmount: true,
      },
    });

    // Prepare 12-month summary
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthTargets = targets.filter((t) => t.month === monthNum);
      const targetTotal = monthTargets.reduce((sum, t) => sum + Number(t.targetAmount), 0);

      const monthOrders = orders.filter((o) => {
        const d = new Date(o.orderDate);
        return d.getMonth() + 1 === monthNum;
      });
      const achievedTotal = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

      const percentage = targetTotal > 0 ? (achievedTotal / targetTotal) * 100 : 0;

      return {
        month: monthNum,
        monthName: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
        target: Math.round(targetTotal * 100) / 100,
        achieved: Math.round(achievedTotal * 100) / 100,
        achievementRate: Math.round(percentage * 10) / 10,
      };
    });

    const totalTarget = months.reduce((sum, m) => sum + m.target, 0);
    const totalAchieved = months.reduce((sum, m) => sum + m.achieved, 0);
    const overallRate = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

    res.json({
      success: true,
      data: {
        year,
        userId: targetUserId || null,
        totalTarget: Math.round(totalTarget * 100) / 100,
        totalAchieved: Math.round(totalAchieved * 100) / 100,
        overallAchievementRate: Math.round(overallRate * 10) / 10,
        months,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET / - List targets with year/user filters & pagination
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const targetUserId = req.user?.role === 'SALESPERSON' ? req.user.id : (req.query.userId as string | undefined);

    const where: any = {};
    if (year) where.year = year;
    if (targetUserId) where.userId = targetUserId;

    const [total, targets] = await Promise.all([
      prisma.salesTarget.count({ where }),
      prisma.salesTarget.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { month: 'asc' }],
      }),
    ]);

    res.json({
      success: true,
      data: targets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST / - Create/Update target (Upsert on userId + month + year)
router.post(
  '/',
  requireRole('ADMINISTRATOR', 'DIRECTOR', 'SALES_HEAD'),
  validate(upsertTargetSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, month, year, targetAmount, currency = 'INR' } = req.body;

      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const target = await prisma.salesTarget.upsert({
        where: {
          userId_month_year: {
            userId,
            month,
            year,
          },
        },
        create: {
          userId,
          month,
          year,
          targetAmount: new Prisma.Decimal(targetAmount),
          currency,
        },
        update: {
          targetAmount: new Prisma.Decimal(targetAmount),
          currency,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: target,
        message: 'Sales target set successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
