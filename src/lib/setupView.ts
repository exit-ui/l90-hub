import type { ParkedIdea, SettingKey } from '@/store/types';
import { PHASE_LENGTH, type Phase } from './phases';

export interface SettingField {
  key: SettingKey;
  label: string;
  /** The lowest value that the hub accepts. */
  minimum: number;
  hint: string;
}

export const SETTING_FIELDS: readonly SettingField[] = [
  { key: 'dmTarget', label: 'DM target', minimum: 1, hint: 'DMs in one day.' },
  {
    key: 'baseContacted',
    label: 'Start count',
    minimum: 0,
    hint: 'Creators that you contacted before day 1.',
  },
  { key: 'fitTarget', label: 'Gym target', minimum: 1, hint: 'Gym sessions in one week.' },
  {
    key: 'learnTarget',
    label: 'Learning target',
    minimum: 1,
    hint: 'Learning sessions in one week.',
  },
  {
    key: 'chartCheckLimit',
    label: 'Chart check limit',
    minimum: 1,
    hint: 'Chart checks in one day.',
  },
];

/**
 * Reads the text of a setting field.
 * Only a whole number at or above the minimum is correct. Other text gives null.
 */
export function parseSetting(text: string, minimum: number): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isSafeInteger(value) && value >= minimum ? value : null;
}

/** The error for a setting field. Correct text and an empty field give no error. */
export function settingError(text: string, minimum: number): string | undefined {
  if (text.trim() === '' || parseSetting(text, minimum) !== null) {
    return undefined;
  }
  return `The value is not correct. Type a whole number of ${minimum} or more.`;
}

/** The first and the last mission day of a phase. */
export function phaseDays(phase: Phase): { first: number; last: number } {
  return { first: (phase - 1) * PHASE_LENGTH + 1, last: phase * PHASE_LENGTH };
}

export interface ParkedRow extends ParkedIdea {
  /** The position in the stored list. */
  index: number;
}

/** The parked ideas with the newest first. Ideas of the same date keep the newest entry first. */
export function parkedNewestFirst(parked: readonly ParkedIdea[]): ParkedRow[] {
  return parked
    .map((idea, index) => ({ ...idea, index }))
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date < b.date ? 1 : -1;
      }
      return b.index - a.index;
    });
}
