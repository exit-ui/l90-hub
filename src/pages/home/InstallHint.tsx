import { Download, Share } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { GhostPill } from '@/components/shared/GhostPill';
import { PressButton } from '@/components/shared/PressButton';
import { FADE, NO_MOTION } from '@/lib/motion';
import { dismissHint, hintDismissed, type HintStorage, installOffer } from '@/lib/platform';
import { promptInstall, useInstallPrompt } from '@/pwa/installPrompt';

function safeStorage(): HintStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function platformNow() {
  const standalone = 'standalone' in navigator ? navigator.standalone : undefined;
  return {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    displayStandalone:
      window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches,
    navigatorStandalone: typeof standalone === 'boolean' ? standalone : undefined,
  };
}

/**
 * The install offer on Today (round 6).
 * iOS Safari in a tab: a glass card with the two steps and "Not now", one time only.
 * Android Chrome after beforeinstallprompt: an "Install the app" pill.
 * Nothing in the home-screen app or on a desktop.
 */
export function InstallHint() {
  const hasPrompt = useInstallPrompt();
  const reduced = useReducedMotion();
  const [dismissed, setDismissed] = useState(() => hintDismissed(safeStorage()));
  const offer = installOffer(platformNow(), hasPrompt);
  const transition = reduced ? NO_MOTION : FADE;

  return (
    <AnimatePresence initial={false}>
      {offer === 'ios-hint' && !dismissed ? (
        <motion.aside
          animate={{ opacity: 1 }}
          aria-label="Install the app"
          className="glass mb-5 rounded-card p-4 sm:mb-8"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key="ios"
          transition={transition}
        >
          <div className="relative z-3 flex items-center gap-3">
            <Share aria-hidden="true" className="size-5 shrink-0 text-hub-accent-text" />
            <p className="type-body min-w-0 flex-1 text-hub-text">
              Install the app for full screen. Tap Share, then Add to Home Screen.
            </p>
            <PressButton
              className="px-3"
              onClick={() => {
                dismissHint(safeStorage());
                setDismissed(true);
                document.getElementById('main')?.focus({ preventScroll: true });
              }}
              tone="ghost"
            >
              Not now
            </PressButton>
          </div>
        </motion.aside>
      ) : null}
      {offer === 'android-prompt' ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="mb-5 sm:mb-8"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key="android"
          transition={transition}
        >
          <GhostPill icon={Download} onClick={() => void promptInstall()}>
            Install the app
          </GhostPill>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
