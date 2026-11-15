/** The meter has one segment for each DM of the target, at most this many. */
export const MAX_SEGMENTS = 24;

/** The segments and how many are lit for a count. A target of 0 has no meter. */
export function segmentsFor(dm: number, target: number): { count: number; lit: number } {
  if (target <= 0) {
    return { count: 0, lit: 0 };
  }
  const count = Math.min(target, MAX_SEGMENTS);
  return { count, lit: Math.max(0, Math.min(count, Math.floor((dm * count) / target))) };
}

/** The short line in the chip: how many are left, "Goal hit", or how many are over. */
export function toGoText(dm: number, target: number): string {
  if (target <= 0) {
    return `${dm} sent`;
  }
  if (dm > target) {
    return `+${dm - target} over`;
  }
  return dm === target ? 'Goal hit' : `${target - dm} to go`;
}
