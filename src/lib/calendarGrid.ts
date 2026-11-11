import type { DateKey, HubState, Weekday } from '@/store/types';
import { addDays, dayNumber, formatLong, isDateKey, monthKey, rangeOfDays, weekdayOf } from './dates';
import { MISSION_DAYS, reviewDate } from './phases';
import { type DayStatus, dayStatus, tasksForDate } from './status';

const DAYS_IN_WEEK = 7;

/** One calendar month of the range. Each week has 7 cells, Monday first. */
export interface MonthGrid {
  /** "YYYY-MM". */
  month: string;
  /** The first date of the range in this month. */
  first: DateKey;
  /** A null cell is a day outside the range. */
  weeks: (DateKey | null)[][];
}

/** The column of a date in a week that starts on Monday: 0 = Monday, 6 = Sunday. */
export function mondayColumn(date: DateKey): number {
  return (weekdayOf(date) + 6) % DAYS_IN_WEEK;
}

/** One grid for each calendar month that the range touches. Both dates are included. */
export function monthGrids(first: DateKey, last: DateKey): MonthGrid[] {
  const months = new Map<string, DateKey[]>();
  for (const date of rangeOfDays(first, last)) {
    const key = monthKey(date);
    months.set(key, [...(months.get(key) ?? []), date]);
  }
  return Array.from(months, ([month, dates]) => {
    const start = dates[0] ?? first;
    const cells: (DateKey | null)[] = [
      ...Array.from({ length: mondayColumn(start) }, () => null),
      ...dates,
    ];
    while (cells.length % DAYS_IN_WEEK !== 0) {
      cells.push(null);
    }
    const weeks: (DateKey | null)[][] = [];
    for (let index = 0; index < cells.length; index += DAYS_IN_WEEK) {
      weeks.push(cells.slice(index, index + DAYS_IN_WEEK));
    }
    return { month, first: start, weeks };
  });
}

/** The selected day: the date in the route if it is in the range, or today, or the first day. */
export function selectedDay(
  segment: string | undefined,
  today: DateKey,
  first: DateKey,
  last: DateKey,
): DateKey {
  const inRange = (date: DateKey) => date >= first && date <= last;
  if (isDateKey(segment) && inRange(segment)) {
    return segment;
  }
  return inRange(today) ? today : first;
}

const KEY_STEPS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -DAYS_IN_WEEK,
  ArrowDown: DAYS_IN_WEEK,
};

/** The date that an arrow key moves to. Null when the key does not move or the date is outside the range. */
export function moveDate(date: DateKey, key: string, first: DateKey, last: DateKey): DateKey | null {
  const step = KEY_STEPS[key];
  if (step === undefined || !isDateKey(date)) {
    return null;
  }
  const target = addDays(date, step);
  return target >= first && target <= last ? target : null;
}

export interface CalendarDay {
  date: DateKey;
  /** The date number in the month, 1 to 31. */
  dateNumber: number;
  /** The mission day number, 1 to 90. The review day is 91. */
  day: number;
  dm: number;
  status: DayStatus;
  isToday: boolean;
  isReview: boolean;
  /** A day after today. It has no DM count yet. */
  isFuture: boolean;
}

type CalendarInput = Pick<HubState, 'days' | 'weekTemplate' | 'startDate'>;

/** The data of each day from the start date to the review day. */
export function calendarDays(state: CalendarInput, today: DateKey): Map<DateKey, CalendarDay> {
  const review = reviewDate(state.startDate);
  const days = new Map<DateKey, CalendarDay>();
  for (const date of rangeOfDays(state.startDate, review)) {
    const record = state.days[date];
    days.set(date, {
      date,
      dateNumber: Number(date.slice(8)),
      day: dayNumber(date, state.startDate),
      dm: record?.dm ?? 0,
      status: dayStatus(record, tasksForDate(state.weekTemplate, date), date, today, state.startDate),
      isToday: date === today,
      isReview: date === review,
      isFuture: date > today,
    });
  }
  return days;
}

export const STATUS_LABELS: Readonly<Record<DayStatus, string>> = {
  'signed off': 'Signed off',
  'partly done': 'Partly done',
  missed: 'Missed',
  open: 'Open',
};

/** The full text of a day cell for screen readers. */
export function dayCellLabel(cell: CalendarDay): string {
  const name = cell.isReview ? 'Review day' : `Day ${cell.day} of ${MISSION_DAYS}`;
  const todayPart = cell.isToday ? ' Today.' : '';
  const unit = cell.dm === 1 ? 'DM' : 'DMs';
  const dmPart = cell.isFuture ? '' : ` ${cell.dm} ${unit}.`;
  return `${formatLong(cell.date)}. ${name}.${dmPart} ${STATUS_LABELS[cell.status]}.${todayPart}`;
}

/** The weekdays in display order: Monday first, Sunday last. The store key 0 is Sunday. */
export const WEEKDAY_ROWS: readonly { weekday: Weekday; label: string; short: string }[] = [
  { weekday: 1, label: 'Monday', short: 'Mon' },
  { weekday: 2, label: 'Tuesday', short: 'Tue' },
  { weekday: 3, label: 'Wednesday', short: 'Wed' },
  { weekday: 4, label: 'Thursday', short: 'Thu' },
  { weekday: 5, label: 'Friday', short: 'Fri' },
  { weekday: 6, label: 'Saturday', short: 'Sat' },
  { weekday: 0, label: 'Sunday', short: 'Sun' },
];

/** The tasks of a weekday as text, with one task on each line. */
export function templateText(tasks: readonly string[] | undefined): string {
  return (tasks ?? []).join('\n');
}

/** The lines of the text area. The store trims the lines and drops the empty lines. */
export function templateLines(text: string): string[] {
  return text.split(/\r?\n/);
}
