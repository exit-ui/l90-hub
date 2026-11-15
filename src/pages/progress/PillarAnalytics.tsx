import { useReducedMotion } from 'motion/react';
import { type KeyboardEvent, type PointerEvent, useMemo, useRef, useState } from 'react';
import { PillarGlyph } from '@/components/shared/PillarGlyph';
import { useSheetLanded } from '@/hooks/useSheetLanded';
import { formatShort } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import {
  type AnalyticsMetric,
  ANALYTICS_RANGES,
  type AnalyticsPillar,
  type AnalyticsPoint,
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
/** The range inside a sentence: "in the last 7 days". */
const RANGE_IN: Readonly<Record<AnalyticsRange, string>> = { 7: 'in the last 7 days', 30: 'in the last 30 days', 90: 'in the 90 days' };

/** Bars animate in only for short ranges: a few animated layers are cheap, ninety are not. */
const ANIMATED_BARS_MAX = 30;

interface ChartProps {
  points: readonly AnalyticsPoint[];
  metric: AnalyticsMetric;
  range: AnalyticsRange;
  today: DateKey;
  average: number;
}

/**
 * The bar chart: hatched bars, the days at the goal in the pillar colour, the selected day solid with a cap.
 * Drag a finger across it, or use the arrow keys, to read each day in the line above. It is a slider.
 */
function AnalyticsChart({ points, metric, range, today, average }: ChartProps) {
  const reduced = useReducedMotion();
  const last = points.reduce((found, point, index) => (point.value === null ? found : index), -1);
  const [sel, setSel] = useState(last);
  const dragging = useRef(false);

  const signed = metric.signed && points.some((point) => (point.value ?? 0) < 0);
  const scale = Math.max(1, ...points.map((point) => Math.abs(point.value ?? 0)), metric.goal ?? 0);
  const animate = points.length <= ANIMATED_BARS_MAX && !reduced;
  const gap = range === 90 ? 'gap-px' : range === 30 ? 'gap-0.5' : 'gap-2';

  const choose = (index: number) => {
    const point = points[index];
    if (point && point.value !== null && index !== sel) {
      haptic('tap');
      setSel(index);
    }
  };
  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    choose(Math.min(points.length - 1, Math.max(0, Math.floor(((event.clientX - box.left) / box.width) * points.length))));
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    for (let index = sel + step; index >= 0 && index < points.length; index += step) {
      if (points[index]?.value !== null) {
        choose(index);
        return;
      }
    }
  };

  const picked = points[sel];
  const readout =
    picked && picked.value !== null ? `${formatShort(picked.date)} · ${formatValue(picked.value, metric)}` : 'No data yet';

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p aria-live="polite" className="type-name num text-hub-text">
          {readout}
        </p>
        <p className="type-label num shrink-0 text-hub-label">
          Avg {formatValue(Math.round(average * 10) / 10, metric)}
          {metric.goal !== null ? ` · Goal ${formatValue(metric.goal, metric)}` : ''}
        </p>
      </div>
      <div
        aria-label="Chart. Drag or use the arrow keys to read each day."
        aria-valuemax={Math.max(0, points.length - 1)}
        aria-valuemin={0}
        aria-valuenow={Math.max(0, sel)}
        aria-valuetext={readout}
        className={cn('flex h-36 touch-pan-y items-stretch outline-none focus-visible:ring-2 focus-visible:ring-hub-focus', gap)}
        onKeyDown={onKey}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onPointerDown={(event) => {
          dragging.current = true;
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // A pointer that cannot be captured still works while it stays over the chart.
          }
          fromPointer(event);
        }}
        onPointerMove={(event) => {
          if (dragging.current) {
            fromPointer(event);
          }
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        role="slider"
        tabIndex={0}
      >
        {points.map((point, index) => {
          const value = point.value ?? 0;
          // A day still to come is a faint stub, so the whole range reads as a timeline.
          const height =
            point.value === null
              ? point.date > today
                ? 4
                : 0
              : Math.max(3, Math.round((Math.abs(value) / scale) * (signed ? 50 : 100)));
          const met = point.value !== null && (metric.goal === null ? value > 0 : value >= metric.goal);
          const selected = index === sel && point.value !== null;
          const fill =
            point.value === null
              ? 'bg-hub-chart-future'
              : selected
                ? 'border-t-[3px] border-hub-text bg-[var(--solid)] shadow-[0_0_18px_var(--soft)]'
                : met
                  ? 'bar-pillar'
                  : 'hatch';
          const style = { height: `${height}%`, animationDelay: animate ? `${Math.min(index, ANIMATED_BARS_MAX) * 14}ms` : undefined };
          return (
            <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col" key={point.date}>
              <div className={cn('flex flex-col justify-end', signed ? 'h-1/2' : 'h-full')}>
                {value >= 0 ? <div className={cn('rounded-t-md rounded-b-xs', fill, animate && 'bar-grow')} style={style} /> : null}
              </div>
              {signed ? (
                <div className="flex h-1/2 flex-col border-t border-hub-hairline">
                  {value < 0 ? <div className={cn('rounded-b-md bg-hub-negative/70', animate && 'bar-grow-down')} style={style} /> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between type-caption text-hub-label">
        <span>{points[0] ? formatShort(points[0].date) : ''}</span>
        <span>{range === 90 ? 'Day 90' : 'Today'}</span>
      </div>
    </>
  );
}

/**
 * The analytics of one pillar (v4), inside its view: the gradient header with the total and the change,
 * the range switch, the metric chips, a bar chart you can scrub, four stats, a breakdown and the recent days.
 * Everything comes from the stored record. The chart, the stats and the lists wait until the view has landed.
 */
export function PillarAnalytics({ pillar, today }: { pillar: AnalyticsPillar; today: DateKey }) {
  const reduced = useReducedMotion();
  const landed = useSheetLanded();
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

  const breakdownMax = Math.max(1, ...breakdown.rows.map((row) => row.value));
  // R can be below zero, so its change is in R; a count changes in %.
  const diff = stats.previous === null ? null : Math.round((stats.total - stats.previous) * 10) / 10;
  const change =
    metric.signed && diff !== null
      ? { up: diff >= 0, text: `${diff >= 0 ? '↑' : '↓'} ${formatValue(Math.abs(diff), { ...metric, signed: false })} vs the ${range} days before` }
      : stats.change === null
        ? null
        : { up: stats.change >= 0, text: `${stats.change >= 0 ? '↑' : '↓'} ${Math.abs(stats.change)} % vs the ${range} days before` };
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
  const recent = stats.points
    .filter((point) => point.value !== null && point.value !== 0)
    .slice(-4)
    .reverse();
  const filterKey = `${metric.id}-${range}`;
  const empty = stats.counted === 0 || stats.activeDays === 0;

  return (
    <div className={cn('mt-2 grid gap-4', `tone-${pillar}`)}>
      <section aria-label={`${metric.label}, ${RANGE_WORDS[range]}`} className={cn('pillar-card grid gap-2 p-5', `pillar-${pillar}`)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="type-label text-white">
              {metric.label} · {RANGE_WORDS[range]}
            </p>
            <p className="num mt-1 text-[44px] leading-12 font-bold tracking-tight text-white">{formatValue(Math.round(stats.total * 10) / 10, metric)}</p>
          </div>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <PillarGlyph delayMs={320} id={pillar} play={reduced ? 0 : 1} size={28} />
          </span>
        </div>
        <p>
          <span
            className={cn(
              'type-label inline-flex rounded-full px-3 py-1 font-semibold',
              change?.up ? 'bg-[rgb(61_220_132/0.22)] text-[#a9f7cb]' : 'bg-white/15 text-white',
            )}
          >
            {change ? change.text : `Over ${RANGE_WORDS[range].replace(/^last/, 'the last')}`}
          </span>
        </p>
      </section>

      <div className="rise grid gap-2" style={{ ['--delay' as string]: '200ms' }}>
        <div aria-label="Range" className="flex w-fit gap-0.5 rounded-2xl bg-hub-chip p-1" role="group">
          {ANALYTICS_RANGES.map((value) => (
            <button
              aria-pressed={value === range}
              className={cn(
                'h-9 min-w-13 cursor-pointer rounded-[13px] px-3 type-label font-semibold transition-colors',
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

      {landed ? (
        <>
          <section aria-label="Chart" className="rise surface-card grid gap-2 p-4" key={filterKey} style={{ ['--delay' as string]: '0ms' }}>
            <AnalyticsChart average={stats.average} metric={metric} points={stats.points} range={range} today={today} />
            {empty ? <p className="type-label text-hub-label">Nothing logged {RANGE_IN[range]} yet. It will show here.</p> : null}
          </section>

          <dl className="rise grid grid-cols-2 gap-3" style={{ ['--delay' as string]: '60ms' }}>
            {statList.map((stat) => (
              <div className="surface-card grid gap-1 p-4" key={stat.label}>
                <dt className="type-caption text-hub-label">{stat.label}</dt>
                <dd className="num text-[22px] leading-7 font-bold tracking-tight text-hub-text">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <section aria-label={breakdown.title} className="rise surface-card grid gap-3 p-5" style={{ ['--delay' as string]: '120ms' }}>
            <h3 className="type-name text-hub-text">{breakdown.title}</h3>
            {breakdown.rows.length === 0 || breakdown.rows.every((row) => row.value === 0) ? (
              <p className="type-body text-hub-label">Nothing logged {RANGE_IN[range]} yet.</p>
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
                      style={{ width: `${Math.round((row.value / breakdownMax) * 100)}%`, animationDelay: `${180 + index * 60}ms` }}
                    />
                  </div>
                </div>
              ))
            )}
            {breakdown.note ? <p className="type-label text-hub-label">{breakdown.note}</p> : null}
          </section>

          {recent.length > 0 ? (
            <section aria-labelledby="recent-title" className="rise grid gap-2" style={{ ['--delay' as string]: '180ms' }}>
              <h3 className="type-section text-hub-text" id="recent-title">
                Recent
              </h3>
              <ul className="surface-card grid p-1.5">
                {recent.map((point) => (
                  <li className="flex min-h-15 items-center gap-3.5 px-2.5 py-1.5" key={point.date}>
                    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--soft)]">
                      <PillarGlyph className="[&_path]:stroke-[var(--solid)]" id={pillar} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="type-body block font-semibold text-hub-text">{formatShort(point.date)}</span>
                      <span className="type-caption block text-hub-label">{point.date === today ? `${metric.label} · Today` : metric.label}</span>
                    </span>
                    <span className="num type-body font-bold text-hub-text">{formatValue(point.value ?? 0, metric)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <div aria-hidden="true" className="min-h-[640px]" />
      )}
    </div>
  );
}
