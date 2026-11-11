import { describe, expect, it } from 'vitest';
import { createDefaultState, emptyDay } from '@/store/defaults';
import type { HubState } from '@/store/types';
import { addDays } from './dates';
import { signOffHeadline, signOffHighlights, signOffNumbers, tomorrowFirstTask } from './signoff';

const START = '2026-10-20';

function state(): HubState {
  const base = createDefaultState();
  base.startDate = START;
  return base;
}

describe('signOffHighlights', () => {
  it('puts a personal best DM day first', () => {
    const hub = state();
    hub.days[START] = { ...emptyDay(), dm: 10 };
    hub.days[addDays(START, 1)] = { ...emptyDay(), dm: 26 };
    expect(signOffHighlights(hub, addDays(START, 1))[0]).toBe('This is your best DM day: 26 DMs.');
  });

  it('names a streak milestone of 7 days', () => {
    const hub = state();
    for (let index = 0; index < 7; index += 1) {
      hub.days[addDays(START, index)] = { ...emptyDay(), dm: 20 };
    }
    expect(signOffHighlights(hub, addDays(START, 6))).toContain('Your streak is now 7 days on target.');
  });

  it('names a pillar with all ticks done for 7 days', () => {
    const hub = state();
    for (let index = 0; index < 7; index += 1) {
      const date = addDays(START, index);
      const done: Record<string, boolean> = {};
      for (const task of Object.values(hub.weekTemplate).flat()) {
        if (/log the numbers|weekly review/i.test(task)) {
          done[task] = true;
        }
      }
      hub.days[date] = { ...emptyDay(), dm: 3, done };
    }
    expect(signOffHighlights(hub, addDays(START, 6))).toContain(
      'All Sign-off ticks are done for 7 days.',
    );
  });

  it('always has the phase progress during the mission', () => {
    const hub = state();
    expect(signOffHighlights(hub, addDays(START, 14))).toEqual(['Phase I is 50 % complete.']);
    expect(signOffHighlights(hub, addDays(START, -3))).toEqual([]);
  });
});

describe('signOffHeadline', () => {
  it('says complete only when every tick is done', () => {
    expect(signOffHeadline(23, 5, 5)).toBe('Day 23 is complete.');
    expect(signOffHeadline(23, 2, 5)).toBe('Day 23 is signed off. 3 ticks are still open.');
    expect(signOffHeadline(23, 4, 5)).toBe('Day 23 is signed off. 1 tick is still open.');
    expect(signOffHeadline(null, 0, 0)).toBe('The day is complete.');
  });
});

describe('signOffNumbers and tomorrowFirstTask', () => {
  it('gives the DMs, the ticks and the XP of the day', () => {
    const hub = state();
    const task = hub.weekTemplate[2][0] ?? '';
    hub.days[START] = { ...emptyDay(), dm: 5, done: { [task]: true } };
    expect(signOffNumbers(hub, START)).toEqual({ dm: 5, ticks: 1, xp: 35 });
  });

  it("gives tomorrow's first task with its cue", () => {
    // 2026-10-20 is a Tuesday. Tomorrow is a Wednesday.
    expect(tomorrowFirstTask(state(), START)).toBe('06:20 Send the drafted DMs at the bus stop.');
  });
});
