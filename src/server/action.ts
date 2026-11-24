import 'server-only';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getI18n } from '@/i18n/server';
import { AppError } from './errors';

import type { ActionResult } from '@/lib/action-result';
export type { ActionResult };

/**
 * Wraps a server action body: translates expected errors (AppError / validation) into a friendly
 * `{ ok: false, error }`, logs unexpected ones, and revalidates the given paths on success.
 */
export async function runAction<T>(fn: () => Promise<T>, opts: { revalidate?: string[]; message?: string } = {}): Promise<ActionResult<T>> {
  const { t } = await getI18n();
  try {
    const data = await fn();
    for (const p of opts.revalidate ?? []) revalidatePath(p, 'layout');
    return { ok: true, data, message: opts.message ? t(opts.message) : undefined };
  } catch (err) {
    if (err instanceof AppError) return { ok: false, error: t(err.message) };
    if (err instanceof z.ZodError) return { ok: false, error: t(err.issues[0]?.message ?? 'Please check the form') };
    // Next.js uses thrown errors for redirect()/notFound() — let those through.
    if (err && typeof err === 'object' && 'digest' in err) throw err;
    console.error('[action] unexpected error', err);
    return { ok: false, error: t('Something went wrong. Please try again.') };
  }
}

/** Reads a FormData into a plain object (repeated keys keep the last value; files are skipped). */
export function formObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === 'string') out[k] = v;
  return out;
}

export const formFiles = (fd: FormData, key: string) =>
  fd.getAll(key).filter((v): v is File => typeof v === 'object' && v !== null && 'arrayBuffer' in v && v.size > 0);
