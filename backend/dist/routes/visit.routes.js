"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.verifyToken);
const createVisitSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional().nullable(),
    leadId: zod_1.z.string().optional().nullable(),
    userId: zod_1.z.string().optional(),
    visitDate: zod_1.z.string().or(zod_1.z.date()),
    purpose: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    outcome: zod_1.z.string().optional().nullable(),
    nextAction: zod_1.z.string().optional().nullable(),
});
const updateVisitSchema = createVisitSchema.partial();
// GET / - List visits with filters & pagination
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const { userId, customerId, leadId, fromDate, toDate } = req.query;
        const where = {};
        if (req.user?.role === 'SALESPERSON') {
            where.userId = req.user.id;
        }
        else if (userId) {
            where.userId = userId;
        }
        if (customerId) {
            where.customerId = customerId;
        }
        if (leadId) {
            where.leadId = leadId;
        }
        if (fromDate || toDate) {
            where.visitDate = {};
            if (fromDate)
                where.visitDate.gte = new Date(fromDate);
            if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                where.visitDate.lte = to;
            }
        }
        const [total, visits] = await Promise.all([
            prisma_1.prisma.customerVisit.count({ where }),
            prisma_1.prisma.customerVisit.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
                skip,
                take: limit,
                orderBy: { visitDate: 'desc' },
            }),
        ]);
        res.json({
            success: true,
            data: visits,
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
// GET /:id - Get single visit
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const visit = await prisma_1.prisma.customerVisit.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
        if (!visit) {
            res.status(404).json({ success: false, error: 'Customer visit not found' });
            return;
        }
        if (req.user?.role === 'SALESPERSON' && visit.userId !== req.user.id) {
            res.status(403).json({ success: false, error: 'Access forbidden: You cannot view visits of other users' });
            return;
        }
        res.json({
            success: true,
            data: visit,
        });
    }
    catch (error) {
        next(error);
    }
});
// POST / - Create visit
router.post('/', (0, validate_1.validate)(createVisitSchema), async (req, res, next) => {
    try {
        const { customerId, leadId, userId, visitDate, purpose, notes, outcome, nextAction } = req.body;
        const targetUserId = req.user?.role === 'SALESPERSON' ? req.user.id : (userId || req.user.id);
        const parsedVisitDate = new Date(visitDate);
        const visit = await prisma_1.prisma.customerVisit.create({
            data: {
                customerId: customerId || null,
                leadId: leadId || null,
                userId: targetUserId,
                visitDate: parsedVisitDate,
                purpose: purpose || null,
                notes: notes || null,
                outcome: outcome || null,
                nextAction: nextAction || null,
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        // Update lead customerVisitDate and log activity if leadId is linked
        if (leadId) {
            await prisma_1.prisma.lead.update({
                where: { id: leadId },
                data: {
                    customerVisitDate: parsedVisitDate,
                    nextAction: nextAction || undefined,
                },
            });
            await prisma_1.prisma.leadActivity.create({
                data: {
                    leadId,
                    userId: req.user.id,
                    type: 'VISIT',
                    description: `Customer visit conducted. Purpose: ${purpose || 'General'}. Outcome: ${outcome || 'N/A'}`,
                    metadata: { visitId: visit.id, notes, outcome, nextAction },
                },
            });
        }
        res.status(201).json({
            success: true,
            data: visit,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /:id - Update visit
router.put('/:id', (0, validate_1.validate)(updateVisitSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { visitDate, ...rest } = req.body;
        const existing = await prisma_1.prisma.customerVisit.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, error: 'Customer visit not found' });
            return;
        }
        if (req.user?.role === 'SALESPERSON' && existing.userId !== req.user.id) {
            res.status(403).json({ success: false, error: 'Access forbidden: You cannot update visits of other users' });
            return;
        }
        const dataToUpdate = { ...rest };
        if (visitDate) {
            dataToUpdate.visitDate = new Date(visitDate);
        }
        const updated = await prisma_1.prisma.customerVisit.update({
            where: { id },
            data: dataToUpdate,
            include: {
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
