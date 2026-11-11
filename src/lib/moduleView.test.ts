import { describe, expect, it } from 'vitest';
import { createDefaultState, emptyDay } from '@/store/defaults';
import type { HubState } from '@/store/types';
import { allModulesComplete, isModuleComplete, momentumText, outreachNote, todayView } from './moduleView';

// 2026-11-09 is a Monday: 2 outreach tasks, 1 reading, 1 gym and 1 sign-off task.
const MONDAY = '2026-11-09';
const MORNING = new Date(2026, 10, 9, 7, 0);

function state(): HubState {
  return createDefaultState();
}

describe('todayView', () => {
  it('gives 6 modules in the fixed order', () => {
    const view = todayView(state(), MONDAY, MORNING);
    expect(view.modules.map((module) => module.name)).toEqual([
      'Outreach',
      'Fitness',
      'Learning',
      'Reading',
      'Trading',
      'Sign-off',
    ]);
  });

  it('puts only the ticks of each pillar in its module', () => {
    const view = todayView(state(), MONDAY, MORNING);
    const ticks = Object.fromEntries(view.modules.map((module) => [module.id, module.ticks.map((tick) => tick.task)]));
    expect(ticks.outreach).toHaveLength(2);
    expect(ticks.fitness).toEqual(['Go to the gym.']);
    expect(ticks.learning).toEqual([]);
    expect(ticks.trading).toEqual([]);
  });

  it('marks exactly one next task', () => {
    const view = todayView(state(), MONDAY, MORNING);
    const next = view.modules.flatMap((module) => module.ticks).filter((tick) => tick.isNext);
    expect(next).toHaveLength(1);
    expect(next[0]?.cue).toBe('06:20');
  });

  it('completes Outreach only at the target with all ticks done', () => {
    const hub = state();
    const tasks = hub.weekTemplate[1].filter((task) => /DMs/.test(task));
    hub.days[MONDAY] = { ...emptyDay(), dm: 20, done: Object.fromEntries(tasks.map((task) => [task, true])) };
    const outreach = todayView(hub, MONDAY, MORNING).modules[0];
    expect(outreach?.complete).toBe(true);
    expect(outreach?.barTone).toBe('complete');
    hub.days[MONDAY] = { ...emptyDay(), dm: 20 };
    expect(todayView(hub, MONDAY, MORNING).modules[0]?.complete).toBe(false);
  });

  it('turns the trading bar amber at the chart check limit', () => {
    const hub = state();
    hub.days[MONDAY] = { ...emptyDay(), chartChecks: 3 };
    const trading = todayView(hub, MONDAY, MORNING).modules[4];
    expect(trading?.barTone).toBe('limit');
    expect(trading?.valueText).toBe('0.00');
  });

  it('gives the sign-off percent of all ticks of the day', () => {
    const hub = state();
    const first = hub.weekTemplate[1][0] ?? '';
    hub.days[MONDAY] = { ...emptyDay(), done: { [first]: true } };
    const view = todayView(hub, MONDAY, MORNING);
    expect(view.modules[5]?.valueText).toBe('20');
    expect(view.ticksDone).toBe(1);
    expect(view.othersComplete).toBe(false);
  });

  it('makes Sign-off done only after the sign-off with its ticks done', () => {
    const hub = state();
    const log = hub.weekTemplate[1].find((task) => /log the numbers/i.test(task)) ?? '';
    hub.days[MONDAY] = { ...emptyDay(), done: { [log]: true } };
    // A tick on the sign-off row is a plain tick: the day is not signed off.
    expect(todayView(hub, MONDAY, MORNING).signedOff).toBe(false);
    expect(todayView(hub, MONDAY, MORNING).modules[5]?.complete).toBe(false);
    hub.days[MONDAY] = { ...emptyDay(), done: { [log]: true }, signedOff: true };
    const signoff = todayView(hub, MONDAY, MORNING).modules[5];
    expect(signoff?.complete).toBe(true);
    expect(signoff?.badge).toBe('Done');
    expect(signoff?.note).toBeNull();
  });

  it('leaves the tick count out of the live text of an empty module', () => {
    const learning = todayView(state(), MONDAY, MORNING).modules[2];
    expect(learning?.announce).not.toContain('0 of 0');
  });

  it('says "1 more" near the goal', () => {
    const hub = state();
    hub.fitTarget = 4;
    hub.fitness = ['2026-11-09', '2026-11-10', '2026-11-11'].map((date) => ({
      date,
      type: 'Push',
      minutes: 60,
      note: '',
    }));
    expect(todayView(hub, '2026-11-11', MORNING).modules[1]?.note).toBe('1 more');
  });
});

describe('momentumText', () => {
  it('never shows a 0', () => {
    expect(momentumText({ daysOnTarget: 0, streak: 0, best: 0, state: 'ended' })).toEqual({
      lead: 'Start today',
      detail: null,
      recover: false,
    });
    expect(momentumText({ daysOnTarget: 4, streak: 0, best: 3, state: 'ended' }).detail).toBe('Best: 3 days');
    expect(momentumText({ daysOnTarget: 4, streak: 2, best: 3, state: 'recover' })).toEqual({
      lead: '4 days on target',
      detail: 'Recover today',
      recover: true,
    });
  });
});

describe('outreachNote', () => {
  it('asks for 1 DM late in the day with 0 DMs', () => {
    expect(outreachNote(0, 20, 17)).toBe('Send 1 DM now.');
    expect(outreachNote(0, 20, 9)).toBe('20 more to the target.');
    expect(outreachNote(20, 20, 9)).toBe('Target hit. Each extra DM is a bonus.');
  });
});

describe('isModuleComplete', () => {
  it('needs every tick, plus the target for Outreach and the sign-off for Sign-off', () => {
    expect(isModuleComplete({ id: 'fitness', ticksDone: 1, ticksTotal: 1 })).toBe(true);
    expect(isModuleComplete({ id: 'fitness', ticksDone: 0, ticksTotal: 1 })).toBe(false);
    expect(isModuleComplete({ id: 'fitness', ticksDone: 0, ticksTotal: 0 })).toBe(false);
    expect(isModuleComplete({ id: 'outreach', ticksDone: 2, ticksTotal: 2, dm: 19, target: 20 })).toBe(false);
    expect(isModuleComplete({ id: 'outreach', ticksDone: 2, ticksTotal: 2, dm: 20, target: 20 })).toBe(true);
    expect(isModuleComplete({ id: 'outreach', ticksDone: 1, ticksTotal: 2, dm: 25, target: 20 })).toBe(false);
    expect(isModuleComplete({ id: 'signoff', ticksDone: 1, ticksTotal: 1, signedOff: false })).toBe(false);
    expect(isModuleComplete({ id: 'signoff', ticksDone: 1, ticksTotal: 1, signedOff: true })).toBe(true);
  });

  it('calls the day complete when each module is done or has no tick', () => {
    const done = (id: 'outreach' | 'fitness' | 'signoff', complete: boolean, ticks = 1) => ({
      id,
      complete,
      ticks: Array.from({ length: ticks }, () => ({ task: 't', cue: null, action: 'T', done: complete, isNext: false })),
    });
    expect(allModulesComplete([done('outreach', true), done('fitness', false, 0), done('signoff', true)])).toBe(true);
    expect(allModulesComplete([done('outreach', true), done('fitness', false), done('signoff', true)])).toBe(false);
    expect(allModulesComplete([done('outreach', true), done('signoff', false, 0)])).toBe(false);
  });
});
