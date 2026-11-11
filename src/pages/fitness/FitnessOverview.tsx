import { Clock, Dumbbell } from 'lucide-react';
import { useMemo } from 'react';
import { HubHeatmap } from '@/components/charts/hub/HubHeatmap';
import { ProgressRing } from '@/components/charts/hub/ProgressRing';
import { Spark } from '@/components/charts/hub/Spark';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { StatCard } from '@/components/shared/StatCard';
import { useToday } from '@/hooks/useToday';
import { fitnessOverview } from '@/lib/fitnessView';
import { useHub } from '@/store/useHub';

/** The weekly ring, the totals and the 13-week heatmap. */
export function FitnessOverview() {
  const today = useToday();
  const sessions = useHub((state) => state.fitness);
  const target = useHub((state) => state.fitTarget);
  const view = useMemo(() => fitnessOverview(sessions, today, target), [sessions, today, target]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card aria-labelledby="fitness-week-title" className="lg:col-span-4">
        <CardTitle id="fitness-week-title">This week</CardTitle>
        <div className="mt-4 flex flex-col items-center gap-3">
          <ProgressRing
            label={`${view.week} of ${view.target} gym sessions this week`}
            max={view.target}
            size={168}
            strokeWidth={16}
            tone="data"
            value={view.week}
          >
            <span className="type-number num text-hub-text">
              {view.week} of {view.target}
            </span>
            <span className="type-label text-hub-label">sessions</span>
          </ProgressRing>
          <p className="text-center type-label text-hub-label">
            The week starts on Monday. Change the target on the Setup page.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:col-span-8">
        <StatCard
          chart={
            <Spark
              data={view.weeklySessions}
              label="Gym sessions for each of the last 13 weeks"
              tone="data"
              variant="bar"
            />
          }
          detail="in the log"
          icon={Dumbbell}
          label="Total sessions"
          value={<RollingNumber value={view.sessions} />}
        />
        <StatCard
          chart={
            <Spark
              data={view.weeklyMinutes}
              label="Gym minutes for each of the last 13 weeks"
              tone="data"
            />
          }
          detail="in the log"
          icon={Clock}
          label="Total minutes"
          value={<RollingNumber value={view.minutes} />}
        />
      </div>

      <Card aria-labelledby="fitness-heatmap-title" className="lg:col-span-12">
        <CardTitle id="fitness-heatmap-title">The last 13 weeks</CardTitle>
        {view.sessions === 0 ? (
          <p className="mt-2 type-body text-hub-label">
            There are no sessions. Add the first session on the Log tab.
          </p>
        ) : null}
        <HubHeatmap
          cells={view.cells}
          className="mt-4"
          label="Gym sessions for each day of the last 13 weeks"
          tone="data"
        />
      </Card>
    </div>
  );
}
