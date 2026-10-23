import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { userStore } from '../data/userStore';

const router = Router();

// Allow ADMINISTRATOR, DIRECTOR, and SALES_HEAD to access user routes
router.use(verifyToken, requireRole('ADMINISTRATOR', 'DIRECTOR', 'SALES_HEAD'));

const roleEnum = z.enum(['DIRECTOR', 'SALES_HEAD', 'SALESPERSON', 'ADMINISTRATOR']);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional().nullable(),
  role: roleEnum.default('SALESPERSON'),
  isActive: z.boolean().default(true),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
});

const userSelectFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
};

// GET / - List users with pagination and filters
router.get('/', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.max(1, Math.min(500, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  const search = (req.query.search as string | undefined)?.toLowerCase();
  const role = req.query.role as Role | undefined;
  const isActiveParam = req.query.isActive as string | undefined;

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && Object.values(Role).includes(role)) where.role = role;
    if (isActiveParam !== undefined) where.isActive = isActiveParam === 'true';

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: userSelectFields,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    // In-memory fallback
    let filtered = userStore.getAll();
    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.phone && u.phone.includes(search))
      );
    }
    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (isActiveParam !== undefined) {
      const activeBool = isActiveParam === 'true';
      filtered = filtered.filter((u) => u.isActive === activeBool);
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  }
});

// GET /:id - Get specific user
router.get('/:id', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelectFields,
    });

    if (user) {
      res.json({ success: true, data: user });
      return;
    }
  } catch {
    // fallback check
  }

  const memUser = userStore.getById(id);
  if (memUser) {
    res.json({ success: true, data: memUser });
    return;
  }

  res.status(404).json({ success: false, error: 'User not found' });
});

// POST / - Create user (Admin only)
router.post(
  '/',
  requireRole('ADMINISTRATOR'),
  validate(createUserSchema),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { email, password, firstName, lastName, phone, role, isActive } = req.body;
    const normEmail = email.toLowerCase().trim();

    try {
      const existing = await prisma.user.findUnique({
        where: { email: normEmail },
      });

      if (existing) {
        res.status(409).json({ success: false, error: 'A user with this email already exists' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: normEmail,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role,
          isActive: isActive !== undefined ? isActive : true,
        },
        select: userSelectFields,
      });

      // Mirror in store
      try {
        userStore.create({
          email: normEmail,
          passwordPlain: password,
          firstName,
          lastName,
          phone: phone || null,
          role,
          isActive: isActive !== undefined ? isActive : true,
        });
      } catch {
        // already exists in store
      }

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch {
      // In-memory fallback
      try {
        const newUser = userStore.create({
          email: normEmail,
          passwordPlain: password,
          firstName,
          lastName,
          phone: phone || null,
          role: role || 'SALESPERSON',
          isActive: isActive !== undefined ? isActive : true,
        });

        res.status(201).json({
          success: true,
          data: newUser,
        });
      } catch (err: any) {
        res.status(409).json({ success: false, error: err.message || 'User already exists' });
      }
    }
  }
);

// PUT /:id - Update user (Admin only)
router.put(
  '/:id',
  requireRole('ADMINISTRATOR'),
  validate(updateUserSchema),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { email, password, firstName, lastName, phone, role, isActive } = req.body;

    // Prevent administrators from changing their own role
    if (req.user?.id === id && role && role !== req.user.role) {
      res.status(400).json({ success: false, error: 'Administrators cannot alter their own system role' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) {
        const dataToUpdate: any = {};
        if (email !== undefined) {
          const normalizedEmail = email.toLowerCase().trim();
          if (normalizedEmail !== user.email) {
            const emailExists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (emailExists) {
              res.status(409).json({ success: false, error: 'Email is already in use by another user' });
              return;
            }
          }
          dataToUpdate.email = normalizedEmail;
        }

        if (password && password.trim().length >= 6) {
          dataToUpdate.password = await bcrypt.hash(password.trim(), 10);
        }
        if (firstName !== undefined) dataToUpdate.firstName = firstName;
        if (lastName !== undefined) dataToUpdate.lastName = lastName;
        if (phone !== undefined) dataToUpdate.phone = phone;
        if (role !== undefined) dataToUpdate.role = role;
        if (isActive !== undefined) dataToUpdate.isActive = isActive;

        const updatedUser = await prisma.user.update({
          where: { id },
          data: dataToUpdate,
          select: userSelectFields,
        });

        userStore.update(id, {
          email,
          firstName,
          lastName,
          phone,
          role,
          isActive,
          passwordPlain: password,
        });

        res.json({ success: true, data: updatedUser });
        return;
      }
    } catch {
      // fallback
    }

    const updated = userStore.update(id, {
      email,
      firstName,
      lastName,
      phone,
      role,
      isActive,
      passwordPlain: password,
    });

    if (updated) {
      res.json({ success: true, data: updated });
      return;
    }

    res.status(404).json({ success: false, error: 'User not found' });
  }
);

// Toggle active/status handler
const handleToggleActive = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) {
      if (user.id === req.user?.id) {
        res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: userSelectFields,
      });

      userStore.toggleActive(id);

      res.json({
        success: true,
        data: updatedUser,
        message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      });
      return;
    }
  } catch {
    // fallback check
  }

  const toggled = userStore.toggleActive(id);
  if (toggled) {
    res.json({
      success: true,
      data: toggled,
      message: `User ${toggled.isActive ? 'activated' : 'deactivated'} successfully`,
    });
    return;
  }

  res.status(404).json({ success: false, error: 'User not found' });
};

// Support BOTH routes (Admin only)
router.put('/:id/toggle-active', requireRole('ADMINISTRATOR'), handleToggleActive);
router.put('/:id/toggle-status', requireRole('ADMINISTRATOR'), handleToggleActive);

// DELETE /:id - Permanently delete user (Admin only)
router.delete('/:id', requireRole('ADMINISTRATOR'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) {
        await prisma.$transaction([
          prisma.lead.updateMany({ where: { accountOwnerId: id }, data: { accountOwnerId: null } }),
          prisma.customer.updateMany({ where: { accountOwnerId: id }, data: { accountOwnerId: null } }),
          prisma.customerVisit.deleteMany({ where: { userId: id } }),
          prisma.followUp.deleteMany({ where: { userId: id } }),
          prisma.salesTarget.deleteMany({ where: { userId: id } }),
          prisma.leadActivity.deleteMany({ where: { userId: id } }),
          prisma.leadAssignment.deleteMany({ where: { userId: id } }),
          prisma.auditLog.deleteMany({ where: { userId: id } }),
          prisma.user.delete({ where: { id } }),
        ]);

        userStore.delete(id);

        res.json({
          success: true,
          message: `User ${user.firstName} ${user.lastName} has been permanently deleted.`,
        });
        return;
      }
    } catch (dbErr: any) {
      console.warn('DB delete error, checking fallback:', dbErr);
    }

    const memDeleted = userStore.delete(id);
    if (memDeleted) {
      res.json({ success: true, message: 'User permanently deleted.' });
      return;
    }

    res.status(404).json({ success: false, error: 'User not found' });
  } catch (error) {
    next(error);
  }
});

export default router;
