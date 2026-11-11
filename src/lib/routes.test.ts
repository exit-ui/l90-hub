import { describe, expect, it } from 'vitest';
import {
  closeAction,
  expandedFrom,
  MORE_PAGES,
  PAGE_LABELS,
  PRIMARY_PAGES,
  parseRoute,
  redirectHash,
  routeHref,
} from './routes';

describe('routes', () => {
  it('has Today, Outreach and Progress in the bar, and 5 pages in More', () => {
    expect(PRIMARY_PAGES.map((page) => PAGE_LABELS[page])).toEqual(['Today', 'Outreach', 'Progress']);
    expect(MORE_PAGES.map((page) => PAGE_LABELS[page])).toEqual([
      'Learning',
      'Fitness',
      'Trading',
      'Method',
      'Setup',
    ]);
  });

  it('sends the old Calendar routes to Progress → Days', () => {
    expect(redirectHash('#/calendar')).toBe('#/progress/days');
    expect(redirectHash('#/calendar/2026-10-21')).toBe('#/progress/days/2026-10-21');
    expect(redirectHash('#/calendar/template')).toBe('#/setup/week');
    expect(redirectHash('#/home')).toBeNull();
    expect(parseRoute('#/calendar/2026-10-21')).toEqual({
      page: 'progress',
      segments: ['days', '2026-10-21'],
    });
  });

  it('gives Today for an unknown route', () => {
    expect(parseRoute('#/nowhere')).toEqual({ page: 'home', segments: [] });
    expect(parseRoute('')).toEqual({ page: 'home', segments: [] });
  });

  it('reads the expanded view from #/home/<id>', () => {
    expect(expandedFrom(parseRoute('#/home/outreach'))).toBe('outreach');
    expect(expandedFrom(parseRoute('#/home/progress'))).toBe('progress');
    expect(expandedFrom(parseRoute('#/home'))).toBeNull();
    expect(expandedFrom(parseRoute('#/outreach'))).toBeNull();
    expect(expandedFrom(parseRoute('#/home/foo'))).toBeNull();
    expect(redirectHash('#/home/foo')).toBe('#/home');
    expect(redirectHash('#/home/signoff')).toBeNull();
  });

  it('goes back after a push and replaces after a deep link', () => {
    expect(closeAction(true)).toBe('back');
    expect(closeAction(false)).toBe('replace');
  });

  it('builds a hash route', () => {
    expect(routeHref('progress', 'days')).toBe('#/progress/days');
  });
});
