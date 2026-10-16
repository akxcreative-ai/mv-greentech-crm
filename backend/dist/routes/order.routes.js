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
const orderStatusEnum = zod_1.z.enum([
    'CONFIRMED',
    'IN_PRODUCTION',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
]);
const updateOrderStatusSchema = zod_1.z.object({
    status: orderStatusEnum,
    notes: zod_1.z.string().optional().nullable(),
});
// GET / - List orders with filters & pagination
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const { status, customerId, leadId, quotationId, fromDate, toDate, search } = req.query;
        const where = {};
        if (status && Object.values(client_1.OrderStatus).includes(status)) {
            where.status = status;
        }
        if (customerId) {
            where.customerId = customerId;
        }
        if (leadId) {
            where.leadId = leadId;
        }
        if (quotationId) {
            where.quotationId = quotationId;
        }
        if (fromDate || toDate) {
            where.orderDate = {};
            if (fromDate)
                where.orderDate.gte = new Date(fromDate);
            if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                where.orderDate.lte = to;
            }
        }
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [total, orders] = await Promise.all([
            prisma_1.prisma.order.count({ where }),
            prisma_1.prisma.order.findMany({
                where,
                include: {
                    customer: { select: { id: true, name: true, city: true } },
                    quotation: { select: { id: true, quotationNumber: true } },
                    lead: { select: { id: true, leadNumber: true, customerName: true } },
                    _count: { select: { items: true } },
                },
                skip,
                take: limit,
                orderBy: { orderDate: 'desc' },
            }),
        ]);
        res.json({
            success: true,
            data: orders,
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
// GET /:id - Get order by ID with items
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await prisma_1.prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                quotation: true,
                lead: {
                    select: {
                        id: true,
                        leadNumber: true,
                        customerName: true,
                        accountOwner: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
                items: {
                    include: {
                        item: { select: { id: true, itemCode: true, description: true } },
                    },
                },
            },
        });
        if (!order) {
            res.status(404).json({ success: false, error: 'Order not found' });
            return;
        }
        res.json({
            success: true,
            data: order,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /:id/status - Update order status
router.put('/:id/status', (0, validate_1.validate)(updateOrderStatusSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const order = await prisma_1.prisma.order.findUnique({ where: { id } });
        if (!order) {
            res.status(404).json({ success: false, error: 'Order not found' });
            return;
        }
        const updated = await prisma_1.prisma.order.update({
            where: { id },
            data: {
                status,
                notes: notes !== undefined ? notes : order.notes,
            },
            include: {
                customer: true,
                items: true,
            },
        });
        // If associated with a lead, log activity
        if (order.leadId) {
            await prisma_1.prisma.leadActivity.create({
                data: {
                    leadId: order.leadId,
                    userId: req.user.id,
                    type: 'ORDER_STATUS_CHANGE',
                    description: `Order ${order.orderNumber} status changed from ${order.status} to ${status}`,
                    metadata: { orderId: order.id, oldStatus: order.status, newStatus: status, notes },
                },
            });
        }
        res.json({
            success: true,
            data: updated,
            message: `Order status updated to ${status}`,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
