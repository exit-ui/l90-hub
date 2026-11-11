import { Info, type LucideIcon, OctagonAlert, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { NoticeKind } from '@/store/types';
import { cn } from '@/lib/utils';

const KINDS: Readonly<Record<NoticeKind, { icon: LucideIcon; tone: string; label: string }>> = {
  WARNING: { icon: OctagonAlert, tone: 'text-hub-danger', label: 'Warning' },
  CAUTION: { icon: TriangleAlert, tone: 'text-hub-amber', label: 'Caution' },
  NOTE: { icon: Info, tone: 'text-hub-accent-text', label: 'Note' },
};

interface NoticeProps {
  kind: NoticeKind;
  children: ReactNode;
  /** Announce the message to a screen reader at once. The default is true for a WARNING. */
  announce?: boolean;
  className?: string;
}

/** One calm line with an icon and a text label. The colour is not the only signal. */
export function Notice({ kind, children, announce = kind === 'WARNING', className }: NoticeProps) {
  const { icon: Icon, tone, label } = KINDS[kind];
  return (
    <div
      className={cn('surface-card flex items-start gap-3 rounded-card px-4 py-3', className)}
      role={announce ? 'alert' : 'note'}
    >
      <Icon aria-hidden="true" className={cn('mt-1 size-4 shrink-0', tone)} />
      <p className="min-w-0 type-body text-hub-text">
        <span className={cn('mr-2 type-label font-semibold', tone)}>{label}</span>
        {children}
      </p>
    </div>
  );
}
