import { describe, expect, it } from 'vitest';
import { MAX_SEGMENTS, segmentsFor, toGoText } from './dmMeter';

describe('dmMeter', () => {
  it('has one segment for each DM of the target', () => {
    expect(segmentsFor(12, 20)).toEqual({ count: 20, lit: 12 });
    expect(segmentsFor(0, 20)).toEqual({ count: 20, lit: 0 });
    expect(segmentsFor(25, 20)).toEqual({ count: 20, lit: 20 });
  });

  it('caps the segments and lights them in proportion for a big target', () => {
    expect(segmentsFor(25, 50)).toEqual({ count: MAX_SEGMENTS, lit: 12 });
    expect(segmentsFor(50, 50).lit).toBe(MAX_SEGMENTS);
  });

  it('has no meter without a target and never lights a negative count', () => {
    expect(segmentsFor(7, 0)).toEqual({ count: 0, lit: 0 });
    expect(segmentsFor(-3, 20).lit).toBe(0);
  });

  it('says how many are left, the goal, or how many are over', () => {
    expect(toGoText(12, 20)).toBe('8 to go');
    expect(toGoText(20, 20)).toBe('Goal hit');
    expect(toGoText(22, 20)).toBe('+2 over');
    expect(toGoText(5, 0)).toBe('5 sent');
  });
});
