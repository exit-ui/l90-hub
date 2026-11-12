import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { PressButton } from '@/components/shared/PressButton';
import { FADE, SHEET_SPRING } from '@/lib/motion';

/** How often the app checks for a new version while it stays open. */
const UPDATE_CHECK_MS = 60 * 60 * 1000;

/**
 * Registers the service worker. When a new version is ready, a small frosted toast asks for a reload.
 * The app never reloads by itself, so no typed text is lost.
 */
export function UpdateToast() {
  const reduced = useReducedMotion();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) {
        return;
      }
      // iOS resumes a home-screen app without a reload, so check again when the app comes back and each hour.
      const check = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          registration.update().catch(() => undefined);
        }
      };
      document.addEventListener('visibilitychange', check);
      window.setInterval(check, UPDATE_CHECK_MS);
    },
  });

  return (
    <AnimatePresence>
      {needRefresh ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="glass bottom-toast fixed inset-x-4 z-50 mx-auto flex max-w-120 items-center gap-3 rounded-full py-1 pr-1 pl-4 text-hub-text"
          exit={{ opacity: 0, y: reduced ? 0 : 16 }}
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          role="status"
          transition={reduced ? FADE : SHEET_SPRING}
        >
          <p className="type-body relative z-3 min-w-0 flex-1">A new version is ready.</p>
          <PressButton className="relative z-3 px-3" onClick={() => void updateServiceWorker(true)} tone="secondary">
            Reload the app
          </PressButton>
          <PressButton
            aria-label="Close the message"
            className="relative z-3"
            iconOnly
            onClick={() => setNeedRefresh(false)}
            tone="ghost"
          >
            <X aria-hidden="true" className="size-5" />
          </PressButton>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
