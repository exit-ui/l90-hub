import { describe, expect, it } from 'vitest';
import { dmStatusText, missionHeadline } from './homeText';
import { missionClock } from './phases';

describe('missionHeadline', () => {
  it('shows the day in the mission', () => {
    expect(missionHeadline(missionClock('2026-11-10', '2026-10-20'))).toBe('Day 22 of 90');
  });

  it('shows the days to the start', () => {
    expect(missionHeadline(missionClock('2026-10-18', '2026-10-20'))).toBe('2 days to the start');
    expect(missionHeadline(missionClock('2026-10-19', '2026-10-20'))).toBe('1 day to the start');
  });

  it('shows the review day and the end', () => {
    expect(missionHeadline(missionClock('2027-01-18', '2026-10-20'))).toBe('Review day');
    expect(missionHeadline(missionClock('2027-03-01', '2026-10-20'))).toBe('Mission complete');
  });
});

describe('dmStatusText', () => {
  it('gives the DMs left to the target', () => {
    expect(dmStatusText(12, 20)).toBe('8 more to the target.');
  });

  it('marks the target', () => {
    expect(dmStatusText(20, 20)).toBe('Target met.');
    expect(dmStatusText(23, 20)).toBe('Target met, 3 more.');
  });

  it('works with no target', () => {
    expect(dmStatusText(1, 0)).toBe('1 DM sent.');
  });
});
