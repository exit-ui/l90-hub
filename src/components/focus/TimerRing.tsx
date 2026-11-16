import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TimerRingProps {
  /** 0 to 1: how much of the time has passed. The bright arc grows with it. */
  fraction: number;
  /** The width of the line, in a 100-unit box. */
  thickness?: number;
  className?: string;
  children?: ReactNode;
}

/** A ring for the timer: a faint track and a bright arc that fills as the time passes. It animates by dash offset only. */
export function TimerRing({ fraction, thickness = 7, className, children }: TimerRingProps) {
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <div className={cn('relative', className)}>
      <svg aria-hidden="true" className="size-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="none" r={RADIUS} stroke="rgb(255 255 255 / 0.22)" strokeWidth={thickness} />
        <circle
          cx="50"
          cy="50"
          fill="none"
          r={RADIUS}
          stroke="white"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
          strokeLinecap="round"
          strokeWidth={thickness}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      {children ? <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div> : null}
    </div>
  );
}
