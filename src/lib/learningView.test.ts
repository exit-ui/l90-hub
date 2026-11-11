import { describe, expect, it } from 'vitest';
import type { Card, ChapterNote } from '@/store/types';
import {
  canMoveBook,
  chapterLabel,
  chapterNoteRows,
  dayCount,
  lessonSummary,
  newestNote,
  noteDates,
  reviewQueue,
} from './learningView';

const TODAY = '2026-11-10';

function note(date: string, book: string): ChapterNote {
  return { date, book, idea: '', action: '' };
}

describe('lessonSummary', () => {
  it('gives zero values for an empty list', () => {
    expect(lessonSummary([])).toEqual({ done: 0, total: 0, next: undefined });
  });

  it('finds the first lesson that is not done', () => {
    const summary = lessonSummary([
      { text: 'A', done: true },
      { text: 'B', done: false },
      { text: 'C', done: false },
    ]);
    expect(summary.done).toBe(1);
    expect(summary.total).toBe(3);
    expect(summary.next?.text).toBe('B');
  });

  it('has no next lesson when all lessons are done', () => {
    expect(lessonSummary([{ text: 'A', done: true }]).next).toBeUndefined();
  });
});

describe('reviewQueue', () => {
  it('is empty when no card is due', () => {
    const cards: Card[] = [{ q: 'q', a: 'a', box: 1, due: '2026-11-11' }];
    expect(reviewQueue(cards, TODAY)).toEqual({ due: 0, index: undefined, card: undefined });
  });

  it('gives the due card in the lowest box first', () => {
    const cards: Card[] = [
      { q: 'later', a: 'a', box: 1, due: '2026-11-12' },
      { q: 'box 3', a: 'a', box: 3, due: '2026-11-09' },
      { q: 'box 1', a: 'a', box: 1, due: TODAY },
    ];
    const queue = reviewQueue(cards, TODAY);
    expect(queue.due).toBe(2);
    expect(queue.index).toBe(2);
    expect(queue.card?.q).toBe('box 1');
  });
});

describe('chapter notes', () => {
  const notes = [note('2026-11-08', 'A'), note('2026-11-10', 'B'), note('2026-11-10', 'C')];

  it('gives the last stored note with its position', () => {
    expect(newestNote(notes)).toEqual({ index: 2, item: notes[2] });
    expect(newestNote([])).toBeUndefined();
  });

  it('sorts the notes newest first and keeps the stored positions', () => {
    expect(chapterNoteRows(notes).map((row) => row.index)).toEqual([2, 1, 0]);
  });

  it('lists the dates', () => {
    expect(noteDates(notes)).toEqual(['2026-11-08', '2026-11-10', '2026-11-10']);
  });
});

describe('canMoveBook', () => {
  it('stops at the two ends of the list', () => {
    expect(canMoveBook(0, 3, -1)).toBe(false);
    expect(canMoveBook(0, 3, 1)).toBe(true);
    expect(canMoveBook(2, 3, 1)).toBe(false);
    expect(canMoveBook(2, 3, -1)).toBe(true);
    expect(canMoveBook(0, 1, 1)).toBe(false);
  });
});

describe('labels', () => {
  it('describes the chapters of a book', () => {
    expect(chapterLabel({ read: 3, chapters: 12 })).toBe('3 of 12 chapters');
    expect(chapterLabel({ read: 1, chapters: 0 })).toBe('1 chapter read');
    expect(chapterLabel({ read: 4, chapters: 0 })).toBe('4 chapters read');
  });

  it('counts days', () => {
    expect(dayCount(1)).toBe('1 day');
    expect(dayCount(0)).toBe('0 days');
  });
});
