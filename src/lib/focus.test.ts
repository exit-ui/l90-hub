import { describe, expect, it } from 'vitest';
import { createDefaultState } from '@/store/defaults';
import type { DayRecord, HubState, Timer } from '@/store/types';
import {
  clampMinutes,
  completeTimerState,
  defaultMinutes,
  focusChange,
  focusRecords,
  focusRecordsView,
  focusWeekColumns,
  focusSeries,
  focusStats,
  formatClock,
  formatMinutes,
  pauseTimer,
  remainingMs,
  resumeTimer,
  shareWeekText,
  startTimer,
  stopTimerEarly,
  timerPhase,
} from './focus';
import { dataOnly } from './setupBackup';
import { parseBackup, sanitizeState, serializeBackup } from './storage';
import { totalXp, XP_VALUES } from './xp';

const MIN = 60_000;
const T0 = Date.UTC(2026, 10, 16, 9, 0, 0);

function day(focus: Record<string, number>): DayRecord {
  return { dm: 0, done: {}, win: '', next: '', chartChecks: 0, vetSend: 0, vetSkip: 0, focus };
}

describe('the timer clock', () => {
  it('counts down from the set length and finishes on time', () => {
    const timer = startTimer('Read 1 chapter.', '2026-11-16', 30, T0);
    expect(timerPhase(timer, T0)).toBe('running');
    expect(remainingMs(timer, T0 + 10 * MIN)).toBe(20 * MIN);
    expect(timerPhase(timer, T0 + 30 * MIN)).toBe('finished');
    expect(remainingMs(timer, T0 + 31 * MIN)).toBe(0);
  });

  it('is the same after a long gap, because it holds time stamps and not a count', () => {
    const timer = startTimer('Read 1 chapter.', '2026-11-16', 10, T0);
    // The phone was locked for six hours. The timer finished; it did not stay at 10 minutes.
    expect(timerPhase(timer, T0 + 6 * 60 * MIN)).toBe('finished');
    expect(remainingMs(timer, T0 + 6 * 60 * MIN)).toBe(0);
  });

  it('cannot gain time when the clock jumps back', () => {
    const timer = startTimer('Read 1 chapter.', '2026-11-16', 10, T0);
    expect(remainingMs(timer, T0 - 5 * MIN)).toBe(10 * MIN);
  });

  it('pauses and resumes without losing or gaining time', () => {
    const running = startTimer('Read 1 chapter.', '2026-11-16', 30, T0);
    const paused = pauseTimer(running, T0 + 10 * MIN);
    expect(timerPhase(paused, T0 + 10 * MIN)).toBe('paused');
    expect(remainingMs(paused, T0 + 90 * MIN)).toBe(20 * MIN);
    const resumed = resumeTimer(paused, T0 + 90 * MIN);
    expect(timerPhase(resumed, T0 + 90 * MIN)).toBe('running');
    expect(remainingMs(resumed, T0 + 100 * MIN)).toBe(10 * MIN);
  });

  it('ends early with the whole minutes that passed, and nothing under one minute', () => {
    const timer = startTimer('Read 1 chapter.', '2026-11-16', 30, T0);
    const early = stopTimerEarly(timer, T0 + 12 * MIN + 40_000);
    expect(early).toMatchObject({ minutes: 12, endsAt: null, remainingMs: 0 });
    expect(early && timerPhase(early, T0 + 13 * MIN)).toBe('finished');
    expect(stopTimerEarly(timer, T0 + 40_000)).toBeNull();
  });

  it('keeps a finished timer as it is when it is stopped', () => {
    const timer = startTimer('Read 1 chapter.', '2026-11-16', 10, T0);
    expect(stopTimerEarly(timer, T0 + 11 * MIN)).toBe(timer);
  });

  it('keeps the ruler inside 5 to 120 minutes', () => {
    expect(clampMinutes(0)).toBe(5);
    expect(clampMinutes(500)).toBe(120);
    expect(clampMinutes(Number.NaN)).toBe(5);
    expect(startTimer('x', '2026-11-16', 999, T0).minutes).toBe(120);
  });

  it('writes the clock and the minutes', () => {
    expect(formatClock(20 * MIN)).toBe('20:00');
    expect(formatClock(59_001)).toBe('01:00');
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(75 * MIN)).toBe('1:15:00');
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(80)).toBe('1h 20m');
    expect(formatMinutes(120)).toBe('2h');
  });

  it('starts the ruler on a length that suits the task', () => {
    expect(defaultMinutes('Read 1 chapter.')).toBe(30);
    expect(defaultMinutes('06:20: Gym session')).toBe(45);
  });
});

function stateWith(timer: Timer | null, overrides: Partial<HubState> = {}): HubState {
  return { ...createDefaultState(), timer, ...overrides };
}

describe('collecting a finished timer', () => {
  const task = 'Read 1 chapter.';
  const date = '2026-11-16';
  const withTask = (timer: Timer | null, extra: Partial<HubState> = {}) =>
    stateWith(timer, {
      weekTemplate: { ...createDefaultState().weekTemplate, 1: [task, 'Gym session'] },
      ...extra,
    });

  it('does nothing while the timer is still running', () => {
    const timer = startTimer(task, date, 30, T0);
    expect(completeTimerState(withTask(timer), true, T0 + MIN)).toEqual({});
  });

  it('credits the minutes to the day the timer started and clears it', () => {
    const timer = startTimer(task, date, 30, T0);
    const next = completeTimerState(withTask(timer), false, T0 + 31 * MIN);
    expect(next.timer).toBeNull();
    expect(next.days?.[date]?.focus).toEqual({ [task]: 30 });
    expect(next.days?.[date]?.done[task]).toBeUndefined();
  });

  it('credits the start day when the timer ends after midnight', () => {
    const late = Date.UTC(2026, 10, 16, 23, 50, 0);
    const timer = startTimer(task, date, 30, late);
    const next = completeTimerState(withTask(timer), false, late + 8 * 60 * 60_000);
    expect(next.days?.[date]?.focus).toEqual({ [task]: 30 });
    expect(next.days?.['2026-11-17']).toBeUndefined();
  });

  it('adds to the minutes already logged for that task on that day', () => {
    const timer = startTimer(task, date, 10, T0);
    const state = withTask(timer, { days: { [date]: day({ [task]: 25 }) } });
    expect(completeTimerState(state, false, T0 + 11 * MIN).days?.[date]?.focus).toEqual({ [task]: 35 });
  });

  it('ticks the task once, and never unticks one that is already done', () => {
    const timer = startTimer(task, date, 30, T0);
    const ticked = completeTimerState(withTask(timer), true, T0 + 31 * MIN);
    expect(ticked.days?.[date]?.done[task]).toBe(true);
    expect(ticked.days?.[date]?.focus).toEqual({ [task]: 30 });

    const already = withTask(timer, {
      days: { [date]: { ...day({}), done: { [task]: true } } },
    });
    const again = completeTimerState(already, true, T0 + 31 * MIN);
    expect(again.days?.[date]?.done[task]).toBe(true);
  });

  it('does not tick a task that is no longer on the list of that day', () => {
    const timer = startTimer('A task that was renamed.', date, 10, T0);
    const next = completeTimerState(withTask(timer), true, T0 + 11 * MIN);
    expect(next.days?.[date]?.done['A task that was renamed.']).toBeUndefined();
    expect(next.days?.[date]?.focus).toEqual({ 'A task that was renamed.': 10 });
  });

  it('logs the timed minutes, and not an hour, as the session of a gym task', () => {
    const timer = startTimer('Gym session', date, 45, T0);
    const next = completeTimerState(withTask(timer), true, T0 + 46 * MIN);
    expect(next.fitness).toHaveLength(1);
    expect(next.fitness?.[0]?.minutes).toBe(45);
    expect(next.fitness?.[0]?.date).toBe(date);
  });

  it('adds one chapter for a reading task that is ticked, and none when it is not', () => {
    const timer = startTimer(task, date, 10, T0);
    const base = withTask(timer);
    const current = base.books.find((book) => book.status === 'current');
    const withChapter = completeTimerState(base, true, T0 + 11 * MIN);
    expect(withChapter.chapterNotes).toHaveLength(1);
    expect(withChapter.books?.find((book) => book.title === current?.title)?.read).toBe((current?.read ?? 0) + 1);
    expect(completeTimerState(base, false, T0 + 11 * MIN).chapterNotes).toBeUndefined();
  });
});

describe('focus numbers', () => {
  const today = '2026-11-18';
  const days = {
    '2026-11-09': day({ a: 40 }),
    '2026-11-10': day({ a: 60, b: 30 }),
    '2026-11-16': day({ a: 20 }),
    '2026-11-17': day({ a: 30 }),
    '2026-11-18': day({ a: 15, b: 15 }),
  };

  it('adds up today, this week, last week, the best day and the streak', () => {
    const stats = focusStats(days, today);
    expect(stats.today).toBe(30);
    expect(stats.yesterday).toBe(30);
    expect(stats.week).toBe(80);
    expect(stats.lastWeek).toBe(130);
    expect(stats.bestDay).toEqual({ date: '2026-11-10', minutes: 90 });
    expect(stats.bestOther).toBe(90);
    expect(stats.bestWeek).toBe(130);
    expect(stats.streak).toBe(3);
    expect(stats.total).toBe(210);
  });

  it('compares this week so far with last week up to the same weekday', () => {
    // Wednesday: last week counts Monday to Wednesday (40), not the Thursday and Saturday after it.
    const mixed = { '2026-11-09': day({ a: 40 }), '2026-11-12': day({ a: 10 }), '2026-11-14': day({ a: 25 }), '2026-11-17': day({ a: 30 }) };
    const stats = focusStats(mixed, today);
    expect(stats.lastWeek).toBe(75);
    expect(stats.lastWeekSoFar).toBe(40);
    expect(stats.week).toBe(30);
  });

  it('keeps the streak from yesterday while today has no focus', () => {
    expect(focusStats({ '2026-11-17': day({ a: 30 }), '2026-11-16': day({ a: 5 }) }, today).streak).toBe(2);
    expect(focusStats({ '2026-11-15': day({ a: 30 }) }, today).streak).toBe(0);
  });

  it('is all zero for a record with no focus', () => {
    expect(focusStats({}, today)).toMatchObject({ today: 0, week: 0, lastWeek: 0, lastWeekSoFar: 0, bestDay: null, bestOther: 0, streak: 0, total: 0 });
  });

  it('gives the last days, oldest first', () => {
    const series = focusSeries(days, today, 3);
    expect(series.map((point) => point.minutes)).toEqual([20, 30, 30]);
    expect(series[2]?.date).toBe(today);
  });

  it('gives the change against last week, or null without a last week', () => {
    expect(focusChange(80, 130)).toBe(-38);
    expect(focusChange(100, 0)).toBeNull();
  });

  it('finds the record that a session breaks, only on the crossing', () => {
    expect(focusRecords(days, today, 65)).toEqual({ bestDay: true, bestWeek: true });
    expect(focusRecords(days, today, 55)).toEqual({ bestDay: false, bestWeek: true });
    expect(focusRecords(days, today, 40)).toEqual({ bestDay: false, bestWeek: false });
    // Already past the best day: a later session does not break it a second time.
    const past = { ...days, [today]: day({ a: 100 }) };
    expect(focusRecords(past, today, 10).bestDay).toBe(false);
    expect(focusRecords(days, today, 100).bestWeek).toBe(true);
  });
});

describe('saving the timer and the focus minutes', () => {
  it('keeps both through the saved record and a backup', () => {
    const timer = startTimer('Read 1 chapter.', '2026-11-16', 30, T0);
    const state = { ...createDefaultState(), timer, days: { '2026-11-16': day({ 'Read 1 chapter.': 30 }) } };
    const loaded = sanitizeState(JSON.parse(JSON.stringify(state)));
    expect(loaded.timer).toEqual(timer);
    expect(loaded.days['2026-11-16']?.focus).toEqual({ 'Read 1 chapter.': 30 });

    const parsed = parseBackup(serializeBackup(dataOnly({ ...state, actions: {} })));
    expect(parsed.ok && parsed.state.timer).toEqual(timer);
    expect(parsed.ok && parsed.state.days['2026-11-16']?.focus).toEqual({ 'Read 1 chapter.': 30 });
  });

  it('loads an older record that has neither field', () => {
    const old: Record<string, unknown> = { ...createDefaultState() };
    delete old.timer;
    expect(sanitizeState(old).timer).toBeNull();
    const withDay = { ...old, days: { '2026-11-16': { dm: 3, done: {}, win: '', next: '', chartChecks: 0, vetSend: 0, vetSkip: 0 } } };
    expect(sanitizeState(withDay).days['2026-11-16']?.focus).toBeUndefined();
  });

  it('drops a timer or focus value that is not correct', () => {
    expect(sanitizeState({ ...createDefaultState(), timer: { task: 'x', date: 'not a date', minutes: 10, endsAt: 1, remainingMs: 0 } }).timer).toBeNull();
    expect(sanitizeState({ ...createDefaultState(), timer: { task: 'x', date: '2026-11-16', minutes: 0, endsAt: 1, remainingMs: 0 } }).timer).toBeNull();
    expect(sanitizeState({ ...createDefaultState(), timer: 'oops' }).timer).toBeNull();
    const bad = sanitizeState({
      ...createDefaultState(),
      days: { '2026-11-16': { ...day({}), focus: { good: 12, zero: 0, text: 'x', negative: -5 } } },
    });
    expect(bad.days['2026-11-16']?.focus).toEqual({ good: 12 });
  });

  it('keeps a stored timer inside the ruler', () => {
    const loaded = sanitizeState({
      ...createDefaultState(),
      timer: { task: 'x', date: '2026-11-16', minutes: 9999, endsAt: T0, remainingMs: 1e12 },
    });
    expect(loaded.timer?.minutes).toBe(120);
    expect(loaded.timer?.remainingMs).toBeLessThanOrEqual(120 * MIN);
  });
});

describe('XP for focus', () => {
  it('gives one XP for each minute and leaves a record without focus unchanged', () => {
    const base = createDefaultState();
    const withFocus = { ...base, days: { '2026-11-16': day({ a: 30, b: 12 }) } };
    expect(totalXp(withFocus) - totalXp({ ...base, days: { '2026-11-16': day({}) } })).toBe(42 * XP_VALUES.focusMinute);
  });
});

describe('the week race, the records and the line to share', () => {
  const today = '2026-11-18';
  const days = {
    '2026-11-09': day({ a: 40 }),
    '2026-11-10': day({ a: 60, b: 30 }),
    '2026-11-11': day({ a: 20 }),
    '2026-11-16': day({ a: 20 }),
    '2026-11-17': day({ a: 30 }),
    '2026-11-18': day({ a: 15, b: 15 }),
  };

  it('lines this week up against last week, and leaves days to come empty', () => {
    const columns = focusWeekColumns(days, today);
    expect(columns).toHaveLength(7);
    expect(columns[0]).toEqual({ date: '2026-11-16', minutes: 20, last: 40 });
    expect(columns[1]).toEqual({ date: '2026-11-17', minutes: 30, last: 90 });
    expect(columns[2]).toEqual({ date: '2026-11-18', minutes: 30, last: 20 });
    expect(columns[3]?.minutes).toBeNull();
    expect(columns[6]?.date).toBe('2026-11-22');
  });

  it('finds the best day, the best week and the longest streak', () => {
    const view = focusRecordsView(days, today);
    expect(view.bestDay).toEqual({ date: '2026-11-10', minutes: 90 });
    expect(view.bestWeek).toEqual({ weekStart: '2026-11-09', minutes: 150 });
    expect(view.longestStreak).toBe(3);
    expect(view.freshDay).toBe(false);
    expect(view.freshWeek).toBe(false);
  });

  it('calls a record fresh only when it beats an earlier one', () => {
    const first = { '2026-11-18': day({ a: 50 }) };
    expect(focusRecordsView(first, today)).toMatchObject({ freshDay: false, freshWeek: false });
    const beaten = { ...days, '2026-11-18': day({ a: 100 }) };
    const view = focusRecordsView(beaten, today);
    expect(view.bestDay).toEqual({ date: today, minutes: 100 });
    expect(view.freshDay).toBe(true);
    expect(view.freshWeek).toBe(false);
    const big = { ...beaten, '2026-11-17': day({ a: 100 }), '2026-11-16': day({ a: 100 }) };
    expect(focusRecordsView(big, today).freshWeek).toBe(true);
  });

  it('writes one plain line for a friend', () => {
    expect(shareWeekText(days, today)).toBe('L90 focus this week: 1h 20m (-47% on last week by now) · best day 1h 30m · 3-day streak');
    expect(shareWeekText({}, today)).toBe('L90 focus this week: 0m');
    const up = { '2026-11-09': day({ a: 10 }), '2026-11-16': day({ a: 30 }) };
    expect(shareWeekText(up, '2026-11-16')).toContain('(+200% on last week by now)');
  });
});

