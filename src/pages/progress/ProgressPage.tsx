import { AnimatePresence, useReducedMotion } from 'motion/react';
import { memo, useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PillarGlyph } from '@/components/shared/PillarGlyph';
import {
  ANALYTICS_PILLARS,
  type AnalyticsPillar,
  analyticsFrom,
  formatValue,
  metricsOf,
  pillarStats,
} from '@/lib/pillarAnalytics';
import { PILLAR_LABELS } from '@/lib/pillars';
import { ExpandedLayer, type ViewEntry } from '@/pages/home/expand/ExpandedLayer';
import { ViewTitle } from '@/pages/home/expand/views';
import { AllTicksCard } from './AllTicksCard';
import { FocusCard } from './FocusCard';
import { PillarAnalytics } from './PillarAnalytics';
import { PageHeader } from '@/components/shared/PageHeader';
import { PillTabs } from '@/components/shared/PillTabs';
import { ProgressChart } from '@/components/shared/ProgressChart';
import { navigate, useRoute } from '@/hooks/useRoute';
import { useToday } from '@/hooks/useToday';
import { STATUS_LABELS } from '@/lib/calendarGrid';
import { formatShort } from '@/lib/dates';
import { plural } from '@/lib/format';
import { MISSION_DAYS, missionClock } from '@/lib/phases';
import { missionHeadline } from '@/lib/homeText';
import { routeHref } from '@/lib/routes';
import { type DayStatus, missionCells } from '@/lib/status';
import { cn } from '@/lib/utils';
import { useHub } from '@/store/useHub';
import { MissionStats } from '@/components/shared/MissionStats';
import { DaysTab } from './DaysTab';

const DAYS_TAB = 'days';
const OVERVIEW_TAB = 'overview';

/** The heatmap colour of each day status. A missed day is grey, never red. */
const HEAT: Readonly<Record<DayStatus, string>> = {
  'signed off': 'bg-hub-success',
  'partly done': 'bg-hub-partial',
  missed: 'bg-hub-track',
  open: 'bg-hub-chart-future',
};

/** The 90 mission days as small rounded squares, 15 to a row. The Days tab opens each day. */
function MissionGrid() {
  const today = useToday();
  const days = useHub((state) => state.days);
  const weekTemplate = useHub((state) => state.weekTemplate);
  const startDate = useHub((state) => state.startDate);
  const cells = useMemo(() => missionCells({ days, weekTemplate, startDate }, today), [days, weekTemplate, startDate, today]);
  const signedOff = cells.filter((cell) => cell.status === 'signed off').length;
  const partly = cells.filter((cell) => cell.status === 'partly done').length;
  const summary = `The ${MISSION_DAYS} mission days: ${signedOff} signed off, ${partly} partly done.`;
  return (
    <section aria-labelledby="mission-grid-title" className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-section text-hub-text" id="mission-grid-title">
          {MISSION_DAYS} days
        </h2>
        <p className="type-label text-hub-label">
          {signedOff} {plural(signedOff, 'day', 'days')} signed off
        </p>
      </div>
      <div className="surface-card p-4">
        <ul aria-label={summary} className="grid grid-heat gap-1 sm:gap-1.5" role="img">
          {cells.map((cell) => (
            <li
              aria-hidden="true"
              className={cn(
                'aspect-square rounded-sm sm:rounded-md',
                HEAT[cell.status],
                cell.isToday && 'ring-2 ring-hub-brand ring-offset-1 ring-offset-hub-surface',
              )}
              key={cell.date}
              title={`Day ${cell.day}, ${formatShort(cell.date)}: ${STATUS_LABELS[cell.status]}`}
            />
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <ul aria-label="Key" className="flex flex-wrap gap-x-4 gap-y-1 type-caption text-hub-label">
            {(['signed off', 'partly done', 'open'] as const).map((status) => (
              <li className="flex items-center gap-2" key={status}>
                <span aria-hidden="true" className={cn('block size-2.5 rounded-xs', HEAT[status])} />
                {STATUS_LABELS[status]}
              </li>
            ))}
          </ul>
          <a
            className="tap inline-flex items-center rounded-full px-2 type-label text-hub-label no-underline hover:text-hub-text"
            href={routeHref('progress', DAYS_TAB)}
          >
            Open the days ›
          </a>
        </div>
      </div>
    </section>
  );
}

/** How many days of data a pillar card's sparkline shows. */
const SPARK_DAYS = 12;

/** The unit word under a pillar total. */
const TOTAL_WORD: Readonly<Record<AnalyticsPillar, string>> = {
  outreach: 'DMs sent',
  fitness: 'sessions',
  learning: 'hours studied',
  reading: 'chapters',
  trading: 'result',
};

/**
 * The five pillars as gradient cards (v3), Outreach across the top. Each shows the mission total and
 * opens its analytics, which grow out of the card.
 */
function PillarGrid({ onOpen, today }: { onOpen: (id: AnalyticsPillar) => void; today: string }) {
  const state = useHub(
    useShallow((hub) => ({
      days: hub.days,
      startDate: hub.startDate,
      fitness: hub.fitness,
      learning: hub.learning,
      trades: hub.trades,
      chapterNotes: hub.chapterNotes,
      funnel: hub.funnel,
      dmTarget: hub.dmTarget,
      chartCheckLimit: hub.chartCheckLimit,
    })),
  );
  const totals = useMemo(
    () =>
      ANALYTICS_PILLARS.map((id) => {
        const metric = metricsOf(id, state)[0]!;
        const stats = pillarStats(state, id, metric, 90, today);
        const total = stats.total;
        const value = id === 'learning' ? `${Math.round((total / 60) * 10) / 10}` : formatValue(Math.round(total * 10) / 10, { ...metric, unit: '' });
        // The last 12 days with data, as bar heights from 12 % to 100 % of the tallest. Plain bars: no animation.
        const recent = stats.points.flatMap((point) => (point.value === null ? [] : [Math.abs(point.value)])).slice(-SPARK_DAYS);
        const top = Math.max(1, ...recent);
        const spark = recent.map((v) => Math.max(12, Math.round((v / top) * 100)));
        return { id, value, spark, unit: id === 'learning' ? ' h' : id === 'trading' ? ' R' : '' };
      }),
    [state, today],
  );
  return (
    <section aria-labelledby="pillar-grid-title" className="grid gap-3">
      <h2 className="sr-only" id="pillar-grid-title">
        Pillars
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {totals.map((item, index) => (
          <li className={item.id === 'outreach' ? 'col-span-2 lg:col-span-1' : undefined} key={item.id}>
            <button
              aria-label={`${PILLAR_LABELS[item.id]}: ${item.value}${item.unit} ${TOTAL_WORD[item.id]}. Open the analytics.`}
              className={cn('pillar-card press flex h-32 w-full cursor-pointer flex-col justify-between p-4 text-left', `pillar-${item.id}`)}
              data-open-target={item.id}
              onClick={() => onOpen(item.id)}
              type="button"
            >
              <span aria-hidden="true" className="flex w-full items-start justify-between gap-2">
                <span className="type-label font-semibold text-white">{PILLAR_LABELS[item.id]}</span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                  <PillarGlyph delayMs={420 + index * 80} id={item.id} play={1} size={20} />
                </span>
              </span>
              <span aria-hidden="true" className="flex w-full items-end justify-between gap-3">
                <span className="grid">
                  <span className="num text-[30px] leading-9 font-bold tracking-tight whitespace-nowrap text-white">
                    {item.value}
                    <span className="text-lg text-white/60">{item.unit}</span>
                  </span>
                  <span className="type-caption text-white">{TOTAL_WORD[item.id]}</span>
                </span>
                <span className={cn('flex h-8.5 items-end', item.id === 'outreach' ? 'gap-0.75' : 'gap-0.5')}>
                  {(item.id === 'outreach' ? item.spark : item.spark.slice(-7)).map((height, index) => (
                    <span className={cn('hatch rounded-full', item.id === 'outreach' ? 'w-1.25' : 'w-1')} key={index} style={{ height: `${height}%` }} />
                  ))}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The Overview tab. It is memoised: opening or closing a pillar's analytics changes the route, and this
 * keeps the cards, the chart and the 90-day grid from drawing again behind the view (spec 133).
 * The chart and the grid draw one render after the cards, so the page shows at once.
 */
const OverviewTab = memo(function OverviewTab({
  today,
  onOpen,
}: {
  today: string;
  onOpen: (id: AnalyticsPillar) => void;
}) {
  const heavyReady = useDeferredValue(true, false);
  return (
    <div className="grid gap-5 sm:gap-8 md:gap-12">
      <PillarGrid onOpen={onOpen} today={today} />
      <AllTicksCard today={today} />
      <FocusCard today={today} />
      {heavyReady ? (
        <>
          <ProgressChart today={today} variant="full" />
          <MissionStats />
          <MissionGrid />
        </>
      ) : (
        <div aria-hidden="true" className="min-h-[640px]" />
      )}
    </div>
  );
});

/**
 * Progress: the full motion chart with the compare mode, the mission numbers,
 * the 90-day grid, and the days of the mission on the "Days" tab.
 */
export function ProgressPage() {
  const route = useRoute();
  const today = useToday();
  const reduced = useReducedMotion();
  const first = route.page === 'progress' ? route.segments[0] : undefined;
  const pillar = analyticsFrom(route);
  const openedByPush = useRef(false);
  const [entry, setEntry] = useState<ViewEntry>(() => (pillar ? 'fade' : 'grow'));
  const openPillar = useCallback(
    (id: AnalyticsPillar) => {
      setEntry(reduced ? 'fade' : 'grow');
      openedByPush.current = true;
      navigate('progress', 'pillar', id);
    },
    [reduced],
  );
  const closePillar = useCallback(() => {
    if (openedByPush.current) {
      openedByPush.current = false;
      window.history.back();
      return;
    }
    const { pathname, search } = window.location;
    window.history.replaceState(null, '', `${pathname}${search}${routeHref('progress')}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, []);
  const titleId = pillar ? `analytics-title-${pillar}` : '';
  const tab = first === DAYS_TAB ? DAYS_TAB : OVERVIEW_TAB;
  const daySegment = tab === DAYS_TAB ? route.segments[1] : undefined;
  const startDate = useHub((state) => state.startDate);
  const clock = missionClock(today, startDate);
  const caption = clock.stage === 'active' ? (
    <>
      {`Day ${clock.day} of ${MISSION_DAYS}`}
    </>
  ) : (
    missionHeadline(clock)
  );

  return (
    <>
      <PageHeader eyebrow={caption} title="Progress" />
      <PillTabs
        label="Progress sections"
        onChange={(next) => (next === DAYS_TAB ? navigate('progress', DAYS_TAB) : navigate('progress'))}
        tabs={[
          {
            id: OVERVIEW_TAB,
            label: 'Pillars',
            content: <OverviewTab onOpen={openPillar} today={today} />,
          },
          { id: DAYS_TAB, label: 'Days', content: <DaysTab segment={daySegment} /> },
        ]}
        value={tab}
      />
      <AnimatePresence>
        {pillar ? (
          <ExpandedLayer
            entry={entry}
            id={pillar}
            key={pillar}
            onClose={closePillar}
            title={
              <ViewTitle id={`analytics-${pillar}`} titleId={titleId}>
                {PILLAR_LABELS[pillar]}
              </ViewTitle>
            }
            titleId={titleId}
          >
            <PillarAnalytics pillar={pillar} today={today} />
          </ExpandedLayer>
        ) : null}
      </AnimatePresence>
    </>
  );
}
