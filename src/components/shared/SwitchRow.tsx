import { motion, useReducedMotion } from 'motion/react';
import { buzz } from '@/lib/haptics';
import { NO_MOTION, SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface SwitchRowProps {
  label: string;
  /** A short line under the label, for example the date. */
  detail?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/** An iOS-style switch row: a white card that is the full touch target. On, the track is green and the card turns the done tint. */
export function SwitchRow({ label, detail, checked, onChange, className }: SwitchRowProps) {
  const reduced = useReducedMotion();
  return (
    <button
      aria-checked={checked}
      className={cn(
        'surface-card flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-[background-color,box-shadow] duration-200',
        checked && 'rim-positive',
        className,
      )}
      onClick={() => {
        onChange(!checked);
        buzz();
      }}
      role="switch"
      type="button"
    >
      <span className="min-w-0 flex-1">
        <span className="type-name block text-hub-text">{label}</span>
        {detail ? <span className="type-label mt-0.5 block text-hub-label">{detail}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'relative flex h-8 w-13 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200',
          checked ? 'justify-end bg-hub-success' : 'justify-start bg-hub-switch-off',
        )}
      >
        <motion.span className="block size-7 rounded-full bg-hub-surface shadow-sm" layout transition={reduced ? NO_MOTION : SPRING} />
      </span>
    </button>
  );
}
