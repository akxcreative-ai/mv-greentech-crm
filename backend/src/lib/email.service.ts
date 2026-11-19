import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
  }>;
}

// Helper to get active transporter (checks Database settings first, falls back to env/defaults)
export async function getEmailTransporter() {
  let host = process.env.SMTP_HOST || 'smtpout.secureserver.net';
  let port = parseInt(process.env.SMTP_PORT || '465', 10);
  let secure = port === 465;
  let user = process.env.SMTP_USER || 'sales@mvgreentechcrm.in';
  let pass = process.env.SMTP_PASS || 'Mvg@783844';
  let fromName = process.env.SMTP_FROM_NAME || 'MV GREENTECH PVT LTD';

  try {
    const smtpSetting = await prisma.setting.findUnique({
      where: { key: 'smtp_settings' },
    });
    if (smtpSetting?.value) {
      const val = smtpSetting.value as any;
      if (val.host) host = val.host;
      if (val.port) {
        port = parseInt(val.port, 10);
        secure = port === 465;
      }
      if (val.user) user = val.user;
      if (val.pass) pass = val.pass;
      if (val.fromName) fromName = val.fromName;
    }
  } catch (err) {
    console.error('Error fetching dynamic SMTP settings:', err);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    name: 'mvgreentechcrm.in',
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  return {
    transporter,
    senderEmail: user,
    fromName,
  };
}

export async function sendEmail(options: SendEmailOptions) {
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

export async function testSmtpConnection() {
  const { transporter, senderEmail } = await getEmailTransporter();
  await transporter.verify();
  return { success: true, email: senderEmail };
}
