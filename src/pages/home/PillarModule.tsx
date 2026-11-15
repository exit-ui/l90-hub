import { BookOpen, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { memo, useEffect, useId, useRef } from 'react';
import { DoneBadge } from '@/components/shared/DoneBadge';
import { PILLAR_ICONS } from '@/components/shared/pillarIcons';
import { PressButton } from '@/components/shared/PressButton';
import { TickRow } from '@/components/shared/TickRow';
import { useRisingEdge } from '@/hooks/useRisingEdge';
import { doneHaptic } from '@/lib/haptics';
import { COLLAPSED_TICKS, MAX_VISIBLE_TICKS, type ModuleView } from '@/lib/moduleView';
import { CARD_RADIUS, CHECK_POP, CONTENT_IN, EXPAND_CLOSE } from '@/lib/motion';
import { type ExpandId, routeHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { rememberCardHeight } from './expand/cardHeights';

interface PillarModuleProps {
  view: ModuleView;
  onToggle: (task: string) => void;
  /** Opens the expanded view of a module. */
  onOpen: (id: ExpandId) => void;
  /** True when one tick of the whole day is still open: that tap gets the peak haptic. */
  lastOfDay: boolean;
  /** Learning: cards due for review today. */
  cardsDue?: number;
  /** Trading: adds one chart check. */
  onChartCheck?: () => void;
  /** True right after its view closes: the content that is not shared fades in. */
  returning?: boolean;
}

/**
 * One tick card of the day: the icon, the name and "2 of 3" (or "Done"), then the ticks.
 * The header opens the view. A done card turns the pale done green, its icon becomes a check
 * and a green light runs once along the rim. The card never moves or reorders.
 */
function PillarModuleBase({
  view,
  onToggle,
  onOpen,
  lastOfDay,
  cardsDue = 0,
  onChartCheck,
  returning = false,
}: PillarModuleProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const card = useRef<HTMLElement>(null);
  const glints = useRisingEdge(view.complete);
  const Icon = PILLAR_ICONS[view.id];
  const collapsible = view.ticks.length > MAX_VISIBLE_TICKS;
  const visible = collapsible ? view.ticks.slice(0, COLLAPSED_TICKS) : view.ticks;
  const hidden = view.ticks.length - COLLAPSED_TICKS;
  const ratio = view.ticks.length === 0 ? null : `${view.doneCount} of ${view.ticks.length}`;
  const done = view.badge === 'Done' || view.complete;
  const fadeIn = returning ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: CONTENT_IN } : {};
  const haptic = doneHaptic(view.ticks.length - view.doneCount, lastOfDay);

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
      aria-labelledby={titleId}
      className={cn(
        'surface-card flex min-w-0 flex-col p-4 transition-[background-color,box-shadow] duration-300 sm:p-5',
        view.complete && 'rim-positive',
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
          aria-expanded={false}
          aria-label={`Open the ${view.name} details.`}
          className="flex min-h-11 w-full cursor-pointer touch-manipulation items-center gap-3 rounded-control p-2 text-left transition-[background-color,transform] duration-100 hover:bg-hub-inset active:scale-[0.985] active:bg-hub-inset"
          data-open-target={view.id}
          onClick={() => onOpen(view.id)}
          type="button"
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
              view.complete ? 'bg-hub-success text-hub-on-success' : 'bg-hub-chip text-hub-text',
            )}
          >
            {view.complete ? (
              <motion.span
                animate={{ scale: 1, rotate: 0 }}
                className="flex"
                initial={glints > 0 && !reduced ? { scale: 0.3, rotate: -30 } : false}
                key={`done-${glints}`}
                transition={CHECK_POP}
              >
                <Check className="size-4" strokeWidth={3} />
              </motion.span>
            ) : (
              <Icon className="size-4" strokeWidth={1.8} />
            )}
          </span>
          <motion.span
            className="type-name min-w-0 flex-1 truncate text-hub-text"
            id={titleId}
            layoutId={`title-${view.id}`}
            transition={EXPAND_CLOSE}
          >
            {view.name}
          </motion.span>
          {done ? (
            <DoneBadge className="shrink-0" />
          ) : ratio ? (
            <span className="type-label num shrink-0 rounded-full bg-hub-chip px-2.5 py-0.5 text-hub-label">{ratio}</span>
          ) : null}
        </button>
      </div>

      <motion.div className="flex flex-1 flex-col" {...fadeIn}>
        {view.ticks.length === 0 ? (
          cardsDue > 0 || onChartCheck ? null : <p className="type-body mt-3 text-hub-label">{view.emptyShort}</p>
        ) : (
          <div className="mt-3">
            <ul className="-mx-2 grid gap-1">
              {visible.map((tick) => (
                <li key={tick.task}>
                  <TickRow
                    action={tick.action}
                    cue={tick.cue}
                    done={tick.done}
                    doneHaptic={haptic}
                    isNext={tick.isNext}
                    onToggle={onToggle}
                    task={tick.task}
                  />
                </li>
              ))}
            </ul>
            {collapsible ? (
              <button
                className="tap press type-label -ml-2 mt-1 inline-flex cursor-pointer items-center rounded-full px-2 text-hub-label-strong hover:text-hub-text"
                onClick={() => onOpen(view.id)}
                type="button"
              >
                {`Show ${hidden} more`}
              </button>
            ) : null}
          </div>
        )}

        {cardsDue > 0 ? (
          <a
            className="type-body -mx-2 mt-2 flex min-h-11 items-center gap-3 rounded-control px-2 text-hub-text no-underline hover:bg-hub-inset active:bg-hub-inset"
            href={routeHref('learning', 'cards')}
          >
            <BookOpen aria-hidden="true" className="size-4 shrink-0 text-hub-label" />
            Review {cardsDue} {cardsDue === 1 ? 'card' : 'cards'}
          </a>
        ) : null}
        {onChartCheck ? (
          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            <span className="type-label text-hub-label">{view.note ?? ''}</span>
            <PressButton aria-label={`Add 1 chart check. ${view.note ?? ''}`} className="px-3" onClick={onChartCheck} tone="secondary">
              +1 check
            </PressButton>
          </div>
        ) : null}
      </motion.div>
    </motion.section>
  );
}

/** A view with the same content. A tick on another card does not draw this card again. */
function sameView(before: ModuleView, after: ModuleView): boolean {
  return before === after || JSON.stringify(before) === JSON.stringify(after);
}

export const PillarModule = memo(
  PillarModuleBase,
  (before, after) =>
    before.onToggle === after.onToggle &&
    before.onOpen === after.onOpen &&
    before.onChartCheck === after.onChartCheck &&
    before.lastOfDay === after.lastOfDay &&
    before.cardsDue === after.cardsDue &&
    before.returning === after.returning &&
    sameView(before.view, after.view),
);
