import type { DateKey, Session } from '@/store/types';
import { addDays, mondayOf, weekOf } from './dates';

export const HEATMAP_WEEKS = 13;

/** Sessions in the Monday-to-Sunday week that contains the date. */
export function sessionsInWeek(sessions: readonly Session[], date: DateKey): number {
  const week = new Set(weekOf(date));
  return sessions.filter((session) => week.has(session.date)).length;
}

export function totalMinutes(sessions: readonly Session[]): number {
  return sessions.reduce((sum, session) => sum + session.minutes, 0);
}

/** How many times each date appears. */
export function countByDate(dates: readonly DateKey[]): Record<DateKey, number> {
  const counts: Record<DateKey, number> = {};
  for (const date of dates) {
    counts[date] = (counts[date] ?? 0) + 1;
  }
  return counts;
}

export interface WeekCount {
  /** The Monday of the week. */
  week: DateKey;
  value: number;
}

/** One count for each of the last `weeks` weeks. The last item is this week. */
export function weeklyCounts(dates: readonly DateKey[], today: DateKey, weeks: number): WeekCount[] {
  const thisMonday = mondayOf(today);
  const counts = new Map<DateKey, number>();
  for (const date of dates) {
    const monday = mondayOf(date);
    counts.set(monday, (counts.get(monday) ?? 0) + 1);
  }
  return Array.from({ length: weeks }, (_, index) => {
    const week = addDays(thisMonday, (index - (weeks - 1)) * 7);
    return { week, value: counts.get(week) ?? 0 };
  });
}

export interface HeatCell {
  date: DateKey;
  /** 0 = Monday, 6 = Sunday. */
  row: number;
  /** 0 = the oldest week. */
  column: number;
  value: number;
  future: boolean;
}

/** A grid of 13 weeks by 7 days that ends in the week of today. */
export function heatmapCells(
  dates: readonly DateKey[],
  today: DateKey,
  weeks: number = HEATMAP_WEEKS,
): HeatCell[] {
  const counts = countByDate(dates);
  const firstMonday = addDays(mondayOf(today), -(weeks - 1) * 7);
  const cells: HeatCell[] = [];
  for (let column = 0; column < weeks; column += 1) {
    for (let row = 0; row < 7; row += 1) {
      const date = addDays(firstMonday, column * 7 + row);
      cells.push({ date, row, column, value: counts[date] ?? 0, future: date > today });
    }
  }
  return cells;
}

export interface IndexedRow<T> {
  /** The position of the item in the stored list. Use it to remove the item. */
  index: number;
  item: T;
}

/** Items with a date, newest first. Each row keeps its position in the stored list. */
export function newestFirst<T extends { date: DateKey }>(items: readonly T[]): IndexedRow<T>[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.date === b.item.date ? b.index - a.index : a.item.date < b.item.date ? 1 : -1));
}

/** Sessions, newest first, with the position of each session in the stored list. */
export function sessionRows(sessions: readonly Session[]): { session: Session; index: number }[] {
  return newestFirst(sessions).map(({ item, index }) => ({ session: item, index }));
}

/** True when the list has a session on the date. */
export function attendedOn(sessions: readonly Session[], date: DateKey): boolean {
  return sessions.some((session) => session.date === date);
}

/**
 * The "Gym attended" button. With no session on the date, it adds one.
 * With a session on the date, it removes the newest session of that date.
 */
export function toggleAttendance(sessions: readonly Session[], date: DateKey): Session[] {
  const last = sessions.map((session) => session.date).lastIndexOf(date);
  if (last < 0) {
    return [...sessions, { date, type: 'Other', minutes: 0, note: '' }];
  }
  return sessions.filter((_, index) => index !== last);
}
