import type { DateKey, HubState } from '@/store/types';
import { addDays, dateOfDay, rangeOfDays } from './dates';
import { pillarOfTask } from './pillars';
import { MISSION_DAYS } from './phases';
import { tasksForDate } from './status';
import { tradesInOrder } from './trading';
import { XP_VALUES } from './xp';

export const METRICS = ['dm', 'tasks', 'gym', 'learning', 'reading', 'r', 'xp'] as const;
export type Metric = (typeof METRICS)[number];

/** The metrics that have a target. Only these can share the "% of target" axis. */
export const COMPARE_METRICS = ['dm', 'tasks', 'gym', 'learning', 'reading'] as const;
export type CompareMetric = (typeof COMPARE_METRICS)[number];

/** All ranges. 14 is only for the history chart of an expanded pillar view. */
export const ALL_RANGES = [7, 14, 30, 90] as const;
export type Range = (typeof ALL_RANGES)[number];
/** The ranges that the chart controls offer. */
export const RANGES = [7, 30, 90] as const satisfies readonly Range[];
export type ControlRange = (typeof RANGES)[number];

export const MAX_COMPARE = 3;
export const MIN_COMPARE = 2;

export interface Point {
  date: DateKey;
  value: number | null;
}

export interface MetricInfo {
  /** The name in the metric menu. */
  label: string;
  /** The name on the menu button, where the room is small. */
  short: string;
  /** The plural noun for insight text, for example "DMs". */
  noun: string;
  /** The unit after a value, for example "DMs" or "%". */
  unit: string;
  /** True when the value is a sum over the last 7 days. */
  rolling: boolean;
}

export const METRIC_INFO: Readonly<Record<Metric, MetricInfo>> = {
  dm: { label: 'DMs', short: 'DMs', noun: 'DMs', unit: 'DMs', rolling: false },
  tasks: { label: 'Tasks done', short: 'Tasks', noun: 'Ticked tasks', unit: '%', rolling: false },
  gym: { label: 'Gym (7 days)', short: 'Gym', noun: 'Gym sessions', unit: 'sessions', rolling: true },
  learning: { label: 'Learning (7 days)', short: 'Learning', noun: 'Learning sessions', unit: 'sessions', rolling: true },
  reading: { label: 'Reading (7 days)', short: 'Reading', noun: 'Chapters', unit: 'chapters', rolling: true },
  r: { label: 'Result in R', short: 'R', noun: 'R', unit: 'R', rolling: false },
  xp: { label: 'XP', short: 'XP', noun: 'XP', unit: 'XP', rolling: false },
};

export function isMetric(value: unknown): value is Metric {
  return METRICS.some((metric) => metric === value);
}

export function isCompareMetric(value: unknown): value is CompareMetric {
  return COMPARE_METRICS.some((metric) => metric === value);
}

export function isRange(value: unknown): value is ControlRange {
  return RANGES.some((range) => range === value);
}

export type SeriesState = Pick<
  HubState,
  'days' | 'weekTemplate' | 'startDate' | 'fitness' | 'learning' | 'trades'
>;

export type TargetSettings = Pick<HubState, 'dmTarget' | 'fitTarget' | 'learnTarget'>;

const WINDOW = 7;

/** The dates on the x-axis. Range 90 is the full mission, day 1 to day 90. */
export function rangeDates(range: Range, today: DateKey, startDate: DateKey): DateKey[] {
  if (range === 90) {
    return rangeOfDays(startDate, dateOfDay(MISSION_DAYS, startDate));
  }
  return rangeOfDays(addDays(today, -(range - 1)), today);
}

function countIn(dates: readonly DateKey[], date: DateKey): number {
  const first = addDays(date, -(WINDOW - 1));
  return dates.filter((item) => item >= first && item <= date).length;
}

function readingTicks(state: SeriesState, date: DateKey): number {
  const done = state.days[date]?.done ?? {};
  return Object.keys(done).filter((task) => done[task] === true && pillarOfTask(task) === 'reading')
    .length;
}

/**
 * The XP of one day, from the dated sources only:
 * DMs × 5 + ticked tasks × 10 + a written win × 20 + gym sessions × 30 + learning sessions × 30.
 * Chapters, card reviews and milestones have no date in the record, so they are not in this value.
 */
export function dayXp(state: Pick<SeriesState, 'days' | 'fitness' | 'learning'>, date: DateKey): number {
  const record = state.days[date];
  const ticks = record ? Object.values(record.done).filter(Boolean).length : 0;
  const win = record && record.win.trim() !== '' ? 1 : 0;
  const gym = state.fitness.filter((session) => session.date === date).length;
  const learning = state.learning.filter((session) => session.date === date).length;
  return (
    (record?.dm ?? 0) * XP_VALUES.dm +
    ticks * XP_VALUES.task +
    win * XP_VALUES.win +
    gym * XP_VALUES.gym +
    learning * XP_VALUES.learning
  );
}

function valueOn(state: SeriesState, metric: Metric, date: DateKey): number | null {
  switch (metric) {
    case 'dm':
      return state.days[date]?.dm ?? 0;
    case 'tasks': {
      const tasks = tasksForDate(state.weekTemplate, date);
      if (tasks.length === 0) {
        return null;
      }
      const done = tasks.filter((task) => state.days[date]?.done[task] === true).length;
      return (done / tasks.length) * 100;
    }
    case 'gym':
      return countIn(
        state.fitness.map((session) => session.date),
        date,
      );
    case 'learning':
      return countIn(
        state.learning.map((session) => session.date),
        date,
      );
    case 'reading': {
      let sum = 0;
      for (let back = 0; back < WINDOW; back += 1) {
        sum += readingTicks(state, addDays(date, -back));
      }
      return sum;
    }
    case 'r':
      return tradesInOrder(state.trades)
        .filter((trade) => trade.date <= date)
        .reduce((total, trade) => total + trade.resultR, 0);
    case 'xp':
      return dayXp(state, date);
  }
}

/**
 * The first day with any recorded activity: a DM, a tick, a win, a session or a trade.
 * Null when the record holds no activity yet.
 */
export function firstActivity(state: SeriesState): DateKey | null {
  const dates: DateKey[] = [];
  for (const [date, record] of Object.entries(state.days)) {
    if (record.dm > 0 || record.win.trim() !== '' || Object.values(record.done).some(Boolean)) {
      dates.push(date);
    }
  }
  dates.push(...state.fitness.map((session) => session.date));
  dates.push(...state.learning.map((session) => session.date));
  dates.push(...state.trades.map((trade) => trade.date));
  return dates.length === 0 ? null : dates.reduce((first, date) => (date < first ? date : first));
}

/** The first day that has a value: the later of the start date and the first activity. */
function firstValueDay(state: SeriesState): DateKey | null {
  const first = firstActivity(state);
  if (first === null) {
    return null;
  }
  return first > state.startDate ? first : state.startDate;
}

/**
 * One point for each day of the range.
 * Days before the start date, before the first recorded activity and after today give null, never 0.
 */
export function dailySeries(
  state: SeriesState,
  metric: Metric,
  range: Range,
  today: DateKey,
): Point[] {
  const from = firstValueDay(state);
  return rangeDates(range, today, state.startDate).map((date) => ({
    date,
    value: from === null || date < from || date > today ? null : valueOn(state, metric, date),
  }));
}

/** Reading ticks for each day, not summed. Used for the reading projection. */
export function dailyReadingTicks(state: SeriesState, range: Range, today: DateKey): Point[] {
  const from = firstValueDay(state);
  return rangeDates(range, today, state.startDate).map((date) => ({
    date,
    value: from === null || date < from || date > today ? null : readingTicks(state, date),
  }));
}

/** The target of a metric in its own unit. R and XP have no target. */
export function targetOf(metric: Metric, settings: TargetSettings): number | null {
  switch (metric) {
    case 'dm':
      return settings.dmTarget;
    case 'tasks':
      return 100;
    case 'gym':
      return settings.fitTarget;
    case 'learning':
      return settings.learnTarget;
    case 'reading':
      return WINDOW;
    case 'r':
    case 'xp':
      return null;
  }
}

export const NORMALISE_MAX = 150;

/** A value as a percentage of its own target, held between 0 and 150. */
export function normalise(metric: CompareMetric, value: number, settings: TargetSettings): number {
  const target = targetOf(metric, settings) ?? 0;
  if (target <= 0 || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(NORMALISE_MAX, Math.max(0, (value / target) * 100));
}

/** The mean of the non-null values in a window that ends at each point. A null point stays null. */
export function rollingMean(points: readonly Point[], size: number): Point[] {
  return points.map((point, index) => {
    if (point.value === null) {
      return { date: point.date, value: null };
    }
    const window = points
      .slice(Math.max(0, index - size + 1), index + 1)
      .map((item) => item.value)
      .filter((value): value is number => value !== null);
    const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
    return { date: point.date, value: mean };
  });
}

export function nonNull(points: readonly Point[]): number[] {
  return points.map((point) => point.value).filter((value): value is number => value !== null);
}

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * The dashed line after today: the mean of the last 7 days goes on for a daily metric.
 * For cumulative R the mean daily change goes on.
 */
export function projection(points: readonly Point[], metric: Metric, today: DateKey): Point[] {
  const past = points.filter((point) => point.date <= today && point.value !== null);
  const last = past.slice(-WINDOW);
  const level = mean(nonNull(last));
  if (level === null || !points.some((point) => point.date > today)) {
    return [];
  }
  const anchor = past.at(-1);
  if (!anchor || anchor.value === null) {
    return [];
  }
  const end = anchor.value;
  const first = last[0]?.value ?? end;
  const step = last.length > 1 ? (end - first) / (last.length - 1) : 0;
  const future = points.filter((point) => point.date > today);
  return [
    { date: anchor.date, value: metric === 'r' ? end : level },
    ...future.map((point, index) => ({
      date: point.date,
      value: metric === 'r' ? end + step * (index + 1) : level,
    })),
  ];
}

export interface CompareSeries {
  metric: CompareMetric;
  points: Point[];
}

/** The metrics as "% of target", for the compare mode. */
export function compareSeries(
  state: SeriesState,
  metrics: readonly CompareMetric[],
  range: Range,
  today: DateKey,
  settings: TargetSettings,
): CompareSeries[] {
  return metrics.slice(0, MAX_COMPARE).map((metric) => ({
    metric,
    points: dailySeries(state, metric, range, today).map((point) => ({
      date: point.date,
      value: point.value === null ? null : normalise(metric, point.value, settings),
    })),
  }));
}

/** The range to show first: 7 days in the first week of the mission, else 30 days. */
export function defaultRange(missionDay: number): Range {
  return missionDay < 8 ? 7 : 30;
}
