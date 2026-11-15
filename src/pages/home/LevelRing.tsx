import { memo } from 'react';
import { routeHref } from '@/lib/routes';

/** The level as a ring around its number. It opens Progress. The ring fills as XP grows toward the next level. */
export const LevelRing = memo(function LevelRing({ level, fraction }: { level: number; fraction: number }) {
  const percent = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <a
      aria-label={`Level ${level}, ${Math.round(percent)} percent to the next. Open Progress.`}
      className="press relative flex size-11 items-center justify-center rounded-full text-hub-text no-underline"
      href={routeHref('progress')}
    >
      <svg aria-hidden="true" className="absolute inset-0" viewBox="0 0 44 44">
        <circle cx="22" cy="22" fill="none" r="19" stroke="var(--hub-track)" strokeWidth="3" />
        <circle
          cx="22"
          cy="22"
          fill="none"
          pathLength="100"
          r="19"
          stroke="var(--hub-success)"
          strokeDasharray={`${percent} 100`}
          strokeLinecap="round"
          strokeWidth="3"
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span aria-hidden="true" className="num relative type-label font-bold">
        {level}
      </span>
    </a>
  );
});
