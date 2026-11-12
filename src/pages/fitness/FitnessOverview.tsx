import { Clock, Dumbbell } from 'lucide-react';
import { useMemo } from 'react';
import { HubHeatmap } from '@/components/charts/hub/HubHeatmap';
import { ProgressRing } from '@/components/charts/hub/ProgressRing';
import { Spark } from '@/components/charts/hub/Spark';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { StatCard } from '@/components/shared/StatCard';
import { SwitchRow } from '@/components/shared/SwitchRow';
import { useToday } from '@/hooks/useToday';
import { formatLong, formatShort } from '@/lib/dates';
import { plural } from '@/lib/format';
import { fitnessOverview, fitnessWeek } from '@/lib/fitnessView';
import { attendedOn } from '@/lib/sessions';
import { cn } from '@/lib/utils';
import { useHub, useHubActions } from '@/store/useHub';

/** The ring gauge for the week, the week chips, the attendance switch, the 13-week history and the totals. */
export function FitnessOverview() {
  const today = useToday();
  const sessions = useHub((state) => state.fitness);
  const target = useHub((state) => state.fitTarget);
  const { toggleAttendance } = useHubActions();
  const view = useMemo(() => fitnessOverview(sessions, today, target), [sessions, today, target]);
  const week = useMemo(() => fitnessWeek(sessions, today), [sessions, today]);
  const attended = attendedOn(sessions, today);
  const left = Math.max(0, view.target - view.week);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card aria-labelledby="fitness-week-title" className="flex flex-col items-center gap-5 sm:flex-row lg:col-span-7">
        <ProgressRing
          label={`${view.week} of ${view.target} gym sessions this week`}
          max={view.target}
          size={132}
          strokeWidth={12}
          tone="data"
          value={view.week}
        >
          <span className="type-number num text-hub-text">
            {view.week}
            <span className="text-hub-faint">/{view.target}</span>
          </span>
          <span className="type-caption text-hub-label">this week</span>
        </ProgressRing>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="type-section text-hub-text" id="fitness-week-title">
            {view.week} of {view.target} sessions
          </h2>
          <p className="type-label mt-1 text-hub-label">
            {left === 0
              ? 'The target of the week is met. Extra sessions are a bonus.'
              : `${left} more ${plural(left, 'session', 'sessions')} to the target. The week starts on Monday.`}
          </p>
          <ul aria-label="This week" className="mt-3 flex justify-center gap-1.5 sm:justify-start">
            {week.map((day) => (
              <li
                aria-label={`${day.name}: ${day.attended ? 'gym attended' : day.ahead ? 'ahead' : 'no session'}`}
                className={cn(
                  'type-caption flex size-7 items-center justify-center rounded-full font-semibold',
                  day.attended ? 'bg-hub-success text-hub-on-success' : day.ahead ? 'bg-hub-inset text-hub-label' : 'bg-hub-chip text-hub-label',
                  day.isToday && 'ring-2 ring-hub-brand ring-offset-1 ring-offset-hub-surface',
                )}
                key={day.date}
              >
                <span aria-hidden="true">{day.letter}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="grid content-start gap-4 lg:col-span-5">
        <SwitchRow
          checked={attended}
          detail={formatLong(today)}
          label="Gym attended today"
          onChange={() => toggleAttendance(today)}
        />
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            chart={<Spark data={view.weeklySessions} label="Gym sessions for each of the last 13 weeks" tone="data" variant="bar" />}
            detail="in the log"
            icon={Dumbbell}
            label="Total sessions"
            value={<RollingNumber value={view.sessions} />}
          />
          <StatCard
            chart={<Spark data={view.weeklyMinutes} label="Gym minutes for each of the last 13 weeks" tone="data" />}
            detail="in the log"
            icon={Clock}
            label="Total minutes"
            value={<RollingNumber value={view.minutes} />}
          />
        </div>
      </div>

      <section aria-labelledby="fitness-history-title" className="grid gap-3 lg:col-span-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="type-section text-hub-text" id="fitness-history-title">
            History
          </h2>
          <p className="type-label text-hub-label">{view.weeklySessions.length} weeks</p>
        </div>
        <ol className="surface-card grid grid-cols-5 gap-x-2 gap-y-4 p-4 sm:grid-cols-7 lg:grid-cols-13">
          {view.weeklySessions.map((item) => {
            const met = view.target > 0 && item.value >= view.target;
            return (
              <li className="flex flex-col items-center gap-1" key={item.label}>
                <span
                  className={cn(
                    'type-label num flex size-12 items-center justify-center rounded-full font-semibold',
                    met ? 'bg-hub-success text-hub-on-success' : item.value > 0 ? 'bg-hub-done-pill text-hub-positive' : 'bg-hub-chip text-hub-label',
                  )}
                >
                  <span className="sr-only">{`Week of ${formatShort(item.label)}: `}</span>
                  {item.value}
                  <span className="sr-only">{` ${plural(item.value, 'session', 'sessions')}`}</span>
                </span>
                <span aria-hidden="true" className="type-caption text-hub-label">
                  {formatShort(item.label)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <Card aria-labelledby="fitness-heatmap-title" className="lg:col-span-12">
        <CardTitle id="fitness-heatmap-title">Each day of the last 13 weeks</CardTitle>
        {view.sessions === 0 ? (
          <p className="mt-2 type-body text-hub-label">There are no sessions yet. Use the switch above or the Log tab.</p>
        ) : null}
        <HubHeatmap cells={view.cells} className="mt-4" label="Gym sessions for each day of the last 13 weeks" tone="data" />
      </Card>
    </div>
  );
}
