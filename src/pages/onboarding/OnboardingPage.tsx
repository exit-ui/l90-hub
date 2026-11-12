import { ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { PressButton } from '@/components/shared/PressButton';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { useToday } from '@/hooks/useToday';
import { dayNumber } from '@/lib/dates';
import { FADE } from '@/lib/motion';
import {
  answersFromDraft,
  type Draft,
  draftFromState,
  type OnboardingStep,
  pastDates,
  reviewSummary,
  type ScalarDraftKey,
  STEP_TITLES,
  stepErrors,
  visibleSteps,
} from '@/lib/onboarding';
import { fractionOf } from '@/lib/summary';
import type { FunnelKey } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';
import {
  BookStep,
  type DraftActions,
  FunnelStep,
  MissionStep,
  PastStep,
  ReviewStep,
  RewardsStep,
  type StepProps,
  TargetsStep,
  WalletStep,
} from './Steps';

function useDraftActions(
  setDraft: (change: (draft: Draft) => Draft) => void,
  today: string,
): DraftActions {
  return useMemo<DraftActions>(
    () => ({
      setScalar: (key: ScalarDraftKey, value: string) => setDraft((draft) => ({ ...draft, [key]: value })),
      setPast: (date, value) =>
        setDraft((draft) => ({ ...draft, pastDm: { ...draft.pastDm, [date]: value } })),
      fillPast: (value) =>
        setDraft((draft) => {
          const pastDm = { ...draft.pastDm };
          for (const date of pastDates(draft.startDate, today)) {
            pastDm[date] = value;
          }
          return { ...draft, pastDm };
        }),
      setFunnel: (key: FunnelKey, value: string) =>
        setDraft((draft) => ({ ...draft, funnel: { ...draft.funnel, [key]: value } })),
      setCoin: (index, field, value) =>
        setDraft((draft) => ({
          ...draft,
          coins: draft.coins.map((coin, position) =>
            position === index ? { ...coin, [field]: value } : coin,
          ),
        })),
      setReward: (index, value) =>
        setDraft((draft) => {
          const rewards: [string, string, string] = [...draft.rewards];
          rewards[index] = value;
          return { ...draft, rewards };
        }),
    }),
    [setDraft, today],
  );
}

const STEP_VIEWS: Readonly<Record<Exclude<OnboardingStep, 'review'>, (props: StepProps) => ReactNode>> = {
  mission: MissionStep,
  targets: TargetsStep,
  past: PastStep,
  funnel: FunnelStep,
  book: BookStep,
  wallet: WalletStep,
  rewards: RewardsStep,
};

/** The setup questions. They run when the hub starts, and again from Setup. */
export function OnboardingPage() {
  const today = useToday();
  const store = useHub();
  const { completeOnboarding, skipOnboarding } = useHubActions();
  const [draft, setDraft] = useState(() => draftFromState(store, today));
  const [position, setPosition] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const actions = useDraftActions(setDraft, today);

  const steps = visibleSteps(draft, today);
  const index = Math.min(position, steps.length - 1);
  const step = steps[index] ?? 'mission';
  const errors = stepErrors(step, draft, today);
  const blocked = Object.keys(errors).length > 0;
  const last = index === steps.length - 1;

  const summary = useMemo(
    () => reviewSummary(store, answersFromDraft(draft, today)),
    [store, draft, today],
  );

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const goTo = (next: number) => {
    setPosition(next);
    window.scrollTo({ top: 0 });
  };

  const finish = () => {
    completeOnboarding(answersFromDraft(draft, today));
    window.location.hash = '#/home';
    window.scrollTo({ top: 0 });
  };

  const skip = () => {
    skipOnboarding();
    window.location.hash = '#/home';
  };

  const View = step === 'review' ? null : STEP_VIEWS[step];
  const startDay = dayNumber(today, draft.startDate);
  const startLabel = startDay === 1 ? 'Start day 1' : startDay > 1 ? `Continue at day ${startDay}` : 'Start the hub';
  const edit = (target: OnboardingStep) => {
    const next = steps.indexOf(target);
    if (next >= 0) {
      goTo(next);
    }
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-shell pb-48 md:px-6 lg:pt-16" id="main">
      <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2">
        <button
          aria-label="Previous step"
          className="press flex size-11 cursor-pointer items-center justify-center rounded-full bg-hub-surface text-hub-text rim-hairline disabled:cursor-not-allowed disabled:opacity-40"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </button>
        <p className="type-label text-center text-hub-label">
          Step {index + 1} of {steps.length}
        </p>
        <PressButton className="px-3" onClick={skip} tone="ghost">
          Skip
        </PressButton>
      </div>
      <ProgressBar
        className="mt-4"
        fraction={fractionOf(index + 1, steps.length)}
        label={`Step ${index + 1} of ${steps.length}`}
        tone="brand"
      />

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
          exit={{ opacity: 0, y: -6 }}
          initial={{ opacity: 0, y: 8 }}
          key={step}
          transition={FADE}
        >
          <h1 className="type-title text-hub-text outline-none" ref={heading} tabIndex={-1}>
            {STEP_TITLES[step]}
          </h1>
          <div className="mt-6">
            {View ? (
              <View actions={actions} draft={draft} errors={errors} today={today} />
            ) : (
              <ReviewStep day={startDay} onEdit={edit} summary={summary} />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="bg-fade fixed inset-x-0 bottom-0 z-30 px-4 pt-8 pb-sheet">
        <div className="mx-auto grid max-w-xl gap-2">
          {blocked ? (
            <p className="type-label text-center text-hub-danger" role="status">
              Correct the fields that show an error. Then continue.
            </p>
          ) : null}
          {last ? (
            <PressButton className="h-14 w-full sm:h-14" disabled={blocked} onClick={finish} tone="primary">
              {startLabel}
            </PressButton>
          ) : (
            <PressButton className="h-14 w-full sm:h-14" disabled={blocked} onClick={() => goTo(index + 1)} tone="primary">
              Continue
            </PressButton>
          )}
        </div>
      </div>
    </main>
  );
}
