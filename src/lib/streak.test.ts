import { describe, expect, it } from 'vitest';
import { emptyDay } from '@/store/defaults';
import type { DayRecord } from '@/store/types';
import { addDays } from './dates';
import { momentum } from './streak';

const START = '2026-10-20';

/** Builds days from a pattern: "x" is on target, "." is a day under the target. */
function days(pattern: string): Record<string, DayRecord> {
  const record: Record<string, DayRecord> = {};
  [...pattern].forEach((mark, index) => {
    record[addDays(START, index)] = { ...emptyDay(), dm: mark === 'x' ? 20 : 3 };
  });
  return record;
}

describe('momentum', () => {
  it('is active while each day is on target', () => {
    const result = momentum(days('xxxx'), addDays(START, 3), 20);
    expect(result).toEqual({ daysOnTarget: 4, streak: 4, best: 4, state: 'active' });
  });

  it('stays active while today is still open', () => {
    expect(momentum(days('xxx.'), addDays(START, 3), 20).state).toBe('active');
  });

  it('goes to recover after 1 missed day and keeps the streak', () => {
    const result = momentum(days('xxx.'), addDays(START, 4), 20);
    expect(result.state).toBe('recover');
    expect(result.streak).toBe(3);
  });

  it('continues the streak on a recovered day', () => {
    const result = momentum(days('xxx.x'), addDays(START, 4), 20);
    expect(result).toEqual({ daysOnTarget: 4, streak: 4, best: 4, state: 'active' });
  });

  it('ends after 2 missed days and starts again at 1', () => {
    const ended = momentum(days('xxx..'), addDays(START, 5), 20);
    expect(ended.state).toBe('ended');
    expect(ended.best).toBe(3);
    const again = momentum(days('xxx...x'), addDays(START, 6), 20);
    expect(again).toEqual({ daysOnTarget: 4, streak: 1, best: 3, state: 'active' });
  });

  it('never lowers the days on target', () => {
    const pattern = 'xx.x..xx...x';
    let previous = 0;
    for (let index = 1; index <= pattern.length; index += 1) {
      const result = momentum(days(pattern.slice(0, index)), addDays(START, index - 1), 20);
      expect(result.daysOnTarget).toBeGreaterThanOrEqual(previous);
      previous = result.daysOnTarget;
    }
    expect(previous).toBe(6);
  });

  it('is ended with no day on target', () => {
    expect(momentum({}, START, 20)).toEqual({ daysOnTarget: 0, streak: 0, best: 0, state: 'ended' });
  });
});
