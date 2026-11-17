import { memo, useMemo } from 'react';
import { focusChange, focusStats, focusWeekColumns, formatMinutes } from '@/lib/focus';
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
 * "Focus time": the minutes that the timer has counted this week, day by day, each day racing the same day of last week
 * (the hatched bar), with this week so far against last week at the same point, and the marks to beat: the best day and
 * the streak. It compares you with yourself only.
 */
export const FocusCard = memo(function FocusCard({ today }: { today: DateKey }) {
  const days = useHub((state) => state.days);
  const model = useMemo(() => {
    const stats = focusStats(days, today);
    const columns = focusWeekColumns(days, today);
    const top = Math.max(30, ...columns.map((column) => Math.max(column.minutes ?? 0, column.last)));
    return { stats, columns, top };
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
      <div aria-hidden="true" className="flex h-24 items-end gap-2">
        {model.columns.map((column) => {
          const minutes = column.minutes;
          const best = minutes !== null && minutes > 0 && stats.bestDay?.date === column.date;
          return (
            <div className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" key={column.date}>
              <div className="flex w-full flex-1 items-end gap-0.75">
                <span className="hatch min-w-0 flex-1 rounded-[5px]" style={{ height: `${column.last === 0 ? 4 : Math.max(6, (column.last / model.top) * 100)}%` }} />
                <span
                  className={cn('min-w-0 flex-1 rounded-[5px]', minutes === null || minutes === 0 ? 'bg-white/10' : best ? 'bg-[#5eead4]' : 'bg-[#5eead4]/55')}
                  style={{ height: `${minutes === null || minutes === 0 ? 4 : Math.max(8, (minutes / model.top) * 100)}%` }}
                />
              </div>
              <span className="type-caption text-white/70">{letterOf(column.date)}</span>
              <span className="sr-only">{`${column.date}: ${minutes === null ? 'not yet' : `${minutes} minutes`}, last week ${column.last} minutes`}</span>
            </div>
          );
        })}
      </div>
      <p aria-hidden="true" className="flex items-center gap-4 type-caption text-white/75">
        <span className="inline-flex items-center gap-1.5">
          <span className="hatch size-3 rounded-[3px]" />
          Last week
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-[#5eead4]" />
          This week
        </span>
      </p>
      <dl className="grid grid-cols-3 gap-2">
        <Stat label="Today" value={formatMinutes(stats.today)} />
        <Stat label="Best day" value={stats.bestDay ? formatMinutes(stats.bestDay.minutes) : '–'} />
        <Stat label="Streak" value={stats.streak > 0 ? `${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}` : '–'} />
      </dl>
    </section>
  );
});
