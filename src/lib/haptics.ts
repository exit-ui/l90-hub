/**
 * Haptic feedback.
 *
 * Android and other browsers: the Vibration API, in three strengths.
 * - tap     : one light tick. A tick, +1 DM, a switch.
 * - success : two ticks. A card is complete, the DM target is met.
 * - peak    : three ticks. Every tick of the day is done, the day is signed off.
 *
 * iPhone: Safari has no Vibration API, but it plays the system haptic when a switch control
 * (<input type="checkbox" switch>) is toggled by a real finger tap. A tap that the code fakes
 * (label.click()) plays nothing on current iOS. So `hapticTarget` lays an invisible label over a
 * button: the finger lands on the label, Safari forwards that trusted tap to the hidden switch and
 * plays the haptic, and the click still bubbles to the button as normal. On iPhone every tap
 * of such a button gives one haptic; the strengths are Android only.
 */
export type HapticKind = 'tap' | 'success' | 'peak';

/** Vibration patterns in ms: on, off, on. */
export const VIBRATE_PATTERNS: Readonly<Record<HapticKind, number[]>> = {
  tap: [8],
  success: [10, 60, 18],
  peak: [12, 50, 12, 50, 28],
};

/** True on iPhone and iPad, where navigator.vibrate is missing. */
export function isIos(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate !== 'function' &&
    /iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) &&
    navigator.maxTouchPoints > 0
  );
}

/** Vibrates on Android. Call it inside a click handler. On iPhone, `hapticTarget` plays the haptic instead. */
export function haptic(kind: HapticKind = 'tap'): void {
  if (typeof navigator === 'undefined' || isIos()) {
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

const OVERLAY = 'data-haptic-overlay';

/**
 * A ref callback that makes taps on the element play the iPhone haptic. Does nothing elsewhere.
 * Use it on buttons: `<button ref={hapticTarget}>`.
 */
export function hapticTarget(element: HTMLElement | null): void {
  if (!element || !isIos() || element.querySelector(`:scope > [${OVERLAY}]`)) {
    return;
  }
  const label = document.createElement('label');
  label.setAttribute(OVERLAY, '');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:absolute;inset:0;z-index:5;border-radius:inherit;cursor:inherit;-webkit-tap-highlight-color:transparent';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  // The switch must never sit under the finger: a touch on it would stop the page from scrolling.
  input.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;margin:0;opacity:0;pointer-events:none';
  // The label passes its click on to the switch. Only the label's own click may reach the button.
  input.addEventListener('click', (event) => event.stopPropagation());
  label.append(input);
  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }
  element.append(label);
}
