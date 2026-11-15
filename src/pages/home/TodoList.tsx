import { ArrowRight, Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { memo, useEffect, useRef, useState } from 'react';
import { Burst } from '@/components/shared/Burst';
import { PillarGlyph } from '@/components/shared/PillarGlyph';
import { doneHaptic, haptic } from '@/lib/haptics';
import type { ModuleView } from '@/lib/moduleView';
import { CHECK_POP, FADE } from '@/lib/motion';
import type { PillarId } from '@/lib/pillars';
import { routeHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

/** How long a ticked row stays, checked, before it leaves the list. The store is written at once. */
const LEAVE_MS = 300;

interface TodoItem {
  task: string;
  action: string;
  cue: string | null;
  pillar: PillarId;
  done: boolean;
}

interface TodoListProps {
  modules: readonly ModuleView[];
  onToggle: (task: string) => void;
  /** Learning: cards due for review today. A link row at the end of the list. */
  cardsDue: number;
  signedOff: boolean;
  onSignOff: () => void;
  /** Opens the Sign-off view. */
  onOpenSignOff: () => void;
}

function itemsOf(modules: readonly ModuleView[]): TodoItem[] {
  return modules.flatMap((module) =>
    module.ticks.map((tick) => ({ task: tick.task, action: tick.action, cue: tick.cue, pillar: module.id, done: tick.done })),
  );
}

/**
 * "To do" (v3): every tick of the day in one list, in pillar order, each with a ring in its pillar's colour.
 * A tap saves the tick at once; the row shows its check for a moment and then slides away.
 * "N done" shows the finished rows, where a tap undoes one. When nothing is left, the green
 * "All clear" card offers "Sign off".
 */
function TodoListBase({ modules, onToggle, cardsDue, signedOff, onSignOff, onOpenSignOff }: TodoListProps) {
  const reduced = useReducedMotion();
  const items = itemsOf(modules);
  const [leaving, setLeaving] = useState<readonly string[]>([]);
  const [showDone, setShowDone] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const focusAfter = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  const open = items.filter((item) => !item.done || leaving.includes(item.task));
  const done = items.filter((item) => item.done && !leaving.includes(item.task));
  const left = items.filter((item) => !item.done).length;
  const total = items.length;
  const allClear = total > 0 && left === 0 && leaving.length === 0;

  // A keyboard tick moves the focus to the row that takes the place of the one that left.
  useEffect(() => {
    if (focusAfter.current === null) {
      return;
    }
    const rows = list.current?.querySelectorAll<HTMLButtonElement>('button[data-todo]');
    const target = rows?.[Math.min(focusAfter.current, (rows?.length ?? 1) - 1)];
    focusAfter.current = null;
    target?.focus({ preventScroll: true });
  }, [open.length]);

  const tick = (item: TodoItem, index: number, keyboard: boolean) => {
    if (leaving.includes(item.task)) {
      return;
    }
    const openInCard = items.filter((other) => other.pillar === item.pillar && !other.done).length;
    haptic(doneHaptic(openInCard, left === 1));
    setLeaving((current) => [...current, item.task]);
    onToggle(item.task);
    const timer = window.setTimeout(() => {
      if (keyboard) {
        focusAfter.current = index;
      }
      setLeaving((current) => current.filter((task) => task !== item.task));
    }, reduced ? 0 : LEAVE_MS);
    timers.current.push(timer);
  };

  return (
    <section aria-labelledby="todo-title" className="mb-8 grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="type-section text-hub-text" id="todo-title">
          To do
        </h2>
        <div className="flex items-center gap-2">
          <span aria-live="polite" className="type-label num rounded-full bg-hub-surface px-3 py-1 font-semibold text-hub-text">
            {total === 0 ? 'Free day' : left === 0 ? 'All done' : `${left} left`}
          </span>
          <button
            aria-label="Open Sign-off"
            className="pillar-signoff press flex size-11 cursor-pointer items-center justify-center rounded-full"
            data-open-target="signoff"
            onClick={onOpenSignOff}
            type="button"
          >
            <PillarGlyph id="signoff" size={20} />
          </button>
        </div>
      </div>

      {open.length > 0 || cardsDue > 0 ? (
        <div className="surface-card p-1.5">
          <ul className="grid" ref={list}>
            <AnimatePresence initial={false}>
              {open.map((item, index) => {
                const isLeaving = leaving.includes(item.task);
                return (
                  <motion.li
                    className={cn('overflow-hidden', `tone-${item.pillar}`)}
                    exit={reduced ? { opacity: 0, transition: FADE } : { opacity: 0, x: 28, height: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
                    key={item.task}
                  >
                    <button
                      aria-label={`${item.task}. Mark as done.`}
                      className="relative flex min-h-14 w-full cursor-pointer touch-manipulation items-center gap-4 rounded-[18px] px-3 py-2 text-left transition-[background-color,transform] duration-100 active:scale-[0.985] active:bg-hub-inset"
                      data-todo
                      onClick={(event) => tick(item, index, event.detail === 0)}
                      type="button"
                    >
                      <span aria-hidden="true" className="relative flex size-[26px] shrink-0 items-center justify-center">
                        {isLeaving ? (
                          <>
                            <Burst />
                            <motion.span
                              animate={{ scale: 1 }}
                              className="flex size-[26px] items-center justify-center rounded-full bg-hub-success text-hub-on-success"
                              initial={reduced ? false : { scale: 0.3 }}
                              transition={CHECK_POP}
                            >
                              <Check className="size-4" strokeWidth={3} />
                            </motion.span>
                          </>
                        ) : (
                          <span className="size-[26px] rounded-full border-2 border-[var(--solid)]" />
                        )}
                      </span>
                      <span aria-hidden="true" className="min-w-0 flex-1">
                        <span className="type-body line-clamp-2 font-medium text-hub-text">{item.action}</span>
                        {item.cue ? <span className="type-label block truncate text-hub-label">{item.cue}</span> : null}
                      </span>
                      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[var(--solid)]" />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {cardsDue > 0 ? (
              <li className="tone-learning">
                <a
                  className="flex min-h-14 items-center gap-4 rounded-[18px] px-3 py-2 text-hub-text no-underline active:bg-hub-inset"
                  href={routeHref('learning', 'cards')}
                >
                  <span aria-hidden="true" className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[var(--soft)]">
                    <ArrowRight className="size-4 text-hub-text" />
                  </span>
                  <span className="type-body flex-1 font-medium">
                    Review {cardsDue} {cardsDue === 1 ? 'card' : 'cards'}
                  </span>
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <AnimatePresence>
        {allClear ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="pillar-card pillar-outreach flex items-center justify-between gap-3 p-5"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            key="clear"
            transition={reduced ? FADE : CHECK_POP}
          >
            <div className="min-w-0">
              <p className="type-section text-white">{signedOff ? 'Day signed off' : 'All clear'}</p>
              <p className="type-label text-white">{signedOff ? 'See you tomorrow.' : 'Every tick is done.'}</p>
            </div>
            {signedOff ? null : (
              <button
                className="press h-11 shrink-0 cursor-pointer rounded-full bg-white px-5 type-body font-bold text-[#0b2e1b]"
                onClick={onSignOff}
                type="button"
              >
                Sign off
              </button>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {total === 0 ? <p className="type-body px-1 text-hub-label">Nothing to tick today.</p> : null}

      {done.length > 0 ? (
        <div className="grid">
          <button
            aria-expanded={showDone}
            className="min-h-11 w-fit cursor-pointer px-1 type-label font-semibold text-hub-label hover:text-hub-text"
            onClick={() => setShowDone((value) => !value)}
            type="button"
          >
            {showDone ? 'Hide done' : `${done.length} done`}
          </button>
          {showDone ? (
            <ul className="grid">
              {done.map((item) => (
                <li key={item.task}>
                  <button
                    aria-label={`${item.task}. Done. Tap to undo.`}
                    className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-1 text-left text-hub-label hover:text-hub-text"
                    onClick={() => onToggle(item.task)}
                    type="button"
                  >
                    <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-hub-done-pill text-hub-positive">
                      <Check className="size-3" strokeWidth={3.4} />
                    </span>
                    <span aria-hidden="true" className="type-body truncate">
                      {item.action}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export const TodoList = memo(TodoListBase);
