import { BookOpen, CircleCheck, Flame, UserRound } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Wordmark } from '@/components/shared/Brand';
import { DmButtons } from '@/components/shared/DmControls';
import { Notice } from '@/components/shared/Notice';
import { PressButton } from '@/components/shared/PressButton';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { ProgressChart } from '@/components/shared/ProgressChart';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { useNow } from '@/hooks/useNow';
import { useRoute } from '@/hooks/useRoute';
import { useToday } from '@/hooks/useToday';
import { formatLong } from '@/lib/dates';
import { formatR, toRoman } from '@/lib/format';
import { buzz } from '@/lib/haptics';
import { missionHeadline } from '@/lib/homeText';
import { type ModuleView, momentumShort, todayView } from '@/lib/moduleView';
import { CHECK_SPRING, FADE, PULSE } from '@/lib/motion';
import { MISSION_DAYS, missionClock } from '@/lib/phases';
import { pillarCards } from '@/lib/pillarCards';
import type { PillarId } from '@/lib/pillars';
import { closeAction, type ExpandId, expandedFrom, routeHref } from '@/lib/routes';
import type { Momentum } from '@/lib/streak';
import { signOffHeadline } from '@/lib/signoff';
import { lineForDay } from '@/lib/summary';
import { cn } from '@/lib/utils';
import { levelProgress, totalXp } from '@/lib/xp';
import { useHub, useHubActions } from '@/store/useHub';
import { cardHeight } from './expand/cardHeights';
import { ExpandedLayer, type ViewEntry } from './expand/ExpandedLayer';
import { PillarView, ProgressView, SignOffView, ViewTitle } from './expand/views';
import { InstallHint } from './InstallHint';
import { PillarCards } from './PillarCards';
import { PillarModule } from './PillarModule';
import { SignOffCard } from './SignOffCard';

/** The tick cards of the day, in pillar order. Sign-off has its own card below them. */
const TICK_PILLARS: readonly PillarId[] = ['outreach', 'fitness', 'learning', 'reading', 'trading'];

/** The momentum chip: a flame and one number. The label holds all the words. A tap opens Progress. */
function MomentumChip({ momentum }: { momentum: Momentum }) {
  const text = momentumShort(momentum);
  return (
    <a
      aria-label={text.label}
      className="press inline-flex min-h-11 items-center gap-1 rounded-full bg-hub-surface px-3 type-label font-semibold text-hub-label-strong no-underline rim-hairline hover:text-hub-text"
      href={routeHref('progress')}
    >
      <Flame aria-hidden="true" className="size-4 text-hub-amber" />
      <span className={cn('num', text.recover && 'text-hub-amber')}>{text.text}</span>
    </a>
  );
}

/** One calm green line when every module is done. It comes in one time. */
function CompleteLine() {
  const reduced = useReducedMotion();
  return (
    <motion.p
      animate={{ opacity: 1, y: 0 }}
      className="type-body rim-positive mb-8 flex items-center gap-3 rounded-card px-4 py-3 text-hub-positive"
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

/** "Day XXIV of XC · Phase 2" while the mission runs; the plain headline before and after it. */
function dayCaption(clock: ReturnType<typeof missionClock>): { text: string; label: string } {
  if (clock.stage !== 'active') {
    const text = missionHeadline(clock);
    return { text, label: text };
  }
  const phase = clock.phase ? ` · Phase ${clock.phase}` : '';
  return {
    text: `Day ${toRoman(clock.day)} of ${toRoman(MISSION_DAYS)}${phase}`,
    label: `Day ${clock.day} of ${MISSION_DAYS}${clock.phase ? `, phase ${clock.phase}` : ''}`,
  };
}

/**
 * Today: the DM count of the day, the pillar cards, the tick cards of the day, "Sign off the day"
 * and the progress chart. Each tick card opens into its expanded view with one continuous motion (spec 10).
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
  const cards = useMemo(() => pillarCards(state, today), [state, today]);
  const clock = useMemo(() => missionClock(today, state.startDate), [today, state.startDate]);
  const level = useMemo(() => levelProgress(totalXp(state)).level, [state]);
  const line = lineForDay(clock.day);
  const caption = dayCaption(clock);
  const dm = state.days[today]?.dm ?? 0;
  // The number pulses one time when the DMs reach the target.
  const pulse = state.dmTarget > 0 && dm >= state.dmTarget ? 1 : 0;
  const headline = signOffHeadline(clock.stage === 'active' ? clock.day : null, view.ticksDone, view.ticksTotal);
  const outreach = view.modules.find((module) => module.id === 'outreach');
  const signoff = view.modules.find((module) => module.id === 'signoff');

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

  const placeholder = (id: ExpandId, className?: string) => (
    <div
      aria-hidden="true"
      className={cn('surface-card opacity-0', className)}
      key={id}
      style={{ height: cardHeight(id) }}
    />
  );

  const renderModule = (module: ModuleView) => {
    if (module.id === expanded) {
      return placeholder(module.id);
    }
    const common = {
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
            key={module.id}
            pulseKey={pulse}
            subline={module.note ? <p className="type-label text-hub-label">{module.note}</p> : null}
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
      default:
        return <PillarModule {...common} key={module.id} />;
    }
  };

  const expandedModule = expanded ? view.modules.find((module) => module.id === expanded) : undefined;
  const titleId = expanded ? `view-title-${expanded}` : '';

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-3">
        <a className="rounded-full no-underline lg:hidden" href={routeHref('home')}>
          <Wordmark />
          <span className="sr-only"> hub, Today</span>
        </a>
        <p className="type-label hidden text-hub-label lg:block">{formatLong(today)}</p>
        <div className="flex items-center gap-2">
          <MomentumChip momentum={view.momentum} />
          <a
            aria-label="Open Setup"
            className="press flex size-11 items-center justify-center rounded-full bg-hub-chip text-hub-label no-underline hover:text-hub-text"
            href={routeHref('setup')}
          >
            <UserRound aria-hidden="true" className="size-5" strokeWidth={1.7} />
          </a>
        </div>
      </header>

      <section aria-labelledby="dm-today-title" className="mb-8">
        <p className="type-label flex flex-wrap items-center gap-x-2 text-hub-label">
          <span aria-hidden="true">{caption.text}</span>
          <span className="sr-only">{caption.label}</span>
          <span aria-hidden="true">·</span>
          <a className="text-hub-label underline-offset-4 hover:text-hub-text hover:underline" href={routeHref('progress')}>
            Level {level}
          </a>
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <motion.p
              animate={pulse > 0 && !reduced ? PULSE : undefined}
              className="type-hero num origin-left text-hub-text"
              key={`hero-pulse-${pulse}`}
            >
              <RollingNumber value={dm} />
              <span className="text-hub-faint">/{state.dmTarget}</span>
            </motion.p>
            <h1 className="type-body mt-1 text-hub-label" id="dm-today-title">
              DMs sent today
            </h1>
          </div>
          <DmButtons date={today} large />
        </div>
        <ProgressBar
          className="mt-4 h-1.5"
          fraction={state.dmTarget > 0 ? dm / state.dmTarget : 0}
          label={outreach?.barLabel ?? `${dm} DMs`}
          tone={dm >= state.dmTarget ? 'complete' : 'primary'}
        />
        <p className="type-line mt-3 line-clamp-2 max-w-prose text-hub-label">{line.text}</p>
      </section>

      <InstallHint />

      {view.momentum.state === 'recover' ? (
        <Notice announce={false} className="mb-8" kind="NOTE">
          You missed yesterday. Send the DMs today to keep the streak.
        </Notice>
      ) : null}

      {view.allComplete ? <CompleteLine /> : null}

      <PillarCards cards={cards} />

      <LayoutGroup id="today">
        <section aria-labelledby="ticks-title" className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="type-section text-hub-text" id="ticks-title">
              Today's ticks
            </h2>
            <span className="type-label text-hub-label">Tap to tick</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {TICK_PILLARS.map((id) => view.modules.find((module) => module.id === id))
              .filter((module): module is ModuleView => module !== undefined)
              .map(renderModule)}
          </div>
        </section>

        {signoff ? (
          <div className="mb-8">
            {expanded === 'signoff' ? (
              placeholder('signoff')
            ) : (
              <SignOffCard
                onOpen={() => open('signoff')}
                onSignOff={signOffNow}
                onToggle={(task) => toggleTask(today, task)}
                returning={returning === 'signoff'}
                signedOff={view.signedOff}
                ticksDone={view.ticksDone}
                ticksTotal={view.ticksTotal}
                view={signoff}
              />
            )}
          </div>
        ) : null}

        {expanded === 'progress' ? (
          placeholder('progress')
        ) : (
          <ProgressChart maxInsights={1} onOpen={() => open('progress')} today={today} variant="compact" />
        )}

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
