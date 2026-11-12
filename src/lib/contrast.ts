/**
 * Pure colour helpers for the contrast checks of the light theme (WCAG 2.2).
 * The unit test reads the tokens in src/index.css and checks each text colour on white and on the page.
 */

export type Rgb = readonly [number, number, number];
export type Rgba = readonly [number, number, number, number];

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
