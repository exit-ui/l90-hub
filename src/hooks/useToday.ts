import { useSyncExternalStore } from 'react';
import { todayKey } from '@/lib/dates';
import type { DateKey } from '@/store/types';

const CHECK_EVERY_MS = 30_000;

function subscribe(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, CHECK_EVERY_MS);
  document.addEventListener('visibilitychange', onChange);
  window.addEventListener('focus', onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onChange);
    window.removeEventListener('focus', onChange);
  };
}

/** The local date of the user. It changes at local midnight. */
export function useToday(): DateKey {
  return useSyncExternalStore(subscribe, () => todayKey());
}
