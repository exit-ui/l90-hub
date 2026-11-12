import type { DateKey, HubState } from '@/store/types';
import { addDays, dayNumber, formatShort, formatWeekdayShort } from './dates';
import { rate } from './funnel';
import { formatDecimal, parseWhole } from './format';
import { MISSION_DAYS } from './phases';
import {
  daysAtTarget,
  dmSeries,
  dmStreak,
  projectedTotal,
  sevenDayAverage,
  totalContacted,
  totalDms,
} from './streak';
import { type ChartPoint, fractionOf } from './summary';

export const OVERVIEW_CHART_DAYS = 30;
const SPARK_DAYS = 14;

export interface OutreachOverview {
  total: number;
  contacted: number;
  target: number;
  atTarget: number;
  atTargetFraction: number;
  streak: number;
  streakFraction: number;
  average: number;
  averageFraction: number;
  projected: number;
  projectedFraction: number;
  missionDays: number;
  /** DMs for each of the last 30 days. */
  series: ChartPoint[];
  /** DMs for each of the last 14 days. */
  spark: ChartPoint[];
}

type OverviewInput = Pick<HubState, 'days' | 'dmTarget' | 'baseContacted' | 'startDate'>;

/** The values for the Overview tab of the Outreach page. */
export function outreachOverview(state: OverviewInput, today: DateKey): OutreachOverview {
  const series = dmSeries(state.days, today, OVERVIEW_CHART_DAYS).map((point) => ({
    label: point.date,
    value: point.value,
  }));
  const atTarget = daysAtTarget(state.days, state.dmTarget);
  const streak = dmStreak(state.days, state.dmTarget, today);
  const average = sevenDayAverage(state.days, today);
  const contacted = totalContacted(state);
  const projected = projectedTotal(state, today, MISSION_DAYS);
  return {
    total: totalDms(state.days),
    contacted,
    target: state.dmTarget,
    atTarget,
    atTargetFraction: fractionOf(atTarget, MISSION_DAYS),
    streak,
    streakFraction: fractionOf(streak, MISSION_DAYS),
    average,
    averageFraction: fractionOf(average, state.dmTarget),
    projected,
    projectedFraction: fractionOf(contacted, projected),
    missionDays: MISSION_DAYS,
    series,
    spark: series.slice(-SPARK_DAYS),
  };
}

/** The Instagram profile of a seed account. */
export function seedHref(handle: string): string {
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}

/**
 * The text that a number field shows. The field keeps the text of the user
 * while the text agrees with the stored value.
 */
export function fieldText(draft: string, stored: number): string {
  return parseWhole(draft) === stored ? draft : String(stored);
}

/** The time ranges of the Outreach bar chart. */
export const OUTREACH_RANGES = ['week', 'month', 'mission'] as const;
export type OutreachRange = (typeof OUTREACH_RANGES)[number];
export const OUTREACH_RANGE_LABELS: Readonly<Record<OutreachRange, string>> = {
  week: 'Week',
  month: 'Month',
  mission: '90 days',
};

export interface OutreachBar {
  /** The short label under the bar, for example "M" or "W2". */
  label: string;
  /** DMs a day in the period. Null for a period that has not started yet. */
  value: number | null;
  /** The full text for a screen reader, for example "Mon 9 Nov: 18 DMs". */
  text: string;
}

export interface OutreachBars {
  bars: OutreachBar[];
  /** The mean DMs a day over the range, days before the start not counted. */
  average: number;
  /** One line about the change against the period before, or the mission day. */
  change: { text: string; trend: 'up' | 'down' | 'flat' } | null;
  target: number;
  /** The text alternative of the chart. */
  summary: string;
}

type BarsInput = Pick<HubState, 'days' | 'dmTarget' | 'startDate'>;

/** The mean DMs a day from `first` to `last`. Days before the start and after today do not count. */
function meanDms(state: BarsInput, first: DateKey, last: DateKey, today: DateKey): number | null {
  let sum = 0;
  let count = 0;
  for (let date = first; date <= last; date = addDays(date, 1)) {
    if (date < state.startDate || date > today) {
      continue;
    }
    sum += state.days[date]?.dm ?? 0;
    count += 1;
  }
  return count === 0 ? null : sum / count;
}

function percentChange(now: number | null, before: number | null, period: string): OutreachBars['change'] {
  if (now === null || before === null) {
    return null;
  }
  if (before === 0) {
    return now > 0 ? { text: `Up from 0 ${period}`, trend: 'up' } : null;
  }
  const change = Math.round(((now - before) / before) * 100);
  if (change === 0) {
    return { text: `Same as ${period}`, trend: 'flat' };
  }
  return change > 0
    ? { text: `↑ ${change}% vs ${period}`, trend: 'up' }
    : { text: `↓ ${-change}% vs ${period}`, trend: 'down' };
}

const MISSION_WEEKS = 13;

/** The bars of the Outreach chart: DMs a day for each day of the week, each week of the month or each mission week. Pure. */
export function outreachBars(state: BarsInput, today: DateKey, range: OutreachRange): OutreachBars {
  const target = state.dmTarget;
  let bars: OutreachBar[];
  let average: number | null;
  let change: OutreachBars['change'];
  if (range === 'week') {
    const first = addDays(today, -6);
    bars = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(first, index);
      const value = date < state.startDate ? null : (state.days[date]?.dm ?? 0);
      return {
        label: formatWeekdayShort(date).slice(0, 1),
        value,
        text: `${formatWeekdayShort(date)} ${formatShort(date)}: ${value === null ? 'before the start' : `${value} DMs`}`,
      };
    });
    average = meanDms(state, first, today, today);
    change = percentChange(average, meanDms(state, addDays(first, -7), addDays(first, -1), today), 'last week');
  } else if (range === 'month') {
    const first = addDays(today, -27);
    bars = Array.from({ length: 4 }, (_, index) => {
      const from = addDays(first, index * 7);
      const value = meanDms(state, from, addDays(from, 6), today);
      return {
        label: `W${index + 1}`,
        value,
        text: `Week ${index + 1} from ${formatShort(from)}: ${value === null ? 'before the start' : `${formatDecimal(value)} DMs a day`}`,
      };
    });
    average = meanDms(state, first, today, today);
    change = percentChange(average, meanDms(state, addDays(first, -28), addDays(first, -1), today), 'last month');
  } else {
    bars = Array.from({ length: MISSION_WEEKS }, (_, index) => {
      const from = addDays(state.startDate, index * 7);
      const value = from > today ? null : meanDms(state, from, addDays(from, 6), today);
      return {
        label: String(index + 1),
        value,
        text: `Mission week ${index + 1}: ${value === null ? 'ahead' : `${formatDecimal(value)} DMs a day`}`,
      };
    });
    average = meanDms(state, state.startDate, addDays(state.startDate, MISSION_WEEKS * 7 - 1), today);
    const day = dayNumber(today, state.startDate);
    change = day >= 1 ? { text: `Day ${Math.min(day, MISSION_DAYS)} of ${MISSION_DAYS}`, trend: 'flat' } : null;
  }
  const mean = average ?? 0;
  return {
    bars,
    average: mean,
    change,
    target,
    summary: `Bar chart of DMs a day against the target of ${target}. The average is ${formatDecimal(mean)} DMs a day.`,
  };
}

export interface FunnelRow {
  label: string;
  value: number;
  /** The share of the row before, as text, for example "17%". A dash for the first row. */
  rate: string;
}

/** The four short funnel rows of the Outreach page: sent, replies, calls and clients. Pure. */
export function funnelSummary(state: Pick<HubState, 'funnel' | 'baseContacted' | 'days'>): FunnelRow[] {
  const values: readonly [string, number][] = [
    ['Sent', totalContacted(state)],
    ['Replies', state.funnel.replied],
    ['Calls', state.funnel.booked],
    ['Clients', state.funnel.closed],
  ];
  return values.map(([label, value], index) => {
    const before = index === 0 ? null : (values[index - 1]?.[1] ?? 0);
    const share = before === null ? null : rate(value, before);
    return { label, value, rate: share === null ? '–' : `${Math.round(share * 100)}%` };
  });
}
