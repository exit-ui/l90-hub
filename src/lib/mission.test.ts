import { describe, expect, it } from 'vitest';
import { createDefaultState, emptyDay } from '@/store/defaults';
import type { DayRecord, HubState } from '@/store/types';
import {
  addDays,
  dateOfDay,
  dayNumber,
  diffDays,
  isDateKey,
  mondayOf,
  toKey,
  weekdayOf,
  weekOf,
} from './dates';
import { missionClock, phaseOfDay, reviewDate, rewardStatuses } from './phases';
import { dayStatus, missionCells, tasksForDate } from './status';
import {
  daysAtTarget,
  dmStreak,
  projectedTotal,
  sevenDayAverage,
  totalContacted,
  twoDayWarning,
} from './streak';

const START = '2026-10-20';

function day(dm: number, done: Record<string, boolean> = {}): DayRecord {
  return { ...emptyDay(), dm, done };
}

describe('day number', () => {
  it('gives day 1 on the start date', () => {
    expect(dayNumber(START, START)).toBe(1);
  });

  it('gives day 90 on 17 January 2027 and day 91 on the review day', () => {
    expect(dayNumber('2027-01-17', START)).toBe(90);
    expect(dayNumber('2027-01-18', START)).toBe(91);
    expect(reviewDate(START)).toBe('2027-01-18');
    expect(dateOfDay(90, START)).toBe('2027-01-17');
  });

  it('stays correct across the clock change on 25 October 2026', () => {
    expect(dayNumber('2026-10-25', START)).toBe(6);
    expect(dayNumber('2026-10-26', START)).toBe(7);
    expect(diffDays('2027-03-29', '2027-03-27')).toBe(2);
  });

  it('gives 0 and negative numbers before the start date', () => {
    expect(dayNumber('2026-10-19', START)).toBe(0);
    expect(dayNumber('2026-10-10', START)).toBe(-9);
  });

  it('uses the local date of a Date object', () => {
    expect(toKey(new Date(2026, 9, 20, 23, 59))).toBe('2026-10-20');
    expect(toKey(new Date(2026, 9, 21, 0, 1))).toBe('2026-10-21');
  });

  it('rejects text that is not a real date', () => {
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('20-10-2026')).toBe(false);
    expect(isDateKey('2026-10-20')).toBe(true);
  });

  it('finds the weekday and the Monday-first week', () => {
    expect(weekdayOf(START)).toBe(2);
    expect(mondayOf(START)).toBe('2026-10-19');
    expect(mondayOf('2026-10-25')).toBe('2026-10-19');
    expect(weekOf(START)).toHaveLength(7);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('phase', () => {
  it('maps the day to the phase', () => {
    expect(phaseOfDay(1)).toBe(1);
    expect(phaseOfDay(30)).toBe(1);
    expect(phaseOfDay(31)).toBe(2);
    expect(phaseOfDay(60)).toBe(2);
    expect(phaseOfDay(61)).toBe(3);
    expect(phaseOfDay(90)).toBe(3);
  });

  it('gives no phase outside the mission', () => {
    expect(phaseOfDay(0)).toBeNull();
    expect(phaseOfDay(91)).toBeNull();
  });

  it('builds the mission clock', () => {
    const active = missionClock('2026-11-10', START);
    expect(active).toMatchObject({ day: 22, daysLeft: 68, phase: 1, stage: 'active' });
    expect(missionClock('2026-10-15', START)).toMatchObject({
      stage: 'before',
      daysToStart: 5,
      daysLeft: 90,
    });
    expect(missionClock('2027-01-18', START).stage).toBe('review');
    expect(missionClock('2027-02-01', START)).toMatchObject({ stage: 'after', daysLeft: 0 });
  });
});

describe('day status', () => {
  const tasks = ['A', 'B'];
  const today = '2026-10-25';

  it('is signed off when all tasks are complete', () => {
    expect(dayStatus(day(0, { A: true, B: true }), tasks, today, today, START)).toBe('signed off');
  });

  it('is partly done when one task is complete or a DM is sent', () => {
    expect(dayStatus(day(0, { A: true }), tasks, today, today, START)).toBe('partly done');
    expect(dayStatus(day(3), tasks, today, today, START)).toBe('partly done');
  });

  it('is missed for an empty day before today, on or after the start date', () => {
    expect(dayStatus(undefined, tasks, '2026-10-24', today, START)).toBe('missed');
    expect(dayStatus(day(0), tasks, START, today, START)).toBe('missed');
  });

  it('is open for today, for the future and for days before the start', () => {
    expect(dayStatus(undefined, tasks, today, today, START)).toBe('open');
    expect(dayStatus(undefined, tasks, '2026-11-01', today, START)).toBe('open');
    expect(dayStatus(undefined, tasks, '2026-10-19', today, START)).toBe('open');
  });

  it('does not sign off a day that has no tasks', () => {
    expect(dayStatus(day(0), [], today, today, START)).toBe('open');
  });

  it('ignores a complete task that is not in the list for the day', () => {
    expect(dayStatus(day(0, { Old: true }), tasks, '2026-10-24', today, START)).toBe('missed');
  });

  it('gives the task list for the weekday', () => {
    const template = createDefaultState().weekTemplate;
    expect(tasksForDate(template, START)[3]).toBe('Do the Linux and Python session.');
    expect(tasksForDate(template, '2026-10-23')[3]).toBe('Rest.');
    expect(tasksForDate(template, '2026-10-24')).toHaveLength(5);
  });

  it('builds 90 cells', () => {
    const cells = missionCells(createDefaultState(), '2026-10-22');
    expect(cells).toHaveLength(90);
    expect(cells[0]).toMatchObject({ day: 1, date: START, status: 'missed' });
    expect(cells[2]).toMatchObject({ isToday: true, status: 'open' });
  });
});

describe('streak', () => {
  it('counts days in sequence at or above the target', () => {
    const days = {
      '2026-10-20': day(20),
      '2026-10-21': day(25),
      '2026-10-22': day(20),
    };
    expect(dmStreak(days, 20, '2026-10-22')).toBe(3);
  });

  it('counts from yesterday when today is below the target', () => {
    const days = {
      '2026-10-20': day(20),
      '2026-10-21': day(21),
      '2026-10-22': day(5),
    };
    expect(dmStreak(days, 20, '2026-10-22')).toBe(2);
  });

  it('stops at a day below the target', () => {
    const days = {
      '2026-10-20': day(20),
      '2026-10-21': day(19),
      '2026-10-22': day(20),
    };
    expect(dmStreak(days, 20, '2026-10-22')).toBe(1);
  });

  it('is 0 with no data', () => {
    expect(dmStreak({}, 20, '2026-10-22')).toBe(0);
  });

  it('counts the days at target and the contacted total', () => {
    const days = { a: day(20), b: day(19), c: day(40) };
    expect(daysAtTarget(days, 20)).toBe(2);
    expect(totalContacted({ baseContacted: 40, days })).toBe(119);
  });

  it('calculates the 7-day average and the projection', () => {
    const days = { '2026-10-20': day(14), '2026-10-21': day(21) };
    expect(sevenDayAverage(days, '2026-10-21')).toBe(5);
    const projected = projectedTotal(
      { baseContacted: 40, days, startDate: START },
      '2026-10-21',
    );
    expect(projected).toBe(40 + 35 + 5 * 88);
  });

  it('shows the two-day warning only after 2 days of use', () => {
    expect(twoDayWarning({}, '2026-10-22')).toBe(false);
    expect(twoDayWarning({ '2026-10-22': day(0) }, '2026-10-22')).toBe(false);
    expect(twoDayWarning({ '2026-10-20': day(20) }, '2026-10-22')).toBe(true);
    expect(twoDayWarning({ '2026-10-20': day(20), '2026-10-21': day(1) }, '2026-10-22')).toBe(
      false,
    );
    expect(twoDayWarning({ '2026-10-20': day(20), '2026-10-22': day(1) }, '2026-10-22')).toBe(
      false,
    );
  });
});

describe('phase reward conditions', () => {
  function stateWith(change: (state: HubState) => void): HubState {
    const state = createDefaultState();
    change(state);
    return state;
  }

  it('locks all rewards for the default state', () => {
    expect(rewardStatuses(createDefaultState()).map((reward) => reward.state)).toEqual([
      'locked',
      'locked',
      'locked',
    ]);
  });

  it('unlocks phase 1 when the target is met on 25 days', () => {
    const state = stateWith((draft) => {
      for (let index = 0; index < 24; index += 1) {
        draft.days[addDays(START, index)] = day(20);
      }
    });
    expect(rewardStatuses(state)[0].met).toBe(false);
    state.days[addDays(START, 24)] = day(20);
    expect(rewardStatuses(state)[0]).toMatchObject({ met: true, state: 'ready' });
  });

  it('needs the two parts of the phase 2 condition', () => {
    const state = stateWith((draft) => {
      draft.funnel.loomSent = 5;
      draft.funnel.booked = 1;
    });
    expect(rewardStatuses(state)[1].met).toBe(false);
    state.funnel.booked = 2;
    expect(rewardStatuses(state)[1].met).toBe(true);
  });

  it('unlocks phase 3 when one pilot is closed', () => {
    const state = stateWith((draft) => {
      draft.funnel.closed = 1;
      draft.claimed = [true, false, true];
    });
    const [first, , third] = rewardStatuses(state);
    expect(third.state).toBe('claimed');
    expect(first.state).toBe('locked');
  });
});
