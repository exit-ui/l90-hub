import { Flame } from 'lucide-react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { memo, useCallback, useDeferredValue, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Burst } from '@/components/shared/Burst';
import { Notice } from '@/components/shared/Notice';
import { useNow } from '@/hooks/useNow';
import { useRisingEdge } from '@/hooks/useRisingEdge';
import { useRoute } from '@/hooks/useRoute';
import { useToday } from '@/hooks/useToday';
import { formatR } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { missionHeadline } from '@/lib/homeText';
import { momentumShort, type TodayView, todayView } from '@/lib/moduleView';
import { pulse } from '@/lib/pulse';
import { MISSION_DAYS, missionClock } from '@/lib/phases';
import { pillarCards } from '@/lib/pillarCards';
import { closeAction, type ExpandId, expandedFrom, routeHref } from '@/lib/routes';
import type { Momentum } from '@/lib/streak';
import { signOffHeadline } from '@/lib/signoff';
import { cn } from '@/lib/utils';
import { levelProgress, totalXp } from '@/lib/xp';
import type { DateKey } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';
import { ExpandedLayer, type ViewEntry } from './expand/ExpandedLayer';
import { PillarView, ProgressView, SignOffView, ViewTitle } from './expand/views';
import { DmHero } from './DmHero';
import { InstallHint } from './InstallHint';
import { LevelRing } from './LevelRing';
import { PillarCards } from './PillarCards';
import { TodoList } from './TodoList';

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

/** True when the card of the id is on the screen now, so its view can grow out of it. */
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

/** "Day 24 of 90 · Phase 2" while the mission runs; the plain headline before and after it. */
function dayCaption(clock: ReturnType<typeof missionClock>): { text: string; label: string } {
  if (clock.stage !== 'active') {
    const text = missionHeadline(clock);
    return { text, label: text };
  }
  const phase = clock.phase ? ` · Phase ${clock.phase}` : '';
  return {
    text: `Day ${clock.day} of ${MISSION_DAYS}${phase}`,
    label: `Day ${clock.day} of ${MISSION_DAYS}${clock.phase ? `, phase ${clock.phase}` : ''}`,
  };
}

/**
 * Which view the last tap opened, and whether the app pushed the hash (so Back closes it).
 * Module-level, so the page body (which opens views) and the sheets (which show them) share it
 * without sharing a render.
 */
const nav: { tapped: ExpandId | null; pushed: boolean } = { tapped: null, pushed: false };

function openView(id: ExpandId) {
  const hash = routeHref('home', id);
  if (window.location.hash === hash) {
    return;
  }
  nav.tapped = id;
  nav.pushed = true;
  window.location.hash = hash.slice(1);
}

function openSignOff() {
  openView('signoff');
}

function openOutreach() {
  openView('outreach');
}

/** The greeting for the hour of the day. */
function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  }
  return hour >= 12 && hour < 18 ? 'Good afternoon' : 'Good evening';
}

function closeView() {
  const action = closeAction(nav.pushed);
  nav.pushed = false;
  if (action === 'back') {
    window.history.back();
    return;
  }
  const { pathname, search } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}${routeHref('home')}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

interface HomeSheetsProps {
  view: TodayView;
  today: DateKey;
  onToggle: (task: string) => void;
  onSignOff: () => void;
}

/**
 * The expanded views of Today. This is the only part of the page that listens to the route, so opening
 * or closing a view draws the view and nothing behind it.
 */
function HomeSheets({ view, today, onToggle, onSignOff }: HomeSheetsProps) {
  const route = useRoute();
  const reduced = useReducedMotion();
  const startDate = useHub((state) => state.startDate);
  const expanded = expandedFrom(route);

  // A tap grows the view out of its card. Back, Forward or a typed hash grow only when the card is on screen.
  const entry = useMemo<ViewEntry>(() => {
    if (expanded === null || reduced) {
      return 'fade';
    }
    return nav.tapped === expanded || cardInView(expanded) ? 'grow' : 'fade';
  }, [expanded, reduced]);
  useEffect(() => {
    if (expanded === null) {
      nav.tapped = null;
    }
  }, [expanded]);

  const expandedModule = expanded ? view.modules.find((module) => module.id === expanded) : undefined;
  const titleId = expanded ? `view-title-${expanded}` : '';
  const clock = missionClock(today, startDate);
  const headline = signOffHeadline(clock.stage === 'active' ? clock.day : null, view.ticksDone, view.ticksTotal);

  return (
    <AnimatePresence>
      {expanded ? (
        <ExpandedLayer
          entry={entry}
          id={expanded}
          key={expanded}
          onClose={closeView}
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
              onSignOff={onSignOff}
              onToggle={onToggle}
              signedOff={view.signedOff}
              today={today}
            />
          ) : expandedModule ? (
            <PillarView
              cardsDue={view.cardsDue}
              format={expandedModule.id === 'trading' ? signedR : undefined}
              module={expandedModule}
              onToggle={onToggle}
              today={today}
              whole={expandedModule.id !== 'trading'}
            />
          ) : null}
        </ExpandedLayer>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Today (v3, spec round 9): the day and the streak, the DM card, the four pillar cards in their gradients
 * and one "To do" list. A pillar card opens its view, which grows out of the card; the content of the view
 * rises in once it has landed. A ticked row leaves the list; "N done" brings it back for an undo.
 * The page does not listen to the route: only HomeSheets does (spec 133).
 */
export const HomePage = memo(function HomePage() {
  const today = useToday();
  const now = useNow();
  const state = useHub();
  const reduced = useReducedMotion();
  const { toggleTask, signOffDay } = useHubActions();

  const view = useMemo(() => todayView(state, today, now), [state, today, now]);
  // Every tick of the day done, or the day signed off: a burst of colour over the screen.
  const party = useRisingEdge(view.allComplete) + useRisingEdge(view.signedOff);
  // The pillar cards need not change on the same frame as a tick: they draw a moment later.
  const lazy = useDeferredValue(state);
  const cards = useMemo(() => pillarCards(lazy, today), [lazy, today]);
  const clock = useMemo(() => missionClock(today, state.startDate), [today, state.startDate]);
  const caption = dayCaption(clock);
  const level = useMemo(() => levelProgress(totalXp(lazy)), [lazy]);

  const onToggle = useCallback((task: string) => toggleTask(today, task), [toggleTask, today]);
  const signOffNow = useCallback(() => {
    haptic('peak');
    pulse();
    signOffDay(today);
    // Sign off, then open the Sign-off view with the summary, the win and tomorrow (no-op when it is open).
    openView('signoff');
  }, [signOffDay, today]);

  return (
    <>
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="type-label text-hub-label">
            <span aria-hidden="true">{caption.text}</span>
            <span className="sr-only">{caption.label}</span>
          </p>
          <h1 className="type-title text-hub-text">{greetingFor(now.getHours())}</h1>
        </div>
        <div className="flex items-center gap-2">
          <MomentumChip momentum={view.momentum} />
          <LevelRing fraction={level.fraction} level={level.level} />
        </div>
      </header>

      <DmHero date={today} onOpen={openOutreach} />

      <InstallHint />

      {view.momentum.state === 'recover' ? (
        <Notice announce={false} className="mb-6" kind="NOTE">
          You missed yesterday. Send the DMs today to keep the streak.
        </Notice>
      ) : null}

      {party > 0 && !reduced
        ? createPortal(
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50" key={`party-${party}`}>
              <Burst count={28} distance={170} duration={1.2} size={9} />
            </div>,
            document.body,
          )
        : null}

      <TodoList
        cardsDue={view.cardsDue}
        modules={view.modules}
        onOpenSignOff={openSignOff}
        onSignOff={signOffNow}
        onToggle={onToggle}
        signedOff={view.signedOff}
      />

      <PillarCards cards={cards} onOpen={openView} />

      <HomeSheets onSignOff={signOffNow} onToggle={onToggle} today={today} view={view} />
    </>
  );
});
