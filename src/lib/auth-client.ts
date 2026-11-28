'use client';

import { createAuthClient } from 'better-auth/react';

/** Browser-side auth calls (sign in, sign out, password reset, change password). Same-origin by default. */
export const authClient = createAuthClient();
