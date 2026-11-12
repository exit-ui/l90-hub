import type { DateKey, Session } from '@/store/types';
import { addDays, formatWeekdayShort, mondayOf, weekOf } from './dates';
import {
  attendedOn,
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

export interface WeekDayChip {
  date: DateKey;
  /** One letter, for example "M". */
  letter: string;
  /** The full name for a screen reader, for example "Mon". */
  name: string;
  attended: boolean;
  isToday: boolean;
  /** A day after today: it shows grey and empty. */
  ahead: boolean;
}

/** The 7 days of the week of today, Monday first, with the gym attendance of each. Pure. */
export function fitnessWeek(sessions: readonly Session[], today: DateKey): WeekDayChip[] {
  return weekOf(today).map((date) => {
    const name = formatWeekdayShort(date);
    return {
      date,
      letter: name.slice(0, 1),
      name,
      attended: attendedOn(sessions, date),
      isToday: date === today,
      ahead: date > today,
    };
  });
}
