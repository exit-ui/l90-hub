const EVENT = 'hub-pulse';

/** Flashes the glow behind the page once. Call it when the user adds a DM, ticks a task or signs off. */
export function pulse(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT));
  }
}

/** Subscribes to pulses. Returns the function that stops the subscription. */
export function onPulse(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
