import type { DateKey } from '@/store/types';
import { formatInteger } from './format';
import { chartInsights, chartSummary, type Insight } from './insights';
import {
  type CompareMetric,
  compareSeries,
  dailyReadingTicks,
  dailySeries,
  METRIC_INFO,
  type Metric,
  type Point,
  projection,
  type Range,
  rollingMean,
  type SeriesState,
  targetOf,
  type TargetSettings,
} from './progressSeries';

export const MAX_INSIGHTS = 2;

/** The colour token and dash of each compare line, in order. Colour is not the only cue. */
export const COMPARE_STYLES: readonly { color: string; dash?: string }[] = [
  { color: 'var(--hub-accent)' },
  { color: 'var(--hub-amber)', dash: '8 5' },
  { color: 'var(--hub-positive)', dash: '2 5' },
];

export interface ModelLine {
  key: string;
  label: string;
  points: Point[];
  color: string;
  dash?: string;
  width?: number;
  area?: boolean;
}

export interface TableRow {
  date: DateKey;
  values: (number | null)[];
}

export interface ChartModel {
  mode: 'single' | 'compare';
  bars: Point[];
  lines: ModelLine[];
  projection: Point[];
  reference: { value: number; label: string } | null;
  insights: Insight[];
  summary: string;
  yAxisLabel: string | null;
  /** The column names of the data table. */
  columns: string[];
  rows: TableRow[];
}

export interface ChartRequest {
  metric: Metric;
  range: Range;
  /** The compare metrics. Compare mode is on when the list is not empty. */
  compare: readonly CompareMetric[];
}

function formatTarget(metric: Metric, value: number): string {
  return metric === 'tasks' ? `${value} %` : formatInteger(value);
}

/** Everything that the chart card shows, from the record and the filters. */
export function chartModel(
  state: SeriesState,
  settings: TargetSettings,
  request: ChartRequest,
  today: DateKey,
): ChartModel {
  const { metric, range, compare } = request;
  if (compare.length > 0) {
    const series = compareSeries(state, compare, range, today, settings);
    const lines = series.map((item, index) => ({
      key: item.metric,
      label: METRIC_INFO[item.metric].label,
      points: item.points,
      ...(COMPARE_STYLES[index] ?? { color: 'var(--hub-accent)' }),
      width: 2,
    }));
    const primary = series[0]?.points ?? [];
    return {
      mode: 'compare',
      bars: [],
      lines,
      projection: [],
      reference: { value: 100, label: '100 %' },
      insights: chartInsights(primary, compare[0] ?? 'dm', settings, today, { range, compare: series }).slice(
        0,
        MAX_INSIGHTS,
      ),
      summary: `Compare mode, % of target: ${lines.map((line) => line.label).join(', ')}. ${chartSummary(primary, compare[0] ?? 'dm', range, today, true)}`,
      yAxisLabel: '% of target',
      columns: lines.map((line) => `${line.label} (% of target)`),
      rows: primary.map((point, index) => ({
        date: point.date,
        values: series.map((item) => item.points[index]?.value ?? null),
      })),
    };
  }

  const points = dailySeries(state, metric, range, today);
  const target = targetOf(metric, settings);
  const info = METRIC_INFO[metric];
  // A rolling count and the cumulative R read as a level: a line with a soft area, not bars.
  const asLevel = info.rolling || metric === 'r';
  let lines: ModelLine[];
  if (asLevel) {
    lines = [{ key: metric, label: info.label, points, color: 'var(--hub-chart-mean)', width: 2, area: true }];
  } else if (range === 7) {
    lines = [];
  } else {
    lines = [{ key: 'mean', label: '7-day mean', points: rollingMean(points, 7), color: 'var(--hub-chart-mean)', width: 2 }];
  }
  return {
    mode: 'single',
    bars: asLevel ? [] : points,
    lines,
    projection: range === 90 ? projection(points, metric, today) : [],
    reference: target === null ? null : { value: target, label: `Target ${formatTarget(metric, target)}` },
    insights: chartInsights(points, metric, settings, today, {
      range,
      dailyReading: metric === 'reading' ? dailyReadingTicks(state, range, today) : undefined,
    }).slice(0, MAX_INSIGHTS),
    summary: chartSummary(points, metric, range, today),
    yAxisLabel: null,
    columns: [info.label],
    rows: points.map((point) => ({ date: point.date, values: [point.value] })),
  };
}

/** The label format of the chart values: a percentage, a signed R value or a whole number. */
export function chartValueFormat(metric: Metric, compare: boolean): (value: number) => string {
  return (value: number) => {
    if (compare || metric === 'tasks') {
      return `${formatInteger(value)}%`;
    }
    if (metric === 'r') {
      return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}`;
    }
    return formatInteger(value);
  };
}
