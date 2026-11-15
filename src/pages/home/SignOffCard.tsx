import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { DoneBadge } from '@/components/shared/DoneBadge';
import { PressButton } from '@/components/shared/PressButton';
import { TickRow } from '@/components/shared/TickRow';
import { useRisingEdge } from '@/hooks/useRisingEdge';
import { COLLAPSED_TICKS, MAX_VISIBLE_TICKS, type ModuleView } from '@/lib/moduleView';
import { CARD_RADIUS, CARD_TAP, CONTENT_IN, EXPAND_CLOSE, SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { rememberCardHeight } from './expand/cardHeights';

const RING_SIZE = 56;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2 - 1;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** A small ring: the ticks of the whole day, done of total. */
function DayRing({ done, total }: { done: number; total: number }) {
  const reduced = useReducedMotion();
  const fraction = total > 0 ? Math.min(1, done / total) : 0;
  const centre = RING_SIZE / 2;
  return (
    <div className="relative size-14 shrink-0">
      <svg aria-hidden="true" className="size-14 -rotate-90" viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <circle className="stroke-hub-track" cx={centre} cy={centre} fill="none" r={RING_RADIUS} strokeWidth={RING_STROKE} />
        <motion.circle
          animate={{ strokeDashoffset: RING_LENGTH * (1 - fraction) }}
          className="stroke-hub-success"
          cx={centre}
          cy={centre}
          fill="none"
          initial={false}
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeLinecap="round"
          strokeWidth={RING_STROKE}
          transition={reduced ? { duration: 0 } : SPRING}
        />
      </svg>
      <span aria-hidden="true" className="type-caption num absolute inset-0 flex items-center justify-center font-semibold text-hub-text">
        {done}/{total}
      </span>
    </div>
  );
}

interface SignOffCardProps {
  view: ModuleView;
  ticksDone: number;
  ticksTotal: number;
  signedOff: boolean;
  onOpen: () => void;
  onSignOff: () => void;
  onToggle: (task: string) => void;
  returning?: boolean;
  className?: string;
}

/**
 * "Sign off the day": a ring with the ticks of the day, one line and the explicit sign-off button.
 * The header opens the Sign-off view. Only the button records the sign-off; a tick never does.
 */
export function SignOffCard({
  view,
  ticksDone,
  ticksTotal,
  signedOff,
  onOpen,
  onSignOff,
  onToggle,
  returning = false,
  className,
}: SignOffCardProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const card = useRef<HTMLElement>(null);
  const glints = useRisingEdge(view.complete);
  const [pressed, setPressed] = useState(false);
  const allDone = ticksTotal > 0 && ticksDone === ticksTotal;
  const collapsible = view.ticks.length > MAX_VISIBLE_TICKS;
  const visible = collapsible ? view.ticks.slice(0, COLLAPSED_TICKS) : view.ticks;
  const fadeIn = returning ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: CONTENT_IN } : {};
  const line = signedOff
    ? 'The day is signed off. See you tomorrow.'
    : ticksTotal === 0
      ? 'No ticks today. You can still sign off.'
      : allDone
        ? 'All ticks are done. Sign off the day.'
        : `${ticksDone} of ${ticksTotal} ticks done. You can still sign off.`;

  useEffect(() => {
    const element = card.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => rememberCardHeight('signoff', element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.section
      animate={pressed && !reduced ? CARD_TAP : { scale: 1 }}
      aria-labelledby={titleId}
      className={cn(
        'surface-card flex min-w-0 flex-col p-4 transition-[background-color,box-shadow] duration-300 sm:p-5',
        (signedOff || view.complete) && 'rim-positive',
        className,
      )}
      data-pillar="signoff"
      layoutId="card-signoff"
      ref={card}
      style={{ borderRadius: CARD_RADIUS }}
      transition={EXPAND_CLOSE}
    >
      {glints > 0 && !reduced ? <span aria-hidden="true" className="rim-glint" key={glints} /> : null}
      <p aria-live="polite" className="sr-only">
        {view.announce}
      </p>
      <div className="flex items-center gap-3">
        <div aria-label={`${ticksDone} of ${ticksTotal} ticks of the day done`} role="img">
          <DayRing done={ticksDone} total={ticksTotal} />
        </div>
        <button
          aria-controls="view-signoff"
          aria-expanded={false}
          aria-label="Open the Sign-off details."
          className="-my-2 flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col items-start justify-center rounded-control px-2 py-2 text-left transition-colors hover:bg-hub-inset"
          data-open-target="signoff"
          onClick={onOpen}
          onPointerCancel={() => setPressed(false)}
          onPointerDown={() => setPressed(true)}
          onPointerLeave={() => setPressed(false)}
          onPointerUp={() => setPressed(false)}
          type="button"
        >
          <motion.span
            className="type-name inline-block w-fit text-hub-text"
            id={titleId}
            layoutId="title-signoff"
            transition={EXPAND_CLOSE}
          >
            {signedOff ? 'Day signed off' : 'Sign off the day'}
          </motion.span>
          <span className="type-label text-hub-label">{line}</span>
        </button>
        {signedOff ? (
          <DoneBadge className="shrink-0" />
        ) : (
          <PressButton className="px-4" onClick={onSignOff} tone="primary">
            Sign off
          </PressButton>
        )}
      </div>
      {view.ticks.length > 0 ? (
        <motion.div {...fadeIn}>
          <ul className="-mx-2 mt-3 grid gap-1">
            {visible.map((tick) => (
              <li key={tick.task}>
                <TickRow
                  action={tick.action}
                  cue={tick.cue}
                  done={tick.done}
                  isNext={tick.isNext}
                  onToggle={() => onToggle(tick.task)}
                  task={tick.task}
                />
              </li>
            ))}
          </ul>
          {collapsible ? (
            <button
              className="tap press type-label -ml-2 mt-1 inline-flex cursor-pointer items-center rounded-full px-2 text-hub-label-strong hover:text-hub-text"
              onClick={onOpen}
              type="button"
            >
              {`Show ${view.ticks.length - COLLAPSED_TICKS} more`}
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </motion.section>
  );
}
