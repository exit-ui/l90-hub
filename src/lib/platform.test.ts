import { describe, expect, it } from 'vitest';
import {
  dismissHint,
  type HintStorage,
  hintDismissed,
  INSTALL_HINT_KEY,
  installOffer,
  isIosSafari,
  isStandalone,
  type PlatformInput,
} from './platform';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.0.0 Mobile/15E148 Safari/604.1';
const IPHONE_INSTAGRAM =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 380.0.0.0';
const IPAD_DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36';
const DESKTOP_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

function input(userAgent: string, extra: Partial<PlatformInput> = {}): PlatformInput {
  return { userAgent, maxTouchPoints: 5, displayStandalone: false, navigatorStandalone: undefined, ...extra };
}

describe('installOffer', () => {
  it('offers the hint in iOS Safari in a tab', () => {
    expect(installOffer(input(IPHONE_SAFARI, { navigatorStandalone: false }), false)).toBe('ios-hint');
  });

  it('finds iPadOS by its touch points, but not a Mac', () => {
    expect(installOffer(input(IPAD_DESKTOP_UA), false)).toBe('ios-hint');
    expect(installOffer(input(IPAD_DESKTOP_UA, { maxTouchPoints: 0 }), false)).toBe('none');
  });

  it('offers nothing in the home-screen app', () => {
    expect(installOffer(input(IPHONE_SAFARI, { navigatorStandalone: true }), false)).toBe('none');
    expect(installOffer(input(IPHONE_SAFARI, { displayStandalone: true }), false)).toBe('none');
    expect(installOffer(input(ANDROID_CHROME, { displayStandalone: true }), true)).toBe('none');
  });

  it('offers nothing in other iOS browsers and in-app views', () => {
    expect(isIosSafari(input(IPHONE_CHROME))).toBe(false);
    expect(installOffer(input(IPHONE_INSTAGRAM), false)).toBe('none');
  });

  it('offers the pill on Android only after beforeinstallprompt', () => {
    expect(installOffer(input(ANDROID_CHROME), false)).toBe('none');
    expect(installOffer(input(ANDROID_CHROME), true)).toBe('android-prompt');
  });

  it('offers nothing on a desktop, also with a prompt event', () => {
    expect(installOffer(input(DESKTOP_CHROME, { maxTouchPoints: 0 }), true)).toBe('none');
  });
});

describe('isStandalone', () => {
  it('reads the display mode and the iOS flag', () => {
    expect(isStandalone(input(IPHONE_SAFARI))).toBe(false);
    expect(isStandalone(input(IPHONE_SAFARI, { navigatorStandalone: true }))).toBe(true);
  });
});

function memoryStorage(): HintStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

const blocked: HintStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('the hint dismissal', () => {
  it('keeps "Not now" under its own key', () => {
    const storage = memoryStorage();
    expect(hintDismissed(storage)).toBe(false);
    expect(dismissHint(storage)).toBe(true);
    expect(storage.data.get(INSTALL_HINT_KEY)).toBe('dismissed');
    expect(hintDismissed(storage)).toBe(true);
  });

  it('does not throw when the storage is blocked or missing', () => {
    expect(hintDismissed(blocked)).toBe(false);
    expect(dismissHint(blocked)).toBe(false);
    expect(hintDismissed(undefined)).toBe(false);
    expect(dismissHint(undefined)).toBe(false);
  });
});
