import { describe, expect, it } from 'vitest';
import { createSampleState } from '@/store/sample';
import { chartModel, MAX_INSIGHTS } from './chartModel';
import { longestSentence } from './insights';

const TODAY = '2026-11-11';
const state = createSampleState(TODAY);

describe('chartModel', () => {
  it('gives bars, a mean line and the target in single mode', () => {
    const model = chartModel(state, state, { metric: 'dm', range: 30, compare: [] }, TODAY);
    expect(model.mode).toBe('single');
    expect(model.bars).toHaveLength(30);
    expect(model.lines.map((line) => line.key)).toEqual(['mean']);
    expect(model.reference).toEqual({ value: 20, label: 'Target 20' });
    expect(model.insights.length).toBeLessThanOrEqual(MAX_INSIGHTS);
    for (const insight of model.insights) {
      expect(longestSentence(insight.text)).toBeLessThanOrEqual(20);
    }
  });

  it('adds the projection on range 90 only', () => {
    expect(chartModel(state, state, { metric: 'dm', range: 90, compare: [] }, TODAY).projection.length).toBeGreaterThan(0);
    expect(chartModel(state, state, { metric: 'dm', range: 7, compare: [] }, TODAY).projection).toEqual([]);
  });

  it('draws a rolling metric as a line with an area, not bars', () => {
    const model = chartModel(state, state, { metric: 'gym', range: 7, compare: [] }, TODAY);
    expect(model.bars).toEqual([]);
    expect(model.lines[0]?.area).toBe(true);
  });

  it('draws R as a line with no target', () => {
    const model = chartModel(state, state, { metric: 'r', range: 30, compare: [] }, TODAY);
    expect(model.bars).toEqual([]);
    expect(model.reference).toBeNull();
  });

  it('gives lines in % of target and a 100 % line in compare mode', () => {
    const model = chartModel(state, state, { metric: 'dm', range: 30, compare: ['dm', 'gym', 'learning'] }, TODAY);
    expect(model.mode).toBe('compare');
    expect(model.lines).toHaveLength(3);
    expect(model.lines.map((line) => line.dash)).toEqual([undefined, '8 5', '2 5']);
    expect(model.reference?.value).toBe(100);
    expect(model.yAxisLabel).toBe('% of target');
    expect(model.columns).toHaveLength(3);
  });
});

describe('chartValueFormat', () => {
  it('formats percent, signed R and whole values', async () => {
    const { chartValueFormat } = await import('./chartModel');
    expect(chartValueFormat('dm', true)(80)).toBe('80%');
    expect(chartValueFormat('r', false)(1.25)).toBe('+1.3');
    expect(chartValueFormat('r', false)(-2)).toBe('−2.0');
    expect(chartValueFormat('dm', false)(1240)).toBe('1,240');
  });
});
