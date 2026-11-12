import { BadgeCheck, Lock, LockOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useMemo, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { TextField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { formatInteger } from '@/lib/format';
import { burstOffsets, CELEBRATION_MS, FADE, SPRING } from '@/lib/motion';
import { type RewardStatus, rewardStatuses } from '@/lib/phases';
import { phaseDays } from '@/lib/setupView';
import { fractionOf } from '@/lib/summary';
import { useHub, useHubActions } from '@/store/useHub';

const SPARKS = burstOffsets(8, 26);

function ClaimedBadge({ celebrate }: { celebrate: boolean }) {
  return (
    <motion.span
      animate={{ scale: 1, opacity: 1 }}
      className="relative inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-hub-done-pill px-4 type-body font-semibold text-hub-positive"
      exit={{ scale: 0.8, opacity: 0 }}
      initial={{ scale: 0.6, opacity: 0 }}
      role="status"
      transition={SPRING}
    >
      <BadgeCheck aria-hidden="true" className="size-4" />
      Claimed
      {celebrate
        ? SPARKS.map((spark) => (
            <motion.span
              animate={{ x: spark.x, y: spark.y, opacity: 0, scale: 0.4 }}
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -mt-1 -ml-1 size-2 rounded-full bg-hub-success"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              key={`${spark.x}-${spark.y}`}
              transition={{ duration: CELEBRATION_MS / 1000, ease: 'easeOut' }}
            />
          ))
        : null}
    </motion.span>
  );
}

function RewardCard({ status }: { status: RewardStatus }) {
  const reward = useHub((state) => state.rewards[status.index]);
  const { setReward, claimReward } = useHubActions();
  const [celebrate, setCelebrate] = useState(false);
  const id = useId();
  const range = phaseDays(status.phase);

  return (
    <Card aria-labelledby={`${id}-title`} className="flex flex-col gap-4 lg:col-span-4">
      <header>
        <p className="type-label text-hub-label">
          Days {range.first} to {range.last}
        </p>
        <h2 className="mt-1 type-section text-hub-text" id={`${id}-title`}>
          Phase {status.phase}
        </h2>
        <p className="mt-2 type-body break-words text-hub-label">{status.condition}</p>
      </header>

      <ul className="grid gap-4">
        {status.parts.map((part) => (
          <li key={part.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 type-label text-hub-label">{part.label}</span>
              <span className="shrink-0 type-body font-semibold text-hub-text">
                {formatInteger(part.value)} of {formatInteger(part.goal)}
              </span>
            </div>
            <ProgressBar
              className="mt-2"
              fraction={fractionOf(part.value, part.goal)}
              label={`${part.label}: ${formatInteger(part.value)} of ${formatInteger(part.goal)}`}
              tone="data"
            />
          </li>
        ))}
      </ul>

      <TextField
        autosave
        label={`Reward for phase ${status.phase}`}
        onChange={(text) => setReward(status.index, text)}
        value={reward}
      />

      <div className="mt-auto flex min-h-11 items-center">
        <AnimatePresence initial={false} mode="wait">
          {status.state === 'locked' ? (
            <motion.p
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 type-body font-semibold text-hub-label"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="locked"
              transition={FADE}
            >
              <Lock aria-hidden="true" className="size-4" />
              Locked
            </motion.p>
          ) : null}
          {status.state === 'ready' ? (
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-wrap items-center gap-3"
              exit={{ scale: 0.9, opacity: 0 }}
              initial={{ scale: 0.8, opacity: 0 }}
              key="ready"
              transition={SPRING}
            >
              <PressButton
                onClick={() => {
                  setCelebrate(true);
                  claimReward(status.index);
                }}
                tone="primary"
              >
                Claim the reward
              </PressButton>
              <p className="flex items-center gap-2 type-label font-semibold text-hub-positive">
                <LockOpen aria-hidden="true" className="size-4" />
                Unlocked
              </p>
            </motion.div>
          ) : null}
          {status.state === 'claimed' ? <ClaimedBadge celebrate={celebrate} key="claimed" /> : null}
        </AnimatePresence>
      </div>
    </Card>
  );
}

/** The 3 phases with the reward of each phase. */
export function RewardsTab() {
  const days = useHub((state) => state.days);
  const dmTarget = useHub((state) => state.dmTarget);
  const funnel = useHub((state) => state.funnel);
  const claimed = useHub((state) => state.claimed);
  const statuses = useMemo(
    () => rewardStatuses({ days, dmTarget, funnel, claimed }),
    [days, dmTarget, funnel, claimed],
  );
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {statuses.map((status) => (
        <RewardCard key={status.index} status={status} />
      ))}
    </div>
  );
}
