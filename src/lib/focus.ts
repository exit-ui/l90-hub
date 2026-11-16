import { emptyDay } from '@/store/defaults';
import type { DateKey, DayRecord, HubState, Timer } from '@/store/types';
import { addDays, mondayOf, rangeOfDays, weekOf } from './dates';
import { type PillarId, pillarOfTask } from './pillars';
import { tasksForDate } from './status';
import { runLength } from './streak';
import { toggleTaskState } from './tickEffects';

/** The ruler of the timer: 5 to 120 minutes, in steps of 5. */
export const MIN_TIMER_MINUTES = 5;
export const MAX_TIMER_MINUTES = 120;
export const TIMER_STEP = 5;
/** No task can hold more than a whole day of focus on one date. A stored value above it is cut. */
export const MAX_FOCUS_MINUTES = 24 * 60;

const MINUTE_MS = 60_000;

const DEFAULT_MINUTES: Readonly<Record<PillarId, number>> = {
  reading: 30,
  fitness: 45,
  learning: 45,
  outreach: 25,
  trading: 30,
  signoff: 10,
};

/** The length that the ruler starts on for a task. */
export function defaultMinutes(task: string): number {
  return DEFAULT_MINUTES[pillarOfTask(task)];
}

/** A length in whole minutes inside the ruler. */
export function clampMinutes(minutes: number): number {
  const whole = Number.isFinite(minutes) ? Math.round(minutes) : MIN_TIMER_MINUTES;
  return Math.max(MIN_TIMER_MINUTES, Math.min(MAX_TIMER_MINUTES, whole));
}

export type TimerPhase = 'running' | 'paused' | 'finished';

/** What is left, from 0 up to the set length. A clock that jumps forward cannot add time. */
export function remainingMs(timer: Timer, now: number): number {
  const total = timer.minutes * MINUTE_MS;
  const left = timer.endsAt === null ? timer.remainingMs : timer.endsAt - now;
  return Math.max(0, Math.min(left, total));
}

export function timerPhase(timer: Timer, now: number): TimerPhase {
  if (remainingMs(timer, now) <= 0) {
    return 'finished';
  }
  return timer.endsAt === null ? 'paused' : 'running';
}

export function startTimer(task: string, date: DateKey, minutes: number, now: number): Timer {
  const length = clampMinutes(minutes);
  return { task, date, minutes: length, endsAt: now + length * MINUTE_MS, remainingMs: length * MINUTE_MS };
}

export function pauseTimer(timer: Timer, now: number): Timer {
  return timerPhase(timer, now) === 'running' ? { ...timer, endsAt: null, remainingMs: remainingMs(timer, now) } : timer;
}

export function resumeTimer(timer: Timer, now: number): Timer {
  return timerPhase(timer, now) === 'paused' ? { ...timer, endsAt: now + timer.remainingMs } : timer;
}

/**
 * "Finish now": the timer ends and credits the whole minutes that have passed.
 * Under one minute there is nothing to credit, so the result is null.
 */
export function stopTimerEarly(timer: Timer, now: number): Timer | null {
  if (timerPhase(timer, now) === 'finished') {
    return timer;
  }
  const passed = Math.floor((timer.minutes * MINUTE_MS - remainingMs(timer, now)) / MINUTE_MS);
  return passed < 1 ? null : { ...timer, minutes: passed, endsAt: null, remainingMs: 0 };
}

/** "12:34", or "1:05:00" from one hour. It rounds up, so the last second shows 0:01. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** "45m", "1h 20m", "2h". */
export function formatMinutes(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes));
  if (whole < 60) {
    return `${whole}m`;
  }
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

type CompleteState = Pick<HubState, 'days' | 'fitness' | 'learning' | 'books' | 'chapterNotes' | 'weekTemplate' | 'timer'>;

/**
 * Collects a finished timer: its minutes go to the day it started, and the timer is cleared.
 * With `tick`, the task is also ticked, and a gym or study task logs the timed minutes as its session.
 * A task that is already ticked, or that is not on that day's list any more, is never toggled.
 * A timer that has not finished changes nothing.
 */
export function completeTimerState(state: CompleteState, tick: boolean, now: number): Partial<CompleteState> {
  const timer = state.timer;
  if (!timer || timerPhase(timer, now) !== 'finished') {
    return {};
  }
  const record: DayRecord = state.days[timer.date] ?? emptyDay();
  const credited = Math.min(MAX_FOCUS_MINUTES, (record.focus?.[timer.task] ?? 0) + timer.minutes);
  const days = { ...state.days, [timer.date]: { ...record, focus: { ...record.focus, [timer.task]: credited } } };
  const change: Partial<CompleteState> = { days, timer: null };
  if (tick && record.done[timer.task] !== true && tasksForDate(state.weekTemplate, timer.date).includes(timer.task)) {
    Object.assign(change, toggleTaskState({ ...state, days }, timer.date, timer.task, timer.minutes));
  }
  return change;
}

/** The focus minutes of one day. */
export function focusOf(record: DayRecord | undefined): number {
  let sum = 0;
  for (const minutes of Object.values(record?.focus ?? {})) {
    sum += minutes;
  }
  return sum;
}

type Days = Record<DateKey, DayRecord>;

/** The focus minutes of each of the last `count` days, oldest first. */
export function focusSeries(days: Days, today: DateKey, count: number): { date: DateKey; minutes: number }[] {
  return rangeOfDays(addDays(today, -(count - 1)), today).map((date) => ({ date, minutes: focusOf(days[date]) }));
}

export interface FocusStats {
  today: number;
  yesterday: number;
  /** The Monday-to-Sunday week that holds today, and the week before it. */
  week: number;
  lastWeek: number;
  /** Last week up to the same weekday as today: the fair mark for this week so far. */
  lastWeekSoFar: number;
  /** The best day, over every day. Null before the first minute. */
  bestDay: { date: DateKey; minutes: number } | null;
  /** The best day that is not today: the mark that today has to pass. */
  bestOther: number;
  bestWeek: number;
  /** Days in a row with focus, back from today (or from yesterday while today has none). */
  streak: number;
  total: number;
}

export function focusStats(days: Days, today: DateKey): FocusStats {
  const weekTotal = (date: DateKey) => weekOf(date).reduce((sum, day) => sum + focusOf(days[day]), 0);
  let bestDay: FocusStats['bestDay'] = null;
  let bestOther = 0;
  let total = 0;
  const weeks = new Map<DateKey, number>();
  for (const [date, record] of Object.entries(days)) {
    const minutes = focusOf(record);
    if (minutes <= 0) {
      continue;
    }
    total += minutes;
    if (bestDay === null || minutes > bestDay.minutes || (minutes === bestDay.minutes && date > bestDay.date)) {
      bestDay = { date, minutes };
    }
    if (date !== today) {
      bestOther = Math.max(bestOther, minutes);
    }
    const monday = mondayOf(date);
    weeks.set(monday, (weeks.get(monday) ?? 0) + minutes);
  }
  const lastMonday = addDays(mondayOf(today), -7);
  const position = weekOf(today).indexOf(today);
  return {
    today: focusOf(days[today]),
    yesterday: focusOf(days[addDays(today, -1)]),
    week: weekTotal(today),
    lastWeek: weekTotal(lastMonday),
    lastWeekSoFar: weekOf(lastMonday)
      .slice(0, position + 1)
      .reduce((sum, day) => sum + focusOf(days[day]), 0),
    bestDay,
    bestOther,
    bestWeek: Math.max(0, ...weeks.values()),
    streak: runLength((date) => focusOf(days[date]) > 0, today),
    total,
  };
}

/** The change of this week so far against last week at the same point, in percent. Null with nothing to compare. */
export function focusChange(week: number, lastWeek: number): number | null {
  return lastWeek > 0 ? Math.round(((week - lastWeek) / lastWeek) * 100) : null;
}

/** Focus minutes by pillar over some days. */
export function focusByPillar(days: Days, dates: readonly DateKey[]): Record<PillarId, number> {
  const sums: Record<PillarId, number> = { outreach: 0, fitness: 0, learning: 0, reading: 0, trading: 0, signoff: 0 };
  for (const date of dates) {
    for (const [task, minutes] of Object.entries(days[date]?.focus ?? {})) {
      sums[pillarOfTask(task)] += minutes;
    }
  }
  return sums;
}

export interface FocusRecords {
  /** Adding the minutes takes today past the best earlier day. */
  bestDay: boolean;
  /** Adding the minutes takes this week past the best earlier week. */
  bestWeek: boolean;
}

/** Which records a session of `minutes` on `date` breaks. Only a first crossing counts. */
export function focusRecords(days: Days, date: DateKey, minutes: number): FocusRecords {
  const before = focusStats(days, date);
  const dayBefore = before.today;
  const weekBefore = before.week;
  const otherWeeks = new Map<DateKey, number>();
  for (const [key, record] of Object.entries(days)) {
    const monday = mondayOf(key);
    if (monday !== mondayOf(date)) {
      otherWeeks.set(monday, (otherWeeks.get(monday) ?? 0) + focusOf(record));
    }
  }
  const bestOtherWeek = Math.max(0, ...otherWeeks.values());
  return {
    bestDay: before.bestOther > 0 && dayBefore <= before.bestOther && dayBefore + minutes > before.bestOther,
    bestWeek: bestOtherWeek > 0 && weekBefore <= bestOtherWeek && weekBefore + minutes > bestOtherWeek,
  };
}
