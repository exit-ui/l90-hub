import { ChartColumn, Check, Copy, Flame, Share2, Star } from 'lucide-react';
import { type ComponentType, memo, useEffect, useMemo, useRef, useState } from 'react';
import { PressButton } from '@/components/shared/PressButton';
import { formatShort } from '@/lib/dates';
import { focusRecordsView, formatMinutes, shareWeekText } from '@/lib/focus';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import type { DateKey } from '@/store/types';
import { useHub } from '@/store/useHub';
import { FocusCard } from './FocusCard';

interface RecordRow {
  id: string;
  title: string;
  sub: string;
  value: string;
  fresh: boolean;
  tone: string;
  Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

/** The marks to beat. A record that you beat today or this week says "New". */
const FocusRecords = memo(function FocusRecords({ today }: { today: DateKey }) {
  const days = useHub((state) => state.days);
  const rows = useMemo<RecordRow[]>(() => {
    const view = focusRecordsView(days, today);
    return [
      {
        id: 'day',
        title: 'Best day',
        sub: view.bestDay ? (view.bestDay.date === today ? 'Today' : formatShort(view.bestDay.date)) : 'Start a timer to set it',
        value: view.bestDay ? formatMinutes(view.bestDay.minutes) : '–',
        fresh: view.freshDay,
        tone: 'tone-reading',
        Icon: Star,
      },
      {
        id: 'week',
        title: 'Best week',
        sub: view.bestWeek ? `Week of ${formatShort(view.bestWeek.weekStart)}` : 'Start a timer to set it',
        value: view.bestWeek ? formatMinutes(view.bestWeek.minutes) : '–',
        fresh: view.freshWeek,
        tone: 'tone-learning',
        Icon: ChartColumn,
      },
      {
        id: 'streak',
        title: 'Longest streak',
        sub: 'Days in a row with focus',
        value: view.longestStreak > 0 ? `${view.longestStreak} ${view.longestStreak === 1 ? 'day' : 'days'}` : '–',
        fresh: false,
        tone: 'tone-fitness',
        Icon: Flame,
      },
    ];
  }, [days, today]);

  return (
    <section aria-labelledby="records-title" className="surface-card grid gap-1 p-4 pb-2">
      <h2 className="type-section text-hub-text" id="records-title">
        Records
      </h2>
      <ul className="grid">
        {rows.map(({ id, title, sub, value, fresh, tone, Icon }) => (
          <li className={cn('flex min-h-14 items-center gap-3', tone)} key={id}>
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--soft)] text-[var(--solid)]">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="grid min-w-0 flex-1">
              <span className="type-body font-semibold text-hub-text">{title}</span>
              <span className="type-label truncate text-hub-label">{sub}</span>
            </span>
            {fresh ? <span className="mk-pop type-caption rounded-full bg-hub-done-pill px-2.5 py-1 font-bold text-hub-positive">New</span> : null}
            <span className="num type-body font-bold text-hub-text">{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
});

type ShareState = 'idle' | 'copied' | 'failed';

/**
 * Competition without a server: one plain line about your week that you send to a friend by message.
 * Where the phone has a share sheet it opens that; otherwise the line is copied. Nothing is sent by the app.
 */
function ShareWeek({ today }: { today: DateKey }) {
  const [state, setState] = useState<ShareState>('idle');
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const show = (next: ShareState) => {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1800);
  };
  const share = async () => {
    haptic('tap');
    const text = shareWeekText(useHub.getState().days, today);
    try {
      if (canShare) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      show('copied');
    } catch (error) {
      // A person who closes the share sheet is not an error. A blocked clipboard is.
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        show('failed');
      }
    }
  };

  const label = state === 'copied' ? 'Copied' : state === 'failed' ? 'Could not copy' : canShare ? 'Share my week' : 'Copy my week';
  const Icon = state === 'copied' ? Check : canShare ? Share2 : Copy;
  return (
    <div className="grid gap-2">
      <PressButton className="h-13 w-full" onClick={share} tone="secondary">
        <Icon aria-hidden="true" className={cn('size-4.5 icon-swap', state === 'copied' && 'text-hub-positive')} key={state} />
        <span aria-live="polite">{label}</span>
      </PressButton>
      <p className="type-label px-1 text-hub-label">Compare with a friend by message. Nothing is sent unless you send it.</p>
    </div>
  );
}

/** The Focus tab: this week against last week, the records to beat, and a line to share. */
export const FocusTab = memo(function FocusTab({ today }: { today: DateKey }) {
  return (
    <div className="grid gap-5">
      <FocusCard today={today} />
      <FocusRecords today={today} />
      <ShareWeek today={today} />
    </div>
  );
});
