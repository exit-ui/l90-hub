import { ArrowRight, Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { memo, useEffect, useRef, useState } from 'react';
import { TimerButton } from '@/components/focus/TimerButton';
import { Burst } from '@/components/shared/Burst';
import { PillarGlyph } from '@/components/shared/PillarGlyph';
import { doneHaptic, haptic } from '@/lib/haptics';
import type { ModuleView } from '@/lib/moduleView';
import { CHECK_POP, FADE } from '@/lib/motion';
import type { PillarId } from '@/lib/pillars';
import { pulse } from '@/lib/pulse';
import { routeHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { isSampleMode } from '@/store/sample';

/** How long a ticked row or card stays, checked, before it leaves. The store is written at once. */
const LEAVE_MS = 300;

interface TodoItem {
  task: string;
  action: string;
  cue: string | null;
  pillar: PillarId;
  done: boolean;
  isNext: boolean;
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
    module.ticks.map((tick) => ({
      task: tick.task,
      action: tick.action,
      cue: tick.cue,
      pillar: module.id,
      done: tick.done,
      isNext: tick.isNext,
    })),
  );
}

/** The arc is a half circle of radius 64 in a 168 × 96 box. The dot sits on the arc at the value. */
function arcDot(percent: number): string {
  const angle = Math.PI * (1 - percent / 100);
  return `translate(${(84 + 64 * Math.cos(angle)).toFixed(1)}px, ${(84 - 64 * Math.sin(angle)).toFixed(1)}px)`;
}

/** "Day clear": an arc that fills as the ticks of the day are done, with a dot at its end. */
function DayArc({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? (done / total) * 100 : 0;
  return (
    <section aria-label="Day progress" className="glass-lime flex h-47 flex-col justify-between p-4">
      <span className="type-label font-semibold text-white">Day clear</span>
      <svg aria-label={`${done} of ${total} ticks done today`} className="w-full" role="img" viewBox="0 0 168 96">
        <path d="M 20 84 A 64 64 0 0 1 148 84" fill="none" stroke="rgb(255 255 255 / 0.14)" strokeLinecap="round" strokeWidth="11" />
        <path
          className="arc-fill"
          d="M 20 84 A 64 64 0 0 1 148 84"
          fill="none"
          pathLength="100"
          stroke="#c6f68d"
          strokeLinecap="round"
          strokeWidth="11"
          style={{ strokeDasharray: `${percent} 100` }}
        />
        <circle className="arc-dot" cx="0" cy="0" fill="rgb(198 246 141 / 0.25)" r="12" style={{ transform: arcDot(percent) }} />
        <circle className="arc-dot" cx="0" cy="0" fill="#ffffff" r="6.5" style={{ transform: arcDot(percent) }} />
      </svg>
      <p className="num">
        <span className="text-[26px] font-bold tracking-tight text-white">{done}</span>
        <span className="type-body text-white/75"> of {total} ticks</span>
      </p>
    </section>
  );
}

/**
 * Today's tasks (v4), ranked by importance. The Up next card holds the one task to do now, with one check.
 * Beside it the Day-clear arc. Below, "Later today" holds the rest, each with a ring in its pillar's colour.
 * A tap saves the tick at once; the card or row shows its check and a burst, then leaves. Nothing is crossed out.
 * "N done" shows the finished ticks, where a tap undoes one. When nothing is left, the "All clear" card offers "Sign off".
 */
function TodoListBase({ modules, onToggle, cardsDue, signedOff, onSignOff, onOpenSignOff }: TodoListProps) {
  const reduced = useReducedMotion();
  const items = itemsOf(modules);
  const [leaving, setLeaving] = useState<readonly string[]>([]);
  const [leavingNext, setLeavingNext] = useState<TodoItem | null>(null);
  // The sample data opens the done list so the demo shows all of it; the real app keeps it folded.
  const [showDone, setShowDone] = useState(isSampleMode);
  const list = useRef<HTMLUListElement>(null);
  const focusAfter = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  const undone = items.filter((item) => !item.done);
  const computedNext = undone.find((item) => item.isNext) ?? undone[0] ?? null;
  // The card keeps the task you just ticked until it has left; then the next one arrives.
  const next = leavingNext ?? computedNext;
  const later = items.filter((item) => (!item.done || leaving.includes(item.task)) && item.task !== next?.task);
  const done = items.filter((item) => item.done && !leaving.includes(item.task) && item.task !== leavingNext?.task);
  const left = undone.length;
  const total = items.length;
  const allClear = total > 0 && left === 0 && leaving.length === 0 && leavingNext === null;

  // A keyboard tick moves the focus to the row that takes the place of the one that left.
  useEffect(() => {
    if (focusAfter.current === null) {
      return;
    }
    const rows = list.current?.querySelectorAll<HTMLButtonElement>('button[data-todo]');
    const target = rows?.[Math.min(focusAfter.current, (rows?.length ?? 1) - 1)];
    focusAfter.current = null;
    target?.focus({ preventScroll: true });
  }, [later.length]);

  const tick = (item: TodoItem, index: number, keyboard: boolean) => {
    if (leaving.includes(item.task) || leavingNext !== null) {
      return;
    }
    const openInCard = items.filter((other) => other.pillar === item.pillar && !other.done).length;
    haptic(doneHaptic(openInCard, left === 1));
    pulse();
    const isCard = item.task === next?.task;
    if (isCard) {
      setLeavingNext(item);
    } else {
      setLeaving((current) => [...current, item.task]);
    }
    onToggle(item.task);
    const timer = window.setTimeout(() => {
      if (keyboard && !isCard) {
        focusAfter.current = index;
      }
      if (isCard) {
        setLeavingNext(null);
      } else {
        setLeaving((current) => current.filter((task) => task !== item.task));
      }
    }, reduced ? 0 : LEAVE_MS);
    timers.current.push(timer);
  };

  return (
    <section aria-labelledby="todo-title" className="mb-8 grid gap-3">
      <h2 className="sr-only" id="todo-title">
        Today's tasks
      </h2>

      {total === 0 ? (
        <p className="type-body px-1 text-hub-label">Nothing to tick today.</p>
      ) : (
        <div className="grid grid-cols-[1.12fr_1fr] gap-3">
          {next ? (
            <section
              aria-label="Up next"
              className={cn('pillar-card flex h-47 flex-col justify-between p-4', `pillar-${next.pillar}`, leavingNext ? 'un-out' : 'un-in')}
              key={next.task}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="type-label font-semibold text-white">Up next</span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                  <PillarGlyph delayMs={300} id={next.pillar} play={1} size={22} />
                </span>
              </div>
              <div className="min-w-0">
                <p className="line-clamp-3 text-[21px] leading-6.5 font-bold tracking-tight text-white">{next.action}</p>
                {next.cue ? <p className="type-label mt-1 truncate text-white/80">{next.cue}</p> : null}
              </div>
              <div className="relative flex items-center justify-between">
                <TimerButton task={next.task} variant="card" />
                {leavingNext ? (
                  <span aria-hidden="true" className="pointer-events-none absolute right-6 bottom-6">
                    <Burst />
                  </span>
                ) : null}
                <button
                  aria-label={`${next.task}. Mark as done.`}
                  className="press flex size-12 cursor-pointer touch-manipulation items-center justify-center rounded-full bg-white text-[#0a0b10]"
                  onClick={(event) => tick(next, 0, event.detail === 0)}
                  type="button"
                >
                  <Check aria-hidden="true" className="size-5.5" strokeWidth={3} />
                </button>
              </div>
            </section>
          ) : allClear ? (
            <section aria-label="All clear" className="pillar-card pillar-outreach un-in flex h-47 flex-col justify-between p-4">
              <span className="type-label font-semibold text-white">{signedOff ? 'Day signed off' : 'All clear'}</span>
              <div>
                <p className="text-2xl leading-7 font-bold tracking-tight text-white">{signedOff ? 'See you tomorrow' : 'Every tick is done'}</p>
                <p className="type-label mt-1 text-white/80">{signedOff ? 'Rest. The next day starts fresh.' : 'Sign off to close the day.'}</p>
              </div>
              {signedOff ? null : (
                <button
                  className="press h-11.5 cursor-pointer rounded-full bg-white type-body font-bold text-[#0b2e1b]"
                  onClick={onSignOff}
                  type="button"
                >
                  Sign off
                </button>
              )}
            </section>
          ) : (
            <div aria-hidden="true" className="h-47" />
          )}
          <DayArc done={total - left} total={total} />
        </div>
      )}

      <div className="mt-1 flex items-center justify-between gap-3">
        <h3 className="type-section text-hub-text">{later.length > 0 || cardsDue > 0 ? 'Later today' : 'Today'}</h3>
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

      {later.length > 0 || cardsDue > 0 ? (
        <div className="surface-card p-1.5">
          <ul className="grid" ref={list}>
            <AnimatePresence initial={false}>
              {later.map((item, index) => {
                const isLeaving = leaving.includes(item.task);
                return (
                  <motion.li
                    className={cn('flex items-center overflow-hidden', `tone-${item.pillar}`)}
                    exit={reduced ? { opacity: 0, transition: FADE } : { opacity: 0, x: 28, height: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
                    key={item.task}
                  >
                    <button
                      aria-label={`${item.task}. Mark as done.`}
                      className="relative flex min-h-14 min-w-0 flex-1 cursor-pointer touch-manipulation items-center gap-4 rounded-[18px] px-3 py-2 text-left transition-[background-color,transform] duration-100 active:scale-[0.985] active:bg-hub-inset"
                      data-todo
                      onClick={(event) => tick(item, index, event.detail === 0)}
                      type="button"
                    >
                      <span aria-hidden="true" className="flex size-10.5 shrink-0 items-center justify-center rounded-[14px] bg-[var(--soft)]">
                        <PillarGlyph className="[&_path]:stroke-[var(--solid)]" id={item.pillar} size={20} />
                      </span>
                      <span aria-hidden="true" className="min-w-0 flex-1">
                        <span className="type-body line-clamp-2 font-medium text-hub-text">{item.action}</span>
                        {item.cue ? <span className="type-label block truncate text-hub-label">{item.cue}</span> : null}
                      </span>
                      <span aria-hidden="true" className="relative flex size-7 shrink-0 items-center justify-center">
                        {isLeaving ? (
                          <>
                            <Burst />
                            <motion.span
                              animate={{ scale: 1 }}
                              className="flex size-7 items-center justify-center rounded-full bg-hub-success text-hub-on-success"
                              initial={reduced ? false : { scale: 0.3 }}
                              transition={CHECK_POP}
                            >
                              <Check className="size-4" strokeWidth={3} />
                            </motion.span>
                          </>
                        ) : (
                          <span className="size-7 rounded-full border-2 border-[var(--solid)]" />
                        )}
                      </span>
                    </button>
                    <TimerButton task={item.task} variant="row" />
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
                  <span aria-hidden="true" className="flex size-10.5 shrink-0 items-center justify-center rounded-[14px] bg-[var(--soft)]">
                    <ArrowRight className="size-5 text-hub-text" />
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
