import type { DateKey, HubState } from '@/store/types';
import { addDays } from './dates';
import { formatDecimal } from './format';
import { pillarOfTask } from './pillars';
import { rangeDates } from './progressSeries';
import type { Route } from './routes';

/**
 * The analytics of one pillar on Progress (v3): a metric, a range, the daily values, the stats and a breakdown.
 * Everything comes from the stored record. A pillar shows only the metrics the record holds.
 */
export const ANALYTICS_PILLARS = ['outreach', 'fitness', 'learning', 'reading', 'trading'] as const;
export type AnalyticsPillar = (typeof ANALYTICS_PILLARS)[number];

export const ANALYTICS_RANGES = [7, 30, 90] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export type AnalyticsState = Pick<
  HubState,
  'days' | 'startDate' | 'fitness' | 'learning' | 'trades' | 'chapterNotes' | 'funnel' | 'dmTarget' | 'chartCheckLimit'
>;

export interface AnalyticsMetric {
  id: string;
  label: string;
  /** The unit after a value, with its leading space, for example " min". Empty for a count. */
  unit: string;
  /** The daily goal, or null when the metric has none. */
  goal: number | null;
  /** True when a value can be below zero (R). */
  signed: boolean;
}

export function isAnalyticsPillar(value: unknown): value is AnalyticsPillar {
  return ANALYTICS_PILLARS.some((pillar) => pillar === value);
}

/** The pillar whose analytics are open: #/progress/pillar/<id>. Null for any other route. */
export function analyticsFrom(route: Route): AnalyticsPillar | null {
  const [first, second] = route.segments;
  return route.page === 'progress' && first === 'pillar' && isAnalyticsPillar(second) ? second : null;
}

/** The metrics of a pillar, in chip order. The first is the default. */
export function metricsOf(pillar: AnalyticsPillar, state: Pick<AnalyticsState, 'dmTarget'>): AnalyticsMetric[] {
  switch (pillar) {
    case 'outreach':
      return [{ id: 'dm', label: 'DMs', unit: '', goal: state.dmTarget > 0 ? state.dmTarget : null, signed: false }];
    case 'fitness':
      return [
        { id: 'sessions', label: 'Sessions', unit: '', goal: null, signed: false },
        { id: 'minutes', label: 'Minutes', unit: ' min', goal: null, signed: false },
      ];
    case 'learning':
      return [
        { id: 'minutes', label: 'Minutes', unit: ' min', goal: null, signed: false },
        { id: 'sessions', label: 'Sessions', unit: '', goal: null, signed: false },
      ];
    case 'reading':
      return [
        { id: 'chapters', label: 'Chapters', unit: '', goal: null, signed: false },
        { id: 'ticks', label: 'Reading ticks', unit: '', goal: null, signed: false },
      ];
    case 'trading':
      return [
        { id: 'r', label: 'Result', unit: ' R', goal: null, signed: true },
        { id: 'trades', label: 'Trades', unit: '', goal: null, signed: false },
        { id: 'checks', label: 'Chart checks', unit: '', goal: null, signed: false },
      ];
  }
}

/** The value of one metric on one day. */
export function valueOn(state: AnalyticsState, pillar: AnalyticsPillar, metric: string, date: DateKey): number {
  switch (pillar) {
    case 'outreach':
      return state.days[date]?.dm ?? 0;
    case 'fitness':
    case 'learning': {
      const sessions = state[pillar].filter((session) => session.date === date);
      return metric === 'minutes' ? sessions.reduce((sum, session) => sum + session.minutes, 0) : sessions.length;
    }
    case 'reading': {
      if (metric === 'ticks') {
        const done = state.days[date]?.done ?? {};
        return Object.keys(done).filter((task) => done[task] === true && pillarOfTask(task) === 'reading').length;
      }
      return state.chapterNotes.filter((note) => note.date === date).length;
    }
    case 'trading': {
      if (metric === 'checks') {
        return state.days[date]?.chartChecks ?? 0;
      }
      const trades = state.trades.filter((trade) => trade.date === date);
      return metric === 'trades' ? trades.length : trades.reduce((sum, trade) => sum + trade.resultR, 0);
    }
  }
}

export interface AnalyticsPoint {
  date: DateKey;
  /** Null before the start date and after today. */
  value: number | null;
}

export interface PillarStats {
  points: AnalyticsPoint[];
  total: number;
  /** The mean of the counted days (from the start date to today), or 0. */
  average: number;
  best: number;
  /** Days that met the goal; null when the metric has no goal. */
  goalHits: number | null;
  /** Days with a value above 0 (any activity). */
  activeDays: number;
  counted: number;
  /** Days in a row up to today that met the goal (or had any activity without a goal). */
  streak: number;
  /** The change of the total against the same number of days before, in %, or null without data before. */
  change: number | null;
  /** The total of the same number of days before, or null for the whole mission or without days before. */
  previous: number | null;
}

function points(state: AnalyticsState, pillar: AnalyticsPillar, metric: string, dates: readonly DateKey[], today: DateKey): AnalyticsPoint[] {
  return dates.map((date) => ({
    date,
    value: date < state.startDate || date > today ? null : valueOn(state, pillar, metric, date),
  }));
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** The stats of one metric over a range. Range 90 is the whole mission, day 1 to day 90. Pure. */
export function pillarStats(
  state: AnalyticsState,
  pillar: AnalyticsPillar,
  metric: AnalyticsMetric,
  range: AnalyticsRange,
  today: DateKey,
): PillarStats {
  const dates = rangeDates(range, today, state.startDate);
  const list = points(state, pillar, metric.id, dates, today);
  const values = list.flatMap((point) => (point.value === null ? [] : [point.value]));
  const total = sum(values);
  const met = (value: number) => (metric.goal === null ? value > 0 : value >= metric.goal);

  let streak = 0;
  for (let index = values.length - 1; index >= 0 && met(values[index] ?? 0); index -= 1) {
    streak += 1;
  }

  let change: number | null = null;
  let previous: number | null = null;
  if (range !== 90) {
    const before = rangeDates(range, addDays(today, -range), state.startDate).filter((date) => date >= state.startDate);
    if (before.length > 0) {
      previous = sum(before.map((date) => valueOn(state, pillar, metric.id, date)));
      change = previous === 0 ? null : Math.round(((total - previous) / Math.abs(previous)) * 100);
    }
  }

  return {
    points: list,
    total,
    average: values.length > 0 ? total / values.length : 0,
    best: values.length > 0 ? Math.max(...values) : 0,
    goalHits: metric.goal === null ? null : values.filter((value) => value >= (metric.goal ?? 0)).length,
    activeDays: values.filter((value) => value > 0).length,
    counted: values.length,
    streak,
    change,
    previous,
  };
}

export interface BreakdownRow {
  label: string;
  value: number;
  text: string;
}

export interface Breakdown {
  title: string;
  rows: BreakdownRow[];
  /** A short line under the rows, or null. */
  note: string | null;
}

function inRange(date: DateKey, dates: readonly DateKey[], today: DateKey): boolean {
  const first = dates[0] ?? today;
  return date >= first && date <= today;
}

function grouped(items: readonly { key: string; value: number }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.key, (map.get(item.key) ?? 0) + item.value);
  }
  return map;
}

function rowsOf(map: Map<string, number>, format: (value: number) => string): BreakdownRow[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, text: format(value) }));
}

/** The breakdown of a pillar over a range: where the work went. Pure. */
export function pillarBreakdown(state: AnalyticsState, pillar: AnalyticsPillar, range: AnalyticsRange, today: DateKey): Breakdown {
  const dates = rangeDates(range, today, state.startDate);
  switch (pillar) {
    case 'outreach': {
      const { sourced, replied, booked, closed } = state.funnel;
      return {
        title: 'Funnel, all time',
        rows: [
          { label: 'Sourced', value: sourced, text: String(sourced) },
          { label: 'Replied', value: replied, text: String(replied) },
          { label: 'Booked', value: booked, text: String(booked) },
          { label: 'Closed', value: closed, text: String(closed) },
        ],
        note: sourced > 0 ? `${formatDecimal((replied / sourced) * 100)} % reply rate.` : null,
      };
    }
    case 'fitness':
    case 'learning': {
      const sessions = state[pillar].filter((session) => inRange(session.date, dates, today));
      const map = grouped(sessions.map((session) => ({ key: session.type || 'Other', value: pillar === 'fitness' ? 1 : session.minutes })));
      return {
        title: pillar === 'fitness' ? 'Session types' : 'Time by subject',
        rows: rowsOf(map, (value) => (pillar === 'fitness' ? `${value}` : `${formatDecimal(value / 60)} h`)),
        note: null,
      };
    }
    case 'reading': {
      const notes = state.chapterNotes.filter((note) => inRange(note.date, dates, today));
      return {
        title: 'Books',
        rows: rowsOf(grouped(notes.map((note) => ({ key: note.book || 'Other', value: 1 }))), (value) => `${value} ch`),
        note: null,
      };
    }
    case 'trading': {
      const trades = state.trades.filter((trade) => inRange(trade.date, dates, today));
      const wins = trades.filter((trade) => trade.resultR > 0).length;
      const losses = trades.filter((trade) => trade.resultR < 0).length;
      const even = trades.length - wins - losses;
      const rules = trades.filter((trade) => trade.followedRules).length;
      return {
        title: 'Outcomes',
        rows: [
          { label: 'Wins', value: wins, text: String(wins) },
          { label: 'Losses', value: losses, text: String(losses) },
          { label: 'Break-even', value: even, text: String(even) },
        ],
        note: trades.length > 0 ? `Rules followed in ${rules} of ${trades.length} trades.` : null,
      };
    }
  }
}

/** A value for a stat or a bar label: whole counts stay whole, others get one decimal, R gets a sign. */
export function formatValue(value: number, metric: AnalyticsMetric): string {
  const rounded = Number.isInteger(value) ? String(value) : formatDecimal(value);
  const text = metric.signed && value > 0 ? `+${rounded}` : rounded;
  return `${text}${metric.unit}`;
}
