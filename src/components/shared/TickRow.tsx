import { Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { memo, useState } from 'react';
import { haptic, type HapticKind } from '@/lib/haptics';
import { CHECK_POP, RIPPLE } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface TickRowProps {
  /** The full task text. It is the accessible name of the row. */
  task: string;
  cue: string | null;
  action: string;
  done: boolean;
  /** The one row to do now. It has a green inset bar and a dark cue. */
  isNext?: boolean;
  /** The haptic when this tap marks the row done: "success" when it completes the card, "peak" for the day. */
  doneHaptic?: HapticKind;
  onToggle: (task: string) => void;
}

/**
 * One tick: a 24 px round check and the action, with the cue above it.
 * The press shows at once (CSS :active). A tick pops the check with a green ripple and a haptic.
 * The pop only plays after a tap, never when the page opens.
 */
export const TickRow = memo(function TickRow({
  task,
  cue,
  action,
  done,
  isNext = false,
  doneHaptic = 'tap',
  onToggle,
}: TickRowProps) {
  const reduced = useReducedMotion();
  // Counts the taps that ticked the row, so the pop and the ripple replay on each one.
  const [pops, setPops] = useState(0);
  const popped = pops > 0 && done && !reduced;
  return (
    <button
      aria-label={task}
      aria-pressed={done}
      className="group/tick relative flex min-h-11 w-full cursor-pointer touch-manipulation items-center gap-4 rounded-control px-1 py-1 text-left transition-[background-color,transform] duration-100 select-none hover:bg-hub-inset active:scale-[0.985] active:bg-hub-inset"
      data-next={isNext ? 'true' : undefined}
      onClick={() => {
        haptic(done ? 'tap' : doneHaptic);
        if (!done) {
          setPops((count) => count + 1);
        }
        onToggle(task);
      }}
      type="button"
    >
      {isNext && !done ? (
        <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-hub-brand" />
      ) : null}
      <span
        aria-hidden="true"
        className={cn(
          'relative flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-150',
          done ? 'bg-hub-success text-hub-on-success' : 'bg-transparent ring-check',
        )}
      >
        {popped ? (
          <motion.span
            animate={{ scale: 2.2, opacity: 0 }}
            className="absolute inset-0 rounded-full bg-hub-success"
            initial={{ scale: 1, opacity: 0.45 }}
            key={`ripple-${pops}`}
            transition={RIPPLE}
          />
        ) : null}
        {done ? (
          <motion.span
            animate={{ scale: 1, opacity: 1 }}
            className="relative flex items-center justify-center"
            initial={popped ? { scale: 0.3, opacity: 0 } : false}
            key={`check-${pops}`}
            transition={CHECK_POP}
          >
            <Check className="size-4" strokeWidth={3} />
          </motion.span>
        ) : null}
      </span>
      <span aria-hidden="true" className="min-w-0 flex-1">
        {cue ? (
          <span className={cn('block truncate type-label font-medium', isNext && !done ? 'text-hub-text' : 'text-hub-label')}>
            {cue}
          </span>
        ) : null}
        <span
          className={cn(
            'line-clamp-2 type-body text-pretty transition-colors duration-150',
            done ? 'text-hub-label' : 'text-hub-text',
          )}
        >
          {action}
        </span>
      </span>
    </button>
  );
});
