import { Check, Minus, Pause, Play, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Burst } from '@/components/shared/Burst';
import { PillarGlyph } from '@/components/shared/PillarGlyph';
import { PressButton } from '@/components/shared/PressButton';
import { Sheet } from '@/components/shared/Sheet';
import { useClock } from '@/hooks/useClock';
import { useWakeLock } from '@/hooks/useWakeLock';
import {
  clampMinutes,
  defaultMinutes,
  focusRecords,
  focusStats,
  formatClock,
  formatMinutes,
  MAX_TIMER_MINUTES,
  MIN_TIMER_MINUTES,
  remainingMs,
  TIMER_STEP,
  timerPhase,
} from '@/lib/focus';
import { closeFocus, useFocusUi } from '@/lib/focusUi';
import { haptic } from '@/lib/haptics';
import { pillarOfTask, splitTask } from '@/lib/pillars';
import { pulse } from '@/lib/pulse';
import { tasksForDate } from '@/lib/status';
import { cn } from '@/lib/utils';
import { XP_VALUES } from '@/lib/xp';
import type { DateKey, Timer } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';
import { Ruler } from '@/pages/home/Ruler';
import { TimerRing } from './TimerRing';

const ROUND = 'size-11 rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-40';

/** The task at the top of each view: its icon on a tile and its words. */
function TaskHeader({ task }: { task: string }) {
  const pillar = pillarOfTask(task);
  const { action } = splitTask(task);
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <PillarGlyph id={pillar} size={22} />
      </span>
      <p className="line-clamp-2 min-w-0 text-[17px] leading-6 font-bold tracking-tight text-white">{action}</p>
    </div>
  );
}

function SetupView({ task, date }: { task: string; date: DateKey }) {
  const pillar = pillarOfTask(task);
  const [minutes, setMinutes] = useState(() => defaultMinutes(task));
  const days = useHub((state) => state.days);
  const { startTimer } = useHubActions();
  const stats = useMemo(() => focusStats(days, date), [days, date]);
  const projected = stats.today + minutes;

  const bar = stats.bestOther > 0 ? Math.min(1, projected / stats.bestOther) : 0;
  const line =
    stats.bestOther === 0
      ? 'Your first minutes set the mark to beat.'
      : projected > stats.bestOther
        ? `That takes today to ${formatMinutes(projected)}: a new best day.`
        : `${formatMinutes(stats.bestOther - projected)} short of your best day (${formatMinutes(stats.bestOther)}).`;

  const start = () => {
    haptic('success');
    pulse();
    startTimer(task, date, minutes);
  };

  return (
    <div className="grid gap-4">
      <section className={cn('pillar-card grid gap-4 p-4', `pillar-${pillar}`)}>
        <TaskHeader task={task} />
        <div className="text-center">
          <p className="type-caption tracking-widest text-white/80 uppercase">Focus for</p>
          <div className="flex items-center justify-center gap-4">
            <PressButton
              aria-label="Five minutes less"
              className={ROUND}
              disabled={minutes <= MIN_TIMER_MINUTES}
              iconOnly
              onClick={() => setMinutes((value) => clampMinutes(value - TIMER_STEP))}
              tone="ghost"
            >
              <Minus aria-hidden="true" className="size-5" />
            </PressButton>
            <p aria-live="polite" className="num min-w-32 text-white">
              <span className="text-[72px] leading-20 font-bold tracking-tight">{minutes}</span>
              <span className="type-body text-white/80"> min</span>
            </p>
            <PressButton
              aria-label="Five minutes more"
              className={ROUND}
              disabled={minutes >= MAX_TIMER_MINUTES}
              iconOnly
              onClick={() => setMinutes((value) => clampMinutes(value + TIMER_STEP))}
              tone="ghost"
            >
              <Plus aria-hidden="true" className="size-5" />
            </PressButton>
          </div>
        </div>
      </section>

      <Ruler
        every={6}
        label="Minutes to focus"
        max={MAX_TIMER_MINUTES}
        min={MIN_TIMER_MINUTES}
        onChange={setMinutes}
        unit={TIMER_STEP}
        value={minutes}
        valueText={(value) => `${value} minutes`}
      />

      <div className="grid gap-2 rounded-2xl bg-hub-inset p-3.5">
        <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-hub-track">
          <div className="h-full rounded-full bg-[var(--hub-brand)] transition-[width] duration-200" style={{ width: `${Math.round(bar * 100)}%` }} />
        </div>
        <p className="type-label text-hub-label-strong">{line}</p>
        <p className="type-caption num text-hub-label">
          {`Today ${formatMinutes(stats.today)} · This week ${formatMinutes(stats.week)}`}
          {stats.lastWeekSoFar > 0 ? ` · last week by now ${formatMinutes(stats.lastWeekSoFar)}` : ''}
        </p>
      </div>

      <PressButton className="h-13 w-full" onClick={start} tone="primary">
        Start {minutes} min
      </PressButton>
    </div>
  );
}

function RunningView({ timer, now }: { timer: Timer; now: number }) {
  const { pauseTimer, resumeTimer, stopTimer, cancelTimer } = useHubActions();
  const [confirming, setConfirming] = useState(false);
  const pillar = pillarOfTask(timer.task);
  const phase = timerPhase(timer, now);
  const left = remainingMs(timer, now);
  const total = timer.minutes * 60_000;
  const passed = Math.floor((total - left) / 60_000);
  useWakeLock(phase === 'running');

  return (
    <div className="grid gap-3">
      <section className={cn('pillar-card grid gap-4 p-4', `pillar-${pillar}`)}>
        <TaskHeader task={timer.task} />
        <TimerRing className="mx-auto size-56" fraction={1 - left / total}>
          <p aria-hidden="true" className="num text-[52px] leading-14 font-bold tracking-tight text-white">
            {formatClock(left)}
          </p>
          <p className="type-label text-white/80">{phase === 'paused' ? 'Paused' : `of ${timer.minutes} min`}</p>
        </TimerRing>
        <p aria-live="polite" className="sr-only">
          {`${formatClock(left)} left of ${timer.minutes} minutes${phase === 'paused' ? ', paused' : ''}.`}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {phase === 'paused' ? (
          <PressButton
            className="h-13"
            onClick={() => {
              haptic('tap');
              resumeTimer();
            }}
            tone="primary"
          >
            <Play aria-hidden="true" className="icon-swap size-4" fill="currentColor" /> Resume
          </PressButton>
        ) : (
          <PressButton
            className="h-13"
            onClick={() => {
              haptic('tap');
              pauseTimer();
            }}
            tone="secondary"
          >
            <Pause aria-hidden="true" className="icon-swap size-4" fill="currentColor" /> Pause
          </PressButton>
        )}
        <PressButton
          className="h-13"
          disabled={passed < 1}
          onClick={() => {
            haptic('success');
            stopTimer();
          }}
          tone="secondary"
        >
          {passed < 1 ? 'Finish now' : `Finish · ${passed} min`}
        </PressButton>
      </div>

      <PressButton
        className="h-11 w-full"
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          cancelTimer();
          closeFocus();
        }}
        onBlur={() => setConfirming(false)}
        tone="danger"
      >
        {confirming ? 'Tap again to throw this timer away' : 'Cancel timer'}
      </PressButton>
    </div>
  );
}

function FinishedView({ timer }: { timer: Timer }) {
  const { completeTimer } = useHubActions();
  const pillar = pillarOfTask(timer.task);
  const { days, weekTemplate } = useHub(useShallow((state) => ({ days: state.days, weekTemplate: state.weekTemplate })));
  const canTick = days[timer.date]?.done[timer.task] !== true && tasksForDate(weekTemplate, timer.date).includes(timer.task);
  const records = useMemo(() => focusRecords(days, timer.date, timer.minutes), [days, timer.date, timer.minutes]);
  const xp = timer.minutes * XP_VALUES.focusMinute;

  const collect = (tick: boolean) => {
    haptic('peak');
    pulse();
    completeTimer(tick);
    closeFocus();
  };

  return (
    <div className="grid gap-3">
      <section className={cn('pillar-card grid justify-items-center gap-3 p-5 text-center', `pillar-${pillar}`)}>
        <span className="relative flex size-16 items-center justify-center rounded-full bg-white text-[#0a0b10]">
          <Burst count={14} distance={64} duration={0.9} size={7} />
          <Check aria-hidden="true" className="size-8" strokeWidth={3.2} />
        </span>
        <div>
          <p className="text-2xl leading-7 font-bold tracking-tight text-white">{formatMinutes(timer.minutes)} of focus</p>
          <p className="type-label mt-1 text-white/80">{`+${xp} XP`}</p>
        </div>
        <p className="line-clamp-2 type-body text-white/90">{splitTask(timer.task).action}</p>
        {records.bestDay || records.bestWeek ? (
          <ul className="flex flex-wrap justify-center gap-2">
            {records.bestDay ? <li className="type-label rounded-full bg-white/20 px-3 py-1 font-bold text-white">New best day</li> : null}
            {records.bestWeek ? <li className="type-label rounded-full bg-white/20 px-3 py-1 font-bold text-white">New best week</li> : null}
          </ul>
        ) : null}
      </section>
      {canTick ? (
        <>
          <PressButton className="h-13 w-full" onClick={() => collect(true)} tone="primary">
            Mark the task done
          </PressButton>
          <PressButton className="h-11 w-full" onClick={() => collect(false)} tone="secondary">
            Log the time only
          </PressButton>
        </>
      ) : (
        <PressButton className="h-13 w-full" onClick={() => collect(false)} tone="primary">
          Log {formatMinutes(timer.minutes)}
        </PressButton>
      )}
    </div>
  );
}

/** One view for a timer that is on: running, paused or finished. It draws again each second, and nothing else does. */
function TimerView({ timer }: { timer: Timer }) {
  const now = useClock();
  return timerPhase(timer, now) === 'finished' ? <FinishedView timer={timer} /> : <RunningView now={now} timer={timer} />;
}

function FocusBody() {
  const ui = useFocusUi();
  const timer = useHub((state) => state.timer);
  if (timer) {
    return <TimerView timer={timer} />;
  }
  if (ui.task && ui.date) {
    return <SetupView date={ui.date} key={ui.task} task={ui.task} />;
  }
  return <p className="type-body text-hub-label">No timer is running. Start one from a task on Today.</p>;
}

/** The timer sheet. Set the minutes on the ruler, start, and come back to see it finish. One timer at a time. */
export function FocusSheet() {
  const ui = useFocusUi();
  return (
    <Sheet
      description="Set the minutes, start, and come back when it is done. It runs on while the phone is locked."
      onOpenChange={(open) => {
        if (!open) {
          closeFocus();
        }
      }}
      open={ui.open}
      title="Focus"
    >
      {ui.open ? <FocusBody /> : null}
    </Sheet>
  );
}
