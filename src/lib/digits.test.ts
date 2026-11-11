import { describe, expect, it } from 'vitest';
import { digitColumns } from './digits';
import { staggerDelay } from './motion';

const keys = (text: string) => digitColumns(text).map((column) => column.key);

describe('digitColumns', () => {
  it('keys the digits from the right, so the units column stays the same from 9 to 10', () => {
    expect(digitColumns('9')).toEqual([{ key: 'd0', kind: 'digit', char: '9' }]);
    expect(digitColumns('10')).toEqual([
      { key: 'd1', kind: 'digit', char: '1' },
      { key: 'd0', kind: 'digit', char: '0' },
    ]);
  });

  it('keeps separators, decimals and signs static', () => {
    expect(keys('1,240')).toEqual(['d3', 's0', 'd2', 'd1', 'd0']);
    expect(digitColumns('+8.10').map((column) => column.kind)).toEqual(['static', 'digit', 'static', 'digit', 'digit']);
    expect(keys('−0.5')).toEqual(['s1', 'd1', 's0', 'd0']);
  });

  it('treats "%" and "R" as static characters', () => {
    expect(digitColumns('80%').at(-1)).toEqual({ key: 's0', kind: 'static', char: '%' });
    expect(digitColumns('3R').map((column) => column.kind)).toEqual(['digit', 'static']);
  });

  it('gives no column for an empty text', () => {
    expect(digitColumns('')).toEqual([]);
  });
});

describe('staggerDelay', () => {
  it('starts at 120 ms, steps 30 ms and stops after item 6', () => {
    expect(staggerDelay(0)).toBeCloseTo(0.12);
    expect(staggerDelay(1)).toBeCloseTo(0.15);
    expect(staggerDelay(5)).toBeCloseTo(0.27);
    expect(staggerDelay(9)).toBeCloseTo(0.27);
  });
});
