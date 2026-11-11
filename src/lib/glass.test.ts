import { describe, expect, it } from 'vitest';
import {
  encodeChannel,
  isChromium,
  lensPixels,
  lensVector,
  nextScrollState,
  SCROLL_TOP_ZONE,
} from './glass';

const CAPSULE = { width: 200, height: 60, radius: 30, bezel: 14 };

describe('lensVector', () => {
  it('is neutral in the centre', () => {
    expect(lensVector(100, 30, CAPSULE)).toEqual({ x: 0, y: 0 });
  });

  it('points into the shape at the left edge', () => {
    const vector = lensVector(1, 30, CAPSULE);
    expect(vector.x).toBeGreaterThan(0.8);
    expect(Math.abs(vector.y)).toBeLessThan(0.05);
  });

  it('points down at the top edge and up at the bottom edge', () => {
    expect(lensVector(100, 1, CAPSULE).y).toBeGreaterThan(0.8);
    expect(lensVector(100, 59, CAPSULE).y).toBeLessThan(-0.8);
  });

  it('becomes weaker towards the inner side of the bezel', () => {
    const edge = lensVector(100, 1, CAPSULE).y;
    const inner = lensVector(100, 12, CAPSULE).y;
    expect(inner).toBeGreaterThan(0);
    expect(inner).toBeLessThan(edge);
  });

  it('is neutral outside the shape', () => {
    expect(lensVector(1, 1, CAPSULE)).toEqual({ x: 0, y: 0 });
  });

  it('is neutral for an empty shape', () => {
    expect(lensVector(0, 0, { width: 0, height: 0, radius: 0, bezel: 4 })).toEqual({ x: 0, y: 0 });
  });
});

describe('encodeChannel', () => {
  it('maps -1, 0 and 1 to bytes', () => {
    expect(encodeChannel(0)).toBe(128);
    expect(encodeChannel(1)).toBe(255);
    expect(encodeChannel(-1)).toBe(1);
    expect(encodeChannel(4)).toBe(255);
  });
});

describe('lensPixels', () => {
  it('gives 4 bytes for each pixel', () => {
    expect(lensPixels({ width: 10, height: 6, radius: 3, bezel: 2 })).toHaveLength(240);
  });

  it('is mirror-symmetric on the x axis', () => {
    const shape = { width: 20, height: 10, radius: 5, bezel: 4 };
    const pixels = lensPixels(shape);
    const left = (5 * 20 + 0) * 4;
    const right = (5 * 20 + 19) * 4;
    expect((pixels[left] ?? 0) + (pixels[right] ?? 0)).toBe(256);
    expect(pixels[left + 1]).toBe(pixels[right + 1]);
  });
});

describe('isChromium', () => {
  it('finds the Chromium brand', () => {
    expect(isChromium([{ brand: 'Google Chrome' }, { brand: 'Chromium' }])).toBe(true);
    expect(isChromium([{ brand: 'Firefox' }])).toBe(false);
    expect(isChromium(undefined)).toBe(false);
  });
});

describe('nextScrollState', () => {
  it('is full size near the top', () => {
    expect(nextScrollState({ lastY: 300, compact: true }, SCROLL_TOP_ZONE)).toEqual({
      lastY: SCROLL_TOP_ZONE,
      compact: false,
    });
  });

  it('becomes compact on scroll down and full size on scroll up', () => {
    const down = nextScrollState({ lastY: 100, compact: false }, 200);
    expect(down.compact).toBe(true);
    expect(nextScrollState(down, 150).compact).toBe(false);
  });

  it('ignores a small movement', () => {
    const state = { lastY: 200, compact: true };
    expect(nextScrollState(state, 195)).toBe(state);
  });
});
