import type { LucideIcon } from 'lucide-react';
import { type HTMLMotionProps, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { BUTTON_TAP } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface GhostPillProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon?: LucideIcon;
  children: ReactNode;
}

/** A small quiet pill with an icon, for secondary acts like "Adjust" or "Edit". 36 px on a phone with a 44 px touch target. */
export function GhostPill({ icon: Icon, className, children, type = 'button', ...props }: GhostPillProps) {
  return (
    <motion.button
      className={cn(
        'type-label hit-area inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-hub-chip px-3.5 font-medium text-hub-label-strong transition-colors hover:bg-hub-track hover:text-hub-text sm:min-h-11 sm:px-4',
        className,
      )}
      type={type}
      whileTap={BUTTON_TAP}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
      {children}
    </motion.button>
  );
}
