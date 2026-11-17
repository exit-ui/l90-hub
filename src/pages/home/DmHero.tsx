import { motion, useReducedMotion } from 'motion/react';
import { memo, useState } from 'react';
import { FloatUp } from '@/components/shared/FloatUp';
import { PressButton } from '@/components/shared/PressButton';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { useAddDms } from '@/hooks/useAddDms';
import { useFloatUp } from '@/hooks/useFloatUp';
import { useIncrease } from '@/hooks/useIncrease';
import { segmentsFor, toGoText } from '@/lib/dmMeter';
import { PULSE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { DateKey } from '@/store/types';
import { useHub } from '@/store/useHub';
import { LogSheet } from './LogSheet';

const GLASS_PILL =
  'h-11.5 flex-1 bg-white/15 text-white ring-1 ring-white/10 hover:bg-white/20 sm:min-h-11.5';

/**
 * The DM card of Today (v4): the count, a meter with one segment for each DM of the target, and three pills:
 * +1, +5 and Log, which opens the ruler. A newly lit segment pops, a "+1" floats up and the glow behind the page pulses.
 */
export const DmHero = memo(function DmHero({ date, onOpen }: { date: DateKey; onOpen: () => void }) {
  const dm = useHub((state) => state.days[date]?.dm ?? 0);
  const target = useHub((state) => state.dmTarget);
  const add = useAddDms(date);
  const reduced = useReducedMotion();
  const { bubbles, show } = useFloatUp();
  const [logOpen, setLogOpen] = useState(false);
  const bumps = useIncrease(dm);
  const { count, lit } = segmentsFor(dm, target);
  const reached = target > 0 && dm >= target;

  // The segments that were lit by the last change pop once. The class stays until the next change; it does not replay.
  const [seen, setSeen] = useState(lit);
  const [from, setFrom] = useState(lit);
  if (lit !== seen) {
    setSeen(lit);
    setFrom(lit > seen ? seen : lit);
  }

  return (
    <section aria-labelledby="dm-today-title" className="pillar-card pillar-outreach mb-4 grid gap-4 p-5">
      <div className="flex items-end justify-between gap-3">
        <button
          aria-label={`${dm} of ${target} DMs today. Open Outreach.`}
          className="min-w-0 cursor-pointer text-left"
          data-open-target="outreach"
          onClick={onOpen}
          type="button"
        >
          <span aria-hidden="true" className="type-body block text-white/80" id="dm-today-title">
            DMs sent today
          </span>
          <motion.span
            animate={reached && !reduced ? PULSE : undefined}
            aria-hidden="true"
            className="num block origin-left text-[56px] leading-14.5 font-bold tracking-tight text-white"
            key={`hero-pulse-${reached}`}
          >
            <motion.span
              animate={bumps > 0 && !reduced ? { scale: [1, 1.08, 1] } : undefined}
              className="inline-block origin-bottom-left"
              key={`bump-${bumps}`}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            >
              <RollingNumber value={dm} />
            </motion.span>
            {target > 0 ? <span className="text-white/35">/{target}</span> : null}
          </motion.span>
        </button>
        <span aria-live="polite" className="type-label num mb-1.5 shrink-0 rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white">
          {toGoText(dm, target)}
        </span>
      </div>

      {count > 0 ? (
        <div aria-label={`${dm} of ${target} DMs`} className="flex gap-0.75" role="img">
          {Array.from({ length: count }, (_, index) => {
            const on = index < lit;
            const fresh = on && index >= from;
            return (
              <span
                aria-hidden="true"
                className={cn('seg', on && 'seg-on', fresh && !reduced && 'seg-fresh')}
                key={index}
                style={fresh ? { ['--d' as string]: `${(index - from) * 35}ms` } : undefined}
              />
            );
          })}
        </div>
      ) : null}

      <div className="relative flex gap-2">
        <FloatUp bubbles={bubbles} className="-top-2" />
        <PressButton
          aria-label="Add 1 DM"
          className="raised h-11.5 flex-1 bg-white text-[#0a0b10] hover:bg-white/90 sm:min-h-11.5"
          onClick={() => {
            add(1);
            show('+1');
          }}
          tone="ghost"
        >
          +1
        </PressButton>
        <PressButton
          aria-label="Add 5 DMs"
          className={GLASS_PILL}
          onClick={() => {
            add(5);
            show('+5');
          }}
          tone="ghost"
        >
          +5
        </PressButton>
        <PressButton aria-label="Open the DM ruler" className={GLASS_PILL} onClick={() => setLogOpen(true)} tone="ghost">
          <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" viewBox="0 0 26 22">
            <path d="M3 15v-3M8 15v-6M13 15V6M18 15v-6M23 15v-3" strokeWidth="2" />
            <path d="M13 19v1" stroke="#f59e0b" strokeWidth="2.4" />
          </svg>
          Log
        </PressButton>
      </div>
      <LogSheet date={date} onOpenChange={setLogOpen} open={logOpen} />
    </section>
  );
});
