import { CalendarCheck, Flame, Gauge, Send, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle, SegmentedSwitch } from '@/components/shared/Controls';
import { Notice } from '@/components/shared/Notice';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { StatCard } from '@/components/shared/StatCard';
import { DmCounter } from '@/components/shared/TaskCard';
import { useToday } from '@/hooks/useToday';
import { formatDecimal, formatInteger } from '@/lib/format';
import {
  funnelSummary,
  OUTREACH_RANGE_LABELS,
  OUTREACH_RANGES,
  type OutreachBars,
  type OutreachRange,
  outreachBars,
  outreachOverview,
} from '@/lib/outreachView';
import { routeHref } from '@/lib/routes';
import { momentum } from '@/lib/streak';
import { cn } from '@/lib/utils';
import { useHub } from '@/store/useHub';

/** The hero card: the one gradient in the app. White text on the dark green. */
function HeroCard({ target, contacted }: { target: number; contacted: number }) {
  return (
    <section aria-labelledby="outreach-hero-title" className="bg-hero flex min-h-40 flex-col justify-between rounded-card p-5 text-hub-on-hero">
      <div>
        <h2 className="type-section" id="outreach-hero-title">
          Instagram outreach
        </h2>
        <p className="type-label mt-1 text-hub-on-hero-soft">Target {target} a day</p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="type-label text-hub-on-hero-soft">Creators contacted in total</p>
          <RollingNumber className="type-number num" format={formatInteger} value={contacted} />
        </div>
        <a
          className="press inline-flex min-h-11 items-center rounded-full bg-hub-hero-button px-4 type-label font-semibold text-hub-hero-button-text no-underline"
          href={routeHref('setup')}
        >
          Edit target
        </a>
      </div>
    </section>
  );
}

/** The share of the chart height for a value. The scale holds the target with room above it. */
function heightOf(value: number, top: number): string {
  return `${Math.max(0, Math.min(100, (value / top) * 100))}%`;
}

/** Rounded green bars of DMs a day, each in front of a pale bar up to the target, with a dashed target line. */
function OutreachBarChart({ view }: { view: OutreachBars }) {
  const values = view.bars.map((bar) => bar.value ?? 0);
  const top = Math.max(view.target, ...values, 1) * 1.15;
  const [whole, decimal] = formatDecimal(view.average).split('.');
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="type-number num text-hub-text">
          {whole}
          <span className="text-hub-faint">.{decimal}</span>
        </p>
        <p className="type-label text-hub-label">avg a day</p>
        {view.change ? (
          <p
            className={cn(
              'type-label num ml-auto font-semibold',
              view.change.trend === 'up' ? 'text-hub-positive' : 'text-hub-label',
            )}
          >
            {view.change.text}
          </p>
        ) : null}
      </div>
      <div aria-label={view.summary} className="relative mt-4 h-40 border-b border-dashed border-hub-hairline" role="img">
        {view.target > 0 ? (
          <div aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-hub-positive/40" style={{ bottom: heightOf(view.target, top) }}>
            <span className="type-caption absolute right-0 bottom-1 text-hub-label">{view.target} target</span>
          </div>
        ) : null}
        <div aria-hidden="true" className="absolute inset-0 flex items-end justify-between gap-1">
          {view.bars.map((bar, index) => (
            <div className="relative flex h-full flex-1 items-end justify-center" key={`${bar.label}-${index}`}>
              <div className="absolute bottom-0 w-3/5 max-w-6 rounded-t-full rounded-b-sm bg-hub-chart-target-bar" style={{ height: heightOf(view.target, top) }} />
              <div
                className={cn(
                  'relative w-3/5 max-w-6 rounded-t-full rounded-b-sm transition-[height] duration-300',
                  bar.value === null ? 'bg-hub-track' : bar.value >= view.target ? 'bg-hub-success' : 'bg-hub-bar-partial',
                )}
                style={{ height: bar.value === null || bar.value === 0 ? '4px' : heightOf(bar.value, top) }}
              />
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="mt-2 flex justify-between gap-1">
        {view.bars.map((bar, index) => (
          <span className="type-caption flex-1 text-center text-hub-label" key={`${bar.label}-label-${index}`}>
            {bar.label}
          </span>
        ))}
      </div>
      <ul className="sr-only">
        {view.bars.map((bar, index) => (
          <li key={`${bar.label}-text-${index}`}>{bar.text}</li>
        ))}
      </ul>
    </div>
  );
}

/** The four short funnel rows with the share of the row before in a pill. */
function FunnelRows() {
  const funnel = useHub((state) => state.funnel);
  const days = useHub((state) => state.days);
  const baseContacted = useHub((state) => state.baseContacted);
  const rows = useMemo(() => funnelSummary({ funnel, days, baseContacted }), [funnel, days, baseContacted]);
  return (
    <section aria-labelledby="funnel-short-title" className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="type-section text-hub-text" id="funnel-short-title">
          Funnel
        </h2>
        <a
          className="tap inline-flex items-center rounded-full px-2 type-label text-hub-label no-underline hover:text-hub-text"
          href={routeHref('outreach', 'funnel')}
        >
          Edit the numbers ›
        </a>
      </div>
      <dl className="surface-card px-4 py-1">
        {rows.map((row) => (
          <div
            className="grid min-h-13 grid-cols-[minmax(0,1fr)_auto_64px] items-center gap-3 border-b border-hub-hairline last:border-b-0"
            key={row.label}
          >
            <dt className="type-body text-hub-text">{row.label}</dt>
            <dd className="type-body num font-semibold text-hub-text">{formatInteger(row.value)}</dd>
            <dd
              className={cn(
                'type-caption num justify-self-end rounded-full px-2 py-1 font-semibold',
                row.rate === '–' ? 'bg-hub-chip text-hub-label' : 'bg-hub-done-pill text-hub-positive',
              )}
            >
              <span className="sr-only">Share of the row before: </span>
              {row.rate}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The hero card, the DM counter of today, the bar chart by range, the funnel and the DM totals. */
export function OverviewTab() {
  const today = useToday();
  const days = useHub((state) => state.days);
  const dmTarget = useHub((state) => state.dmTarget);
  const baseContacted = useHub((state) => state.baseContacted);
  const startDate = useHub((state) => state.startDate);
  const [range, setRange] = useState<OutreachRange>('week');

  const view = useMemo(
    () => outreachOverview({ days, dmTarget, baseContacted, startDate }, today),
    [days, dmTarget, baseContacted, startDate, today],
  );
  const bars = useMemo(() => outreachBars({ days, dmTarget, startDate }, today, range), [days, dmTarget, startDate, today, range]);
  const recover = useMemo(() => momentum(days, today, dmTarget).state === 'recover', [days, today, dmTarget]);

  return (
    <div className="grid gap-6">
      {recover ? (
        <Notice announce={false} kind="NOTE">
          You missed yesterday. Send the DMs today to keep the streak.
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="grid content-start gap-4 lg:col-span-7">
          <HeroCard contacted={view.contacted} target={view.target} />
          <SegmentedSwitch
            label="Time range"
            onChange={setRange}
            options={OUTREACH_RANGES.map((id) => ({ id, label: OUTREACH_RANGE_LABELS[id] }))}
            value={range}
          />
          <Card aria-label="DMs a day">
            <OutreachBarChart view={bars} />
          </Card>
        </div>
        <div className="grid content-start gap-4 lg:col-span-5">
          <Card aria-labelledby="outreach-today-title">
            <DmCounter
              date={today}
              heading={
                <CardTitle id="outreach-today-title">Today</CardTitle>
              }
            />
          </Card>
          <FunnelRows />
        </div>
      </div>

      <section aria-label="Outreach numbers" className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
        <StatCard
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
