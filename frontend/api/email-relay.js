import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, text, attachments } = req.body || {};

    if (!to) {
      return res.status(400).json({ success: false, error: 'Recipient email is required' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      name: 'mvgreentechcrm.in',
      auth: {
        user: 'sales@mvgreentechcrm.in',
        pass: 'Mvg@783844',
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    const info = await transporter.sendMail({
      from: '"MV GREENTECH PVT LTD" <sales@mvgreentechcrm.in>',
      to,
      subject: subject || 'Message from MV GREENTECH CRM',
      text: text || '',
      html: html || text || '',
      attachments: attachments || [],
    });

    return res.status(200).json({
      success: true,
      message: `Email successfully delivered to ${to}`,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error('Vercel SMTP Relay Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send email via SMTP relay',
    });
  }
}
