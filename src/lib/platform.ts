/**
 * Platform rules for the install offer (round 6). Pure: the caller gives the browser values.
 */

/** The localStorage key for "Not now" on the install hint. */
export const INSTALL_HINT_KEY = 'l90-hub-install-hint';

export interface PlatformInput {
  userAgent: string;
  /** navigator.maxTouchPoints. iPadOS reports a Mac user agent, so touch points find it. */
  maxTouchPoints: number;
  /** matchMedia('(display-mode: standalone)').matches, or fullscreen. */
  displayStandalone: boolean;
  /** navigator.standalone on iOS. Undefined in other browsers. */
  navigatorStandalone: boolean | undefined;
}

export type InstallOffer = 'ios-hint' | 'android-prompt' | 'none';

/** True when the hub runs as a home-screen app, not in a browser tab. */
export function isStandalone({ displayStandalone, navigatorStandalone }: PlatformInput): boolean {
  return displayStandalone || navigatorStandalone === true;
}

/** True on iPhone, iPod and iPad (iPadOS shows a Mac user agent with touch points). */
export function isIos({ userAgent, maxTouchPoints }: PlatformInput): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

/** Safari itself, not Chrome, Firefox, Edge or an in-app browser on iOS. */
export function isIosSafari(input: PlatformInput): boolean {
  const { userAgent } = input;
  return (
    isIos(input) &&
    /Safari\//.test(userAgent) &&
    /Version\//.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\//.test(userAgent)
  );
}

/** True on Android phones and tablets. */
export function isAndroid({ userAgent }: PlatformInput): boolean {
  return /Android/.test(userAgent);
}

/**
 * What to offer.
 * - iOS Safari in a tab: the hint card (Share, then Add to Home Screen).
 * - Android with a beforeinstallprompt event: the "Install the app" pill.
 * - Standalone, desktop and everything else: nothing.
 */
export function installOffer(input: PlatformInput, hasPrompt: boolean): InstallOffer {
  if (isStandalone(input)) {
    return 'none';
  }
  if (isIosSafari(input)) {
    return 'ios-hint';
  }
  if (isAndroid(input) && hasPrompt) {
    return 'android-prompt';
  }
  return 'none';
}

/** The storage parts the hint uses. window.localStorage fits. */
export interface HintStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

/** True when the person chose "Not now". A blocked storage counts as not dismissed. */
export function hintDismissed(storage: HintStorage | undefined): boolean {
  try {
    return storage?.getItem(INSTALL_HINT_KEY) === 'dismissed';
  } catch {
    return false;
  }
}

/** Keeps "Not now". It returns false when the storage is blocked; the hint then hides for this visit only. */
export function dismissHint(storage: HintStorage | undefined): boolean {
  try {
    if (!storage) {
      return false;
    }
    storage.setItem(INSTALL_HINT_KEY, 'dismissed');
    return true;
  } catch {
    return false;
  }
}
