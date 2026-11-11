/**
 * Motion presets for the hub (spec 9.1). Components import these and never inline numbers.
 * "Reaches target" is a spring's visualDuration or a tween's duration. Each is under 400 ms,
 * except the sign-off count sequence (700 ms or less).
 */

/** Small UI: the active pill, the segment indicator. */
export const SPRING = { type: 'spring', stiffness: 520, damping: 38, mass: 0.9 } as const;
/** The check fill. */
export const CHECK_SPRING = { type: 'spring', stiffness: 700, damping: 32, mass: 0.6 } as const;
/** Card to expanded view: the shared elements. */
export const EXPAND_OPEN = { type: 'spring', visualDuration: 0.35, bounce: 0.12 } as const;
/** Expanded view to card. No overshoot into the grid. */
export const EXPAND_CLOSE = { type: 'spring', visualDuration: 0.3, bounce: 0 } as const;
/** A swipe-down that stops before the close threshold. */
export const DRAG_RETURN = { type: 'spring', visualDuration: 0.25, bounce: 0.2 } as const;
/** Each digit column of the number roll. */
export const DIGIT_SPRING = { type: 'spring', visualDuration: 0.32, bounce: 0.1 } as const;
/** The digit columns may slide sideways for this long after a value change. */
export const DIGIT_SETTLE_MS = 400;
/** Sheets: the More menu, the section menus. */
export const SHEET_SPRING = { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 } as const;
/** In-place disclosures, for example "Adjust" and "Show data as a table". */
export const DISCLOSE = { type: 'spring', stiffness: 600, damping: 50, mass: 0.8 } as const;
/** The overlay: 200 ms in, 150 ms out. */
export const OVERLAY_FADE = {
  in: { duration: 0.2, ease: 'easeOut' },
  out: { duration: 0.15, ease: 'easeOut' },
} as const;
/** Content that is not shared, inside an expanded view. */
export const CONTENT_IN = { duration: 0.15, delay: 0.12, ease: 'easeOut' } as const;
export const CONTENT_OUT = { duration: 0.1, ease: 'easeOut' } as const;
/** The Close button and the grabber show near the end of the flight, so they never look stretched. */
export const CHROME_IN = { duration: 0.1, delay: 0.25, ease: 'easeOut' } as const;
/** Tick rows in an expanded view: 30 ms apart from 120 ms. Item 7 and later use the item-6 delay. */
export const STAGGER = { step: 0.03, start: 0.12, max: 6 } as const;
/** Generic fades and every reduced-motion fallback. */
export const FADE = { duration: 0.15, ease: 'easeOut' } as const;

/** The chart morph: x and y domains and the marks move together in 300 ms. */
export const CHART_EASE = [0.2, 0.8, 0.2, 1] as const;
export const CHART_MORPH_MS = 300;
/** The first draw of a small chart (rings, gauges, sparklines). */
export const CHART_ENTER = { duration: 0.35, ease: 'easeOut' } as const;
export const CHART_ENTER_MS = 350;
/** One part of a small chart that comes in, for example a ring segment. */
export const CHART_PART_ENTER = { duration: 0.2, ease: 'easeOut' } as const;
/** No motion: the reduced-motion choice for a chart or a drag return. */
export const NO_MOTION = { duration: 0 } as const;
/** A ring or gauge value that moves to a new value. */
export const GAUGE_SPRING = { visualDuration: 0.32, bounce: 0.1 } as const;
/** A compare series that comes or goes fades in 250 ms. */
export const SERIES_FADE = { duration: 0.25, ease: 'easeOut' } as const;

/** The radius of a card and of an expanded view, set inline so Motion corrects it during a scale. */
export const CARD_RADIUS = 28;
export const VIEW_RADIUS = 32;

export const BUTTON_TAP = { scale: 0.96, transition: { duration: 0.1 } } as const;
export const CARD_TAP = { scale: 0.98, transition: { duration: 0.1 } } as const;

/** The Outreach number pulses one time at the target: 1 → 1.04 → 1 in 300 ms. */
export const PULSE: { scale: number[]; transition: { duration: number; ease: 'easeOut' } } = {
  scale: [1, 1.04, 1],
  transition: { duration: 0.3, ease: 'easeOut' },
};

/** The sign-off numbers roll from 0, 80 ms apart, after the view settles. */
export const COUNT_STEP_S = 0.08;
export const COUNT_START_S = 0.2;

/** The swipe-down close: distance in px, speed in px/s, and the overlay fade range. */
export const SWIPE_CLOSE = { offset: 120, velocity: 600, fadeRange: 240, fadeTo: 0.4 } as const;

/** The delay of one tick row in an expanded view. */
export function staggerDelay(index: number): number {
  return STAGGER.start + Math.min(index, STAGGER.max - 1) * STAGGER.step;
}

/** A phase reward claim is a peak moment. It gets one short burst. A single tick never does. */
export const CELEBRATION_MS = 380;

export interface BurstOffset {
  x: number;
  y: number;
}

/** Points on a circle, for the sparks of a short celebration. */
export function burstOffsets(count: number, distance: number): BurstOffset[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  });
}
