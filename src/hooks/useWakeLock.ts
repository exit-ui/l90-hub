import { useEffect } from 'react';

/** Keeps the screen on while `active`, where the browser allows it. It never throws: without it the screen just dims. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }
    let sentinel: WakeLockSentinel | null = null;
    let stopped = false;
    const request = () => {
      navigator.wakeLock
        .request('screen')
        .then((lock) => {
          if (stopped) {
            void lock.release().catch(() => undefined);
          } else {
            sentinel = lock;
          }
        })
        .catch(() => undefined);
    };
    // The browser drops the lock when the app goes to the background; ask again when it returns.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        request();
      }
    };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
