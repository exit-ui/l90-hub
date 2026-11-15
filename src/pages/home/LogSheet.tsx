import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { PressButton } from '@/components/shared/PressButton';
import { Sheet } from '@/components/shared/Sheet';
import { useAddDms } from '@/hooks/useAddDms';
import type { DateKey } from '@/store/types';
import { useHub } from '@/store/useHub';
import { Ruler } from './Ruler';

const DEFAULT_AMOUNT = 5;
const MAX = 30;

function LogBody({ date, onDone }: { date: DateKey; onDone: () => void }) {
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const dm = useHub((state) => state.days[date]?.dm ?? 0);
  const target = useHub((state) => state.dmTarget);
  const add = useAddDms(date);

  const save = () => {
    if (amount > 0) {
      add(amount);
    }
    onDone();
  };

  return (
    <div className="grid gap-4">
      <div className="text-center">
        <p className="type-caption tracking-widest text-hub-label uppercase">Add</p>
        <div className="flex items-center justify-center gap-4">
          <PressButton aria-label="One less" disabled={amount === 0} iconOnly onClick={() => setAmount((value) => Math.max(0, value - 1))} tone="secondary">
            <Minus aria-hidden="true" className="size-5" />
          </PressButton>
          <p aria-live="polite" className="num min-w-28 text-[72px] leading-20 font-bold tracking-tight text-hub-text">
            {amount}
          </p>
          <PressButton aria-label="One more" disabled={amount === MAX} iconOnly onClick={() => setAmount((value) => Math.min(MAX, value + 1))} tone="secondary">
            <Plus aria-hidden="true" className="size-5" />
          </PressButton>
        </div>
        <p className="type-label num text-hub-label">{target > 0 ? `Today: ${dm + amount} of ${target}` : `Today: ${dm + amount}`}</p>
      </div>
      <Ruler label="DMs to add" onChange={setAmount} value={amount} />
      <PressButton className="h-13 w-full" onClick={save} tone="primary">
        Save
      </PressButton>
    </div>
  );
}

/** "Log DMs": a ruler you drag to choose how many DMs to add, then Save. It opens from the Log pill. */
export function LogSheet({ open, onOpenChange, date }: { open: boolean; onOpenChange: (open: boolean) => void; date: DateKey }) {
  return (
    <Sheet description="Drag the ruler, then save." onOpenChange={onOpenChange} open={open} title="Log DMs">
      {open ? <LogBody date={date} onDone={() => onOpenChange(false)} /> : null}
    </Sheet>
  );
}
