/**
 * The phone tab bar hides when the page scrolls down and comes back when it scrolls up (round 6).
 * This is the pure rule. The hook in src/hooks/useBarVisible.ts gives it the scroll values.
 */

/** A scroll must move this far before the bar changes. Small jitter does nothing. */
export const BAR_SCROLL_DELTA = 12;
/** Near the top of the page the bar always shows. */
export const BAR_TOP_ZONE = 32;
/** Near the end of the page the bar always shows. */
export const BAR_END_ZONE = 32;

export interface BarScrollInput {
  /** The scroll position now. On iOS it can be below 0 or above maxY during the bounce. */
  y: number;
  /** The scroll position where the bar last changed or the last large move ended. */
  anchor: number;
  /** The largest scroll position: the page height less the viewport height. */
  maxY: number;
  /** True while a field, or the bar itself, has focus. The bar does not hide then. */
  pinned: boolean;
  /** True when the bar shows now. */
  visible: boolean;
}

export interface BarScrollResult {
  visible: boolean;
  anchor: number;
}

/** The next state of the bar after a scroll event. */
export function nextBarState({ y, anchor, maxY, pinned, visible }: BarScrollInput): BarScrollResult {
  if (pinned || y <= BAR_TOP_ZONE || maxY <= BAR_TOP_ZONE || y >= maxY - BAR_END_ZONE) {
    return { visible: true, anchor: y };
  }
  const delta = y - anchor;
  if (Math.abs(delta) < BAR_SCROLL_DELTA) {
    return { visible, anchor };
  }
  return { visible: delta < 0, anchor: y };
}
