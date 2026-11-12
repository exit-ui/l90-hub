import { Minus, Plus, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import { parseWhole } from '@/lib/format';
import { buzz } from '@/lib/haptics';
import { DISCLOSE } from '@/lib/motion';
import type { DateKey } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';
import { Field, FieldInput } from './Field';
import { GhostPill } from './GhostPill';
import { PressButton } from './PressButton';

interface DmButtonsProps {
  date: DateKey;
  /** False when another button is the one filled primary button on the screen. */
  primary?: boolean;
  /** The 52 px round "+" of the Today counter. */
  large?: boolean;
}

/** A small "+5" pill and the round "+" button. The same pair on every screen. */
export function DmButtons({ date, primary = true, large = false }: DmButtonsProps) {
  const { addDm } = useHubActions();
  const add = (amount: number) => {
    addDm(date, amount);
    buzz();
  };
  return (
    <div className="flex items-center gap-2">
      <PressButton aria-label="Add 5 DMs" className="px-4" onClick={() => add(5)} tone="secondary">
        +5
      </PressButton>
      <PressButton
        aria-label="Add 1 DM"
        className={large ? 'size-13 sm:size-13' : undefined}
        iconOnly
        onClick={() => add(1)}
        tone={primary ? 'black' : 'secondary'}
      >
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </PressButton>
    </div>
  );
}

/** "Adjust": −1 DM and the exact count, behind one quiet pill. */
export function DmAdjust({ date }: { date: DateKey }) {
  const dm = useHub((state) => state.days[date]?.dm ?? 0);
  const { addDm, setDm } = useHubActions();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const panelId = useId();
  const fieldId = useId();
  return (
    <div>
      <GhostPill aria-controls={panelId} aria-expanded={open} icon={SlidersHorizontal} onClick={() => setOpen((value) => !value)}>
        {open ? 'Close adjust' : 'Adjust'}
      </GhostPill>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            animate={{ height: 'auto', opacity: 1 }}
            className="-mx-2 -mb-2 overflow-hidden px-2 pb-2"
            exit={{ height: 0, opacity: 0 }}
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            transition={DISCLOSE}
          >
            <div className="flex items-end gap-3 pt-4">
              <Field className="min-w-0 flex-1" htmlFor={fieldId} label="Exact count">
                <FieldInput
                  className="num"
                  id={fieldId}
                  inputMode="numeric"
                  onBlur={() => setDraft(null)}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (event.target.value.trim() !== '') {
                      setDm(date, parseWhole(event.target.value.replace(/[^\d]/g, '')));
                    }
                  }}
                  value={draft ?? String(dm)}
                />
              </Field>
              <PressButton
                aria-label="Remove 1 DM"
                className="size-12"
                disabled={dm === 0}
                iconOnly
                onClick={() => addDm(date, -1)}
                tone="secondary"
              >
                <Minus aria-hidden="true" className="size-5" />
              </PressButton>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
