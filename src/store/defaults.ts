import type {
  Book,
  BookStatus,
  BookTag,
  Card,
  DayRecord,
  Directive,
  HubState,
  Milestone,
  Plan,
  Weekday,
} from './types';

export const STATE_VERSION = 1;
export const DEFAULT_START_DATE = '2026-10-20';

const SEND = '06:20 Send the drafted DMs at the bus stop.';
const READ_BUS = 'On the bus home: read 1 chapter.';
const VET = 'Evening block 1 (90 min): vet 20 creators by hand. Draft 20 DMs.';
const LOG = 'Before bed: log the numbers. Write one win.';
const GYM = 'Go to the gym.';
const CODE = 'Do the Linux and Python session.';

function weekdayTasks(block2: string): string[] {
  return [SEND, READ_BUS, VET, block2, LOG];
}

export function defaultWeekTemplate(): Record<Weekday, string[]> {
  return {
    0: [
      'Do the weekly review. Compare the funnel numbers with last week.',
      'Make the monthly crypto tranche decision.',
      'Read 1 chapter.',
      'Vet 20 creators. Draft the DMs for Monday.',
      LOG,
    ],
    1: weekdayTasks(GYM),
    2: weekdayTasks(CODE),
    3: weekdayTasks(GYM),
    4: weekdayTasks(CODE),
    5: weekdayTasks('Rest.'),
    6: [
      'Fix the pipeline. Stop after 3 hours.',
      GYM,
      'Read 1 chapter.',
      'Vet 20 creators by hand. Draft 20 DMs.',
      LOG,
    ],
  };
}

export const DAY_TRADING_RULES: readonly string[] = [
  'Trade the model only. Do not trade a feeling.',
  'Risk the set percentage on each trade. Do not increase the risk after a loss.',
  'Act on a 15m or 4h close. Do not act on a touch.',
  'A thin breakout needs a second close or a retest.',
  'Log each setup: taken or missed.',
  'Do not change a rule before you log 20 setups.',
];

export const CRYPTO_RULES: readonly string[] = [
  'Make fewer, larger swaps. Small swaps lose too much to fees.',
  'Use the extra money only for an unmissable trigger.',
  'Buy on the alert levels. Do not buy because of hype.',
];

export const DIRECTIVES: readonly Directive[] = [
  { kind: 'WARNING', text: 'Do not open the pipeline code before you send the DMs.' },
  {
    kind: 'CAUTION',
    text: 'Do not start a new project. Write the idea in the parked list. Continue the main quest.',
  },
  { kind: 'NOTE', text: 'A missed day does not stop the habit. Send the DMs today.' },
  {
    kind: 'WARNING',
    text: 'Do not look at the charts before the alert. The alert tells you when to look.',
  },
  { kind: 'NOTE', text: 'Small progress is progress. Log one win before bed.' },
  { kind: 'CAUTION', text: 'Do not make the target bigger. Hit the target 25 times first.' },
  {
    kind: 'NOTE',
    text: '40 DMs is not enough data to judge the offer. Get 200 DMs of data first.',
  },
  {
    kind: 'CAUTION',
    text: 'Vet each creator for 60 seconds maximum. Then decide: send or skip.',
  },
  {
    kind: 'NOTE',
    text: 'You do not need motivation. You need the next action. Do the next action.',
  },
  { kind: 'WARNING', text: 'Do not count the build as the work. The DM is the work.' },
];

export const FITNESS_TYPES: readonly string[] = [
  'Push',
  'Pull',
  'Legs',
  'Full body',
  'Cardio',
  'Other',
];
export const LEARNING_TOPICS: readonly string[] = ['Linux', 'Python', 'Pipeline code', 'Other'];
export const VET_QUESTIONS: readonly string[] = [
  'Is the creator solo?',
  'Is the product weak or missing?',
  'Is the audience in the niche?',
];

const LESSONS: readonly string[] = [
  'Week 1: Move through the filesystem (pwd, ls, cd).',
  'Week 2: Control files and permissions.',
  'Week 3: Use pipes, grep and find.',
  'Week 4: Write a shell script.',
  'Week 5: Python: variables and types.',
  'Week 6: Python: loops and functions.',
  'Week 7: Python: read and write files and JSON.',
  'Week 8: Python: call an API.',
  'Week 9: Read the creator-outreach code. Explain each file.',
  'Week 10: Change one function in the pipeline.',
  'Week 11: Write a small tool for the outreach log.',
  'Week 12: Do the closed-book review test.',
];

const WORK_MILESTONES: readonly string[] = [
  'Write the 3-question vet filter from memory.',
  'Send 20 DMs in one day.',
  'Hit the target for 5 days in a row.',
  'Get the first positive reply.',
  'Record and send the first Loom.',
  'Book the first call.',
  'Attend the first call.',
  'Close the first paid pilot.',
  'Launch the product with the creator.',
];

const CARDS: readonly [string, string][] = [
  ['Which command shows the current directory?', 'pwd'],
  ['Which command lists hidden files?', 'ls -a'],
  ['Which command moves up one directory?', 'cd ..'],
  ['Which Python keyword starts a function?', 'def'],
  [
    'What are the 3 vet questions?',
    'Is the creator solo? Is the product weak or missing? Is the audience in the niche?',
  ],
];

const PLANS: readonly Plan[] = [
  { cue: 'I stand at the bus stop', action: 'I send the drafted DMs.' },
  { cue: 'I sit down on the bus home', action: 'I read 1 chapter.' },
  { cue: 'I sit down after work', action: 'I open the seed list and vet 10 creators.' },
  { cue: 'I want to start a new project', action: 'I write the idea in the parked list.' },
  {
    cue: 'I miss one day',
    action: 'I send the DMs the next day. I do not miss two days.',
  },
];

const BOOKS: readonly [BookStatus, BookTag, string, string][] = [
  ['current', 'Mindset classic', 'Key to Living the Law of Attraction', 'Jack Canfield and D.D. Watkins'],
  ['next', 'Research', 'Rethinking Positive Thinking', 'Gabriele Oettingen'],
  ['queue', 'Mindset classic', 'Psycho-Cybernetics', 'Maxwell Maltz'],
  ['queue', 'Harvard research', 'The Progress Principle', 'Teresa Amabile and Steven Kramer'],
  ['queue', 'Research', 'Influence', 'Robert Cialdini'],
  ['queue', 'Harvard research', 'The Happiness Advantage', 'Shawn Achor'],
  ['queue', 'Harvard research', 'Mindfulness', 'Ellen Langer'],
  ['queue', 'Harvard research', 'Stumbling on Happiness', 'Daniel Gilbert'],
  ['queue', 'Research', 'Good Habits, Bad Habits', 'Wendy Wood'],
  ['queue', 'Research', 'Mindset', 'Carol Dweck'],
  ['queue', 'Mindset classic', 'As a Man Thinketh', 'James Allen'],
  ['queue', 'Mindset classic', 'The Success Principles', 'Jack Canfield'],
];

const COINS: readonly string[] = [
  'BTC',
  'XMR',
  'NEAR',
  'ONDO',
  'SOL',
  'ZEC',
  'HYPE',
  'VVV',
  'PENGU',
  'USELESS',
  'USDC',
];

function milestones(texts: readonly string[]): Milestone[] {
  return texts.map((text) => ({ text, done: false }));
}

export function emptyDay(): DayRecord {
  return { dm: 0, done: {}, win: '', next: '', chartChecks: 0, vetSend: 0, vetSkip: 0, signedOff: false };
}

export function createDefaultState(): HubState {
  const cards: Card[] = CARDS.map(([q, a]) => ({ q, a, box: 1, due: DEFAULT_START_DATE }));
  const books: Book[] = BOOKS.map(([status, tag, title, author]) => ({
    title,
    author,
    tag,
    chapters: 0,
    read: 0,
    status,
  }));
  return {
    version: STATE_VERSION,
    onboarded: false,
    startDate: DEFAULT_START_DATE,
    dmTarget: 20,
    baseContacted: 40,
    fitTarget: 3,
    learnTarget: 2,
    chartCheckLimit: 3,
    days: {},
    funnel: {
      sourced: 0,
      opened: 0,
      replied: 0,
      positive: 0,
      loomSent: 0,
      loomWatched: 0,
      replyAfterLoom: 0,
      booked: 0,
      attended: 0,
      closed: 0,
    },
    weekFix: '',
    seeds: ['leonphamdk', 'harleyalexanderr', 'younes.lifts'],
    fitness: [],
    learning: [],
    coins: COINS.map((symbol) => ({ symbol, amount: 0, priceGbp: 0 })),
    snapshots: [],
    tranche: {},
    setups: [],
    trades: [],
    payouts: [],
    riskPercent: 1,
    lessons: milestones(LESSONS),
    workMilestones: milestones(WORK_MILESTONES),
    cards,
    cardReviews: 0,
    plans: PLANS.map((plan) => ({ ...plan })),
    parked: [],
    rewards: ['', '', ''],
    claimed: [false, false, false],
    weekTemplate: defaultWeekTemplate(),
    books,
    chapterNotes: [],
  };
}

export interface DailyLine {
  /** The figure or the idea from Greek myth that the line is about. */
  theme: string;
  text: string;
}

/** One line for each day. The hub wrote these lines. They are not quotations. */
export const DAILY_LINES: readonly DailyLine[] = [
  { theme: 'Sisyphus', text: 'The stone does not get lighter. You get stronger. Push the stone today.' },
  { theme: 'Atlas', text: 'Carry the weight that is yours. Put down the weight that is not.' },
  { theme: 'Odysseus', text: 'The way home is long. Row today. Do not listen to the sirens.' },
  { theme: 'Heracles', text: 'Twelve labours start with one labour. Do the labour of today.' },
  { theme: 'Prometheus', text: 'Take the fire. Accept the cost. Then give the fire to other persons.' },
  { theme: 'Icarus', text: 'Keep the middle path. Do not fly too high on one good day.' },
  { theme: 'Athena', text: 'Think first. Then strike one time, in the correct place.' },
  { theme: 'Hephaestus', text: 'The forge is not a place for applause. Do the work in the dark.' },
  { theme: 'Achilles', text: 'Know your weak point. Guard it before the fight starts.' },
  { theme: 'Theseus', text: 'Hold the thread. One step, then the next step, out of the maze.' },
  { theme: 'Perseus', text: 'Do not look at the fear directly. Look at the task.' },
  { theme: 'Hermes', text: 'Send the message. A message that stays with you moves nothing.' },
  { theme: 'Ares', text: 'Anger is fuel. Aim it at the work. Do not aim it at yourself.' },
  { theme: 'Apollo', text: 'Do one thing with full attention. Then do the next thing.' },
  { theme: 'Artemis', text: 'Hunt one target. A hunter with two targets catches nothing.' },
  { theme: 'Chronos', text: 'Time takes all things. Spend this hour on purpose.' },
  { theme: 'Nike', text: 'Victory is a habit. Win the small thing in front of you.' },
  { theme: 'Hades', text: 'Go down into the hard part. The gold is under the ground.' },
  { theme: 'Poseidon', text: 'You do not control the sea. You control the sail.' },
  { theme: 'Daedalus', text: 'Build the tool only after you know the way out.' },
  { theme: 'Orpheus', text: 'Do not look back. Walk until you are in the light.' },
  { theme: 'Pandora', text: 'After all the trouble leaves the box, hope stays. Open the work again.' },
  { theme: 'Tantalus', text: 'Do not reach for all things. Take the one thing that you can hold.' },
  { theme: 'Hector', text: 'Stand at the gate today. The city sees who stands.' },
  { theme: 'Penelope', text: 'Do the quiet work each day. The long wait has an end.' },
  { theme: 'Zeus', text: 'Make the decision. A storm that does not break helps no field.' },
  { theme: 'The Fates', text: 'You do not cut the thread. You weave the part that is in your hands.' },
  { theme: 'The Oracle', text: 'Know yourself. Then act on what you know.' },
  { theme: 'Sparta', text: 'Use few words. Do many repetitions.' },
  { theme: 'Olympus', text: 'The mountain does not come down. Climb one more step today.' },
];
