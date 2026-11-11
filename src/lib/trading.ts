import type { Coin, DateKey, Payout, Setup, Snapshot, Trade } from '@/store/types';

export interface TradeStats {
  count: number;
  winRate: number | null;
  expectancy: number | null;
  cumulativeR: number | null;
  longestLosingStreak: number | null;
  ruleAdherence: number | null;
}

/** Trades in date order. Trades on the same date keep their log order. */
export function tradesInOrder(trades: readonly Trade[]): Trade[] {
  return trades
    .map((trade, index) => ({ trade, index }))
    .sort((a, b) =>
      a.trade.date === b.trade.date ? a.index - b.index : a.trade.date < b.trade.date ? -1 : 1,
    )
    .map(({ trade }) => trade);
}

/** All values are null when there are 0 trades. */
export function tradeStats(trades: readonly Trade[]): TradeStats {
  const count = trades.length;
  if (count === 0) {
    return {
      count: 0,
      winRate: null,
      expectancy: null,
      cumulativeR: null,
      longestLosingStreak: null,
      ruleAdherence: null,
    };
  }
  const ordered = tradesInOrder(trades);
  const sum = ordered.reduce((total, trade) => total + trade.resultR, 0);
  let longest = 0;
  let run = 0;
  for (const trade of ordered) {
    run = trade.resultR < 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return {
    count,
    winRate: ordered.filter((trade) => trade.resultR > 0).length / count,
    expectancy: sum / count,
    cumulativeR: sum,
    longestLosingStreak: longest,
    ruleAdherence: ordered.filter((trade) => trade.followedRules).length / count,
  };
}

export interface CumulativePoint {
  index: number;
  date: DateKey;
  value: number;
}

/** The running sum of resultR in date order. */
export function cumulativeR(trades: readonly Trade[]): CumulativePoint[] {
  let total = 0;
  return tradesInOrder(trades).map((trade, index) => {
    total += trade.resultR;
    return { index: index + 1, date: trade.date, value: total };
  });
}

/** The last `count` trades in date order. */
export function lastTrades(trades: readonly Trade[], count: number): Trade[] {
  return tradesInOrder(trades).slice(-count);
}

export function coinValue(coin: Coin): number {
  return coin.amount * coin.priceGbp;
}

export function portfolioValue(coins: readonly Coin[]): number {
  return coins.reduce((sum, coin) => sum + coinValue(coin), 0);
}

export interface Allocation {
  symbol: string;
  valueGbp: number;
  share: number;
}

/** Coins with a value above 0, largest first. */
export function allocation(coins: readonly Coin[]): Allocation[] {
  const total = portfolioValue(coins);
  if (total <= 0) {
    return [];
  }
  return coins
    .map((coin) => ({ symbol: coin.symbol, valueGbp: coinValue(coin), share: coinValue(coin) / total }))
    .filter((item) => item.valueGbp > 0)
    .sort((a, b) => b.valueGbp - a.valueGbp);
}

/** One snapshot for each date. A new snapshot replaces the old one for that date. */
export function upsertSnapshot(
  snapshots: readonly Snapshot[],
  date: DateKey,
  valueGbp: number,
): Snapshot[] {
  return [...snapshots.filter((item) => item.date !== date), { date, valueGbp }].sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );
}

export function payoutTotal(payouts: readonly Payout[]): number {
  return payouts.reduce((sum, payout) => sum + payout.amountGbp, 0);
}

export const SETUP_GOAL = 20;

export function setupProgress(setups: readonly Setup[]): { count: number; goal: number; fraction: number } {
  return {
    count: setups.length,
    goal: SETUP_GOAL,
    fraction: Math.min(1, setups.length / SETUP_GOAL),
  };
}
