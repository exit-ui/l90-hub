import type { DateKey } from '@/store/types';
import { weekdayOf } from './dates';
import { formatInteger } from './format';
import { MISSION_DAYS } from './phases';
import {
  type CompareSeries,
  mean,
  METRIC_INFO,
  type Metric,
  nonNull,
  type Point,
  type Range,
  targetOf,
  type TargetSettings,
} from './progressSeries';

export type InsightKind = 'gap' | 'change' | 'weekday' | 'projection' | 'weakest';

export interface Insight {
  kind: InsightKind;
  text: string;
}

export interface InsightOptions {
  range?: Range;
  /** The series of the compare mode, in "% of target". */
  compare?: readonly CompareSeries[];
  /** Reading ticks for each day, for the reading projection. */
  dailyReading?: readonly Point[];
}

/** Fewer values than this give no insight. */
export const MIN_VALUES = 4;
const PERIOD = 7;

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** The weekday rule needs values that are the result of one day, not a sum of 7 days. */
const DAILY_METRICS: readonly Metric[] = ['dm', 'tasks', 'xp'];

function round(value: number): number {
  return Math.round(value);
}

function oneDecimal(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}

function upTo(points: readonly Point[], today: DateKey): Point[] {
  return points.filter((point) => point.date <= today);
}

function gapInsight(points: readonly Point[], metric: Metric, settings: TargetSettings): Insight | null {
  const target = targetOf(metric, settings);
  const average = mean(nonNull(points));
  if (target === null || average === null || average >= target) {
    return null;
  }
  switch (metric) {
    case 'dm': {
      const shown = Math.floor(average);
      return {
        kind: 'gap',
        text: `You average ${shown} of ${target} DMs. Send ${target - shown} more each day to hit the target.`,
      };
    }
    case 'tasks':
      return {
        kind: 'gap',
        text: `You tick ${round(average)} % of your tasks on average. The target is 100 %.`,
      };
    case 'gym':
      return {
        kind: 'gap',
        text: `You average ${oneDecimal(average)} gym sessions each week. Add ${Math.ceil(target - average)} more to hit ${target}.`,
      };
    case 'learning':
      return {
        kind: 'gap',
        text: `You average ${oneDecimal(average)} learning sessions each week. Add ${Math.ceil(target - average)} more to hit ${target}.`,
      };
    case 'reading':
      return {
        kind: 'gap',
        text: `You read ${oneDecimal(average)} chapters each week. Read 1 chapter each day to hit ${target}.`,
      };
    case 'r':
    case 'xp':
      return null;
  }
}

function changeInsight(points: readonly Point[], metric: Metric): Insight | null {
  if (metric === 'r' || points.length < PERIOD * 2) {
    return null;
  }
  const current = nonNull(points.slice(-PERIOD));
  const previous = nonNull(points.slice(-PERIOD * 2, -PERIOD));
  if (current.length < MIN_VALUES || previous.length < MIN_VALUES) {
    return null;
  }
  const now = mean(current) ?? 0;
  const before = mean(previous) ?? 0;
  const noun = METRIC_INFO[metric].noun;
  if (before === 0) {
    return now > 0
      ? { kind: 'change', text: `${noun} are up from 0 on the previous 7 days.` }
      : null;
  }
  const percent = round(((now - before) / before) * 100);
  if (percent === 0) {
    return { kind: 'change', text: `${noun} are level with the previous 7 days.` };
  }
  const direction = percent > 0 ? 'up' : 'down';
  return {
    kind: 'change',
    text: `${noun} are ${direction} ${Math.abs(percent)} % on the previous 7 days.`,
  };
}

function weekdayInsight(points: readonly Point[], metric: Metric): Insight | null {
  if (!DAILY_METRICS.includes(metric)) {
    return null;
  }
  const buckets: number[][] = [[], [], [], [], [], [], []];
  for (const point of points) {
    if (point.value !== null) {
      buckets[weekdayOf(point.date)]?.push(point.value);
    }
  }
  if (buckets.some((bucket) => bucket.length < 2)) {
    return null;
  }
  const means = buckets.map((bucket) => mean(bucket) ?? 0);
  const ranked = means.map((value, weekday) => ({ value, weekday })).sort((a, b) => b.value - a.value);
  const top = ranked[0];
  const runnerUp = ranked[1];
  // A best day must be a real lead: above 0 and above the next day after rounding.
  if (!top || !runnerUp || top.value <= 0 || round(top.value) <= round(runnerUp.value)) {
    return null;
  }
  const best = top.weekday;
  const bestMean = top.value;
  const name = WEEKDAY_NAMES[best] ?? 'Monday';
  switch (metric) {
    case 'dm':
      return { kind: 'weekday', text: `${name} is your best DM day: ${round(bestMean)} on average.` };
    case 'tasks':
      return {
        kind: 'weekday',
        text: `${name} is your best task day: ${round(bestMean)} % on average.`,
      };
    default:
      return {
        kind: 'weekday',
        text: `${name} is your best XP day: ${formatInteger(round(bestMean))} on average.`,
      };
  }
}

function projectionInsight(
  daily: readonly Point[],
  all: readonly Point[],
  metric: Metric,
  settings: TargetSettings,
  today: DateKey,
): Insight | null {
  const past = nonNull(upTo(daily, today));
  if (past.length < MIN_VALUES) {
    return null;
  }
  const total = past.reduce((sum, value) => sum + value, 0);
  const pace = mean(past.slice(-PERIOD)) ?? 0;
  const daysLeft = all.filter((point) => point.date > today).length;
  const projected = round(total + pace * daysLeft);
  if (metric === 'dm') {
    return {
      kind: 'projection',
      text: `At this pace you reach ${formatInteger(projected)} DMs on day ${MISSION_DAYS}. The goal is ${formatInteger(settings.dmTarget * MISSION_DAYS)}.`,
    };
  }
  return {
    kind: 'projection',
    text: `At this pace you read ${formatInteger(projected)} chapters by day ${MISSION_DAYS}. The goal is ${MISSION_DAYS}.`,
  };
}

function weakestInsight(compare: readonly CompareSeries[]): Insight | null {
  const scored = compare
    .map((series) => ({ metric: series.metric, value: mean(nonNull(series.points.slice(-PERIOD))) }))
    .filter((item): item is { metric: CompareSeries['metric']; value: number } => item.value !== null);
  if (scored.length < 2) {
    return null;
  }
  const weakest = scored.reduce((low, item) => (item.value < low.value ? item : low));
  const name = PILLAR_NAMES[weakest.metric];
  return {
    kind: 'weakest',
    text: `${name} is your lowest pillar this week: ${round(weakest.value)} % of target.`,
  };
}

const PILLAR_NAMES: Readonly<Record<CompareSeries['metric'], string>> = {
  dm: 'Outreach',
  tasks: 'The task list',
  gym: 'Fitness',
  learning: 'Learning',
  reading: 'Reading',
};

/**
 * Short findings about the visible chart, most useful first. The card shows the first 2.
 * A rule that has too little data gives no finding. The hub never invents a finding.
 */
export function chartInsights(
  series: readonly Point[],
  metric: Metric,
  settings: TargetSettings,
  today: DateKey,
  options: InsightOptions = {},
): Insight[] {
  const past = upTo(series, today);
  const insights: (Insight | null)[] = [];
  if (options.compare && options.compare.length > 0) {
    insights.push(weakestInsight(options.compare.map((item) => ({ ...item, points: upTo(item.points, today) }))));
  }
  if (nonNull(past).length >= MIN_VALUES) {
    insights.push(gapInsight(past, metric, settings));
    insights.push(changeInsight(past, metric));
    insights.push(weekdayInsight(past, metric));
    if (options.range === 90 && metric === 'dm') {
      insights.push(projectionInsight(series, series, metric, settings, today));
    }
    if (options.range === 90 && metric === 'reading' && options.dailyReading) {
      insights.push(projectionInsight(options.dailyReading, series, metric, settings, today));
    }
  }
  return insights.filter((insight): insight is Insight => insight !== null);
}

/** Words in one sentence. Used to keep each insight at 20 words or fewer. */
export function longestSentence(text: string): number {
  return Math.max(
    0,
    ...text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.split(/\s+/).filter((word) => word !== '').length),
  );
}

function formatValue(metric: Metric, value: number, percent: boolean): string {
  if (percent) {
    return `${round(value)} % of target`;
  }
  if (metric === 'r') {
    return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(1)} R`;
  }
  if (metric === 'tasks') {
    return `${round(value)} %`;
  }
  return `${formatInteger(round(value))} ${METRIC_INFO[metric].unit}`;
}

/** The text alternative of the chart: metric, range, last value, mean and trend. */
export function chartSummary(
  series: readonly Point[],
  metric: Metric,
  range: Range,
  today: DateKey,
  /** True in compare mode, where each value is a percentage of its target. */
  percent = false,
): string {
  const info = METRIC_INFO[metric];
  const head = range === 90 ? `${info.label}, mission days 1 to ${MISSION_DAYS}.` : `${info.label}, last ${range} days.`;
  const values = nonNull(upTo(series, today));
  const last = values.at(-1);
  const average = mean(values);
  if (last === undefined || average === null) {
    return `${head} There is no data yet.`;
  }
  const half = Math.floor(values.length / 2);
  const early = mean(values.slice(0, half));
  const late = mean(values.slice(half));
  let trend = 'level';
  if (early !== null && late !== null && values.length >= MIN_VALUES) {
    const spread = Math.max(1, Math.abs(early)) * 0.05;
    trend = late - early > spread ? 'up' : early - late > spread ? 'down' : 'level';
  }
  return `${head} Last value ${formatValue(metric, last, percent)}. Mean ${formatValue(metric, average, percent)}. Trend ${trend}.`;
}
