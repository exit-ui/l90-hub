import { buzz } from '@/lib/haptics';
import { Plus } from 'lucide-react';
import { PressButton } from '@/components/shared/PressButton';
import type { DateKey } from '@/store/types';
import { useHubActions } from '@/store/useHub';

interface OutreachControlsProps {
  date: DateKey;
  /** False when the Sign-off button is the one filled primary button. */
  primary: boolean;
}

/** A small +5 pill and a round +1 button beside the DM number. Adjust is in the Outreach view. */
export function OutreachControls({ date, primary }: OutreachControlsProps) {
  const { addDm } = useHubActions();
  const add = (amount: number) => {
    addDm(date, amount);
    buzz();
  };
  return (
    <div className="flex items-center gap-2">
      <PressButton aria-label="Add 5 DMs" className="px-3" onClick={() => add(5)} tone="secondary">
        +5
      </PressButton>
      <PressButton aria-label="Add 1 DM" iconOnly onClick={() => add(1)} tone={primary ? 'primary' : 'secondary'}>
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </PressButton>
    </div>
  );
}
