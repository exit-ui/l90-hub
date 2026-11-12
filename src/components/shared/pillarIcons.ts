import { BookOpen, Dumbbell, type LucideIcon, MoonStar, Send, Terminal, TrendingUp } from 'lucide-react';
import type { PillarId } from '@/lib/pillars';

/** One icon for each pillar. It sits in a round chip; the name next to it carries the meaning. */
export const PILLAR_ICONS: Readonly<Record<PillarId, LucideIcon>> = {
  outreach: Send,
  fitness: Dumbbell,
  learning: Terminal,
  reading: BookOpen,
  trading: TrendingUp,
  signoff: MoonStar,
};
