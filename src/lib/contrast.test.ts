/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { composite, contrast, parseCssColor, type Rgb, type Rgba, relativeLuminance } from './contrast';

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

/** Reads one plain colour token from the :root block of src/index.css. */
function token(name: string): Rgba {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
  const value = parseCssColor(match?.[1] ?? '');
  if (!value) {
    throw new Error(`The token ${name} is not a plain colour.`);
  }
  return value;
}

function opaque(name: string, base: Rgb): Rgb {
  return composite(token(name), base);
}

const WHITE: Rgb = [255, 255, 255];

describe('contrast of the light theme', () => {
  const card = opaque('--hub-surface', WHITE);
  const page = opaque('--hub-bg-from', WHITE);
  const done = opaque('--hub-done-bg', WHITE);

  it('keeps every small text colour at 4.5:1 or more on a card and on the page', () => {
    for (const name of ['--hub-text', '--hub-label-strong', '--hub-label', '--hub-positive', '--hub-negative-text', '--hub-accent-text', '--hub-amber', '--hub-danger']) {
      expect(contrast(opaque(name, card), card)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(opaque(name, page), page)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps green text readable on the done tint and the done pill', () => {
    const pill = opaque('--hub-done-pill', WHITE);
    expect(contrast(opaque('--hub-positive', done), done)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(opaque('--hub-positive', pill), pill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(opaque('--hub-text', done), done)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps text on the brand and on the black button at 4.5:1 or more', () => {
    const brand = opaque('--hub-brand', WHITE);
    const black = opaque('--hub-black', WHITE);
    expect(contrast(opaque('--hub-on-brand', brand), brand)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(opaque('--hub-on-black', black), black)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the check on the success fill at 3:1 or more', () => {
    const fill = opaque('--hub-success', WHITE);
    expect(contrast(opaque('--hub-on-success', fill), fill)).toBeGreaterThanOrEqual(3);
  });

  it('keeps the faint colour out of small text: it is below 4.5:1 on white', () => {
    expect(contrast(opaque('--hub-faint', card), card)).toBeLessThan(4.5);
  });

  it('gives the expected luminance values', () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1);
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21);
  });
});

describe('parseCssColor', () => {
  it('reads the colour forms of the tokens', () => {
    expect(parseCssColor('#d6803a')).toEqual([214, 128, 58, 1]);
    expect(parseCssColor('rgb(14 16 22 / 0.78)')).toEqual([14, 16, 22, 0.78]);
    expect(parseCssColor('rgba(1, 2, 3, 0.5)')).toEqual([1, 2, 3, 0.5]);
    expect(parseCssColor(' rgb(70 98 190) ')).toEqual([70, 98, 190, 1]);
    expect(parseCssColor('var(--x)')).toBeNull();
  });
});
