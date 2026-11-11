import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { StatCard } from '@/components/shared/StatCard';

interface StatTileProps {
  label: string;
  /** One large value. A dash when there is no value. */
  value: string;
  detail?: string;
  /** Kept for older call sites. Stat tiles show no icon. */
  icon?: LucideIcon;
  /** An optional small bar below the value. */
  bar?: ReactNode;
  className?: string;
}

/** A label and one large value: the shared stat card. */
export function StatTile({ label, value, detail, bar, className }: StatTileProps) {
  return <StatCard chart={bar} className={className} detail={detail} label={label} value={value} />;
}
