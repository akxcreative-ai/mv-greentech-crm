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

export async function sendEmail(options: SendEmailOptions) {
  // First attempt: Call our dedicated Vercel Serverless Relay over HTTPS
  // Since cloud hosts (Render) block raw SMTP ports 25/465/587, HTTPS port 443 never gets blocked!
  try {
    const relayResponse = await fetch('https://mvgreentechcrm.in/api/email-relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      }),
    });

    if (relayResponse.ok) {
      const data = await relayResponse.json();
      return data;
    }
  } catch (relayErr: any) {
    console.warn('[Email] Vercel HTTPS relay attempt returned error:', relayErr.message, '. Falling back to direct SMTP...');
  }

  // Fallback attempt: Direct SMTP via Nodemailer
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    name: 'mvgreentechcrm.in',
    auth: {
      user: process.env.SMTP_USER || 'sales@mvgreentechcrm.in',
      pass: process.env.SMTP_PASS || 'Mvg@783844',
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
  });

  const info = await transporter.sendMail({
    from: '"MV GREENTECH PVT LTD" <sales@mvgreentechcrm.in>',
    to: options.to,
    cc: options.cc,
    replyTo: options.replyTo || 'sales@mvgreentechcrm.in',
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });

  return info;
}

export async function testSmtpConnection() {
  return sendEmail({
    to: 'sales@mvgreentechcrm.in',
    subject: 'SMTP Connection Test',
    text: 'Test message',
  });
}
