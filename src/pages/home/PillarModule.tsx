import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { DoneBadge } from '@/components/shared/DoneBadge';
import { PILLAR_ICONS } from '@/components/shared/pillarIcons';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { useRisingEdge } from '@/hooks/useRisingEdge';
import { TickRow } from '@/components/shared/TickRow';
import { COLLAPSED_TICKS, MAX_VISIBLE_TICKS, type ModuleView } from '@/lib/moduleView';
import { CARD_RADIUS, CARD_TAP, CONTENT_IN, EXPAND_CLOSE, PULSE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { rememberCardHeight } from './expand/cardHeights';

interface PillarModuleProps {
  view: ModuleView;
  onToggle: (task: string) => void;
  /** Opens the expanded view of the module. */
  onOpen: () => void;
  /** Format of the moving number, for example a signed R value. */
  format?: (value: number) => string;
  /** Whole numbers only. Set false for R. */
  whole?: boolean;
  /** Rows after the ticks, for example "Review 3 cards". */
  extraRows?: ReactNode;
  /** Controls at the bottom, for example "+1 check". */
  controls?: ReactNode;
  /** One short line under the header, for example the Outreach hint. */
  subline?: ReactNode;
  /** Pulse the number one time, for example at the 20th DM. */
  pulseKey?: number;
  /** True right after its view closes: the content that is not shared fades in. */
  returning?: boolean;
  /** The open state of the view. The grid shows a placeholder while it is open, so this is false here. */
  isOpen?: boolean;
  className?: string;
}

/**
 * One tick card of the day: a header button (icon, name, ratio or "Done", the number) that opens the view,
 * the ticks and a thin bar. A done card turns the pale done green with a green rim and a "Done" pill.
 * The surface, the name, the number and the bar fly into the view. The card never moves or reorders.
 */
export function PillarModule({
  view,
  onToggle,
  onOpen,
  format,
  whole = true,
  extraRows,
  controls,
  subline,
  pulseKey = 0,
  returning = false,
  isOpen = false,
  className,
}: PillarModuleProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const card = useRef<HTMLElement>(null);
  const glints = useRisingEdge(view.complete);
  const [pressed, setPressed] = useState(false);
  const Icon = PILLAR_ICONS[view.id];
  const collapsible = view.ticks.length > MAX_VISIBLE_TICKS;
  const visible = collapsible ? view.ticks.slice(0, COLLAPSED_TICKS) : view.ticks;
  const hidden = view.ticks.length - COLLAPSED_TICKS;
  const ratio = view.ticks.length === 0 ? 'No tasks' : `${view.doneCount} of ${view.ticks.length}`;
  const badge = view.badge ?? (view.complete ? 'Done' : null);
  const fadeIn = returning ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: CONTENT_IN } : {};

  useEffect(() => {
    const element = card.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => rememberCardHeight(view.id, element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [view.id]);

  return (
    <motion.section
      animate={pressed && !reduced ? CARD_TAP : { scale: 1 }}
      aria-labelledby={titleId}
      className={cn(
        'surface-card flex min-w-0 flex-col p-4 transition-[background-color,box-shadow] duration-300 sm:p-5',
        view.complete && 'rim-positive',
        className,
      )}
      data-complete={view.complete ? 'true' : undefined}
      data-pillar={view.id}
      layoutId={`card-${view.id}`}
      ref={card}
      style={{ borderRadius: CARD_RADIUS }}
      transition={EXPAND_CLOSE}
    >
      {glints > 0 && !reduced ? <span aria-hidden="true" className="rim-glint" key={glints} /> : null}
      <p aria-live="polite" className="sr-only">
        {view.announce}
      </p>

      <div className="-m-2">
        <button
          aria-controls={`view-${view.id}`}
          aria-expanded={isOpen}
          aria-label={`Open the ${view.name} details.`}
          className="flex w-full cursor-pointer items-center gap-3 rounded-control p-2 text-left transition-colors hover:bg-hub-inset"
          data-open-target={view.id}
          onClick={onOpen}
          onPointerCancel={() => setPressed(false)}
          onPointerDown={() => setPressed(true)}
          onPointerLeave={() => setPressed(false)}
          onPointerUp={() => setPressed(false)}
          type="button"
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
              view.complete ? 'bg-hub-done-pill text-hub-positive' : 'bg-hub-chip text-hub-text',
            )}
          >
            <Icon className="size-4" strokeWidth={1.8} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <motion.span
              className="type-name inline-block w-fit truncate text-hub-text"
              id={titleId}
              layoutId={`title-${view.id}`}
              transition={EXPAND_CLOSE}
            >
              {view.name}
            </motion.span>
            <motion.span
              className="inline-flex w-fit items-baseline gap-1"
              layoutId={`number-${view.id}`}
              transition={EXPAND_CLOSE}
            >
              <motion.span
                animate={pulseKey > 0 && !reduced ? PULSE : undefined}
                className="inline-block origin-left"
                key={`pulse-${pulseKey}`}
              >
                <RollingNumber
                  className={cn('type-section transition-colors duration-300', view.complete ? 'text-hub-positive' : 'text-hub-text')}
                  format={format}
                  value={view.value}
                  whole={whole}
                />
              </motion.span>
              <span className="type-label text-hub-label">{view.unit}</span>
            </motion.span>
          </span>
          {badge ? (
            <DoneBadge className="shrink-0 self-start" />
          ) : (
            <span className="type-label num shrink-0 self-start rounded-full bg-hub-chip px-2.5 text-hub-label">{ratio}</span>
          )}
        </button>
      </div>
      {subline ? <div className="mt-2">{subline}</div> : null}

      <motion.div className="flex flex-1 flex-col" {...fadeIn}>
        {view.ticks.length === 0 ? (
          <p className="type-body mt-3 text-hub-label">{view.emptyShort}</p>
        ) : (
          <div className="mt-3">
            <ul className="-mx-2 grid gap-1">
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
                {`Show ${hidden} more`}
              </button>
            ) : null}
          </div>
        )}

        {extraRows ? <div className="-mx-2">{extraRows}</div> : null}
        {controls ? <div className="mt-auto pt-3">{controls}</div> : null}
        {view.note && view.id !== 'outreach' ? (
          <p className={cn('type-label text-right text-hub-label', controls ? 'pt-3' : 'mt-auto pt-3')}>{view.note}</p>
        ) : null}
      </motion.div>

      <div className="pt-3">
        <motion.div layoutId={`bar-${view.id}`} transition={EXPAND_CLOSE}>
          <ProgressBar
            fraction={view.fraction}
            label={view.barLabel}
            tone={view.barTone === 'complete' ? 'complete' : view.barTone === 'limit' ? 'limit' : 'primary'}
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
