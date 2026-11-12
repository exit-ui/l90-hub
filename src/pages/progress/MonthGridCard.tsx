import { Card } from '@/components/shared/Card';
import { PressButton } from '@/components/shared/PressButton';
import {
  type CalendarDay,
  dayCellLabel,
  type MonthGrid,
  STATUS_LABELS,
  WEEKDAY_ROWS,
} from '@/lib/calendarGrid';
import { formatMonth } from '@/lib/dates';
import { cn } from '@/lib/utils';
import type { DateKey } from '@/store/types';
import { STATUS_STYLE } from './statusStyle';

interface DayCellProps {
  cell: CalendarDay;
  selected: boolean;
  onSelect: (date: DateKey) => void;
}

/** One day: the date number, the mission day number, the DM count and the status. */
function DayCell({ cell, selected, onSelect }: DayCellProps) {
  const style = STATUS_STYLE[cell.status];
  const Icon = style.icon;
  return (
    <PressButton
      aria-current={cell.isToday ? 'date' : undefined}
      aria-label={dayCellLabel(cell)}
      aria-pressed={selected}
      className={cn(
        'h-auto min-h-16 w-full min-w-0! flex-col gap-1 rounded-control border border-transparent px-0 py-2 type-label leading-none font-medium',
        style.cell,
        cell.isToday && 'ring-2 ring-hub-brand ring-inset',
        selected && 'border-transparent bg-hub-brand text-hub-on-brand',
      )}
      data-date={cell.date}
      onClick={() => onSelect(cell.date)}
      tabIndex={selected ? 0 : -1}
      title={`${cell.isReview ? 'Review day' : `Day ${cell.day}`}: ${STATUS_LABELS[cell.status]}`}
      tone="ghost"
    >
      <span className="flex items-center gap-1">
        <span className={cn('type-body font-semibold', !selected && 'text-hub-text')}>
          {cell.dateNumber}
        </span>
        <Icon aria-hidden="true" className={cn('size-3 shrink-0', selected ? 'text-hub-text' : style.tone)} />
      </span>
      <span className={cn('type-label', cell.isReview && 'font-semibold')}>
        {cell.isReview ? 'Review' : `D${cell.day}`}
      </span>
      {cell.isFuture ? null : <span className="type-label">{cell.dm} DM</span>}
    </PressButton>
  );
}

interface MonthGridCardProps {
  grid: MonthGrid;
  cells: ReadonlyMap<DateKey, CalendarDay>;
  selected: DateKey;
  onSelect: (date: DateKey) => void;
  className?: string;
}

/** The days of one calendar month in weeks of 7 cells, with Monday first. */
export function MonthGridCard({ grid, cells, selected, onSelect, className }: MonthGridCardProps) {
  const titleId = `month-${grid.month}`;
  return (
    <Card aria-labelledby={titleId} className={cn('p-2 md:p-6', className)}>
      <h2 className="type-label text-hub-label px-2 pt-2 md:px-0 md:pt-0" id={titleId}>
        {formatMonth(grid.first)}
      </h2>
      <div aria-hidden="true" className="mt-3 grid grid-cols-7 gap-0 md:gap-2">
        {WEEKDAY_ROWS.map((row) => (
          <span className="text-center type-label font-medium text-hub-label" key={row.weekday}>
            {row.short}
          </span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-0 md:gap-2">
        {grid.weeks.flatMap((week, weekIndex) =>
          week.map((date, column) => {
            const cell = date === null ? undefined : cells.get(date);
            if (!cell) {
              return <span aria-hidden="true" key={`${grid.month}-${weekIndex}-${column}`} />;
            }
            return (
              <DayCell
                cell={cell}
                key={cell.date}
                onSelect={onSelect}
                selected={cell.date === selected}
              />
            );
          }),
        )}
      </div>
    </Card>
  );
}
