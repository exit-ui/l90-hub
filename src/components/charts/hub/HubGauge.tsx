import { useMotionValueEvent, useReducedMotion, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';
import { Gauge } from '@/components/charts/gauge';
import { formatInteger } from '@/lib/format';
import { GAUGE_SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { TONE_GRADIENT } from './tones';

interface HubGaugeProps {
  value: number;
  /** The daily limit. The arc is full when the value is equal to the limit. */
  limit: number;
  /** The text alternative, for example "Chart checks today: 3 of 5". */
  label: string;
  className?: string;
}

const EMPTY_HEIGHT = 160;
const ARC_THICKNESS = 0.085;

/** The fill of the arc as a percentage from 0 to 100. */
function fillPercent(value: number, limit: number): number {
  if (limit <= 0) {
    return value > 0 ? 100 : 0;
  }
  return Math.min(100, Math.max(0, (value / limit) * 100));
}

/**
 * A thick arc that shows a value against a limit, with the two numbers in the centre.
 * The arc uses the danger colour when the value is more than the limit.
 * A wrapper for the Bklit Gauge. The fill moves with a spring.
 */
export function HubGauge({ value, limit, label, className }: HubGaugeProps) {
  const reduced = useReducedMotion();
  const valid = Number.isFinite(value) && Number.isFinite(limit);
  const target = valid ? fillPercent(value, limit) : 0;
  const over = valid && value > limit;
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
    setShown(Math.min(100, Math.max(0, latest)));
  });

  if (!valid) {
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
    <div className={cn('w-full min-w-0', className)}>
      <div
        aria-label={label}
        className="relative mx-auto w-full max-w-60 min-w-0"
        role="img"
      >
        {/* Bklit fades the track in for 450 ms. The static mode stops that; the spring above moves the fill. */}
        <Gauge
          activeFill={over ? 'var(--hub-amber)' : TONE_GRADIENT.data}
          arcStyle="solid"
          arcThickness={ARC_THICKNESS}
          geometryScrubbing
          inactiveFill="var(--hub-track)"
          inactiveFillOpacity={1}
          minWidth={0}
          value={shown}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={cn('type-number num', over ? 'text-hub-amber' : 'text-hub-text')}>
            {formatInteger(value)}
          </span>
          <span className="type-label text-hub-label">of {formatInteger(limit)}</span>
        </div>
      </div>
      <p className="sr-only">
        {label}. Value: {formatInteger(value)}. Limit: {formatInteger(limit)}.
        {over ? ' The value is more than the limit.' : ''}
      </p>
    </div>
  );
}
