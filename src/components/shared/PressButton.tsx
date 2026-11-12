import { type HTMLMotionProps, motion } from 'motion/react';
import { BUTTON_TAP } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type ButtonTone = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger';

/**
 * primary   : the one white filled button of a view.
 * secondary : a light fill with a hairline rim. Not glass: glass is for the navigation layer.
 * soft      : a quiet fill inside a module.
 * ghost     : text only.
 */
const TONES: Readonly<Record<ButtonTone, string>> = {
  primary: 'bg-grad-primary text-hub-ink glow-primary',
  secondary: 'bg-hub-track text-hub-text rim-hairline hover:bg-hub-glass-edge',
  soft: 'surface-inset text-hub-text hover:bg-hub-track',
  ghost: 'bg-transparent text-hub-text hover:bg-hub-inset',
  danger: 'surface-inset text-hub-danger hover:bg-hub-track',
};

interface PressButtonProps extends HTMLMotionProps<'button'> {
  tone?: ButtonTone;
  /** A round button for one icon. Give it an aria-label. */
  iconOnly?: boolean;
}

/** A capsule button: 40 px on a phone, 44 px from 640 px, always a 44 px touch target. It scales to 96 % on press, in 100 ms. */
export function PressButton({
  tone = 'soft',
  iconOnly = false,
  className,
  type = 'button',
  children,
  ...props
}: PressButtonProps) {
  return (
    <motion.button
      className={cn(
        'hit-area inline-flex min-h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full type-body sm:min-h-11 sm:min-w-11 font-semibold whitespace-nowrap transition-colors select-none disabled:cursor-not-allowed disabled:opacity-40',
        iconOnly ? 'size-10 p-0 sm:size-11' : 'px-4',
        TONES[tone],
        className,
      )}
      type={type}
      whileTap={BUTTON_TAP}
      {...props}
    >
      {children}
    </motion.button>
  );
}
