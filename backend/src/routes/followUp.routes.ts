import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FollowUpStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(verifyToken);

const followUpStatusEnum = z.enum(['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED']);

const createFollowUpSchema = z.object({
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  userId: z.string().optional(),
  type: z.string().min(1, 'Follow-up type is required'), // CALL, EMAIL, VISIT, MEETING
  scheduledDate: z.string().or(z.date()),
  notes: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
});

const updateFollowUpSchema = z.object({
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  userId: z.string().optional(),
  type: z.string().optional(),
  scheduledDate: z.string().or(z.date()).optional(),
  completedDate: z.string().or(z.date()).optional().nullable(),
  status: followUpStatusEnum.optional(),
  notes: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
});

const completeFollowUpSchema = z.object({
  notes: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  completedDate: z.string().or(z.date()).optional(),
});

// GET /today - Today's follow-ups for current user (Must be before /:id)
router.get('/today', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.role === 'SALESPERSON' ? req.user.id : ((req.query.userId as string) || req.user!.id);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const followUps = await prisma.followUp.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        lead: {
          select: { id: true, leadNumber: true, customerName: true, mobile: true, email: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    res.json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    next(error);
  }
});

// GET /overdue - Overdue follow-ups (Must be before /:id)
router.get('/overdue', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.query.userId as string | undefined;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const where: any = {
      scheduledDate: { lt: startOfDay },
      status: { in: ['PENDING', 'OVERDUE'] },
    };

    if (req.user?.role === 'SALESPERSON') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    const followUps = await prisma.followUp.findMany({
      where,
      include: {
        lead: {
          select: { id: true, leadNumber: true, customerName: true, mobile: true, email: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    res.json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    next(error);
  }
});

// GET / - List follow-ups with filters & pagination
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, type, userId, leadId, customerId, fromDate, toDate } = req.query;

    const where: any = {};

    if (status && Object.values(FollowUpStatus).includes(status as FollowUpStatus)) {
      where.status = status as FollowUpStatus;
    }

    if (type) {
      where.type = { contains: type as string, mode: 'insensitive' };
    }

    if (req.user?.role === 'SALESPERSON') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId as string;
    }

    if (leadId) {
      where.leadId = leadId as string;
    }

    if (customerId) {
      where.customerId = customerId as string;
    }

    if (fromDate || toDate) {
      where.scheduledDate = {};
      if (fromDate) where.scheduledDate.gte = new Date(fromDate as string);
      if (toDate) {
        const to = new Date(toDate as string);
        to.setHours(23, 59, 59, 999);
        where.scheduledDate.lte = to;
      }
    }

    const [total, followUps] = await Promise.all([
      prisma.followUp.count({ where }),
      prisma.followUp.findMany({
        where,
        include: {
          lead: {
            select: { id: true, leadNumber: true, customerName: true, mobile: true, email: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip,
        take: limit,
        orderBy: { scheduledDate: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: followUps,
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

// POST / - Create follow-up
router.post(
  '/',
  validate(createFollowUpSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { leadId, customerId, userId, type, scheduledDate, notes, nextAction } = req.body;
      const targetUserId = req.user?.role === 'SALESPERSON' ? req.user.id : (userId || req.user!.id);

      const followUp = await prisma.followUp.create({
        data: {
          leadId: leadId || null,
          customerId: customerId || null,
          userId: targetUserId,
          type: type.toUpperCase(),
          scheduledDate: new Date(scheduledDate),
          notes: notes || null,
          nextAction: nextAction || null,
          status: 'PENDING',
        },
        include: {
          lead: { select: { id: true, leadNumber: true, customerName: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Update lead nextFollowUpDate if leadId is present
      if (leadId) {
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            nextFollowUpDate: new Date(scheduledDate),
            nextAction: nextAction || undefined,
          },
        });
      }

      res.status(201).json({
        success: true,
        data: followUp,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /:id/complete - Mark follow-up as completed
router.put(
  '/:id/complete',
  validate(completeFollowUpSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { notes, nextAction, completedDate } = req.body;

      const followUp = await prisma.followUp.findUnique({ where: { id } });
      if (!followUp) {
        res.status(404).json({ success: false, error: 'Follow-up not found' });
        return;
      }

      if (req.user?.role === 'SALESPERSON' && followUp.userId !== req.user.id) {
        res.status(403).json({ success: false, error: 'Access forbidden: You cannot complete follow-ups of other users' });
        return;
      }

      const updated = await prisma.followUp.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedDate: completedDate ? new Date(completedDate) : new Date(),
          notes: notes !== undefined ? notes : followUp.notes,
          nextAction: nextAction !== undefined ? nextAction : followUp.nextAction,
        },
        include: {
          lead: { select: { id: true, leadNumber: true, customerName: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // If associated with a lead, log lead activity
      if (updated.leadId) {
        await prisma.leadActivity.create({
          data: {
            leadId: updated.leadId,
            userId: req.user!.id,
            type: 'FOLLOW_UP_COMPLETED',
            description: `Follow-up (${updated.type}) completed. Notes: ${notes || 'None'}`,
            metadata: { followUpId: updated.id, nextAction },
          },
        });

        if (nextAction) {
          await prisma.lead.update({
            where: { id: updated.leadId },
            data: { nextAction },
          });
        }
      }

      res.json({
        success: true,
        data: updated,
        message: 'Follow-up marked as completed',
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /:id - Update follow-up
router.put(
  '/:id',
  validate(updateFollowUpSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { scheduledDate, completedDate, ...rest } = req.body;

      const existing = await prisma.followUp.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Follow-up not found' });
        return;
      }

      if (req.user?.role === 'SALESPERSON' && existing.userId !== req.user.id) {
        res.status(403).json({ success: false, error: 'Access forbidden: You cannot update follow-ups of other users' });
        return;
      }

      const dataToUpdate: any = { ...rest };
      if (scheduledDate) dataToUpdate.scheduledDate = new Date(scheduledDate);
      if (completedDate !== undefined) {
        dataToUpdate.completedDate = completedDate ? new Date(completedDate) : null;
      }

      const updated = await prisma.followUp.update({
        where: { id },
        data: dataToUpdate,
        include: {
          lead: { select: { id: true, leadNumber: true, customerName: true } },
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
