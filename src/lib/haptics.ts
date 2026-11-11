/**
 * A short tap of the vibration motor, only inside a user gesture and where the API exists.
 * Without a gesture the browser blocks the call and logs an error, so the hub does not call it then.
 */
export function buzz(): void {
  if (typeof navigator === 'undefined' || !navigator.userActivation?.isActive) {
    return;
  }
  navigator.vibrate?.(8);
}
