import type { DateKey, HubState } from '@/store/types';
import { currentBook } from './books';
import { addDays, mondayOf } from './dates';
import { formatDecimal, plural } from './format';
import { PILLAR_LABELS } from './pillars';
import { dailySeries, nonNull } from './progressSeries';
import { sessionsInWeek } from './sessions';
import { tradesInOrder } from './trading';

/** The pillar cards on Today scroll sideways. Each holds one metric, one change line and a 14-day sparkline. */
export const PILLAR_CARD_IDS = ['fitness', 'learning', 'reading', 'trading'] as const;
export type PillarCardId = (typeof PILLAR_CARD_IDS)[number];
export const PILLAR_SPARK_DAYS = 14;

export type Trend = 'up' | 'down' | 'flat';
/** success: green, accent: the secondary blue, negative: red (only a trading loss). */
export type CardTone = 'success' | 'accent' | 'negative';

export interface CardChange {
  text: string;
  trend: Trend;
}

export interface PillarCard {
  id: PillarCardId;
  name: string;
  /** The metric, for example "4". */
  value: string;
  /** The quiet tail after the metric, for example "/5" or " h". */
  tail: string;
  /** One line about the change, or null when there is nothing to compare. */
  change: CardChange | null;
  /** The sparkline values, oldest first. */
  spark: number[];
  tone: CardTone;
  /** True when the pillar has no data yet. The card then shows a calm line, not a zero. */
  empty: boolean;
  /** The text alternative of the whole card. */
  label: string;
}

type CardState = Pick<
  HubState,
  | 'days'
  | 'weekTemplate'
  | 'startDate'
  | 'fitness'
  | 'learning'
  | 'trades'
  | 'books'
  | 'chapterNotes'
  | 'fitTarget'
>;

/** A number with at most one decimal: 6.5 stays, 6.0 becomes 6. */
export function shortNumber(value: number): string {
  const text = formatDecimal(value);
  return text.endsWith('.0') ? text.slice(0, -2) : text;
}

/** The change line between this week and last week. Fewer is calm grey on screen, never red. */
export function weekChange(now: number, before: number, unit: string): CardChange {
  const diff = now - before;
  if (diff > 0) {
    return { text: `↑ ${shortNumber(diff)}${unit} vs last week`, trend: 'up' };
  }
  if (diff < 0) {
    return { text: `↓ ${shortNumber(-diff)}${unit} vs last week`, trend: 'down' };
  }
  return { text: 'Same as last week', trend: 'flat' };
}

function sparkOf(state: CardState, metric: 'gym' | 'learning' | 'reading' | 'r', today: DateKey): number[] {
  return nonNull(dailySeries(state, metric, PILLAR_SPARK_DAYS, today));
}

function minutesInWeek(state: CardState, date: DateKey): number {
  const monday = mondayOf(date);
  return state.learning
    .filter((session) => mondayOf(session.date) === monday)
    .reduce((sum, session) => sum + session.minutes, 0);
}

function cumulativeR(state: CardState, until: DateKey): number {
  return tradesInOrder(state.trades)
    .filter((trade) => trade.date <= until)
    .reduce((sum, trade) => sum + trade.resultR, 0);
}

/** A signed value with at most one decimal, with a true minus sign. */
export function signedShort(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${shortNumber(Math.abs(value))}`;
}

/** The four pillar cards of Today, from the stored record. Pure. */
export function pillarCards(state: CardState, today: DateKey): PillarCard[] {
  const lastWeek = addDays(today, -7);

  const gymNow = sessionsInWeek(state.fitness, today);
  const gymBefore = sessionsInWeek(state.fitness, lastWeek);
  const fitnessEmpty = state.fitness.length === 0;
  const fitness: PillarCard = {
    id: 'fitness',
    name: PILLAR_LABELS.fitness,
    value: String(gymNow),
    tail: `/${state.fitTarget}`,
    change: fitnessEmpty ? null : weekChange(gymNow, gymBefore, ''),
    spark: fitnessEmpty ? [] : sparkOf(state, 'gym', today),
    tone: 'success',
    empty: fitnessEmpty,
    label: `Fitness: ${gymNow} of ${state.fitTarget} gym sessions this week.`,
  };

  const hoursNow = minutesInWeek(state, today) / 60;
  const hoursBefore = minutesInWeek(state, lastWeek) / 60;
  const learningEmpty = state.learning.length === 0;
  const learning: PillarCard = {
    id: 'learning',
    name: PILLAR_LABELS.learning,
    value: shortNumber(hoursNow),
    tail: ' h',
    change: learningEmpty ? null : weekChange(hoursNow, hoursBefore, ' h'),
    spark: learningEmpty ? [] : sparkOf(state, 'learning', today),
    tone: 'accent',
    empty: learningEmpty,
    label: `Learning: ${shortNumber(hoursNow)} hours this week.`,
  };

  const book = currentBook(state.books);
  const read = book?.read ?? 0;
  const weekStart = addDays(today, -6);
  const chaptersWeek = state.chapterNotes.filter((note) => note.date >= weekStart && note.date <= today).length;
  const readingEmpty = read === 0 && state.chapterNotes.length === 0;
  const reading: PillarCard = {
    id: 'reading',
    name: PILLAR_LABELS.reading,
    value: `Ch. ${read}`,
    tail: book && book.chapters > 0 ? `/${book.chapters}` : '',
    change:
      chaptersWeek > 0
        ? { text: `↑ ${chaptersWeek} ${plural(chaptersWeek, 'chapter', 'chapters')} this week`, trend: 'up' }
        : null,
    spark: readingEmpty ? [] : sparkOf(state, 'reading', today),
    tone: 'success',
    empty: readingEmpty,
    label: book
      ? `Reading: chapter ${read}${book.chapters > 0 ? ` of ${book.chapters}` : ''}.`
      : 'Reading: no current book.',
  };

  const total = cumulativeR(state, today);
  const week = total - cumulativeR(state, lastWeek);
  const tradingEmpty = state.trades.length === 0;
  const trading: PillarCard = {
    id: 'trading',
    name: PILLAR_LABELS.trading,
    value: signedShort(total),
    tail: ' R',
    change: tradingEmpty
      ? null
      : week > 0
        ? { text: `↑ ${signedShort(week)} R this week`, trend: 'up' }
        : week < 0
          ? { text: `↓ ${signedShort(week)} R this week`, trend: 'down' }
          : { text: 'No change this week', trend: 'flat' },
    spark: tradingEmpty ? [] : sparkOf(state, 'r', today),
    tone: !tradingEmpty && week < 0 ? 'negative' : 'success',
    empty: tradingEmpty,
    label: `Trading: ${signedShort(total)} R in total.`,
  };

  return [fitness, learning, reading, trading];
}

/**
 * A sparkline in a box of `width` × `height`, as two SVG paths: the line and the area under it.
 * The lowest value sits near the bottom, the highest near the top. A flat series sits in the middle.
 */
export function sparkPath(values: readonly number[], width: number, height: number, pad = 4): { line: string; area: string } {
  if (values.length < 2) {
    return { line: '', area: '' };
  }
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low;
  const step = width / (values.length - 1);
  const y = (value: number) => (span === 0 ? height / 2 : pad + (1 - (value - low) / span) * (height - pad * 2));
  const points = values.map((value, index) => `${(index * step).toFixed(1)} ${y(value).toFixed(1)}`);
  const line = `M${points.join(' L')}`;
  return { line, area: `${line} L${width} ${height} L0 ${height} Z` };
}
