import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(verifyToken);

const createVisitSchema = z.object({
  customerId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  userId: z.string().optional(),
  visitDate: z.string().or(z.date()),
  purpose: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
});

const updateVisitSchema = createVisitSchema.partial();

// GET / - List visits with filters & pagination
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const { userId, customerId, leadId, fromDate, toDate } = req.query;

    const where: any = {};

    if (req.user?.role === 'SALESPERSON') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId as string;
    }

    if (customerId) {
      where.customerId = customerId as string;
    }

    if (leadId) {
      where.leadId = leadId as string;
    }

    if (fromDate || toDate) {
      where.visitDate = {};
      if (fromDate) where.visitDate.gte = new Date(fromDate as string);
      if (toDate) {
        const to = new Date(toDate as string);
        to.setHours(23, 59, 59, 999);
        where.visitDate.lte = to;
      }
    }

    const [total, visits] = await Promise.all([
      prisma.customerVisit.count({ where }),
      prisma.customerVisit.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: visits,
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

// GET /:id - Get single visit
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const visit = await prisma.customerVisit.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!visit) {
      res.status(404).json({ success: false, error: 'Customer visit not found' });
      return;
    }

    if (req.user?.role === 'SALESPERSON' && visit.userId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access forbidden: You cannot view visits of other users' });
      return;
    }

    res.json({
      success: true,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
});

// POST / - Create visit
router.post(
  '/',
  validate(createVisitSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { customerId, leadId, userId, visitDate, purpose, notes, outcome, nextAction } = req.body;
      const targetUserId = req.user?.role === 'SALESPERSON' ? req.user.id : (userId || req.user!.id);
      const parsedVisitDate = new Date(visitDate);

      const visit = await prisma.customerVisit.create({
        data: {
          customerId: customerId || null,
          leadId: leadId || null,
          userId: targetUserId,
          visitDate: parsedVisitDate,
          purpose: purpose || null,
          notes: notes || null,
          outcome: outcome || null,
          nextAction: nextAction || null,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Update lead customerVisitDate and log activity if leadId is linked
      if (leadId) {
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            customerVisitDate: parsedVisitDate,
            nextAction: nextAction || undefined,
          },
        });

        await prisma.leadActivity.create({
          data: {
            leadId,
            userId: req.user!.id,
            type: 'VISIT',
            description: `Customer visit conducted. Purpose: ${purpose || 'General'}. Outcome: ${outcome || 'N/A'}`,
            metadata: { visitId: visit.id, notes, outcome, nextAction },
          },
        });
      }

      res.status(201).json({
        success: true,
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /:id - Update visit
router.put(
  '/:id',
  validate(updateVisitSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { visitDate, ...rest } = req.body;

      const existing = await prisma.customerVisit.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Customer visit not found' });
        return;
      }

      if (req.user?.role === 'SALESPERSON' && existing.userId !== req.user.id) {
        res.status(403).json({ success: false, error: 'Access forbidden: You cannot update visits of other users' });
        return;
      }

      const dataToUpdate: any = { ...rest };
      if (visitDate) {
        dataToUpdate.visitDate = new Date(visitDate);
      }

      const updated = await prisma.customerVisit.update({
        where: { id },
        data: dataToUpdate,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
