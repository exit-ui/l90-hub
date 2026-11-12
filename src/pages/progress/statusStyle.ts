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
    cell: 'bg-hub-done-bg text-hub-text',
    tone: 'text-hub-positive',
    dot: 'bg-hub-success',
  },
  'partly done': {
    icon: Minus,
    cell: 'bg-hub-chip text-hub-text',
    tone: 'text-hub-text',
    dot: 'bg-hub-partial',
  },
  missed: { icon: Circle, cell: 'bg-hub-inset text-hub-label', tone: 'text-hub-label', dot: 'bg-hub-track' },
  open: { icon: Circle, cell: 'bg-hub-inset text-hub-label', tone: 'text-hub-label', dot: 'bg-hub-chart-future' },
};
