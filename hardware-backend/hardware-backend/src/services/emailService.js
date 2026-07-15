import { transporter } from '../config/email.js';
import { env } from '../config/env.js';

async function send({ to, subject, html }) {
  if (!env.mail.host) {
    // eslint-disable-next-line no-console
    console.log(`[emailService] SMTP not configured. Would send to ${to}: "${subject}"`);
    return { skipped: true };
  }
  return transporter.sendMail({
    from: `"${env.mail.fromName}" <${env.mail.user}>`,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(to, token) {
  const link = `${env.frontendUrl}/verify-email/${token}`;
  return send({
    to,
    subject: 'Verify your Hardware IMS account',
    html: `<p>Welcome! Please verify your email by clicking <a href="${link}">this link</a>.</p>`,
  });
}

export async function sendPasswordResetEmail(to, token) {
  const link = `${env.frontendUrl}/reset-password?token=${token}`;
  return send({
    to,
    subject: 'Reset your Hardware IMS password',
    html: `<p>Click <a href="${link}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
  });
}

export async function sendCreditReminderEmail(to, { customerName, dueAmount }) {
  return send({
    to,
    subject: 'Payment reminder',
    html: `<p>Dear ${customerName}, this is a reminder that you have an outstanding balance of ${dueAmount}. Please arrange payment at your earliest convenience.</p>`,
  });
}

export async function sendLowStockAlertEmail(to, products) {
  const rows = products.map((p) => `<li>${p.name} (SKU: ${p.sku}) — ${p.currentStock} left</li>`).join('');
  return send({
    to,
    subject: `Low stock alert: ${products.length} product(s) need reordering`,
    html: `<p>The following products are at or below their reorder level:</p><ul>${rows}</ul>`,
  });
}
