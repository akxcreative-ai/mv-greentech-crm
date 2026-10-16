"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.verifyToken);
const followUpStatusEnum = zod_1.z.enum(['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED']);
const createFollowUpSchema = zod_1.z.object({
    leadId: zod_1.z.string().optional().nullable(),
    customerId: zod_1.z.string().optional().nullable(),
    userId: zod_1.z.string().optional(),
    type: zod_1.z.string().min(1, 'Follow-up type is required'), // CALL, EMAIL, VISIT, MEETING
    scheduledDate: zod_1.z.string().or(zod_1.z.date()),
    notes: zod_1.z.string().optional().nullable(),
    nextAction: zod_1.z.string().optional().nullable(),
});
const updateFollowUpSchema = zod_1.z.object({
    leadId: zod_1.z.string().optional().nullable(),
    customerId: zod_1.z.string().optional().nullable(),
    userId: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    scheduledDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    completedDate: zod_1.z.string().or(zod_1.z.date()).optional().nullable(),
    status: followUpStatusEnum.optional(),
    notes: zod_1.z.string().optional().nullable(),
    nextAction: zod_1.z.string().optional().nullable(),
});
const completeFollowUpSchema = zod_1.z.object({
    notes: zod_1.z.string().optional().nullable(),
    nextAction: zod_1.z.string().optional().nullable(),
    completedDate: zod_1.z.string().or(zod_1.z.date()).optional(),
});
// GET /today - Today's follow-ups for current user (Must be before /:id)
router.get('/today', async (req, res, next) => {
    try {
        const userId = req.user?.role === 'SALESPERSON' ? req.user.id : (req.query.userId || req.user.id);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const followUps = await prisma_1.prisma.followUp.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
// GET /overdue - Overdue follow-ups (Must be before /:id)
router.get('/overdue', async (req, res, next) => {
    try {
        const userId = req.query.userId;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const where = {
            scheduledDate: { lt: startOfDay },
            status: { in: ['PENDING', 'OVERDUE'] },
        };
        if (req.user?.role === 'SALESPERSON') {
            where.userId = req.user.id;
        }
        else if (userId) {
            where.userId = userId;
        }
        const followUps = await prisma_1.prisma.followUp.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
// GET / - List follow-ups with filters & pagination
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const { status, type, userId, leadId, customerId, fromDate, toDate } = req.query;
        const where = {};
        if (status && Object.values(client_1.FollowUpStatus).includes(status)) {
            where.status = status;
        }
        if (type) {
            where.type = { contains: type, mode: 'insensitive' };
        }
        if (req.user?.role === 'SALESPERSON') {
            where.userId = req.user.id;
        }
        else if (userId) {
            where.userId = userId;
        }
        if (leadId) {
            where.leadId = leadId;
        }
        if (customerId) {
            where.customerId = customerId;
        }
        if (fromDate || toDate) {
            where.scheduledDate = {};
            if (fromDate)
                where.scheduledDate.gte = new Date(fromDate);
            if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                where.scheduledDate.lte = to;
            }
        }
        const [total, followUps] = await Promise.all([
            prisma_1.prisma.followUp.count({ where }),
            prisma_1.prisma.followUp.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
// POST / - Create follow-up
router.post('/', (0, validate_1.validate)(createFollowUpSchema), async (req, res, next) => {
    try {
        const { leadId, customerId, userId, type, scheduledDate, notes, nextAction } = req.body;
        const targetUserId = req.user?.role === 'SALESPERSON' ? req.user.id : (userId || req.user.id);
        const followUp = await prisma_1.prisma.followUp.create({
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
            await prisma_1.prisma.lead.update({
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
    }
    catch (error) {
        next(error);
    }
});
// PUT /:id/complete - Mark follow-up as completed
router.put('/:id/complete', (0, validate_1.validate)(completeFollowUpSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { notes, nextAction, completedDate } = req.body;
        const followUp = await prisma_1.prisma.followUp.findUnique({ where: { id } });
        if (!followUp) {
            res.status(404).json({ success: false, error: 'Follow-up not found' });
            return;
        }
        if (req.user?.role === 'SALESPERSON' && followUp.userId !== req.user.id) {
            res.status(403).json({ success: false, error: 'Access forbidden: You cannot complete follow-ups of other users' });
            return;
        }
        const updated = await prisma_1.prisma.followUp.update({
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
            await prisma_1.prisma.leadActivity.create({
                data: {
                    leadId: updated.leadId,
                    userId: req.user.id,
                    type: 'FOLLOW_UP_COMPLETED',
                    description: `Follow-up (${updated.type}) completed. Notes: ${notes || 'None'}`,
                    metadata: { followUpId: updated.id, nextAction },
                },
            });
            if (nextAction) {
                await prisma_1.prisma.lead.update({
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
    }
    catch (error) {
        next(error);
    }
});
// PUT /:id - Update follow-up
router.put('/:id', (0, validate_1.validate)(updateFollowUpSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { scheduledDate, completedDate, ...rest } = req.body;
        const existing = await prisma_1.prisma.followUp.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, error: 'Follow-up not found' });
            return;
        }
        if (req.user?.role === 'SALESPERSON' && existing.userId !== req.user.id) {
            res.status(403).json({ success: false, error: 'Access forbidden: You cannot update follow-ups of other users' });
            return;
        }
        const dataToUpdate = { ...rest };
        if (scheduledDate)
            dataToUpdate.scheduledDate = new Date(scheduledDate);
        if (completedDate !== undefined) {
            dataToUpdate.completedDate = completedDate ? new Date(completedDate) : null;
        }
        const updated = await prisma_1.prisma.followUp.update({
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
