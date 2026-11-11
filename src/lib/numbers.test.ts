import { describe, expect, it } from 'vitest';
import { createDefaultState, emptyDay } from '@/store/defaults';
import type { Book, Card, Trade } from '@/store/types';
import { addBook, moveBook, normalizeBooks, readChapter, setChapters } from './books';
import { formatR, formatRate, parseNumber, parseWhole, plural, toRoman } from './format';
import { funnelRates, funnelStages, rate } from './funnel';
import { dueCardIndexes, LEITNER_INTERVALS, nextBox, reviewCard } from './leitner';
import { attendedOn, heatmapCells, sessionsInWeek, toggleAttendance, weeklyCounts } from './sessions';
import { lineForDay } from './summary';
import { parseBackup, readStored, sanitizeState, STORAGE_KEY, writeStored } from './storage';
import {
  allocation,
  cumulativeR,
  portfolioValue,
  tradeStats,
  upsertSnapshot,
} from './trading';
import { levelForXp, levelProgress, totalXp, xpForLevel } from './xp';

describe('funnel rates', () => {
  it('shows a dash for each rate when the divisor is 0', () => {
    const state = { ...createDefaultState(), baseContacted: 0 };
    const rates = funnelRates(state);
    expect(Object.values(rates)).toEqual([null, null, null, null, null, null]);
    expect(formatRate(rates.reply)).toBe('–');
    expect(rate(3, 0)).toBeNull();
  });

  it('calculates the 6 rates', () => {
    const state = createDefaultState();
    state.days['2026-10-20'] = { ...emptyDay(), dm: 60 };
    state.funnel = {
      sourced: 300,
      opened: 80,
      replied: 20,
      positive: 10,
      loomSent: 8,
      loomWatched: 4,
      replyAfterLoom: 2,
      booked: 5,
      attended: 3,
      closed: 1,
    };
    expect(funnelRates(state)).toEqual({
      reply: 0.2,
      positiveReply: 0.5,
      loomWatch: 0.5,
      responseAfterLoom: 0.5,
      booking: 0.5,
      overall: 0.01,
    });
  });

  it('has 11 stages with an automatic contacted value', () => {
    const stages = funnelStages(createDefaultState());
    expect(stages).toHaveLength(11);
    expect(stages[1]).toMatchObject({ key: 'contacted', value: 40, automatic: true });
  });
});

describe('Leitner intervals', () => {
  const card: Card = { q: 'q', a: 'a', box: 2, due: '2026-10-20' };

  it('uses intervals of 1, 2, 4, 8 and 16 days', () => {
    expect(LEITNER_INTERVALS).toEqual({ 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 });
  });

  it('moves a correct card up one box and sets the due date', () => {
    expect(reviewCard(card, true, '2026-10-20')).toMatchObject({ box: 3, due: '2026-10-24' });
  });

  it('moves a wrong card to box 1', () => {
    expect(reviewCard({ ...card, box: 4 }, false, '2026-10-20')).toMatchObject({
      box: 1,
      due: '2026-10-21',
    });
  });

  it('keeps box 5 as the top box', () => {
    expect(nextBox(5, true)).toBe(5);
    expect(reviewCard({ ...card, box: 5 }, true, '2026-10-20').due).toBe('2026-11-05');
  });

  it('lists the cards that are due', () => {
    const cards: Card[] = [
      { ...card, due: '2026-10-25' },
      { ...card, box: 3, due: '2026-10-20' },
      { ...card, box: 1, due: '2026-10-19' },
    ];
    expect(dueCardIndexes(cards, '2026-10-20')).toEqual([2, 1]);
  });
});

describe('XP and level', () => {
  it('is 0 XP and level 1 for the default state', () => {
    const state = createDefaultState();
    expect(totalXp(state)).toBe(0);
    expect(levelForXp(0)).toBe(1);
  });

  it('adds the XP of each source', () => {
    const state = createDefaultState();
    state.days['2026-10-20'] = { ...emptyDay(), dm: 20, done: { A: true, B: true }, win: 'Win.' };
    state.days['2026-10-21'] = { ...emptyDay(), dm: 2, win: '   ' };
    state.fitness.push({ date: '2026-10-20', type: 'Push', minutes: 60, note: '' });
    state.learning.push({ date: '2026-10-20', type: 'Linux', minutes: 45, note: '' });
    state.books[0] = { ...state.books[0]!, read: 3 };
    state.cardReviews = 5;
    state.lessons[0] = { ...state.lessons[0]!, done: true };
    state.workMilestones[0] = { ...state.workMilestones[0]!, done: true };
    expect(totalXp(state)).toBe(22 * 5 + 2 * 10 + 20 + 30 + 30 + 3 * 15 + 5 * 2 + 2 * 40);
  });

  it('follows the level formula', () => {
    expect(levelForXp(149)).toBe(1);
    expect(levelForXp(150)).toBe(2);
    expect(levelForXp(449)).toBe(2);
    expect(levelForXp(450)).toBe(3);
    expect(levelForXp(900)).toBe(4);
    expect(xpForLevel(4)).toBe(900);
  });

  it('gives the progress inside a level', () => {
    expect(levelProgress(300)).toMatchObject({
      level: 2,
      floor: 150,
      ceiling: 450,
      fraction: 0.5,
      toNext: 150,
    });
  });
});

describe('book status change', () => {
  const books = (): Book[] => createDefaultState().books;

  it('adds a chapter to the current book', () => {
    const list = readChapter(setChapters(books(), 0, 10));
    expect(list[0]).toMatchObject({ read: 1, status: 'current' });
  });

  it('sets the book to done and the next book to current at the last chapter', () => {
    let list = setChapters(books(), 0, 2);
    list = readChapter(readChapter(list));
    expect(list[0]).toMatchObject({ read: 2, status: 'done' });
    expect(list[1]?.status).toBe('current');
    expect(list[2]?.status).toBe('next');
    expect(list.filter((book) => book.status === 'current')).toHaveLength(1);
  });

  it('does not finish a book that has 0 chapters', () => {
    const list = readChapter(books());
    expect(list[0]).toMatchObject({ read: 1, status: 'current' });
  });

  it('finishes a book when the user enters a chapter count at the read value', () => {
    const list = setChapters(readChapter(readChapter(books())), 0, 2);
    expect(list[0]?.status).toBe('done');
    expect(list[1]?.status).toBe('current');
  });

  it('opens a done book again when the chapter count goes above the read value', () => {
    let list = setChapters(books(), 0, 2);
    list = readChapter(readChapter(list));
    expect(list[0]?.status).toBe('done');
    list = setChapters(list, 0, 5);
    expect(list[0]).toMatchObject({ read: 2, chapters: 5 });
    expect(list[0]?.status).not.toBe('done');
    expect(list.filter((book) => book.status === 'current')).toHaveLength(1);
  });

  it('keeps only one current book', () => {
    const list = normalizeBooks(books().map((book) => ({ ...book, status: 'current' as const })));
    expect(list.filter((book) => book.status === 'current')).toHaveLength(1);
    expect(list.filter((book) => book.status === 'next')).toHaveLength(1);
  });

  it('changes the order and adds a book', () => {
    const moved = moveBook(books(), 2, -1);
    expect(moved[1]?.title).toBe('Psycho-Cybernetics');
    expect(moved[1]?.status).toBe('next');
    expect(moved[2]?.status).toBe('queue');
    const added = addBook(books(), {
      title: 'New',
      author: 'Author',
      tag: 'Research',
      chapters: 9,
    });
    expect(added.at(-1)).toMatchObject({ title: 'New', read: 0, status: 'queue' });
  });
});

describe('day trading statistics', () => {
  const trade = (date: string, resultR: number, followedRules = true): Trade => ({
    date,
    market: 'Forex',
    instrument: 'GBPUSD',
    direction: 'long',
    resultR,
    followedRules,
    note: '',
  });

  it('gives null for each value with 0 trades', () => {
    const stats = tradeStats([]);
    expect(stats).toEqual({
      count: 0,
      winRate: null,
      expectancy: null,
      cumulativeR: null,
      longestLosingStreak: null,
      ruleAdherence: null,
    });
    expect(formatR(stats.cumulativeR)).toBe('–');
    expect(cumulativeR([])).toEqual([]);
  });

  it('calculates the values with negative results', () => {
    const trades = [
      trade('2026-10-23', -1),
      trade('2026-10-20', 2),
      trade('2026-10-21', -1, false),
      trade('2026-10-22', -1),
      trade('2026-10-24', 3),
      trade('2026-10-25', 0),
    ];
    const stats = tradeStats(trades);
    expect(stats.count).toBe(6);
    expect(stats.winRate).toBeCloseTo(2 / 6);
    expect(stats.expectancy).toBeCloseTo(2 / 6);
    expect(stats.cumulativeR).toBe(2);
    expect(stats.longestLosingStreak).toBe(3);
    expect(stats.ruleAdherence).toBeCloseTo(5 / 6);
    expect(cumulativeR(trades).map((point) => point.value)).toEqual([2, 1, 0, -1, 2, 2]);
  });

  it('handles results that are all negative', () => {
    const stats = tradeStats([trade('2026-10-20', -1), trade('2026-10-21', -0.5)]);
    expect(stats).toMatchObject({ winRate: 0, cumulativeR: -1.5, longestLosingStreak: 2 });
    expect(formatR(stats.cumulativeR)).toBe('−1.50R');
    expect(formatR(2)).toBe('+2.00R');
  });

  it('values the wallet and keeps one snapshot for each date', () => {
    const coins = [
      { symbol: 'BTC', amount: 0.5, priceGbp: 60_000 },
      { symbol: 'SOL', amount: 10, priceGbp: 100 },
      { symbol: 'USDC', amount: 0, priceGbp: 0.79 },
    ];
    expect(portfolioValue(coins)).toBe(31_000);
    expect(allocation(coins).map((item) => item.symbol)).toEqual(['BTC', 'SOL']);
    expect(allocation([])).toEqual([]);
    const snapshots = upsertSnapshot(
      upsertSnapshot([{ date: '2026-10-21', valueGbp: 5 }], '2026-10-20', 1),
      '2026-10-21',
      9,
    );
    expect(snapshots).toEqual([
      { date: '2026-10-20', valueGbp: 1 },
      { date: '2026-10-21', valueGbp: 9 },
    ]);
  });
});

describe('sessions', () => {
  const dates = ['2026-10-19', '2026-10-21', '2026-10-25', '2026-10-26'];

  it('counts the sessions in the Monday-to-Sunday week', () => {
    const sessions = dates.map((date) => ({ date, type: 'Push', minutes: 60, note: '' }));
    expect(sessionsInWeek(sessions, '2026-10-22')).toBe(3);
    expect(sessionsInWeek(sessions, '2026-10-26')).toBe(1);
  });

  it('builds weekly counts and a 13-week grid', () => {
    expect(weeklyCounts(dates, '2026-10-26', 3).map((week) => week.value)).toEqual([0, 3, 1]);
    const cells = heatmapCells(dates, '2026-10-26');
    expect(cells).toHaveLength(91);
    expect(cells.at(-7)).toMatchObject({ date: '2026-10-26', value: 1, row: 0, future: false });
    expect(cells.at(-1)).toMatchObject({ date: '2026-11-01', future: true });
  });
});

describe('storage', () => {
  function memoryStore(initial: Record<string, string> = {}) {
    const data = new Map(Object.entries(initial));
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
      removeItem: (key: string) => {
        data.delete(key);
      },
    };
  }

  it('returns null for an empty store and for incorrect JSON', () => {
    expect(readStored(memoryStore())).toBeNull();
    expect(readStored(memoryStore({ [STORAGE_KEY]: '{not json' }))).toBeNull();
    expect(readStored(memoryStore({ [STORAGE_KEY]: '"text"' }))).toBeNull();
  });

  it('does not throw when the store throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
      removeItem: () => undefined,
    };
    expect(readStored(broken)).toBeNull();
    expect(writeStored({ state: {}, version: 1 }, broken)).toBe(false);
  });

  it('writes and reads a record with a version number', () => {
    const store = memoryStore();
    const state = createDefaultState();
    expect(writeStored({ state, version: 1 }, store)).toBe(true);
    expect(readStored(store)).toEqual({ state, version: 1 });
  });

  it('gives the default state for data that is not a record', () => {
    expect(sanitizeState(null)).toEqual(createDefaultState());
    expect(sanitizeState('text')).toEqual(createDefaultState());
    expect(sanitizeState([])).toEqual(createDefaultState());
  });

  it('fills the fields that an older version does not have', () => {
    const old = {
      version: 0,
      startDate: '2026-10-01',
      dmTarget: 25,
      days: { '2026-10-01': { dm: 7 }, 'not-a-date': { dm: 99 } },
      funnel: { replied: 4, closed: 'x' },
      seeds: ['a', 5],
      cards: [{ q: 'Q', a: 'A', box: 9 }],
      claimed: [true],
    };
    const state = sanitizeState(old);
    expect(state.version).toBe(1);
    expect(state.startDate).toBe('2026-10-01');
    expect(state.dmTarget).toBe(25);
    expect(state.days).toEqual({ '2026-10-01': { ...emptyDay(), dm: 7 } });
    expect(state.funnel.replied).toBe(4);
    expect(state.funnel.closed).toBe(0);
    expect(state.seeds).toEqual(['a']);
    expect(state.cards[0]).toEqual({ q: 'Q', a: 'A', box: 5, due: '2026-10-01' });
    expect(state.claimed).toEqual([true, false, false]);
    expect(state.books).toHaveLength(12);
    expect(state.weekTemplate[1]).toHaveLength(5);
  });

  it('corrects values that are not valid', () => {
    const state = sanitizeState({ dmTarget: -4, startDate: '2026-13-45', riskPercent: 'high' });
    expect(state.dmTarget).toBe(1);
    expect(state.startDate).toBe('2026-10-20');
    expect(state.riskPercent).toBe(1);
  });

  it('gives a clear error for an incorrect backup', () => {
    expect(parseBackup('')).toMatchObject({ ok: false });
    expect(parseBackup('{oops')).toMatchObject({ ok: false });
    expect(parseBackup('{"a":1}')).toMatchObject({ ok: false });
    const good = parseBackup(JSON.stringify(createDefaultState()));
    expect(good.ok).toBe(true);
  });
});

describe('gym attended button', () => {
  it('adds a session for a day with no session', () => {
    const list = toggleAttendance([], '2026-10-20');
    expect(list).toEqual([{ date: '2026-10-20', type: 'Other', minutes: 0, note: '' }]);
    expect(attendedOn(list, '2026-10-20')).toBe(true);
    expect(attendedOn(list, '2026-10-21')).toBe(false);
  });

  it('removes the newest session of the day and keeps the other days', () => {
    const sessions = [
      { date: '2026-10-20', type: 'Push', minutes: 60, note: '' },
      { date: '2026-10-21', type: 'Pull', minutes: 50, note: '' },
      { date: '2026-10-20', type: 'Other', minutes: 0, note: '' },
    ];
    const list = toggleAttendance(sessions, '2026-10-20');
    expect(list).toEqual(sessions.slice(0, 2));
    expect(sessionsInWeek(toggleAttendance([], '2026-10-20'), '2026-10-22')).toBe(1);
  });
});

describe('Roman numerals and daily lines', () => {
  it('writes mission days as Roman numerals', () => {
    expect([1, 4, 9, 22, 40, 66, 90].map(toRoman)).toEqual(['I', 'IV', 'IX', 'XXII', 'XL', 'LXVI', 'XC']);
    expect(toRoman(0)).toBe('0');
  });

  it('gives one line for each day and repeats after the list ends', () => {
    expect(lineForDay(1).theme).toBe('Sisyphus');
    expect(lineForDay(31)).toEqual(lineForDay(1));
    expect(lineForDay(-5)).toEqual(lineForDay(1));
  });

  it('keeps each sentence of each line to 20 words or fewer', () => {
    for (let day = 1; day <= 30; day += 1) {
      for (const sentence of lineForDay(day).text.split('. ')) {
        expect(sentence.split(' ').length).toBeLessThanOrEqual(20);
      }
    }
  });
});

describe('number fields', () => {
  it('reads whole numbers and keeps them at or above the minimum', () => {
    expect(parseWhole('12')).toBe(12);
    expect(parseWhole('-3')).toBe(0);
    expect(parseWhole('abc')).toBe(0);
    expect(parseWhole('0', 1)).toBe(1);
  });

  it('selects the singular or the plural word', () => {
    expect(plural(1, 'day', 'days')).toBe('day');
    expect(plural(0, 'day', 'days')).toBe('days');
    expect(plural(2, 'DM', 'DMs')).toBe('DMs');
  });

  it('reads negative numbers for a result in R', () => {
    expect(parseNumber('-1.5')).toBe(-1.5);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('x')).toBeNull();
  });
});

describe('sign-off flag in a day record', () => {
  it('defaults to false for an older record and keeps true', async () => {
    const { sanitizeState } = await import('./storage');
    const state = sanitizeState({
      startDate: '2026-10-20',
      days: {
        '2026-10-21': { dm: 5, done: {}, win: '', next: '', chartChecks: 0, vetSend: 0, vetSkip: 0 },
        '2026-10-22': { dm: 5, done: {}, signedOff: true },
      },
    });
    expect(state.days['2026-10-21']?.signedOff).toBe(false);
    expect(state.days['2026-10-22']?.signedOff).toBe(true);
  });
});
