import { useMotionValueEvent, useReducedMotion, useSpring } from 'motion/react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Ring } from '@/components/charts/ring';
import { RingChart } from '@/components/charts/ring-chart';
import type { RingData } from '@/components/charts/ring-context';
import { CHART_ENTER, GAUGE_SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { type ChartTone, TONE_GRADIENT } from './tones';

interface ProgressRingProps {
  value: number;
  max: number;
  /** The text alternative, for example "Day 22 of 90". */
  label: string;
  size?: number;
  strokeWidth?: number;
  tone?: ChartTone;
  /** The content in the centre of the ring. */
  children?: ReactNode;
  className?: string;
}

/**
 * A thick ring with a gradient stroke and round ends.
 * A wrapper for the Bklit RingChart. The fill moves with a spring.
 */
export function ProgressRing({
  value,
  max,
  label,
  size = 120,
  strokeWidth = 12,
  tone = 'primary',
  children,
  className,
}: ProgressRingProps) {
  const reduced = useReducedMotion();
  const safeMax = max > 0 ? max : 1;
  const target = Math.min(safeMax, Math.max(0, value));
  const spring = useSpring(target, GAUGE_SPRING);
  const [shown, setShown] = useState(target);

  useEffect(() => {
    if (reduced) {
      spring.jump(target);
    } else {
      spring.set(target);
    }
  }, [reduced, spring, target]);

  useMotionValueEvent(spring, 'change', (latest) => {
    setShown(Math.min(safeMax, Math.max(0, latest)));
  });

  const data = useMemo<RingData[]>(
    () => [{ label, value: shown, maxValue: safeMax, color: TONE_GRADIENT[tone] }],
    [label, shown, safeMax, tone],
  );

  return (
    <div
      aria-label={label}
      className={cn('relative shrink-0', className)}
      role="img"
      style={{ width: size, height: size }}
    >
      <div>
        <RingChart
          baseInnerRadius={size / 2 - strokeWidth - 4}
          data={data}
          enterStaggerScale={0}
          enterTransition={CHART_ENTER}
          padding={4}
          size={size}
          strokeWidth={strokeWidth}
        >
          <Ring index={0} lineCap="round" showGlow={false} />
        </RingChart>
      </div>
      {children ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}
