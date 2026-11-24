import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { eq } from 'drizzle-orm';
import { env, isProduction } from '@/config/env';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { mailTemplates, sendMail } from '../mail';

/**
 * Authentication (Better Auth): email + password, sessions in Postgres, email verification,
 * password reset, rate limiting on sign-in and reset endpoints.
 *
 * Self-service sign-up over HTTP is disabled: registration goes through the `register` server action
 * (src/actions/auth.ts), which validates the account type and creates the vendor profile.
 */
export const auth = betterAuth({
  appName: 'Himbridge',
  baseURL: env.APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  disabledPaths: ['/sign-up/email'],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    async sendResetPassword({ user, url }) {
      const mail = mailTemplates.resetPassword(user.name, url);
      await sendMail(user.email, mail.subject, mail.body);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 60 * 60 * 48,
    async sendVerificationEmail({ user, url }) {
      const mail = mailTemplates.verifyEmail(user.name, url);
      await sendMail(user.email, mail.subject, mail.body);
    },
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'buyer', input: true },
      company: { type: 'string', required: false, defaultValue: '', input: true },
      country: { type: 'string', required: false, defaultValue: '', input: true },
      phone: { type: 'string', required: false, defaultValue: '', input: true },
      status: { type: 'string', required: false, defaultValue: 'active', input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once a day while in use
  },
  rateLimit: {
    enabled: isProduction,
    storage: 'memory',
    customRules: {
      '/sign-in/email': { window: 60, max: 10 },
      '/request-password-reset': { window: 300, max: 5 },
      '/send-verification-email': { window: 300, max: 5 },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Disabled accounts cannot sign in.
        async before(session) {
          const row = await db.query.user.findFirst({ where: eq(schema.user.id, session.userId), columns: { status: true } });
          if (row?.status !== 'active') return false;
        },
      },
    },
  },
  advanced: {
    cookiePrefix: 'hbg',
    useSecureCookies: isProduction,
  },
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
