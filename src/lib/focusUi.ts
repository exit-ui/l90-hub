import { useSyncExternalStore } from 'react';
import type { DateKey } from '@/store/types';

/**
 * Which task the timer sheet is open for. It lives outside React, like the pulse, so a button on any
 * page can open the one sheet that the app shell holds, without a prop or a render of the page behind it.
 */
export interface FocusUi {
  open: boolean;
  /** The task that the sheet sets up. Null when the sheet opens only to show a timer that already runs. */
  task: string | null;
  date: DateKey | null;
}

let ui: FocusUi = { open: false, task: null, date: null };
const listeners = new Set<() => void>();

function publish(next: FocusUi): void {
  ui = next;
  listeners.forEach((listener) => listener());
}

export function openFocus(task: string | null, date: DateKey | null): void {
  publish({ open: true, task, date });
}

export function closeFocus(): void {
  if (ui.open) {
    publish({ ...ui, open: false });
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFocusUi(): FocusUi {
  return useSyncExternalStore(subscribe, () => ui);
}
