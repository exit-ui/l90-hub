import { memo, useMemo } from 'react';
import { addDays } from '@/lib/dates';
import { dailySeries, mean, nonNull } from '@/lib/progressSeries';
import { cn } from '@/lib/utils';
import type { DateKey } from '@/store/types';
import { useHub } from '@/store/useHub';
import { useShallow } from 'zustand/react/shallow';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/** The first letter of the weekday of a date. */
function letterOf(date: DateKey): string {
  const [year, month, day] = date.split('-').map(Number);
  return LETTERS[new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getDay()] ?? '';
}

/**
 * "All ticks": the share of the day's ticks that were done, for each of the last 7 days, with the average and
 * how it moved against the 7 days before. It is the one number that says how the whole week went.
 */
export const AllTicksCard = memo(function AllTicksCard({ today }: { today: DateKey }) {
  const state = useHub(
    useShallow((hub) => ({
      days: hub.days,
      weekTemplate: hub.weekTemplate,
      startDate: hub.startDate,
      fitness: hub.fitness,
      learning: hub.learning,
      trades: hub.trades,
    })),
  );
  const model = useMemo(() => {
    const points = dailySeries(state, 'tasks', 14, today);
    const week = points.slice(7);
    const average = mean(nonNull(week));
    const before = mean(nonNull(points.slice(0, 7)));
    return {
      week,
      average,
      change: average !== null && before !== null ? Math.round(average - before) : null,
      first: addDays(today, -6),
    };
  }, [state, today]);
  const empty = model.average === null;

  return (
    <section aria-labelledby="all-ticks-title" className="pillar-card pillar-learning grid gap-3.5 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="type-name text-white" id="all-ticks-title">
          All ticks
        </h2>
        {model.change !== null ? (
          <span
            className={cn(
              'type-label num rounded-full px-2.5 py-1 font-bold',
              model.change >= 0 ? 'bg-[rgb(61_220_132/0.22)] text-[#a9f7cb]' : 'bg-white/15 text-white',
            )}
          >
            {model.change >= 0 ? '+' : '−'}
            {Math.abs(model.change)} pts
          </span>
        ) : null}
      </div>
      <p className="num">
        <span className="text-4xl font-bold tracking-tight text-white">{model.average === null ? '–' : Math.round(model.average)}</span>
        <span className="text-lg text-white/65"> %</span>
        <span className="type-label text-white/80">{empty ? '  No ticks yet this week' : '  this week'}</span>
      </p>
      <div aria-hidden="true" className="flex h-22.5 items-end gap-2">
        {model.week.map((point) => {
          const value = point.value;
          const full = value !== null && value >= 100;
          return (
            <div className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" key={point.date}>
              <div
                className={cn('w-full rounded-[7px]', value === null ? 'bg-white/10' : full ? 'bg-[#a78bfa]' : 'hatch')}
                style={{ height: `${value === null ? 4 : Math.max(4, value)}%` }}
              />
              <span className="type-caption text-white/70">{letterOf(point.date)}</span>
              <span className="sr-only">{`${point.date}: ${value === null ? 'no data' : `${Math.round(value)} percent`}`}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
});
