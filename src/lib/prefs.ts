import {
  type CompareMetric,
  isCompareMetric,
  isMetric,
  isRange,
  MAX_COMPARE,
  type Metric,
  MIN_COMPARE,
  type Range,
} from './progressSeries';

/** Device settings. They live in this browser only and are not part of the hub record. */
export const CHART_PREFS_KEY = 'l90-hub-chart';

export interface ChartPrefs {
  metric: Metric;
  /** Null until the user picks a range. Then the default range by mission day applies. */
  range: Range | null;
  compare: CompareMetric[];
  compareOn: boolean;
}

export const DEFAULT_CHART_PREFS: ChartPrefs = {
  metric: 'dm',
  range: null,
  compare: ['dm', 'tasks'],
  compareOn: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Reads the chart settings from unknown JSON. Each wrong field gets its default. */
export function parseChartPrefs(raw: string | null): ChartPrefs {
  if (!raw) {
    return { ...DEFAULT_CHART_PREFS };
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_CHART_PREFS };
  }
  if (!isRecord(value)) {
    return { ...DEFAULT_CHART_PREFS };
  }
  const compare = Array.isArray(value.compare)
    ? [...new Set(value.compare.filter(isCompareMetric))].slice(0, MAX_COMPARE)
    : [];
  return {
    metric: isMetric(value.metric) ? value.metric : DEFAULT_CHART_PREFS.metric,
    range: isRange(value.range) ? value.range : null,
    compare: compare.length >= MIN_COMPARE ? compare : [...DEFAULT_CHART_PREFS.compare],
    compareOn: value.compareOn === true,
  };
}

/**
 * Adds or removes one metric of the compare mode.
 * The list keeps 2 to 3 metrics, so a change that breaks the limit does nothing.
 */
export function toggleCompare(list: readonly CompareMetric[], metric: CompareMetric): CompareMetric[] {
  if (list.includes(metric)) {
    return list.length <= MIN_COMPARE ? [...list] : list.filter((item) => item !== metric);
  }
  return list.length >= MAX_COMPARE ? [...list] : [...list, metric];
}

export function readDevice(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeDevice(key: string, value: unknown): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // The browser can refuse the write, for example in a private window. The setting then lasts for this visit.
  }
}
