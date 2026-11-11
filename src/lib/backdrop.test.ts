/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BOKEH_MAX,
  BOKEH_MIN,
  bokehField,
  composite,
  contrast,
  fitWithin,
  meanLuminance,
  parseCssColor,
  type Rgba,
  relativeLuminance,
  SCRIM_GOAL,
  scrimAlpha,
  seeded,
  skylineField,
  WINDOW_DENSITY,
  withAlpha,
} from './backdrop';

const WHITE = [255, 255, 255] as const;
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

/** Reads one colour token, in the form rgb(r g b / a) or #rrggbb, from src/index.css. */
function token(name: string): Rgba {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
  const value = match?.[1]?.trim() ?? '';
  const rgb = /^rgb\((\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\)$/.exec(value);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])];
  }
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (hex) {
    return [parseInt(hex[1] ?? '0', 16), parseInt(hex[2] ?? '0', 16), parseInt(hex[3] ?? '0', 16), 1];
  }
  throw new Error(`The token ${name} is not a plain colour: "${value}".`);
}

describe('bokehField', () => {
  it('gives the same discs for the same seed', () => {
    expect(bokehField(7, 390, 844)).toEqual(bokehField(7, 390, 844));
    expect(bokehField(7, 390, 844)).not.toEqual(bokehField(8, 390, 844));
  });

  it('gives 14 to 18 discs inside the limits of the spec', () => {
    for (let seed = 1; seed < 40; seed += 1) {
      const discs = bokehField(seed, 1280, 800);
      expect(discs.length).toBeGreaterThanOrEqual(BOKEH_MIN);
      expect(discs.length).toBeLessThanOrEqual(BOKEH_MAX);
      for (const disc of discs) {
        expect(disc.radius).toBeGreaterThanOrEqual(16);
        expect(disc.radius).toBeLessThanOrEqual(96);
        expect(disc.blur).toBeGreaterThanOrEqual(24);
        expect(disc.blur).toBeLessThanOrEqual(64);
        expect(disc.opacity).toBeGreaterThanOrEqual(0.06);
        expect(disc.opacity).toBeLessThanOrEqual(0.22);
      }
    }
  });

  it('puts most discs in the lower half', () => {
    const discs = Array.from({ length: 20 }, (_, seed) => bokehField(seed, 1000, 1000)).flat();
    const lower = discs.filter((disc) => disc.y > 500).length;
    expect(lower / discs.length).toBeGreaterThan(0.6);
  });

  it('gives numbers from 0 to 1', () => {
    const next = seeded(3);
    for (let index = 0; index < 100; index += 1) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('skylineField', () => {
  it('is deterministic and keeps the lit windows at 6 % or less', () => {
    const layers = skylineField(11, 1280, 600);
    expect(layers).toEqual(skylineField(11, 1280, 600));
    expect(layers).toHaveLength(3);
    const cells = layers.flatMap((layer) => layer.towers).reduce((sum, tower) => sum + tower.columns * tower.rows, 0);
    const lit = layers.flatMap((layer) => layer.towers).reduce((sum, tower) => sum + tower.windows.length, 0);
    expect(WINDOW_DENSITY).toBeLessThanOrEqual(0.06);
    expect(lit / cells).toBeLessThanOrEqual(0.06);
    for (const layer of layers) {
      const right = Math.max(...layer.towers.map((tower) => tower.x + tower.width));
      expect(right).toBeGreaterThanOrEqual(1280);
    }
  });
});

describe('scrimAlpha', () => {
  it('follows clamp((L − 0.08) / L, 0.35, 0.85)', () => {
    expect(scrimAlpha(0.4)).toBeCloseTo(0.8);
    expect(scrimAlpha(0.2)).toBeCloseTo(0.6);
    expect(scrimAlpha(0.05)).toBe(0.35);
    expect(scrimAlpha(0.95)).toBe(0.85);
    expect(scrimAlpha(0)).toBe(0.35);
  });

  it('brings a photo down to the goal luminance inside the clamp', () => {
    for (const luminance of [0.12, 0.2, 0.3, 0.45]) {
      expect(luminance * (1 - scrimAlpha(luminance))).toBeLessThanOrEqual(SCRIM_GOAL + 1e-9);
    }
  });

  it('measures the mean luminance of pixels', () => {
    expect(meanLuminance([255, 255, 255, 255, 0, 0, 0, 255])).toBeCloseTo(0.5);
    expect(meanLuminance([])).toBe(0);
  });
});

describe('contrast over the module material', () => {
  const material = token('--hub-material');
  const worst = composite(material, WHITE);

  it('keeps body text and numbers at 4.5:1 or more over a white backdrop', () => {
    expect(contrast(composite(token('--hub-text'), worst), worst)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(composite(token('--hub-label-strong'), worst), worst)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(composite(token('--hub-label'), worst), worst)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(composite(token('--hub-positive'), worst), worst)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps text at 4.5:1 or more over the expanded material on a white backdrop', () => {
    const solid = composite(token('--hub-material-solid'), WHITE);
    for (const name of ['--hub-text', '--hub-label-strong', '--hub-label', '--hub-positive']) {
      expect(contrast(composite(token(name), solid), solid)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the module rim and the bar track at 3:1 for the done fill', () => {
    const fill = composite(token('--hub-positive'), worst);
    const track = composite(token('--hub-track'), worst);
    expect(contrast(fill, track)).toBeGreaterThanOrEqual(3);
  });

  it('gives the expected luminance values', () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1);
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21);
  });
});

describe('fitWithin', () => {
  it('scales the long edge down to the limit', () => {
    expect(fitWithin({ width: 5120, height: 2880 }, 2560)).toEqual({ width: 2560, height: 1440 });
    expect(fitWithin({ width: 3000, height: 4000 }, 2560)).toEqual({ width: 1920, height: 2560 });
    expect(fitWithin({ width: 800, height: 600 }, 2560)).toEqual({ width: 800, height: 600 });
  });
});

describe('parseCssColor', () => {
  it('reads the colour forms of the tokens', () => {
    expect(parseCssColor('#d6803a')).toEqual([214, 128, 58, 1]);
    expect(parseCssColor('rgb(14 16 22 / 0.78)')).toEqual([14, 16, 22, 0.78]);
    expect(parseCssColor('rgba(1, 2, 3, 0.5)')).toEqual([1, 2, 3, 0.5]);
    expect(parseCssColor(' rgb(70 98 190) ')).toEqual([70, 98, 190, 1]);
    expect(parseCssColor('var(--x)')).toBeNull();
    expect(withAlpha([1, 2, 3, 1], 0.5)).toBe('rgba(1, 2, 3, 0.500)');
  });
});
