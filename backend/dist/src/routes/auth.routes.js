"use strict";
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
const DEMO_USERS = {
    'admin@mvgreentech.com': {
        id: 'demo-admin-id',
        email: 'admin@mvgreentech.com',
        passwordPlain: 'Admin@123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMINISTRATOR',
        isActive: true,
    },
    'director@mvgreentech.com': {
        id: 'demo-director-id',
        email: 'director@mvgreentech.com',
        passwordPlain: 'Director@123',
        firstName: 'Rajesh',
        lastName: 'Sharma (Director)',
        role: 'DIRECTOR',
        isActive: true,
    },
    'saleshead@mvgreentech.com': {
        id: 'demo-saleshead-id',
        email: 'saleshead@mvgreentech.com',
        passwordPlain: 'SalesHead@123',
        firstName: 'Amit',
        lastName: 'Verma (Sales Head)',
        role: 'SALES_HEAD',
        isActive: true,
    },
    'sales@mvgreentech.com': {
        id: 'demo-sales-id',
        email: 'sales@mvgreentech.com',
        passwordPlain: 'Sales@123',
        firstName: 'Priya',
        lastName: 'Patel (Salesperson)',
        role: 'SALESPERSON',
        isActive: true,
    },
};
// POST /login
router.post('/login', (0, validate_1.validate)(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        // Check demo credentials first or as fallback
        const demoUser = DEMO_USERS[normalizedEmail];
        if (demoUser && password === demoUser.passwordPlain) {
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
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                },
            });
            return;
        }
        let user;
        try {
            user = await prisma_1.prisma.user.findUnique({
                where: { email: normalizedEmail },
            });
        }
        catch (dbErr) {
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ success: false, error: 'Invalid email or password' });
            return;
        }
        const updatedUser = await prisma_1.prisma.user.update({
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
        const token = jsonwebtoken_1.default.sign({
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
        }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            success: true,
            data: {
                token,
                user: updatedUser,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /me
router.get('/me', auth_1.verifyToken, async (req, res, next) => {
    try {
        if (req.user?.id?.startsWith('demo-')) {
            const found = Object.values(DEMO_USERS).find((u) => u.id === req.user.id);
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
exports.default = router;
