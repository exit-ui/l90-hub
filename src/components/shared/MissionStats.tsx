import { type ReactNode, useMemo } from 'react';
import { useToday } from '@/hooks/useToday';
import { formatMedium } from '@/lib/dates';
import { formatInteger, toRoman } from '@/lib/format';
import { momentumText } from '@/lib/moduleView';
import { missionClock } from '@/lib/phases';
import { momentum, totalDms } from '@/lib/streak';
import { levelProgress, totalXp } from '@/lib/xp';
import { useHub } from '@/store/useHub';
import { Card } from './Card';
import { CardTitle } from './Controls';
import { ProgressBar } from './ProgressBar';
import { RollingNumber } from './RollingNumber';

function Stat({ label, children, detail }: { label: string; children: ReactNode; detail?: string }) {
  return (
    <div className="surface-inset min-w-0 p-4">
      <dt className="type-label text-hub-label">{label}</dt>
      <dd className="type-section num mt-1 text-hub-text">{children}</dd>
      {detail ? <dd className="type-label mt-1 text-hub-label">{detail}</dd> : null}
    </div>
  );
}

/** The mission numbers as rolling numbers. `bare` drops the card surface, for an expanded view. */
export function MissionStats({ bare = false }: { bare?: boolean }) {
  const today = useToday();
  const state = useHub();
  const clock = missionClock(today, state.startDate);
  const total = useMemo(() => totalDms(state.days), [state.days]);
  const run = useMemo(() => momentum(state.days, today, state.dmTarget), [state.days, today, state.dmTarget]);
  const level = useMemo(() => levelProgress(totalXp(state)), [state]);
  const before = clock.stage === 'before';
  const Wrapper = bare ? 'section' : Card;
  return (
    <Wrapper aria-labelledby="mission-stats-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle id="mission-stats-title">Mission</CardTitle>
        <p className="type-label text-hub-label">Review day: {formatMedium(clock.reviewDate)}</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Total DMs">
          <RollingNumber value={total} />
        </Stat>
        <Stat detail={momentumText(run).detail ?? undefined} label="Days on target">
          <RollingNumber value={run.daysOnTarget} />
        </Stat>
        <Stat label={before ? 'Days to the start' : 'Days left'}>
          <RollingNumber value={before ? clock.daysToStart : clock.daysLeft} />
        </Stat>
        <Stat label="Phase">{clock.phase ? `${toRoman(clock.phase)} of III` : 'None'}</Stat>
        <Stat detail={`${formatInteger(level.toNext)} XP to level ${level.level + 1}`} label="Level">
          <RollingNumber value={level.level} />
        </Stat>
      </dl>
      <ProgressBar
        className="mt-4"
        fraction={level.fraction}
        label={`${formatInteger(level.xp)} XP. ${formatInteger(level.toNext)} XP to level ${level.level + 1}.`}
        tone="secondary"
      />
    </Wrapper>
  );
}

