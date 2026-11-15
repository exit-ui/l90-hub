import { describe, expect, it } from 'vitest';
import { buzz, doneHaptic, haptic, hapticTarget, VIBRATE_PATTERNS } from './haptics';

describe('haptics', () => {
  it('does nothing without a user gesture or a vibration API', () => {
    expect(() => buzz()).not.toThrow();
    expect(() => haptic('peak')).not.toThrow();
  });

  it('gets stronger from tap to success to peak', () => {
    expect(VIBRATE_PATTERNS.tap.length).toBeLessThan(VIBRATE_PATTERNS.success.length);
    expect(VIBRATE_PATTERNS.success.length).toBeLessThan(VIBRATE_PATTERNS.peak.length);
  });

  it('ignores a missing element', () => {
    expect(() => hapticTarget(null)).not.toThrow();
  });

  it('picks peak for the last tick of the day and success for the last of a card', () => {
    expect(doneHaptic(1, true)).toBe('peak');
    expect(doneHaptic(1, false)).toBe('success');
    expect(doneHaptic(3, false)).toBe('tap');
  });

  it('keeps every pattern under 400 ms', () => {
    for (const pattern of Object.values(VIBRATE_PATTERNS)) {
      expect(pattern.reduce((sum, ms) => sum + ms, 0)).toBeLessThan(400);
    }
  });
});
