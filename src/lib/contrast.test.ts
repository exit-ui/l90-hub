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

/** Reads one colour token from the dark block of src/index.css. */
function darkToken(name: string): Rgba {
  const block = /:root\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(block);
  return parseCssColor(match?.[1] ?? '') ?? token(name);
}

describe('contrast of the dark theme', () => {
  const page = composite(darkToken('--hub-bg-from'), [0, 0, 0]);
  const card = composite(darkToken('--hub-surface'), page);
  const on = (name: string, base: Rgb) => composite(darkToken(name), base);

  it('keeps every small text colour at 4.5:1 or more on a card and on the page', () => {
    for (const name of ['--hub-text', '--hub-label-strong', '--hub-label', '--hub-positive', '--hub-negative-text', '--hub-accent-text', '--hub-amber', '--hub-danger', '--hub-brand-ink']) {
      expect(contrast(on(name, card), card)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(on(name, page), page)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps green text readable on the done tint and the done pill', () => {
    const done = on('--hub-done-bg', card);
    const pill = on('--hub-done-pill', card);
    expect(contrast(on('--hub-positive', done), done)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(on('--hub-positive', pill), pill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(on('--hub-text', done), done)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps text on the brand, the light button and the success fill readable', () => {
    const brand = on('--hub-brand', card);
    const black = on('--hub-black', card);
    const fill = on('--hub-success', card);
    expect(contrast(on('--hub-on-brand', brand), brand)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(on('--hub-on-black', black), black)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(on('--hub-on-success', fill), fill)).toBeGreaterThanOrEqual(3);
  });
});

/** The v3 value of a token in the dark theme: the last dark block that sets it wins. */
function v3DarkToken(name: string): Rgba {
  const blocks = [...css.matchAll(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/g)].map((match) => match[1] ?? '');
  for (const block of blocks.reverse()) {
    const match = new RegExp(`${name}:\\s*([^;]+);`).exec(block);
    const value = parseCssColor(match?.[1] ?? '');
    if (value) {
      return value;
    }
  }
  return token(name);
}

describe('contrast of the v3 pillar colours', () => {
  const pillars = ['outreach', 'fitness', 'learning', 'reading', 'trading', 'signoff'];

  it('keeps white text at 4.5:1 or more on every stop of every pillar gradient', () => {
    for (const pillar of pillars) {
      const gradient = new RegExp(`--pillar-${pillar}:\\s*linear-gradient\\(([^;]+)\\);`).exec(css)?.[1] ?? '';
      const stops = gradient.match(/#[0-9a-f]{6}/gi) ?? [];
      expect(stops.length).toBeGreaterThanOrEqual(3);
      for (const stop of stops) {
        const colour = parseCssColor(stop);
        expect(colour).not.toBeNull();
        expect(contrast(WHITE, composite(colour!, WHITE))).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps each pillar ring and active tab icon at 3:1 or more on a card, in both themes', () => {
    const lightCard = opaque('--hub-surface', WHITE);
    const darkPage = composite(darkToken('--hub-bg-from'), [0, 0, 0]);
    const darkCard = composite(darkToken('--hub-surface'), darkPage);
    for (const pillar of pillars) {
      expect(contrast(opaque(`--pillar-${pillar}-solid`, lightCard), lightCard)).toBeGreaterThanOrEqual(3);
      expect(contrast(composite(v3DarkToken(`--pillar-${pillar}-solid`), darkCard), darkCard)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('contrast of the v4 dark glass', () => {
  const pillars = ['outreach', 'fitness', 'learning', 'reading', 'trading', 'signoff'];
  const hex = (value: string): Rgb => {
    const parsed = parseCssColor(value);
    if (!parsed) {
      throw new Error(`Not a colour: ${value}`);
    }
    return composite(parsed, [0, 0, 0]);
  };

  /** The brightest place of a glass card: its tint at full strength over the darker base. */
  function peak(pillar: string): Rgb {
    const block = new RegExp(`\\.pillar-${pillar}\\s*\\{([^}]*)\\}`).exec(css.slice(css.indexOf('v4: dark glass')))?.[1] ?? '';
    const read = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(block)?.[1]?.trim() ?? '';
    const alpha = Number.parseFloat(read('--gl-a')) / 100;
    const tint = hex(read('--gl-tint'));
    const base = hex(read('--gl-b1'));
    return [0, 1, 2].map((index) => Math.round((tint[index] ?? 0) * alpha + (base[index] ?? 0) * (1 - alpha))) as unknown as Rgb;
  }

  it('keeps white text and 80 % white text at 4.5:1 or more at the brightest place of every glass card', () => {
    for (const pillar of pillars) {
      const background = peak(pillar);
      expect(contrast(WHITE, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(composite([255, 255, 255, 0.8] as unknown as Rgba, background), background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps white text readable on the lime card in both themes', () => {
    for (const stop of ['#1f3d0c', '#3d6b12', '#4d7c15']) {
      expect(contrast(WHITE, hex(stop))).toBeGreaterThanOrEqual(4.5);
    }
    const lime = composite([163, 230, 53, 0.38] as unknown as Rgba, hex('#10140a'));
    expect(contrast(WHITE, lime)).toBeGreaterThanOrEqual(4.5);
  });
});
