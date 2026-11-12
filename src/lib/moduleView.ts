import type { DateKey, HubState } from '@/store/types';
import { currentBook } from './books';
import { formatR } from './format';
import { dueCardIndexes } from './leitner';
import {
  nextTask,
  PILLAR_IDS,
  PILLAR_LABELS,
  type PillarId,
  splitTask,
  tasksByPillar,
} from './pillars';
import { type PageId } from './routes';
import { sessionsInWeek } from './sessions';
import { tasksForDate } from './status';
import { dmSeries, type Momentum, momentum } from './streak';
import { fractionOf } from './summary';
import { tradeStats } from './trading';

/** A module shows this many ticks. With more ticks it shows 3 and a "Show N more" button. */
export const MAX_VISIBLE_TICKS = 4;
export const COLLAPSED_TICKS = 3;
/** The Outreach hint asks for 1 DM from this hour with 0 DMs. */
export const NUDGE_HOUR = 16;
export interface CompletionInput {
  id: PillarId;
  ticksDone: number;
  ticksTotal: number;
  /** Outreach only: the DMs of the day and the target. */
  dm?: number;
  target?: number;
  /** Sign-off only: true after "Sign off the day". */
  signedOff?: boolean;
}

/**
 * The green "Done" state of a module. Every tick of the module is done; Outreach also needs
 * the DM target; Sign-off also needs the sign-off. A module with no tick is done only for
 * Outreach (target met) and Sign-off (signed off).
 */
export function isModuleComplete(input: CompletionInput): boolean {
  const ticksDone = input.ticksTotal === 0 || input.ticksDone >= input.ticksTotal;
  switch (input.id) {
    case 'outreach':
      return ticksDone && (input.target ?? 0) > 0 && (input.dm ?? 0) >= (input.target ?? 0);
    case 'signoff':
      return ticksDone && input.signedOff === true;
    default:
      return input.ticksTotal > 0 && ticksDone;
  }
}

/** True when the day needs nothing more: each module is done, or has no tick today. */
export function allModulesComplete(modules: readonly Pick<ModuleView, 'id' | 'complete' | 'ticks'>[]): boolean {
  return modules.every(
    (module) => module.complete || (module.ticks.length === 0 && module.id !== 'outreach' && module.id !== 'signoff'),
  );
}

/** The bars of the "Last 7 days" strip: the tallest is 40 px, the lowest 4 px. */
export const WEEK_BAR_MAX_PX = 40;
export const WEEK_BAR_MIN_PX = 4;
/** The bar says "N more" from this fraction of the goal. */
export const NEAR_GOAL = 0.75;

export interface TickView {
  /** The full task text. It is also the key of the done record. */
  task: string;
  cue: string | null;
  action: string;
  done: boolean;
  isNext: boolean;
}

export type BarTone = 'progress' | 'complete' | 'limit';

export interface ModuleView {
  id: PillarId;
  name: string;
  /** The page that the module name opens. */
  page: PageId;
  pageSegments: string[];
  ticks: TickView[];
  doneCount: number;
  /** The big number as a value, and how to show it. */
  value: number;
  valueText: string;
  unit: string;
  /** 0 to 1 for the bar at the bottom of the module. */
  fraction: number;
  barTone: BarTone;
  barLabel: string;
  /** A short line above the bar, for example "1 more". Null for no line. */
  note: string | null;
  complete: boolean;
  /** The word in the ratio slot, for example "Done". Null shows the ratio. */
  badge?: 'Done' | null;
  /** The line for a module with no task today, in the expanded view. */
  emptyLine: string;
  /** The same line, short enough for one line in a half-width module. */
  emptyShort: string;
  /** The text for the live region of the module. */
  announce: string;
}

export interface TodayView {
  modules: ModuleView[];
  next: string | null;
  /** True when every module is done: Today shows one calm green line. */
  allComplete: boolean;
  /** True when all modules except Sign-off are complete. Sign-off then becomes the primary button. */
  othersComplete: boolean;
  momentum: Momentum;
  /** True when all sign-off ticks of the day are done. */
  signedOff: boolean;
  ticksDone: number;
  ticksTotal: number;
  cardsDue: number;
  /** The DMs of the last 7 days, oldest first, as a share of the highest value or the target. */
  recentDms: { date: DateKey; value: number; fraction: number; barPx: number; isToday: boolean }[];
}

type TodayState = Pick<
  HubState,
  | 'days'
  | 'weekTemplate'
  | 'dmTarget'
  | 'fitTarget'
  | 'learnTarget'
  | 'chartCheckLimit'
  | 'fitness'
  | 'learning'
  | 'books'
  | 'chapterNotes'
  | 'trades'
  | 'cards'
>;

function nearNote(value: number, goal: number): string | null {
  const fraction = fractionOf(value, goal);
  if (goal <= 0 || fraction < NEAR_GOAL || fraction >= 1) {
    return null;
  }
  return `${Math.ceil(goal - value)} more`;
}

/** The Outreach line under the number. */
export function outreachNote(dm: number, target: number, hour: number): string {
  if (target > 0 && dm >= target) {
    return 'Target hit. Each extra DM is a bonus.';
  }
  if (dm === 0 && hour >= NUDGE_HOUR) {
    return 'Send 1 DM now.';
  }
  const left = Math.max(0, target - dm);
  return left === 1 ? '1 more to the target.' : `${left} more to the target.`;
}

const EMPTY_LINES: Readonly<Record<PillarId, string>> = {
  outreach: 'No outreach task today.',
  fitness: 'No fitness task today.',
  learning: 'No learning task today.',
  reading: 'No reading task today.',
  trading: 'No trading task today.',
  signoff: 'No sign-off task today.',
};

const PAGES: Readonly<Record<PillarId, [PageId, ...string[]]>> = {
  outreach: ['outreach'],
  fitness: ['fitness'],
  learning: ['learning'],
  reading: ['learning', 'reading'],
  trading: ['trading'],
  signoff: ['progress'],
};

/** All the data of the Today page. The components only show it. */
export function todayView(state: TodayState, today: DateKey, now: Date): TodayView {
  const record = state.days[today];
  const done = record?.done ?? {};
  const allTasks = tasksForDate(state.weekTemplate, today);
  const groups = tasksByPillar(state.weekTemplate, today);
  const next = nextTask(allTasks, done, now);
  const ticksDone = allTasks.filter((task) => done[task] === true).length;
  const ticksTotal = allTasks.length;
  const cardsDue = dueCardIndexes(state.cards, today).length;
  const dm = record?.dm ?? 0;
  const signedOff = record?.signedOff === true;

  const build = (id: PillarId): ModuleView => {
    const ticks: TickView[] = groups[id].map((task) => ({
      task,
      ...splitTask(task),
      done: done[task] === true,
      isNext: task === next,
    }));
    const doneCount = ticks.filter((tick) => tick.done).length;
    const ticksComplete = ticks.length > 0 && doneCount === ticks.length;
    const [page, ...pageSegments] = PAGES[id];
    const tickText = ticks.length === 0 ? '' : ` ${doneCount} of ${ticks.length} ticks done.`;
    const base = {
      id,
      name: PILLAR_LABELS[id],
      page,
      pageSegments,
      ticks,
      doneCount,
      emptyLine: EMPTY_LINES[id],
      emptyShort: 'No task today.',
    };

    switch (id) {
      case 'outreach': {
        const fraction = fractionOf(dm, state.dmTarget);
        const complete = isModuleComplete({
          id,
          ticksDone: doneCount,
          ticksTotal: ticks.length,
          dm,
          target: state.dmTarget,
        });
        return {
          ...base,
          value: dm,
          valueText: String(dm),
          unit: `/ ${state.dmTarget}`,
          fraction,
          barTone: complete ? 'complete' : 'progress',
          barLabel: `${dm} of ${state.dmTarget} DMs`,
          note: outreachNote(dm, state.dmTarget, now.getHours()),
          complete,
          announce: `${dm} of ${state.dmTarget} DMs.${tickText}`,
        };
      }
      case 'fitness':
      case 'learning': {
        const sessions = id === 'fitness' ? state.fitness : state.learning;
        const goal = id === 'fitness' ? state.fitTarget : state.learnTarget;
        const week = sessionsInWeek(sessions, today);
        const noun = id === 'fitness' ? 'gym sessions' : 'learning sessions';
        return {
          ...base,
          value: week,
          valueText: String(week),
          unit: `/ ${goal}`,
          fraction: fractionOf(week, goal),
          barTone: ticksComplete ? 'complete' : 'progress',
          barLabel: `${week} of ${goal} ${noun} this week`,
          note: nearNote(week, goal),
          complete: ticksComplete,
          announce: `${week} of ${goal} ${noun} this week.${tickText}`,
        };
      }
      case 'reading': {
        const book = currentBook(state.books);
        const readToday = state.chapterNotes.filter((note) => note.date === today).length;
        const read = book?.read ?? 0;
        const unit = book && book.chapters > 0 ? `of ${book.chapters}` : 'chapters';
        return {
          ...base,
          value: read,
          valueText: String(read),
          unit,
          fraction: fractionOf(readToday, 1),
          barTone: ticksComplete || readToday >= 1 ? 'complete' : 'progress',
          barLabel: `${readToday} of 1 chapter today`,
          note: null,
          complete: ticksComplete,
          announce: `Chapter ${read}. ${readToday} of 1 chapter today.`,
        };
      }
      case 'trading': {
        const total = tradeStats(state.trades).cumulativeR ?? 0;
        const checks = record?.chartChecks ?? 0;
        const atLimit = checks >= state.chartCheckLimit;
        return {
          ...base,
          value: total,
          valueText: formatR(total).replace(/R$/, ''),
          unit: 'R',
          fraction: fractionOf(checks, state.chartCheckLimit),
          barTone: atLimit ? 'limit' : ticksComplete ? 'complete' : 'progress',
          barLabel: `${checks} of ${state.chartCheckLimit} chart checks used`,
          note: atLimit ? 'Chart check limit reached.' : null,
          complete: ticksComplete,
          announce: `${checks} of ${state.chartCheckLimit} chart checks used.${tickText}`,
        };
      }
      case 'signoff': {
        // One definition for the number, the bar and "Done": the ticks of the whole day.
        const percent = ticksTotal === 0 ? 0 : Math.round((ticksDone / ticksTotal) * 100);
        const dayComplete = isModuleComplete({
          id,
          ticksDone: doneCount,
          ticksTotal: ticks.length,
          signedOff,
        });
        return {
          ...base,
          value: percent,
          valueText: String(percent),
          unit: '%',
          fraction: fractionOf(ticksDone, ticksTotal),
          barTone: dayComplete ? 'complete' : 'progress',
          barLabel: `${ticksDone} of ${ticksTotal} ticks of the day done`,
          note: signedOff ? null : nearNote(ticksDone, ticksTotal),
          complete: dayComplete,
          badge: dayComplete ? 'Done' : null,
          announce: signedOff ? `Signed off. ${percent} % of the day done.` : `${percent} % of the day done.`,
        };
      }
    }
  };

  const modules = PILLAR_IDS.map(build);
  const others = modules.filter((module) => module.id !== 'signoff');
  const othersComplete = others.every(
    (module) => module.complete || (module.ticks.length === 0 && module.id !== 'outreach'),
  );
  return {
    modules,
    next,
    allComplete: allModulesComplete(modules),
    othersComplete,
    momentum: momentum(state.days, today, state.dmTarget),
    signedOff: record?.signedOff === true,
    ticksDone,
    ticksTotal,
    cardsDue,
    recentDms: (() => {
      const series = dmSeries(state.days, today, 7);
      const top = Math.max(state.dmTarget, ...series.map((point) => point.value), 1);
      return series.map((point) => ({
        date: point.date,
        value: point.value,
        fraction: point.value / top,
        barPx: Math.max(WEEK_BAR_MIN_PX, Math.round((point.value / top) * WEEK_BAR_MAX_PX)),
        isToday: point.date === today,
      }));
    })(),
  };
}

export interface MomentumText {
  lead: string;
  detail: string | null;
  recover: boolean;
}

/** The words of the momentum chip. It never shows a 0: a fresh start says "Start today". */
export function momentumText(value: Momentum): MomentumText {
  if (value.daysOnTarget <= 0) {
    return { lead: 'Start today', detail: null, recover: false };
  }
  const lead = `${value.daysOnTarget} ${value.daysOnTarget === 1 ? 'day' : 'days'} on target`;
  if (value.state === 'active') {
    return { lead, detail: `Streak ${value.streak}`, recover: false };
  }
  if (value.state === 'recover') {
    return { lead, detail: 'Recover today', recover: true };
  }
  return {
    lead,
    detail: value.best > 0 ? `Best: ${value.best} ${value.best === 1 ? 'day' : 'days'}` : null,
    recover: false,
  };
}

export interface MomentumShort {
  /** The few characters on the phone chip. */
  text: string;
  /** The full words for a screen reader. */
  label: string;
  recover: boolean;
}

/** The phone chip (round 6): the days on target as one number, or "Start". The label holds all the words. */
export function momentumShort(value: Momentum): MomentumShort {
  const full = momentumText(value);
  const label = `${full.detail ? `${full.lead}, ${full.detail.toLowerCase()}` : full.lead}. Open Progress.`;
  if (value.daysOnTarget <= 0) {
    return { text: 'Start', label, recover: false };
  }
  return { text: String(value.daysOnTarget), label, recover: full.recover };
}
