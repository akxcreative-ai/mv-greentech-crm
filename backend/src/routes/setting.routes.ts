import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { verifyToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Settings are accessible to all authenticated team members
router.use(verifyToken);

const updateSettingSchema = z.object({
  value: z.any(),
});

// GET / - List all settings
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });

    // Also format as key-value map for convenience
    const settingsMap: Record<string, any> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settings,
      settings: settingsMap,
    });
  } catch (error) {
    next(error);
  }
});

// GET /:key - Get single setting
router.get('/:key', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { key } = req.params;

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      res.status(404).json({ success: false, error: `Setting '${key}' not found` });
      return;
    }

    res.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /:key - Upsert setting (Administrator & Director only)
router.put(
  '/:key',
  requireRole('ADMINISTRATOR', 'DIRECTOR'),
  validate(updateSettingSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const setting = await prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value,
        },
        update: {
          value,
        },
      });

      res.json({
        success: true,
        data: setting,
        message: `Setting '${key}' updated successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
