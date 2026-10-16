"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.verifyToken);
// GET /stats - Dashboard KPI stats
router.get('/stats', async (req, res, next) => {
    try {
        const isSalesperson = req.user?.role === 'SALESPERSON';
        const userId = req.query.userId || (isSalesperson ? req.user.id : undefined);
        const leadWhere = { isArchived: false };
        const followUpWhere = {};
        const orderWhere = { status: { not: 'CANCELLED' } };
        const targetWhere = {};
        if (userId) {
            leadWhere.accountOwnerId = userId;
            followUpWhere.userId = userId;
            orderWhere.OR = [
                { lead: { accountOwnerId: userId } },
                { quotation: { userId } },
            ];
            targetWhere.userId = userId;
        }
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
        const [totalLeads, activeOpportunities, enquiryValueAgg, wonOrderValueAgg, todayFollowUps, overdueFollowUps, monthTargets, monthOrdersAgg,] = await Promise.all([
            // Total leads
            prisma_1.prisma.lead.count({ where: leadWhere }),
            // Active opportunities (GENERAL, MARKET, QUOTE_SUBMITTED)
            prisma_1.prisma.lead.count({
                where: {
                    ...leadWhere,
                    status: { in: ['GENERAL', 'MARKET', 'QUOTE_SUBMITTED'] },
                },
            }),
            // Total enquiry value for active opportunities
            prisma_1.prisma.lead.aggregate({
                where: {
                    ...leadWhere,
                    status: { in: ['GENERAL', 'MARKET', 'QUOTE_SUBMITTED'] },
                },
                _sum: { enquiryValue: true },
            }),
            // Won order value
            prisma_1.prisma.order.aggregate({
                where: orderWhere,
                _sum: { totalAmount: true },
            }),
            // Today follow ups
            prisma_1.prisma.followUp.count({
                where: {
                    ...followUpWhere,
                    scheduledDate: { gte: startOfToday, lte: endOfToday },
                    status: { not: 'CANCELLED' },
                },
            }),
            // Overdue follow ups
            prisma_1.prisma.followUp.count({
                where: {
                    ...followUpWhere,
                    scheduledDate: { lt: startOfToday },
                    status: { in: ['PENDING', 'OVERDUE'] },
                },
            }),
            // Monthly target
            prisma_1.prisma.salesTarget.findMany({
                where: {
                    ...targetWhere,
                    month: currentMonth,
                    year: currentYear,
                },
            }),
            // Monthly won orders
            prisma_1.prisma.order.aggregate({
                where: {
                    ...orderWhere,
                    orderDate: { gte: startOfMonth, lte: endOfMonth },
                },
                _sum: { totalAmount: true },
            }),
        ]);
        const monthlyTarget = monthTargets.reduce((sum, t) => sum + Number(t.targetAmount), 0);
        const currentMonthAchieved = Number(monthOrdersAgg._sum.totalAmount || 0);
        const targetAchievementRate = monthlyTarget > 0 ? (currentMonthAchieved / monthlyTarget) * 100 : 0;
        res.json({
            success: true,
            data: {
                totalLeads,
                activeOpportunities,
                totalEnquiryValue: Number(enquiryValueAgg._sum.enquiryValue || 0),
                wonOrderValue: Number(wonOrderValueAgg._sum.totalAmount || 0),
                todayFollowUps,
                overdueFollowUps,
                monthlyTarget,
                currentMonthAchieved,
                targetAchievement: Math.round(targetAchievementRate * 10) / 10,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /charts/sales-performance - 12-month sales data for chart
router.get('/charts/sales-performance', async (req, res, next) => {
    try {
        const isSalesperson = req.user?.role === 'SALESPERSON';
        const userId = req.query.userId || (isSalesperson ? req.user.id : undefined);
        const currentYear = new Date().getFullYear();
        const year = parseInt(req.query.year, 10) || currentYear;
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        const targetWhere = { year };
        const orderWhere = {
            orderDate: { gte: startOfYear, lte: endOfYear },
            status: { not: 'CANCELLED' },
        };
        if (userId) {
            targetWhere.userId = userId;
            orderWhere.OR = [
                { lead: { accountOwnerId: userId } },
                { quotation: { userId } },
            ];
        }
        const [targets, orders] = await Promise.all([
            prisma_1.prisma.salesTarget.findMany({ where: targetWhere }),
            prisma_1.prisma.order.findMany({
                where: orderWhere,
                select: { orderDate: true, totalAmount: true },
            }),
        ]);
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        const chartData = months.map((monthName, i) => {
            const monthNum = i + 1;
            const targetSum = targets
                .filter((t) => t.month === monthNum)
                .reduce((sum, t) => sum + Number(t.targetAmount), 0);
            const achievedSum = orders
                .filter((o) => new Date(o.orderDate).getMonth() + 1 === monthNum)
                .reduce((sum, o) => sum + Number(o.totalAmount), 0);
            return {
                month: monthName,
                target: Math.round(targetSum * 100) / 100,
                achieved: Math.round(achievedSum * 100) / 100,
            };
        });
        res.json({
            success: true,
            data: chartData,
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /charts/lead-status - Lead count by status
router.get('/charts/lead-status', async (req, res, next) => {
    try {
        const isSalesperson = req.user?.role === 'SALESPERSON';
        const userId = req.query.userId || (isSalesperson ? req.user.id : undefined);
        const where = { isArchived: false };
        if (userId) {
            where.accountOwnerId = userId;
        }
        const leadCounts = await prisma_1.prisma.lead.groupBy({
            by: ['status'],
            where,
            _count: {
                _all: true,
            },
            _sum: {
                enquiryValue: true,
            },
        });
        const allStatuses = Object.values(client_1.LeadStatus);
        const data = allStatuses.map((status) => {
            const found = leadCounts.find((item) => item.status === status);
            return {
                status,
                count: found ? found._count._all : 0,
                totalValue: Number(found?._sum.enquiryValue || 0),
            };
        });
        res.json({
            success: true,
            data,
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /recent-activities - Last 10 activities
router.get('/recent-activities', async (req, res, next) => {
    try {
        const isSalesperson = req.user?.role === 'SALESPERSON';
        const userId = req.query.userId || (isSalesperson ? req.user.id : undefined);
        const where = {};
        if (userId) {
            where.OR = [
                { userId },
                { lead: { accountOwnerId: userId } },
            ];
        }
        const activities = await prisma_1.prisma.leadActivity.findMany({
            where,
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
                lead: { select: { id: true, leadNumber: true, customerName: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        res.json({
            success: true,
            data: activities,
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /upcoming-follow-ups - Next 5 follow-ups
router.get('/upcoming-follow-ups', async (req, res, next) => {
    try {
        const isSalesperson = req.user?.role === 'SALESPERSON';
        const userId = req.query.userId || (isSalesperson ? req.user.id : undefined);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const where = {
            status: 'PENDING',
            scheduledDate: { gte: startOfToday },
        };
        if (userId) {
            where.userId = userId;
        }
        const followUps = await prisma_1.prisma.followUp.findMany({
            where,
            include: {
                lead: { select: { id: true, leadNumber: true, customerName: true, mobile: true, email: true } },
                user: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { scheduledDate: 'asc' },
            take: 5,
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
exports.default = router;
