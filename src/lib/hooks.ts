'use client';

import { useSyncExternalStore } from 'react';

/** Live result of a CSS media query (false during server rendering). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const STORAGE_EVENT = 'hbg-storage';

/** A value kept in localStorage and shared by every component that reads it. Falls back when storage is blocked. */
export function useStoredValue(key: string, fallback: string): [string, (v: string) => void] {
  const value = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(STORAGE_EVENT, onChange);
      window.addEventListener('storage', onChange);
      return () => {
        window.removeEventListener(STORAGE_EVENT, onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    () => {
      try {
        return localStorage.getItem(key) ?? fallback;
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );
  const set = (v: string) => {
    try {
      localStorage.setItem(key, v);
    } catch {
      /* storage unavailable — keep working without persistence */
    }
    window.dispatchEvent(new Event(STORAGE_EVENT));
  };
  return [value, set];
}
