import { DAILY_LINES, type DailyLine, DIRECTIVES } from '@/store/defaults';
import type { DateKey, Directive, HubState } from '@/store/types';
import { bookProgress, chaptersRead, currentBook } from './books';
import { dueCardIndexes } from './leitner';
import { sessionsInWeek, weeklyCounts } from './sessions';
import { dateStreak, dmOn, dmSeries, dmStreak, totalContacted, totalDms } from './streak';
import { cumulativeR, portfolioValue, tradeStats } from './trading';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface HomeSummary {
  outreach: {
    total: number;
    contacted: number;
    today: number;
    target: number;
    streak: number;
    series: ChartPoint[];
  };
  fitness: { week: number; target: number; total: number };
  learning: { week: number; target: number; lessonsDone: number; lessonsTotal: number; cardsDue: number };
  trading: { cumulativeR: number | null; portfolioGbp: number; trades: number; series: ChartPoint[] };
  reading: {
    title: string | null;
    read: number;
    chapters: number;
    fraction: number | null;
    totalChapters: number;
    streak: number;
    series: ChartPoint[];
  };
}

const SPARK_DAYS = 14;
const SPARK_WEEKS = 8;

/** The values for the summary cards on the Home page. */
export function homeSummary(state: HubState, today: DateKey): HomeSummary {
  const book = currentBook(state.books);
  const stats = tradeStats(state.trades);
  const readingDates = state.chapterNotes.map((note) => note.date);
  return {
    outreach: {
      total: totalDms(state.days),
      contacted: totalContacted(state),
      today: dmOn(state.days, today),
      target: state.dmTarget,
      streak: dmStreak(state.days, state.dmTarget, today),
      series: dmSeries(state.days, today, SPARK_DAYS).map((point) => ({
        label: point.date,
        value: point.value,
      })),
    },
    fitness: {
      week: sessionsInWeek(state.fitness, today),
      target: state.fitTarget,
      total: state.fitness.length,
    },
    learning: {
      week: sessionsInWeek(state.learning, today),
      target: state.learnTarget,
      lessonsDone: state.lessons.filter((lesson) => lesson.done).length,
      lessonsTotal: state.lessons.length,
      cardsDue: dueCardIndexes(state.cards, today).length,
    },
    trading: {
      cumulativeR: stats.cumulativeR,
      portfolioGbp: portfolioValue(state.coins),
      trades: stats.count,
      series: cumulativeR(state.trades).map((point) => ({
        label: point.date,
        value: point.value,
      })),
    },
    reading: {
      title: book?.title ?? null,
      read: book?.read ?? 0,
      chapters: book?.chapters ?? 0,
      fraction: bookProgress(book),
      totalChapters: chaptersRead(state.books),
      streak: dateStreak(readingDates, today),
      series: weeklyCounts(readingDates, today, SPARK_WEEKS).map((week) => ({
        label: week.week,
        value: week.value,
      })),
    },
  };
}

/** One directive for each day, selected by the day number. */
export function directiveForDay(day: number, directives: readonly Directive[] = DIRECTIVES): Directive {
  const count = directives.length;
  const index = (((Math.max(1, day) - 1) % count) + count) % count;
  const directive = directives[index];
  if (!directive) {
    throw new RangeError('The directive list is empty.');
  }
  return directive;
}

/** A fraction held between 0 and 1. A goal of 0 gives 0. */
export function fractionOf(value: number, goal: number): number {
  if (goal <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, value / goal));
}

/** One line for each day, selected by the day number. */
export function lineForDay(day: number, lines: readonly DailyLine[] = DAILY_LINES): DailyLine {
  const count = lines.length;
  const line = lines[(((Math.max(1, day) - 1) % count) + count) % count];
  if (!line) {
    throw new RangeError('The list of daily lines is empty.');
  }
  return line;
}
