import { describe, expect, it } from 'vitest';
import { addDays } from '@/lib/dates';
import { MISSION_DAYS } from '@/lib/phases';
import { DEFAULT_START_DATE } from './defaults';
import { createSampleState, parseSampleKind, sampleHref } from './sample';

describe('sample preview', () => {
  it('reads the kind from the address', () => {
    expect(parseSampleKind('?sample=1')).toBe('today');
    expect(parseSampleKind('?sample=today')).toBe('today');
    expect(parseSampleKind('?sample=full')).toBe('full');
    expect(parseSampleKind('')).toBe('none');
    expect(parseSampleKind('?sample=0')).toBe('none');
  });

  it('adds and removes the sample part and keeps the route', () => {
    const at = { pathname: '/l90-hub/', search: '', hash: '#/outreach' };
    expect(sampleHref('full', at)).toBe('/l90-hub/?sample=full#/outreach');
    expect(sampleHref('today', at)).toBe('/l90-hub/?sample=1#/outreach');
    expect(sampleHref('none', { ...at, search: '?sample=full' })).toBe('/l90-hub/#/outreach');
  });

  it('fills every mission day in the full sample', () => {
    const last = addDays(DEFAULT_START_DATE, MISSION_DAYS - 1);
    const state = createSampleState(last, true);
    expect(Object.keys(state.days)).toHaveLength(MISSION_DAYS);
    expect(state.days[last]?.dm).toBeGreaterThanOrEqual(20);
    expect(state.lessons.every((lesson) => lesson.done)).toBe(true);
  });
});
