import { describe, expect, it } from 'vitest';
import type { DayRecord } from '@/store/types';
import { type AnalyticsState, formatValue, metricsOf, pillarBreakdown, pillarStats, valueOn } from './pillarAnalytics';

const START = '2026-11-01';
const TODAY = '2026-11-10';

function day(dm: number, extra: Partial<DayRecord> = {}): DayRecord {
  return { dm, done: {}, win: '', next: '', chartChecks: 0, vetSend: 0, vetSkip: 0, ...extra };
}

const base: AnalyticsState = {
  startDate: START,
  dmTarget: 20,
  chartCheckLimit: 3,
  days: {
    '2026-11-08': day(20),
    '2026-11-09': day(22, { chartChecks: 2 }),
    '2026-11-10': day(25),
    '2026-11-05': day(5),
  },
  fitness: [
    { date: '2026-11-09', type: 'Push', minutes: 50, note: '' },
    { date: '2026-11-10', type: 'Pull', minutes: 40, note: '' },
    { date: '2026-11-10', type: 'Push', minutes: 20, note: '' },
  ],
  learning: [{ date: '2026-11-10', type: 'Course', minutes: 90, note: '' }],
  trades: [
    { date: '2026-11-09', market: 'Forex', instrument: 'EURUSD', direction: 'long', resultR: 2, followedRules: true, note: '' },
    { date: '2026-11-10', market: 'Forex', instrument: 'EURUSD', direction: 'short', resultR: -1, followedRules: false, note: '' },
  ],
  chapterNotes: [{ date: '2026-11-10', book: 'Deep Work', idea: '', action: '' }],
  funnel: { sourced: 200, opened: 0, replied: 30, positive: 0, loomSent: 0, loomWatched: 0, replyAfterLoom: 0, booked: 5, attended: 0, closed: 1 },
};

describe('pillar analytics', () => {
  it('lists only the metrics the record holds, with the DM target as the goal', () => {
    expect(metricsOf('outreach', base).map((metric) => metric.id)).toEqual(['dm']);
    expect(metricsOf('outreach', base)[0]?.goal).toBe(20);
    expect(metricsOf('trading', base).map((metric) => metric.id)).toEqual(['r', 'trades', 'checks']);
  });

  it('reads the value of a day from the record', () => {
    expect(valueOn(base, 'fitness', 'sessions', TODAY)).toBe(2);
    expect(valueOn(base, 'fitness', 'minutes', TODAY)).toBe(60);
    expect(valueOn(base, 'trading', 'r', TODAY)).toBe(-1);
    expect(valueOn(base, 'trading', 'checks', '2026-11-09')).toBe(2);
    expect(valueOn(base, 'reading', 'chapters', TODAY)).toBe(1);
  });

  it('gives the stats of the last 7 days with the goal streak up to today', () => {
    const metric = metricsOf('outreach', base)[0]!;
    const stats = pillarStats(base, 'outreach', metric, 7, TODAY);
    expect(stats.points).toHaveLength(7);
    expect(stats.total).toBe(72);
    expect(stats.best).toBe(25);
    expect(stats.goalHits).toBe(3);
    expect(stats.streak).toBe(3);
  });

  it('shows days before the start as empty, not zero', () => {
    const metric = metricsOf('outreach', base)[0]!;
    const stats = pillarStats(base, 'outreach', metric, 30, TODAY);
    expect(stats.points[0]?.value).toBeNull();
    expect(stats.counted).toBe(10);
  });

  it('breaks trading down into wins, losses and the rules line', () => {
    const breakdown = pillarBreakdown(base, 'trading', 7, TODAY);
    expect(breakdown.rows.map((row) => row.value)).toEqual([1, 1, 0]);
    expect(breakdown.note).toBe('Rules followed in 1 of 2 trades.');
  });

  it('groups fitness sessions by type, largest first', () => {
    const breakdown = pillarBreakdown(base, 'fitness', 7, TODAY);
    expect(breakdown.rows[0]).toMatchObject({ label: 'Push', value: 2 });
  });

  it('formats signed R with a plus and keeps counts whole', () => {
    const r = metricsOf('trading', base)[0]!;
    expect(formatValue(2, r)).toBe('+2 R');
    expect(formatValue(3, metricsOf('outreach', base)[0]!)).toBe('3');
  });
});
