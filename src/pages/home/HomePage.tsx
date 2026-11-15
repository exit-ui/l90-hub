import { CircleCheck, Flame, UserRound } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Wordmark } from '@/components/shared/Brand';
import { DmButtons } from '@/components/shared/DmControls';
import { Notice } from '@/components/shared/Notice';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { useNow } from '@/hooks/useNow';
import { useRoute } from '@/hooks/useRoute';
import { useToday } from '@/hooks/useToday';
import { formatLong } from '@/lib/dates';
import { formatR, toRoman } from '@/lib/format';
import { haptic } from '@/lib/haptics';
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

/** "Day XXIV of XC" while the mission runs; the plain headline before and after it. */
function dayCaption(clock: ReturnType<typeof missionClock>): { text: string; label: string } {
  if (clock.stage !== 'active') {
    const text = missionHeadline(clock);
    return { text, label: text };
  }
  return {
    text: `Day ${toRoman(clock.day)} of ${toRoman(MISSION_DAYS)}`,
    label: `Day ${clock.day} of ${MISSION_DAYS}`,
  };
}

/** "Fitness", "Fitness and Learning", "Fitness, Learning and Reading". */
function listOf(names: string[]): string {
  if (names.length < 2) {
    return names.join('');
  }
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** How long the content of a returning card fades in after its view closes. */
const RETURN_MS = 450;

/** True when the card of the id is on the screen now, so it can fly into its view. */
function cardInView(id: ExpandId): boolean {
  const card = document.querySelector(`[data-open-target="${id}"]`);
  if (!card) {
    return false;
  }
  const box = card.getBoundingClientRect();
  return box.bottom > 0 && box.top < window.innerHeight;
}

/**
 * Today, by importance: the DM count of the day, the tick cards, "Sign off the day", then the pillar trends.
 * Each tick card opens into its expanded view (spec 10). The cards are memoised, so a tick
 * draws (and Motion measures) only the card that changed.
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
  const [tapped, setTapped] = useState<ExpandId | null>(null);
  const [entry, setEntry] = useState<ViewEntry>('fade');
  const [seen, setSeen] = useState<ExpandId | null>(expanded);
  const [returning, setReturning] = useState<ExpandId | null>(null);

  // The view changed. A close keeps the card ready for its flight back for a moment.
  if (seen !== expanded) {
    setSeen(expanded);
    if (seen !== null && expanded === null) {
      setReturning(seen);
    }
    // Back, Forward or a typed hash: fly only when the card is on screen.
    if (expanded !== null && tapped !== expanded) {
      setEntry(!reduced && cardInView(expanded) ? 'shared' : 'fade');
    }
    setTapped(null);
  }

  useEffect(() => {
    if (returning === null) {
      return;
    }
    const timer = window.setTimeout(() => setReturning(null), RETURN_MS);
    return () => window.clearTimeout(timer);
  }, [returning]);

  const view = useMemo(() => todayView(state, today, now), [state, today, now]);
  const cards = useMemo(() => pillarCards(state, today), [state, today]);
  const clock = useMemo(() => missionClock(today, state.startDate), [today, state.startDate]);
  const line = lineForDay(clock.day);
  const caption = dayCaption(clock);
  const dm = state.days[today]?.dm ?? 0;
  // The number pulses one time when the DMs reach the target.
  const pulse = state.dmTarget > 0 && dm >= state.dmTarget ? 1 : 0;
  const headline = signOffHeadline(clock.stage === 'active' ? clock.day : null, view.ticksDone, view.ticksTotal);
  const outreach = view.modules.find((module) => module.id === 'outreach');
  const signoff = view.modules.find((module) => module.id === 'signoff');
  const lastOfDay = view.ticksTotal - view.ticksDone === 1;

  const open = useCallback(
    (id: ExpandId) => {
      const hash = routeHref('home', id);
      if (window.location.hash === hash) {
        return;
      }
      setTapped(id);
      setEntry(reduced ? 'fade' : 'shared');
      openedByPush.current = true;
      window.location.hash = hash.slice(1);
    },
    [reduced],
  );

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

  const onToggle = useCallback((task: string) => toggleTask(today, task), [toggleTask, today]);
  const onChartCheck = useCallback(() => addChartCheck(today), [addChartCheck, today]);
  const signOffNow = useCallback(() => {
    signOffDay(today);
    open('signoff');
  }, [open, signOffDay, today]);

  const placeholder = (id: ExpandId) => (
    <div aria-hidden="true" className="surface-card opacity-0" key={id} style={{ height: cardHeight(id) }} />
  );

  const renderModule = (module: ModuleView) => {
    if (module.id === expanded) {
      return placeholder(module.id);
    }
    return (
      <PillarModule
        cardsDue={module.id === 'learning' ? view.cardsDue : undefined}
        key={module.id}
        lastOfDay={lastOfDay}
        onChartCheck={module.id === 'trading' ? onChartCheck : undefined}
        onOpen={open}
        onToggle={onToggle}
        returning={returning === module.id}
        view={module}
      />
    );
  };

  const tickModules = TICK_PILLARS.map((id) => view.modules.find((module) => module.id === id)).filter(
    (module): module is ModuleView => module !== undefined,
  );
  // A card with no ticks today and nothing to do on it folds into one quiet line.
  const hasWork = (module: ModuleView) =>
    module.ticks.length > 0 || module.id === 'trading' || (module.id === 'learning' && view.cardsDue > 0) || module.id === expanded;
  const shown = tickModules.filter(hasWork);
  const resting = tickModules.filter((module) => !hasWork(module)).map((module) => module.name);

  const expandedModule = expanded ? view.modules.find((module) => module.id === expanded) : undefined;
  const titleId = expanded ? `view-title-${expanded}` : '';

  return (
    <>
      <header className="mb-5 flex items-center justify-between gap-3">
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
        <p className="type-label text-hub-label">
          <span aria-hidden="true">{caption.text}</span>
          <span className="sr-only">{caption.label}</span>
        </p>
        <div className="mt-1 flex items-end justify-between gap-4">
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
          className="mt-4 h-2"
          fraction={state.dmTarget > 0 ? dm / state.dmTarget : 0}
          label={outreach?.barLabel ?? `${dm} DMs`}
          tone={dm >= state.dmTarget ? 'complete' : 'primary'}
        />
        <p className="type-label mt-3 line-clamp-2 max-w-prose text-hub-label">{line.text}</p>
      </section>

      <InstallHint />

      {view.momentum.state === 'recover' ? (
        <Notice announce={false} className="mb-8" kind="NOTE">
          You missed yesterday. Send the DMs today to keep the streak.
        </Notice>
      ) : null}

      {view.allComplete ? <CompleteLine /> : null}

      <>
        <section aria-labelledby="ticks-title" className="mb-8">
          <h2 className="type-section mb-3 text-hub-text" id="ticks-title">
            Today's ticks
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {shown.map(renderModule)}
          </div>
          {resting.length > 0 ? (
            <p className="type-label mt-3 px-1 text-hub-label">Nothing to tick today for {listOf(resting)}.</p>
          ) : null}
        </section>

        {signoff ? (
          <div className="mb-8">
            {expanded === 'signoff' ? (
              placeholder('signoff')
            ) : (
              <SignOffCard
                        onOpen={open}
                onSignOff={signOffNow}
                onToggle={onToggle}
                returning={returning === 'signoff'}
                signedOff={view.signedOff}
                ticksDone={view.ticksDone}
                ticksTotal={view.ticksTotal}
                view={signoff}
              />
            )}
          </div>
        ) : null}

        <PillarCards cards={cards} />

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
                  lastOfDay={lastOfDay}
                  module={expandedModule}
                  onSignOff={() => {
                    haptic('peak');
                    signOffDay(today);
                  }}
                  onToggle={onToggle}
                  signedOff={view.signedOff}
                  today={today}
                />
              ) : expandedModule ? (
                <PillarView
                  cardsDue={view.cardsDue}
                  format={expandedModule.id === 'trading' ? signedR : undefined}
                  lastOfDay={lastOfDay}
                  module={expandedModule}
                  onToggle={onToggle}
                  today={today}
                  whole={expandedModule.id !== 'trading'}
                />
              ) : null}
            </ExpandedLayer>
          ) : null}
        </AnimatePresence>
      </>
    </>
  );
}
