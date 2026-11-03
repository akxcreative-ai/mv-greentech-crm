"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.verifyToken);
const pingSchema = zod_1.z.object({
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    accuracy: zod_1.z.number().optional().nullable(),
    heading: zod_1.z.number().optional().nullable(),
    speed: zod_1.z.number().optional().nullable(),
    battery: zod_1.z.number().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    isTrackingActive: zod_1.z.boolean().optional(),
});
// POST /v1/tracking/ping - Salesperson phone sends GPS update
router.post('/ping', (0, validate_1.validate)(pingSchema), async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { latitude, longitude, accuracy, heading, speed, battery, address, isTrackingActive } = req.body;
        const now = new Date();
        // Update current user's live position
        const [location] = await Promise.all([
            prisma_1.prisma.userLocation.create({
                data: {
                    userId,
                    latitude,
                    longitude,
                    accuracy: accuracy ?? null,
                    heading: heading ?? null,
                    speed: speed ?? null,
                    battery: battery ?? null,
                    address: address ?? null,
                    timestamp: now,
                },
            }),
            prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    lastLatitude: latitude,
                    lastLongitude: longitude,
                    lastHeading: heading ?? null,
                    lastSpeed: speed ?? null,
                    lastLocationAt: now,
                    isTrackingActive: isTrackingActive ?? true,
                },
            }),
        ]);
        res.status(200).json({
            success: true,
            message: 'Location recorded',
            data: location,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /v1/tracking/toggle - Turn tracking ON or OFF
router.post('/toggle', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { active } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { isTrackingActive: Boolean(active) },
            select: { id: true, firstName: true, lastName: true, isTrackingActive: true },
        });
        res.status(200).json({
            success: true,
            message: `Duty tracking turned ${active ? 'ON' : 'OFF'}`,
            data: user,
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /v1/tracking/live - Director/Admin gets real-time positions of all salespersons
router.get('/live', async (req, res, next) => {
    try {
        // Only Managers can view team tracking
        if (req.user?.role === 'SALESPERSON') {
            res.status(403).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const salesUsers = await prisma_1.prisma.user.findMany({
            where: {
                isActive: true,
                role: { in: ['SALESPERSON', 'SALES_HEAD'] },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                lastLogin: true,
                lastLatitude: true,
                lastLongitude: true,
                lastHeading: true,
                lastSpeed: true,
                lastLocationAt: true,
                isTrackingActive: true,
                customerVisits: {
                    take: 3,
                    orderBy: { visitDate: 'desc' },
                    select: {
                        id: true,
                        visitDate: true,
                        purpose: true,
                        outcome: true,
                        latitude: true,
                        longitude: true,
                    },
                },
            },
            orderBy: { lastName: 'asc' },
        });
        res.status(200).json({
            success: true,
            data: salesUsers,
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /v1/tracking/history/:userId - Get today's route history for polyline
router.get('/history/:userId', async (req, res, next) => {
    try {
        if (req.user?.role === 'SALESPERSON' && req.user.id !== req.params.userId) {
            res.status(403).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { userId } = req.params;
        const dateQuery = req.query.date;
        const targetDate = dateQuery ? new Date(dateQuery) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        const locations = await prisma_1.prisma.userLocation.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            orderBy: { timestamp: 'asc' },
            take: 1000,
        });
        res.status(200).json({
            success: true,
            data: locations,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
