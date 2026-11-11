/**
 * Pure helpers for the "Night city" backdrop and for a photo backdrop:
 * a seeded number source, the bokeh field, the skyline, the street lights,
 * and the contrast maths that keeps text legible.
 */

export type Rgb = readonly [number, number, number];
export type Rgba = readonly [number, number, number, number];

/** A small seeded number source (mulberry32). The same seed gives the same numbers. */
export function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function between(next: () => number, low: number, high: number): number {
  return low + next() * (high - low);
}

/**
 * The light colours of a city at night. The colour values are tokens in index.css:
 * sodium #d6803a, cold blue #4662be, tail-light red #b0303a and white.
 */
export const LIGHT_NAMES = ['sodium', 'blue', 'red', 'white'] as const;
export type LightName = (typeof LIGHT_NAMES)[number];

export interface BokehDisc {
  x: number;
  y: number;
  radius: number;
  blur: number;
  opacity: number;
  light: LightName;
}

export const BOKEH_MIN = 14;
export const BOKEH_MAX = 18;

const LIGHT_WEIGHTS: readonly [LightName, number][] = [
  ['sodium', 0.4],
  ['blue', 0.22],
  ['red', 0.2],
  ['white', 0.18],
];

function pickLight(next: () => number): LightName {
  let roll = next();
  for (const [name, weight] of LIGHT_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) {
      return name;
    }
  }
  return 'white';
}

/**
 * 14 to 18 soft discs of out-of-focus light. Most discs are in the lower half,
 * where the street is. Radius 16–96 px, blur 24–64 px, opacity 0.06–0.22.
 */
export function bokehField(seed: number, width: number, height: number): BokehDisc[] {
  const next = seeded(seed);
  const count = BOKEH_MIN + Math.floor(next() * (BOKEH_MAX - BOKEH_MIN + 1));
  return Array.from({ length: count }, () => {
    // The square root pulls the discs down to the lower half of the view.
    const depth = Math.sqrt(next());
    return {
      x: next() * width,
      y: height * (0.25 + depth * 0.72),
      radius: between(next, 16, 96),
      blur: between(next, 24, 64),
      opacity: between(next, 0.06, 0.22),
      light: pickLight(next),
    };
  });
}

export interface Tower {
  x: number;
  width: number;
  /** The top of the tower in px from the top of the view. */
  top: number;
  /** A setback: a narrower block on the roof. Zero for a flat roof. */
  crownWidth: number;
  crownHeight: number;
  /** A thin mast on the roof. Zero for no mast. */
  mast: number;
  /** Lit windows as [column, row] cells of the window grid. */
  windows: [number, number][];
  columns: number;
  rows: number;
}

export interface SkylineLayer {
  /** 0 is the far layer, 2 is the near layer. */
  depth: 0 | 1 | 2;
  towers: Tower[];
}

/** The fraction of lit windows. It stays at or below 6 %. */
export const WINDOW_DENSITY = 0.05;
const WINDOW_STEP = 9;

/**
 * Three layers of towers. The far layer is high and thin, the near layer is low and wide.
 * The ground line is at `groundY`. No tower is higher than `maxHeight`.
 */
export function skylineField(
  seed: number,
  width: number,
  groundY: number,
  maxHeight: number = groundY,
): SkylineLayer[] {
  const next = seeded(seed ^ 0x5bd1e995);
  const specs: readonly { depth: 0 | 1 | 2; minW: number; maxW: number; minH: number; maxH: number }[] = [
    { depth: 0, minW: 22, maxW: 64, minH: 0.5, maxH: 1 },
    { depth: 1, minW: 36, maxW: 100, minH: 0.32, maxH: 0.74 },
    { depth: 2, minW: 64, maxW: 160, minH: 0.12, maxH: 0.4 },
  ];
  return specs.map((spec) => {
    const towers: Tower[] = [];
    let x = -between(next, 0, spec.maxW);
    while (x < width + 32) {
      const towerWidth = between(next, spec.minW, spec.maxW);
      const height = maxHeight * between(next, spec.minH, spec.maxH);
      const top = groundY - height;
      const columns = Math.max(1, Math.floor(towerWidth / WINDOW_STEP));
      const rows = Math.max(1, Math.floor(height / (WINDOW_STEP + 3)));
      const windows: [number, number][] = [];
      for (let column = 0; column < columns; column += 1) {
        for (let row = 0; row < rows; row += 1) {
          if (next() < WINDOW_DENSITY) {
            windows.push([column, row]);
          }
        }
      }
      const crowned = next() < 0.35;
      towers.push({
        x,
        width: towerWidth,
        top,
        crownWidth: crowned ? towerWidth * between(next, 0.4, 0.7) : 0,
        crownHeight: crowned ? between(next, 10, 36) : 0,
        mast: spec.depth < 2 && next() < 0.25 ? between(next, 18, 60) : 0,
        windows,
        columns,
        rows,
      });
      x += towerWidth + between(next, -6, spec.depth === 2 ? 30 : 12);
    }
    return { depth: spec.depth, towers };
  });
}

export interface StreetLamp {
  x: number;
  /** The height of the lamp head in px above the ground line. */
  height: number;
}

/** Street lamps along the road, at an even step with a small random shift. */
export function streetLamps(seed: number, width: number): StreetLamp[] {
  const next = seeded(seed ^ 0x27d4eb2d);
  const step = Math.max(220, width / 4);
  const lamps: StreetLamp[] = [];
  for (let x = between(next, 40, step * 0.6); x < width + 40; x += step * between(next, 0.85, 1.15)) {
    lamps.push({ x, height: between(next, 120, 170) });
  }
  return lamps;
}

/** The relative luminance of an sRGB colour (WCAG 2.2), from 0 to 1. */
export function relativeLuminance([red, green, blue]: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

/** A colour with alpha painted over an opaque colour. */
export function composite([red, green, blue, alpha]: Rgba, [baseRed, baseGreen, baseBlue]: Rgb): Rgb {
  const mix = (top: number, bottom: number) => top * alpha + bottom * (1 - alpha);
  return [mix(red, baseRed), mix(green, baseGreen), mix(blue, baseBlue)];
}

/** The WCAG contrast ratio of two opaque colours, from 1 to 21. */
export function contrast(first: Rgb, second: Rgb): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export const SCRIM_MIN = 0.35;
export const SCRIM_MAX = 0.85;
/** The mean luminance under the modules after the dark overlay. */
export const SCRIM_GOAL = 0.08;

/**
 * The alpha of the black overlay on a photo, so that the mean luminance becomes 0.08 or less.
 * alpha = clamp((L − 0.08) / L, 0.35, 0.85).
 */
export function scrimAlpha(meanLuminance: number): number {
  if (!Number.isFinite(meanLuminance) || meanLuminance <= 0) {
    return SCRIM_MIN;
  }
  const alpha = (meanLuminance - SCRIM_GOAL) / meanLuminance;
  return Math.min(SCRIM_MAX, Math.max(SCRIM_MIN, alpha));
}

/** The mean relative luminance of RGBA pixels. Transparent pixels count as black. */
export function meanLuminance(pixels: ArrayLike<number>): number {
  const count = Math.floor(pixels.length / 4);
  if (count === 0) {
    return 0;
  }
  let sum = 0;
  for (let index = 0; index < count; index += 1) {
    const offset = index * 4;
    const alpha = (pixels[offset + 3] ?? 255) / 255;
    sum +=
      relativeLuminance([pixels[offset] ?? 0, pixels[offset + 1] ?? 0, pixels[offset + 2] ?? 0]) * alpha;
  }
  return sum / count;
}

export interface Size {
  width: number;
  height: number;
}

/** The size that fits in a square of `limit` px on the long edge. A smaller image keeps its size. */
export function fitWithin(size: Size, limit: number): Size {
  const long = Math.max(size.width, size.height);
  if (long <= limit || long <= 0) {
    return { width: Math.round(size.width), height: Math.round(size.height) };
  }
  const scale = limit / long;
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

/** The long edge of a stored photo. */
export const PHOTO_MAX_EDGE = 2560;
/** The largest file that the hub reads. */
export const PHOTO_MAX_INPUT_BYTES = 30 * 1024 * 1024;
/** The largest photo that the hub stores after the downscale. */
export const PHOTO_MAX_STORED_BYTES = 8 * 1024 * 1024;

/** Reads a CSS colour in the form #rrggbb, rgb(r g b), rgb(r g b / a) or rgba(r, g, b, a). */
export function parseCssColor(text: string): Rgba | null {
  const value = text.trim();
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (hex) {
    return [parseInt(hex[1] ?? '0', 16), parseInt(hex[2] ?? '0', 16), parseInt(hex[3] ?? '0', 16), 1];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+%?))?\s*\)$/i.exec(value);
  if (!rgb) {
    return null;
  }
  const rawAlpha = rgb[4];
  const alpha =
    rawAlpha === undefined ? 1 : rawAlpha.endsWith('%') ? Number(rawAlpha.slice(0, -1)) / 100 : Number(rawAlpha);
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), alpha];
}

/** A canvas colour string with a new alpha. */
export function withAlpha([red, green, blue]: Rgba | Rgb, alpha: number): string {
  const clamp = Math.min(1, Math.max(0, alpha));
  return `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${clamp.toFixed(3)})`;
}
