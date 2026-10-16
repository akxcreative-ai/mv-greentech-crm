"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// Protect all user routes for ADMINISTRATOR and DIRECTOR
router.use(auth_1.verifyToken, (0, auth_1.requireRole)('ADMINISTRATOR', 'DIRECTOR'));
const roleEnum = zod_1.z.enum(['DIRECTOR', 'SALES_HEAD', 'SALESPERSON', 'ADMINISTRATOR']);
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    phone: zod_1.z.string().optional().nullable(),
    role: roleEnum.default('SALESPERSON'),
    isActive: zod_1.z.boolean().default(true),
});
const updateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').optional(),
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    phone: zod_1.z.string().optional().nullable(),
    role: roleEnum.optional(),
    isActive: zod_1.z.boolean().optional(),
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
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const role = req.query.role;
        const isActiveParam = req.query.isActive;
        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role && Object.values(client_1.Role).includes(role)) {
            where.role = role;
        }
        if (isActiveParam !== undefined) {
            where.isActive = isActiveParam === 'true';
        }
        const [total, users] = await Promise.all([
            prisma_1.prisma.user.count({ where }),
            prisma_1.prisma.user.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
// GET /:id - Get specific user
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            select: userSelectFields,
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
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
// POST / - Create user
router.post('/', (0, validate_1.validate)(createUserSchema), async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, phone, role, isActive } = req.body;
        const existing = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (existing) {
            res.status(409).json({ success: false, error: 'A user with this email already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                firstName,
                lastName,
                phone: phone || null,
                role,
                isActive: isActive !== undefined ? isActive : true,
            },
            select: userSelectFields,
        });
        res.status(201).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /:id - Update user
router.put('/:id', (0, validate_1.validate)(updateUserSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { email, password, firstName, lastName, phone, role, isActive } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        const dataToUpdate = {};
        if (email !== undefined) {
            const normalizedEmail = email.toLowerCase().trim();
            if (normalizedEmail !== user.email) {
                const emailExists = await prisma_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
                if (emailExists) {
                    res.status(409).json({ success: false, error: 'Email is already in use by another user' });
                    return;
                }
            }
            dataToUpdate.email = normalizedEmail;
        }
        if (password) {
            dataToUpdate.password = await bcryptjs_1.default.hash(password, 10);
        }
        if (firstName !== undefined)
            dataToUpdate.firstName = firstName;
        if (lastName !== undefined)
            dataToUpdate.lastName = lastName;
        if (phone !== undefined)
            dataToUpdate.phone = phone;
        if (role !== undefined)
            dataToUpdate.role = role;
        if (isActive !== undefined)
            dataToUpdate.isActive = isActive;
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: userSelectFields,
        });
        res.json({
            success: true,
            data: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /:id/toggle-active - Activate/Deactivate user
router.put('/:id/toggle-active', async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        // Do not allow self-deactivation
        if (user.id === req.user?.id) {
            res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
            return;
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
            select: userSelectFields,
        });
        res.json({
            success: true,
            data: updatedUser,
            message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
