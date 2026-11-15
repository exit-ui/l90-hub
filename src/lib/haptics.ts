/**
 * Haptic feedback in three strengths.
 * - tap     : one light tick. A tick, +1 DM, a switch.
 * - success : two ticks. A card is complete, the DM target is met.
 * - peak    : three ticks. Every tick of the day is done, the day is signed off.
 *
 * Android and other browsers use the Vibration API. Safari on iPhone has no Vibration API,
 * but iOS 18 plays its system haptic when a switch control changes, so on iPhone a hidden
 * switch is clicked instead. Call only inside a user gesture, for example a click handler.
 */
export type HapticKind = 'tap' | 'success' | 'peak';

/** Vibration patterns in ms: on, off, on. */
export const VIBRATE_PATTERNS: Readonly<Record<HapticKind, number[]>> = {
  tap: [8],
  success: [10, 60, 18],
  peak: [12, 50, 12, 50, 28],
};

/** Gaps in ms between the iPhone ticks of a pattern. */
export const IOS_GAPS: Readonly<Record<HapticKind, number[]>> = {
  tap: [0],
  success: [0, 90],
  peak: [0, 80, 160],
};

let switchLabel: HTMLLabelElement | null = null;

/** The hidden switch whose change makes an iPhone play a haptic. Made on first use. */
function iosSwitch(): HTMLLabelElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  if (switchLabel?.isConnected) {
    return switchLabel;
  }
  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  label.append(input);
  // The synthetic click must not reach other click handlers, for example a menu that closes on an outside click.
  label.addEventListener('click', (event) => event.stopPropagation());
  input.addEventListener('click', (event) => event.stopPropagation());
  document.body.append(label);
  switchLabel = label;
  return label;
}

/** True on iPhone and iPad, where navigator.vibrate is missing. */
function needsSwitch(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate !== 'function' && /iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 0;
}

export function haptic(kind: HapticKind = 'tap'): void {
  if (typeof navigator === 'undefined') {
    return;
  }
  if (needsSwitch()) {
    const label = iosSwitch();
    if (!label) {
      return;
    }
    // The click must never move focus away from where the user is (keyboard, VoiceOver, a focus trap).
    const tick = () => {
      const focused = document.activeElement;
      label.click();
      if (focused instanceof HTMLElement && document.activeElement !== focused) {
        focused.focus({ preventScroll: true });
      }
    };
    for (const gap of IOS_GAPS[kind]) {
      if (gap === 0) {
        tick();
      } else {
        window.setTimeout(tick, gap);
      }
    }
    return;
  }
  // Without a gesture the browser blocks the call and logs an error.
  if (!navigator.userActivation?.isActive) {
    return;
  }
  navigator.vibrate?.(VIBRATE_PATTERNS[kind]);
}

/** One light tick. Kept for the existing call sites. */
export function buzz(): void {
  haptic('tap');
}

/** The haptic for a tap that ticks one row: "peak" for the last tick of the day, "success" for the last of a card. */
export function doneHaptic(openInCard: number, lastOfDay: boolean): HapticKind {
  if (lastOfDay) {
    return 'peak';
  }
  return openInCard === 1 ? 'success' : 'tap';
}
