/** What every server action returns. Errors are already translated for the current visitor. */
export type ActionResult<T = void> = { ok: true; data?: T; message?: string } | { ok: false; error: string };
