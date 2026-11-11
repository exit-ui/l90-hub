import { describe, expect, it } from 'vitest';
import { addDays, rangeOfDays } from './dates';
import { chartInsights, chartSummary, longestSentence } from './insights';
import type { Point } from './progressSeries';

const SETTINGS = { dmTarget: 20, fitTarget: 3, learnTarget: 2 };
const TODAY = '2026-11-15';

function series(values: readonly (number | null)[], last: string = TODAY): Point[] {
  const dates = rangeOfDays(addDays(last, -(values.length - 1)), last);
  return dates.map((date, index) => ({ date, value: values[index] ?? null }));
}

function kinds(points: Point[], metric: Parameters<typeof chartInsights>[1] = 'dm') {
  return chartInsights(points, metric, SETTINGS, TODAY, { range: 30 }).map((item) => item.kind);
}

describe('chartInsights', () => {
  it('gives the target gap when the mean is below the target', () => {
    const insights = chartInsights(series([14, 14, 14, 14, 14]), 'dm', SETTINGS, TODAY);
    expect(insights[0]?.text).toBe(
      'You average 14 of 20 DMs. Send 6 more each day to hit the target.',
    );
  });

  it('gives no gap at or above the target', () => {
    expect(kinds(series([20, 22, 25, 20, 21]))).not.toContain('gap');
  });

  it('compares the last 7 days with the 7 days before', () => {
    const values = [10, 10, 10, 10, 10, 10, 10, 12, 12, 11, 12, 11, 12, 12];
    const insight = chartInsights(series(values), 'dm', SETTINGS, TODAY).find(
      (item) => item.kind === 'change',
    );
    expect(insight?.text).toBe('DMs are up 17 % on the previous 7 days.');
  });

  it('says "up from 0" when the previous mean is 0', () => {
    const values = [0, 0, 0, 0, 0, 0, 0, 3, 4, 5, 6, 3, 2, 1];
    const insight = chartInsights(series(values), 'dm', SETTINGS, TODAY).find(
      (item) => item.kind === 'change',
    );
    expect(insight?.text).toBe('DMs are up from 0 on the previous 7 days.');
  });

  it('needs 4 values in each period for the change', () => {
    const values = [null, null, null, null, 10, 10, 10, 12, 12, 12, 12, 12, 12, 12];
    expect(kinds(series(values))).not.toContain('change');
  });

  it('names the best weekday when each weekday has 2 values', () => {
    // 2026-11-15 is a Sunday. 14 days give 2 values for each weekday.
    const values = [10, 19, 10, 10, 10, 10, 10, 10, 19, 10, 10, 10, 10, 10];
    const insight = chartInsights(series(values), 'dm', SETTINGS, TODAY).find(
      (item) => item.kind === 'weekday',
    );
    expect(insight?.text).toBe('Tuesday is your best DM day: 19 on average.');
    expect(kinds(series(values.slice(1)))).not.toContain('weekday');
  });

  it('names no best weekday when all values are 0 or the best days tie', () => {
    const zeros = Array.from({ length: 14 }, () => 0);
    expect(kinds(series(zeros))).not.toContain('weekday');
    const tie = [10, 19, 10, 10, 10, 19, 10, 10, 19, 10, 10, 10, 19, 10];
    expect(kinds(series(tie))).not.toContain('weekday');
  });

  it('projects the DM total at day 90 on range 90', () => {
    const start = addDays(TODAY, -9);
    const points = rangeOfDays(start, addDays(start, 89)).map((date) => ({
      date,
      value: date <= TODAY ? 10 : null,
    }));
    const insight = chartInsights(points, 'dm', SETTINGS, TODAY, { range: 90 }).find(
      (item) => item.kind === 'projection',
    );
    expect(insight?.text).toBe('At this pace you reach 900 DMs on day 90. The goal is 1,800.');
  });

  it('projects the chapters at day 90 from the daily reading ticks', () => {
    const start = addDays(TODAY, -9);
    const daily = rangeOfDays(start, addDays(start, 89)).map((date) => ({
      date,
      value: date <= TODAY ? 1 : null,
    }));
    const rolling = daily.map((point) => ({ ...point, value: point.value === null ? null : 7 }));
    const insight = chartInsights(rolling, 'reading', SETTINGS, TODAY, {
      range: 90,
      dailyReading: daily,
    }).find((item) => item.kind === 'projection');
    expect(insight?.text).toBe('At this pace you read 90 chapters by day 90. The goal is 90.');
  });

  it('names the weakest pillar in compare mode', () => {
    const compare = [
      { metric: 'dm' as const, points: series([80, 90, 100, 90, 80, 90, 100]) },
      { metric: 'learning' as const, points: series([50, 50, 50, 50, 50, 50, 50]) },
    ];
    const insights = chartInsights(compare[0]?.points ?? [], 'dm', SETTINGS, TODAY, { compare });
    expect(insights[0]?.text).toBe('Learning is your lowest pillar this week: 50 % of target.');
  });

  it('gives no insight when the data is too thin', () => {
    expect(chartInsights(series([12, 9, null, null]), 'dm', SETTINGS, TODAY)).toEqual([]);
    expect(chartInsights([], 'xp', SETTINGS, TODAY)).toEqual([]);
  });

  it('keeps each sentence at 20 words or fewer', () => {
    const values = [3, 4, 5, 2, 1, 6, 3, 2, 4, 5, 6, 2, 3, 1, 2, 4, 5, 3, 2, 1, 5];
    for (const metric of ['dm', 'tasks', 'gym', 'learning', 'reading', 'xp', 'r'] as const) {
      for (const insight of chartInsights(series(values), metric, SETTINGS, TODAY, { range: 30 })) {
        expect(longestSentence(insight.text)).toBeLessThanOrEqual(20);
      }
    }
  });
});

describe('chartSummary', () => {
  it('uses "% of target" in compare mode', () => {
    expect(chartSummary(series([50, 100]), 'dm', 7, TODAY, true)).toContain('Last value 100 % of target.');
  });

  it('names the metric, the range, the last value, the mean and the trend', () => {
    expect(chartSummary(series([10, 10, 20, 20]), 'dm', 7, TODAY)).toBe(
      'DMs, last 7 days. Last value 20 DMs. Mean 15 DMs. Trend up.',
    );
  });

  it('says when there is no data', () => {
    expect(chartSummary(series([null, null]), 'gym', 30, TODAY)).toBe(
      'Gym (7 days), last 30 days. There is no data yet.',
    );
  });
});
