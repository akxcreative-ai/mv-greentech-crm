"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// Settings are accessible to all authenticated team members
router.use(auth_1.verifyToken);
const updateSettingSchema = zod_1.z.object({
    value: zod_1.z.any(),
});
// GET / - List all settings
router.get('/', async (_req, res, next) => {
    try {
        const settings = await prisma_1.prisma.setting.findMany({
            orderBy: { key: 'asc' },
        });
        // Also format as key-value map for convenience
        const settingsMap = {};
        settings.forEach((s) => {
            settingsMap[s.key] = s.value;
        });
        res.json({
            success: true,
            data: settings,
            settings: settingsMap,
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /:key - Get single setting
router.get('/:key', async (req, res, next) => {
    try {
        const { key } = req.params;
        const setting = await prisma_1.prisma.setting.findUnique({
            where: { key },
        });
        if (!setting) {
            res.status(404).json({ success: false, error: `Setting '${key}' not found` });
            return;
        }
        res.json({
            success: true,
            data: setting,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /:key - Upsert setting (Administrator & Director only)
router.put('/:key', (0, auth_1.requireRole)('ADMINISTRATOR', 'DIRECTOR'), (0, validate_1.validate)(updateSettingSchema), async (req, res, next) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const setting = await prisma_1.prisma.setting.upsert({
            where: { key },
            create: {
                key,
                value,
            },
            update: {
                value,
            },
        });
        res.json({
            success: true,
            data: setting,
            message: `Setting '${key}' updated successfully`,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
