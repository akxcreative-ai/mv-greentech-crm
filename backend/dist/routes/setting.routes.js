"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const email_service_1 = require("../lib/email.service");
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
// POST /test-email - Test SMTP configuration
router.post('/test-email', (0, auth_1.requireRole)('ADMINISTRATOR', 'DIRECTOR', 'SALES_HEAD'), async (req, res) => {
    try {
        const { recipientEmail } = req.body;
        const target = (recipientEmail || req.user.email || '').trim();
        if (!target || !target.includes('@') || !target.includes('.')) {
            res.status(400).json({
                success: false,
                error: 'Please enter a valid email address (e.g. yourname@gmail.com).',
            });
            return;
        }
        await (0, email_service_1.sendEmail)({
            to: target,
            subject: 'MV GREENTECH CRM - Test Email Verification',
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; border-bottom: 2px solid #0f4c3a; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #0f4c3a; margin: 0;">MV GREENTECH PVT LTD</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Industrial Sensors & Automation ERP</p>
            </div>
            <p style="font-size: 15px; color: #1e293b;">Hello,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              This is a test email sent directly from your <strong>MV GREENTECH CRM</strong> via official GoDaddy SMTP: <strong>sales@mvgreentechcrm.in</strong>.
            </p>
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46; font-size: 13px; font-weight: bold;">✔ Status: SMTP Connection Active &amp; Verified</p>
              <p style="margin: 4px 0 0 0; color: #047857; font-size: 12px;">Sent on: ${new Date().toLocaleString('en-IN')}</p>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
              MV GREENTECH PVT LTD • All Rights Reserved
            </p>
          </div>
        `,
        });
        res.json({
            success: true,
            message: `Test email successfully sent to ${target}`,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send test email',
        });
    }
});
exports.default = router;
