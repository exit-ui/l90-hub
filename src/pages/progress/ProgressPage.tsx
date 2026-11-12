import { useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PillTabs } from '@/components/shared/PillTabs';
import { ProgressChart } from '@/components/shared/ProgressChart';
import { navigate, useRoute } from '@/hooks/useRoute';
import { useToday } from '@/hooks/useToday';
import { STATUS_LABELS } from '@/lib/calendarGrid';
import { formatShort } from '@/lib/dates';
import { plural, toRoman } from '@/lib/format';
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

/**
 * Progress: the full motion chart with the compare mode, the mission numbers,
 * the 90-day grid, and the days of the mission on the "Days" tab.
 */
export function ProgressPage() {
  const route = useRoute();
  const today = useToday();
  const first = route.page === 'progress' ? route.segments[0] : undefined;
  const tab = first === DAYS_TAB ? DAYS_TAB : OVERVIEW_TAB;
  const daySegment = tab === DAYS_TAB ? route.segments[1] : undefined;
  const startDate = useHub((state) => state.startDate);
  const clock = missionClock(today, startDate);
  const caption = clock.stage === 'active' ? (
    <>
      <span aria-hidden="true">{`Day ${toRoman(clock.day)} of ${toRoman(MISSION_DAYS)}`}</span>
      <span className="sr-only">{`Day ${clock.day} of ${MISSION_DAYS}`}</span>
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
            label: 'Overview',
            content: (
              <div className="grid gap-5 sm:gap-8 md:gap-12">
                <ProgressChart today={today} variant="full" />
                <MissionStats />
                <MissionGrid />
              </div>
            ),
          },
          { id: DAYS_TAB, label: 'Days', content: <DaysTab segment={daySegment} /> },
        ]}
        value={tab}
      />
    </>
  );
}
