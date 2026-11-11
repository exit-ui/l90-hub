import type { HubState } from '@/store/types';
import { totalDms } from './streak';

export const XP_VALUES = {
  dm: 5,
  task: 10,
  win: 20,
  gym: 30,
  learning: 30,
  chapter: 15,
  cardReview: 2,
  milestone: 40,
} as const;

export const XP_RULES: readonly { label: string; xp: number }[] = [
  { label: 'DM sent', xp: XP_VALUES.dm },
  { label: 'Task complete', xp: XP_VALUES.task },
  { label: 'Daily win written', xp: XP_VALUES.win },
  { label: 'Gym session', xp: XP_VALUES.gym },
  { label: 'Learning session', xp: XP_VALUES.learning },
  { label: 'Chapter read', xp: XP_VALUES.chapter },
  { label: 'Card review', xp: XP_VALUES.cardReview },
  { label: 'Lesson or milestone complete', xp: XP_VALUES.milestone },
];

type XpInput = Pick<
  HubState,
  'days' | 'fitness' | 'learning' | 'books' | 'cardReviews' | 'lessons' | 'workMilestones'
>;

/** XP comes from the state. The hub does not store XP. */
export function totalXp(state: XpInput): number {
  const records = Object.values(state.days);
  const tasks = records.reduce(
    (sum, record) => sum + Object.values(record.done).filter(Boolean).length,
    0,
  );
  const wins = records.filter((record) => record.win.trim() !== '').length;
  const chapters = state.books.reduce((sum, book) => sum + book.read, 0);
  const milestones =
    state.lessons.filter((item) => item.done).length +
    state.workMilestones.filter((item) => item.done).length;
  return (
    totalDms(state.days) * XP_VALUES.dm +
    tasks * XP_VALUES.task +
    wins * XP_VALUES.win +
    state.fitness.length * XP_VALUES.gym +
    state.learning.length * XP_VALUES.learning +
    chapters * XP_VALUES.chapter +
    state.cardReviews * XP_VALUES.cardReview +
    milestones * XP_VALUES.milestone
  );
}

const LEVEL_STEP = 150;

/** Level = floor((1 + sqrt(1 + 8 * xp / 150)) / 2). */
export function levelForXp(xp: number): number {
  return Math.floor((1 + Math.sqrt(1 + (8 * Math.max(0, xp)) / LEVEL_STEP)) / 2);
}

/** The lowest XP for a level. Level 1 starts at 0. */
export function xpForLevel(level: number): number {
  return (LEVEL_STEP * level * (level - 1)) / 2;
}

export interface LevelProgress {
  xp: number;
  level: number;
  floor: number;
  ceiling: number;
  /** 0 to 1 inside the current level. */
  fraction: number;
  toNext: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  return {
    xp,
    level,
    floor,
    ceiling,
    fraction: (xp - floor) / (ceiling - floor),
    toNext: ceiling - xp,
  };
}
