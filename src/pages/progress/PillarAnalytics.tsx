import { useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { PillarGlyph } from '@/components/shared/PillarGlyph';
import { formatShort } from '@/lib/dates';
import {
  ANALYTICS_RANGES,
  type AnalyticsPillar,
  type AnalyticsRange,
  formatValue,
  metricsOf,
  pillarBreakdown,
  pillarStats,
} from '@/lib/pillarAnalytics';
import { cn } from '@/lib/utils';
import type { DateKey } from '@/store/types';
import { useHub } from '@/store/useHub';
import { useShallow } from 'zustand/react/shallow';

const RANGE_LABELS: Readonly<Record<AnalyticsRange, string>> = { 7: '7D', 30: '30D', 90: '90D' };
const RANGE_WORDS: Readonly<Record<AnalyticsRange, string>> = { 7: 'last 7 days', 30: 'last 30 days', 90: 'the 90 days' };

/**
 * The analytics of one pillar (v3), inside its view: the gradient header with the total, the range switch,
 * the metric chips, a bar chart, four stats and a breakdown. Changing a filter grows the bars again.
 */
export function PillarAnalytics({ pillar, today }: { pillar: AnalyticsPillar; today: DateKey }) {
  const reduced = useReducedMotion();
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
  const metrics = useMemo(() => metricsOf(pillar, state), [pillar, state]);
  const [metricIndex, setMetricIndex] = useState(0);
  const [range, setRange] = useState<AnalyticsRange>(7);
  const metric = metrics[Math.min(metricIndex, metrics.length - 1)] ?? metrics[0]!;
  const stats = useMemo(() => pillarStats(state, pillar, metric, range, today), [state, pillar, metric, range, today]);
  const breakdown = useMemo(() => pillarBreakdown(state, pillar, range, today), [state, pillar, range, today]);

  const scale = Math.max(1, ...stats.points.map((point) => Math.abs(point.value ?? 0)), metric.goal ?? 0);
  const signed = metric.signed && stats.points.some((point) => (point.value ?? 0) < 0);
  const breakdownMax = Math.max(1, ...breakdown.rows.map((row) => row.value));
  const first = stats.points[0]?.date;
  // R can be below zero, so its change is in R; a count changes in %.
  const diff = stats.previous === null ? null : Math.round((stats.total - stats.previous) * 10) / 10;
  const changeLine =
    metric.signed && diff !== null
      ? `${diff >= 0 ? '↑' : '↓'} ${formatValue(Math.abs(diff), { ...metric, signed: false })} vs the ${range} days before`
      : stats.change === null
        ? `Over ${RANGE_WORDS[range]}`
        : `${stats.change >= 0 ? '↑' : '↓'} ${Math.abs(stats.change)} % vs the ${range} days before`;
  const goalStat =
    stats.goalHits === null
      ? { label: 'Active days', value: `${stats.activeDays} of ${stats.counted}` }
      : { label: 'Goal hit', value: `${stats.goalHits} of ${stats.counted}` };
  const statList = [
    { label: 'Best day', value: formatValue(stats.best, metric) },
    goalStat,
    { label: 'Streak', value: `${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}` },
    { label: 'Daily average', value: formatValue(Math.round(stats.average * 10) / 10, metric) },
  ];
  const filterKey = `${metric.id}-${range}`;

  return (
    <div className={cn('mt-2 grid gap-4', `tone-${pillar}`)}>
      <section aria-label={`${metric.label}, ${RANGE_WORDS[range]}`} className={cn('pillar-card grid gap-1 p-5', `pillar-${pillar}`)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="type-label text-white">
              {metric.label} · {RANGE_WORDS[range]}
            </p>
            <p className="num mt-1 text-[44px] leading-[48px] font-bold tracking-tight text-white">{formatValue(Math.round(stats.total * 10) / 10, metric)}</p>
            <p className="type-label text-white">{changeLine}</p>
          </div>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <PillarGlyph delayMs={320} id={pillar} play={reduced ? 0 : 1} size={28} />
          </span>
        </div>
      </section>

      <div className="rise grid gap-2" style={{ ['--delay' as string]: '320ms' }}>
        <div aria-label="Range" className="flex w-fit gap-0.5 rounded-full bg-hub-chip p-1" role="group">
          {ANALYTICS_RANGES.map((value) => (
            <button
              aria-pressed={value === range}
              className={cn(
                'h-9 min-w-13 cursor-pointer rounded-full px-3 type-label font-semibold transition-colors',
                value === range ? 'bg-hub-black text-hub-on-black' : 'text-hub-label hover:text-hub-text',
              )}
              key={value}
              onClick={() => setRange(value)}
              type="button"
            >
              {RANGE_LABELS[value]}
            </button>
          ))}
        </div>
        {metrics.length > 1 ? (
          <div aria-label="Metric" className="scroll-row -mx-4 flex gap-2 px-4 md:mx-0 md:px-0" role="group">
            {metrics.map((item, index) => (
              <button
                aria-pressed={item.id === metric.id}
                className={cn(
                  'h-10 shrink-0 cursor-pointer rounded-full border-[1.5px] px-4 type-label font-semibold transition-colors',
                  item.id === metric.id ? 'border-[var(--solid)] bg-[var(--soft)] text-hub-text' : 'border-transparent bg-hub-surface text-hub-label',
                )}
                key={item.id}
                onClick={() => setMetricIndex(index)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <section aria-label="Chart" className="rise surface-card grid gap-2 p-4" style={{ ['--delay' as string]: '380ms' }}>
        <div className="flex justify-between type-label text-hub-label">
          <span>Avg {formatValue(Math.round(stats.average * 10) / 10, metric)}</span>
          {metric.goal !== null ? <span>Goal {formatValue(metric.goal, metric)}</span> : null}
        </div>
        <div aria-hidden="true" className={cn('flex h-36 items-stretch', range === 90 ? 'gap-px' : range === 30 ? 'gap-0.5' : 'gap-2')} key={filterKey}>
          {stats.points.map((point, index) => {
            const value = point.value ?? 0;
            // A day still to come is a faint stub, so the whole range reads as a timeline.
            const height = point.value === null ? (point.date > today ? 4 : 0) : Math.max(3, Math.round((Math.abs(value) / scale) * (signed ? 50 : 100)));
            const met = metric.goal === null ? value > 0 : value >= metric.goal;
            const fill = point.value === null ? 'bg-hub-chart-future' : met ? 'bar-pillar' : 'bg-[var(--soft)]';
            const style = { height: `${height}%`, animationDelay: reduced ? '0ms' : `${380 + Math.min(index, 40) * 12}ms` };
            return (
              <div className="flex min-w-0 flex-1 flex-col" key={point.date}>
                <div className={cn('flex flex-col justify-end', signed ? 'h-1/2' : 'h-full')}>
                  {value >= 0 ? <div className={cn('bar-grow rounded-t-md rounded-b-xs', fill)} style={style} /> : null}
                </div>
                {signed ? (
                  <div className="flex h-1/2 flex-col border-t border-hub-hairline">
                    {value < 0 ? <div className="bar-grow-down rounded-b-md bg-hub-negative/70" style={style} /> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between type-caption text-hub-label">
          <span>{first ? formatShort(first) : ''}</span>
          <span>{range === 90 ? 'Day 90' : 'Today'}</span>
        </div>
      </section>

      <dl className="rise grid grid-cols-2 gap-3" style={{ ['--delay' as string]: '440ms' }}>
        {statList.map((stat) => (
          <div className="surface-card grid gap-1 p-4" key={stat.label}>
            <dt className="type-caption text-hub-label">{stat.label}</dt>
            <dd className="num text-[22px] leading-7 font-bold tracking-tight text-hub-text">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-label={breakdown.title} className="rise surface-card grid gap-3 p-5" style={{ ['--delay' as string]: '500ms' }}>
        <h3 className="type-name text-hub-text">{breakdown.title}</h3>
        {breakdown.rows.length === 0 || breakdown.rows.every((row) => row.value === 0) ? (
          <p className="type-body text-hub-label">Nothing logged in {RANGE_WORDS[range]} yet.</p>
        ) : (
          breakdown.rows.map((row, index) => (
            <div className="grid gap-1.5" key={row.label}>
              <div className="flex justify-between gap-3 type-body">
                <span className="truncate font-medium text-hub-text">{row.label}</span>
                <span className="num text-hub-label">{row.text}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-hub-track">
                <div
                  className="bar-wide bar-pillar h-full rounded-full"
                  key={`${filterKey}-${row.label}`}
                  style={{ width: `${Math.round((row.value / breakdownMax) * 100)}%`, animationDelay: `${560 + index * 60}ms` }}
                />
              </div>
            </div>
          ))
        )}
        {breakdown.note ? <p className="type-label text-hub-label">{breakdown.note}</p> : null}
      </section>
    </div>
  );
}
