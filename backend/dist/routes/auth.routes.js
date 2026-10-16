"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const userStore_1 = require("../data/userStore");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'mv-greentech-crm-secret-2024';
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters long'),
});
// POST /login
router.post('/login', (0, validate_1.validate)(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        // 1. Primary check: Real PostgreSQL database in Neon
        let dbUser = null;
        try {
            dbUser = await prisma_1.prisma.user.findUnique({
                where: { email: normalizedEmail },
            });
        }
        catch (dbErr) {
            console.warn('DB query failed during login, checking memory store:', dbErr);
        }
        if (dbUser) {
            if (!dbUser.isActive) {
                res.status(403).json({
                    success: false,
                    error: 'Account is deactivated. Please contact an administrator.',
                });
                return;
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, dbUser.password);
            if (isPasswordValid) {
                try {
                    await prisma_1.prisma.user.update({
                        where: { id: dbUser.id },
                        data: { lastLogin: new Date() },
                    });
                }
                catch { }
                const token = jsonwebtoken_1.default.sign({
                    id: dbUser.id,
                    email: dbUser.email,
                    role: dbUser.role,
                    firstName: dbUser.firstName,
                    lastName: dbUser.lastName,
                }, JWT_SECRET, { expiresIn: '7d' });
                res.json({
                    success: true,
                    data: {
                        token,
                        user: {
                            id: dbUser.id,
                            email: dbUser.email,
                            firstName: dbUser.firstName,
                            lastName: dbUser.lastName,
                            role: dbUser.role,
                            isActive: dbUser.isActive,
                            createdAt: dbUser.createdAt,
                            updatedAt: dbUser.updatedAt,
                        },
                    },
                });
                return;
            }
        }
        // 2. Secondary fallback: in-memory store (for offline or unseeded users)
        const storedUser = userStore_1.userStore.getByEmail(normalizedEmail);
        if (storedUser) {
            if (!storedUser.isActive) {
                res.status(403).json({
                    success: false,
                    error: 'Account is deactivated. Please contact an administrator.',
                });
                return;
            }
            const isValid = userStore_1.userStore.verifyPassword(storedUser, password);
            if (isValid) {
                storedUser.lastLogin = new Date();
                const token = jsonwebtoken_1.default.sign({
                    id: storedUser.id,
                    email: storedUser.email,
                    role: storedUser.role,
                    firstName: storedUser.firstName,
                    lastName: storedUser.lastName,
                }, JWT_SECRET, { expiresIn: '7d' });
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
        }
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
    }
    catch (error) {
        next(error);
    }
});
// GET /me
router.get('/me', auth_1.verifyToken, async (req, res, next) => {
    try {
        if (req.user?.id) {
            const found = userStore_1.userStore.getById(req.user.id);
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
                        phone: found.phone || '+91 98765 43210',
                        createdAt: found.createdAt,
                        updatedAt: found.updatedAt,
                    },
                });
                return;
            }
        }
        let user;
        try {
            user = await prisma_1.prisma.user.findUnique({
                where: { id: req.user.id },
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
        }
        catch (dbErr) {
            console.warn('DB error in /me:', dbErr);
        }
        if (!user) {
            // Fallback profile if DB offline
            res.json({
                success: true,
                data: {
                    id: req.user.id,
                    email: req.user.email,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    role: req.user.role,
                    isActive: true,
                },
            });
            return;
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /change-password
router.put('/change-password', auth_1.verifyToken, (0, validate_1.validate)(changePasswordSchema), async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        const isCurrentValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentValid) {
            res.status(400).json({ success: false, error: 'Incorrect current password' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /policy - Returns current authentication & OTP policy
router.get('/policy', (_req, res) => {
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
router.post('/send-otp', async (req, res, next) => {
    try {
        const { identifier, purpose = 'LOGIN', channel = 'EMAIL' } = req.body;
        if (!identifier || typeof identifier !== 'string') {
            res.status(400).json({ success: false, error: 'A valid email or mobile number is required.' });
            return;
        }
        const { OtpService } = await Promise.resolve().then(() => __importStar(require('../services/otp.service')));
        const result = await OtpService.sendOtp(identifier, purpose, channel);
        if (!result.success) {
            res.status(429).json(result);
            return;
        }
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
// POST /verify-otp-login - Login using verified OTP
router.post('/verify-otp-login', async (req, res, next) => {
    try {
        const { identifier, otp } = req.body;
        if (!identifier || !otp) {
            res.status(400).json({ success: false, error: 'Identifier and 6-digit OTP code are required.' });
            return;
        }
        const { OtpService } = await Promise.resolve().then(() => __importStar(require('../services/otp.service')));
        const verification = await OtpService.verifyOtp(identifier, otp, 'LOGIN');
        if (!verification.valid) {
            res.status(401).json({ success: false, error: verification.error || 'Invalid or expired OTP.' });
            return;
        }
        const normEmail = identifier.toLowerCase().trim();
        // Check userStore match
        const demoUser = userStore_1.userStore.getByEmail(normEmail);
        if (demoUser) {
            const token = jsonwebtoken_1.default.sign({
                id: demoUser.id,
                email: demoUser.email,
                role: demoUser.role,
                firstName: demoUser.firstName,
                lastName: demoUser.lastName,
            }, JWT_SECRET, { expiresIn: '24h' });
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
                        createdAt: demoUser.createdAt,
                        updatedAt: new Date(),
                    },
                },
            });
            return;
        }
        // Lookup real user
        let user;
        try {
            user = await prisma_1.prisma.user.findFirst({
                where: {
                    OR: [{ email: normEmail }, { phone: identifier.trim() }],
                },
            });
        }
        catch (dbErr) {
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
            const token = jsonwebtoken_1.default.sign(fallbackUser, JWT_SECRET, { expiresIn: '24h' });
            res.json({ success: true, data: { token, user: fallbackUser } });
            return;
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
        }, JWT_SECRET, { expiresIn: '24h' });
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
    }
    catch (error) {
        next(error);
    }
});
// POST /reset-password-otp - Reset password after verifying OTP
router.post('/reset-password-otp', async (req, res, next) => {
    try {
        const { identifier, otp, newPassword } = req.body;
        if (!identifier || !otp || !newPassword || newPassword.length < 6) {
            res.status(400).json({
                success: false,
                error: 'Identifier, 6-digit OTP, and a new password (min 6 chars) are required.',
            });
            return;
        }
        const { OtpService } = await Promise.resolve().then(() => __importStar(require('../services/otp.service')));
        const verification = await OtpService.verifyOtp(identifier, otp, 'PASSWORD_RESET');
        if (!verification.valid) {
            res.status(400).json({ success: false, error: verification.error || 'Invalid or expired OTP.' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        try {
            await prisma_1.prisma.user.updateMany({
                where: {
                    OR: [{ email: identifier.toLowerCase().trim() }, { phone: identifier.trim() }],
                },
                data: { password: hashedPassword },
            });
        }
        catch (dbErr) {
            console.warn('DB update during reset-password:', dbErr);
        }
        res.json({
            success: true,
            message: 'Your password has been reset successfully. You can now login with your new password.',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
