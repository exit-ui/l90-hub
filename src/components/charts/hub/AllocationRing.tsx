import { CHART_PART_ENTER } from '@/lib/motion';
import { useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { PieChart } from '@/components/charts/pie-chart';
import type { PieData } from '@/components/charts/pie-context';
import { PieSlice } from '@/components/charts/pie-slice';
import { formatInteger, formatRate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface AllocationRingProps {
  /** One slice for each item. Items with a value of zero or less get no slice. */
  items: readonly { label: string; value: number }[];
  /** The text alternative, for example "Crypto allocation by coin". */
  label: string;
  formatValue?: (value: number) => string;
  className?: string;
}

const SLICE_COLORS = [
  'var(--hub-primary)',
  'var(--hub-accent)',
  'var(--hub-positive)',
  'var(--hub-amber)',
  'color-mix(in oklab, var(--hub-primary) 45%, var(--chart-scale-mix))',
  'color-mix(in oklab, var(--hub-accent) 50%, var(--chart-scale-mix))',
  'color-mix(in oklab, var(--hub-positive) 50%, var(--chart-scale-mix))',
  'color-mix(in oklab, var(--hub-amber) 50%, var(--chart-scale-mix))',
] as const;

const SIZE = 148;
const HOVER_OFFSET = 6;
const RING_WIDTH = 24;
const INNER_RADIUS = SIZE / 2 - HOVER_OFFSET - RING_WIDTH;
const ENTER = CHART_PART_ENTER;
/** The delay of the last slice, in seconds. Bklit starts slice n at 0.1 + 0.08 n. */
const LAST_SLICE_DELAY = 0.15;

function sliceColor(index: number): string {
  return SLICE_COLORS[index % SLICE_COLORS.length] ?? SLICE_COLORS[0];
}

/**
 * A thick donut ring with a legend that shows the share of each item.
 * A wrapper for the Bklit PieChart.
 */
export function AllocationRing({
  items,
  label,
  formatValue = formatInteger,
  className,
}: AllocationRingProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);

  const slices = useMemo<PieData[]>(
    () =>
      items
        .filter((item) => Number.isFinite(item.value) && item.value > 0)
        .map((item, index) => ({ label: item.label, value: item.value, color: sliceColor(index) })),
    [items],
  );
  const total = useMemo(() => slices.reduce((sum, slice) => sum + slice.value, 0), [slices]);

  if (slices.length === 0 || total <= 0) {
    return (
      <div
        aria-label={`${label}. There is no data for this chart.`}
        className={cn(
          'flex w-full min-w-0 items-center justify-center rounded-control bg-hub-track px-4 text-center',
          className,
        )}
        role="img"
        style={{ height: SIZE }}
      >
        <p className="type-body text-hub-label">There is no data for this chart.</p>
      </div>
    );
  }

  const staggerScale = reduced
    ? 0
    : LAST_SLICE_DELAY / (0.1 + 0.08 * Math.max(slices.length - 1, 0));

  return (
    <div className={cn('flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-4', className)}>
      <div
        aria-label={label}
        className="relative mx-auto shrink-0"
        role="img"
        style={{ width: SIZE, height: SIZE }}
      >
        <PieChart
          cornerRadius={5}
          data={slices}
          enterStaggerScale={staggerScale}
          enterTransition={ENTER}
          hoveredIndex={hovered}
          hoverOffset={HOVER_OFFSET}
          innerRadius={INNER_RADIUS}
          onHoverChange={setHovered}
          padAngle={slices.length > 1 ? 0.04 : 0}
          size={SIZE}
        >
          {slices.map((slice, index) => (
            <PieSlice animate={!reduced} index={index} key={`${index}-${slice.label}`} />
          ))}
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="type-label text-hub-label">Total</span>
          <span className="max-w-20 truncate type-body font-semibold text-hub-text num">
            {formatValue(total)}
          </span>
        </div>
      </div>
      <div className="min-w-36 flex-1">
        <p className="sr-only">{label}. The share of each item:</p>
        <ul className="flex flex-col gap-2">
          {slices.map((slice, index) => (
            <li
              className={cn(
                'flex min-w-0 items-center gap-2 type-body transition-opacity duration-150',
                hovered !== null && hovered !== index ? 'opacity-50' : 'opacity-100',
              )}
              key={`${index}-${slice.label}`}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="max-w-24 shrink-0 truncate font-medium text-hub-text">{slice.label}</span>
              <span className="min-w-0 flex-1 truncate text-right type-label text-hub-label num">
                {formatValue(slice.value)}
              </span>
              <span className="w-14 shrink-0 text-right font-semibold text-hub-text num">
                {formatRate(slice.value / total)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
