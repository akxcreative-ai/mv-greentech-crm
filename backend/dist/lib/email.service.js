"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailTransporter = getEmailTransporter;
exports.sendEmail = sendEmail;
exports.testSmtpConnection = testSmtpConnection;
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma_1 = require("./prisma");
// Helper to get active transporter (checks Database settings first, falls back to env/defaults)
async function getEmailTransporter() {
    let host = process.env.SMTP_HOST || 'smtpout.secureserver.net';
    let port = parseInt(process.env.SMTP_PORT || '465', 10);
    let secure = port === 465;
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
            if (val.port) {
                port = parseInt(val.port, 10);
                secure = port === 465;
            }
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
    const transporter = nodemailer_1.default.createTransport({
        host,
        port,
        secure,
        name: 'mvgreentechcrm.in',
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
    });
    return {
        transporter,
        senderEmail: user,
        fromName,
    };
}
async function sendEmail(options) {
    const { transporter, senderEmail, fromName } = await getEmailTransporter();
    const info = await transporter.sendMail({
        from: `"${fromName}" <${senderEmail}>`,
        to: options.to,
        cc: options.cc,
        replyTo: options.replyTo || senderEmail,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
    });
    return info;
}
async function testSmtpConnection() {
    const { transporter, senderEmail } = await getEmailTransporter();
    await transporter.verify();
    return { success: true, email: senderEmail };
}
