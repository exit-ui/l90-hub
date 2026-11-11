import type { DateKey, Session } from '@/store/types';
import { addDays, mondayOf } from './dates';
import {
  type HeatCell,
  HEATMAP_WEEKS,
  heatmapCells,
  sessionsInWeek,
  totalMinutes,
  weeklyCounts,
} from './sessions';
import type { ChartPoint } from './summary';

export interface FitnessOverview {
  /** Sessions in the week of today. */
  week: number;
  target: number;
  sessions: number;
  minutes: number;
  /** Sessions for each of the last 13 weeks. The label is the Monday of the week. */
  weeklySessions: ChartPoint[];
  /** Minutes for each of the last 13 weeks. The label is the Monday of the week. */
  weeklyMinutes: ChartPoint[];
  cells: HeatCell[];
}

/** The minutes for each of the last `weeks` weeks. The last item is this week. */
export function weeklyMinutes(
  sessions: readonly Session[],
  today: DateKey,
  weeks: number = HEATMAP_WEEKS,
): ChartPoint[] {
  const thisMonday = mondayOf(today);
  const sums = new Map<DateKey, number>();
  for (const session of sessions) {
    const monday = mondayOf(session.date);
    sums.set(monday, (sums.get(monday) ?? 0) + session.minutes);
  }
  return Array.from({ length: weeks }, (_, index) => {
    const week = addDays(thisMonday, (index - (weeks - 1)) * 7);
    return { label: week, value: sums.get(week) ?? 0 };
  });
}

/** The values for the Overview tab of the Fitness page. */
export function fitnessOverview(
  sessions: readonly Session[],
  today: DateKey,
  target: number,
): FitnessOverview {
  const dates = sessions.map((session) => session.date);
  return {
    week: sessionsInWeek(sessions, today),
    target,
    sessions: sessions.length,
    minutes: totalMinutes(sessions),
    weeklySessions: weeklyCounts(dates, today, HEATMAP_WEEKS).map((item) => ({
      label: item.week,
      value: item.value,
    })),
    weeklyMinutes: weeklyMinutes(sessions, today),
    cells: heatmapCells(dates, today),
  };
}
