/**
 * The maths for the schematic curves on the Method page.
 * These curves are illustrations. They do not use the record of the user.
 */

export interface CurvePoint {
  /** The day on the x axis. */
  day: number;
  /** A value from 0 to 1 on the y axis. */
  value: number;
}

export interface SvgPoint {
  x: number;
  y: number;
}

/** The drawing area of one schematic, in viewBox units. */
export interface CurveFrame {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** The last day on the x axis. The first day is 0. */
  days: number;
}

export const HABIT_DAYS = 90;
/** The time constant of the habit curve. The curve is near its limit at day 66. */
export const HABIT_TIME_CONSTANT = 22;
export const HABIT_TICKS: readonly number[] = [0, 30, 60, 90];

export const REVIEW_DAYS: readonly number[] = [1, 3, 7, 15];
export const SPACING_DAYS = 21;
/** The memory holds for this number of days after the first learning. */
export const FIRST_STABILITY = 1;
/** Each review multiplies the hold time by this number. */
export const STABILITY_GROWTH = 2;

export const HABIT_FRAME: CurveFrame = {
  width: 360,
  height: 220,
  left: 16,
  right: 16,
  top: 34,
  bottom: 34,
  days: HABIT_DAYS,
};

export const SPACING_FRAME: CurveFrame = {
  width: 360,
  height: 220,
  left: 16,
  right: 16,
  top: 20,
  bottom: 34,
  days: SPACING_DAYS,
};

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** The height of the habit curve on a day: 0 on day 0, then a rise that becomes flat. */
export function habitValue(day: number): number {
  if (!Number.isFinite(day) || day <= 0) {
    return 0;
  }
  return 1 - Math.exp(-day / HABIT_TIME_CONSTANT);
}

/** One point for each day from 0 to the last day. */
export function habitCurve(days: number = HABIT_DAYS): CurvePoint[] {
  const last = Math.max(1, Math.floor(days));
  return Array.from({ length: last + 1 }, (_, day) => ({ day, value: habitValue(day) }));
}

/** The memory that remains after a number of days without a review. */
export function retention(daysSinceReview: number, stability: number): number {
  if (stability <= 0) {
    return 0;
  }
  return Math.exp(-Math.max(0, daysSinceReview) / stability);
}

/**
 * The saw-tooth forgetting curve.
 * The memory starts at 1 and drops. Each review lifts it back to 1.
 * After each review the drop is slower.
 * A review day has two points: the low value before the review and 1 after it.
 */
export function spacingCurve(
  reviews: readonly number[] = REVIEW_DAYS,
  days: number = SPACING_DAYS,
  stepsInDay = 8,
): CurvePoint[] {
  const steps = Math.max(1, Math.floor(stepsInDay));
  const ordered = reviews
    .filter((day) => Number.isFinite(day) && day > 0 && day < days)
    .sort((a, b) => a - b);
  const points: CurvePoint[] = [{ day: 0, value: 1 }];
  let lastReview = 0;
  let stability = FIRST_STABILITY;
  let next = 0;
  for (let step = 1; step <= days * steps; step += 1) {
    const day = step / steps;
    while (next < ordered.length && (ordered[next] ?? Infinity) <= day) {
      const reviewDay = ordered[next] ?? day;
      points.push({ day: reviewDay, value: retention(reviewDay - lastReview, stability) });
      points.push({ day: reviewDay, value: 1 });
      lastReview = reviewDay;
      stability *= STABILITY_GROWTH;
      next += 1;
    }
    if (day > lastReview) {
      points.push({ day, value: retention(day - lastReview, stability) });
    }
  }
  return points;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The x position of a day inside the frame. */
export function xOfDay(day: number, frame: CurveFrame): number {
  const inner = frame.width - frame.left - frame.right;
  return round(frame.left + (clamp(day, 0, frame.days) / frame.days) * inner);
}

/** The y position of a value from 0 to 1 inside the frame. 1 is at the top. */
export function yOfValue(value: number, frame: CurveFrame): number {
  const inner = frame.height - frame.top - frame.bottom;
  return round(frame.top + (1 - clamp(value, 0, 1)) * inner);
}

export function baselineY(frame: CurveFrame): number {
  return frame.height - frame.bottom;
}

export function toSvgPoint(point: CurvePoint, frame: CurveFrame): SvgPoint {
  return { x: xOfDay(point.day, frame), y: yOfValue(point.value, frame) };
}

/** An SVG path through the points. An empty list gives an empty path. */
export function linePath(points: readonly CurvePoint[], frame: CurveFrame): string {
  return points
    .map((point, index) => {
      const { x, y } = toSvgPoint(point, frame);
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join(' ');
}

/** The line path closed down to the x axis, for the area below the curve. */
export function areaPath(points: readonly CurvePoint[], frame: CurveFrame): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) {
    return '';
  }
  const base = baselineY(frame);
  return `${linePath(points, frame)} L${xOfDay(last.day, frame)} ${base} L${xOfDay(first.day, frame)} ${base} Z`;
}

export type LabelAnchor = 'start' | 'middle' | 'end';

/** Keeps a label inside the frame: a label near an edge aligns to that edge. */
export function labelAnchor(day: number, frame: CurveFrame): LabelAnchor {
  const fraction = clamp(day, 0, frame.days) / frame.days;
  if (fraction < 0.15) {
    return 'start';
  }
  return fraction > 0.85 ? 'end' : 'middle';
}
