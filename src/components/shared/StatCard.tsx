import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  /** One large value. */
  value: ReactNode;
  /** A short line below the value. */
  detail?: ReactNode;
  /** One small chart or bar below the value. */
  chart?: ReactNode;
  /** Kept for older call sites. Stat cards show no icon: the label carries the meaning. */
  icon?: LucideIcon;
  /** With a link, the full card opens the page. */
  href?: string;
  /** Kept for older call sites. The chart always sits below the value. */
  chartPlacement?: 'below' | 'side';
  className?: string;
}

/** A stat on the content material: a label, one number, a short detail and an optional bar. */
export function StatCard({ label, value, detail, chart, href, className }: StatCardProps) {
  const body = (
    <div className="flex h-full flex-col">
      <p className="type-label text-hub-label">{label}</p>
      <p className="type-number num mt-2 break-words text-hub-text">{value}</p>
      {detail ? <p className="type-label mt-1 text-hub-label">{detail}</p> : null}
      {chart ? <div className="mt-auto pt-4">{chart}</div> : null}
    </div>
  );
  const shell = cn('surface-card block min-w-0 p-4 sm:p-5 lg:p-6', className);
  if (href) {
    return (
      <a className={cn(shell, 'press no-underline')} href={href}>
        {body}
      </a>
    );
  }
  return <div className={shell}>{body}</div>;
}
