import { NO_MOTION } from '@/lib/motion';
import { useReducedMotion } from 'motion/react';
import { useId, useMemo } from 'react';
import { Bar } from '@/components/charts/bar';
import { BarChart } from '@/components/charts/bar-chart';
import { BarXAxis } from '@/components/charts/bar-x-axis';
import { useChartStable, useYScale } from '@/components/charts/chart-context';
import { Grid } from '@/components/charts/grid';
import { ChartTooltip } from '@/components/charts/tooltip';
import { formatInteger } from '@/lib/format';
import type { ChartPoint } from '@/lib/summary';
import { cn } from '@/lib/utils';

interface HubBarChartProps {
  /** One bar for each point. The labels must be different. Values can be negative. */
  data: readonly ChartPoint[];
  /** The text alternative, for example "Result in R for each trade". */
  label: string;
  formatValue?: (value: number) => string;
  height?: number;
  className?: string;
}

const MARGIN = { top: 12, right: 8, bottom: 32, left: 8 } as const;
const ENTER_SECONDS = 0.25;
const STAGGER_SECONDS = 0.1;
const ENTER = { duration: ENTER_SECONDS, ease: 'easeOut' } as const;
const ZERO_ROW = [0];

/**
 * One paint for all bars: the data colour above the zero line, the danger colour below it.
 * The Bklit Bar has one fill for each series, thus the sign split is a gradient with a hard stop.
 */
function SignGradient({ id }: { id: string }) {
  const { innerHeight } = useChartStable();
  const yScale = useYScale();
  const zeroY = yScale(0) ?? innerHeight;
  const zero = innerHeight > 0 ? Math.min(1, Math.max(0, zeroY / innerHeight)) : 1;
  return (
    <linearGradient
      gradientUnits="userSpaceOnUse"
      id={id}
      x1={0}
      x2={0}
      y1={0}
      y2={Math.max(innerHeight, 1)}
    >
      <stop offset={0} stopColor="var(--hub-positive)" />
      <stop offset={zero} stopColor="var(--hub-positive)" />
      <stop offset={zero} stopColor="var(--hub-danger)" />
      <stop offset={1} stopColor="var(--hub-danger)" />
    </linearGradient>
  );
}

/**
 * Bars with round ends and a zero baseline. Positive bars use the data colour.
 * Negative bars use the danger colour. A wrapper for the Bklit BarChart.
 */
export function HubBarChart({
  data,
  label,
  formatValue = formatInteger,
  height = 200,
  className,
}: HubBarChartProps) {
  const reduced = useReducedMotion();
  const gradientId = `hub-bar-sign-${useId().replace(/:/g, '')}`;

  const rows = useMemo<Record<string, unknown>[]>(
    () => data.map((point) => ({ name: point.label, value: point.value })),
    [data],
  );

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
      <div aria-label={label} className="w-full min-w-0" role="img" style={{ height }}>
        <BarChart
          animationDuration={reduced ? 0 : ENTER_SECONDS * 1000}
          aspectRatio="auto"
          barGap={0.3}
          className="h-full"
          data={rows}
          enterTransition={reduced ? NO_MOTION : ENTER}
          margin={MARGIN}
          xDataKey="name"
        >
          <SignGradient id={gradientId} />
          <Grid
            highlightRowStroke="var(--hub-label)"
            highlightRowValues={ZERO_ROW}
            horizontal
            numTicksRows={4}
            stroke="var(--hub-track)"
          />
          <Bar
            animate={!reduced}
            dataKey="value"
            fill={`url(#${gradientId})`}
            lineCap="round"
            minBarHeight={2}
            staggerDelay={reduced ? 0 : STAGGER_SECONDS / data.length}
            stroke="var(--hub-positive)"
          />
          <BarXAxis maxLabels={6} />
          <ChartTooltip
            content={({ point }) => (
              <div className="flex items-baseline gap-2 px-3 py-2">
                <span className="type-label text-chart-tooltip-muted">{String(point.name ?? '')}</span>
                <span className="type-body font-semibold text-chart-tooltip-foreground num">
                  {typeof point.value === 'number' ? formatValue(point.value) : ''}
                </span>
              </div>
            )}
            showCrosshair={false}
            showDatePill={false}
            showDots={false}
          />
        </BarChart>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((point, index) => (
            <tr key={`${point.label}-${index}`}>
              <th scope="row">{point.label}</th>
              <td>{formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
