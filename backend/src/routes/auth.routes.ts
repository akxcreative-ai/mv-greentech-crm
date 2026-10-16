import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { userStore } from '../data/userStore';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mv-greentech-crm-secret-2024';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

// POST /login
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Check userStore (contains default roles + all dynamically created users)
      const storedUser = userStore.getByEmail(normalizedEmail);
      if (storedUser) {
        if (!storedUser.isActive) {
          res.status(403).json({
            success: false,
            error: 'Account is deactivated. Please contact an administrator.',
          });
          return;
        }

        const isValid = userStore.verifyPassword(storedUser, password);
        if (!isValid) {
          res.status(401).json({ success: false, error: 'Invalid email or password' });
          return;
        }

        storedUser.lastLogin = new Date();

        const token = jwt.sign(
          {
            id: storedUser.id,
            email: storedUser.email,
            role: storedUser.role,
            firstName: storedUser.firstName,
            lastName: storedUser.lastName,
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          success: true,
          data: {
            token,
            user: {
              id: storedUser.id,
              email: storedUser.email,
              firstName: storedUser.firstName,
              lastName: storedUser.lastName,
              role: storedUser.role,
              isActive: storedUser.isActive,
              createdAt: storedUser.createdAt,
              updatedAt: storedUser.updatedAt,
            },
          },
        });
        return;
      }

      let user;
      try {
        user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
      } catch (dbErr) {
        console.warn('DB query failed, fallback check:', dbErr);
      }

      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          error: 'Account is deactivated. Please contact an administrator.',
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
        select: {
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
        },
      });

      const token = jwt.sign(
        {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: updatedUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /me
router.get(
  '/me',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.id?.startsWith('demo-')) {
        const found = Object.values(DEMO_USERS).find((u) => u.id === req.user!.id);
        if (found) {
          res.json({
            success: true,
            data: {
              id: found.id,
              email: found.email,
              firstName: found.firstName,
              lastName: found.lastName,
              role: found.role,
              isActive: found.isActive,
              phone: '+91 98765 43210',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          return;
        }
      }

      let user;
      try {
        user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: {
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
          },
        });
      } catch (dbErr) {
        console.warn('DB error in /me:', dbErr);
      }

      if (!user) {
        // Fallback profile if DB offline
        res.json({
          success: true,
          data: {
            id: req.user!.id,
            email: req.user!.email,
            firstName: req.user!.firstName,
            lastName: req.user!.lastName,
            role: req.user!.role,
            isActive: true,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /change-password
router.put(
  '/change-password',
  verifyToken,
  validate(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentValid) {
        res.status(400).json({ success: false, error: 'Incorrect current password' });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /policy - Returns current authentication & OTP policy
router.get('/policy', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      otpEnabled: true,
      requireOtpForLogin: false, // Default: configurable by Admin in Settings
      channels: ['EMAIL', 'SMS'],
      expiryMinutes: 5,
      cooldownSeconds: 45,
      maxAttempts: 5,
      hasSmtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
      hasSmsConfigured: Boolean(process.env.SMS_API_KEY || process.env.TWILIO_ACCOUNT_SID),
    },
  });
});

// POST /send-otp - Request an OTP code
router.post('/send-otp', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, purpose = 'LOGIN', channel = 'EMAIL' } = req.body;

    if (!identifier || typeof identifier !== 'string') {
      res.status(400).json({ success: false, error: 'A valid email or mobile number is required.' });
      return;
    }

    const { OtpService } = await import('../services/otp.service');
    const result = await OtpService.sendOtp(identifier, purpose, channel);

    if (!result.success) {
      res.status(429).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /verify-otp-login - Login using verified OTP
router.post('/verify-otp-login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      res.status(400).json({ success: false, error: 'Identifier and 6-digit OTP code are required.' });
      return;
    }

    const { OtpService } = await import('../services/otp.service');
    const verification = await OtpService.verifyOtp(identifier, otp, 'LOGIN');

    if (!verification.valid) {
      res.status(401).json({ success: false, error: verification.error || 'Invalid or expired OTP.' });
      return;
    }

    const normEmail = identifier.toLowerCase().trim();

    // Check demo user match
    const demoUser = DEMO_USERS[normEmail];
    if (demoUser) {
      const token = jwt.sign(
        {
          id: demoUser.id,
          email: demoUser.email,
          role: demoUser.role,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: demoUser.id,
            email: demoUser.email,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            role: demoUser.role,
            isActive: demoUser.isActive,
            isEmailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      });
      return;
    }

    // Lookup real user
    let user;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ email: normEmail }, { phone: identifier.trim() }],
        },
      });
    } catch (dbErr) {
      console.warn('DB lookup error:', dbErr);
    }

    if (!user) {
      // In offline/dev fallback, synthesize user profile
      const fallbackUser = {
        id: `usr-${Date.now()}`,
        email: normEmail,
        firstName: 'Authorized',
        lastName: 'User',
        role: 'SALESPERSON',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const token = jwt.sign(fallbackUser, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, data: { token, user: fallbackUser } });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /reset-password-otp - Reset password after verifying OTP
router.post('/reset-password-otp', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Identifier, 6-digit OTP, and a new password (min 6 chars) are required.',
      });
      return;
    }

    const { OtpService } = await import('../services/otp.service');
    const verification = await OtpService.verifyOtp(identifier, otp, 'PASSWORD_RESET');

    if (!verification.valid) {
      res.status(400).json({ success: false, error: verification.error || 'Invalid or expired OTP.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    try {
      await prisma.user.updateMany({
        where: {
          OR: [{ email: identifier.toLowerCase().trim() }, { phone: identifier.trim() }],
        },
        data: { password: hashedPassword },
      });
    } catch (dbErr) {
      console.warn('DB update during reset-password:', dbErr);
    }

    res.json({
      success: true,
      message: 'Your password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
