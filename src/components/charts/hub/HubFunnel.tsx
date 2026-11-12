import { CHART_PART_ENTER, NO_MOTION } from '@/lib/motion';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import { FunnelChart, type FunnelStage } from '@/components/charts/funnel-chart';
import { formatInteger } from '@/lib/format';
import { cn } from '@/lib/utils';

interface HubFunnelProps {
  /** The stages from the top of the funnel to the bottom. The labels must be different. */
  stages: readonly { label: string; value: number }[];
  /** The text alternative, for example "Outreach funnel for 90 days". */
  label: string;
  className?: string;
}

const ROW_HEIGHT = 40;
const ROW_GAP = 4;
const EMPTY_HEIGHT = 160;
const ENTER = CHART_PART_ENTER;
/** The full enter stagger for all segments, in seconds. */
const STAGGER_SECONDS = 0.15;
/** The Bklit funnel draws a segment at 44% of the width for each side. */
const MAX_WIDTH_RATIO = 2.2;

/** The colour of a stage: the full green at the top, a lighter mix at the bottom. */
function stageColor(index: number, count: number): string {
  const share = count > 1 ? Math.round(100 - (index / (count - 1)) * 65) : 100;
  return `color-mix(in oklab, var(--hub-success-line) ${share}%, var(--chart-scale-mix))`;
}

/**
 * A vertical funnel with one text row for each stage. It stays readable on a phone.
 * A wrapper for the Bklit FunnelChart.
 */
export function HubFunnel({ stages, label, className }: HubFunnelProps) {
  const reduced = useReducedMotion();
  const count = stages.length;
  const first = stages[0]?.value ?? 0;
  const hasValues = stages.some((stage) => stage.value > 0);
  const height = count * ROW_HEIGHT + Math.max(count - 1, 0) * ROW_GAP;

  const funnelData = useMemo<FunnelStage[]>(
    () =>
      stages.map((stage, index) => ({
        label: stage.label,
        // The Bklit funnel sets each width from the first stage. The clamp keeps a segment in the box.
        value: Math.min(Math.max(stage.value, 0), Math.max(first, 0) * MAX_WIDTH_RATIO),
        color: stageColor(index, stages.length),
      })),
    [first, stages],
  );

  if (count === 0 || !hasValues) {
    return (
      <div
        aria-label={`${label}. There is no data for this chart.`}
        className={cn(
          'flex w-full min-w-0 items-center justify-center rounded-control bg-hub-track px-4 text-center',
          className,
        )}
        role="img"
        style={{ height: EMPTY_HEIGHT }}
      >
        <p className="type-body text-hub-label">There is no data for this chart.</p>
      </div>
    );
  }

  return (
    <div className={cn('flex w-full min-w-0 items-stretch gap-3', className)}>
      <div
        aria-label={label}
        className="w-[34%] max-w-40 shrink-0 overflow-hidden"
        role="img"
        style={{ height }}
      >
        {first > 0 ? (
          <MotionConfig reducedMotion="user">
            <FunnelChart
              data={funnelData}
              enterTransition={reduced ? NO_MOTION : ENTER}
              gap={ROW_GAP}
              layers={3}
              orientation="vertical"
              showLabels={false}
              showPercentage={false}
              showValues={false}
              staggerDelay={reduced ? 0 : STAGGER_SECONDS / count}
              style={{ aspectRatio: 'auto', height }}
            />
          </MotionConfig>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="sr-only">{label}. The values for each stage:</p>
        <ol className="flex flex-col" style={{ gap: ROW_GAP }}>
          {stages.map((stage, index) => (
            <li
              className="flex min-w-0 items-center justify-between gap-2 border-b border-hub-hairline last:border-b-0"
              key={`${stage.label}-${index}`}
              style={{ height: ROW_HEIGHT }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: stageColor(index, count) }}
                />
                <span className="line-clamp-2 type-label leading-tight text-hub-label">
                  {stage.label}
                </span>
              </span>
              <span className="shrink-0 type-body font-semibold text-hub-text num">
                {formatInteger(stage.value)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
