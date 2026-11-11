import { useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Area, AreaChart } from '@/components/charts/area-chart';
import {
  selectTooltipData,
  useChartHoverSelector,
  useChartPortalContainer,
  useChartStable,
} from '@/components/charts/chart-context';
import { Grid } from '@/components/charts/grid';
import { XAxis } from '@/components/charts/x-axis';
import { formatShort, isDateKey, parseKey } from '@/lib/dates';
import { formatInteger } from '@/lib/format';
import { CHART_ENTER, CHART_ENTER_MS, NO_MOTION } from '@/lib/motion';
import type { ChartPoint } from '@/lib/summary';
import { cn } from '@/lib/utils';
import { type ChartTone, TONE_COLOR, TONE_GLOW } from './tones';

interface HubAreaChartProps {
  data: readonly ChartPoint[];
  /** The text alternative, for example "Cumulative R for each trade". */
  label: string;
  tone?: ChartTone;
  /** A horizontal dashed line at this value. */
  target?: number;
  targetLabel?: string;
  formatValue?: (value: number) => string;
  /** Changes an x label into display text. Date keys get a short date by default. */
  formatLabel?: (label: string) => string;
  height?: number;
  className?: string;
}

const VALUE_KEY = 'value';
const TARGET_KEY = 'target';
const MARGIN = { top: 40, right: 16, bottom: 32, left: 16 } as const;
/** Half of the largest pill width. It keeps the pill in the chart box. */
const PILL_HALF_WIDTH = 56;

function defaultLabel(label: string): string {
  return isDateKey(label) ? formatShort(label) : label;
}

/** The x position of each point as a local date. Text labels get one day for each index. */
function toDates(data: readonly ChartPoint[]): Date[] {
  const parsed = data.map((point) => (isDateKey(point.label) ? parseKey(point.label) : null));
  if (parsed.every((date) => date !== null)) {
    return parsed.filter((date) => date !== null);
  }
  return data.map((_, index) => new Date(2000, 0, 1 + index));
}

interface PlotPoint {
  index: number;
  x: number;
  y: number;
}

/** The pixel position of the last data point. */
function useLastPoint(): PlotPoint | null {
  const { data, xScale, yScale, xAccessor } = useChartStable();
  const index = data.length - 1;
  const row = data[index];
  const value = row?.[VALUE_KEY];
  if (!row || typeof value !== 'number') {
    return null;
  }
  return { index, x: xScale(xAccessor(row)) ?? 0, y: yScale(value) ?? 0 };
}

/** The hovered point. Falls back to the last point. */
function useActivePoint(): (PlotPoint & { hovered: boolean }) | null {
  const tooltip = useChartHoverSelector(selectTooltipData);
  const last = useLastPoint();
  const hoveredY = tooltip?.yPositions[VALUE_KEY];
  if (tooltip && hoveredY !== undefined) {
    return { index: tooltip.index, x: tooltip.x, y: hoveredY, hovered: true };
  }
  return last ? { ...last, hovered: false } : null;
}

function TargetLine({ value, text }: { value: number; text?: string }) {
  const { yScale, innerWidth } = useChartStable();
  const y = yScale(value) ?? 0;
  return (
    <g pointerEvents="none">
      <line
        stroke="var(--hub-label)"
        strokeDasharray="5 5"
        strokeLinecap="round"
        strokeWidth={1.5}
        x1={0}
        x2={innerWidth}
        y1={y}
        y2={y}
      />
      {text ? (
        <text
          fill="var(--hub-label)"
          fontSize={11}
          fontWeight={500}
          textAnchor="start"
          x={0}
          y={y < 16 ? y + 14 : y - 6}
        >
          {text}
        </text>
      ) : null}
    </g>
  );
}

/** A dot with a soft halo on the last value. */
function LastDot({ color }: { color: string }) {
  const last = useLastPoint();
  const { innerHeight } = useChartStable();
  if (!last || innerHeight <= 0) {
    return null;
  }
  return (
    <g pointerEvents="none">
      <circle cx={last.x} cy={last.y} fill={color} opacity={0.25} r={10} />
      <circle
        cx={last.x}
        cy={last.y}
        fill={color}
        r={4.5}
        stroke="var(--hub-surface)"
        strokeWidth={2}
      />
    </g>
  );
}

/** A vertical line and a dot on the hovered point. */
function HoverMarker({ color }: { color: string }) {
  const active = useActivePoint();
  const { innerHeight } = useChartStable();
  if (!active?.hovered) {
    return null;
  }
  return (
    <g pointerEvents="none">
      <line
        stroke="var(--hub-label)"
        strokeDasharray="3 4"
        strokeWidth={1}
        x1={active.x}
        x2={active.x}
        y1={active.y}
        y2={innerHeight}
      />
      <circle
        cx={active.x}
        cy={active.y}
        fill={color}
        r={5}
        stroke="var(--hub-text)"
        strokeWidth={2}
      />
    </g>
  );
}

interface ValuePillProps {
  labels: readonly string[];
  formatValue: (value: number) => string;
}

/** A pill above the hovered point. It stays on the last point when there is no hover. */
function ValuePill({ labels, formatValue }: ValuePillProps) {
  const { containerRef, data, margin, width } = useChartStable();
  const container = useChartPortalContainer(containerRef);
  const active = useActivePoint();
  if (!container || !active) {
    return null;
  }
  const value = data[active.index]?.[VALUE_KEY];
  if (typeof value !== 'number') {
    return null;
  }
  const centre = active.x + margin.left;
  const left = Math.min(
    Math.max(centre, PILL_HALF_WIDTH),
    Math.max(width - PILL_HALF_WIDTH, PILL_HALF_WIDTH),
  );
  return createPortal(
    <div
      className="pointer-events-none absolute z-10 flex max-w-28 -translate-x-1/2 -translate-y-full items-baseline gap-2 rounded-full border border-hub-hairline bg-hub-raised px-2 py-1 shadow-lg"
      style={{ left, top: active.y + margin.top - 12 }}
    >
      <span className="type-label font-semibold text-hub-text num">{formatValue(value)}</span>
      <span className="truncate type-label text-hub-label">{labels[active.index]}</span>
    </div>,
    container,
  );
}

/**
 * A smooth curve with a gradient fill, a glowing dot on the last value,
 * a value pill, and an optional target line. A wrapper for the Bklit AreaChart.
 */
export function HubAreaChart({
  data,
  label,
  tone = 'primary',
  target,
  targetLabel,
  formatValue = formatInteger,
  formatLabel = defaultLabel,
  height = 200,
  className,
}: HubAreaChartProps) {
  const reduced = useReducedMotion();
  const color = TONE_COLOR[tone];
  const hasTarget = target !== undefined && Number.isFinite(target);

  const rows = useMemo<Record<string, unknown>[]>(() => {
    const dates = toDates(data);
    return data.map((point, index) => ({
      x: dates[index],
      [VALUE_KEY]: point.value,
      ...(hasTarget ? { [TARGET_KEY]: target } : {}),
    }));
  }, [data, hasTarget, target]);

  const labels = useMemo(() => data.map((point) => formatLabel(point.label)), [data, formatLabel]);

  if (data.length === 0) {
    return (
      <div
        aria-label={`${label}. There is no data for this chart.`}
        className={cn(
          'flex w-full min-w-0 items-center justify-center rounded-control bg-hub-track px-4 text-center',
          className,
        )}
        role="img"
        style={{ height }}
      >
        <p className="type-body text-hub-label">There is no data for this chart.</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full min-w-0', className)}>
      <div
        aria-label={label}
        className={cn('w-full min-w-0 pointer-coarse:pointer-events-none', TONE_GLOW[tone])}
        role="img"
      >
        <AreaChart
          animationDuration={reduced ? 0 : CHART_ENTER_MS}
          aspectRatio="auto"
          data={rows}
          enterTransition={reduced ? NO_MOTION : CHART_ENTER}
          margin={MARGIN}
          style={{ height }}
          xDataKey="x"
          yDomainTween={false}
        >
          <Grid horizontal numTicksRows={4} stroke="var(--hub-track)" />
          <Area
            dataKey={VALUE_KEY}
            fill={color}
            fillOpacity={0.35}
            stroke={color}
            strokeWidth={2.5}
          />
          {hasTarget ? (
            <Area
              animate={false}
              dataKey={TARGET_KEY}
              fill={color}
              fillOpacity={0}
              showHighlight={false}
              showLine={false}
            />
          ) : null}
          {hasTarget ? <TargetLine text={targetLabel} value={target} /> : null}
          <LastDot color={color} />
          <HoverMarker color={color} />
          <ValuePill formatValue={formatValue} labels={labels} />
          <XAxis labels={labels} numTicks={4} />
        </AreaChart>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((point, index) => (
            <tr key={`${point.label}-${index}`}>
              <th scope="row">{labels[index]}</th>
              <td>{formatValue(point.value)}</td>
            </tr>
          ))}
          {hasTarget ? (
            <tr>
              <th scope="row">{targetLabel ?? 'Target'}</th>
              <td>{formatValue(target)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
