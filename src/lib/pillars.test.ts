import { describe, expect, it } from 'vitest';
import { defaultWeekTemplate } from '@/store/defaults';
import {
  cueMinutes,
  inPillarOrder,
  isGymTask,
  isStudyTask,
  nextTask,
  pillarMetric,
  pillarOfTask,
  splitTask,
  tasksByPillar,
} from './pillars';

describe('pillarOfTask', () => {
  const cases: readonly [string, string][] = [
    ['06:20 Send the drafted DMs at the bus stop.', 'outreach'],
    ['On the bus home: read 1 chapter.', 'reading'],
    ['Evening block 1 (90 min): vet 20 creators by hand. Draft 20 DMs.', 'outreach'],
    ['Go to the gym.', 'fitness'],
    ['Do the Linux and Python session.', 'learning'],
    ['Rest.', 'fitness'],
    ['Before bed: log the numbers. Write one win.', 'signoff'],
    ['Do the weekly review. Compare the funnel numbers with last week.', 'signoff'],
    ['Make the monthly crypto tranche decision.', 'trading'],
    ['Fix the pipeline. Stop after 3 hours.', 'outreach'],
    ['Vet 20 creators. Draft the DMs for Monday.', 'outreach'],
  ];

  it.each(cases)('maps "%s" to %s', (text, pillar) => {
    expect(pillarOfTask(text)).toBe(pillar);
  });

  it('maps every line of the default template to a pillar', () => {
    const template = defaultWeekTemplate();
    const lines = Object.values(template).flat();
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(pillarOfTask(line)).toMatch(/^(outreach|fitness|learning|reading|trading|signoff)$/);
    }
  });

  it('ignores case and matches whole words only', () => {
    expect(pillarOfTask('GYM at noon')).toBe('fitness');
    expect(pillarOfTask('Check the interest rate.')).toBe('signoff');
    expect(pillarOfTask('Call the bank.')).toBe('signoff');
  });

  it('marks the tasks that log a session', () => {
    expect(isGymTask('Go to the gym.')).toBe(true);
    expect(isGymTask('Rest.')).toBe(false);
    expect(isStudyTask('Do the Linux and Python session.')).toBe(true);
    expect(isStudyTask('Review the flashcards.')).toBe(false);
  });
});

describe('pillarMetric', () => {
  it('gives the history metric of each pillar', () => {
    expect(['outreach', 'fitness', 'learning', 'reading', 'trading', 'signoff'].map((id) => pillarMetric(id as Parameters<typeof pillarMetric>[0]))).toEqual([
      'dm',
      'gym',
      'learning',
      'reading',
      'r',
      'tasks',
    ]);
  });
});

describe('splitTask', () => {
  it('reads a leading time as the cue', () => {
    expect(splitTask('06:20 Send the drafted DMs at the bus stop.')).toEqual({
      cue: '06:20',
      action: 'Send the drafted DMs at the bus stop.',
    });
    expect(splitTask('6:20 send the DMs.')).toEqual({ cue: '6:20', action: 'Send the DMs.' });
  });

  it('reads a short phrase before the first colon as the cue', () => {
    expect(splitTask('Evening block 1 (90 min): vet 20 creators by hand. Draft 20 DMs.')).toEqual({
      cue: 'Evening block 1 (90 min)',
      action: 'Vet 20 creators by hand. Draft 20 DMs.',
    });
    expect(splitTask('On the bus home: read 1 chapter.')).toEqual({
      cue: 'On the bus home',
      action: 'Read 1 chapter.',
    });
  });

  it('keeps a task without a cue', () => {
    expect(splitTask('Go to the gym.')).toEqual({ cue: null, action: 'Go to the gym.' });
  });

  it('does not use a long phrase as the cue', () => {
    const text = 'This line is much longer than forty characters before it: has a colon.';
    expect(splitTask(text).cue).toBeNull();
  });

  it('gives the minutes of a time cue', () => {
    expect(cueMinutes('06:20')).toBe(380);
    expect(cueMinutes('6:20')).toBe(380);
    expect(cueMinutes('On the bus home')).toBeNull();
    expect(cueMinutes('25:00')).toBeNull();
    expect(cueMinutes(null)).toBeNull();
  });
});

describe('tasksByPillar', () => {
  it('groups a Monday of the default template', () => {
    // 2026-11-09 is a Monday.
    const groups = tasksByPillar(defaultWeekTemplate(), '2026-11-09');
    expect(groups.outreach).toHaveLength(2);
    expect(groups.reading).toEqual(['On the bus home: read 1 chapter.']);
    expect(groups.fitness).toEqual(['Go to the gym.']);
    expect(groups.learning).toEqual([]);
    expect(groups.trading).toEqual([]);
    expect(groups.signoff).toEqual(['Before bed: log the numbers. Write one win.']);
  });

  it('orders the tasks by pillar', () => {
    expect(inPillarOrder(['Rest.', 'Send 5 DMs.', 'Read 1 chapter.'])).toEqual([
      'Send 5 DMs.',
      'Rest.',
      'Read 1 chapter.',
    ]);
  });
});

describe('nextTask', () => {
  const tasks = [
    '06:20 Send the drafted DMs at the bus stop.',
    'On the bus home: read 1 chapter.',
    'Go to the gym.',
  ];

  it('gives the first open task whose time has come', () => {
    expect(nextTask(tasks, {}, new Date(2026, 10, 9, 7, 0))).toBe(tasks[0]);
  });

  it('gives the first open task in pillar order before the time', () => {
    expect(nextTask(tasks, {}, new Date(2026, 10, 9, 5, 0))).toBe(tasks[0]);
    expect(nextTask(tasks, { [tasks[0] ?? '']: true }, new Date(2026, 10, 9, 5, 0))).toBe(
      'Go to the gym.',
    );
  });

  it('gives null when all tasks are done', () => {
    const done = Object.fromEntries(tasks.map((task) => [task, true]));
    expect(nextTask(tasks, done, new Date(2026, 10, 9, 12, 0))).toBeNull();
  });
});
