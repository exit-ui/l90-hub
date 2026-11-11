import { CalendarCheck, Flame, Gauge, Send, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { HubAreaChart } from '@/components/charts/hub/HubAreaChart';
import { Spark } from '@/components/charts/hub/Spark';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { Notice } from '@/components/shared/Notice';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { StatCard } from '@/components/shared/StatCard';
import { DmCounter } from '@/components/shared/TaskCard';
import { useToday } from '@/hooks/useToday';
import { formatDecimal, formatInteger } from '@/lib/format';
import { outreachOverview, OVERVIEW_CHART_DAYS } from '@/lib/outreachView';
import { momentum } from '@/lib/streak';
import { useHub } from '@/store/useHub';

/** The DM counter of today, the 30-day chart and the DM totals. */
export function OverviewTab() {
  const today = useToday();
  const days = useHub((state) => state.days);
  const dmTarget = useHub((state) => state.dmTarget);
  const baseContacted = useHub((state) => state.baseContacted);
  const startDate = useHub((state) => state.startDate);

  const view = useMemo(
    () => outreachOverview({ days, dmTarget, baseContacted, startDate }, today),
    [days, dmTarget, baseContacted, startDate, today],
  );
  const recover = useMemo(() => momentum(days, today, dmTarget).state === 'recover', [days, today, dmTarget]);

  return (
    <div className="grid gap-6">
      {recover ? (
        <Notice announce={false} kind="NOTE">
          You missed yesterday. Send the DMs today to keep the streak.
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card aria-labelledby="outreach-today-title" className="lg:order-2 lg:col-span-5 lg:self-start">
          <DmCounter
            date={today}
            heading={
              <h2 className="type-section text-hub-text" id="outreach-today-title">
                Today
              </h2>
            }
          />
        </Card>
        <Card aria-labelledby="dm-chart-title" className="lg:col-span-7 lg:self-start">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <CardTitle id="dm-chart-title">DMs for each day</CardTitle>
            <p className="type-label text-hub-label">
              The last {OVERVIEW_CHART_DAYS} days. The target is {view.target}.
            </p>
          </div>
          <HubAreaChart
            className="mt-4"
            data={view.series}
            formatValue={formatInteger}
            label={`DMs for each of the last ${OVERVIEW_CHART_DAYS} days, with the target line at ${view.target}`}
            target={dmTarget}
            targetLabel="Target"
            tone="primary"
          />
        </Card>
      </div>
      <section
        aria-label="Outreach numbers"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"
      >
        <StatCard
          chart={<Spark data={view.spark} label="DMs for each of the last 14 days" tone="primary" />}
          className="col-span-2 md:col-span-1"
          detail="DMs in the hub"
          icon={Send}
          label="Total DMs"
          value={<RollingNumber format={formatInteger} value={view.total} />}
        />
        <StatCard
          chart={
            <ProgressBar
              fraction={view.atTargetFraction}
              label={`${view.atTarget} of ${view.missionDays} days at the target`}
              tone="data"
            />
          }
          detail={`of ${view.missionDays} days`}
          icon={CalendarCheck}
          label="Days at target"
          value={<RollingNumber value={view.atTarget} />}
        />
        <StatCard
          chart={
            <ProgressBar
              fraction={view.streakFraction}
              label={`A streak of ${view.streak} of ${view.missionDays} days`}
              tone="secondary"
            />
          }
          detail="days in sequence"
          icon={Flame}
          label="Streak"
          value={<RollingNumber value={view.streak} />}
        />
        <StatCard
          chart={
            <ProgressBar
              fraction={view.averageFraction}
              label={`A 7-day average of ${formatDecimal(view.average)} DMs. The target is ${view.target}.`}
              tone="data"
            />
          }
          detail={`target ${view.target}`}
          icon={Gauge}
          label="7-day average"
          value={<RollingNumber format={formatDecimal} value={view.average} whole={false} />}
        />
        <StatCard
          chart={
            <ProgressBar
              fraction={view.projectedFraction}
              label={`${formatInteger(view.contacted)} contacted now of ${formatInteger(view.projected)} projected at day ${view.missionDays}`}
              tone="secondary"
            />
          }
          detail={`${formatInteger(view.contacted)} contacted now`}
          icon={TrendingUp}
          label={`Projected at day ${view.missionDays}`}
          value={<RollingNumber format={formatInteger} value={view.projected} />}
        />
      </section>
    </div>
  );
}
