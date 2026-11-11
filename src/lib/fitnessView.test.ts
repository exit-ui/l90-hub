import { describe, expect, it } from 'vitest';
import type { Session } from '@/store/types';
import { fitnessOverview } from './fitnessView';

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
