import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type KeyboardEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Notice } from '@/components/shared/Notice';
import { TaskCard } from '@/components/shared/TaskCard';
import { navigate } from '@/hooks/useRoute';
import { useToday } from '@/hooks/useToday';
import { calendarDays, type CalendarDay, monthGrids, moveDate, selectedDay, STATUS_LABELS } from '@/lib/calendarGrid';
import { addDays, formatLong, formatShort, mondayOf } from '@/lib/dates';
import { reviewDate } from '@/lib/phases';
import { type DayStatus, tasksDone, tasksForDate } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { DateKey } from '@/store/types';
import { useHub } from '@/store/useHub';
import { MonthGridCard } from './MonthGridCard';

const WEEK = 7;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MISSION_DAYS = 90;

/** How complete a day is, 0 to 1, for the ribbon and the week chips. */
interface DayShape {
  cell: CalendarDay;
  /** Ticks done and ticks planned. */
  done: number;
  total: number;
  /** Minutes of fitness and learning sessions on the day. */
  minutes: number;
  win: string;
}

const BAR: Readonly<Record<DayStatus, string>> = {
  'signed off': 'bg-hub-success',
  'partly done': 'bg-hub-success/45',
  missed: 'bg-hub-label/35',
  open: 'bg-hub-chart-future',
};

/** The ribbon bar of a day: tall and green for a signed-off day, short for a missed one, a stub for a day to come. */
function ribbonBar(shape: DayShape): { height: number; className: string } {
  if (shape.cell.isFuture) {
    return { height: 5, className: 'bg-hub-chart-future' };
  }
  if (shape.cell.status === 'signed off') {
    return { height: 34, className: BAR['signed off'] };
  }
  if (shape.cell.status === 'partly done') {
    const fraction = shape.total > 0 ? shape.done / shape.total : 0.3;
    return { height: Math.round(14 + fraction * 18), className: BAR['partly done'] };
  }
  return { height: 8, className: shape.cell.isToday ? BAR['signed off'] : BAR.missed };
}

/** The 90 days at a glance in three rows of 30. It is a picture; the week below is how you move. */
const JourneyRibbon = memo(function JourneyRibbon({ shapes, selected, signedOff }: { shapes: readonly DayShape[]; selected: DateKey; signedOff: number }) {
  const rows = [0, 1, 2].map((row) => shapes.slice(row * 30, row * 30 + 30));
  return (
    <section aria-label="Your 90 days" className="surface-card grid gap-3 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="type-name text-hub-text">Your 90 days</h2>
        <p className="type-label num text-hub-label">{signedOff} signed off</p>
      </div>
      <div aria-hidden="true" className="grid gap-2">
        {rows.map((row, rowIndex) => (
          <div className="flex h-8.5 items-end justify-between" key={rowIndex}>
            {row.map((shape) => {
              const bar = ribbonBar(shape);
              return (
                <span
                  className={cn('w-1.75 rounded-full', bar.className, shape.cell.date === selected && 'ring-2 ring-hub-text')}
                  key={shape.cell.date}
                  style={{ height: bar.height }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <ul aria-label="Key" className="flex flex-wrap gap-x-4 gap-y-1 type-caption text-hub-label">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-hub-success" />
          Signed off
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-hub-success/45" />
          Partly done
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-hub-label/35" />
          Missed
        </li>
      </ul>
    </section>
  );
});

interface WeekStripProps {
  shapes: ReadonlyMap<DateKey, DayShape>;
  selected: DateKey;
  first: DateKey;
  last: DateKey;
  onSelect: (date: DateKey) => void;
}

/** A small ring for the share of ticks done in a day. */
function TickRing({ fraction, on }: { fraction: number; on: boolean }) {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 22 22">
      <circle cx="11" cy="11" fill="none" r="8" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <circle
        cx="11"
        cy="11"
        fill="none"
        pathLength="100"
        r="8"
        stroke={on ? 'currentColor' : 'var(--hub-success)'}
        strokeDasharray={`${Math.round(fraction * 100)} 100`}
        strokeLinecap="round"
        strokeWidth="3"
        transform="rotate(-90 11 11)"
      />
    </svg>
  );
}

/** The week of the selected day: seven chips, and arrows to the weeks before and after. */
const WeekStrip = memo(function WeekStrip({ shapes, selected, first, last, onSelect }: WeekStripProps) {
  const monday = mondayOf(selected);
  const dates = Array.from({ length: WEEK }, (_, index) => addDays(monday, index));
  const prev = addDays(selected, -WEEK);
  const next = addDays(selected, WEEK);
  const canPrev = addDays(monday, -1) >= first;
  const canNext = addDays(monday, WEEK) <= last;
  const refocus = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const signedThisWeek = dates.filter((date) => shapes.get(date)?.cell.status === 'signed off').length;
  const label = `${formatShort(monday)} – ${formatShort(dates[WEEK - 1] ?? monday)}`;

  // A key press moves the focus with the selection, so the keyboard never loses its place.
  useEffect(() => {
    if (refocus.current) {
      refocus.current = false;
      box.current?.querySelector<HTMLButtonElement>(`[data-date="${selected}"]`)?.focus({ preventScroll: true });
    }
  }, [selected]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = moveDate(selected, event.key, first, last);
    if (target) {
      event.preventDefault();
      refocus.current = true;
      onSelect(target);
    }
  };

  const jump = (date: DateKey, allowed: boolean) => {
    if (allowed) {
      onSelect(date < first ? first : date > last ? last : date);
    }
  };

  return (
    <section aria-label="Week" className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          aria-label="Previous week"
          className="press flex size-11 cursor-pointer items-center justify-center rounded-full bg-hub-chip text-hub-text disabled:opacity-30"
          disabled={!canPrev}
          onClick={() => jump(prev, canPrev)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="type-name text-hub-text">{label}</p>
          <p className="type-caption num text-hub-label">{signedThisWeek} of 7 signed off</p>
        </div>
        <button
          aria-label="Next week"
          className="press flex size-11 cursor-pointer items-center justify-center rounded-full bg-hub-chip text-hub-text disabled:opacity-30"
          disabled={!canNext}
          onClick={() => jump(next, canNext)}
          type="button"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5" onKeyDown={onKeyDown} ref={box}>
        {dates.map((date, index) => {
          const shape = shapes.get(date);
          const inRange = date >= first && date <= last;
          const on = date === selected;
          const fraction = shape && shape.total > 0 ? shape.done / shape.total : 0;
          return (
            <button
              aria-label={`${formatLong(date)}${shape?.cell.isToday ? '. Today' : ''}${shape ? `. ${STATUS_LABELS[shape.cell.status]}` : ''}`}
              aria-pressed={on}
              className={cn(
                'press flex h-19.5 cursor-pointer touch-manipulation flex-col items-center justify-center gap-1 rounded-[20px] transition-colors disabled:opacity-35',
                on ? 'bg-hub-black text-hub-on-black' : 'bg-hub-chip text-hub-text',
                shape?.cell.isToday && !on && 'ring-[1.5px] ring-hub-success',
              )}
              data-date={date}
              disabled={!inRange}
              key={date}
              onClick={() => onSelect(date)}
              tabIndex={on ? 0 : -1}
              type="button"
            >
              <span className="type-caption font-semibold opacity-70">{WEEKDAYS[index]}</span>
              <span className="num text-[17px] leading-5 font-bold">{Number(date.slice(8))}</span>
              {shape && !shape.cell.isFuture ? <TickRing fraction={fraction} on={on} /> : <span className="size-5" />}
            </button>
          );
        })}
      </div>
    </section>
  );
});

/** The selected day: three numbers and one win. Everything else is one tap deeper. */
function DayCard({ shape, target }: { shape: DayShape; target: number }) {
  const [editing, setEditing] = useState(false);
  const { cell } = shape;
  const signed = cell.status === 'signed off';
  const review = cell.isReview;
  const hasData = !cell.isFuture;
  const tile = signed ? 'bg-white/10' : 'bg-hub-inset';
  const sub = signed ? 'text-white/80' : 'text-hub-label';
  return (
    <section
      aria-label="Selected day"
      className={cn('grid gap-4 p-5', signed ? 'pillar-card pillar-outreach' : 'surface-card text-hub-text')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={cn('text-[21px] leading-6.5 font-bold tracking-tight', signed ? 'text-white' : 'text-hub-text')}>{formatLong(cell.date)}</h2>
          <p className={cn('type-label mt-0.5', sub)}>
            {review ? 'Review day' : `Day ${cell.day}`}
            {cell.isToday ? ' · Today' : ''}
          </p>
        </div>
        <span
          className={cn(
            'type-label shrink-0 rounded-full px-3 py-1 font-semibold',
            signed ? 'bg-[rgb(61_220_132/0.22)] text-[#a9f7cb]' : 'bg-hub-chip text-hub-text',
          )}
        >
          {cell.isFuture ? 'Planned' : STATUS_LABELS[cell.status]}
        </span>
      </div>

      {hasData ? (
        <dl className="grid grid-cols-3 gap-2">
          <div className={cn('rounded-[18px] p-3', tile)}>
            <dt className={cn('type-caption', sub)}>DMs</dt>
            <dd className="num text-[22px] leading-7 font-bold tracking-tight">
              {cell.dm}
              {target > 0 ? <span className={cn('type-label font-normal', sub)}>/{target}</span> : null}
            </dd>
          </div>
          <div className={cn('rounded-[18px] p-3', tile)}>
            <dt className={cn('type-caption', sub)}>Ticks</dt>
            <dd className="num text-[22px] leading-7 font-bold tracking-tight">
              {shape.done}
              <span className={cn('type-label font-normal', sub)}>/{shape.total}</span>
            </dd>
          </div>
          <div className={cn('rounded-[18px] p-3', tile)}>
            <dt className={cn('type-caption', sub)}>Focus</dt>
            <dd className="num text-[22px] leading-7 font-bold tracking-tight">
              {shape.minutes}
              <span className={cn('type-label font-normal', sub)}> min</span>
            </dd>
          </div>
        </dl>
      ) : (
        <p className={cn('type-body', sub)}>
          {shape.total > 0 ? `${shape.total} ${shape.total === 1 ? 'tick' : 'ticks'} planned. Nothing to do yet.` : 'Nothing planned for this day.'}
        </p>
      )}

      {hasData && shape.win ? (
        <p className="flex gap-2.5 type-body">
          <span aria-hidden="true" className="w-0.75 shrink-0 rounded-full bg-hub-success" />
          <span>{shape.win}</span>
        </p>
      ) : null}

      <button
        aria-expanded={editing}
        className={cn('min-h-11 w-fit cursor-pointer type-label font-semibold', sub, 'hover:opacity-100')}
        onClick={() => setEditing((value) => !value)}
        type="button"
      >
        {editing ? 'Close' : cell.isFuture ? 'Open this day' : 'Edit this day'}
      </button>
      {editing ? (
        <div className="-m-1 rounded-[22px] bg-hub-surface p-1 text-hub-text">
          <TaskCard date={cell.date} />
        </div>
      ) : null}
    </section>
  );
}

interface DaysTabProps {
  /** The first route part after the page. It can be a date. */
  segment: string | undefined;
}

/**
 * Days (v4): the 90 days as one ribbon, the week of the selected day as seven chips, and one card for the day.
 * The card shows three numbers and one win; "Edit this day" opens the full day. "All 90 days" opens the month grids.
 * A day has its own address: #/progress/days/<date>.
 */
export function DaysTab({ segment }: DaysTabProps) {
  const today = useToday();
  const days = useHub((state) => state.days);
  const weekTemplate = useHub((state) => state.weekTemplate);
  const startDate = useHub((state) => state.startDate);
  const fitness = useHub((state) => state.fitness);
  const learning = useHub((state) => state.learning);
  const target = useHub((state) => state.dmTarget);
  const [grid, setGrid] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  const review = reviewDate(startDate);
  const cells = useMemo(() => calendarDays({ days, weekTemplate, startDate }, today), [days, weekTemplate, startDate, today]);
  const shapes = useMemo(() => {
    const map = new Map<DateKey, DayShape>();
    const minutesOn = new Map<DateKey, number>();
    for (const session of [...fitness, ...learning]) {
      minutesOn.set(session.date, (minutesOn.get(session.date) ?? 0) + session.minutes);
    }
    for (const [date, cell] of cells) {
      const tasks = tasksForDate(weekTemplate, date);
      map.set(date, {
        cell,
        done: tasksDone(days[date], tasks),
        total: tasks.length,
        minutes: minutesOn.get(date) ?? 0,
        win: days[date]?.win.trim() ?? '',
      });
    }
    return map;
  }, [cells, days, weekTemplate, fitness, learning]);
  const ribbon = useMemo(() => [...shapes.values()].filter((shape) => shape.cell.day <= MISSION_DAYS), [shapes]);
  const signedOff = useMemo(() => ribbon.filter((shape) => shape.cell.status === 'signed off').length, [ribbon]);
  const grids = useMemo(() => monthGrids(startDate, review), [startDate, review]);

  const selected = selectedDay(segment, today, startDate, review);
  const shape = shapes.get(selected);
  const select = useCallback((date: DateKey) => navigate('progress', 'days', date), []);

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = event.target instanceof HTMLElement ? event.target.dataset.date : undefined;
    if (from === undefined) {
      return;
    }
    const next = moveDate(from, event.key, startDate, review);
    const button = next ? container.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`) : null;
    if (button) {
      event.preventDefault();
      button.focus();
    }
  };

  return (
    <div className="grid gap-4">
      <JourneyRibbon selected={selected} shapes={ribbon} signedOff={signedOff} />
      <WeekStrip first={startDate} last={review} onSelect={select} selected={selected} shapes={shapes} />
      {selected === review ? (
        <Notice kind="NOTE">This is the review day. Compare the funnel numbers with day 1. Decide the next 90 days.</Notice>
      ) : null}
      {shape ? <DayCard shape={shape} target={target} /> : null}

      <button
        aria-expanded={grid}
        className="min-h-11 w-fit cursor-pointer px-1 type-label font-semibold text-hub-label hover:text-hub-text"
        onClick={() => setGrid((value) => !value)}
        type="button"
      >
        {grid ? 'Hide the month grids' : 'All 90 days'}
      </button>
      {grid ? (
        <div className="grid gap-4" onKeyDown={onGridKeyDown} ref={container}>
          {grids.map((month) => (
            <MonthGridCard cells={cells} grid={month} key={month.month} onSelect={select} selected={selected} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

