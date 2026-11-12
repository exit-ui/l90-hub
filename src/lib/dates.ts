import type { DateKey, Weekday } from '@/store/types';

const MS_PER_DAY = 86_400_000;
const KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Local calendar date of a Date object as "YYYY-MM-DD". */
export function toKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight for a date key. Returns null for text that is not a real date. */
export function parseKey(key: DateKey): Date | null {
  const match = KEY_PATTERN.exec(key);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === 'string' && parseKey(value) !== null;
}

function mustParse(key: DateKey): Date {
  const date = parseKey(key);
  if (!date) {
    throw new RangeError(`"${key}" is not a date in the form YYYY-MM-DD.`);
  }
  return date;
}

export function todayKey(now: Date = new Date()): DateKey {
  return toKey(now);
}

export function addDays(key: DateKey, amount: number): DateKey {
  const date = mustParse(key);
  return toKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount));
}

/** Whole calendar days from b to a. Local midnights, rounded to absorb DST shifts. */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((mustParse(a).getTime() - mustParse(b).getTime()) / MS_PER_DAY);
}

/** Day 1 is the start date. Dates before the start give 0 or a negative number. */
export function dayNumber(date: DateKey, startDate: DateKey): number {
  return diffDays(date, startDate) + 1;
}

export function dateOfDay(day: number, startDate: DateKey): DateKey {
  return addDays(startDate, day - 1);
}

export function weekdayOf(key: DateKey): Weekday {
  return mustParse(key).getDay() as Weekday;
}

/** The Monday of the week that contains the date. */
export function mondayOf(key: DateKey): DateKey {
  const weekday = weekdayOf(key);
  return addDays(key, weekday === 0 ? -6 : 1 - weekday);
}

/** The seven dates, Monday to Sunday, of the week that contains the date. */
export function weekOf(key: DateKey): DateKey[] {
  const monday = mondayOf(key);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function monthKey(key: DateKey): string {
  return key.slice(0, 7);
}

/** All dates from first to last, both included. */
export function rangeOfDays(first: DateKey, last: DateKey): DateKey[] {
  const length = diffDays(last, first) + 1;
  if (length <= 0) {
    return [];
  }
  return Array.from({ length }, (_, index) => addDays(first, index));
}

const LONG = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const MEDIUM = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
const DAY_PHONE = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });

/** The date on the phone header line, for example "Thu 12 November". */
export function formatDayPhone(key: DateKey): string {
  return DAY_PHONE.format(mustParse(key));
}

export function formatLong(key: DateKey): string {
  return LONG.format(mustParse(key));
}

export function formatMedium(key: DateKey): string {
  return MEDIUM.format(mustParse(key));
}

export function formatShort(key: DateKey): string {
  return SHORT.format(mustParse(key));
}

export function formatMonth(key: DateKey): string {
  return MONTH.format(mustParse(key));
}

const WEEKDAY_SHORT = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });

/** The short weekday name, for example "Mon". */
export function formatWeekdayShort(key: DateKey): string {
  return WEEKDAY_SHORT.format(mustParse(key));
}
