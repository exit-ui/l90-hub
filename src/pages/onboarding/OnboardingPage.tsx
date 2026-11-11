import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Backdrop } from '@/components/shared/Backdrop';
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

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-shell pb-16 md:px-6 lg:pt-24" id="main">
      <Backdrop />
      <p className="type-label text-hub-label">Set up the hub</p>
      <h1
        className="mt-1 type-title font-semibold text-hub-text outline-none"
        ref={heading}
        tabIndex={-1}
      >
        {STEP_TITLES[step]}
      </h1>
      <p className="mt-1 type-body text-hub-label">
        Step {index + 1} of {steps.length}. Answer the questions. The hub then starts with the correct numbers.
      </p>
      <ProgressBar
        className="mt-4"
        fraction={fractionOf(index + 1, steps.length)}
        label={`Step ${index + 1} of ${steps.length}`}
        tone="secondary"
      />

      <section className="surface-card mt-8 p-4 md:p-6">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            initial={{ opacity: 0, y: 8 }}
            key={step}
            transition={FADE}
          >
            {View ? (
              <View actions={actions} draft={draft} errors={errors} today={today} />
            ) : (
              <ReviewStep day={dayNumber(today, draft.startDate)} summary={summary} />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <PressButton disabled={index === 0} onClick={() => goTo(index - 1)}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back
        </PressButton>
        {last ? (
          <PressButton disabled={blocked} onClick={finish} tone="primary">
            <Check aria-hidden="true" className="size-4" />
            Start the hub
          </PressButton>
        ) : (
          <PressButton disabled={blocked} onClick={() => goTo(index + 1)} tone="primary">
            Next
            <ArrowRight aria-hidden="true" className="size-4" />
          </PressButton>
        )}
        <PressButton className="ml-auto" onClick={skip} tone="ghost">
          Skip the questions
        </PressButton>
      </div>
      {blocked ? (
        <p className="mt-3 type-label text-hub-danger" role="status">
          Correct the fields that show an error. Then select Next.
        </p>
      ) : null}
    </main>
  );
}
