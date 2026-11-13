import { normalizeBooks } from '@/lib/books';
import { addDays, rangeOfDays, weekdayOf } from '@/lib/dates';
import { createDefaultState } from './defaults';
import type { DateKey, HubState, Trade } from './types';

/**
 * Sample mode shows the hub with example data, so the user can see it full.
 * "?sample=1" (or "today") fills the mission up to today. "?sample=full" fills all 90 days
 * and sets the date to the last mission day. Sample mode never reads or writes the saved record.
 */
export type SampleKind = 'none' | 'today' | 'full';

export function parseSampleKind(search: string): SampleKind {
  const value = new URLSearchParams(search).get('sample');
  if (value === 'full') {
    return 'full';
  }
  return value === '1' || value === 'today' ? 'today' : 'none';
}

export function sampleKind(): SampleKind {
  try {
    return typeof window === 'undefined' ? 'none' : parseSampleKind(window.location.search);
  } catch {
    return 'none';
  }
}

export function isSampleMode(): boolean {
  return sampleKind() !== 'none';
}

/** The address of the app with a sample kind, or without one for "none". The route after "#" stays. */
export function sampleHref(kind: SampleKind, location: { pathname: string; search: string; hash: string }): string {
  const params = new URLSearchParams(location.search);
  if (kind === 'none') {
    params.delete('sample');
  } else {
    params.set('sample', kind === 'full' ? 'full' : '1');
  }
  const query = params.toString();
  return `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
}

/** A small repeatable number source, so the sample data is the same on each load. */
function sequence(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1_103_515_245 + 12_345) % 2_147_483_648;
    return value / 2_147_483_648;
  };
}

export function createSampleState(today: DateKey, full = false): HubState {
  const state = createDefaultState();
  state.onboarded = true;
  const next = sequence(90);
  const past = rangeOfDays(state.startDate, addDays(today, -1));

  past.forEach((date, index) => {
    const tasks = state.weekTemplate[weekdayOf(date)];
    const roll = next();
    const missed = index === 8 || index === 15;
    const dm = missed ? 0 : roll < 0.2 ? 8 + Math.floor(next() * 9) : 20 + Math.floor(next() * 6);
    const done: Record<string, boolean> = {};
    tasks.forEach((task, position) => {
      if (!missed && (roll >= 0.35 || position < 3)) {
        done[task] = true;
      }
    });
    state.days[date] = {
      dm,
      done,
      win: missed ? '' : 'One creator replied to the first DM.',
      next: missed ? '' : 'Send the drafted DMs at the bus stop.',
      chartChecks: Math.floor(next() * 3),
      vetSend: missed ? 0 : 14 + Math.floor(next() * 8),
      vetSkip: missed ? 0 : 6 + Math.floor(next() * 10),
      ...(full && !missed ? { signedOff: true } : {}),
    };
    const weekday = weekdayOf(date);
    if (!missed && (weekday === 1 || weekday === 3 || weekday === 6)) {
      state.fitness.push({
        date,
        type: ['Push', 'Pull', 'Legs'][index % 3] ?? 'Other',
        minutes: 55 + Math.floor(next() * 20),
        note: '',
      });
    }
    if (!missed && (weekday === 2 || weekday === 4) && next() > 0.25) {
      state.learning.push({
        date,
        type: index % 2 === 0 ? 'Linux' : 'Python',
        minutes: 45,
        note: '',
      });
    }
    if (!missed && next() > 0.3) {
      state.chapterNotes.push({
        date,
        book: 'Key to Living the Law of Attraction',
        idea: 'Decide the result first. Then act on it each day.',
        action: 'Write the goal on the first page of the notebook.',
      });
    }
  });

  const firstTask = state.weekTemplate[weekdayOf(today)][0];
  state.days[today] = full
    ? {
        dm: 22,
        done: Object.fromEntries(state.weekTemplate[weekdayOf(today)].map((task) => [task, true])),
        win: 'Two calls booked from this week of DMs.',
        next: 'Review the 90 days and set the next target.',
        chartChecks: 2,
        vetSend: 20,
        vetSkip: 9,
      }
    : {
        dm: 12,
        done: firstTask ? { [firstTask]: true } : {},
        win: '',
        next: '',
        chartChecks: 1,
        vetSend: 9,
        vetSkip: 5,
      };

  state.funnel = full
    ? {
        sourced: 2_150,
        opened: 1_080,
        replied: 146,
        positive: 44,
        loomSent: 26,
        loomWatched: 19,
        replyAfterLoom: 13,
        booked: 9,
        attended: 7,
        closed: 3,
      }
    : {
    sourced: 620,
    opened: 310,
    replied: 41,
    positive: 12,
    loomSent: 6,
    loomWatched: 4,
    replyAfterLoom: 3,
    booked: 2,
    attended: 1,
    closed: 0,
  };

  const results = [1.8, -1, -1, 2.4, 0.6, -1, 1.2, 3.1, -1, -0.5, 2.2, 1.4, -1, 0.9];
  const tradeCount = full ? past.length / 2 : results.length;
  state.trades = Array.from({ length: Math.floor(tradeCount) }, (_, index) => results[index % results.length] ?? 0).map((resultR, index): Trade => ({
    date: addDays(state.startDate, full ? index * 2 + 1 : index + 1),
    market: index % 3 === 0 ? 'BTC perp' : 'Forex',
    instrument: index % 3 === 0 ? 'BTCUSD' : 'GBPUSD',
    direction: index % 2 === 0 ? 'long' : 'short',
    resultR,
    followedRules: index !== 5,
    note: '',
  }));

  const holdings: Record<string, [number, number]> = {
    BTC: [0.062, 71_200],
    SOL: [14, 142],
    NEAR: [320, 3.9],
    HYPE: [48, 21.5],
    USDC: [900, 0.79],
  };
  state.coins = state.coins.map((coin) => {
    const holding = holdings[coin.symbol];
    return holding ? { ...coin, amount: holding[0], priceGbp: holding[1] } : coin;
  });
  const values = full
    ? Array.from({ length: Math.floor(past.length / 4) + 1 }, (_, index) => Math.round(7_820 + index * 210 + Math.sin(index) * 180))
    : [7_820, 8_040, 7_910, 8_460, 8_720, 9_105];
  state.snapshots = values.map((valueGbp, index) => ({
    date: addDays(state.startDate, index * 4),
    valueGbp,
  }));

  state.lessons = state.lessons.map((lesson, index) => ({ ...lesson, done: full || index < 3 }));
  state.workMilestones = state.workMilestones.map((item, index) => ({
    ...item,
    done: full || index < 4,
  }));
  state.cardReviews = full ? 210 : 46;
  state.books = normalizeBooks(
    state.books.map((book) =>
      book.status === 'current'
        ? { ...book, chapters: 22, read: state.chapterNotes.length }
        : book,
    ),
  );
  state.rewards = ['A new pair of lifting shoes.', 'A weekend trip.', 'A new desk setup.'];
  return state;
}
