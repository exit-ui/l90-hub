import { describe, expect, it } from 'vitest';
import { buzz } from './haptics';

describe('buzz', () => {
  it('does nothing without a user gesture or a vibration API', () => {
    expect(() => buzz()).not.toThrow();
  });
});
