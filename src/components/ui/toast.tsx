'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { cx } from '@/lib/format';

type ToastFn = (message: string, isError?: boolean) => void;
const ToastContext = createContext<ToastFn>(() => undefined);

/** Small status message in the corner of the screen. Use `const toast = useToast()`. */
export function Toaster({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ msg: string; err: boolean; show: boolean }>({ msg: '', err: false, show: false });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback<ToastFn>((msg, err = false) => {
    setState({ msg, err, show: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState((s) => ({ ...s, show: false })), 3200);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={cx('toast', state.show && 'show', state.err && 'err')} role="status" aria-live="polite">
        {state.msg}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
