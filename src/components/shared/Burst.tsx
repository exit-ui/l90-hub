import type { CSSProperties } from 'react';
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
 * and give it a new `key` to play it again. A CSS animation of transform and opacity only, so the
 * phone's graphics chip runs it and the tap itself costs almost nothing. Reduced motion hides it (index.css).
 */
export function Burst({ count = 8, distance = 26, size = 5, duration = 0.4, className }: BurstProps) {
  return (
    <span aria-hidden="true" className={cn('burst pointer-events-none absolute inset-0 flex items-center justify-center', className)}>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + (index % 2 ? 0.3 : 0);
        const reach = distance * (index % 2 ? 0.75 : 1);
        const style = {
          width: size,
          height: size,
          background: COLOURS[index % COLOURS.length],
          '--dx': `${(Math.cos(angle) * reach).toFixed(1)}px`,
          '--dy': `${(Math.sin(angle) * reach).toFixed(1)}px`,
          animationDuration: `${duration}s`,
        } as CSSProperties;
        return <span className="burst-piece absolute rounded-full" key={index} style={style} />;
      })}
    </span>
  );
}
