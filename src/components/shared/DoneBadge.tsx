import { Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { CHECK_SPRING, FADE } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** "Done" with a check in a pale green pill. The check springs in one time when the state turns on. */
export function DoneBadge({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      animate={{ opacity: 1, scale: 1 }}
      className={cn('type-caption inline-flex min-h-6 items-center gap-1 rounded-full bg-hub-done-pill px-2.5 font-semibold text-hub-positive', className)}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
      transition={reduced ? FADE : CHECK_SPRING}
    >
      <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
      Done
    </motion.span>
  );
}
