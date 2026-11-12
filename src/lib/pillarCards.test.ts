import { describe, expect, it } from 'vitest';
import { createDefaultState } from '@/store/defaults';
import type { HubState, Session, Trade } from '@/store/types';
import { pillarCards, shortNumber, signedShort, sparkPath, weekChange } from './pillarCards';

const TODAY = '2026-11-12';

function session(date: string, minutes = 60): Session {
  return { date, type: 'Push', minutes, note: '' };
}

function trade(date: string, resultR: number): Trade {
  return { date, market: 'Other', instrument: 'NQ', direction: 'long', resultR, followedRules: true, note: '' };
}

function state(patch: Partial<HubState> = {}): HubState {
  return { ...createDefaultState(), startDate: '2026-10-20', ...patch };
}

describe('pillarCards', () => {
  it('gives the four cards in order', () => {
    expect(pillarCards(state(), TODAY).map((card) => card.id)).toEqual(['fitness', 'learning', 'reading', 'trading']);
  });

  it('shows a calm empty state with no data, never a change line or a sparkline', () => {
    for (const card of pillarCards(state(), TODAY)) {
      expect(card.empty).toBe(true);
      expect(card.change).toBeNull();
      expect(card.spark).toEqual([]);
      expect(card.tone).not.toBe('negative');
    }
  });

  it('compares the gym sessions of this week with last week', () => {
    const fitness = [session('2026-11-03'), session('2026-11-09'), session('2026-11-11')];
    const [card] = pillarCards(state({ fitness, fitTarget: 5 }), TODAY);
    expect(card?.value).toBe('2');
    expect(card?.tail).toBe('/5');
    expect(card?.change).toEqual({ text: '↑ 1 vs last week', trend: 'up' });
    expect(card?.spark.length).toBeGreaterThan(1);
  });

  it('counts learning hours in the week', () => {
    const learning = [session('2026-11-10', 90), session('2026-11-11', 300)];
    const card = pillarCards(state({ learning }), TODAY)[1];
    expect(card?.value).toBe('6.5');
    expect(card?.tail).toBe(' h');
    expect(card?.tone).toBe('accent');
  });

  it('marks only a trading loss as negative', () => {
    const down = pillarCards(state({ trades: [trade('2026-11-01', 2), trade('2026-11-10', -0.5)] }), TODAY)[3];
    expect(down?.tone).toBe('negative');
    expect(down?.change?.trend).toBe('down');
    expect(down?.value).toBe('+1.5');
    const up = pillarCards(state({ trades: [trade('2026-11-10', 1)] }), TODAY)[3];
    expect(up?.tone).toBe('success');
    expect(up?.change?.text).toBe('↑ +1 R this week');
  });
});

describe('the card helpers', () => {
  it('formats short and signed numbers', () => {
    expect(shortNumber(6)).toBe('6');
    expect(shortNumber(6.54)).toBe('6.5');
    expect(signedShort(-0.8)).toBe('−0.8');
    expect(signedShort(0)).toBe('0');
  });

  it('describes the week change', () => {
    expect(weekChange(3, 3, '')).toEqual({ text: 'Same as last week', trend: 'flat' });
    expect(weekChange(2, 4, ' h').text).toBe('↓ 2 h vs last week');
  });

  it('draws a line and a closed area, and nothing for fewer than 2 values', () => {
    expect(sparkPath([1], 100, 40)).toEqual({ line: '', area: '' });
    const path = sparkPath([0, 2, 1], 100, 40);
    expect(path.line.startsWith('M0.0 36.0')).toBe(true);
    expect(path.area.endsWith('Z')).toBe(true);
    expect(sparkPath([3, 3], 100, 40).line).toBe('M0.0 20.0 L100.0 20.0');
  });
});
