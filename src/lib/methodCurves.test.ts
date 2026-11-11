import { describe, expect, it } from 'vitest';
import {
  areaPath,
  baselineY,
  HABIT_FRAME,
  habitCurve,
  habitValue,
  labelAnchor,
  linePath,
  retention,
  REVIEW_DAYS,
  SPACING_DAYS,
  SPACING_FRAME,
  spacingCurve,
  xOfDay,
  yOfValue,
} from './methodCurves';

describe('habit curve', () => {
  it('starts at 0 and stays below 1', () => {
    expect(habitValue(0)).toBe(0);
    expect(habitValue(-5)).toBe(0);
    expect(habitValue(Number.NaN)).toBe(0);
    expect(habitValue(90)).toBeLessThan(1);
  });

  it('rises on each day and the increase becomes smaller', () => {
    const points = habitCurve();
    expect(points).toHaveLength(91);
    for (let day = 2; day < points.length; day += 1) {
      const now = points[day]?.value ?? 0;
      const before = points[day - 1]?.value ?? 0;
      const earlier = points[day - 2]?.value ?? 0;
      expect(now).toBeGreaterThan(before);
      expect(now - before).toBeLessThan(before - earlier);
    }
  });

  it('is near its limit at day 66', () => {
    expect(habitValue(66)).toBeGreaterThan(0.9);
  });
});

describe('spacing curve', () => {
  it('drops with time and drops more slowly with more stability', () => {
    expect(retention(0, 1)).toBe(1);
    expect(retention(2, 1)).toBeLessThan(retention(1, 1));
    expect(retention(2, 4)).toBeGreaterThan(retention(2, 1));
    expect(retention(1, 0)).toBe(0);
  });

  it('starts at 1 and ends on the last day', () => {
    const points = spacingCurve();
    expect(points[0]).toEqual({ day: 0, value: 1 });
    expect(points[points.length - 1]?.day).toBe(SPACING_DAYS);
  });

  it('lifts the memory back to 1 on each review day', () => {
    const points = spacingCurve();
    for (const review of REVIEW_DAYS) {
      const onDay = points.filter((point) => point.day === review);
      expect(onDay).toHaveLength(2);
      expect(onDay[0]?.value).toBeLessThan(1);
      expect(onDay[1]?.value).toBe(1);
    }
  });

  it('never moves back in time and stays between 0 and 1', () => {
    const points = spacingCurve();
    points.forEach((point, index) => {
      expect(point.value).toBeGreaterThan(0);
      expect(point.value).toBeLessThanOrEqual(1);
      expect(point.day).toBeGreaterThanOrEqual(points[index - 1]?.day ?? 0);
    });
  });

  it('drops more slowly after each review', () => {
    const points = spacingCurve();
    const oneDayAfter = (start: number) =>
      points.filter((point) => point.day === start + 1)[0]?.value ?? 0;
    expect(oneDayAfter(1)).toBeGreaterThan(oneDayAfter(0));
    expect(oneDayAfter(3)).toBeGreaterThan(oneDayAfter(1));
    expect(oneDayAfter(7)).toBeGreaterThan(oneDayAfter(3));
    expect(oneDayAfter(15)).toBeGreaterThan(oneDayAfter(7));
  });

  it('ignores review days outside the range', () => {
    const points = spacingCurve([-1, 0, 2, 99], 4, 1);
    expect(points.filter((point) => point.value === 1).map((point) => point.day)).toEqual([0, 2]);
  });
});

describe('svg positions', () => {
  it('maps the days and the values to the frame', () => {
    expect(xOfDay(0, HABIT_FRAME)).toBe(HABIT_FRAME.left);
    expect(xOfDay(90, HABIT_FRAME)).toBe(HABIT_FRAME.width - HABIT_FRAME.right);
    expect(xOfDay(500, HABIT_FRAME)).toBe(HABIT_FRAME.width - HABIT_FRAME.right);
    expect(yOfValue(1, HABIT_FRAME)).toBe(HABIT_FRAME.top);
    expect(yOfValue(0, HABIT_FRAME)).toBe(baselineY(HABIT_FRAME));
  });

  it('builds a line path and a closed area path', () => {
    const points = [
      { day: 0, value: 0 },
      { day: 90, value: 1 },
    ];
    expect(linePath(points, HABIT_FRAME)).toBe('M16 186 L344 34');
    expect(areaPath(points, HABIT_FRAME)).toBe('M16 186 L344 34 L344 186 L16 186 Z');
    expect(linePath([], HABIT_FRAME)).toBe('');
    expect(areaPath([], HABIT_FRAME)).toBe('');
  });

  it('gives paths without incorrect numbers', () => {
    expect(linePath(habitCurve(), HABIT_FRAME)).not.toMatch(/NaN|Infinity/);
    expect(areaPath(spacingCurve(), SPACING_FRAME)).not.toMatch(/NaN|Infinity/);
  });

  it('aligns a label to the nearest edge', () => {
    expect(labelAnchor(0, HABIT_FRAME)).toBe('start');
    expect(labelAnchor(45, HABIT_FRAME)).toBe('middle');
    expect(labelAnchor(66, HABIT_FRAME)).toBe('middle');
    expect(labelAnchor(90, HABIT_FRAME)).toBe('end');
  });
});
