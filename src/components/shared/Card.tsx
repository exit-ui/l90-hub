import { type HTMLMotionProps, motion } from 'motion/react';
import { cn } from '@/lib/utils';

type CardProps = HTMLMotionProps<'section'>;

/** A content surface. It does not move on hover, because it is not a control. */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <motion.section className={cn('surface-card min-w-0 p-4 sm:p-5 lg:p-6', className)} {...props}>
      {children}
    </motion.section>
  );
}

type LinkCardProps = HTMLMotionProps<'a'>;

/** A card that is one link. The full card is the touch target. */
export function LinkCard({ className, children, ...props }: LinkCardProps) {
  return (
    <motion.a
      className={cn('surface-card press block min-w-0 p-4 no-underline md:p-6', className)}
      {...props}
    >
      {children}
    </motion.a>
  );
}
