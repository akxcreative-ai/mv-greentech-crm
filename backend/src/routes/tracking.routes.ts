import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(verifyToken);

const pingSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional().nullable(),
  heading: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  battery: z.number().optional().nullable(),
  address: z.string().optional().nullable(),
  isTrackingActive: z.boolean().optional(),
});

// POST /v1/tracking/ping - Salesperson phone sends GPS update
router.post(
  '/ping',
  validate(pingSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { latitude, longitude, accuracy, heading, speed, battery, address, isTrackingActive } = req.body;

      const now = new Date();

      // Update current user's live position
      const [location] = await Promise.all([
        prisma.userLocation.create({
          data: {
            userId,
            latitude,
            longitude,
            accuracy: accuracy ?? null,
            heading: heading ?? null,
            speed: speed ?? null,
            battery: battery ?? null,
            address: address ?? null,
            timestamp: now,
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            lastLatitude: latitude,
            lastLongitude: longitude,
            lastHeading: heading ?? null,
            lastSpeed: speed ?? null,
            lastLocationAt: now,
            isTrackingActive: isTrackingActive ?? true,
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Location recorded',
        data: location,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /v1/tracking/toggle - Turn tracking ON or OFF
router.post('/toggle', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { active } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isTrackingActive: Boolean(active) },
      select: { id: true, firstName: true, lastName: true, isTrackingActive: true },
    });

    res.status(200).json({
      success: true,
      message: `Duty tracking turned ${active ? 'ON' : 'OFF'}`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// GET /v1/tracking/live - Director/Admin gets real-time positions of all salespersons
router.get('/live', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Only Managers can view team tracking
    if (req.user?.role === 'SALESPERSON') {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const salesUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ['SALESPERSON', 'SALES_HEAD'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        lastLogin: true,
        lastLatitude: true,
        lastLongitude: true,
        lastHeading: true,
        lastSpeed: true,
        lastLocationAt: true,
        isTrackingActive: true,
        customerVisits: {
          take: 3,
          orderBy: { visitDate: 'desc' },
          select: {
            id: true,
            visitDate: true,
            purpose: true,
            outcome: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: salesUsers,
    });
  } catch (err) {
    next(err);
  }
});

// GET /v1/tracking/history/:userId - Get today's route history for polyline
router.get('/history/:userId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'SALESPERSON' && req.user.id !== req.params.userId) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;
    const dateQuery = req.query.date as string;

    const targetDate = dateQuery ? new Date(dateQuery) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const locations = await prisma.userLocation.findMany({
      where: {
        userId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { timestamp: 'asc' },
      take: 1000,
    });

    res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
