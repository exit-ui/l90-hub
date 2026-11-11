import type { DateKey, Weekday } from '@/store/types';
import { weekdayOf } from './dates';
import type { Metric } from './progressSeries';

/** The six areas of a day, in the fixed order of the Today page. */
export const PILLAR_IDS = ['outreach', 'fitness', 'learning', 'reading', 'trading', 'signoff'] as const;

export type PillarId = (typeof PILLAR_IDS)[number];

export const PILLAR_LABELS: Readonly<Record<PillarId, string>> = {
  outreach: 'Outreach',
  fitness: 'Fitness',
  learning: 'Learning',
  reading: 'Reading',
  trading: 'Trading',
  signoff: 'Sign-off',
};

interface PillarRule {
  pillar: PillarId;
  words: readonly string[];
}

const PILLAR_METRICS: Readonly<Record<PillarId, Metric>> = {
  outreach: 'dm',
  fitness: 'gym',
  learning: 'learning',
  reading: 'reading',
  trading: 'r',
  signoff: 'tasks',
};

/** The chart metric of a pillar, for the history chart of its expanded view. */
export function pillarMetric(id: PillarId): Metric {
  return PILLAR_METRICS[id];
}

/** The first rule that matches wins. Each word matches on word boundaries, without case. */
export const PILLAR_RULES: readonly PillarRule[] = [
  { pillar: 'signoff', words: ['log the numbers', 'write one win', 'weekly review', 'before bed'] },
  {
    pillar: 'trading',
    words: ['trade', 'trading', 'tranche', 'crypto', 'wallet', 'chart', 'setup', 'payout'],
  },
  {
    pillar: 'outreach',
    words: ['dm', 'dms', 'creator', 'vet', 'pipeline', 'funnel', 'loom', 'outreach', 'pilot'],
  },
  { pillar: 'fitness', words: ['gym', 'train', 'workout', 'run', 'rest', 'walk'] },
  {
    pillar: 'learning',
    words: ['linux', 'python', 'code', 'lesson', 'flashcard', 'cards', 'course'],
  },
  { pillar: 'reading', words: ['read', 'chapter', 'book'] },
];

function escape(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const MATCHERS: readonly { pillar: PillarId; pattern: RegExp }[] = PILLAR_RULES.map((rule) => ({
  pillar: rule.pillar,
  pattern: new RegExp(`\\b(?:${rule.words.map(escape).join('|')})\\b`, 'i'),
}));

/** The pillar of one task. A task that matches no rule is a close-out item. */
export function pillarOfTask(text: string): PillarId {
  return MATCHERS.find((matcher) => matcher.pattern.test(text))?.pillar ?? 'signoff';
}

/** True for a fitness task that also logs a gym session. */
export function isGymTask(text: string): boolean {
  return pillarOfTask(text) === 'fitness' && /\bgym\b/i.test(text);
}

/** True for a learning task that also logs a learning session. */
export function isStudyTask(text: string): boolean {
  return pillarOfTask(text) === 'learning' && /\b(?:linux|python|code)\b/i.test(text);
}

export interface SplitTask {
  /** The time or the situation that starts the task, for example "06:20". */
  cue: string | null;
  action: string;
}

const MAX_CUE_LENGTH = 40;
const TIME_PREFIX = /^(\d{1,2}:\d{2})\s*:?\s+(.+)$/s;

function upperFirst(text: string): string {
  const clean = text.trim();
  return clean === '' ? clean : clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Splits a task into its cue and its action.
 * A leading time, or a short phrase before the first colon, is the cue.
 */
export function splitTask(text: string): SplitTask {
  const clean = text.trim();
  const time = TIME_PREFIX.exec(clean);
  if (time?.[1] && time[2]) {
    return { cue: time[1], action: upperFirst(time[2]) };
  }
  const colon = clean.indexOf(':');
  if (colon > 0 && colon <= MAX_CUE_LENGTH) {
    const rest = clean.slice(colon + 1);
    if (rest.trim() !== '') {
      return { cue: clean.slice(0, colon).trim(), action: upperFirst(rest) };
    }
  }
  return { cue: null, action: upperFirst(clean) };
}

/** The minutes after midnight of a time cue. Null when the cue is not a time. */
export function cueMinutes(cue: string | null): number | null {
  const match = cue ? /^(\d{1,2}):(\d{2})$/.exec(cue) : null;
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function emptyGroups(): Record<PillarId, string[]> {
  return { outreach: [], fitness: [], learning: [], reading: [], trading: [], signoff: [] };
}

/** The tasks of one day, grouped by pillar. Each group keeps the template order. */
export function groupTasks(tasks: readonly string[]): Record<PillarId, string[]> {
  const groups = emptyGroups();
  for (const task of tasks) {
    groups[pillarOfTask(task)].push(task);
  }
  return groups;
}

export function tasksByPillar(
  template: Record<Weekday, string[]>,
  date: DateKey,
): Record<PillarId, string[]> {
  return groupTasks(template[weekdayOf(date)] ?? []);
}

/** The tasks in pillar order. Inside a pillar the template order stays. */
export function inPillarOrder(tasks: readonly string[]): string[] {
  const groups = groupTasks(tasks);
  return PILLAR_IDS.flatMap((pillar) => groups[pillar]);
}

/**
 * The one task to do now: the first open task whose time cue has come,
 * else the first open task in pillar order. Null when all tasks are done.
 */
export function nextTask(
  tasks: readonly string[],
  done: Readonly<Record<string, boolean>>,
  now: Date,
): string | null {
  const open = inPillarOrder(tasks).filter((task) => done[task] !== true);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const timed = open.find((task) => {
    const at = cueMinutes(splitTask(task).cue);
    return at !== null && at <= minutes;
  });
  return timed ?? open[0] ?? null;
}
