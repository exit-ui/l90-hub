import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useId, useMemo, useRef } from 'react';
import { rememberCardHeight } from '@/pages/home/expand/cardHeights';
import { MotionChart } from '@/components/charts/hub/MotionChart';
import { useChartPrefs } from '@/hooks/useChartPrefs';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { chartModel, chartValueFormat } from '@/lib/chartModel';
import { formatShort } from '@/lib/dates';
import { BUTTON_TAP, CARD_RADIUS, SPRING } from '@/lib/motion';
import { missionClock } from '@/lib/phases';
import { toggleCompare } from '@/lib/prefs';
import {
  COMPARE_METRICS,
  defaultRange,
  isMetric,
  MAX_COMPARE,
  METRIC_INFO,
  METRICS,
  type Metric,
  MIN_COMPARE,
  RANGES,
  type Range,
} from '@/lib/progressSeries';
import { cn } from '@/lib/utils';
import type { DateKey } from '@/store/types';
import { useHub } from '@/store/useHub';

interface ProgressChartProps {
  today: DateKey;
  /** "compact" on Today, "full" with the compare mode on Progress. */
  variant: 'compact' | 'full';
  className?: string;
}

const MENU_ITEM =
  'flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-control px-3 type-body text-hub-text outline-none select-none data-highlighted:bg-hub-track data-disabled:cursor-not-allowed data-disabled:opacity-40';


interface MetricMenuProps {
  metric: Metric;
  compare: readonly (typeof COMPARE_METRICS)[number][];
  compareOn: boolean;
  onMetric: (metric: Metric) => void;
  onToggle: (metric: (typeof COMPARE_METRICS)[number]) => void;
}

/** An iOS-style pull-down menu. Arrow keys move, Enter picks, Escape closes. */
function MetricMenu({ metric, compare, compareOn, onMetric, onToggle }: MetricMenuProps) {
  const first = compare[0] ?? 'dm';
  const buttonText = compareOn ? `${METRIC_INFO[first].short} +${compare.length - 1}` : METRIC_INFO[metric].short;
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={compareOn ? `Metrics: ${compare.map((item) => METRIC_INFO[item].label).join(', ')}` : `Metric: ${METRIC_INFO[metric].label}`}
        className="tap press inline-flex min-w-0 cursor-pointer items-center gap-1 rounded-full bg-hub-track px-3 type-body font-semibold text-hub-text rim-hairline hover:bg-hub-glass-edge data-popup-open:bg-hub-glass-edge"
      >
        <span className="truncate">{buttonText}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-hub-label-strong" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="start" className="z-50 outline-none" sideOffset={8}>
          <Menu.Popup className="glass-thick min-w-56 origin-(--transform-origin) rounded-card p-2 text-hub-text outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="relative z-3">
              {compareOn ? (
                <Menu.Group>
                  <Menu.GroupLabel className="px-3 py-2 type-label text-hub-label">
                    Pick 2 or 3 metrics. All show as % of target.
                  </Menu.GroupLabel>
                  {COMPARE_METRICS.map((item) => {
                    const checked = compare.includes(item);
                    const locked = checked ? compare.length <= MIN_COMPARE : compare.length >= MAX_COMPARE;
                    return (
                      <Menu.CheckboxItem
                        checked={checked}
                        className={MENU_ITEM}
                        closeOnClick={false}
                        disabled={locked}
                        key={item}
                        onCheckedChange={() => onToggle(item)}
                      >
                        {METRIC_INFO[item].label}
                        <Menu.CheckboxItemIndicator>
                          <Check aria-hidden="true" className="size-4 text-hub-positive" />
                        </Menu.CheckboxItemIndicator>
                      </Menu.CheckboxItem>
                    );
                  })}
                </Menu.Group>
              ) : (
                <Menu.RadioGroup
                  onValueChange={(value: unknown) => {
                    if (isMetric(value)) {
                      onMetric(value);
                    }
                  }}
                  value={metric}
                >
                  {METRICS.map((item) => (
                    <Menu.RadioItem className={MENU_ITEM} closeOnClick key={item} value={item}>
                      {METRIC_INFO[item].label}
                      <Menu.RadioItemIndicator>
                        <Check aria-hidden="true" className="size-4 text-hub-positive" />
                      </Menu.RadioItemIndicator>
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              )}
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function RangeControl({ value, onChange }: { value: Range; onChange: (range: Range) => void }) {
  const pillId = useId();
  return (
    <div aria-label="Range" className="flex shrink-0 items-center rounded-full bg-hub-track p-1 rim-hairline" role="group">
      {RANGES.map((range) => {
        const active = range === value;
        return (
          <motion.button
            aria-label={`${range} days`}
            aria-pressed={active}
            className={cn(
              'relative min-h-11 min-w-11 cursor-pointer rounded-full type-body font-semibold transition-colors',
              active ? 'text-hub-text' : 'text-hub-label-strong hover:text-hub-text',
            )}
            key={range}
            onClick={() => onChange(range)}
            type="button"
            whileTap={BUTTON_TAP}
          >
            {active ? (
              <motion.span className="glass-pill absolute inset-0 rounded-full" layoutId={pillId} transition={SPRING} />
            ) : null}
            <span className="relative">{range}D</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** The props of the chart card. */
interface CardOptions {
  /** On Today: the "Open full view" button and the shared title. */
  onOpen?: () => void;
  /** Show this many insights. Today shows 1, the full views show 2. */
  maxInsights?: number;
  /** Inside an expanded view: no card surface of its own. */
  embedded?: boolean;
}

/**
 * The motion chart card: a metric menu, a 7D · 30D · 90D control, the chart,
 * the insights and the data as a table. The full variant also has the compare mode.
 */
export function ProgressChart({
  today,
  variant,
  className,
  onOpen,
  maxInsights = 2,
  embedded = false,
}: ProgressChartProps & CardOptions) {
  const days = useHub((state) => state.days);
  const weekTemplate = useHub((state) => state.weekTemplate);
  const startDate = useHub((state) => state.startDate);
  const fitness = useHub((state) => state.fitness);
  const learning = useHub((state) => state.learning);
  const trades = useHub((state) => state.trades);
  const dmTarget = useHub((state) => state.dmTarget);
  const fitTarget = useHub((state) => state.fitTarget);
  const learnTarget = useHub((state) => state.learnTarget);
  const [prefs, setPrefs] = useChartPrefs();
  const wide = useMediaQuery('(min-width: 1024px)');
  const titleId = useId();

  const full = variant === 'full';
  const compareOn = full && prefs.compareOn;
  const range = prefs.range ?? defaultRange(missionClock(today, startDate).day);

  const model = useMemo(
    () =>
      chartModel(
        { days, weekTemplate, startDate, fitness, learning, trades },
        { dmTarget, fitTarget, learnTarget },
        { metric: prefs.metric, range, compare: compareOn ? prefs.compare : [] },
        today,
      ),
    [days, weekTemplate, startDate, fitness, learning, trades, dmTarget, fitTarget, learnTarget, prefs.metric, prefs.compare, range, compareOn, today],
  );
  const format = useMemo(() => chartValueFormat(prefs.metric, compareOn), [prefs.metric, compareOn]);
  const height = full ? 320 : wide ? 240 : 200;
  const insights = model.insights.slice(0, maxInsights);
  const card = useRef<HTMLElement>(null);
  const openable = onOpen !== undefined;
  useEffect(() => {
    const element = card.current;
    if (!openable || !element) {
      return;
    }
    const observer = new ResizeObserver(() => rememberCardHeight('progress', element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [openable]);

  const controls = (
    <div className="flex min-w-0 items-center gap-2">
      <MetricMenu
        compare={prefs.compare}
        compareOn={compareOn}
        metric={prefs.metric}
        onMetric={(metric) => setPrefs({ metric })}
        onToggle={(metric) => setPrefs({ compare: toggleCompare(prefs.compare, metric) })}
      />
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <RangeControl onChange={(next) => setPrefs({ range: next })} value={range} />
        {full ? (
          <motion.button
            aria-label="Compare metrics"
            aria-pressed={compareOn}
            className={cn(
              'tap inline-flex cursor-pointer items-center justify-center rounded-full rim-hairline transition-colors',
              compareOn ? 'bg-hub-glass-edge text-hub-text' : 'bg-hub-track text-hub-label-strong hover:text-hub-text',
            )}
            onClick={() => setPrefs({ compareOn: !prefs.compareOn })}
            title="Compare metrics"
            type="button"
            whileTap={BUTTON_TAP}
          >
            <Layers aria-hidden="true" className="size-5" />
          </motion.button>
        ) : null}
      </div>
    </div>
  );

  const content = (
    <>
      {model.mode === 'compare' ? (
        <ul aria-label="Key" className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {model.lines.map((line) => (
            <li className="type-label flex items-center gap-2 text-hub-label-strong" key={line.key}>
              <svg aria-hidden="true" height="8" width="24">
                <line stroke={line.color} strokeDasharray={line.dash} strokeLinecap="round" strokeWidth="2" x1="1" x2="23" y1="4" y2="4" />
              </svg>
              {line.label}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        <MotionChart
          bars={model.bars}
          formatValue={format}
          height={height}
          label={model.summary}
          lines={model.lines}
          projection={model.projection}
          reference={model.reference}
          today={today}
          yAxisLabel={model.yAxisLabel ?? undefined}
        />
      </div>

      {insights.length > 0 ? (
        <ul aria-label="Insights" className="mt-2 grid gap-2">
          {insights.map((insight) => (
            <li className="type-body text-hub-label-strong" key={insight.kind}>
              {insight.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body mt-2 text-hub-label">Log a few more days. Then the chart shows insights here.</p>
      )}

      <ChartTable columns={model.columns} format={format} rows={model.rows} summary={model.summary} />
    </>
  );

  if (embedded) {
    return (
      <section aria-label="Progress chart" className={cn('flex min-w-0 flex-col', className)}>
        {controls}
        {content}
      </section>
    );
  }

  return (
    <motion.section
      aria-labelledby={titleId}
      className={cn('surface-card flex min-w-0 flex-col p-4 md:p-6', className)}
      layoutId={onOpen ? 'card-progress' : undefined}
      ref={card}
      style={{ borderRadius: CARD_RADIUS }}
    >
      {onOpen ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-nowrap">
          <h2 className="type-section text-hub-text" id={titleId}>
            <button
              aria-controls="view-progress"
              aria-expanded={false}
              aria-label="Open the Progress details."
              className="tap press -ml-2 inline-flex cursor-pointer items-center gap-1 rounded-control px-2 hover:bg-hub-inset"
              data-open-target="progress"
              onClick={onOpen}
              type="button"
            >
              <motion.span className="inline-block w-fit" layoutId="title-progress">
                Progress
              </motion.span>
              <ChevronRight aria-hidden="true" className="size-5 text-hub-label" />
            </button>
          </h2>
          <div className="w-full lg:ml-auto lg:w-auto">{controls}</div>
        </div>
      ) : (
        <>
          <h2 className="sr-only" id={titleId}>
            Daily progress chart
          </h2>
          {controls}
        </>
      )}
      {content}
    </motion.section>
  );
}

interface ChartTableProps {
  summary: string;
  columns: readonly string[];
  rows: readonly { date: DateKey; values: readonly (number | null)[] }[];
  format: (value: number) => string;
}

/** "Show data as a table": a real table of the visible points, behind a disclosure. */
export function ChartTable({ summary, columns, rows, format }: ChartTableProps) {
  return (
    <details className="group mt-2">
      <summary className="tap press type-label -mx-2 inline-flex cursor-pointer list-none items-center gap-2 rounded-full px-2 text-hub-label-strong hover:text-hub-text [&::-webkit-details-marker]:hidden">
        <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-150 group-open:rotate-180" />
        Show data as a table
      </summary>
      <div aria-label="Chart data" className="mt-2 max-h-64 overflow-auto rounded-control bg-hub-inset" role="region" tabIndex={0}>
        <table className="type-label num w-full text-left">
          <caption className="sr-only">{summary}</caption>
          <thead>
            <tr>
              <th className="sticky top-0 bg-hub-surface px-3 py-2 text-hub-label" scope="col">
                Date
              </th>
              {columns.map((column) => (
                <th className="sticky top-0 bg-hub-surface px-3 py-2 text-right text-hub-label" key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-hub-hairline" key={row.date}>
                <th className="px-3 py-2 font-normal text-hub-label-strong" scope="row">
                  {formatShort(row.date)}
                </th>
                {row.values.map((value, index) => (
                  <td className="px-3 py-2 text-right text-hub-text" key={columns[index] ?? index}>
                    {value === null ? '–' : format(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
