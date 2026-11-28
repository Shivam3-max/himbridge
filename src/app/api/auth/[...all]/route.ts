import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/server/auth/auth';

/** Better Auth endpoints: sign-in, sign-out, sessions, email verification, password reset. */
export const { GET, POST } = toNextJsHandler(auth);
