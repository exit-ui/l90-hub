import { BadgeCheck, ChevronDown, Minus, PenLine, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToday } from '@/hooks/useToday';
import { dayNumber, formatLong } from '@/lib/dates';
import { parseWhole } from '@/lib/format';
import { dmStatusText } from '@/lib/homeText';
import { DISCLOSE, SPRING } from '@/lib/motion';
import { MISSION_DAYS, phaseOfDay } from '@/lib/phases';
import { splitTask } from '@/lib/pillars';
import { dayStatus, tasksDone, tasksForDate } from '@/lib/status';
import { fractionOf } from '@/lib/summary';
import { cn } from '@/lib/utils';
import { emptyDay } from '@/store/defaults';
import type { DateKey } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';
import { RollingNumber } from './RollingNumber';
import { Card } from './Card';
import { CONTROL_CLASS, TEXTAREA_CLASS } from './Field';
import { PressButton } from './PressButton';
import { ProgressBar } from './ProgressBar';
import { TickRow } from './TickRow';

function dayLabel(day: number): string {
  if (day < 1) {
    return 'Before the mission';
  }
  if (day === MISSION_DAYS + 1) {
    return 'Review day';
  }
  if (day > MISSION_DAYS) {
    return 'After the mission';
  }
  return `Day ${day} · Phase ${phaseOfDay(day) ?? 1}`;
}

function useSignedOff(date: DateKey) {
  const today = useToday();
  const record = useHub((state) => state.days[date]) ?? emptyDay();
  const template = useHub((state) => state.weekTemplate);
  const startDate = useHub((state) => state.startDate);
  const tasks = tasksForDate(template, date);
  return dayStatus(record, tasks, date, today, startDate) === 'signed off';
}

function SignedOffBadge({ date }: { date: DateKey }) {
  const signedOff = useSignedOff(date);
  return (
    <AnimatePresence>
      {signedOff ? (
        <motion.span
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex min-h-8 items-center gap-2 rounded-full bg-hub-positive/16 px-3 type-label font-semibold text-hub-positive"
          exit={{ scale: 0.9, opacity: 0 }}
          initial={{ scale: 0.9, opacity: 0 }}
          key="badge"
          role="status"
          transition={SPRING}
        >
          <BadgeCheck aria-hidden="true" className="size-4" />
          Signed off
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

interface DmCounterProps {
  date: DateKey;
  /** The large version for the top of the Home page. */
  hero?: boolean;
  /** Replaces the small label on the left of the top row. */
  heading?: ReactNode;
  className?: string;
}

/** The DM count for one date and the buttons that change it. +1 DM is the main action. */
export function DmCounter({ date, hero = false, heading, className }: DmCounterProps) {
  const record = useHub((state) => state.days[date]) ?? emptyDay();
  const target = useHub((state) => state.dmTarget);
  const { setDm, addDm } = useHubActions();
  const fieldId = useId();
  const [editing, setEditing] = useState(false);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-start justify-between gap-3">
        {heading ?? <p className="type-label text-hub-label">DMs sent</p>}
        <PressButton
          aria-controls={`${fieldId}-edit`}
          aria-expanded={editing}
          className="-mt-3 -mr-2 px-3 type-label font-medium text-hub-label-strong"
          onClick={() => setEditing((open) => !open)}
          tone="ghost"
        >
          <PenLine aria-hidden="true" className="size-4" />
          {editing ? 'Done' : 'Edit'}
        </PressButton>
      </div>
      <p className="flex items-baseline gap-2">
        <RollingNumber className={cn('text-hub-text', hero ? 'type-hero num' : 'type-number num')} value={record.dm} />
        <span className="type-body text-hub-label">/ {target} DMs</span>
      </p>
      <p aria-live="polite" className="mt-2 type-body text-hub-label-strong">
        {dmStatusText(record.dm, target)}
      </p>
      <ProgressBar
        className="mt-4"
        fraction={fractionOf(record.dm, target)}
        label={`${record.dm} of ${target} DMs`}
        tone="primary"
      />

      <AnimatePresence initial={false}>
        {editing ? (
          <motion.div
            animate={{ height: 'auto', opacity: 1 }}
            className="-mx-2 -mb-2 overflow-hidden px-2 pb-2"
            exit={{ height: 0, opacity: 0 }}
            id={`${fieldId}-edit`}
            initial={{ height: 0, opacity: 0 }}
            transition={DISCLOSE}
          >
            <div className="flex items-center justify-between gap-3 pt-4">
              <Label className="type-body text-hub-text" htmlFor={`${fieldId}-dm`}>
                Exact count
              </Label>
              <Input
                className={cn(CONTROL_CLASS, 'w-24 text-center')}
                id={`${fieldId}-dm`}
                inputMode="numeric"
                min={0}
                onChange={(event) => setDm(date, parseWhole(event.target.value))}
                type="number"
                value={record.dm}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-4 flex items-center gap-2">
        <PressButton
          aria-label="Remove 1 DM"
          className={hero ? 'size-14' : undefined}
          disabled={record.dm === 0}
          iconOnly
          onClick={() => addDm(date, -1)}
        >
          <Minus aria-hidden="true" className="size-5" />
        </PressButton>
        <PressButton
          className="flex-1"
          onClick={() => addDm(date, 1)}
          tone="primary"
        >
          <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />1 DM
        </PressButton>
        <PressButton
          aria-label="Add 5 DMs"
          className="px-4"
          onClick={() => addDm(date, 5)}
        >
          +5
        </PressButton>
      </div>
    </div>
  );
}

interface DayChecklistProps {
  date: DateKey;
  /** Show the title row with the count of done tasks. */
  title?: string;
  className?: string;
}

/** The tasks of one date as tick rows. A tick also does the act that the task names. */
export function DayChecklist({ date, title, className }: DayChecklistProps) {
  const record = useHub((state) => state.days[date]) ?? emptyDay();
  const template = useHub((state) => state.weekTemplate);
  const { toggleTask } = useHubActions();
  const tasks = tasksForDate(template, date);
  const done = tasksDone(record, tasks);

  return (
    <section className={cn('min-w-0', className)}>
      <div className="mb-2 flex w-full items-baseline justify-between gap-3">
        <h3 className="type-body font-semibold text-hub-text">{title ?? 'Tasks'}</h3>
        {tasks.length > 0 ? (
          <span className="type-label text-hub-label">
            {done} of {tasks.length} done
          </span>
        ) : null}
      </div>
      {tasks.length === 0 ? (
        <p className="py-2 type-body text-hub-label">This weekday has no tasks. Add tasks in Setup, on the Week tab.</p>
      ) : (
        <ul className="-mx-2 grid gap-1">
          {tasks.map((task, index) => {
            const parts = splitTask(task);
            return (
              <li key={`${index}-${task}`}>
                <TickRow
                  action={parts.action}
                  cue={parts.cue}
                  done={record.done[task] === true}
                  onToggle={() => toggleTask(date, task)}
                  task={task}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** The two notes for the end of a day, behind a disclosure button. */
export function DayNotes({ date, className }: { date: DateKey; className?: string }) {
  const record = useHub((state) => state.days[date]) ?? emptyDay();
  const { setWin, setNext } = useHubActions();
  const fieldId = useId();
  const hasNotes = record.win.trim() !== '' || record.next.trim() !== '';
  const [open, setOpen] = useState(hasNotes);

  return (
    <div className={cn('min-w-0', className)}>
      <button
        aria-controls={`${fieldId}-notes`}
        aria-expanded={open}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-control text-left"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>
          <span className="block type-body font-semibold text-hub-text">Evening notes</span>
          <span className="block type-label text-hub-label">
            {hasNotes ? 'Written for this day.' : 'Two short lines before you stop.'}
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={SPRING}>
          <ChevronDown aria-hidden="true" className="size-5 text-hub-label" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            animate={{ height: 'auto', opacity: 1 }}
            className="-mx-2 -mb-2 overflow-hidden px-2 pb-2"
            exit={{ height: 0, opacity: 0 }}
            id={`${fieldId}-notes`}
            initial={{ height: 0, opacity: 0 }}
            transition={DISCLOSE}
          >
            <div className="grid gap-4 pt-3">
              <div className="grid gap-2">
                <Label className="type-label text-hub-label" htmlFor={`${fieldId}-win`}>
                  One thing that moved forward today
                </Label>
                <Textarea
                  className={TEXTAREA_CLASS}
                  id={`${fieldId}-win`}
                  onChange={(event) => setWin(date, event.target.value)}
                  value={record.win}
                />
              </div>
              <div className="grid gap-2">
                <Label className="type-label text-hub-label" htmlFor={`${fieldId}-next`}>
                  The first action tomorrow
                </Label>
                <Textarea
                  className={TEXTAREA_CLASS}
                  id={`${fieldId}-next`}
                  onChange={(event) => setNext(date, event.target.value)}
                  value={record.next}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

interface TaskCardProps {
  date: DateKey;
  className?: string;
}

/** The work for one date: the DM counter, the task list and the two daily notes. */
export function TaskCard({ date, className }: TaskCardProps) {
  const startDate = useHub((state) => state.startDate);
  const fieldId = useId();
  const day = dayNumber(date, startDate);

  return (
    <Card aria-labelledby={`${fieldId}-title`} className={cn('flex flex-col gap-6', className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-label text-hub-label">{dayLabel(day)}</p>
          <h2 className="mt-1 type-section font-semibold text-hub-text" id={`${fieldId}-title`}>
            {formatLong(date)}
          </h2>
        </div>
        <SignedOffBadge date={date} />
      </header>
      <DmCounter date={date} />
      <DayChecklist date={date} />
      <DayNotes date={date} />
    </Card>
  );
}

export { SignedOffBadge };
