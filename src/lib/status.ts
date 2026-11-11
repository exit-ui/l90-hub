import type { DateKey, DayRecord, HubState, Weekday } from '@/store/types';
import { dateOfDay, weekdayOf } from './dates';
import { MISSION_DAYS } from './phases';

export type DayStatus = 'signed off' | 'partly done' | 'missed' | 'open';

export function tasksForDate(
  template: Record<Weekday, string[]>,
  date: DateKey,
): string[] {
  return template[weekdayOf(date)] ?? [];
}

export function tasksDone(record: DayRecord | undefined, tasks: readonly string[]): number {
  if (!record) {
    return 0;
  }
  return tasks.filter((task) => record.done[task] === true).length;
}

export function dayStatus(
  record: DayRecord | undefined,
  tasks: readonly string[],
  date: DateKey,
  today: DateKey,
  startDate: DateKey,
): DayStatus {
  const done = tasksDone(record, tasks);
  if (tasks.length > 0 && done === tasks.length) {
    return 'signed off';
  }
  if (done > 0 || (record?.dm ?? 0) > 0) {
    return 'partly done';
  }
  if (date < today && date >= startDate) {
    return 'missed';
  }
  return 'open';
}

export interface MissionCell {
  day: number;
  date: DateKey;
  status: DayStatus;
  dm: number;
  isToday: boolean;
}

/** One cell for each of the 90 mission days. */
export function missionCells(
  state: Pick<HubState, 'days' | 'weekTemplate' | 'startDate'>,
  today: DateKey,
): MissionCell[] {
  return Array.from({ length: MISSION_DAYS }, (_, index) => {
    const day = index + 1;
    const date = dateOfDay(day, state.startDate);
    const record = state.days[date];
    return {
      day,
      date,
      status: dayStatus(
        record,
        tasksForDate(state.weekTemplate, date),
        date,
        today,
        state.startDate,
      ),
      dm: record?.dm ?? 0,
      isToday: date === today,
    };
  });
}

/** All daily wins, newest first. */
export function dailyWins(days: Record<DateKey, DayRecord>): { date: DateKey; win: string }[] {
  return Object.entries(days)
    .filter(([, record]) => record.win.trim() !== '')
    .map(([date, record]) => ({ date, win: record.win }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
