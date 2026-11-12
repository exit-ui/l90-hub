import { motion } from 'motion/react';
import { SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type BarTone = 'primary' | 'primary-flat' | 'secondary' | 'data' | 'complete' | 'limit' | 'brand';

const FILLS: Readonly<Record<BarTone, string>> = {
  primary: 'bg-hub-bar-fill',
  'primary-flat': 'bg-hub-bar-fill',
  secondary: 'bg-hub-accent',
  data: 'bg-hub-success',
  complete: 'bg-hub-success',
  limit: 'bg-hub-amber',
  brand: 'bg-hub-brand',
};

interface ProgressBarProps {
  /** 0 to 1. */
  fraction: number;
  /** The text alternative, for example "12 of 20 DMs". */
  label: string;
  tone?: BarTone;
  className?: string;
}

/** A thin round bar. The fill grows with a spring that settles in under 300 ms. */
export function ProgressBar({ fraction, label, tone = 'data', className }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={percent}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-hub-track', className)}
      role="progressbar"
    >
      <motion.div
        animate={{ width: `${percent}%` }}
        className={cn('h-full rounded-full transition-colors duration-150', FILLS[tone])}
        initial={false}
        transition={SPRING}
      />
    </div>
  );
}
