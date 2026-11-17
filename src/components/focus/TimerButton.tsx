import { Timer } from 'lucide-react';
import { memo } from 'react';
import { todayKey } from '@/lib/dates';
import { openFocus } from '@/lib/focusUi';
import { cn } from '@/lib/utils';
import { useHub } from '@/store/useHub';

interface TimerButtonProps {
  task: string;
  /** "card" sits on a pillar gradient (white); "row" sits on a list row. */
  variant: 'card' | 'row';
}

/**
 * Opens the timer for a task. It sits beside the tick, never inside it: a button cannot hold a button.
 * It shows a dot while this task has the timer on; with another task's timer on, it opens that timer instead.
 */
export const TimerButton = memo(function TimerButton({ task, variant }: TimerButtonProps) {
  const active = useHub((state) => state.timer?.task === task);
  const busy = useHub((state) => state.timer !== null);
  const label = active ? `Open the timer for ${task}` : busy ? 'Open the running timer' : `Start a timer for ${task}`;
  return (
    <button
      aria-label={label}
      className={cn(
        'mk-press relative flex shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full',
        variant === 'card' ? 'size-12 bg-white/15 text-white' : 'size-11 text-hub-label hover:text-hub-text',
      )}
      onClick={() => openFocus(task, todayKey())}
      type="button"
    >
      <Timer aria-hidden="true" className={variant === 'card' ? 'size-5.5' : 'size-5'} strokeWidth={2} />
      {active ? (
        <span
          aria-hidden="true"
          className={cn('absolute top-2 right-2 size-2.5 rounded-full', variant === 'card' ? 'bg-white' : 'bg-[var(--solid)]')}
        />
      ) : null}
    </button>
  );
});
