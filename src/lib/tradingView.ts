import type { Coin, DateKey, Snapshot, Trade } from '@/store/types';
import { formatMonth } from './dates';
import type { ChartPoint } from './summary';
import { allocation, cumulativeR, lastTrades } from './trading';

export const LAST_TRADES = 30;

/** The running sum of R. The label of each point is the trade number. */
export function cumulativePoints(trades: readonly Trade[]): ChartPoint[] {
  return cumulativeR(trades).map((point) => ({ label: String(point.index), value: point.value }));
}

/** The result of each of the last `count` trades. The label is the trade number. */
export function lastTradePoints(trades: readonly Trade[], count: number = LAST_TRADES): ChartPoint[] {
  const last = lastTrades(trades, count);
  const first = trades.length - last.length + 1;
  return last.map((trade, index) => ({ label: String(first + index), value: trade.resultR }));
}

/** True when the chart checks are above the limit. */
export function aboveCheckLimit(checks: number, limit: number): boolean {
  return checks > limit;
}

export type ResultTone = 'gain' | 'loss' | 'flat';

export function resultTone(resultR: number): ResultTone {
  if (resultR > 0) {
    return 'gain';
  }
  return resultR < 0 ? 'loss' : 'flat';
}

/** The saved wallet values in date order. */
export function snapshotPoints(snapshots: readonly Snapshot[]): ChartPoint[] {
  return [...snapshots]
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1))
    .map((snapshot) => ({ label: snapshot.date, value: snapshot.valueGbp }));
}

/** The items for the allocation ring: coins with a value above 0. */
export function allocationItems(coins: readonly Coin[]): { label: string; value: number }[] {
  return allocation(coins).map((item) => ({ label: item.symbol, value: item.valueGbp }));
}

export function trancheLabel(today: DateKey): string {
  return `The tranche decision for ${formatMonth(today)} is done`;
}

export type TradingSection = 'day' | 'crypto';

/** The section from the first route part after the page. An unknown part gives "day". */
export function tradingSection(segment: string | undefined): TradingSection {
  return segment === 'crypto' ? 'crypto' : 'day';
}

/** The number from a number field. Text that is not a number gives 0. */
export function numberOrZero(text: string): number {
  const value = Number(text);
  return text.trim() !== '' && Number.isFinite(value) ? value : 0;
}

/** The text for a number field. The field shows the stored value. */
export function numberText(value: number): string {
  return Number.isFinite(value) ? String(value) : '0';
}
