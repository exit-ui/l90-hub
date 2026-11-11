import { buzz } from '@/lib/haptics';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { CHECK_SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface TickRowProps {
  /** The full task text. It is the accessible name of the row. */
  task: string;
  cue: string | null;
  action: string;
  done: boolean;
  /** The one row to do now. It has a white inset bar and a white cue. */
  isNext?: boolean;
  onToggle: () => void;
}

/**
 * One tick: a 24 px round check and the action, with the cue above it.
 * The full row is the target. A done row keeps its text, without a line through it.
 */
export function TickRow({ task, cue, action, done, isNext = false, onToggle }: TickRowProps) {
  return (
    <button
      aria-label={task}
      aria-pressed={done}
      className={cn(
        'group/tick relative flex min-h-11 w-full cursor-pointer items-center gap-4 rounded-control px-1 py-1 text-left transition-colors hover:bg-hub-inset',
      )}
      data-next={isNext ? 'true' : undefined}
      onClick={() => {
        onToggle();
        buzz();
      }}
      type="button"
    >
      {isNext ? (
        <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-hub-primary" />
      ) : null}
      <span
        aria-hidden="true"
        className={cn(
          'relative flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-150',
          done ? 'bg-hub-positive text-hub-ink' : 'bg-transparent ring-check',
        )}
      >
        {done ? (
          <motion.span
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center"
            initial={{ scale: 0.6, opacity: 0 }}
            transition={CHECK_SPRING}
          >
            <Check className="size-4" strokeWidth={3} />
          </motion.span>
        ) : null}
      </span>
      <span aria-hidden="true" className="min-w-0 flex-1">
        {cue ? (
          <span className={cn('block truncate type-label font-medium', isNext ? 'text-hub-text' : 'text-hub-label')}>
            {cue}
          </span>
        ) : null}
        <span
          className={cn(
            'line-clamp-2 type-body text-pretty transition-colors duration-150',
            done ? 'text-hub-label-strong' : 'text-hub-text',
          )}
        >
          {action}
        </span>
      </span>
    </button>
  );
}
