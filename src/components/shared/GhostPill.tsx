import type { LucideIcon } from 'lucide-react';
import { type HTMLMotionProps, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { BUTTON_TAP } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface GhostPillProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon?: LucideIcon;
  children: ReactNode;
}

/** A small quiet pill with an icon, for secondary acts like "Adjust" or "Edit". 44 px tall. */
export function GhostPill({ icon: Icon, className, children, type = 'button', ...props }: GhostPillProps) {
  return (
    <motion.button
      className={cn(
        'type-label inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-hub-inset px-4 font-medium text-hub-label-strong rim-hairline transition-colors hover:bg-hub-track hover:text-hub-text',
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
