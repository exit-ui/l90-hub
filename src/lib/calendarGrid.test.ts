import { describe, expect, it } from 'vitest';
import { createDefaultState, emptyDay } from '@/store/defaults';
import type { HubState } from '@/store/types';
import {
  calendarDays,
  dayCellLabel,
  mondayColumn,
  monthGrids,
  moveDate,
  selectedDay,
  templateLines,
  templateText,
  WEEKDAY_ROWS,
} from './calendarGrid';
import { reviewDate } from './phases';

const START = '2026-10-20'; // a Tuesday
const REVIEW = '2027-01-18'; // a Monday

function stateWith(patch: Partial<HubState>): HubState {
  return { ...createDefaultState(), startDate: START, ...patch };
}

describe('mondayColumn', () => {
  it('puts Monday first and Sunday last', () => {
    expect(mondayColumn('2026-10-19')).toBe(0);
    expect(mondayColumn('2026-10-20')).toBe(1);
    expect(mondayColumn('2026-10-25')).toBe(6);
  });
});

describe('monthGrids', () => {
  const grids = monthGrids(START, REVIEW);

  it('uses the review date of the start date', () => {
    expect(reviewDate(START)).toBe(REVIEW);
  });

  it('gives one grid for each month that the range touches', () => {
    expect(grids.map((grid) => grid.month)).toEqual(['2026-10', '2026-11', '2026-12', '2027-01']);
  });

  it('gives weeks of 7 cells', () => {
    for (const grid of grids) {
      for (const week of grid.weeks) {
        expect(week).toHaveLength(7);
      }
    }
  });

  it('leaves the days before the start date empty', () => {
    expect(grids[0]?.weeks[0]).toEqual([
      null,
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
    expect(grids[0]?.weeks).toHaveLength(2);
  });

  it('leaves the days after the review day empty', () => {
    const last = grids[3]?.weeks.at(-1);
    expect(last).toEqual([REVIEW, null, null, null, null, null, null]);
  });

  it('puts each date in the column of its weekday', () => {
    // 1 November 2026 is a Sunday.
    expect(grids[1]?.weeks[0]?.[6]).toBe('2026-11-01');
    expect(grids[1]?.weeks[0]?.slice(0, 6)).toEqual([null, null, null, null, null, null]);
  });

  it('contains each date of the range one time', () => {
    const dates = grids.flatMap((grid) => grid.weeks.flat()).filter((cell) => cell !== null);
    expect(dates).toHaveLength(91);
    expect(new Set(dates).size).toBe(91);
    expect(dates[0]).toBe(START);
    expect(dates.at(-1)).toBe(REVIEW);
  });

  it('gives one grid for a range of one day', () => {
    expect(monthGrids(START, START)).toEqual([
      { month: '2026-10', first: START, weeks: [[null, START, null, null, null, null, null]] },
    ]);
  });

  it('gives no grid when the last date is before the first date', () => {
    expect(monthGrids(REVIEW, START)).toEqual([]);
  });
});

describe('selectedDay', () => {
  it('uses the date in the route', () => {
    expect(selectedDay('2026-11-02', '2026-11-10', START, REVIEW)).toBe('2026-11-02');
  });

  it('uses today when the route has no date', () => {
    expect(selectedDay(undefined, '2026-11-10', START, REVIEW)).toBe('2026-11-10');
    expect(selectedDay('days', '2026-11-10', START, REVIEW)).toBe('2026-11-10');
  });

  it('uses the start date when today is outside the range', () => {
    expect(selectedDay(undefined, '2026-10-01', START, REVIEW)).toBe(START);
    expect(selectedDay(undefined, '2027-03-01', START, REVIEW)).toBe(START);
  });

  it('ignores a date outside the range and a date that is not real', () => {
    expect(selectedDay('2025-01-01', '2026-11-10', START, REVIEW)).toBe('2026-11-10');
    expect(selectedDay('2026-02-31', '2026-11-10', START, REVIEW)).toBe('2026-11-10');
  });
});

describe('moveDate', () => {
  it('moves one day or one week', () => {
    expect(moveDate('2026-11-10', 'ArrowRight', START, REVIEW)).toBe('2026-11-11');
    expect(moveDate('2026-11-01', 'ArrowLeft', START, REVIEW)).toBe('2026-10-31');
    expect(moveDate('2026-11-10', 'ArrowDown', START, REVIEW)).toBe('2026-11-17');
    expect(moveDate('2026-11-03', 'ArrowUp', START, REVIEW)).toBe('2026-10-27');
  });

  it('gives null at the ends of the range and for other keys', () => {
    expect(moveDate(START, 'ArrowLeft', START, REVIEW)).toBeNull();
    expect(moveDate(REVIEW, 'ArrowRight', START, REVIEW)).toBeNull();
    expect(moveDate('2026-10-22', 'ArrowUp', START, REVIEW)).toBeNull();
    expect(moveDate('2026-11-10', 'Enter', START, REVIEW)).toBeNull();
    expect(moveDate('', 'ArrowRight', START, REVIEW)).toBeNull();
  });
});

describe('calendarDays', () => {
  const state = stateWith({
    weekTemplate: { 0: [], 1: ['Send'], 2: ['Send'], 3: ['Send'], 4: ['Send'], 5: ['Send'], 6: [] },
    days: {
      '2026-10-20': { ...emptyDay(), dm: 20, done: { Send: true } },
      '2026-10-21': { ...emptyDay(), dm: 5 },
    },
  });
  const days = calendarDays(state, '2026-10-23');

  it('has 91 days, from day 1 to the review day', () => {
    expect(days.size).toBe(91);
    expect(days.get(START)?.day).toBe(1);
    expect(days.get('2027-01-17')?.day).toBe(90);
    expect(days.get(REVIEW)?.isReview).toBe(true);
    expect(days.get('2027-01-17')?.isReview).toBe(false);
  });

  it('gives the DM count and the status of each day', () => {
    expect(days.get('2026-10-20')).toMatchObject({ dm: 20, status: 'signed off', dateNumber: 20 });
    expect(days.get('2026-10-21')).toMatchObject({ dm: 5, status: 'partly done' });
    expect(days.get('2026-10-22')).toMatchObject({ dm: 0, status: 'missed' });
    expect(days.get('2026-10-23')).toMatchObject({ status: 'open', isToday: true });
  });

  it('writes the full label of a cell', () => {
    const first = days.get('2026-10-20');
    const today = days.get('2026-10-23');
    const review = days.get(REVIEW);
    expect(first && dayCellLabel(first)).toContain('October 2026. Day 1 of 90. 20 DMs. Signed off.');
    expect(today && dayCellLabel(today)).toContain('Open. Today.');
    expect(review && dayCellLabel(review)).toContain('Review day.');
  });
});

describe('week template text', () => {
  it('shows Monday first and Sunday last', () => {
    expect(WEEKDAY_ROWS.map((row) => row.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it('joins and splits the tasks by line', () => {
    expect(templateText(['A', 'B'])).toBe('A\nB');
    expect(templateText(undefined)).toBe('');
    expect(templateLines('A\n\nB\r\nC')).toEqual(['A', '', 'B', 'C']);
  });
});
