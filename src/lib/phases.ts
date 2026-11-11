import type { DateKey, HubState, RewardIndex } from '@/store/types';
import { addDays, dayNumber } from './dates';
import { daysAtTarget } from './streak';

export const MISSION_DAYS = 90;
export const PHASE_LENGTH = 30;
export const HABIT_MEDIAN_DAY = 66;

export type Phase = 1 | 2 | 3;

/** Phase of a mission day. Days outside 1 to 90 have no phase. */
export function phaseOfDay(day: number): Phase | null {
  if (!Number.isInteger(day) || day < 1 || day > MISSION_DAYS) {
    return null;
  }
  if (day <= PHASE_LENGTH) {
    return 1;
  }
  return day <= PHASE_LENGTH * 2 ? 2 : 3;
}

export function lastMissionDate(startDate: DateKey): DateKey {
  return addDays(startDate, MISSION_DAYS - 1);
}

export function reviewDate(startDate: DateKey): DateKey {
  return addDays(startDate, MISSION_DAYS);
}

export interface MissionClock {
  /** Raw day number. It can be below 1 or above 90. */
  day: number;
  /** Day number held between 0 and 90 for charts. */
  dayClamped: number;
  daysLeft: number;
  daysToStart: number;
  phase: Phase | null;
  stage: 'before' | 'active' | 'review' | 'after';
  lastDate: DateKey;
  reviewDate: DateKey;
}

export function missionClock(today: DateKey, startDate: DateKey): MissionClock {
  const day = dayNumber(today, startDate);
  const dayClamped = Math.min(MISSION_DAYS, Math.max(0, day));
  let stage: MissionClock['stage'] = 'active';
  if (day < 1) {
    stage = 'before';
  } else if (day === MISSION_DAYS + 1) {
    stage = 'review';
  } else if (day > MISSION_DAYS + 1) {
    stage = 'after';
  }
  return {
    day,
    dayClamped,
    daysLeft: MISSION_DAYS - dayClamped,
    daysToStart: Math.max(0, 1 - day),
    phase: phaseOfDay(day),
    stage,
    lastDate: lastMissionDate(startDate),
    reviewDate: reviewDate(startDate),
  };
}

export const PHASE_ONE_TARGET_DAYS = 25;
export const PHASE_TWO_LOOMS = 5;
export const PHASE_TWO_BOOKED = 2;
export const PHASE_THREE_CLOSED = 1;

export interface RewardPart {
  label: string;
  value: number;
  goal: number;
}

export interface RewardStatus {
  index: RewardIndex;
  phase: Phase;
  condition: string;
  parts: RewardPart[];
  met: boolean;
  claimed: boolean;
  state: 'locked' | 'ready' | 'claimed';
}

type RewardInput = Pick<HubState, 'days' | 'dmTarget' | 'funnel' | 'claimed'>;

export function rewardStatuses(state: RewardInput): [RewardStatus, RewardStatus, RewardStatus] {
  const build = (
    index: RewardIndex,
    phase: Phase,
    condition: string,
    parts: RewardPart[],
  ): RewardStatus => {
    const met = parts.every((part) => part.value >= part.goal);
    const claimed = met && state.claimed[index];
    return {
      index,
      phase,
      condition,
      parts,
      met,
      claimed,
      state: claimed ? 'claimed' : met ? 'ready' : 'locked',
    };
  };
  return [
    build(0, 1, 'Meet the daily DM target on 25 days.', [
      {
        label: 'Days at target',
        value: daysAtTarget(state.days, state.dmTarget),
        goal: PHASE_ONE_TARGET_DAYS,
      },
    ]),
    build(1, 2, 'Send 5 Looms. Book 2 calls.', [
      { label: 'Looms sent', value: state.funnel.loomSent, goal: PHASE_TWO_LOOMS },
      { label: 'Calls booked', value: state.funnel.booked, goal: PHASE_TWO_BOOKED },
    ]),
    build(2, 3, 'Close 1 paid pilot.', [
      { label: 'Pilots closed', value: state.funnel.closed, goal: PHASE_THREE_CLOSED },
    ]),
  ];
}
