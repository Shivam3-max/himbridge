import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { BRAND } from '@/config/brand';
import { env } from '@/config/env';
import { db } from './db/client';
import { emailOutbox } from './db/schema';

let transporter: Transporter | null | undefined;
const getTransporter = () => {
  if (transporter === undefined) transporter = env.SMTP_URL ? nodemailer.createTransport(env.SMTP_URL) : null;
  return transporter;
};

/**
 * Sends an email and records it in the outbox (Admin → Email outbox).
 * Without SMTP_URL the message is only recorded and logged — handy in development.
 */
export async function sendMail(to: string, subject: string, body: string) {
  const smtp = getTransporter();
  let status: 'logged' | 'sent' | 'failed' = 'logged';
  let error: string | null = null;
  if (smtp) {
    try {
      await smtp.sendMail({ from: env.MAIL_FROM, to, subject, text: body });
      status = 'sent';
    } catch (e) {
      status = 'failed';
      error = e instanceof Error ? e.message : String(e);
      console.error(`[mail] failed to send to ${to}:`, error);
    }
  } else {
    console.info(`[mail] (no SMTP configured) to ${to}: ${subject}`);
  }
  await db.insert(emailOutbox).values({ toEmail: to, subject, body, status, error });
}

export const mailTemplates = {
  verifyEmail: (name: string, url: string) => ({
    subject: `Confirm your ${BRAND.name} email address`,
    body: `Hello ${name},\n\nPlease confirm your email address to activate all ${BRAND.name} features:\n${url}\n\nThis link is valid for 48 hours.\n\n— ${BRAND.full}`,
  }),
  resetPassword: (name: string, url: string) => ({
    subject: `Reset your ${BRAND.name} password`,
    body: `Hello ${name},\n\nWe received a request to reset your password. Choose a new one here:\n${url}\n\nThis link is valid for 1 hour. If you did not ask for this, you can ignore this email.\n\n— ${BRAND.full}`,
  }),
};
