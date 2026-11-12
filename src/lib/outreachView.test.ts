import { describe, expect, it } from 'vitest';
import { createDefaultState, emptyDay } from '@/store/defaults';
import type { HubState } from '@/store/types';
import { fieldText, funnelSummary, outreachBars, outreachOverview, seedHref } from './outreachView';

const START = '2026-10-20';

function stateWith(patch: Partial<HubState>): HubState {
  return { ...createDefaultState(), startDate: START, dmTarget: 20, baseContacted: 100, ...patch };
}

describe('outreachOverview', () => {
  it('works with no data', () => {
    const view = outreachOverview(stateWith({ days: {} }), '2026-10-25');
    expect(view.total).toBe(0);
    expect(view.atTarget).toBe(0);
    expect(view.streak).toBe(0);
    expect(view.average).toBe(0);
    expect(view.projected).toBe(100);
    expect(view.projectedFraction).toBe(1);
    expect(view.series).toHaveLength(30);
    expect(view.spark).toHaveLength(14);
    expect(view.series.at(-1)).toEqual({ label: '2026-10-25', value: 0 });
  });

  it('gives the totals, the streak and the projection', () => {
    const days = {
      '2026-10-23': { ...emptyDay(), dm: 20 },
      '2026-10-24': { ...emptyDay(), dm: 25 },
      '2026-10-25': { ...emptyDay(), dm: 25 },
    };
    const view = outreachOverview(stateWith({ days }), '2026-10-25');
    expect(view.total).toBe(70);
    expect(view.contacted).toBe(170);
    expect(view.atTarget).toBe(3);
    expect(view.streak).toBe(3);
    expect(view.average).toBe(10);
    expect(view.averageFraction).toBe(0.5);
    // Day 6: 84 days remain. 170 + 10 × 84 = 1010.
    expect(view.projected).toBe(1010);
    expect(view.atTargetFraction).toBeCloseTo(3 / 90);
    expect(view.spark.at(-1)).toEqual({ label: '2026-10-25', value: 25 });
  });

  it('gives a fraction of 0 when the target is 0', () => {
    const view = outreachOverview(stateWith({ dmTarget: 0 }), '2026-10-25');
    expect(view.averageFraction).toBe(0);
    expect(view.streak).toBe(0);
  });
});

describe('seedHref', () => {
  it('makes the profile link', () => {
    expect(seedHref('some.creator_1')).toBe('https://www.instagram.com/some.creator_1/');
  });

  it('encodes the handle', () => {
    expect(seedHref('a/b?c')).toBe('https://www.instagram.com/a%2Fb%3Fc/');
  });
});

describe('fieldText', () => {
  it('keeps the text of the user while it agrees with the stored value', () => {
    expect(fieldText('012', 12)).toBe('012');
    expect(fieldText('12', 12)).toBe('12');
  });

  it('shows the stored value when the two values are different', () => {
    expect(fieldText('5', 12)).toBe('12');
    expect(fieldText('', 3)).toBe('3');
  });

  it('lets the user empty a field that holds 0', () => {
    expect(fieldText('', 0)).toBe('');
  });
});

describe('outreachBars', () => {
  const days = {
    '2026-10-20': { ...emptyDay(), dm: 10 },
    '2026-10-21': { ...emptyDay(), dm: 20 },
    '2026-10-27': { ...emptyDay(), dm: 30 },
    '2026-10-28': { ...emptyDay(), dm: 30 },
  };

  it('gives 7 daily bars for the week, with null before the start', () => {
    const view = outreachBars(stateWith({ days }), '2026-10-23', 'week');
    expect(view.bars).toHaveLength(7);
    expect(view.bars.map((bar) => bar.value)).toEqual([null, null, null, 10, 20, 0, 0]);
    expect(view.average).toBe(7.5);
    expect(view.target).toBe(20);
    expect(view.bars[3]?.text).toContain('10 DMs');
  });

  it('compares the week with the week before', () => {
    const view = outreachBars(stateWith({ days }), '2026-10-29', 'week');
    expect(view.change).toEqual({ text: '↓ 14% vs last week', trend: 'down' });
  });

  it('gives 4 weekly means for the month and 13 mission weeks for 90 days', () => {
    expect(outreachBars(stateWith({ days }), '2026-10-29', 'month').bars).toHaveLength(4);
    const mission = outreachBars(stateWith({ days }), '2026-10-29', 'mission');
    expect(mission.bars).toHaveLength(13);
    expect(mission.bars[0]?.value).toBeCloseTo(30 / 7);
    expect(mission.bars[2]?.value).toBeNull();
    expect(mission.change?.text).toBe('Day 10 of 90');
  });

  it('works with no data', () => {
    const view = outreachBars(stateWith({ days: {} }), '2026-10-19', 'week');
    expect(view.average).toBe(0);
    expect(view.change).toBeNull();
    expect(view.summary).toContain('target of 20');
  });
});

describe('funnelSummary', () => {
  it('gives sent, replies, calls and clients with the share of the row before', () => {
    const state = stateWith({ days: {}, baseContacted: 400 });
    const rows = funnelSummary({ ...state, funnel: { ...state.funnel, replied: 68, booked: 10, closed: 0 } });
    expect(rows.map((row) => row.label)).toEqual(['Sent', 'Replies', 'Calls', 'Clients']);
    expect(rows.map((row) => row.rate)).toEqual(['–', '17%', '15%', '0%']);
  });

  it('gives a dash when the row before is 0', () => {
    const state = stateWith({ days: {}, baseContacted: 0 });
    expect(funnelSummary(state)[1]?.rate).toBe('–');
  });
});
