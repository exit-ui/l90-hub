export type DateKey = string; // "YYYY-MM-DD", local date

export interface DayRecord {
  dm: number;
  done: Record<string, boolean>;
  win: string;
  next: string;
  chartChecks: number;
  vetSend: number;
  vetSkip: number;
  /** True after "Sign off the day". A tick on a sign-off task does not set it. Older records have no flag. */
  signedOff?: boolean;
}

export interface Session {
  date: DateKey;
  type: string;
  minutes: number;
  note: string;
}

export interface Coin {
  symbol: string;
  amount: number;
  priceGbp: number;
}

export interface Snapshot {
  date: DateKey;
  valueGbp: number;
}

export type Market = 'Forex' | 'BTC perp' | 'Other';
export type Direction = 'long' | 'short';

export interface Trade {
  date: DateKey;
  market: Market;
  instrument: string;
  direction: Direction;
  resultR: number;
  followedRules: boolean;
  note: string;
}

export interface Payout {
  date: DateKey;
  firm: string;
  amountGbp: number;
}

export type SetupResult = 'taken' | 'missed';

export interface Setup {
  date: DateKey;
  text: string;
  result: SetupResult;
}

export interface Milestone {
  text: string;
  done: boolean;
}

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface Card {
  q: string;
  a: string;
  box: LeitnerBox;
  due: DateKey;
}

export interface Plan {
  cue: string;
  action: string;
}

export type BookTag = 'Harvard research' | 'Research' | 'Mindset classic';
export type BookStatus = 'current' | 'next' | 'queue' | 'done';

export interface Book {
  title: string;
  author: string;
  tag: BookTag;
  chapters: number;
  read: number;
  status: BookStatus;
}

export interface ChapterNote {
  date: DateKey;
  book: string;
  idea: string;
  action: string;
}

export interface Funnel {
  sourced: number;
  opened: number;
  replied: number;
  positive: number;
  loomSent: number;
  loomWatched: number;
  replyAfterLoom: number;
  booked: number;
  attended: number;
  closed: number;
}

export type FunnelKey = keyof Funnel;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ParkedIdea {
  text: string;
  date: DateKey;
}

export interface HubState {
  version: number;
  /** True after the user answers or skips the setup questions. */
  onboarded: boolean;
  startDate: DateKey;
  dmTarget: number;
  baseContacted: number;
  fitTarget: number;
  learnTarget: number;
  chartCheckLimit: number;
  days: Record<DateKey, DayRecord>;
  funnel: Funnel;
  weekFix: string;
  seeds: string[];
  fitness: Session[];
  learning: Session[];
  coins: Coin[];
  snapshots: Snapshot[];
  tranche: Record<string, boolean>;
  setups: Setup[];
  trades: Trade[];
  payouts: Payout[];
  riskPercent: number;
  lessons: Milestone[];
  workMilestones: Milestone[];
  cards: Card[];
  cardReviews: number;
  plans: Plan[];
  parked: ParkedIdea[];
  rewards: [string, string, string];
  claimed: [boolean, boolean, boolean];
  weekTemplate: Record<Weekday, string[]>;
  books: Book[];
  chapterNotes: ChapterNote[];
}

export type NoticeKind = 'WARNING' | 'CAUTION' | 'NOTE';

export interface Directive {
  kind: NoticeKind;
  text: string;
}

export type SettingKey =
  | 'dmTarget'
  | 'baseContacted'
  | 'fitTarget'
  | 'learnTarget'
  | 'chartCheckLimit';

export type MilestoneList = 'lessons' | 'workMilestones';
export type SessionList = 'fitness' | 'learning';
export type RewardIndex = 0 | 1 | 2;
