import { describe, expect, it } from 'vitest';
import { createDefaultState, emptyDay } from '@/store/defaults';
import {
  answersFromDraft,
  buildFromAnswers,
  draftFromState,
  draftIsValid,
  funnelWarnings,
  pastDates,
  reviewSummary,
  stepErrors,
  visibleSteps,
} from './onboarding';
import { sanitizeState } from './storage';
import { totalContacted } from './streak';

const TODAY = '2026-10-23';

describe('past dates', () => {
  it('lists the days from the start date to yesterday', () => {
    expect(pastDates('2026-10-20', TODAY)).toEqual(['2026-10-20', '2026-10-21', '2026-10-22']);
  });

  it('is empty when the start date is today, in the future or not a date', () => {
    expect(pastDates('2026-10-23', TODAY)).toEqual([]);
    expect(pastDates('2026-11-01', TODAY)).toEqual([]);
    expect(pastDates('2026-13-01', TODAY)).toEqual([]);
  });

  it('stops after 90 days', () => {
    expect(pastDates('2025-01-01', TODAY)).toHaveLength(90);
  });
});

describe('draft', () => {
  it('holds the values of the hub, with an empty field for a zero', () => {
    const state = createDefaultState();
    state.days['2026-10-21'] = { ...emptyDay(), dm: 18 };
    const draft = draftFromState(state, TODAY);
    expect(draft.dmTarget).toBe('20');
    expect(draft.baseContacted).toBe('40');
    expect(draft.pastDm).toEqual({ '2026-10-20': '', '2026-10-21': '18', '2026-10-22': '' });
    expect(draft.funnel.replied).toBe('');
    expect(draft.coins).toHaveLength(11);
    expect(draft.bookChapters).toBe('0');
  });

  it('turns back into the same values when the user changes nothing', () => {
    const state = createDefaultState();
    const answers = answersFromDraft(draftFromState(state, TODAY), TODAY);
    expect(answers.dmTarget).toBe(20);
    expect(answers.baseContacted).toBe(40);
    expect(answers.riskPercent).toBe(1);
    expect(answers.funnel).toEqual(state.funnel);
    expect(buildFromAnswers(state, answers)).toEqual({ ...state, onboarded: true });
  });
});

describe('step errors', () => {
  const draft = () => draftFromState(createDefaultState(), TODAY);

  it('has no error for the first draft', () => {
    expect(draftIsValid(draft(), TODAY)).toBe(true);
  });

  it('rejects a start date that is not complete', () => {
    expect(stepErrors('mission', { ...draft(), startDate: '' }, TODAY).startDate).toBeDefined();
  });

  it('needs a target of 1 or more and accepts a start count of 0', () => {
    const errors = stepErrors('mission', { ...draft(), dmTarget: '0', baseContacted: '0' }, TODAY);
    expect(errors.dmTarget).toBeDefined();
    expect(errors.baseContacted).toBeUndefined();
  });

  it('rejects text, decimals and negative numbers in whole-number fields', () => {
    for (const bad of ['', 'abc', '2.5', '-3']) {
      expect(stepErrors('targets', { ...draft(), fitTarget: bad }, TODAY).fitTarget).toBeDefined();
    }
  });

  it('accepts a risk with decimals and rejects 0', () => {
    expect(stepErrors('targets', { ...draft(), riskPercent: '0.5' }, TODAY).riskPercent).toBeUndefined();
    expect(stepErrors('targets', { ...draft(), riskPercent: '0' }, TODAY).riskPercent).toBeDefined();
  });

  it('allows empty fields for the past days and the funnel', () => {
    const value = draft();
    value.pastDm['2026-10-21'] = '12';
    expect(stepErrors('past', value, TODAY)).toEqual({});
    value.pastDm['2026-10-22'] = '-1';
    expect(Object.keys(stepErrors('past', value, TODAY))).toEqual(['past-2026-10-22']);
    value.funnel.replied = 'x';
    expect(Object.keys(stepErrors('funnel', value, TODAY))).toEqual(['funnel-replied']);
  });

  it('rejects more chapters read than chapters in the book', () => {
    const value = { ...draft(), bookChapters: '10', bookRead: '11' };
    expect(stepErrors('book', value, TODAY).bookRead).toBeDefined();
    expect(stepErrors('book', { ...value, bookChapters: '0' }, TODAY).bookRead).toBeUndefined();
  });

  it('accepts decimal coin amounts and rejects negative prices', () => {
    const value = draft();
    value.coins[0] = { symbol: 'BTC', amount: '0.062', price: '-5' };
    const errors = stepErrors('wallet', value, TODAY);
    expect(errors['coin-0-amount']).toBeUndefined();
    expect(errors['coin-0-price']).toBeDefined();
  });

  it('shows the past days step only when the start date is before today', () => {
    expect(visibleSteps(draft(), TODAY)).toContain('past');
    expect(visibleSteps({ ...draft(), startDate: TODAY }, TODAY)).not.toContain('past');
  });
});

describe('build from answers', () => {
  it('writes the DMs of the past days and keeps the other data of a day', () => {
    const state = createDefaultState();
    state.days['2026-10-21'] = { ...emptyDay(), dm: 3, win: 'A win.', done: { A: true } };
    const draft = draftFromState(state, TODAY);
    draft.pastDm['2026-10-20'] = '20';
    draft.pastDm['2026-10-21'] = '22';
    const built = buildFromAnswers(state, answersFromDraft(draft, TODAY));
    expect(built.days['2026-10-20']?.dm).toBe(20);
    expect(built.days['2026-10-21']).toMatchObject({ dm: 22, win: 'A win.', done: { A: true } });
    expect(built.days['2026-10-22']).toBeUndefined();
    expect(totalContacted(built)).toBe(40 + 20 + 22);
  });

  it('sets the targets, the funnel, the wallet and the rewards', () => {
    const state = createDefaultState();
    const draft = draftFromState(state, TODAY);
    draft.dmTarget = '25';
    draft.fitTarget = '4';
    draft.riskPercent = '0.5';
    draft.funnel.replied = '12';
    draft.coins[0] = { symbol: 'BTC', amount: '0.062', price: '71200' };
    draft.rewards = ['One', '', 'Three'];
    const built = buildFromAnswers(state, answersFromDraft(draft, TODAY));
    expect(built).toMatchObject({ dmTarget: 25, fitTarget: 4, riskPercent: 0.5, onboarded: true });
    expect(built.funnel.replied).toBe(12);
    expect(built.coins[0]).toEqual({ symbol: 'BTC', amount: 0.062, priceGbp: 71200 });
    expect(built.rewards).toEqual(['One', '', 'Three']);
  });

  it('sets the chapters of the current book and finishes a book that is complete', () => {
    const state = createDefaultState();
    const draft = draftFromState(state, TODAY);
    draft.bookChapters = '22';
    draft.bookRead = '14';
    let built = buildFromAnswers(state, answersFromDraft(draft, TODAY));
    expect(built.books[0]).toMatchObject({ chapters: 22, read: 14, status: 'current' });
    draft.bookRead = '22';
    built = buildFromAnswers(state, answersFromDraft(draft, TODAY));
    expect(built.books[0]?.status).toBe('done');
    expect(built.books[1]?.status).toBe('current');
  });

  it('survives a trip through the saved record', () => {
    const state = createDefaultState();
    const draft = draftFromState(state, TODAY);
    draft.pastDm['2026-10-20'] = '20';
    const built = buildFromAnswers(state, answersFromDraft(draft, TODAY));
    expect(sanitizeState(JSON.parse(JSON.stringify(built)))).toEqual(built);
  });
});

describe('review', () => {
  it('counts the contacted creators and the days with DMs', () => {
    const state = createDefaultState();
    const draft = draftFromState(state, TODAY);
    draft.pastDm['2026-10-20'] = '20';
    draft.pastDm['2026-10-21'] = '15';
    const summary = reviewSummary(state, answersFromDraft(draft, TODAY));
    expect(summary).toMatchObject({ contacted: 75, daysPast: 3, daysWithDms: 2, warnings: [] });
  });

  it('warns when a funnel number is above the number before it', () => {
    const funnel = { ...createDefaultState().funnel, replied: 50, positive: 60 };
    expect(funnelWarnings(funnel, 40)).toHaveLength(2);
    expect(funnelWarnings(createDefaultState().funnel, 40)).toEqual([]);
  });

  it('keeps each warning to 20 words or fewer', () => {
    const funnel = {
      sourced: 0,
      opened: 0,
      replied: 9,
      positive: 8,
      loomSent: 1,
      loomWatched: 2,
      replyAfterLoom: 3,
      booked: 9,
      attended: 10,
      closed: 11,
    };
    for (const text of funnelWarnings(funnel, 1)) {
      expect(text.split(/\s+/).length).toBeLessThanOrEqual(20);
    }
  });
});

describe('the onboarded flag in the saved record', () => {
  it('is false for an empty record and true for a record that holds data', () => {
    expect(sanitizeState({}).onboarded).toBe(false);
    expect(sanitizeState({ days: { '2026-10-20': { dm: 5 } } }).onboarded).toBe(true);
  });

  it('keeps a value that the record has', () => {
    expect(sanitizeState({ onboarded: true }).onboarded).toBe(true);
    expect(sanitizeState({ onboarded: false, days: { '2026-10-20': { dm: 5 } } }).onboarded).toBe(
      false,
    );
  });
});
