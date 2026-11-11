import type { DateKey, DayRecord, HubState } from '@/store/types';
import { addDays, dayNumber, diffDays, rangeOfDays } from './dates';

type Days = Record<DateKey, DayRecord>;

export function dmOn(days: Days, date: DateKey): number {
  return days[date]?.dm ?? 0;
}

export function totalDms(days: Days): number {
  return Object.values(days).reduce((sum, record) => sum + record.dm, 0);
}

/** Total contacted = the start count + all DMs in the hub. */
export function totalContacted(state: Pick<HubState, 'baseContacted' | 'days'>): number {
  return state.baseContacted + totalDms(state.days);
}

export function daysAtTarget(days: Days, target: number): number {
  if (target <= 0) {
    return 0;
  }
  return Object.values(days).filter((record) => record.dm >= target).length;
}

/**
 * Days in sequence where the test passes, counted back from today.
 * If today does not pass, the count starts from yesterday.
 */
export function runLength(passes: (date: DateKey) => boolean, today: DateKey, limit = 3660): number {
  let cursor = passes(today) ? today : addDays(today, -1);
  let count = 0;
  while (count < limit && passes(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** Days in sequence with dm at or above the target. */
export function dmStreak(days: Days, target: number, today: DateKey): number {
  if (target <= 0) {
    return 0;
  }
  return runLength((date) => dmOn(days, date) >= target, today);
}

/** Days in sequence that appear in the list of dates. */
export function dateStreak(dates: readonly DateKey[], today: DateKey): number {
  const set = new Set(dates);
  return runLength((date) => set.has(date), today);
}

/** Mean DMs for the 7 days that end today. */
export function sevenDayAverage(days: Days, today: DateKey): number {
  const window = rangeOfDays(addDays(today, -6), today);
  return window.reduce((sum, date) => sum + dmOn(days, date), 0) / window.length;
}

/** Total contacted at day 90 if the 7-day average continues. */
export function projectedTotal(
  state: Pick<HubState, 'baseContacted' | 'days' | 'startDate'>,
  today: DateKey,
  missionDays = 90,
): number {
  const day = dayNumber(today, state.startDate);
  const remaining = Math.min(missionDays, Math.max(0, missionDays - day));
  return Math.round(totalContacted(state) + sevenDayAverage(state.days, today) * remaining);
}

/**
 * True when dm is 0 for yesterday and for today,
 * and the first record is from yesterday or before.
 */
export function twoDayWarning(days: Days, today: DateKey): boolean {
  const yesterday = addDays(today, -1);
  const keys = Object.keys(days).sort();
  const first = keys[0];
  if (first === undefined || first > yesterday) {
    return false;
  }
  return dmOn(days, today) === 0 && dmOn(days, yesterday) === 0;
}

export interface SeriesPoint {
  date: DateKey;
  value: number;
}

/** One point for each of the last `length` days, ending today. */
export function dmSeries(days: Days, today: DateKey, length: number): SeriesPoint[] {
  return rangeOfDays(addDays(today, -(length - 1)), today).map((date) => ({
    date,
    value: dmOn(days, date),
  }));
}

export type MomentumState = 'active' | 'recover' | 'ended';

export interface Momentum {
  /** All days with the DM target met. This number never goes down. */
  daysOnTarget: number;
  /** Days on target in the current run. One missed day does not stop the run. */
  streak: number;
  /** The longest run. */
  best: number;
  state: MomentumState;
}

/**
 * The momentum of the DM habit.
 * One missed day puts the run in "recover": the streak stays, and a day on target continues it.
 * Two missed days in sequence end the run. Today does not count as missed while it is open.
 */
export function momentum(days: Days, today: DateKey, target: number): Momentum {
  const onTarget = (date: DateKey) => target > 0 && dmOn(days, date) >= target;
  const dates = Object.keys(days)
    .filter((date) => date <= today && onTarget(date))
    .sort();
  const daysOnTarget = dates.length;

  let best = 0;
  let run = 0;
  let previous: DateKey | null = null;
  for (const date of dates) {
    run = previous !== null && diffDays(date, previous) <= 2 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }

  const last = dates.at(-1);
  if (last === undefined) {
    return { daysOnTarget, streak: 0, best, state: 'ended' };
  }
  const gap = diffDays(today, last);
  if (gap <= 1) {
    return { daysOnTarget, streak: run, best, state: 'active' };
  }
  if (gap === 2) {
    return { daysOnTarget, streak: run, best, state: 'recover' };
  }
  return { daysOnTarget, streak: 0, best, state: 'ended' };
}
