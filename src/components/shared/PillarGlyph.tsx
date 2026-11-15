import type { ReactNode } from 'react';
import type { PillarId } from '@/lib/pillars';
import { cn } from '@/lib/utils';

interface PillarGlyphProps {
  id: PillarId;
  /** Size in px. */
  size?: number;
  /**
   * Plays the small move of the icon once (the plane takes off, the weight lifts, the tassel swings).
   * Give a new number to play it again; 0 does not play.
   */
  play?: number;
  /** A delay before the move, for example to wait until the page has landed. */
  delayMs?: number;
  className?: string;
}

/**
 * The playful pillar icons of v3: white strokes with one pale accent in the pillar's halo colour.
 * They sit on a pillar gradient. The move is CSS only (index.css, glyph-*), so it costs no script time,
 * and reduced motion turns it off.
 */
export function PillarGlyph({ id, size = 24, play = 0, delayMs = 0, className }: PillarGlyphProps) {
  const accent = `var(--pillar-${id}-halo)`;
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0 overflow-visible', className)}
      data-play={play > 0 ? 'true' : undefined}
      fill="none"
      height={size}
      key={play}
      stroke="#ffffff"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ ['--glyph-delay' as string]: `${delayMs}ms` }}
      viewBox="0 0 64 64"
      width={size}
    >
      {GLYPHS[id](accent)}
    </svg>
  );
}

const GLYPHS: Readonly<Record<PillarId, (accent: string) => ReactNode>> = {
  outreach: (accent) => (
    <>
      <path d="M8 50c5-2 9-6 11-11" stroke={accent} strokeDasharray="2 5" strokeWidth={2.6} />
      <g className="g-fly">
        <path d="M55 9 9 28l16 6 6 16z" fill={accent} fillOpacity={0.28} strokeWidth={3.6} />
        <path d="M25 34 37 22" strokeWidth={3.6} />
      </g>
    </>
  ),
  fitness: (accent) => (
    <>
      <g className="g-lift">
        <path d="M19 20v24M45 20v24" strokeWidth={5} />
        <path d="M12 26v12M52 26v12" stroke={accent} strokeWidth={5} />
        <path d="M19 32h26" strokeWidth={3.8} />
      </g>
      <path d="M22 11q10-5 20 0" opacity={0.8} stroke={accent} strokeWidth={2.6} />
    </>
  ),
  learning: (accent) => (
    <>
      <path d="M6 26 32 14l26 12-26 12z" fill={accent} fillOpacity={0.3} strokeWidth={3.6} />
      <path d="M16 32v10c0 4 7 8 16 8s16-4 16-8V32" strokeWidth={3.6} />
      <g className="g-swing">
        <path d="M58 26v14" stroke={accent} strokeWidth={3} />
        <circle cx={58} cy={43} fill={accent} r={3.2} stroke="none" />
      </g>
    </>
  ),
  reading: (accent) => (
    <>
      <g className="g-flap">
        <path d="M8 16h15a9 9 0 0 1 9 9v27a6 6 0 0 0-6-6H8z" fill={accent} fillOpacity={0.25} strokeWidth={3.6} />
        <path d="M56 16H41a9 9 0 0 0-9 9v27a6 6 0 0 1 6-6h18z" strokeWidth={3.6} />
      </g>
      <path d="M44 16v15l4-3 4 3V16" fill={accent} stroke={accent} strokeWidth={2} />
    </>
  ),
  trading: (accent) => (
    <>
      <path d="M18 12v34M38 8v30" stroke={accent} strokeOpacity={0.7} strokeWidth={2.4} />
      <path d="M13 22h10v16H13z" fill="#ffffff" stroke="none" />
      <path d="M33 16h10v14H33z" fill={accent} stroke="none" />
      <path className="g-climb" d="M8 54 24 42l9 6 21-21" strokeDasharray={60} strokeWidth={3.8} />
      <path d="M46 27h8v8" strokeWidth={3.8} />
    </>
  ),
  signoff: (accent) => (
    <>
      <path className="g-moon" d="M50 38A20 20 0 1 1 26 12a16 16 0 0 0 24 26z" fill={accent} fillOpacity={0.3} strokeWidth={3.6} />
      <circle cx={46} cy={14} fill={accent} r={2.6} stroke="none" />
      <circle cx={54} cy={22} fill={accent} r={1.8} stroke="none" />
    </>
  ),
};
