import { createDefaultState, emptyDay, STATE_VERSION } from '@/store/defaults';
import type {
  Book,
  BookStatus,
  BookTag,
  Card,
  ChapterNote,
  Coin,
  DateKey,
  DayRecord,
  Direction,
  Funnel,
  FunnelKey,
  HubState,
  LeitnerBox,
  Market,
  Milestone,
  ParkedIdea,
  Payout,
  Plan,
  Session,
  Setup,
  Snapshot,
  Trade,
  Weekday,
} from '@/store/types';
import { normalizeBooks } from './books';
import { isDateKey } from './dates';

export const STORAGE_KEY = 'l90-hub';

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function flag(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function whole(value: unknown, fallback: number, minimum = 0): number {
  return Math.max(minimum, Math.floor(finite(value, fallback)));
}

function positive(value: unknown, fallback: number): number {
  return Math.max(0, finite(value, fallback));
}

function date(value: unknown, fallback: DateKey): DateKey {
  return isDateKey(value) ? value : fallback;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.find((option) => option === value) ?? fallback;
}

/** Keeps the items that the reader accepts. A value that is not a list gives the fallback. */
function list<T>(value: unknown, read: (item: unknown) => T | null, fallback: T[]): T[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.map(read).filter((item): item is T => item !== null);
}

function readDay(value: unknown): DayRecord {
  const empty = emptyDay();
  if (!isRecord(value)) {
    return empty;
  }
  const done: Record<string, boolean> = {};
  if (isRecord(value.done)) {
    for (const [task, complete] of Object.entries(value.done)) {
      if (complete === true) {
        done[task] = true;
      }
    }
  }
  return {
    dm: whole(value.dm, 0),
    done,
    win: text(value.win),
    next: text(value.next),
    chartChecks: whole(value.chartChecks, 0),
    vetSend: whole(value.vetSend, 0),
    vetSkip: whole(value.vetSkip, 0),
    signedOff: flag(value.signedOff),
  };
}

function readSession(value: unknown): Session | null {
  if (!isRecord(value) || !isDateKey(value.date)) {
    return null;
  }
  return {
    date: value.date,
    type: text(value.type, 'Other'),
    minutes: whole(value.minutes, 0),
    note: text(value.note),
  };
}

function readCoin(value: unknown): Coin | null {
  if (!isRecord(value) || typeof value.symbol !== 'string') {
    return null;
  }
  return {
    symbol: value.symbol,
    amount: positive(value.amount, 0),
    priceGbp: positive(value.priceGbp, 0),
  };
}

function readSnapshot(value: unknown): Snapshot | null {
  if (!isRecord(value) || !isDateKey(value.date)) {
    return null;
  }
  return { date: value.date, valueGbp: positive(value.valueGbp, 0) };
}

const MARKETS: readonly Market[] = ['Forex', 'BTC perp', 'Other'];
const DIRECTIONS: readonly Direction[] = ['long', 'short'];

function readTrade(value: unknown): Trade | null {
  if (!isRecord(value) || !isDateKey(value.date)) {
    return null;
  }
  return {
    date: value.date,
    market: oneOf(value.market, MARKETS, 'Other'),
    instrument: text(value.instrument),
    direction: oneOf(value.direction, DIRECTIONS, 'long'),
    resultR: finite(value.resultR, 0),
    followedRules: flag(value.followedRules),
    note: text(value.note),
  };
}

function readPayout(value: unknown): Payout | null {
  if (!isRecord(value) || !isDateKey(value.date)) {
    return null;
  }
  return { date: value.date, firm: text(value.firm), amountGbp: positive(value.amountGbp, 0) };
}

function readSetup(value: unknown): Setup | null {
  if (!isRecord(value) || !isDateKey(value.date)) {
    return null;
  }
  return {
    date: value.date,
    text: text(value.text),
    result: oneOf(value.result, ['taken', 'missed'] as const, 'missed'),
  };
}

function readMilestone(value: unknown): Milestone | null {
  if (!isRecord(value) || typeof value.text !== 'string') {
    return null;
  }
  return { text: value.text, done: flag(value.done) };
}

function readCard(fallbackDue: DateKey): (value: unknown) => Card | null {
  return (value) => {
    if (!isRecord(value) || typeof value.q !== 'string') {
      return null;
    }
    const box = whole(value.box, 1, 1);
    return {
      q: value.q,
      a: text(value.a),
      box: Math.min(5, box) as LeitnerBox,
      due: date(value.due, fallbackDue),
    };
  };
}

function readPlan(value: unknown): Plan | null {
  if (!isRecord(value) || typeof value.cue !== 'string') {
    return null;
  }
  return { cue: value.cue, action: text(value.action) };
}

function readParked(fallbackDate: DateKey): (value: unknown) => ParkedIdea | null {
  return (value) => {
    if (!isRecord(value) || typeof value.text !== 'string') {
      return null;
    }
    return { text: value.text, date: date(value.date, fallbackDate) };
  };
}

const TAGS: readonly BookTag[] = ['Harvard research', 'Research', 'Mindset classic'];
const STATUSES: readonly BookStatus[] = ['current', 'next', 'queue', 'done'];

function readBook(value: unknown): Book | null {
  if (!isRecord(value) || typeof value.title !== 'string') {
    return null;
  }
  return {
    title: value.title,
    author: text(value.author),
    tag: oneOf(value.tag, TAGS, 'Research'),
    chapters: whole(value.chapters, 0),
    read: whole(value.read, 0),
    status: oneOf(value.status, STATUSES, 'queue'),
  };
}

function readNote(value: unknown): ChapterNote | null {
  if (!isRecord(value) || !isDateKey(value.date)) {
    return null;
  }
  return {
    date: value.date,
    book: text(value.book),
    idea: text(value.idea),
    action: text(value.action),
  };
}

function readStrings(value: unknown, fallback: string[]): string[] {
  return list(value, (item) => (typeof item === 'string' ? item : null), fallback);
}

function triple<T>(value: unknown, read: (item: unknown) => T, fallback: [T, T, T]): [T, T, T] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return [read(value[0]), read(value[1]), read(value[2])];
}

const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/**
 * Builds a complete, correct state from unknown data.
 * Missing or incorrect fields get the default value.
 * This also moves data from an older version to the current version.
 */
export function sanitizeState(input: unknown): HubState {
  const base = createDefaultState();
  if (!isRecord(input)) {
    return base;
  }
  const startDate = date(input.startDate, base.startDate);

  const days: Record<DateKey, DayRecord> = {};
  if (isRecord(input.days)) {
    for (const [key, value] of Object.entries(input.days)) {
      if (isDateKey(key)) {
        days[key] = readDay(value);
      }
    }
  }

  const funnel: Funnel = { ...base.funnel };
  if (isRecord(input.funnel)) {
    for (const key of Object.keys(funnel) as FunnelKey[]) {
      funnel[key] = whole(input.funnel[key], 0);
    }
  }

  const tranche: Record<string, boolean> = {};
  if (isRecord(input.tranche)) {
    for (const [month, done] of Object.entries(input.tranche)) {
      if (/^\d{4}-\d{2}$/.test(month) && done === true) {
        tranche[month] = true;
      }
    }
  }

  const weekTemplate = { ...base.weekTemplate };
  if (isRecord(input.weekTemplate)) {
    for (const weekday of WEEKDAYS) {
      weekTemplate[weekday] = readStrings(input.weekTemplate[weekday], base.weekTemplate[weekday]);
    }
  }

  return {
    version: STATE_VERSION,
    // A record without the flag comes from before the questions. Keep it if it holds data.
    onboarded: typeof input.onboarded === 'boolean' ? input.onboarded : Object.keys(days).length > 0,
    startDate,
    dmTarget: whole(input.dmTarget, base.dmTarget, 1),
    baseContacted: whole(input.baseContacted, base.baseContacted),
    fitTarget: whole(input.fitTarget, base.fitTarget, 1),
    learnTarget: whole(input.learnTarget, base.learnTarget, 1),
    chartCheckLimit: whole(input.chartCheckLimit, base.chartCheckLimit, 1),
    days,
    funnel,
    weekFix: text(input.weekFix),
    seeds: readStrings(input.seeds, base.seeds),
    fitness: list(input.fitness, readSession, base.fitness),
    learning: list(input.learning, readSession, base.learning),
    coins: list(input.coins, readCoin, base.coins),
    snapshots: list(input.snapshots, readSnapshot, base.snapshots),
    tranche,
    setups: list(input.setups, readSetup, base.setups),
    trades: list(input.trades, readTrade, base.trades),
    payouts: list(input.payouts, readPayout, base.payouts),
    riskPercent: positive(input.riskPercent, base.riskPercent),
    lessons: list(input.lessons, readMilestone, base.lessons),
    workMilestones: list(input.workMilestones, readMilestone, base.workMilestones),
    cards: list(input.cards, readCard(startDate), base.cards),
    cardReviews: whole(input.cardReviews, 0),
    plans: list(input.plans, readPlan, base.plans),
    parked: list(input.parked, readParked(startDate), base.parked),
    rewards: triple(input.rewards, (item) => text(item), base.rewards),
    claimed: triple(input.claimed, (item) => flag(item), base.claimed),
    weekTemplate,
    books: normalizeBooks(list(input.books, readBook, base.books)),
    chapterNotes: list(input.chapterNotes, readNote, base.chapterNotes),
  };
}

export type BackupResult = { ok: true; state: HubState } | { ok: false; error: string };

/** Reads a backup record. Gives a clear error for text that is not a record. */
export function parseBackup(raw: string): BackupResult {
  if (raw.trim() === '') {
    return { ok: false, error: 'The text area is empty. Paste the record that you copied.' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      error: 'The text is not correct JSON. Copy the full record again. Then paste it.',
    };
  }
  if (!isRecord(parsed) || !isRecord(parsed.days) || typeof parsed.startDate !== 'string') {
    return {
      ok: false,
      error: 'The text is JSON, but it is not a hub record. Paste a record from "Copy the record".',
    };
  }
  return { ok: true, state: sanitizeState(parsed) };
}

export function serializeBackup(state: HubState): string {
  return JSON.stringify(state, null, 2);
}

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStore(): KeyValueStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export interface StoredRecord {
  state: unknown;
  version: number;
}

/** Reads the saved record. Returns null when there is no record or the record is not correct JSON. */
export function readStored(store: KeyValueStore | null = browserStore()): StoredRecord | null {
  try {
    const raw = store?.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }
    return { state: parsed.state, version: finite(parsed.version, 0) };
  } catch {
    return null;
  }
}

/** Saves the record. Returns false when the browser refuses the write. */
export function writeStored(
  record: StoredRecord,
  store: KeyValueStore | null = browserStore(),
): boolean {
  try {
    if (!store) {
      return false;
    }
    store.setItem(STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function clearStored(store: KeyValueStore | null = browserStore()): boolean {
  try {
    store?.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
