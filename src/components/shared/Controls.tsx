import { Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useId } from 'react';
import { BUTTON_TAP, SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { PressButton } from './PressButton';

interface RemoveButtonProps {
  /** The full name of the action, for example "Remove the session of 3 November". */
  label: string;
  onClick: () => void;
}

/** A round button that removes one item. */
export function RemoveButton({ label, onClick }: RemoveButtonProps) {
  return (
    <PressButton aria-label={label} iconOnly onClick={onClick} title={label} tone="ghost">
      <Trash2 aria-hidden="true" className="size-4 text-hub-label" />
    </PressButton>
  );
}

interface TableShellProps {
  /** Shown when the table has no rows. */
  empty?: string;
  isEmpty?: boolean;
  children: ReactNode;
  className?: string;
}

/** Holds a table. A wide table scrolls inside this box, so the page does not scroll sideways. */
export function TableShell({ empty, isEmpty = false, children, className }: TableShellProps) {
  if (isEmpty && empty) {
    return <p className={cn('py-4 type-body text-hub-label', className)}>{empty}</p>;
  }
  return (
    <div
      aria-label="Table. Scroll sideways to see all the columns."
      className={cn('surface-inset max-w-full overflow-x-auto', className)}
      role="region"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedSwitchProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** The name of the switch for screen readers. */
  label: string;
  className?: string;
}

/** A pill segmented control: the active pill is brand green with white text. */
export function SegmentedSwitch<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedSwitchProps<T>) {
  const indicatorId = useId();
  return (
    <div
      aria-label={label}
      className={cn(
        'surface-card grid auto-cols-fr grid-flow-col gap-1 rounded-full p-1',
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <motion.button
            aria-pressed={active}
            className={cn(
              'relative min-h-11 cursor-pointer rounded-full px-4 type-body font-semibold transition-colors',
              active ? 'text-hub-on-brand' : 'text-hub-label hover:text-hub-text',
            )}
            key={option.id}
            onClick={() => onChange(option.id)}
            transition={SPRING}
            type="button"
            whileTap={BUTTON_TAP}
          >
            {active ? (
              <motion.span
                className="glass-pill absolute inset-0 rounded-full"
                layoutId={indicatorId}
                transition={SPRING}
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** The title of a card: the section size. */
export function CardTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 className="type-section font-semibold text-hub-text" id={id}>
      {children}
    </h2>
  );
}
