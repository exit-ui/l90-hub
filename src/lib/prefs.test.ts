import { describe, expect, it } from 'vitest';
import { DEFAULT_CHART_PREFS, parseChartPrefs, toggleCompare } from './prefs';

describe('parseChartPrefs', () => {
  it('gives the defaults for missing or wrong data', () => {
    expect(parseChartPrefs(null)).toEqual(DEFAULT_CHART_PREFS);
    expect(parseChartPrefs('not json')).toEqual(DEFAULT_CHART_PREFS);
    expect(parseChartPrefs('[1]')).toEqual(DEFAULT_CHART_PREFS);
  });

  it('keeps correct fields and drops R and XP from compare', () => {
    expect(
      parseChartPrefs(JSON.stringify({ metric: 'gym', range: 90, compare: ['r', 'dm', 'xp', 'gym'], compareOn: true })),
    ).toEqual({ metric: 'gym', range: 90, compare: ['dm', 'gym'], compareOn: true });
    expect(parseChartPrefs(JSON.stringify({ metric: 'nope', range: 12 })).range).toBeNull();
  });
});

describe('toggleCompare', () => {
  it('keeps 2 to 3 metrics', () => {
    expect(toggleCompare(['dm', 'tasks'], 'gym')).toEqual(['dm', 'tasks', 'gym']);
    expect(toggleCompare(['dm', 'tasks', 'gym'], 'reading')).toEqual(['dm', 'tasks', 'gym']);
    expect(toggleCompare(['dm', 'tasks', 'gym'], 'tasks')).toEqual(['dm', 'gym']);
    expect(toggleCompare(['dm', 'tasks'], 'dm')).toEqual(['dm', 'tasks']);
  });
});
