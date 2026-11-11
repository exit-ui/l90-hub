import type { DateKey, HubState } from '@/store/types';
import { parseWhole } from './format';
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
