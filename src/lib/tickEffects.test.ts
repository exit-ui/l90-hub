import { describe, expect, it } from 'vitest';
import { createDefaultState } from '@/store/defaults';
import type { HubState } from '@/store/types';
import { nextGymType, toggleTaskState } from './tickEffects';

const DATE = '2026-11-09';

function apply(state: HubState, task: string): HubState {
  return { ...state, ...toggleTaskState(state, DATE, task) };
}

function withBook(): HubState {
  const state = createDefaultState();
  state.books = state.books.map((book) =>
    book.status === 'current' ? { ...book, chapters: 10, read: 3 } : book,
  );
  return state;
}

describe('toggleTaskState', () => {
  it('ticks a gym task and logs one gym session; a second tap reverses both', () => {
    const start = createDefaultState();
    const once = apply(start, 'Go to the gym.');
    expect(once.days[DATE]?.done['Go to the gym.']).toBe(true);
    expect(once.fitness).toHaveLength(1);
    expect(once.fitness[0]).toMatchObject({ date: DATE, type: 'Push' });
    const twice = apply(once, 'Go to the gym.');
    expect(twice.days[DATE]?.done['Go to the gym.']).toBeUndefined();
    expect(twice.fitness).toHaveLength(0);
  });

  it('ticks a reading task and adds 1 chapter; a second tap reverses both', () => {
    const start = withBook();
    const task = 'On the bus home: read 1 chapter.';
    const once = apply(start, task);
    expect(once.books.find((book) => book.status === 'current')?.read).toBe(4);
    expect(once.chapterNotes).toHaveLength(1);
    const twice = apply(once, task);
    expect(twice.books.find((book) => book.status === 'current')?.read).toBe(3);
    expect(twice.chapterNotes).toHaveLength(0);
  });

  it('reopens a book that the tick finished', () => {
    const start = createDefaultState();
    start.books = start.books.map((book) =>
      book.status === 'current' ? { ...book, chapters: 4, read: 3 } : book,
    );
    const title = start.books.find((book) => book.status === 'current')?.title;
    const once = apply(start, 'Read 1 chapter.');
    expect(once.books.find((book) => book.title === title)?.status).toBe('done');
    const twice = apply(once, 'Read 1 chapter.');
    const book = twice.books.find((item) => item.title === title);
    expect(book?.status).toBe('current');
    expect(book?.read).toBe(3);
  });

  it('logs a learning session with the last topic', () => {
    const start = createDefaultState();
    start.learning = [{ date: '2026-11-01', type: 'Python', minutes: 45, note: '' }];
    const once = apply(start, 'Do the Linux and Python session.');
    expect(once.learning).toHaveLength(2);
    expect(once.learning[1]).toMatchObject({ date: DATE, type: 'Python', minutes: 60 });
    expect(apply(once, 'Do the Linux and Python session.').learning).toHaveLength(1);
  });

  it('ticks a rest task only', () => {
    const start = createDefaultState();
    const once = apply(start, 'Rest.');
    expect(once.days[DATE]?.done['Rest.']).toBe(true);
    expect(once.fitness).toHaveLength(0);
  });

  it('ignores a date that is not correct', () => {
    expect(toggleTaskState(createDefaultState(), 'soon', 'Rest.')).toEqual({});
  });
});

describe('nextGymType', () => {
  it('follows the Push, Pull, Legs rotation', () => {
    expect(nextGymType([])).toBe('Push');
    expect(nextGymType([{ date: DATE, type: 'Push', minutes: 0, note: '' }])).toBe('Pull');
    expect(nextGymType([{ date: DATE, type: 'Legs', minutes: 0, note: '' }])).toBe('Push');
    expect(
      nextGymType([
        { date: DATE, type: 'Pull', minutes: 0, note: '' },
        { date: DATE, type: 'Cardio', minutes: 0, note: '' },
      ]),
    ).toBe('Legs');
  });
});
