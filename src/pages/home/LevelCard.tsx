import { Zap } from 'lucide-react';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { Card } from '@/components/shared/Card';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { formatInteger } from '@/lib/format';
import type { LevelProgress } from '@/lib/xp';

interface LevelCardProps {
  progress: LevelProgress;
  className?: string;
}

/** The level and the XP bar. */
export function LevelCard({ progress, className }: LevelCardProps) {
  return (
    <Card aria-label="Level and XP" className={className}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="type-label text-hub-label flex items-center gap-2">
            <Zap aria-hidden="true" className="size-4" />
            Level
          </p>
          <RollingNumber className="type-number num mt-1 block text-hub-text" value={progress.level} />
        </div>
        <p className="text-right type-label text-hub-label">
          <RollingNumber className="type-section text-hub-text" value={progress.xp} />{' '}
          XP
          <br />
          {formatInteger(progress.toNext)} XP to level {progress.level + 1}
        </p>
      </div>
      <ProgressBar
        className="mt-4 h-3"
        fraction={progress.fraction}
        label={`${formatInteger(progress.xp)} XP. ${formatInteger(progress.toNext)} XP to level ${progress.level + 1}.`}
        tone="secondary"
      />
    </Card>
  );
}
