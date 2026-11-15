import { type KeyboardEvent, memo, type PointerEvent, useMemo, useRef } from 'react';
import { haptic } from '@/lib/haptics';

/** The width of one tick in px, and the largest value. */
const STEP = 14;
const MAX = 30;

const TICKS = Array.from({ length: MAX + 1 }, (_, index) => index);

/** The ticks never change, so they draw once; only the track moves. */
const RulerTicks = memo(function RulerTicks() {
  return (
    <>
      {TICKS.map((index) => {
        const major = index % 5 === 0;
        return (
          <div className="flex shrink-0 flex-col items-center gap-1.5" key={index} style={{ width: STEP }}>
            <span className={major ? 'h-6.5 w-0.5 bg-hub-label' : 'h-3.5 w-0.5 bg-hub-faint'} />
            <span className="h-3.5 type-caption text-hub-label">{major ? index : ''}</span>
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
}

/**
 * A ruler you drag sideways: 0 to 30, one tick for each unit, an amber marker in the middle.
 * It is a slider for the keyboard (arrow keys, Home, End). The track moves by transform only.
 */
export function Ruler({ value, onChange, label }: RulerProps) {
  const drag = useRef<{ x: number; start: number } | null>(null);
  const shift = useMemo(() => `translateX(${-(value * STEP + STEP / 2)}px)`, [value]);

  const set = (next: number) => {
    const clamped = Math.max(0, Math.min(MAX, next));
    if (clamped !== value) {
      haptic('tap');
      onChange(clamped);
    }
  };

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, start: value };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A pointer that cannot be captured still works while it stays over the ruler.
    }
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current) {
      set(Math.round(drag.current.start - (event.clientX - drag.current.x) / STEP));
    }
  };
  const onUp = () => {
    drag.current = null;
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Readonly<Record<string, number>> = { ArrowLeft: value - 1, ArrowDown: value - 1, ArrowRight: value + 1, ArrowUp: value + 1, Home: 0, End: MAX };
    const next = moves[event.key];
    if (next !== undefined) {
      event.preventDefault();
      set(next);
    }
  };

  return (
    <div
      aria-label={label}
      aria-valuemax={MAX}
      aria-valuemin={0}
      aria-valuenow={value}
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
        <RulerTicks />
      </div>
    </div>
  );
}
