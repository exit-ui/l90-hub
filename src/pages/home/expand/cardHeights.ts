import type { ExpandId } from '@/lib/routes';

/**
 * The last measured height of each card on Today. While a card is open, its grid cell
 * keeps this height, so no other card moves. It lives outside React on purpose: it is a
 * measurement, not state that draws anything.
 */
const heights = new Map<ExpandId, number>();

export function rememberCardHeight(id: ExpandId, height: number): void {
  if (height > 0) {
    heights.set(id, height);
  }
}

export function cardHeight(id: ExpandId): number | undefined {
  return heights.get(id);
}
