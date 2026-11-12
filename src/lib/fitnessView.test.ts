import { describe, expect, it } from 'vitest';
import type { Session } from '@/store/types';
import { fitnessOverview, fitnessWeek } from './fitnessView';
import { attendedOn, toggleAttendance } from './sessions';

const session = (date: string, minutes: number): Session => ({ date, type: 'Push', minutes, note: '' });

describe('fitness overview', () => {
  it('gives zeros for an empty log', () => {
    const view = fitnessOverview([], '2026-11-10', 3);
    expect(view.week).toBe(0);
    expect(view.sessions).toBe(0);
    expect(view.minutes).toBe(0);
    expect(view.target).toBe(3);
    expect(view.cells).toHaveLength(13 * 7);
  });

  it('counts the sessions of this week and all minutes', () => {
    // 10 November 2026 is a Tuesday. The week starts on Monday 9 November.
    const view = fitnessOverview(
      [session('2026-11-08', 30), session('2026-11-09', 45), session('2026-11-10', 60)],
      '2026-11-10',
      3,
    );
    expect(view.week).toBe(2);
    expect(view.sessions).toBe(3);
    expect(view.minutes).toBe(135);
    expect(view.cells.find((cell) => cell.date === '2026-11-10')?.value).toBe(1);
  });

  it('gives 13 weeks that end in the week of today', () => {
    const view = fitnessOverview(
      [session('2026-11-02', 30), session('2026-11-09', 45), session('2026-11-10', 60)],
      '2026-11-10',
      3,
    );
    expect(view.weeklySessions).toHaveLength(13);
    expect(view.weeklyMinutes).toHaveLength(13);
    expect(view.weeklySessions.at(-1)).toEqual({ label: '2026-11-09', value: 2 });
    expect(view.weeklyMinutes.at(-1)).toEqual({ label: '2026-11-09', value: 105 });
    expect(view.weeklyMinutes.at(-2)).toEqual({ label: '2026-11-02', value: 30 });
  });
});

describe('fitnessWeek', () => {
  it('gives the 7 days of the week, Monday first, with attendance', () => {
    const week = fitnessWeek([session('2026-11-09', 60), session('2026-11-11', 45)], '2026-11-12');
    expect(week.map((day) => day.letter).join('')).toBe('MTWTFSS');
    expect(week.map((day) => day.attended)).toEqual([true, false, true, false, false, false, false]);
    expect(week[3]?.isToday).toBe(true);
    expect(week.filter((day) => day.ahead)).toHaveLength(3);
  });
});

describe('the "Gym attended today" switch', () => {
  it('adds a session on the date, then removes the newest session of that date', () => {
    const one = toggleAttendance([], '2026-11-12');
    expect(attendedOn(one, '2026-11-12')).toBe(true);
    const two = toggleAttendance([session('2026-11-12', 60), ...one], '2026-11-12');
    expect(two).toHaveLength(1);
    expect(two[0]?.minutes).toBe(60);
    expect(attendedOn(toggleAttendance(one, '2026-11-12'), '2026-11-12')).toBe(false);
  });
});
