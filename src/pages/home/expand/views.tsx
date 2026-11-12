import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useId, useState } from 'react';
import { DoneBadge } from '@/components/shared/DoneBadge';
import { DmAdjust, DmButtons } from '@/components/shared/DmControls';
import { TextField } from '@/components/shared/Field';
import { MissionStats } from '@/components/shared/MissionStats';
import { PressButton } from '@/components/shared/PressButton';
import { MetricChart } from '@/components/shared/MetricChart';
import { ProgressChart } from '@/components/shared/ProgressChart';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { TickRow } from '@/components/shared/TickRow';
import type { ModuleView, TickView } from '@/lib/moduleView';
import {
  CONTENT_IN,
  COUNT_START_S,
  COUNT_STEP_S,
  EXPAND_OPEN,
  FADE,
  staggerDelay,
} from '@/lib/motion';
import { pillarMetric } from '@/lib/pillars';
import { type PageId, routeHref } from '@/lib/routes';
import { signOffHighlights, signOffNumbers, tomorrowFirstTask } from '@/lib/signoff';
import { cn } from '@/lib/utils';
import type { DateKey } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';

/** The shared title of a view. It gets the focus on open. */
export function ViewTitle({ id, titleId, children }: { id: string; titleId: string; children: ReactNode }) {
  return (
    <motion.h2
      className="type-title inline-block w-fit text-hub-text outline-none max-sm:text-xl max-sm:font-semibold"
      id={titleId}
      layoutId={`title-${id}`}
      tabIndex={-1}
      transition={EXPAND_OPEN}
    >
      {children}
    </motion.h2>
  );
}

/** Content that is not shared fades in after the container starts to move. */
function Content({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={className}
      initial={{ opacity: 0 }}
      transition={reduced ? FADE : CONTENT_IN}
    >
      {children}
    </motion.div>
  );
}

function SharedHeader({
  module,
  format,
  whole = true,
}: {
  module: ModuleView;
  format?: (value: number) => string;
  whole?: boolean;
}) {
  return (
    <>
      <div className="mt-2 flex items-center justify-between gap-3">
        <motion.p
          className="inline-flex w-fit items-baseline gap-2"
          layoutId={`number-${module.id}`}
          transition={EXPAND_OPEN}
        >
          <RollingNumber
            className={cn('type-hero transition-colors duration-300', module.complete ? 'text-hub-positive' : 'text-hub-text')}
            format={format}
            value={module.value}
            whole={whole}
          />
          <span className="type-body text-hub-label">{module.unit}</span>
        </motion.p>
        {module.complete ? <DoneBadge /> : null}
      </div>
      <motion.div className="mt-4" layoutId={`bar-${module.id}`} transition={EXPAND_OPEN}>
        <ProgressBar
          fraction={module.fraction}
          label={module.barLabel}
          tone={module.barTone === 'complete' ? 'complete' : module.barTone === 'limit' ? 'limit' : 'primary'}
        />
      </motion.div>
    </>
  );
}

/** All ticks of the pillar. They come in one after the other, 30 ms apart. */
function ViewTicks({ ticks, onToggle }: { ticks: readonly TickView[]; onToggle: (task: string) => void }) {
  const reduced = useReducedMotion();
  if (ticks.length === 0) {
    return null;
  }
  return (
    <ul aria-label="Ticks" className="-mx-2 grid gap-1">
      {ticks.map((tick, index) => (
        <motion.li
          animate={{ opacity: 1, y: 0 }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          key={tick.task}
          transition={reduced ? FADE : { ...FADE, delay: staggerDelay(index) }}
        >
          <TickRow
            action={tick.action}
            cue={tick.cue}
            done={tick.done}
            isNext={tick.isNext}
            onToggle={() => onToggle(tick.task)}
            task={tick.task}
          />
        </motion.li>
      ))}
    </ul>
  );
}

function PageLink({ page, segments = [], children }: { page: PageId; segments?: string[]; children: string }) {
  return (
    <a
      className="tap press type-body inline-flex items-center gap-2 rounded-full font-semibold text-hub-text no-underline hover:text-hub-label-strong"
      href={routeHref(page, ...segments)}
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4" />
    </a>
  );
}

interface PillarViewProps {
  module: ModuleView;
  today: DateKey;
  cardsDue: number;
  onToggle: (task: string) => void;
  format?: (value: number) => string;
  whole?: boolean;
}

const PAGE_LINKS: Readonly<Record<ModuleView['id'], { page: PageId; segments?: string[]; text: string }>> = {
  outreach: { page: 'outreach', text: 'Open the Outreach page' },
  fitness: { page: 'fitness', text: 'Open the Fitness page' },
  learning: { page: 'learning', text: 'Open the Learning page' },
  reading: { page: 'learning', segments: ['reading'], text: 'Open Reading' },
  trading: { page: 'trading', text: 'Open the Trading page' },
  signoff: { page: 'progress', text: 'Open the Progress page' },
};

/** The expanded view of a pillar module (spec 10.1). */
export function PillarView({ module, today, cardsDue, onToggle, format, whole }: PillarViewProps) {
  const book = useHub((state) => state.books.find((item) => item.status === 'current'));
  const checks = useHub((state) => state.days[today]?.chartChecks ?? 0);
  const limit = useHub((state) => state.chartCheckLimit);
  const { addChartCheck } = useHubActions();
  const link = PAGE_LINKS[module.id];

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {module.announce}
      </p>
      <SharedHeader format={format} module={module} whole={whole} />
      <Content className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 md:mt-8 md:gap-8">
        {module.id === 'outreach' && module.note ? (
          <p className="type-body text-hub-label-strong">{module.note}</p>
        ) : null}
        {module.ticks.length > 0 ? (
          <ViewTicks onToggle={onToggle} ticks={module.ticks} />
        ) : (
          <p className="type-body text-hub-label">{module.emptyLine}</p>
        )}

        {module.id === 'outreach' ? (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <DmAdjust date={today} />
            <DmButtons date={today} />
          </div>
        ) : null}

        {module.id === 'learning' && cardsDue > 0 ? (
          <a
            className="type-body -mx-2 flex min-h-11 items-center gap-3 rounded-control px-2 text-hub-text no-underline hover:bg-hub-inset"
            href={routeHref('learning', 'cards')}
          >
            <BookOpen aria-hidden="true" className="size-4 shrink-0 text-hub-label" />
            Review {cardsDue} {cardsDue === 1 ? 'card' : 'cards'}
          </a>
        ) : null}

        {module.id === 'reading' ? (
          <p className="type-body text-hub-label-strong">
            {book
              ? `${book.title}: chapter ${book.read}${book.chapters > 0 ? ` of ${book.chapters}` : ''}.`
              : 'There is no current book. Add a book on the Reading page.'}
          </p>
        ) : null}

        {module.id === 'trading' ? (
          <div className="grid gap-2">
            <PressButton className="w-full" onClick={() => addChartCheck(today)} tone="secondary">
              +1 check
            </PressButton>
            <p className={cn('type-label num', checks >= limit ? 'text-hub-amber' : 'text-hub-label')}>
              {checks >= limit
                ? `You used all ${limit} chart checks today. Wait for the alert.`
                : `${checks} of ${limit} chart checks used today.`}
            </p>
          </div>
        ) : null}

        <MetricChart insight metric={pillarMetric(module.id)} range={14} title="Last 14 days" />
        <PageLink page={link.page} segments={link.segments}>
          {link.text}
        </PageLink>
      </Content>
    </>
  );
}

interface SignOffViewProps {
  module: ModuleView;
  today: DateKey;
  signedOff: boolean;
  headline: string;
  onToggle: (task: string) => void;
  onSignOff: () => void;
}

/** The Sign-off view: the ticks and "Sign off the day", then the summary (spec 6.3). */
export function SignOffView({ module, today, signedOff, headline, onToggle, onSignOff }: SignOffViewProps) {
  const days = useHub((state) => state.days);
  const dmTarget = useHub((state) => state.dmTarget);
  const startDate = useHub((state) => state.startDate);
  const weekTemplate = useHub((state) => state.weekTemplate);
  const fitness = useHub((state) => state.fitness);
  const learning = useHub((state) => state.learning);
  const { setWin } = useHubActions();
  const headlineId = useId();
  const data = { days, dmTarget, startDate, weekTemplate, fitness, learning };
  // After "Sign off the day" the button goes away; the focus moves to the summary heading.
  const [signedOffHere, setSignedOffHere] = useState(false);
  const signOff = () => {
    setSignedOffHere(true);
    onSignOff();
  };
  useEffect(() => {
    if (signedOff && signedOffHere) {
      document.getElementById(headlineId)?.focus({ preventScroll: true });
    }
  }, [signedOff, signedOffHere, headlineId]);
  const numbers = signOffNumbers(data, today);
  // The highlight is read one time, so it does not change while the user types the win.
  const [highlight] = useState(() => signOffHighlights(data, today)[0] ?? null);
  const tomorrow = tomorrowFirstTask({ weekTemplate }, today);
  const stats: readonly { label: string; value: number }[] = [
    { label: 'DMs', value: numbers.dm },
    { label: 'Ticks', value: numbers.ticks },
    { label: 'XP gained', value: numbers.xp },
  ];

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {module.announce}
      </p>
      <SharedHeader module={module} />
      {signedOff ? (
        <Content className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 md:mt-8 md:gap-8">
          <h3 className="type-title text-hub-text outline-none" id={headlineId} tabIndex={-1}>
            {headline}
          </h3>
          <dl className="grid grid-cols-3 gap-3">
            {stats.map((stat, index) => (
              <div className="surface-inset min-w-0 p-3" key={stat.label}>
                <dt className="type-label text-hub-label">{stat.label}</dt>
                <dd className="type-section mt-1 text-hub-text">
                  <RollingNumber delay={COUNT_START_S + index * COUNT_STEP_S} fromZero value={stat.value} />
                </dd>
              </div>
            ))}
          </dl>
          {highlight ? (
            <p className="type-body flex items-start gap-3 text-hub-text">
              <Sparkles aria-hidden="true" className="mt-1 size-4 shrink-0 text-hub-amber" />
              {highlight}
            </p>
          ) : null}
          <TextField
            autosave
            label="One win today (you can leave this empty)"
            onChange={(text) => setWin(today, text)}
            placeholder="Write one thing that moved forward."
            value={days[today]?.win ?? ''}
          />
          {tomorrow ? (
            <p className="type-body text-hub-label-strong">
              <span className="font-semibold text-hub-text">Tomorrow:</span> {tomorrow}
            </p>
          ) : null}
        </Content>
      ) : (
        <Content className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 md:mt-8 md:gap-8">
          {module.ticks.length > 0 ? (
            <ViewTicks onToggle={onToggle} ticks={module.ticks} />
          ) : (
            <p className="type-body text-hub-label">{module.emptyLine}</p>
          )}
          <PressButton className="w-full" onClick={signOff} tone="primary">
            Sign off the day
          </PressButton>
        </Content>
      )}
    </>
  );
}

/** The expanded chart: the full chart with compare mode, the mission numbers and the page link. */
export function ProgressView({ today }: { today: DateKey }) {
  return (
    <Content className="mt-4 grid gap-5 sm:gap-6 md:gap-8">
      <ProgressChart embedded today={today} variant="full" />
      <MissionStats bare />
      <PageLink page="progress">Open the Progress page</PageLink>
    </Content>
  );
}
