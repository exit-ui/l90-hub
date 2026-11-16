import { type KeyboardEvent, memo, type PointerEvent, useMemo, useRef } from 'react';
import { haptic } from '@/lib/haptics';

/** The width of one tick in px. */
const STEP = 14;

interface TicksProps {
  count: number;
  unit: number;
  every: number;
}

/** The ticks never change, so they draw once; only the track moves. */
const RulerTicks = memo(function RulerTicks({ count, unit, every }: TicksProps) {
  return (
    <>
      {Array.from({ length: count + 1 }, (_, index) => {
        const major = index % every === 0;
        return (
          <div className="flex shrink-0 flex-col items-center gap-1.5" key={index} style={{ width: STEP }}>
            <span className={major ? 'h-6.5 w-0.5 bg-hub-label' : 'h-3.5 w-0.5 bg-hub-faint'} />
            <span className="h-3.5 type-caption text-hub-label">{major ? index * unit : ''}</span>
          </div>
        );
      })}
    </>
  );
});

interface RulerProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  /** The smallest value. The marker cannot go below it. */
  min?: number;
  /** The largest value. */
  max?: number;
  /** What one tick is worth. The DM ruler counts 1 by 1; the timer counts 5 minutes by 5. */
  unit?: number;
  /** A tall, numbered tick comes every this many ticks. */
  every?: number;
  /** The words for a screen reader, for example "30 minutes". */
  valueText?: (value: number) => string;
}

/**
 * A ruler you drag sideways with an amber marker in the middle. By default it runs 0 to 30, one tick for each unit.
 * It is a slider for the keyboard (arrow keys, Home, End). The track moves by transform only.
 */
export function Ruler({ value, onChange, label, min = 0, max = 30, unit = 1, every = 5, valueText }: RulerProps) {
  const drag = useRef<{ x: number; start: number } | null>(null);
  const count = Math.round(max / unit);
  const index = value / unit;
  const shift = useMemo(() => `translateX(${-(index * STEP + STEP / 2)}px)`, [index]);

  const set = (next: number) => {
    const clamped = Math.max(min, Math.min(max, Math.round(next / unit) * unit));
    if (clamped !== value) {
      haptic('tap');
      onChange(clamped);
    }
  };

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, start: index };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A pointer that cannot be captured still works while it stays over the ruler.
    }
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current) {
      set(Math.round(drag.current.start - (event.clientX - drag.current.x) / STEP) * unit);
    }
  };
  const onUp = () => {
    drag.current = null;
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Readonly<Record<string, number>> = {
      ArrowLeft: value - unit,
      ArrowDown: value - unit,
      ArrowRight: value + unit,
      ArrowUp: value + unit,
      Home: min,
      End: max,
    };
    const next = moves[event.key];
    if (next !== undefined) {
      event.preventDefault();
      set(next);
    }
  };

  return (
    <div
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={value}
      aria-valuetext={valueText?.(value)}
      className="ruler relative h-19.5 overflow-hidden rounded-2xl bg-hub-inset outline-none focus-visible:ring-2 focus-visible:ring-hub-focus"
      onKeyDown={onKey}
      onPointerCancel={onUp}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      role="slider"
      tabIndex={0}
    >
      <div aria-hidden="true" className="absolute top-2 left-1/2 z-10 h-10 w-0.75 -translate-x-1/2 rounded-full bg-[#f59e0b]" />
      <div
        aria-hidden="true"
        className="mt-4 flex transition-transform duration-150 ease-out"
        style={{ paddingLeft: '50%', transform: shift }}
      >
        <RulerTicks count={count} every={every} unit={unit} />
      </div>
    </div>
  );
}
