import { emptyDay } from '@/store/defaults';
import type { Coin, DateKey, Funnel, FunnelKey, HubState } from '@/store/types';
import { currentBook, normalizeBooks } from './books';
import { addDays, diffDays, isDateKey, rangeOfDays } from './dates';
import { FUNNEL_INPUTS } from './funnel';
import { totalContacted } from './streak';

export const ONBOARDING_STEPS = [
  'mission',
  'targets',
  'past',
  'funnel',
  'book',
  'wallet',
  'rewards',
  'review',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const STEP_TITLES: Readonly<Record<OnboardingStep, string>> = {
  mission: 'The mission',
  targets: 'Targets and limits',
  past: 'DMs before today',
  funnel: 'The funnel so far',
  book: 'The book',
  wallet: 'The crypto wallet',
  rewards: 'The rewards',
  review: 'Check the numbers',
};

/** The most past days that the questions list. */
const MAX_PAST_DAYS = 90;

export interface DraftCoin {
  symbol: string;
  amount: string;
  price: string;
}

/** The raw text of each answer. The fields hold text, so the user can type freely. */
export interface Draft {
  startDate: string;
  dmTarget: string;
  baseContacted: string;
  fitTarget: string;
  learnTarget: string;
  chartCheckLimit: string;
  riskPercent: string;
  pastDm: Record<DateKey, string>;
  funnel: Record<FunnelKey, string>;
  bookChapters: string;
  bookRead: string;
  coins: DraftCoin[];
  rewards: [string, string, string];
}

export type ScalarDraftKey =
  | 'startDate'
  | 'dmTarget'
  | 'baseContacted'
  | 'fitTarget'
  | 'learnTarget'
  | 'chartCheckLimit'
  | 'riskPercent'
  | 'bookChapters'
  | 'bookRead';

/** The answers as numbers, ready for the store. */
export interface OnboardingAnswers {
  startDate: DateKey;
  dmTarget: number;
  baseContacted: number;
  fitTarget: number;
  learnTarget: number;
  chartCheckLimit: number;
  riskPercent: number;
  pastDm: Record<DateKey, number>;
  funnel: Funnel;
  bookChapters: number;
  bookRead: number;
  coins: Coin[];
  rewards: [string, string, string];
}

/** The days from the start date to yesterday. Today has its own task card. */
export function pastDates(startDate: string, today: DateKey): DateKey[] {
  if (!isDateKey(startDate)) {
    return [];
  }
  const last = addDays(today, -1);
  if (diffDays(last, startDate) < 0) {
    return [];
  }
  return rangeOfDays(startDate, last).slice(0, MAX_PAST_DAYS);
}

function zeroAsEmpty(value: number): string {
  return value === 0 ? '' : String(value);
}

/** The first draft. It holds the values that the hub has now. */
export function draftFromState(state: HubState, today: DateKey): Draft {
  const pastDm: Record<DateKey, string> = {};
  for (const date of pastDates(state.startDate, today)) {
    const dm = state.days[date]?.dm ?? 0;
    pastDm[date] = zeroAsEmpty(dm);
  }
  const funnel = {} as Record<FunnelKey, string>;
  for (const { key } of FUNNEL_INPUTS) {
    funnel[key] = zeroAsEmpty(state.funnel[key]);
  }
  const book = currentBook(state.books);
  return {
    startDate: state.startDate,
    dmTarget: String(state.dmTarget),
    baseContacted: String(state.baseContacted),
    fitTarget: String(state.fitTarget),
    learnTarget: String(state.learnTarget),
    chartCheckLimit: String(state.chartCheckLimit),
    riskPercent: String(state.riskPercent),
    pastDm,
    funnel,
    bookChapters: String(book?.chapters ?? 0),
    bookRead: String(book?.read ?? 0),
    coins: state.coins.map((coin) => ({
      symbol: coin.symbol,
      amount: zeroAsEmpty(coin.amount),
      price: zeroAsEmpty(coin.priceGbp),
    })),
    rewards: [...state.rewards],
  };
}

/** A whole number from text. Empty text, a decimal or text that is not a number gives null. */
function wholeOrNull(text: string): number | null {
  if (text.trim() === '') {
    return null;
  }
  const value = Number(text);
  return Number.isInteger(value) ? value : null;
}

/** A number from text. Empty text, or text that is not a number, gives null. */
function numberOrNull(text: string): number | null {
  if (text.trim() === '') {
    return null;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function wholeError(minimum: number): string {
  return `The value is not correct. Enter a whole number of ${minimum} or more.`;
}

export type StepErrors = Record<string, string>;

const SCALAR_MINIMUMS: Readonly<Record<Exclude<ScalarDraftKey, 'startDate' | 'riskPercent'>, number>> = {
  dmTarget: 1,
  baseContacted: 0,
  fitTarget: 1,
  learnTarget: 1,
  chartCheckLimit: 1,
  bookChapters: 0,
  bookRead: 0,
};

function checkWhole(errors: StepErrors, key: keyof typeof SCALAR_MINIMUMS, draft: Draft): void {
  const value = wholeOrNull(draft[key]);
  if (value === null || value < SCALAR_MINIMUMS[key]) {
    errors[key] = wholeError(SCALAR_MINIMUMS[key]);
  }
}

/** The errors of one step. An empty result means that the user can continue. */
export function stepErrors(step: OnboardingStep, draft: Draft, today: DateKey): StepErrors {
  const errors: StepErrors = {};
  switch (step) {
    case 'mission':
      if (!isDateKey(draft.startDate)) {
        errors.startDate = 'The date is not complete. Select a day, a month and a year.';
      }
      checkWhole(errors, 'dmTarget', draft);
      checkWhole(errors, 'baseContacted', draft);
      break;
    case 'targets': {
      checkWhole(errors, 'fitTarget', draft);
      checkWhole(errors, 'learnTarget', draft);
      checkWhole(errors, 'chartCheckLimit', draft);
      const risk = numberOrNull(draft.riskPercent);
      if (risk === null || risk <= 0 || risk > 100) {
        errors.riskPercent = 'The value is not correct. Enter a number above 0, for example 1.';
      }
      break;
    }
    case 'past':
      for (const date of pastDates(draft.startDate, today)) {
        const text = draft.pastDm[date] ?? '';
        if (text.trim() !== '') {
          const value = wholeOrNull(text);
          if (value === null || value < 0) {
            errors[`past-${date}`] = wholeError(0);
          }
        }
      }
      break;
    case 'funnel':
      for (const { key } of FUNNEL_INPUTS) {
        const text = draft.funnel[key];
        if (text.trim() !== '') {
          const value = wholeOrNull(text);
          if (value === null || value < 0) {
            errors[`funnel-${key}`] = wholeError(0);
          }
        }
      }
      break;
    case 'book': {
      checkWhole(errors, 'bookChapters', draft);
      checkWhole(errors, 'bookRead', draft);
      const chapters = wholeOrNull(draft.bookChapters);
      const read = wholeOrNull(draft.bookRead);
      if (chapters !== null && read !== null && chapters > 0 && read > chapters && !errors.bookRead) {
        errors.bookRead = 'The chapters read are above the chapters in the book. Correct one number.';
      }
      break;
    }
    case 'wallet':
      draft.coins.forEach((coin, index) => {
        for (const field of ['amount', 'price'] as const) {
          const text = coin[field];
          const value = numberOrNull(text);
          if (text.trim() !== '' && (value === null || value < 0)) {
            errors[`coin-${index}-${field}`] = 'The value is not correct. Enter a number of 0 or more.';
          }
        }
      });
      break;
    case 'rewards':
    case 'review':
      break;
  }
  return errors;
}

/** The steps to show. The past days step is only there when the start date is before today. */
export function visibleSteps(draft: Draft, today: DateKey): OnboardingStep[] {
  const hasPast = pastDates(draft.startDate, today).length > 0;
  return ONBOARDING_STEPS.filter((step) => step !== 'past' || hasPast);
}

/** True when every visible step has no error. */
export function draftIsValid(draft: Draft, today: DateKey): boolean {
  return visibleSteps(draft, today).every(
    (step) => Object.keys(stepErrors(step, draft, today)).length === 0,
  );
}

function whole(text: string, fallback = 0): number {
  return wholeOrNull(text) ?? fallback;
}

/** Turns the text of the draft into numbers. Call this when the draft has no errors. */
export function answersFromDraft(draft: Draft, today: DateKey): OnboardingAnswers {
  const pastDm: Record<DateKey, number> = {};
  for (const date of pastDates(draft.startDate, today)) {
    pastDm[date] = Math.max(0, whole(draft.pastDm[date] ?? ''));
  }
  const funnel = {} as Funnel;
  for (const { key } of FUNNEL_INPUTS) {
    funnel[key] = Math.max(0, whole(draft.funnel[key]));
  }
  return {
    startDate: draft.startDate,
    dmTarget: Math.max(1, whole(draft.dmTarget, 1)),
    baseContacted: Math.max(0, whole(draft.baseContacted)),
    fitTarget: Math.max(1, whole(draft.fitTarget, 1)),
    learnTarget: Math.max(1, whole(draft.learnTarget, 1)),
    chartCheckLimit: Math.max(1, whole(draft.chartCheckLimit, 1)),
    riskPercent: Math.max(0, numberOrNull(draft.riskPercent) ?? 1),
    pastDm,
    funnel,
    bookChapters: Math.max(0, whole(draft.bookChapters)),
    bookRead: Math.max(0, whole(draft.bookRead)),
    coins: draft.coins.map((coin) => ({
      symbol: coin.symbol,
      amount: Math.max(0, numberOrNull(coin.amount) ?? 0),
      priceGbp: Math.max(0, numberOrNull(coin.price) ?? 0),
    })),
    rewards: [...draft.rewards],
  };
}

/** The state after the user answers the questions. */
export function buildFromAnswers(state: HubState, answers: OnboardingAnswers): HubState {
  const days = { ...state.days };
  for (const [date, dm] of Object.entries(answers.pastDm)) {
    const existing = days[date];
    if (existing) {
      days[date] = { ...existing, dm };
    } else if (dm > 0) {
      days[date] = { ...emptyDay(), dm };
    }
  }

  const bookIndex = state.books.findIndex((book) => book.status === 'current');
  const books = normalizeBooks(
    state.books.map((book, index) =>
      index === bookIndex
        ? {
            ...book,
            chapters: answers.bookChapters,
            read:
              answers.bookChapters > 0
                ? Math.min(answers.bookRead, answers.bookChapters)
                : answers.bookRead,
          }
        : book,
    ),
  );

  return {
    ...state,
    onboarded: true,
    startDate: answers.startDate,
    dmTarget: answers.dmTarget,
    baseContacted: answers.baseContacted,
    fitTarget: answers.fitTarget,
    learnTarget: answers.learnTarget,
    chartCheckLimit: answers.chartCheckLimit,
    riskPercent: answers.riskPercent,
    days,
    funnel: answers.funnel,
    books,
    coins: answers.coins,
    rewards: [...answers.rewards],
  };
}

/** Checks that compare two funnel numbers. A warning does not block the user. */
export function funnelWarnings(funnel: Funnel, contacted: number): string[] {
  const checks: { wrong: boolean; text: string }[] = [
    {
      wrong: funnel.replied > contacted,
      text: 'The count of replies is above the count of contacted creators. Check both numbers.',
    },
    {
      wrong: funnel.positive > funnel.replied,
      text: 'The count of positive replies is above the count of replies. Check both numbers.',
    },
    {
      wrong: funnel.booked > funnel.positive,
      text: 'The count of booked calls is above the count of positive replies. Check both numbers.',
    },
    {
      wrong: funnel.loomWatched > funnel.loomSent,
      text: 'The count of watched Looms is above the count of sent Looms. Check both numbers.',
    },
    {
      wrong: funnel.replyAfterLoom > funnel.loomWatched,
      text: 'The count of replies after a Loom is above the count of watched Looms. Check both numbers.',
    },
    {
      wrong: funnel.attended > funnel.booked,
      text: 'The count of attended calls is above the count of booked calls. Check both numbers.',
    },
    {
      wrong: funnel.closed > funnel.attended,
      text: 'The count of closed pilots is above the count of attended calls. Check both numbers.',
    },
  ];
  return checks.filter((check) => check.wrong).map((check) => check.text);
}

export interface ReviewSummary {
  state: HubState;
  contacted: number;
  daysPast: number;
  daysWithDms: number;
  warnings: string[];
}

/** The numbers that the hub shows after the questions, so the user can check them. */
export function reviewSummary(state: HubState, answers: OnboardingAnswers): ReviewSummary {
  const built = buildFromAnswers(state, answers);
  const contacted = totalContacted(built);
  const values = Object.values(answers.pastDm);
  return {
    state: built,
    contacted,
    daysPast: values.length,
    daysWithDms: values.filter((dm) => dm > 0).length,
    warnings: funnelWarnings(answers.funnel, contacted),
  };
}
