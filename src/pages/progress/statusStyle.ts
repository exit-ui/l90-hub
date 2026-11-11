import { Check, Circle, Minus, type LucideIcon } from 'lucide-react';
import type { DayStatus } from '@/lib/status';

/**
 * The icon and the classes of each day status. The icon is the signal; the colour is an addition.
 * A past day without ticks is neutral, not red: a missed day is not a failure.
 */
export const STATUS_STYLE: Readonly<
  Record<DayStatus, { icon: LucideIcon; cell: string; tone: string; dot: string }>
> = {
  'signed off': {
    icon: Check,
    cell: 'bg-hub-positive/15 text-hub-text',
    tone: 'text-hub-positive',
    dot: 'bg-hub-positive',
  },
  'partly done': {
    icon: Minus,
    cell: 'bg-hub-raised text-hub-text',
    tone: 'text-hub-text',
    dot: 'bg-hub-label-strong',
  },
  missed: { icon: Circle, cell: 'bg-hub-raised/40 text-hub-label', tone: 'text-hub-label', dot: 'bg-hub-track' },
  open: { icon: Circle, cell: 'bg-hub-raised/40 text-hub-label', tone: 'text-hub-label', dot: 'bg-hub-inset' },
};
