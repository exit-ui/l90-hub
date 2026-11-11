/**
 * Pure helpers for the liquid glass chrome:
 * the edge lens displacement map and the scroll state of the tab bar.
 */

export interface LensShape {
  width: number;
  height: number;
  /** The corner radius in px. A value above half the short side gives a capsule. */
  radius: number;
  /** The width of the curved rim in px. The centre inside the rim stays flat. */
  bezel: number;
}

export interface Vector {
  x: number;
  y: number;
}

const NEUTRAL: Vector = { x: 0, y: 0 };

/**
 * The displacement at one pixel, from -1 to 1 on each axis.
 * The vector points into the shape, so the rim samples the backdrop from further in.
 * The effect is strongest at the edge and falls to zero at the inner side of the bezel.
 */
export function lensVector(px: number, py: number, shape: LensShape): Vector {
  const { width, height, bezel } = shape;
  if (width <= 0 || height <= 0 || bezel <= 0) {
    return NEUTRAL;
  }
  const halfW = width / 2;
  const halfH = height / 2;
  const radius = Math.max(0, Math.min(shape.radius, halfW, halfH));
  const relX = px - halfW;
  const relY = py - halfH;
  const qx = Math.abs(relX) - (halfW - radius);
  const qy = Math.abs(relY) - (halfH - radius);

  let normalX: number;
  let normalY: number;
  let outside: number;
  if (qx > 0 && qy > 0) {
    const length = Math.hypot(qx, qy);
    normalX = qx / length;
    normalY = qy / length;
    outside = length - radius;
  } else if (qx > qy) {
    normalX = 1;
    normalY = 0;
    outside = qx - radius;
  } else {
    normalX = 0;
    normalY = 1;
    outside = qy - radius;
  }

  const depth = -outside;
  if (depth < 0 || depth >= bezel) {
    return NEUTRAL;
  }
  const t = 1 - depth / bezel;
  // A convex rim: a steep bend at the edge that settles smoothly.
  const strength = t * t * (1.6 - 0.6 * t);
  return {
    x: -Math.sign(relX) * normalX * strength,
    y: -Math.sign(relY) * normalY * strength,
  };
}

/** One byte for a displacement channel. 128 is no movement. */
export function encodeChannel(value: number): number {
  return Math.round(128 + Math.max(-1, Math.min(1, value)) * 127);
}

/**
 * The RGBA pixels of a displacement map for feDisplacementMap.
 * Red holds the x movement and green holds the y movement.
 * The map is mirror-symmetric, so only one quadrant is calculated.
 */
export function lensPixels(shape: LensShape): Uint8ClampedArray<ArrayBuffer> {
  const width = Math.max(1, Math.round(shape.width));
  const height = Math.max(1, Math.round(shape.height));
  const pixels = new Uint8ClampedArray(width * height * 4);
  const halfW = Math.ceil(width / 2);
  const halfH = Math.ceil(height / 2);
  for (let y = 0; y < halfH; y += 1) {
    for (let x = 0; x < halfW; x += 1) {
      const vector = lensVector(x + 0.5, y + 0.5, { ...shape, width, height });
      const red = encodeChannel(vector.x);
      const green = encodeChannel(vector.y);
      const mirrors: readonly [number, number, number, number][] = [
        [x, y, red, green],
        [width - 1 - x, y, 256 - red, green],
        [x, height - 1 - y, red, 256 - green],
        [width - 1 - x, height - 1 - y, 256 - red, 256 - green],
      ];
      for (const [mx, my, r, g] of mirrors) {
        const index = (my * width + mx) * 4;
        pixels[index] = r;
        pixels[index + 1] = g;
        pixels[index + 2] = 128;
        pixels[index + 3] = 255;
      }
    }
  }
  return pixels;
}

export interface Brand {
  brand: string;
}

/**
 * True when the browser is Chromium. Only Chromium applies an SVG filter in backdrop-filter.
 * Safari and Firefox do not give brands, so they get the blur without the lens.
 */
export function isChromium(brands: readonly Brand[] | undefined): boolean {
  return brands?.some((entry) => entry.brand === 'Chromium') ?? false;
}

export interface ScrollState {
  lastY: number;
  compact: boolean;
}

/** Scroll this far in one direction before the tab bar changes size. */
export const SCROLL_STEP = 12;
/** Near the top of the page the tab bar is always full size. */
export const SCROLL_TOP_ZONE = 48;

/**
 * The next state of the tab bar after a scroll.
 * Scroll down makes the bar compact. Scroll up, or the top of the page, makes it full size.
 */
export function nextScrollState(state: ScrollState, y: number): ScrollState {
  if (y <= SCROLL_TOP_ZONE) {
    return { lastY: y, compact: false };
  }
  const delta = y - state.lastY;
  if (Math.abs(delta) < SCROLL_STEP) {
    return state;
  }
  return { lastY: y, compact: delta > 0 };
}
