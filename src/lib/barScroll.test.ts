import { describe, expect, it } from 'vitest';
import { BAR_SCROLL_DELTA, nextBarState } from './barScroll';

const base = { anchor: 200, maxY: 2000, pinned: false, visible: true };

describe('nextBarState', () => {
  it('hides the bar when the page scrolls down by more than the delta', () => {
    expect(nextBarState({ ...base, y: 200 + BAR_SCROLL_DELTA })).toEqual({ visible: false, anchor: 212 });
  });

  it('shows the bar again when the page scrolls up', () => {
    expect(nextBarState({ ...base, visible: false, y: 150 })).toEqual({ visible: true, anchor: 150 });
  });

  it('keeps the state and the anchor for a small move', () => {
    expect(nextBarState({ ...base, visible: false, y: 205 })).toEqual({ visible: false, anchor: 200 });
    expect(nextBarState({ ...base, y: 195 })).toEqual({ visible: true, anchor: 200 });
  });

  it('always shows the bar near the top, also during the iOS bounce', () => {
    expect(nextBarState({ ...base, visible: false, anchor: 10, y: 30 }).visible).toBe(true);
    expect(nextBarState({ ...base, visible: false, anchor: 0, y: -40 }).visible).toBe(true);
  });

  it('always shows the bar at the end of the page', () => {
    expect(nextBarState({ ...base, visible: false, anchor: 1900, y: 1990 }).visible).toBe(true);
    expect(nextBarState({ ...base, visible: false, anchor: 1990, y: 2060 }).visible).toBe(true);
  });

  it('never hides the bar while a field has focus', () => {
    expect(nextBarState({ ...base, pinned: true, y: 900 })).toEqual({ visible: true, anchor: 900 });
  });

  it('shows the bar on a page that is too short to scroll', () => {
    expect(nextBarState({ ...base, maxY: 0, visible: false, y: 0 }).visible).toBe(true);
  });
});
