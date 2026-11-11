import { buzz } from '@/lib/haptics';
import { BookOpen, CircleCheck, Flame } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Notice } from '@/components/shared/Notice';
import { PressButton } from '@/components/shared/PressButton';
import { ProgressChart } from '@/components/shared/ProgressChart';
import { useNow } from '@/hooks/useNow';
import { CHECK_SPRING, FADE } from '@/lib/motion';
import { useRoute } from '@/hooks/useRoute';
import { useToday } from '@/hooks/useToday';
import { formatLong, formatWeekdayShort } from '@/lib/dates';
import { formatR, toRoman } from '@/lib/format';
import { missionHeadline } from '@/lib/homeText';
import { type ModuleView, momentumText, type TodayView, todayView } from '@/lib/moduleView';
import { missionClock } from '@/lib/phases';
import type { PillarId } from '@/lib/pillars';
import { closeAction, type ExpandId, expandedFrom, routeHref } from '@/lib/routes';
import type { Momentum } from '@/lib/streak';
import { signOffHeadline } from '@/lib/signoff';
import { lineForDay } from '@/lib/summary';
import { cn } from '@/lib/utils';
import { levelProgress, totalXp } from '@/lib/xp';
import { useHub, useHubActions } from '@/store/useHub';
import { OutreachControls } from './OutreachControls';
import { PillarModule } from './PillarModule';
import { cardHeight } from './expand/cardHeights';
import { ExpandedLayer, type ViewEntry } from './expand/ExpandedLayer';
import { PillarView, ProgressView, SignOffView, ViewTitle } from './expand/views';

/** The grid cell of each module at 390 px, 768 px and 1280 px. */
const CELLS: Readonly<Record<PillarId, string>> = {
  outreach: 'col-span-2 md:col-span-2 md:row-span-2 lg:col-span-6 lg:row-span-2',
  fitness: 'col-span-1 lg:col-span-3',
  learning: 'col-span-1 lg:col-span-3',
  reading: 'col-span-1 lg:col-span-3',
  trading: 'col-span-1 lg:col-span-3',
  signoff: 'col-span-2 md:col-span-4 lg:col-span-4 lg:col-start-9 lg:row-start-3 lg:self-start',
};

function Chip({ href, children, label }: { href: string; children: string; label: string }) {
  return (
    <a
      aria-label={label}
      className="press inline-flex min-h-11 items-center rounded-full bg-hub-material px-3 type-label font-semibold text-hub-label-strong no-underline rim-hairline hover:text-hub-text"
      href={href}
    >
      {children}
    </a>
  );
}

/** The momentum chip: days on target and the streak state. A tap opens Progress. */
function MomentumChip({ momentum, className }: { momentum: Momentum; className?: string }) {
  const text = momentumText(momentum);
  return (
    <a
      className={cn(
        'press min-h-11 items-center gap-2 rounded-full bg-hub-material px-3 type-label font-semibold text-hub-label-strong no-underline rim-hairline hover:text-hub-text',
        className,
      )}
      href={routeHref('progress')}
    >
      <Flame aria-hidden="true" className="size-4 text-hub-amber" />
      {text.lead}
      {text.detail ? (
        <>
          <span aria-hidden="true" className="text-hub-label">
            ·
          </span>
          <span className={cn(text.recover && 'text-hub-amber')}>{text.detail}</span>
        </>
      ) : null}
    </a>
  );
}

/** The DMs of the last 7 days. It fills the tall Outreach module on a wide screen. */
function WeekStrip({ days }: { days: TodayView['recentDms'] }) {
  return (
    <figure className="mt-4 hidden px-2 lg:block">
      <figcaption className="type-label text-hub-label">Last 7 days</figcaption>
      <ol className="mt-2 grid h-20 grid-cols-7 items-end gap-2">
        {days.map((day) => (
          <li className="flex h-full flex-col items-center justify-end gap-1" key={day.date}>
            <span className="type-label num text-hub-label-strong">{day.value}</span>
            <span
              aria-hidden="true"
              className={cn('w-full rounded-xs', day.isToday ? 'bg-hub-bar-fill' : 'bg-hub-track')}
              style={{ height: day.barPx }}
            />
            <span className={cn('type-label', day.isToday ? 'text-hub-text' : 'text-hub-label')}>
              {formatWeekdayShort(day.date)}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** One calm green line when every module is done. It comes in one time. */
function CompleteLine() {
  const reduced = useReducedMotion();
  return (
    <motion.p
      animate={{ opacity: 1, y: 0 }}
      className="type-body mb-8 flex items-center gap-3 rounded-card px-4 py-3 text-hub-positive surface-card rim-positive"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      role="status"
      transition={reduced ? FADE : CHECK_SPRING}
    >
      <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
      All modules are done today. Rest and come back tomorrow.
    </motion.p>
  );
}

function signedR(value: number): string {
  return formatR(value).replace(/R$/, '');
}

const CHART_CELL = 'col-span-2 md:col-span-4 lg:col-span-8 lg:col-start-1 lg:row-start-3';

const VIEW_TITLES: Readonly<Record<ExpandId, string>> = {
  outreach: 'Outreach',
  fitness: 'Fitness',
  learning: 'Learning',
  reading: 'Reading',
  trading: 'Trading',
  signoff: 'Sign-off',
  progress: 'Progress',
};

/** True when the card of the id is on the screen now, so it can fly into its view. */
function cardInView(id: ExpandId): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const card = document.querySelector(`[data-open-target="${id}"]`);
  if (!card) {
    return false;
  }
  const box = card.getBoundingClientRect();
  return box.bottom > 0 && box.top < window.innerHeight;
}

/**
 * Today: one grid of pillar modules with the ticks of the day, then the motion chart.
 * Each card opens into its expanded view with one continuous motion (spec 10).
 * +1 DM is the one white filled button until all other modules are complete.
 */
export function HomePage() {
  const today = useToday();
  const now = useNow();
  const state = useHub();
  const route = useRoute();
  const reduced = useReducedMotion();
  const { toggleTask, addChartCheck, signOffDay } = useHubActions();
  const expanded = expandedFrom(route);
  const openedByPush = useRef(false);
  const [entry, setEntry] = useState<ViewEntry>(() => (expanded ? 'fade' : 'shared'));
  const [seen, setSeen] = useState<ExpandId | null>(expanded);
  const [returning, setReturning] = useState<ExpandId | null>(null);
  const [tapped, setTapped] = useState<ExpandId | null>(null);

  // The view changed without a tap (Back, Forward, a typed hash): fly only when the card is on screen.
  if (seen !== expanded) {
    setSeen(expanded);
    if (seen !== null && expanded === null) {
      setReturning(seen);
    }
    if (expanded !== null && tapped !== expanded) {
      setEntry(!reduced && cardInView(expanded) ? 'shared' : 'fade');
    }
    setTapped(null);
  }

  const view = useMemo(() => todayView(state, today, now), [state, today, now]);
  const clock = useMemo(() => missionClock(today, state.startDate), [today, state.startDate]);
  const level = useMemo(() => levelProgress(totalXp(state)).level, [state]);
  const line = lineForDay(clock.day);
  const dm = state.days[today]?.dm ?? 0;
  // The number pulses one time when the DMs reach the target.
  const pulse = state.dmTarget > 0 && dm >= state.dmTarget ? 1 : 0;
  const signOffPrimary = view.othersComplete && !view.signedOff;
  const headline = signOffHeadline(clock.stage === 'active' ? clock.day : null, view.ticksDone, view.ticksTotal);

  const open = (id: ExpandId) => {
    const hash = routeHref('home', id);
    if (window.location.hash === hash) {
      return;
    }
    setTapped(id);
    setEntry(reduced ? 'fade' : 'shared');
    openedByPush.current = true;
    window.location.hash = hash.slice(1);
  };

  const close = useCallback(() => {
    const action = closeAction(openedByPush.current);
    openedByPush.current = false;
    if (action === 'back') {
      window.history.back();
      return;
    }
    const { pathname, search } = window.location;
    window.history.replaceState(null, '', `${pathname}${search}${routeHref('home')}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, []);

  const signOffNow = () => {
    signOffDay(today);
    buzz();
    open('signoff');
  };

  const placeholder = (id: ExpandId, className: string) => (
    <div
      aria-hidden="true"
      className={cn('surface-card opacity-0', className)}
      key={id}
      style={{ height: cardHeight(id) }}
    />
  );

  const renderModule = (module: ModuleView) => {
    const className = CELLS[module.id];
    if (module.id === expanded) {
      return placeholder(module.id, className);
    }
    const common = {
      className,
      isOpen: false,
      onOpen: () => open(module.id),
      onToggle: (task: string) => toggleTask(today, task),
      returning: returning === module.id,
      view: module,
    };
    switch (module.id) {
      case 'outreach':
        return (
          <PillarModule
            {...common}
            beside={<OutreachControls date={today} primary={!signOffPrimary} />}
            subline={<p className="type-body text-hub-label-strong">{module.note}</p>}
            extraRows={<WeekStrip days={view.recentDms} />}
            hero
            key={module.id}
            pulseKey={pulse}
          />
        );
      case 'learning':
        return (
          <PillarModule
            {...common}
            extraRows={
              view.cardsDue > 0 ? (
                <a
                  className="type-body mt-1 flex min-h-11 items-center gap-3 rounded-control px-2 text-hub-text no-underline hover:bg-hub-inset"
                  href={routeHref('learning', 'cards')}
                >
                  <BookOpen aria-hidden="true" className="size-4 shrink-0 text-hub-label" />
                  Review {view.cardsDue} {view.cardsDue === 1 ? 'card' : 'cards'}
                </a>
              ) : null
            }
            key={module.id}
          />
        );
      case 'trading':
        return (
          <PillarModule
            {...common}
            controls={
              <PressButton
                aria-label={`Add 1 chart check. ${module.note ?? ''}`}
                className="px-3"
                onClick={() => addChartCheck(today)}
                tone="secondary"
              >
                +1 check
              </PressButton>
            }
            format={signedR}
            key={module.id}
            whole={false}
          />
        );
      case 'signoff':
        return (
          <PillarModule
            {...common}
            beside={
              view.signedOff ? null : (
                <PressButton className="px-3" onClick={signOffNow} tone={signOffPrimary ? 'primary' : 'secondary'}>
                  Sign off
                </PressButton>
              )
            }
            key={module.id}
          />
        );
      default:
        return <PillarModule {...common} key={module.id} />;
    }
  };

  const expandedModule = expanded ? view.modules.find((module) => module.id === expanded) : undefined;
  const titleId = expanded ? `view-title-${expanded}` : '';

  return (
    <>
      <header className="mb-8 md:mb-12">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 lg:flex lg:items-end lg:gap-8">
            <div className="shrink-0">
              <p className="type-label text-hub-label">{formatLong(today)}</p>
              <h1 className="type-title mt-1 text-hub-text">{missionHeadline(clock)}</h1>
            </div>
            <p className="type-line hidden max-w-prose text-hub-label-strong lg:line-clamp-2">{line.text}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <MomentumChip className="hidden lg:inline-flex" momentum={view.momentum} />
            <Chip
              href={routeHref('progress')}
              label={`Level ${level}${clock.phase ? `, phase ${clock.phase}` : ''}. Open Progress.`}
            >
              {`Lv ${level} · ${clock.phase ? `Phase ${toRoman(clock.phase)}` : clock.stage === 'before' ? 'Soon' : 'Review'}`}
            </Chip>
          </div>
        </div>
        <p className="type-line mt-2 line-clamp-2 max-w-prose text-hub-label-strong lg:hidden">{line.text}</p>
        <MomentumChip className="mt-2 inline-flex lg:hidden" momentum={view.momentum} />
      </header>

      {view.momentum.state === 'recover' ? (
        <Notice announce={false} className="mb-8" kind="NOTE">
          You missed yesterday. Send the DMs today to keep the streak.
        </Notice>
      ) : null}

      {view.allComplete ? <CompleteLine /> : null}

      <LayoutGroup id="today">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-12">
          {view.modules.map(renderModule)}
          {expanded === 'progress' ? (
            placeholder('progress', CHART_CELL)
          ) : (
            <ProgressChart
              className={CHART_CELL}
              maxInsights={1}
              onOpen={() => open('progress')}
              today={today}
              variant="compact"
            />
          )}
        </div>

        <AnimatePresence>
          {expanded ? (
            <ExpandedLayer
              entry={entry}
              id={expanded}
              key={expanded}
              onClose={close}
              title={
                <ViewTitle id={expanded} titleId={titleId}>
                  {VIEW_TITLES[expanded]}
                </ViewTitle>
              }
              titleId={titleId}
            >
              {expanded === 'progress' ? (
                <ProgressView today={today} />
              ) : expanded === 'signoff' && expandedModule ? (
                <SignOffView
                  headline={headline}
                  module={expandedModule}
                  onSignOff={() => signOffDay(today)}
                  onToggle={(task) => toggleTask(today, task)}
                  signedOff={view.signedOff}
                  today={today}
                />
              ) : expandedModule ? (
                <PillarView
                  cardsDue={view.cardsDue}
                  format={expandedModule.id === 'trading' ? signedR : undefined}
                  module={expandedModule}
                  onToggle={(task) => toggleTask(today, task)}
                  today={today}
                  whole={expandedModule.id !== 'trading'}
                />
              ) : null}
            </ExpandedLayer>
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
    </>
  );
}
