import { Check, Pause } from 'lucide-react';
import { useClock } from '@/hooks/useClock';
import { formatClock, remainingMs, timerPhase } from '@/lib/focus';
import { openFocus, useFocusUi } from '@/lib/focusUi';
import { pillarOfTask, splitTask } from '@/lib/pillars';
import { cn } from '@/lib/utils';
import type { Timer } from '@/store/types';
import { isSampleMode } from '@/store/sample';
import { useHub } from '@/store/useHub';
import { FocusSheet } from './FocusSheet';
import { TimerRing } from './TimerRing';

/**
 * The timer at the top of the page: a small chip with the ring and the clock. It takes its own row, so it never
 * covers the page title, and it sticks to the top while the page scrolls. A tap opens the timer.
 * When the timer has finished it turns white and says "Done".
 */
function BarBody({ timer }: { timer: Timer }) {
  const now = useClock();
  const phase = timerPhase(timer, now);
  const left = remainingMs(timer, now);
  const total = timer.minutes * 60_000;
  const pillar = pillarOfTask(timer.task);
  const label =
    phase === 'finished'
      ? `Timer done. Collect ${timer.minutes} minutes.`
      : `${formatClock(left)} left${phase === 'paused' ? ', paused' : ''}. Open the timer.`;

  return (
    <button
      aria-label={`${splitTask(timer.task).action}. ${label}`}
      className={cn(
        'hit-area pointer-events-auto flex h-8 cursor-pointer items-center gap-2 rounded-full pr-3.5 pl-2.5 shadow-md',
        phase === 'finished' ? 'bg-white text-[#0a0b10]' : cn('pillar-card text-white', `pillar-${pillar}`),
      )}
      onClick={() => openFocus(timer.task, timer.date)}
      type="button"
    >
      {phase === 'finished' ? (
        <Check aria-hidden="true" className="icon-swap size-4" strokeWidth={3.2} />
      ) : (
        <TimerRing className="size-4 shrink-0" fraction={1 - left / total} thickness={14} />
      )}
      <span aria-hidden="true" className="num type-label font-bold">
        {phase === 'finished' ? 'Done' : formatClock(left)}
      </span>
      {phase === 'paused' ? <Pause aria-hidden="true" className="icon-swap size-3 text-white/80" fill="currentColor" /> : null}
    </button>
  );
}

/** The row at the top of the page for the timer. It exists only while a timer is on. */
export function FocusBar() {
  const timer = useHub((state) => state.timer);
  const ui = useFocusUi();
  if (!timer) {
    return null;
  }
  // While the sheet is open the row stays (hidden), so the page does not jump when the sheet closes.
  return (
    <div
      className={cn(
        'pointer-events-none sticky z-20 mb-3 flex justify-center',
        // The sample banner is stuck to the top too, so the chip sticks just under it.
        isSampleMode() ? 'top-16' : 'top-[max(0.5rem,env(safe-area-inset-top))]',
        ui.open && 'invisible',
      )}
    >
      <BarBody timer={timer} />
    </div>
  );
}

/** The timer's sheet. The app shell holds it once, so a timer can open from any page. */
export function FocusHost() {
  return <FocusSheet />;
}
