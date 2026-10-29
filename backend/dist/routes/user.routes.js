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
const userStore_1 = require("../data/userStore");
const router = (0, express_1.Router)();
// Allow ADMINISTRATOR, DIRECTOR, and SALES_HEAD to access user routes
router.use(auth_1.verifyToken, (0, auth_1.requireRole)('ADMINISTRATOR', 'DIRECTOR', 'SALES_HEAD'));
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
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').optional().or(zod_1.z.literal('')),
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
router.get('/', async (req, res, _next) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search?.toLowerCase();
    const role = req.query.role;
    const isActiveParam = req.query.isActive;
    try {
        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role && Object.values(client_1.Role).includes(role))
            where.role = role;
        if (isActiveParam !== undefined)
            where.isActive = isActiveParam === 'true';
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
    catch {
        // In-memory fallback
        let filtered = userStore_1.userStore.getAll();
        if (search) {
            filtered = filtered.filter((u) => u.firstName.toLowerCase().includes(search) ||
                u.lastName.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search) ||
                (u.phone && u.phone.includes(search)));
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
router.get('/:id', async (req, res, _next) => {
    const { id } = req.params;
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            select: userSelectFields,
        });
        if (user) {
            res.json({ success: true, data: user });
            return;
        }
    }
    catch {
        // fallback check
    }
    const memUser = userStore_1.userStore.getById(id);
    if (memUser) {
        res.json({ success: true, data: memUser });
        return;
    }
    res.status(404).json({ success: false, error: 'User not found' });
});
// POST / - Create user (Admin only)
router.post('/', (0, auth_1.requireRole)('ADMINISTRATOR'), (0, validate_1.validate)(createUserSchema), async (req, res, _next) => {
    const { email, password, firstName, lastName, phone, role, isActive } = req.body;
    const normEmail = email.toLowerCase().trim();
    try {
        const existing = await prisma_1.prisma.user.findUnique({
            where: { email: normEmail },
        });
        if (existing) {
            res.status(409).json({ success: false, error: 'A user with this email already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
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
            userStore_1.userStore.create({
                email: normEmail,
                passwordPlain: password,
                firstName,
                lastName,
                phone: phone || null,
                role,
                isActive: isActive !== undefined ? isActive : true,
            });
        }
        catch {
            // already exists in store
        }
        res.status(201).json({
            success: true,
            data: user,
        });
    }
    catch {
        // In-memory fallback
        try {
            const newUser = userStore_1.userStore.create({
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
        }
        catch (err) {
            res.status(409).json({ success: false, error: err.message || 'User already exists' });
        }
    }
});
// PUT /:id - Update user (Admin only)
router.put('/:id', (0, auth_1.requireRole)('ADMINISTRATOR'), (0, validate_1.validate)(updateUserSchema), async (req, res, _next) => {
    const { id } = req.params;
    const { email, password, firstName, lastName, phone, role, isActive } = req.body;
    // Prevent administrators from changing their own role
    if (req.user?.id === id && role && role !== req.user.role) {
        res.status(400).json({ success: false, error: 'Administrators cannot alter their own system role' });
        return;
    }
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (user) {
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
            if (password && password.trim().length >= 6) {
                dataToUpdate.password = await bcryptjs_1.default.hash(password.trim(), 10);
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
            userStore_1.userStore.update(id, {
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
    }
    catch {
        // fallback
    }
    const updated = userStore_1.userStore.update(id, {
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
});
// Toggle active/status handler
const handleToggleActive = async (req, res, _next) => {
    const { id } = req.params;
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (user) {
            if (user.id === req.user?.id) {
                res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
                return;
            }
            const updatedUser = await prisma_1.prisma.user.update({
                where: { id },
                data: { isActive: !user.isActive },
                select: userSelectFields,
            });
            userStore_1.userStore.toggleActive(id);
            res.json({
                success: true,
                data: updatedUser,
                message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
            });
            return;
        }
    }
    catch {
        // fallback check
    }
    const toggled = userStore_1.userStore.toggleActive(id);
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
router.put('/:id/toggle-active', (0, auth_1.requireRole)('ADMINISTRATOR'), handleToggleActive);
router.put('/:id/toggle-status', (0, auth_1.requireRole)('ADMINISTRATOR'), handleToggleActive);
// DELETE /:id - Permanently delete user (Admin only)
router.delete('/:id', (0, auth_1.requireRole)('ADMINISTRATOR'), async (req, res, next) => {
    try {
        const { id } = req.params;
        if (req.user?.id === id) {
            res.status(400).json({ success: false, error: 'Cannot delete your own account' });
            return;
        }
        try {
            const user = await prisma_1.prisma.user.findUnique({ where: { id } });
            if (user) {
                // Find administrator to reassign non-nullable user foreign keys (e.g. Quotations, Leads created)
                const fallbackAdmin = await prisma_1.prisma.user.findFirst({
                    where: { role: 'ADMINISTRATOR', id: { not: id } },
                });
                const reassignUserId = req.user?.id && req.user.id !== id ? req.user.id : fallbackAdmin?.id;
                const transactionOperations = [
                    prisma_1.prisma.lead.updateMany({ where: { accountOwnerId: id }, data: { accountOwnerId: null } }),
                    prisma_1.prisma.customer.updateMany({ where: { accountOwnerId: id }, data: { accountOwnerId: null } }),
                    prisma_1.prisma.customerVisit.deleteMany({ where: { userId: id } }),
                    prisma_1.prisma.followUp.deleteMany({ where: { userId: id } }),
                    prisma_1.prisma.salesTarget.deleteMany({ where: { userId: id } }),
                    prisma_1.prisma.notification.deleteMany({ where: { userId: id } }),
                    prisma_1.prisma.leadActivity.deleteMany({ where: { userId: id } }),
                    prisma_1.prisma.leadAssignment.deleteMany({ where: { userId: id } }),
                    prisma_1.prisma.auditLog.updateMany({ where: { userId: id }, data: { userId: null } }),
                ];
                if (reassignUserId) {
                    transactionOperations.push(prisma_1.prisma.lead.updateMany({ where: { createdById: id }, data: { createdById: reassignUserId } }), prisma_1.prisma.quotation.updateMany({ where: { userId: id }, data: { userId: reassignUserId } }));
                }
                transactionOperations.push(prisma_1.prisma.user.delete({ where: { id } }));
                await prisma_1.prisma.$transaction(transactionOperations);
                userStore_1.userStore.delete(id);
                res.json({
                    success: true,
                    message: `User ${user.firstName} ${user.lastName} has been permanently deleted.`,
                });
                return;
            }
        }
        catch (dbErr) {
            console.error('DB delete error:', dbErr);
            res.status(500).json({
                success: false,
                error: dbErr?.message || 'Failed to permanently delete user from database.',
            });
            return;
        }
        const memDeleted = userStore_1.userStore.delete(id);
        if (memDeleted) {
            res.json({ success: true, message: 'User permanently deleted.' });
            return;
        }
        res.status(404).json({ success: false, error: 'User not found' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
