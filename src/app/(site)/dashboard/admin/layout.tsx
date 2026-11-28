import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { requirePageUser } from '@/server/auth/session';

/** Everything under /dashboard/admin is for Himbridge staff only. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await requirePageUser('/dashboard');
  if (me.role !== 'admin') redirect('/dashboard');
  return children;
}
