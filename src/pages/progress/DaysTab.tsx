import { type KeyboardEvent, type ReactNode, useMemo, useRef } from 'react';
import { Notice } from '@/components/shared/Notice';
import { TaskCard } from '@/components/shared/TaskCard';
import { navigate } from '@/hooks/useRoute';
import { useToday } from '@/hooks/useToday';
import { calendarDays, monthGrids, moveDate, selectedDay, STATUS_LABELS } from '@/lib/calendarGrid';
import { monthKey } from '@/lib/dates';
import { reviewDate } from '@/lib/phases';
import type { DayStatus } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { DateKey } from '@/store/types';
import { useHub } from '@/store/useHub';
import { MonthGridCard } from './MonthGridCard';
import { STATUS_STYLE } from './statusStyle';

const LEGEND: readonly DayStatus[] = ['signed off', 'partly done', 'missed', 'open'];

/** The day panel stays beside all month grids on a desktop screen. */
const PANEL_ROWS: readonly string[] = [
  'lg:row-span-1',
  'lg:row-span-2',
  'lg:row-span-3',
  'lg:row-span-4',
];

function Legend() {
  return (
    <ul aria-label="Key" className="flex flex-wrap gap-x-4 gap-y-2 type-label text-hub-label">
      {LEGEND.map((status) => {
        const style = STATUS_STYLE[status];
        const Icon = style.icon;
        return (
          <li className="flex items-center gap-2" key={status}>
            <Icon aria-hidden="true" className={cn('size-4', style.tone)} />
            {STATUS_LABELS[status]}
          </li>
        );
      })}
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="block size-4 rounded-full ring-2 ring-hub-brand ring-inset" />
        Today
      </li>
      <li>D = mission day</li>
    </ul>
  );
}

interface DaysTabProps {
  /** The first route part after the page. It can be a date. */
  segment: string | undefined;
}

/** The month grids from the start date to the review day, and the selected day. */
export function DaysTab({ segment }: DaysTabProps) {
  const today = useToday();
  const days = useHub((state) => state.days);
  const weekTemplate = useHub((state) => state.weekTemplate);
  const startDate = useHub((state) => state.startDate);
  const container = useRef<HTMLDivElement>(null);

  const review = reviewDate(startDate);
  const grids = useMemo(() => monthGrids(startDate, review), [startDate, review]);
  const cells = useMemo(
    () => calendarDays({ days, weekTemplate, startDate }, today),
    [days, weekTemplate, startDate, today],
  );
  const selected = selectedDay(segment, today, startDate, review);
  const selectedMonth = monthKey(selected);

  const select = (date: DateKey) => navigate('progress', 'days', date);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = event.target instanceof HTMLElement ? event.target.dataset.date : undefined;
    if (from === undefined) {
      return;
    }
    const next = moveDate(from, event.key, startDate, review);
    const button = next
      ? container.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)
      : null;
    if (button) {
      event.preventDefault();
      button.focus();
    }
  };

  const panel = (
    <div
      className={cn(
        'grid min-w-0 gap-4 lg:sticky lg:top-24 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:max-h-[calc(100dvh-8rem)] lg:self-start lg:overflow-y-auto',
        PANEL_ROWS[grids.length - 1] ?? 'lg:row-span-4',
      )}
      key="panel"
    >
      {selected === review ? (
        <Notice kind="NOTE">
          This is the review day. Compare the funnel numbers with day 1. Decide the next 90 days.
        </Notice>
      ) : null}
      <TaskCard date={selected} />
    </div>
  );

  // The source order is the mobile order: the panel comes after the month of the selected day.
  const items: ReactNode[] = [];
  for (const grid of grids) {
    items.push(
      <MonthGridCard
        cells={cells}
        className="lg:col-span-7 lg:col-start-1"
        grid={grid}
        key={grid.month}
        onSelect={select}
        selected={selected}
      />,
    );
    if (grid.month === selectedMonth) {
      items.push(panel);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="type-label text-hub-label">
          Select a day to open it. Use the arrow keys to move between the days.
        </p>
        <Legend />
      </div>
      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
        onKeyDown={onKeyDown}
        ref={container}
      >
        {items}
      </div>
    </div>
  );
}
