"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailConfig = getEmailConfig;
exports.sendEmail = sendEmail;
exports.testSmtpConnection = testSmtpConnection;
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma_1 = require("./prisma");
// Helper to get active transporter settings
async function getEmailConfig() {
    let host = process.env.SMTP_HOST || 'smtpout.secureserver.net';
    let port = parseInt(process.env.SMTP_PORT || '587', 10);
    let user = process.env.SMTP_USER || 'sales@mvgreentechcrm.in';
    let pass = process.env.SMTP_PASS || 'Mvg@783844';
    let fromName = process.env.SMTP_FROM_NAME || 'MV GREENTECH PVT LTD';
    try {
        const smtpSetting = await prisma_1.prisma.setting.findUnique({
            where: { key: 'smtp_settings' },
        });
        if (smtpSetting?.value) {
            const val = smtpSetting.value;
            if (val.host)
                host = val.host;
            if (val.port)
                port = parseInt(val.port, 10);
            if (val.user)
                user = val.user;
            if (val.pass)
                pass = val.pass;
            if (val.fromName)
                fromName = val.fromName;
        }
    }
    catch (err) {
        console.error('Error fetching dynamic SMTP settings:', err);
    }
    return { host, port, user, pass, fromName };
}
function createTransporterForPort(host, port, user, pass) {
    const secure = port === 465;
    return nodemailer_1.default.createTransport({
        host,
        port,
        secure,
        name: 'mvgreentechcrm.in',
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
}
async function sendEmail(options) {
    const cfg = await getEmailConfig();
    // Try standard cloud port 587 first, then fallback to 80, 3535, or 465
    const candidatePorts = [cfg.port, 587, 80, 3535, 465].filter((p, i, arr) => arr.indexOf(p) === i);
    let lastError = null;
    for (const port of candidatePorts) {
        try {
            const transporter = createTransporterForPort(cfg.host, port, cfg.user, cfg.pass);
            const info = await transporter.sendMail({
                from: `"${cfg.fromName}" <${cfg.user}>`,
                to: options.to,
                cc: options.cc,
                replyTo: options.replyTo || cfg.user,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments,
            });
            return info;
        }
        catch (err) {
            lastError = err;
            console.warn(`[SMTP] Delivery attempt on port ${port} failed: ${err.message}. Trying next port...`);
        }
    }
    throw lastError || new Error('Failed to deliver email through all configured SMTP ports.');
}
async function testSmtpConnection() {
    const cfg = await getEmailConfig();
    const candidatePorts = [cfg.port, 587, 80, 3535, 465].filter((p, i, arr) => arr.indexOf(p) === i);
    let lastError = null;
    for (const port of candidatePorts) {
        try {
            const transporter = createTransporterForPort(cfg.host, port, cfg.user, cfg.pass);
            await transporter.verify();
            return { success: true, email: cfg.user, workingPort: port };
        }
        catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error('Connection failed on all SMTP ports.');
}
