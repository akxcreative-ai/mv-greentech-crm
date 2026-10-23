"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.verifyToken);
// PUT /read-all - Mark all notifications as read for current user (Must be before /:id)
router.put('/read-all', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await prisma_1.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        res.json({
            success: true,
            message: 'All notifications marked as read',
            data: { count: result.count },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET / - List notifications for current user
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(500, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const isReadParam = req.query.isRead;
        const where = { userId };
        if (isReadParam !== undefined) {
            where.isRead = isReadParam === 'true';
        }
        const [total, unreadCount, notifications] = await Promise.all([
            prisma_1.prisma.notification.count({ where }),
            prisma_1.prisma.notification.count({ where: { userId, isRead: false } }),
            prisma_1.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        res.json({
            success: true,
            data: notifications,
            unreadCount,
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
// PUT /:id/read - Mark single notification as read
router.put('/:id/read', async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notification = await prisma_1.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification) {
            res.status(404).json({ success: false, error: 'Notification not found' });
            return;
        }
        if (notification.userId !== userId && req.user?.role !== 'ADMINISTRATOR') {
            res.status(403).json({ success: false, error: 'Not authorized to modify this notification' });
            return;
        }
        const updated = await prisma_1.prisma.notification.update({
            where: { id },
            data: { isRead: true },
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
