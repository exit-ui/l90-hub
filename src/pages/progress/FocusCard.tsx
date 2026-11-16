import { memo, useMemo } from 'react';
import { focusChange, focusSeries, focusStats, formatMinutes } from '@/lib/focus';
import { cn } from '@/lib/utils';
import type { DateKey } from '@/store/types';
import { useHub } from '@/store/useHub';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/** The first letter of the weekday of a date. */
function letterOf(date: DateKey): string {
  const [year, month, day] = date.split('-').map(Number);
  return LETTERS[new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getDay()] ?? '';
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 rounded-2xl bg-white/12 px-3 py-2.5">
      <dt className="type-caption text-white/75">{label}</dt>
      <dd className="num type-body font-bold text-white">{value}</dd>
    </div>
  );
}

/**
 * "Focus time": the minutes that the timer has counted, for each of the last 7 days, with this week
 * against last week and the marks to beat: the best day and the streak. It compares you with yourself only.
 */
export const FocusCard = memo(function FocusCard({ today }: { today: DateKey }) {
  const days = useHub((state) => state.days);
  const model = useMemo(() => {
    const stats = focusStats(days, today);
    const series = focusSeries(days, today, 7);
    return { stats, series, top: Math.max(30, ...series.map((point) => point.minutes)) };
  }, [days, today]);
  const { stats } = model;
  // A fair comparison: this week so far against last week at the same weekday. Nothing to compare before the first minute.
  const change = stats.week > 0 ? focusChange(stats.week, stats.lastWeekSoFar) : null;
  const empty = stats.total === 0;

  return (
    <section aria-labelledby="focus-title" className="pillar-card pillar-reading grid gap-3.5 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="type-name text-white" id="focus-title">
          Focus time
        </h2>
        {change !== null ? (
          <span
            className={cn(
              'type-label num rounded-full px-2.5 py-1 font-bold',
              change >= 0 ? 'bg-[rgb(61_220_132/0.22)] text-[#a9f7cb]' : 'bg-white/15 text-white',
            )}
          >
            {change >= 0 ? '+' : '−'}
            {Math.abs(change)} % on last week by now
          </span>
        ) : null}
      </div>
      <p className="num">
        <span className="text-4xl font-bold tracking-tight text-white">{empty ? '–' : formatMinutes(stats.week)}</span>
        <span className="type-label text-white/80">{empty ? '  Start a timer from any task on Today' : '  this week'}</span>
      </p>
      <div aria-hidden="true" className="flex h-22.5 items-end gap-2">
        {model.series.map((point) => {
          const best = stats.bestDay?.date === point.date && point.minutes > 0;
          return (
            <div className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" key={point.date}>
              <div
                className={cn('w-full rounded-[7px]', point.minutes === 0 ? 'bg-white/10' : best ? 'bg-[#5eead4]' : 'hatch')}
                style={{ height: `${point.minutes === 0 ? 4 : Math.max(8, (point.minutes / model.top) * 100)}%` }}
              />
              <span className="type-caption text-white/70">{letterOf(point.date)}</span>
              <span className="sr-only">{`${point.date}: ${point.minutes === 0 ? 'no focus' : `${point.minutes} minutes`}`}</span>
            </div>
          );
        })}
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <Stat label="Today" value={formatMinutes(stats.today)} />
        <Stat label="Best day" value={stats.bestDay ? formatMinutes(stats.bestDay.minutes) : '–'} />
        <Stat label="Streak" value={stats.streak > 0 ? `${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}` : '–'} />
      </dl>
    </section>
  );
});
