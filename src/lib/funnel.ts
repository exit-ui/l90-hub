import type { FunnelKey, HubState } from '@/store/types';
import { totalContacted } from './streak';

/** A rate between 0 and 1, or null when the divisor is 0. */
export function rate(part: number, whole: number): number | null {
  if (whole === 0) {
    return null;
  }
  return part / whole;
}

export interface FunnelRates {
  reply: number | null;
  positiveReply: number | null;
  loomWatch: number | null;
  responseAfterLoom: number | null;
  booking: number | null;
  overall: number | null;
}

type FunnelInput = Pick<HubState, 'funnel' | 'baseContacted' | 'days'>;

export function funnelRates(state: FunnelInput): FunnelRates {
  const { funnel } = state;
  const contacted = totalContacted(state);
  return {
    reply: rate(funnel.replied, contacted),
    positiveReply: rate(funnel.positive, funnel.replied),
    loomWatch: rate(funnel.loomWatched, funnel.loomSent),
    responseAfterLoom: rate(funnel.replyAfterLoom, funnel.loomWatched),
    booking: rate(funnel.booked, funnel.positive),
    overall: rate(funnel.closed, contacted),
  };
}

export const RATE_LABELS: readonly { key: keyof FunnelRates; label: string }[] = [
  { key: 'reply', label: 'Reply rate' },
  { key: 'positiveReply', label: 'Positive reply rate' },
  { key: 'loomWatch', label: 'Loom watch rate' },
  { key: 'responseAfterLoom', label: 'Response rate after Loom' },
  { key: 'booking', label: 'Booking rate' },
  { key: 'overall', label: 'Overall conversion' },
];

export const FUNNEL_INPUTS: readonly { key: FunnelKey; label: string }[] = [
  { key: 'sourced', label: 'Sourced' },
  { key: 'opened', label: 'Opened' },
  { key: 'replied', label: 'Replied' },
  { key: 'positive', label: 'Positive reply' },
  { key: 'loomSent', label: 'Loom sent' },
  { key: 'loomWatched', label: 'Loom watched' },
  { key: 'replyAfterLoom', label: 'Reply after Loom' },
  { key: 'booked', label: 'Call booked' },
  { key: 'attended', label: 'Call attended' },
  { key: 'closed', label: 'Closed' },
];

export interface FunnelStage {
  key: FunnelKey | 'contacted';
  label: string;
  value: number;
  automatic: boolean;
}

/** The 11 stages in funnel order. Contacted is automatic. */
export function funnelStages(state: FunnelInput): FunnelStage[] {
  const manual = FUNNEL_INPUTS.map(({ key, label }) => ({
    key,
    label,
    value: state.funnel[key],
    automatic: false,
  }));
  const contacted: FunnelStage = {
    key: 'contacted',
    label: 'Contacted',
    value: totalContacted(state),
    automatic: true,
  };
  return [manual[0], contacted, ...manual.slice(1)].filter(
    (stage): stage is FunnelStage => stage !== undefined,
  );
}
