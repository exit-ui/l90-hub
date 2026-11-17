import { haptic } from '@/lib/haptics';
import { pulse } from '@/lib/pulse';
import type { DateKey } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';

/** A DM added within this long of the last one is part of a run. */
export const RUN_GAP_MS = 4000;
let lastAddAt = 0;

/**
 * Adds DMs with a haptic: one tick, or two when this tap reaches the target.
 * Frequency of use: a +1 is the most repeated tap in the app, so only the first of a run (and the one that reaches
 * the target) flashes the glow. The next taps of the run answer with the number, the segment and the haptic only.
 * Reads the store at tap time, so the caller does not draw again on each DM.
 */
export function useAddDms(date: DateKey): (amount: number) => void {
  const { addDm } = useHubActions();
  return (amount: number) => {
    const { days, dmTarget } = useHub.getState();
    const before = days[date]?.dm ?? 0;
    const reaches = dmTarget > 0 && before < dmTarget && before + amount >= dmTarget;
    const now = Date.now();
    const inRun = now - lastAddAt < RUN_GAP_MS;
    lastAddAt = now;
    haptic(reaches ? 'success' : 'tap');
    addDm(date, amount);
    if (!inRun || reaches) {
      pulse();
    }
  };
}
