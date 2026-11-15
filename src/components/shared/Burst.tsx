import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/** The colours of the pieces, in turn. */
const COLOURS = ['var(--hub-success)', 'var(--hub-brand)', 'var(--hub-positive)', 'var(--hub-glint)'];

interface BurstProps {
  /** How many pieces fly out. */
  count?: number;
  /** How far the pieces fly, in px. */
  distance?: number;
  /** The size of one piece, in px. */
  size?: number;
  /** How long the burst lasts, in s. */
  duration?: number;
  className?: string;
}

/**
 * Small dots that fly out from the centre of the parent box and fade. Place it inside a relative box
 * and give it a new `key` to play it again. Transform and opacity only, so it stays smooth on a phone.
 */
export function Burst({ count = 8, distance = 26, size = 5, duration = 0.5, className }: BurstProps) {
  const reduced = useReducedMotion();
  if (reduced) {
    return null;
  }
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 flex items-center justify-center', className)}>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + (index % 2 ? 0.3 : 0);
        const reach = distance * (index % 2 ? 0.75 : 1);
        return (
          <motion.span
            animate={{ x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, scale: 0.4, opacity: 0 }}
            className="absolute rounded-full"
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            key={index}
            style={{ width: size, height: size, background: COLOURS[index % COLOURS.length] }}
            transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </span>
  );
}
