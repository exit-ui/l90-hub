import { useSyncExternalStore } from 'react';

/** The Chromium install event. It is not in the DOM types yet. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isInstallPromptEvent(event: Event): event is InstallPromptEvent {
  return 'prompt' in event && typeof event.prompt === 'function';
}

let saved: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Keeps the beforeinstallprompt event of Chrome on Android, so the hub can offer its own pill.
 * Call it once, before the first render.
 */
export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    if (isInstallPromptEvent(event)) {
      event.preventDefault();
      saved = event;
      emit();
    }
  });
  window.addEventListener('appinstalled', () => {
    saved = null;
    emit();
  });
}

/** True while an install event waits. */
export function useInstallPrompt(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => saved !== null,
    () => false,
  );
}

/** Opens the browser's install dialog. The event works one time only. */
export async function promptInstall(): Promise<void> {
  const event = saved;
  if (!event) {
    return;
  }
  saved = null;
  emit();
  await event.prompt();
  await event.userChoice;
}
