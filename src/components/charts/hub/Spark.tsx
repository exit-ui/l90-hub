import { AreaSparkline, BarSparkline } from '@/components/charts/sparkline';
import type { ChartPoint } from '@/lib/summary';
import { CHART_ENTER_MS } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { type ChartTone, TONE_COLOR } from './tones';

interface SparkProps {
  data: readonly ChartPoint[];
  /** The text alternative, for example "DMs for the last 14 days". */
  label: string;
  tone?: ChartTone;
  variant?: 'area' | 'bar';
  height?: number;
  className?: string;
}

/**
 * A small chart for a summary card: a smooth curve, a gradient area fill,
 * and a dot on the last value. A wrapper for the Bklit Sparkline.
 */
export function Spark({
  data,
  label,
  tone = 'primary',
  variant = 'area',
  height = 44,
  className,
}: SparkProps) {
  if (data.length < 2) {
    return (
      <div
        aria-label={`${label}. There is not sufficient data for a chart.`}
        className={cn('flex items-end', className)}
        role="img"
        style={{ height }}
      >
        <div className="h-px w-full bg-hub-track" />
      </div>
    );
  }

  const shared = {
    'aria-label': label,
    animationDuration: CHART_ENTER_MS,
    color: TONE_COLOR[tone],
    data,
    dataKey: 'value',
    dataTransitionDuration: CHART_ENTER_MS,
    height,
    interactive: false,
  } as const;

  return (
    <div className={cn('min-w-0', className)}>
      {variant === 'bar' ? (
        <BarSparkline {...shared} barGap={3} barRadius={3} />
      ) : (
        <AreaSparkline {...shared} endDot fill="gradient" fillOpacity={0.35} strokeWidth={2} />
      )}
    </div>
  );
}
