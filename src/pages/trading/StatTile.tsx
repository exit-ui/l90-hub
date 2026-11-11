import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  /** One large value. A dash when there is no value. */
  value: string;
  detail?: string;
  icon?: LucideIcon;
  /** An optional small bar below the value. */
  bar?: ReactNode;
  className?: string;
}

/** A label and one large value. */
export function StatTile({ label, value, detail, icon: Icon, bar, className }: StatTileProps) {
  return (
    <div className={cn('surface-tile min-w-0 p-4', className)}>
      <div className="flex h-full flex-col gap-2">
        <p className="type-label text-hub-label flex items-center gap-2">
          {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
          <span className="min-w-0 break-words">{label}</span>
        </p>
        <p className="type-title leading-8 font-semibold break-words text-hub-text num">{value}</p>
        {detail ? <p className="type-label text-hub-label">{detail}</p> : null}
        {bar ? <div className="mt-auto pt-1">{bar}</div> : null}
      </div>
    </div>
  );
}
