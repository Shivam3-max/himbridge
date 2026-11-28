'use client';

import { startTransition, useActionState, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { ACCEPT_DOCS, fileSize } from '@/domain/files';
import { useT } from '@/i18n/client';
import type { ActionResult } from '@/lib/action-result';
import { cx } from '@/lib/format';
import { useToast } from './toast';

/** Submit button with a busy state. */
export function SubmitButton({
  children,
  pending,
  className = 'btn',
  style,
}: {
  children: ReactNode;
  pending: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const t = useT();
  return (
    <button className={className} disabled={pending} aria-busy={pending} style={style}>
      {pending ? t('Please wait…') : typeof children === 'string' ? t(children) : children}
    </button>
  );
}

type FormAction<T> = (prev: ActionResult<T> | null, fd: FormData) => Promise<ActionResult<T>>;

/**
 * Connects a <form> to a server action with the portal's conventions:
 * success → toast + reset the form + `onSuccess`; failure → keep what the user typed and return the
 * error for an inline <FormMessage> (or a toast with `toastErrors`).
 *
 *   const f = useFormAction(createRfq);
 *   <form onSubmit={f.onSubmit}>…<SubmitButton pending={f.pending}>Save</SubmitButton></form>
 */
export function useFormAction<T>(
  action: FormAction<T>,
  opts: {
    toastErrors?: boolean;
    reset?: boolean;
    onSuccess?: (data: T | undefined) => void;
    validate?: (fd: FormData) => string | null;
  } = {},
) {
  const toast = useToast();
  const t = useT();
  const formEl = useRef<HTMLFormElement | null>(null);
  const [state, dispatch, pending] = useActionState(action, null);
  const [clientError, setClientError] = useState<string | null>(null);
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });
  const handled = useRef<typeof state>(null);

  useEffect(() => {
    if (!state || state === handled.current) return;
    handled.current = state;
    const o = optsRef.current;
    if (state.ok) {
      if (state.message) toast(state.message);
      if (o.reset !== false) formEl.current?.reset();
      o.onSuccess?.(state.data);
    } else if (o.toastErrors) toast(state.error, true);
  }, [state, toast]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formEl.current = e.currentTarget;
    const fd = new FormData(e.currentTarget);
    const err = optsRef.current.validate?.(fd) ?? null;
    setClientError(err ? t(err) : null);
    if (err) {
      if (optsRef.current.toastErrors) toast(t(err), true);
      return;
    }
    handled.current = null;
    startTransition(() => dispatch(fd));
  };

  const shown: ActionResult<T> | null = clientError ? { ok: false, error: clientError } : state;
  return { state: shown, pending, onSubmit };
}

/** Runs a one-click server action (no form fields), with optional confirm() and toast. */
export function useCommand() {
  const toast = useToast();
  const t = useT();
  const [busy, setBusy] = useState(false);
  async function run<T>(fn: () => Promise<ActionResult<T>>, opts: { confirm?: string; onSuccess?: (data: T | undefined) => void } = {}) {
    if (opts.confirm && !window.confirm(t(opts.confirm))) return;
    setBusy(true);
    try {
      const r = await fn();
      if (r.ok) {
        if (r.message) toast(r.message);
        opts.onSuccess?.(r.data);
      } else toast(r.error, true);
    } catch {
      toast(t('Something went wrong. Please try again.'), true);
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}

/** File picker with drag & drop. The chosen files are submitted with the surrounding form under `name`. */
export function Dropzone({
  name,
  accept = ACCEPT_DOCS,
  multiple = true,
  hint = 'JPG, PNG, WEBP or PDF · max 5 MB each',
}: {
  name: string;
  accept?: string;
  multiple?: boolean;
  hint?: string;
}) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const clear = () => setFiles([]);
    form.addEventListener('reset', clear);
    return () => form.removeEventListener('reset', clear);
  }, []);
  return (
    <label
      className={cx('dropzone', over && 'over', files.length > 0 && 'has')}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (input.current) {
          input.current.files = e.dataTransfer.files;
          setFiles([...e.dataTransfer.files]);
        }
      }}
    >
      <input
        ref={input}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={(e) => setFiles([...(e.target.files ?? [])])}
      />
      <span className="dz-ic">⇪</span>
      <span>
        <b>{t('Choose files')}</b> {t('or drag them here')}
      </span>
      <span className="tiny muted">{t(hint)}</span>
      <span className="dz-list tiny">{files.map((f) => `${f.name} (${fileSize(f.size)})`).join(' · ')}</span>
    </label>
  );
}
