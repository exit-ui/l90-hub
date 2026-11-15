import { haptic } from '@/lib/haptics';
import { pulse } from '@/lib/pulse';
import type { DateKey } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';

/**
 * Adds DMs with a haptic: one tick, or two when this tap reaches the target.
 * Reads the store at tap time, so the caller does not draw again on each DM.
 */
export function useAddDms(date: DateKey): (amount: number) => void {
  const { addDm } = useHubActions();
  return (amount: number) => {
    const { days, dmTarget } = useHub.getState();
    const before = days[date]?.dm ?? 0;
    const reaches = dmTarget > 0 && before < dmTarget && before + amount >= dmTarget;
    haptic(reaches ? 'success' : 'tap');
    addDm(date, amount);
    pulse();
  };
}
