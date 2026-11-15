import { describe, expect, it } from 'vitest';
import { buzz, haptic, IOS_GAPS, VIBRATE_PATTERNS } from './haptics';

describe('haptics', () => {
  it('does nothing without a user gesture or a vibration API', () => {
    expect(() => buzz()).not.toThrow();
    expect(() => haptic('peak')).not.toThrow();
  });

  it('gets stronger from tap to success to peak', () => {
    expect(VIBRATE_PATTERNS.tap.length).toBeLessThan(VIBRATE_PATTERNS.success.length);
    expect(VIBRATE_PATTERNS.success.length).toBeLessThan(VIBRATE_PATTERNS.peak.length);
    expect(IOS_GAPS.tap.length).toBeLessThan(IOS_GAPS.peak.length);
  });

  it('keeps every pattern under 400 ms', () => {
    for (const pattern of Object.values(VIBRATE_PATTERNS)) {
      expect(pattern.reduce((sum, ms) => sum + ms, 0)).toBeLessThan(400);
    }
  });
});
