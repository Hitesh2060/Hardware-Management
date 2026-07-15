import nodemailer from 'nodemailer';
import { env } from './env.js';

/**
 * Shared SMTP transporter. In local dev without SMTP credentials configured,
 * emailService.js should catch send failures and log instead of crashing —
 * password reset/verification tokens are still returned in the API response
 * during development (see authService.js comments) so flows are testable
 * without a live mail server.
 */
export const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: env.mail.port === 465,
  auth: env.mail.user ? { user: env.mail.user, pass: env.mail.pass } : undefined,
});

export async function verifyMailConnection() {
  if (!env.mail.host) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  SMTP not configured — emails will be logged, not sent.');
    return;
  }
  try {
    await transporter.verify();
    // eslint-disable-next-line no-console
    console.log('✅ SMTP connection verified');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  SMTP verification failed:', err.message);
  }
}
