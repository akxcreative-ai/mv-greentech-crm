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

// Helper to get active transporter settings
export async function getEmailConfig() {
  let host = process.env.SMTP_HOST || 'smtpout.secureserver.net';
  let port = parseInt(process.env.SMTP_PORT || '587', 10);
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
      if (val.port) port = parseInt(val.port, 10);
      if (val.user) user = val.user;
      if (val.pass) pass = val.pass;
      if (val.fromName) fromName = val.fromName;
    }
  } catch (err) {
    console.error('Error fetching dynamic SMTP settings:', err);
  }

  return { host, port, user, pass, fromName };
}

function createTransporterForPort(host: string, port: number, user: string, pass: string) {
  const secure = port === 465;
  return nodemailer.createTransport({
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

export async function sendEmail(options: SendEmailOptions) {
  const cfg = await getEmailConfig();

  // Try standard cloud port 587 first, then fallback to 80, 3535, or 465
  const candidatePorts = [cfg.port, 587, 80, 3535, 465].filter(
    (p, i, arr) => arr.indexOf(p) === i
  );

  let lastError: any = null;

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
    } catch (err: any) {
      lastError = err;
      console.warn(`[SMTP] Delivery attempt on port ${port} failed: ${err.message}. Trying next port...`);
    }
  }

  throw lastError || new Error('Failed to deliver email through all configured SMTP ports.');
}

export async function testSmtpConnection() {
  const cfg = await getEmailConfig();
  const candidatePorts = [cfg.port, 587, 80, 3535, 465].filter(
    (p, i, arr) => arr.indexOf(p) === i
  );

  let lastError: any = null;
  for (const port of candidatePorts) {
    try {
      const transporter = createTransporterForPort(cfg.host, port, cfg.user, cfg.pass);
      await transporter.verify();
      return { success: true, email: cfg.user, workingPort: port };
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Connection failed on all SMTP ports.');
}
