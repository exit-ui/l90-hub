import { describe, expect, it } from 'vitest';
import type { Trade } from '@/store/types';
import {
  aboveCheckLimit,
  allocationItems,
  cumulativePoints,
  lastTradePoints,
  numberOrZero,
  numberText,
  tradingSection,
  resultTone,
  snapshotPoints,
  trancheLabel,
} from './tradingView';

const trade = (date: string, resultR: number): Trade => ({
  date,
  market: 'Forex',
  instrument: 'EURUSD',
  direction: 'long',
  resultR,
  followedRules: true,
  note: '',
});

describe('trading view', () => {
  it('gives empty chart data for 0 trades', () => {
    expect(cumulativePoints([])).toEqual([]);
    expect(lastTradePoints([])).toEqual([]);
  });

  it('labels each cumulative point with the trade number in date order', () => {
    const points = cumulativePoints([trade('2026-11-03', 2), trade('2026-11-01', -1)]);
    expect(points).toEqual([
      { label: '1', value: -1 },
      { label: '2', value: 1 },
    ]);
  });

  it('keeps the trade number for the last trades', () => {
    const trades = [trade('2026-11-01', 1), trade('2026-11-02', -1), trade('2026-11-03', 2.5)];
    expect(lastTradePoints(trades, 2)).toEqual([
      { label: '2', value: -1 },
      { label: '3', value: 2.5 },
    ]);
  });

  it('warns only above the limit', () => {
    expect(aboveCheckLimit(3, 3)).toBe(false);
    expect(aboveCheckLimit(4, 3)).toBe(true);
  });

  it('gives a tone for each result', () => {
    expect(resultTone(1.5)).toBe('gain');
    expect(resultTone(-1)).toBe('loss');
    expect(resultTone(0)).toBe('flat');
  });

  it('puts the snapshots in date order', () => {
    expect(
      snapshotPoints([
        { date: '2026-11-05', valueGbp: 120 },
        { date: '2026-11-01', valueGbp: 100 },
      ]),
    ).toEqual([
      { label: '2026-11-01', value: 100 },
      { label: '2026-11-05', value: 120 },
    ]);
  });

  it('keeps only coins with a value in the allocation', () => {
    expect(
      allocationItems([
        { symbol: 'BTC', amount: 0.5, priceGbp: 100 },
        { symbol: 'ETH', amount: 2, priceGbp: 100 },
        { symbol: 'SOL', amount: 0, priceGbp: 90 },
      ]),
    ).toEqual([
      { label: 'ETH', value: 200 },
      { label: 'BTC', value: 50 },
    ]);
    expect(allocationItems([])).toEqual([]);
  });

  it('names the month in the tranche label', () => {
    expect(trancheLabel('2026-11-10')).toBe('The tranche decision for November 2026 is done');
  });

  it('reads the section from the route', () => {
    expect(tradingSection('crypto')).toBe('crypto');
    expect(tradingSection('day')).toBe('day');
    expect(tradingSection(undefined)).toBe('day');
    expect(tradingSection('journal')).toBe('day');
  });

  it('reads a number field', () => {
    expect(numberOrZero('0.05')).toBe(0.05);
    expect(numberOrZero('')).toBe(0);
    expect(numberOrZero('abc')).toBe(0);
  });

  it('gives the text for a number field', () => {
    expect(numberText(0.05)).toBe('0.05');
    expect(numberText(Number.NaN)).toBe('0');
  });
});
