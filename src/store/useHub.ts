import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import { addBook, moveBook, normalizeBooks, readChapter, setChapters, currentBook } from '@/lib/books';
import { addDays, isDateKey, monthKey, pinToday, todayKey } from '@/lib/dates';
import { reviewCard } from '@/lib/leitner';
import { toggleAttendance } from '@/lib/sessions';
import { toggleTaskState } from '@/lib/tickEffects';
import { buildFromAnswers, type OnboardingAnswers } from '@/lib/onboarding';
import { MISSION_DAYS, rewardStatuses } from '@/lib/phases';
import {
  clearStored,
  readStored,
  sanitizeState,
  STORAGE_KEY,
  writeStored,
} from '@/lib/storage';
import { portfolioValue, upsertSnapshot } from '@/lib/trading';
import { createDefaultState, DEFAULT_START_DATE, emptyDay, STATE_VERSION } from './defaults';
import { createSampleState, sampleKind } from './sample';
import type {
  Book,
  Card,
  ChapterNote,
  Coin,
  DateKey,
  DayRecord,
  FunnelKey,
  HubState,
  MilestoneList,
  Payout,
  Plan,
  RewardIndex,
  Session,
  SessionList,
  SettingKey,
  Setup,
  Trade,
  Weekday,
} from './types';

export interface HubActions {
  setDm: (date: DateKey, value: number) => void;
  addDm: (date: DateKey, amount: number) => void;
  /** Ticks the task and does the act that it names, for example logs the gym session. */
  toggleTask: (date: DateKey, task: string) => void;
  /** Records the sign-off of the date. Only "Sign off the day" calls it; a tick never does. */
  signOffDay: (date: DateKey) => void;
  setWin: (date: DateKey, text: string) => void;
  setNext: (date: DateKey, text: string) => void;
  addChartCheck: (date: DateKey) => void;
  recordVet: (date: DateKey, decision: 'send' | 'skip') => void;

  setFunnel: (key: FunnelKey, value: number) => void;
  setWeekFix: (text: string) => void;
  addSeed: (handle: string) => void;
  removeSeed: (index: number) => void;

  addSession: (list: SessionList, session: Session) => void;
  removeSession: (list: SessionList, index: number) => void;
  /** The "Gym attended today" switch: adds a session on the date, or removes the newest one of that date. */
  toggleAttendance: (date: DateKey) => void;

  addCoin: (symbol: string) => void;
  updateCoin: (index: number, patch: Partial<Coin>) => void;
  removeCoin: (index: number) => void;
  saveSnapshot: (date: DateKey) => void;
  toggleTranche: (date: DateKey) => void;

  addSetup: (setup: Setup) => void;
  addTrade: (trade: Trade) => void;
  removeTrade: (index: number) => void;
  addPayout: (payout: Payout) => void;
  removePayout: (index: number) => void;
  setRiskPercent: (value: number) => void;

  addMilestone: (list: MilestoneList, text: string) => void;
  toggleMilestone: (list: MilestoneList, index: number) => void;
  removeMilestone: (list: MilestoneList, index: number) => void;

  addCard: (q: string, a: string, today: DateKey) => void;
  removeCard: (index: number) => void;
  answerCard: (index: number, correct: boolean, today: DateKey) => void;

  addPlan: (plan: Plan) => void;
  removePlan: (index: number) => void;
  parkIdea: (text: string, date: DateKey) => void;

  setReward: (index: RewardIndex, text: string) => void;
  claimReward: (index: RewardIndex) => void;
  setWeekTemplate: (weekday: Weekday, tasks: string[]) => void;

  readChapter: (date: DateKey) => void;
  updateChapterNote: (index: number, patch: Partial<Pick<ChapterNote, 'idea' | 'action'>>) => void;
  setBookChapters: (index: number, chapters: number) => void;
  moveBook: (index: number, direction: -1 | 1) => void;
  addBook: (book: Omit<Book, 'read' | 'status'>) => void;

  setStartDate: (date: DateKey) => void;
  setSetting: (key: SettingKey, value: number) => void;
  completeOnboarding: (answers: OnboardingAnswers) => void;
  skipOnboarding: () => void;
  reopenOnboarding: () => void;
  replaceState: (state: HubState) => void;
  resetState: () => void;
}

export type HubStore = HubState & { actions: HubActions };

function whole(value: number, minimum = 0): number {
  return Number.isFinite(value) ? Math.max(minimum, Math.floor(value)) : minimum;
}

function withDay(
  days: Record<DateKey, DayRecord>,
  date: DateKey,
  change: (record: DayRecord) => DayRecord,
): Record<DateKey, DayRecord> {
  if (!isDateKey(date)) {
    return days;
  }
  return { ...days, [date]: change(days[date] ?? emptyDay()) };
}

function without<T>(items: readonly T[], index: number): T[] {
  return items.filter((_, position) => position !== index);
}

function dataOf(store: HubStore): HubState {
  const data: Partial<HubStore> = { ...store };
  delete data.actions;
  return data as HubState;
}

const sample = sampleKind();
const sampleMode = sample !== 'none';
// The full preview shows the last mission day, so all 90 days have data.
if (sample === 'full') {
  pinToday(addDays(DEFAULT_START_DATE, MISSION_DAYS - 1));
}

/** Each read and each write is safe. Sample mode never touches the saved record. */
const storage: PersistStorage<HubState> = {
  getItem: (): StorageValue<HubState> | null => {
    if (sampleMode) {
      return { state: createSampleState(todayKey(), sample === 'full'), version: STATE_VERSION };
    }
    const stored = readStored();
    if (!stored) {
      return null;
    }
    return { state: sanitizeState(stored.state), version: stored.version };
  },
  setItem: (_name, value) => {
    if (!sampleMode) {
      writeStored({ state: value.state, version: value.version ?? STATE_VERSION });
    }
  },
  removeItem: () => {
    if (!sampleMode) {
      clearStored();
    }
  },
};

export const useHub = create<HubStore>()(
  persist(
    (set, get) => ({
      ...createDefaultState(),
      actions: {
        setDm: (date, value) =>
          set((state) => ({
            days: withDay(state.days, date, (record) => ({ ...record, dm: whole(value) })),
          })),
        addDm: (date, amount) =>
          set((state) => ({
            days: withDay(state.days, date, (record) => ({
              ...record,
              dm: whole(record.dm + amount),
            })),
          })),
        toggleTask: (date, task) => set((state) => toggleTaskState(state, date, task)),
        signOffDay: (date) =>
          set((state) => ({
            days: withDay(state.days, date, (record) => ({ ...record, signedOff: true })),
          })),
        setWin: (date, text) =>
          set((state) => ({
            days: withDay(state.days, date, (record) => ({ ...record, win: text })),
          })),
        setNext: (date, text) =>
          set((state) => ({
            days: withDay(state.days, date, (record) => ({ ...record, next: text })),
          })),
        addChartCheck: (date) =>
          set((state) => ({
            days: withDay(state.days, date, (record) => ({
              ...record,
              chartChecks: record.chartChecks + 1,
            })),
          })),
        recordVet: (date, decision) =>
          set((state) => ({
            days: withDay(state.days, date, (record) =>
              decision === 'send'
                ? { ...record, vetSend: record.vetSend + 1 }
                : { ...record, vetSkip: record.vetSkip + 1 },
            ),
          })),

        setFunnel: (key, value) =>
          set((state) => ({ funnel: { ...state.funnel, [key]: whole(value) } })),
        setWeekFix: (text) => set({ weekFix: text }),
        addSeed: (handle) =>
          set((state) => {
            const clean = handle.trim().replace(/^@+/, '');
            if (clean === '' || state.seeds.includes(clean)) {
              return {};
            }
            return { seeds: [...state.seeds, clean] };
          }),
        removeSeed: (index) => set((state) => ({ seeds: without(state.seeds, index) })),

        addSession: (list, session) =>
          set((state) => ({
            [list]: [...state[list], { ...session, minutes: whole(session.minutes) }],
          })),
        removeSession: (list, index) => set((state) => ({ [list]: without(state[list], index) })),
        toggleAttendance: (date) => set((state) => ({ fitness: toggleAttendance(state.fitness, date) })),

        addCoin: (symbol) =>
          set((state) => {
            const clean = symbol.trim().toUpperCase();
            if (clean === '' || state.coins.some((coin) => coin.symbol === clean)) {
              return {};
            }
            return { coins: [...state.coins, { symbol: clean, amount: 0, priceGbp: 0 }] };
          }),
        updateCoin: (index, patch) =>
          set((state) => ({
            coins: state.coins.map((coin, position) => {
              if (position !== index) {
                return coin;
              }
              const next = { ...coin, ...patch };
              return {
                symbol: next.symbol,
                amount: Number.isFinite(next.amount) ? Math.max(0, next.amount) : 0,
                priceGbp: Number.isFinite(next.priceGbp) ? Math.max(0, next.priceGbp) : 0,
              };
            }),
          })),
        removeCoin: (index) => set((state) => ({ coins: without(state.coins, index) })),
        saveSnapshot: (date) =>
          set((state) => ({
            snapshots: upsertSnapshot(state.snapshots, date, portfolioValue(state.coins)),
          })),
        toggleTranche: (date) =>
          set((state) => {
            const month = monthKey(date);
            const tranche = { ...state.tranche };
            if (tranche[month]) {
              delete tranche[month];
            } else {
              tranche[month] = true;
            }
            return { tranche };
          }),

        addSetup: (setup) => set((state) => ({ setups: [...state.setups, setup] })),
        addTrade: (trade) => set((state) => ({ trades: [...state.trades, trade] })),
        removeTrade: (index) => set((state) => ({ trades: without(state.trades, index) })),
        addPayout: (payout) => set((state) => ({ payouts: [...state.payouts, payout] })),
        removePayout: (index) => set((state) => ({ payouts: without(state.payouts, index) })),
        setRiskPercent: (value) =>
          set({ riskPercent: Number.isFinite(value) ? Math.max(0, value) : 0 }),

        addMilestone: (list, text) =>
          set((state) => {
            const clean = text.trim();
            if (clean === '') {
              return {};
            }
            return { [list]: [...state[list], { text: clean, done: false }] };
          }),
        toggleMilestone: (list, index) =>
          set((state) => ({
            [list]: state[list].map((item, position) =>
              position === index ? { ...item, done: !item.done } : item,
            ),
          })),
        removeMilestone: (list, index) => set((state) => ({ [list]: without(state[list], index) })),

        addCard: (q, a, today) =>
          set((state) => {
            if (q.trim() === '' || a.trim() === '') {
              return {};
            }
            const card: Card = { q: q.trim(), a: a.trim(), box: 1, due: today };
            return { cards: [...state.cards, card] };
          }),
        removeCard: (index) => set((state) => ({ cards: without(state.cards, index) })),
        answerCard: (index, correct, today) =>
          set((state) => {
            if (!state.cards[index]) {
              return {};
            }
            return {
              cards: state.cards.map((card, position) =>
                position === index ? reviewCard(card, correct, today) : card,
              ),
              cardReviews: state.cardReviews + 1,
            };
          }),

        addPlan: (plan) =>
          set((state) => {
            const cue = plan.cue.trim();
            const action = plan.action.trim();
            if (cue === '' || action === '') {
              return {};
            }
            return { plans: [...state.plans, { cue, action }] };
          }),
        removePlan: (index) => set((state) => ({ plans: without(state.plans, index) })),
        parkIdea: (text, date) =>
          set((state) => {
            const clean = text.trim();
            if (clean === '') {
              return {};
            }
            return { parked: [...state.parked, { text: clean, date }] };
          }),

        setReward: (index, text) =>
          set((state) => {
            const rewards: [string, string, string] = [...state.rewards];
            rewards[index] = text;
            return { rewards };
          }),
        claimReward: (index) =>
          set((state) => {
            if (!rewardStatuses(state)[index].met) {
              return {};
            }
            const claimed: [boolean, boolean, boolean] = [...state.claimed];
            claimed[index] = true;
            return { claimed };
          }),
        setWeekTemplate: (weekday, tasks) =>
          set((state) => ({
            weekTemplate: {
              ...state.weekTemplate,
              [weekday]: tasks.map((task) => task.trim()).filter((task) => task !== ''),
            },
          })),

        readChapter: (date) =>
          set((state) => {
            const book = currentBook(state.books);
            if (!book) {
              return {};
            }
            return {
              books: readChapter(state.books),
              chapterNotes: [
                ...state.chapterNotes,
                { date, book: book.title, idea: '', action: '' },
              ],
            };
          }),
        updateChapterNote: (index, patch) =>
          set((state) => ({
            chapterNotes: state.chapterNotes.map((note, position) =>
              position === index ? { ...note, ...patch } : note,
            ),
          })),
        setBookChapters: (index, chapters) =>
          set((state) => ({ books: setChapters(state.books, index, chapters) })),
        moveBook: (index, direction) =>
          set((state) => ({ books: moveBook(state.books, index, direction) })),
        addBook: (book) =>
          set((state) => {
            if (book.title.trim() === '') {
              return {};
            }
            return {
              books: addBook(state.books, {
                ...book,
                title: book.title.trim(),
                author: book.author.trim(),
                chapters: whole(book.chapters),
              }),
            };
          }),

        setStartDate: (date) => set(isDateKey(date) ? { startDate: date } : {}),
        setSetting: (key, value) =>
          set({ [key]: whole(value, key === 'baseContacted' ? 0 : 1) }),
        completeOnboarding: (answers) => set({ ...buildFromAnswers(dataOf(get()), answers) }),
        skipOnboarding: () => set({ onboarded: true }),
        reopenOnboarding: () => set({ onboarded: false }),
        replaceState: (state) => set({ ...sanitizeState(state) }),
        resetState: () => set({ ...createDefaultState() }),
      },
    }),
    {
      name: STORAGE_KEY,
      version: STATE_VERSION,
      storage,
      partialize: dataOf,
      migrate: (persisted) => sanitizeState(persisted),
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeState(persisted),
        books: normalizeBooks(sanitizeState(persisted).books),
      }),
    },
  ),
);

/** The actions never change, so this hook does not cause a new render. */
export function useHubActions(): HubActions {
  return useHub((state) => state.actions);
}
