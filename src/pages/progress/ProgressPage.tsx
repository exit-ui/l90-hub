import { useMemo } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { PageHeader } from '@/components/shared/PageHeader';
import { PillTabs } from '@/components/shared/PillTabs';
import { ProgressChart } from '@/components/shared/ProgressChart';
import { navigate, useRoute } from '@/hooks/useRoute';
import { useToday } from '@/hooks/useToday';
import { STATUS_LABELS } from '@/lib/calendarGrid';
import { formatShort } from '@/lib/dates';
import { plural } from '@/lib/format';
import { MISSION_DAYS } from '@/lib/phases';
import { routeHref } from '@/lib/routes';
import { missionCells } from '@/lib/status';
import { cn } from '@/lib/utils';
import { useHub } from '@/store/useHub';
import { MissionStats } from '@/components/shared/MissionStats';
import { DaysTab } from './DaysTab';
import { STATUS_STYLE } from './statusStyle';

const DAYS_TAB = 'days';
const OVERVIEW_TAB = 'overview';

/** The 90 mission days. Each cell is a 44 px target that opens its day. */
function MissionGrid() {
  const today = useToday();
  const days = useHub((state) => state.days);
  const weekTemplate = useHub((state) => state.weekTemplate);
  const startDate = useHub((state) => state.startDate);
  const cells = useMemo(() => missionCells({ days, weekTemplate, startDate }, today), [days, weekTemplate, startDate, today]);
  const signedOff = cells.filter((cell) => cell.status === 'signed off').length;
  return (
    <Card aria-labelledby="mission-grid-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle id="mission-grid-title">The {MISSION_DAYS} days</CardTitle>
        <p className="type-label text-hub-label">
          {signedOff} {plural(signedOff, 'day', 'days')} signed off
        </p>
      </div>
      <ul className="mt-4 grid grid-day-cells">
        {cells.map((cell) => {
          const style = STATUS_STYLE[cell.status];
          return (
            <li key={cell.date}>
              <a
                aria-current={cell.isToday ? 'date' : undefined}
                aria-label={`Day ${cell.day}, ${formatShort(cell.date)}: ${STATUS_LABELS[cell.status]}. ${cell.dm} ${plural(cell.dm, 'DM', 'DMs')}.`}
                className="press flex size-11 items-center justify-center rounded-control no-underline hover:bg-hub-inset"
                href={routeHref('progress', DAYS_TAB, cell.date)}
              >
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-control type-label font-medium num',
                    style.dot,
                    cell.status === 'signed off' ? 'text-hub-ink' : 'text-hub-label-strong',
                    cell.isToday && 'ring-2 ring-hub-text',
                  )}
                >
                  {cell.day}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <ul aria-label="Key" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 type-label text-hub-label">
        {(['signed off', 'partly done', 'open'] as const).map((status) => (
          <li className="flex items-center gap-2" key={status}>
            <span aria-hidden="true" className={cn('block size-3 rounded-full', STATUS_STYLE[status].dot)} />
            {STATUS_LABELS[status]}
          </li>
        ))}
      </ul>
    </Card>
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

  return (
    <>
      <PageHeader detail="The data of the mission. Filter it, compare it and find the next fix." title="Progress" />
      <PillTabs
        label="Progress sections"
        onChange={(next) => (next === DAYS_TAB ? navigate('progress', DAYS_TAB) : navigate('progress'))}
        tabs={[
          {
            id: OVERVIEW_TAB,
            label: 'Overview',
            content: (
              <div className="grid gap-8 md:gap-12">
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
