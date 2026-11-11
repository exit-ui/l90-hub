import type { DateKey, HubState } from '@/store/types';
import { addDays, dayNumber } from './dates';
import { PILLAR_IDS, PILLAR_LABELS, type PillarId, tasksByPillar } from './pillars';
import { PHASE_LENGTH, phaseOfDay } from './phases';
import { dayXp } from './progressSeries';
import { momentum } from './streak';
import { tasksDone, tasksForDate } from './status';
import { toRoman } from './format';

export const STREAK_MILESTONES: readonly number[] = [7, 14, 30];
const ALL_DONE_DAYS = 7;

type SignOffState = Pick<
  HubState,
  'days' | 'dmTarget' | 'startDate' | 'weekTemplate' | 'fitness' | 'learning'
>;

export interface SignOffNumbers {
  dm: number;
  ticks: number;
  xp: number;
}

/** The 3 numbers of the sign-off sheet. */
export function signOffNumbers(state: SignOffState, today: DateKey): SignOffNumbers {
  const record = state.days[today];
  return {
    dm: record?.dm ?? 0,
    ticks: tasksDone(record, tasksForDate(state.weekTemplate, today)),
    xp: dayXp(state, today),
  };
}

function personalBest(state: SignOffState, today: DateKey): string | null {
  const dm = state.days[today]?.dm ?? 0;
  const earlier = Object.entries(state.days)
    .filter(([date]) => date < today)
    .map(([, record]) => record.dm);
  if (dm <= 0 || earlier.length === 0 || dm <= Math.max(...earlier)) {
    return null;
  }
  return `This is your best DM day: ${dm} DMs.`;
}

function streakMilestone(state: SignOffState, today: DateKey): string | null {
  const result = momentum(state.days, today, state.dmTarget);
  const onTargetToday = (state.days[today]?.dm ?? 0) >= state.dmTarget;
  if (!onTargetToday || !STREAK_MILESTONES.includes(result.streak)) {
    return null;
  }
  return `Your streak is now ${result.streak} days on target.`;
}

function pillarAllDone(state: SignOffState, today: DateKey): string | null {
  const dates = Array.from({ length: ALL_DONE_DAYS }, (_, index) => addDays(today, -index));
  const pillar = PILLAR_IDS.find((id: PillarId) => {
    const daysWithTasks = dates.filter((date) => tasksByPillar(state.weekTemplate, date)[id].length > 0);
    return (
      daysWithTasks.length >= 4 &&
      daysWithTasks.every((date) =>
        tasksByPillar(state.weekTemplate, date)[id].every((task) => state.days[date]?.done[task] === true),
      )
    );
  });
  return pillar ? `All ${PILLAR_LABELS[pillar]} ticks are done for 7 days.` : null;
}

function phaseProgress(state: SignOffState, today: DateKey): string | null {
  const day = dayNumber(today, state.startDate);
  const phase = phaseOfDay(day);
  if (phase === null) {
    return null;
  }
  const inPhase = day - (phase - 1) * PHASE_LENGTH;
  const percent = Math.round((inPhase / PHASE_LENGTH) * 100);
  return `Phase ${toRoman(phase)} is ${percent} % complete.`;
}

/**
 * The true highlights of the day, best first. The sheet shows the first one.
 * The record has no funnel history, so the hub cannot see a funnel stage move and does not claim one.
 */
export function signOffHighlights(state: SignOffState, today: DateKey): string[] {
  return [
    personalBest(state, today),
    streakMilestone(state, today),
    pillarAllDone(state, today),
    phaseProgress(state, today),
  ].filter((item): item is string => item !== null);
}

/** Tomorrow's first task with its cue, for example "06:20 Send the drafted DMs at the bus stop." */
export function tomorrowFirstTask(state: Pick<HubState, 'weekTemplate'>, today: DateKey): string | null {
  const first = tasksForDate(state.weekTemplate, addDays(today, 1))[0];
  if (first === undefined) {
    return null;
  }
  return first.trim();
}

/**
 * The first line of the sign-off summary. "Complete" only when every tick of the day is done.
 * `day` is the mission day, or null outside the mission.
 */
export function signOffHeadline(day: number | null, ticksDone: number, ticksTotal: number): string {
  const name = day === null ? 'The day' : `Day ${day}`;
  const open = Math.max(0, ticksTotal - ticksDone);
  if (open === 0) {
    return `${name} is complete.`;
  }
  return `${name} is signed off. ${open} ${open === 1 ? 'tick is' : 'ticks are'} still open.`;
}
