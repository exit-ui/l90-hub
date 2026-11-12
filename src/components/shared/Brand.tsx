import { cn } from '@/lib/utils';

/** The small laurel mark of L90. It draws in the current text colour. */
export function LaurelMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn('size-7 shrink-0', className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
      viewBox="0 0 28 28"
    >
      <path d="M9 23C4 19 3.5 11 8 6" />
      <path d="M19 23c5-4 5.5-12 1-17" />
      <path d="M6.5 17.5c-2 .2-3.2-.6-3.8-2 1.6-.6 3-.3 3.8 2zM5.6 12.6c-1.8-.4-2.6-1.5-2.7-3 1.7-.1 2.8.8 2.7 3zM21.5 17.5c2 .2 3.2-.6 3.8-2-1.6-.6-3-.3-3.8 2zM22.4 12.6c1.8-.4 2.6-1.5 2.7-3-1.7-.1-2.8.8-2.7 3z" />
    </svg>
  );
}

/** The wordmark: the laurel and "L90". */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-hub-text', className)}>
      <LaurelMark className="text-hub-brand-ink" />
      <span className="type-metric">L90</span>
    </span>
  );
}
