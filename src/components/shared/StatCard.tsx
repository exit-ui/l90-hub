import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  /** One large value. */
  value: ReactNode;
  /** A short line below the value. */
  detail?: ReactNode;
  /** One small chart or bar. */
  chart: ReactNode;
  icon?: LucideIcon;
  /** With a link, the full card opens the page. */
  href?: string;
  /** Where the chart goes: below the value, or at the side of the value. */
  chartPlacement?: 'below' | 'side';
  className?: string;
}

/** A label, one large value, and one small chart or bar. */
export function StatCard({
  label,
  value,
  detail,
  chart,
  icon: Icon,
  href,
  chartPlacement = 'below',
  className,
}: StatCardProps) {
  const side = chartPlacement === 'side';
  const body = (
    <div className="flex h-full flex-col gap-3">
      <p className="type-label text-hub-label flex items-center gap-2">
        {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
        <span className="truncate">{label}</span>
      </p>
      <div className={cn('flex flex-1 gap-3', side ? 'items-center justify-between' : 'flex-col')}>
        <div className="min-w-0">
          <p className="type-number num text-hub-text">{value}</p>
          {detail ? <p className="mt-1 type-label text-hub-label">{detail}</p> : null}
        </div>
        <div className={cn(side ? 'shrink-0' : 'mt-auto w-full')}>{chart}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        className={cn('surface-card press block min-w-0 p-4 no-underline md:p-6', className)}
        href={href}
      >
        {body}
      </a>
    );
  }
  return <div className={cn('surface-card min-w-0 p-4 md:p-6', className)}>{body}</div>;
}
