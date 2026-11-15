import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Bubble } from '@/hooks/useFloatUp';
import { FLOAT_UP } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** Draws the labels of useFloatUp. Place it inside a relative box, over the button. */
export function FloatUp({ bubbles, className }: { bubbles: Bubble[]; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return null;
  }
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute inset-x-0 top-0 flex justify-center', className)}>
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.span
            animate={{ opacity: [1, 1, 0], y: -44, scale: 1.15 }}
            className="type-name num absolute font-bold text-hub-positive"
            initial={{ opacity: 0, y: -4, scale: 0.6 }}
            key={bubble.id}
            transition={FLOAT_UP}
          >
            {bubble.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
