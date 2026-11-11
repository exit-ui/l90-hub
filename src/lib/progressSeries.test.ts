import { describe, expect, it } from 'vitest';
import { createDefaultState, emptyDay } from '@/store/defaults';
import type { HubState } from '@/store/types';
import { addDays } from './dates';
import {
  compareSeries,
  dailySeries,
  dayXp,
  defaultRange,
  normalise,
  projection,
  rangeDates,
  rollingMean,
  targetOf,
} from './progressSeries';

const START = '2026-10-20';

function state(): HubState {
  const base = createDefaultState();
  base.startDate = START;
  return base;
}

describe('dailySeries', () => {
  it('gives null for days before the start and after today, never 0', () => {
    const hub = state();
    hub.days[START] = { ...emptyDay(), dm: 12 };
    const today = addDays(START, 2);
    const points = dailySeries(hub, 'dm', 7, today);
    expect(points).toHaveLength(7);
    expect(points.slice(0, 4).every((point) => point.value === null)).toBe(true);
    expect(points[4]).toEqual({ date: START, value: 12 });
    expect(points[5]?.value).toBe(0);
    const mission = dailySeries(hub, 'dm', 90, today);
    expect(mission).toHaveLength(90);
    expect(mission[0]?.date).toBe(START);
    expect(mission[3]?.value).toBeNull();
    expect(mission.at(-1)?.value).toBeNull();
  });

  it('gives null before the first recorded activity, so a fresh hub shows no zeros', () => {
    const hub = state();
    const today = addDays(START, 20);
    expect(dailySeries(hub, 'dm', 30, today).every((point) => point.value === null)).toBe(true);
    hub.days[addDays(START, 10)] = { ...emptyDay(), dm: 0, done: { 'Rest.': true } };
    const points = dailySeries(hub, 'dm', 90, today);
    expect(points[9]?.value).toBeNull();
    expect(points[10]?.value).toBe(0);
    expect(points[11]?.value).toBe(0);
  });

  it('gives 14 points for range 14', () => {
    const hub = state();
    hub.days[START] = { ...emptyDay(), dm: 5 };
    const points = dailySeries(hub, 'dm', 14, addDays(START, 20));
    expect(points).toHaveLength(14);
    expect(points.at(-1)?.date).toBe(addDays(START, 20));
    expect(points.every((point) => point.value === 0)).toBe(true);
  });

  it('counts gym sessions over a rolling 7 days', () => {
    const hub = state();
    hub.fitness = [0, 2, 4, 9].map((offset) => ({
      date: addDays(START, offset),
      type: 'Push',
      minutes: 60,
      note: '',
    }));
    const today = addDays(START, 9);
    const values = dailySeries(hub, 'gym', 30, today).filter((point) => point.value !== null);
    expect(values.map((point) => point.value)).toEqual([1, 1, 2, 2, 3, 3, 3, 2, 2, 2]);
  });

  it('counts learning sessions and reading ticks over a rolling 7 days', () => {
    const hub = state();
    hub.learning = [{ date: START, type: 'Linux', minutes: 60, note: '' }];
    hub.days[START] = { ...emptyDay(), done: { 'Read 1 chapter.': true, 'Go to the gym.': true } };
    hub.days[addDays(START, 1)] = { ...emptyDay(), done: { 'On the bus home: read 1 chapter.': true } };
    const today = addDays(START, 7);
    const learning = dailySeries(hub, 'learning', 7, today).map((point) => point.value);
    expect(learning).toEqual([1, 1, 1, 1, 1, 1, 0]);
    const reading = dailySeries(hub, 'reading', 7, addDays(START, 2)).map((point) => point.value);
    expect(reading.slice(-3)).toEqual([1, 2, 2]);
  });

  it('gives the done share of the template and the cumulative R', () => {
    const hub = state();
    // 2026-10-20 is a Tuesday with 5 template tasks.
    const tasks = hub.weekTemplate[2];
    hub.days[START] = { ...emptyDay(), done: { [tasks[0] ?? '']: true, [tasks[1] ?? '']: true } };
    hub.trades = [
      { date: START, market: 'Forex', instrument: 'GBPUSD', direction: 'long', resultR: 2, followedRules: true, note: '' },
      { date: addDays(START, 1), market: 'Forex', instrument: 'GBPUSD', direction: 'long', resultR: -1, followedRules: true, note: '' },
    ];
    const today = addDays(START, 1);
    expect(dailySeries(hub, 'tasks', 7, today).at(-2)?.value).toBe(40);
    expect(dailySeries(hub, 'r', 7, today).slice(-2).map((point) => point.value)).toEqual([2, 1]);
  });

  it('gives null for tasks on a day with no template tasks', () => {
    const hub = state();
    hub.days[START] = { ...emptyDay(), dm: 1 };
    hub.weekTemplate = { ...hub.weekTemplate, 2: [] };
    expect(dailySeries(hub, 'tasks', 7, START).at(-1)?.value).toBeNull();
  });

  it('calculates the XP of a day from the dated sources', () => {
    const hub = state();
    hub.days[START] = { ...emptyDay(), dm: 4, done: { a: true, b: true }, win: 'A reply.' };
    hub.fitness = [{ date: START, type: 'Push', minutes: 60, note: '' }];
    expect(dayXp(hub, START)).toBe(4 * 5 + 2 * 10 + 20 + 30);
    expect(dailySeries(hub, 'xp', 7, START).at(-1)?.value).toBe(90);
  });
});

describe('normalise', () => {
  const settings = { dmTarget: 20, fitTarget: 3, learnTarget: 2 };

  it('gives the value as a percentage of the target', () => {
    expect(normalise('dm', 10, settings)).toBe(50);
    expect(normalise('gym', 3, settings)).toBe(100);
    expect(normalise('reading', 7, settings)).toBe(100);
    expect(normalise('tasks', 60, settings)).toBe(60);
  });

  it('clamps the value between 0 and 150', () => {
    expect(normalise('dm', 60, settings)).toBe(150);
    expect(normalise('learning', -2, settings)).toBe(0);
  });

  it('has no target for R and XP', () => {
    expect(targetOf('r', settings)).toBeNull();
    expect(targetOf('xp', settings)).toBeNull();
  });

  it('builds the compare series in percent and keeps at most 3', () => {
    const hub = state();
    hub.days[START] = { ...emptyDay(), dm: 30 };
    const series = compareSeries(hub, ['dm', 'gym', 'learning', 'reading'], 7, START, settings);
    expect(series).toHaveLength(3);
    expect(series[0]?.points.at(-1)?.value).toBe(150);
  });
});

describe('rollingMean and projection', () => {
  it('averages the non-null values of the window', () => {
    const points = [
      { date: '2026-10-20', value: null },
      { date: '2026-10-21', value: 10 },
      { date: '2026-10-22', value: 20 },
      { date: '2026-10-23', value: null },
    ];
    expect(rollingMean(points, 7).map((point) => point.value)).toEqual([null, 10, 15, null]);
  });

  it('continues the mean of the last 7 days after today', () => {
    const points = rangeDates(90, '2026-10-29', START).map((date, index) => ({
      date,
      value: date <= '2026-10-29' ? 10 + (index % 2) * 10 : null,
    }));
    const line = projection(points, 'dm', '2026-10-29');
    expect(line[0]?.date).toBe('2026-10-29');
    expect(line).toHaveLength(1 + 80);
    expect(line[5]?.value).toBeCloseTo(15.71, 1);
  });

  it('starts with 7 days in the first week', () => {
    expect(defaultRange(1)).toBe(7);
    expect(defaultRange(7)).toBe(7);
    expect(defaultRange(8)).toBe(30);
  });
});
