import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { digitColumns } from '@/lib/digits';
import { formatInteger } from '@/lib/format';
import { DIGIT_SETTLE_MS, DIGIT_SPRING, FADE } from '@/lib/motion';
import { cn } from '@/lib/utils';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

interface RollingNumberProps {
  value: number;
  format?: (value: number) => string;
  /** Round the value to a whole number before it is formatted. Set false for decimal values. */
  whole?: boolean;
  /** Roll from 0 on the first show, for example the sign-off numbers. */
  fromZero?: boolean;
  /** Seconds before the first roll from 0. */
  delay?: number;
  className?: string;
}

function DigitColumn({ char, fromZero, delay }: { char: string; fromZero: boolean; delay: number }) {
  const digit = Number(char);
  return (
    <span className="relative inline-block overflow-hidden align-top">
      {/* The hidden character gives the column its width and one line of height. */}
      <span className="invisible">{char}</span>
      <motion.span
        animate={{ y: `${-digit * 10}%` }}
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={fromZero ? { y: '0%' } : false}
        transition={fromZero ? { ...DIGIT_SPRING, delay } : DIGIT_SPRING}
      >
        {DIGITS.map((item) => (
          <span className="block" key={item}>
            {item}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * A number that rolls each digit column to its new value with one spring, like an odometer.
 * Built in-house with the free motion package. The full value is in a visually hidden span;
 * the module's own live region announces the change.
 */
export function RollingNumber({
  value,
  format = formatInteger,
  whole = true,
  fromZero = false,
  delay = 0,
  className,
}: RollingNumberProps) {
  const reduced = useReducedMotion();
  const text = format(whole ? Math.round(value) : value);
  // Columns slide only while the value changes. In a card-to-view flight the value is still,
  // so the digits ride the parent scale and stay next to their unit.
  const [seen, setSeen] = useState(text);
  const [changing, setChanging] = useState(false);
  if (seen !== text) {
    setSeen(text);
    setChanging(true);
  }
  useEffect(() => {
    if (!changing) {
      return;
    }
    const timer = window.setTimeout(() => setChanging(false), DIGIT_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [changing, seen]);
  const layout = changing ? ('position' as const) : false;

  if (reduced) {
    return (
      <span className={cn('num relative inline-block', className)}>
        <span className="sr-only">{text}</span>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ opacity: 1 }}
            aria-hidden="true"
            className="inline-block"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={text}
            transition={FADE}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </span>
    );
  }

  return (
    <span className={cn('num relative inline-block whitespace-nowrap', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        <AnimatePresence initial={false} mode="popLayout">
          {digitColumns(text).map((column) =>
            column.kind === 'digit' ? (
              <motion.span
                animate={{ opacity: 1 }}
                className="inline-block"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={column.key}
                layout={layout}
                transition={DIGIT_SPRING}
              >
                <DigitColumn char={column.char} delay={delay} fromZero={fromZero} />
              </motion.span>
            ) : (
              <motion.span
                animate={{ opacity: 1 }}
                className="inline-block whitespace-pre"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={`${column.key}-${column.char}`}
                layout={layout}
                transition={DIGIT_SPRING}
              >
                {column.char}
              </motion.span>
            ),
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}
