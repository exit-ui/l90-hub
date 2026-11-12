import { describe, expect, it } from 'vitest';
import { formatDayPhone, formatLong } from './dates';

describe('date formats', () => {
  it('gives a short date for the phone header line', () => {
    expect(formatDayPhone('2026-11-12')).toBe('Thu 12 November');
    expect(formatLong('2026-11-12')).toContain('Thursday');
  });
});
