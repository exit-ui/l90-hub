import { describe, expect, it } from 'vitest';
import { createDefaultState, emptyDay } from '@/store/defaults';
import type { HubState } from '@/store/types';
import { fieldText, outreachOverview, seedHref } from './outreachView';

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
