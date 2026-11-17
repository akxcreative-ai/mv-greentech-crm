import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

// Store file in memory buffer for persistent DB storage (render-safe)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|ppt|pptx|png|jpg|jpeg|webp)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PowerPoint presentations (PPT/PPTX), and Images (PNG/JPG/WEBP) are allowed.'));
    }
  },
});

router.use(verifyToken);

// Determine file type helper
function detectFileType(mime: string, originalName: string): string {
  if (mime.includes('pdf') || originalName.toLowerCase().endsWith('.pdf')) return 'PDF';
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    originalName.toLowerCase().endsWith('.ppt') ||
    originalName.toLowerCase().endsWith('.pptx')
  ) {
    return 'PPT';
  }
  return 'IMAGE';
}

// 1. GET /v1/training/materials - List training materials accessible to current user
router.get('/materials', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const isDirectorOrAdmin = ['DIRECTOR', 'ADMINISTRATOR', 'SALES_HEAD'].includes(user.role);

    let materials;
    if (isDirectorOrAdmin) {
      // Directors & Admins see all materials with full access list & view counts
      materials = await prisma.trainingMaterial.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          mimeType: true,
          isAllAccess: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          createdById: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          accessList: {
            select: {
              userId: true,
              user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
            },
          },
          _count: {
            select: { viewLogs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Salespersons only see materials that are isAllAccess=true OR specifically assigned to them
      materials = await prisma.trainingMaterial.findMany({
        where: {
          isActive: true,
          OR: [
            { isAllAccess: true },
            {
              accessList: {
                some: { userId: user.id },
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          mimeType: true,
          isAllAccess: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json({
      success: true,
      data: materials,
    });
  } catch (error) {
    next(error);
  }
});

// 2. POST /v1/training/upload - Upload new training material (Director / Sales Head / Admin only)
router.post(
  '/upload',
  requireRole('DIRECTOR', 'ADMINISTRATOR', 'SALES_HEAD'),
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'File is required' });
        return;
      }

      const { title, description, category, isAllAccess, allowedUserIds } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        res.status(400).json({ success: false, error: 'Title is required' });
        return;
      }

      const allAccess = isAllAccess === 'true' || isAllAccess === true;
      const fileType = detectFileType(req.file.mimetype, req.file.originalname);
      const base64Data = req.file.buffer.toString('base64');

      let userIdsToGrant: string[] = [];
      if (!allAccess && allowedUserIds) {
        if (Array.isArray(allowedUserIds)) {
          userIdsToGrant = allowedUserIds;
        } else if (typeof allowedUserIds === 'string') {
          try {
            const parsed = JSON.parse(allowedUserIds);
            userIdsToGrant = Array.isArray(parsed) ? parsed : [allowedUserIds];
          } catch {
            userIdsToGrant = allowedUserIds.split(',').map((s) => s.trim()).filter(Boolean);
          }
        }
      }

      const created = await prisma.trainingMaterial.create({
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          category: category ? category.trim() : 'General',
          fileName: req.file.originalname,
          fileType,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          fileData: base64Data,
          isAllAccess: allAccess,
          createdById: req.user!.id,
          accessList: {
            create: userIdsToGrant.map((uid) => ({ userId: uid })),
          },
        },
        include: {
          accessList: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Training material uploaded successfully',
        data: {
          id: created.id,
          title: created.title,
          category: created.category,
          fileName: created.fileName,
          fileType: created.fileType,
          fileSize: created.fileSize,
          isAllAccess: created.isAllAccess,
          accessList: created.accessList,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 3. PUT /v1/training/materials/:id/access - Update access permissions for material
router.put(
  '/materials/:id/access',
  requireRole('DIRECTOR', 'ADMINISTRATOR', 'SALES_HEAD'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { isAllAccess, allowedUserIds, title, description, category } = req.body;

      const existing = await prisma.trainingMaterial.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Training material not found' });
        return;
      }

      const allAccess = isAllAccess === true || isAllAccess === 'true';

      // Parse user IDs
      let userIds: string[] = [];
      if (!allAccess && allowedUserIds) {
        if (Array.isArray(allowedUserIds)) {
          userIds = allowedUserIds;
        } else if (typeof allowedUserIds === 'string') {
          try {
            const parsed = JSON.parse(allowedUserIds);
            userIds = Array.isArray(parsed) ? parsed : [allowedUserIds];
          } catch {
            userIds = allowedUserIds.split(',').map((s) => s.trim()).filter(Boolean);
          }
        }
      }

      // Update in transaction: delete old access list, insert new
      await prisma.$transaction(async (tx) => {
        await tx.trainingMaterial.update({
          where: { id },
          data: {
            ...(title ? { title: title.trim() } : {}),
            ...(description !== undefined ? { description: description?.trim() || null } : {}),
            ...(category ? { category: category.trim() } : {}),
            isAllAccess: allAccess,
          },
        });

        await tx.trainingAccess.deleteMany({ where: { trainingMaterialId: id } });

        if (!allAccess && userIds.length > 0) {
          await tx.trainingAccess.createMany({
            data: userIds.map((uid) => ({ trainingMaterialId: id, userId: uid })),
          });
        }
      });

      const updated = await prisma.trainingMaterial.findUnique({
        where: { id },
        include: {
          accessList: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      });

      res.json({
        success: true,
        message: 'Access permissions updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 4. DELETE /v1/training/materials/:id - Delete material (Director/Admin only)
router.delete(
  '/materials/:id',
  requireRole('DIRECTOR', 'ADMINISTRATOR', 'SALES_HEAD'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await prisma.trainingMaterial.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Training material not found' });
        return;
      }

      await prisma.trainingMaterial.delete({ where: { id } });

      res.json({
        success: true,
        message: 'Training material deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// 5. GET /v1/training/materials/:id/stream - Authenticated Secure Stream
router.get('/materials/:id/stream', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const isDirectorOrAdmin = ['DIRECTOR', 'ADMINISTRATOR', 'SALES_HEAD'].includes(user.role);

    const material = await prisma.trainingMaterial.findUnique({
      where: { id },
      include: {
        accessList: true,
      },
    });

    if (!material || !material.isActive) {
      res.status(404).json({ success: false, error: 'Training material not found' });
      return;
    }

    // Permission check for Salespersons
    if (!isDirectorOrAdmin) {
      const hasDirectAccess = material.accessList.some((a) => a.userId === user.id);
      if (!material.isAllAccess && !hasDirectAccess) {
        res.status(403).json({ success: false, error: 'Access denied. You do not have permission to view this training material.' });
        return;
      }
    }

    if (!material.fileData) {
      res.status(404).json({ success: false, error: 'File data is empty or missing.' });
      return;
    }

    // Log the view asynchronously
    prisma.trainingViewLog
      .create({
        data: {
          trainingMaterialId: id,
          userId: user.id,
        },
      })
      .catch((err) => console.error('Failed to log training view:', err));

    const fileBuffer = Buffer.from(material.fileData, 'base64');

    // Strict security headers: Prevent downloading, caching, framing outside our domain
    res.setHeader('Content-Type', material.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fileBuffer.length);
    // 'inline' tells browser to display, NOT download prompt
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(material.fileName)}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.end(fileBuffer);
  } catch (error) {
    next(error);
  }
});

// 6. GET /v1/training/materials/:id/views - View audit log for Director
router.get(
  '/materials/:id/views',
  requireRole('DIRECTOR', 'ADMINISTRATOR', 'SALES_HEAD'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const logs = await prisma.trainingViewLog.findMany({
        where: { trainingMaterialId: id },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
        orderBy: { viewedAt: 'desc' },
        take: 100,
      });

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
