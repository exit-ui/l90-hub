import type { Book, BookStatus, BookTag, Card, ChapterNote, DateKey, Milestone } from '@/store/types';
import { dueCardIndexes } from './leitner';
import { type IndexedRow, newestFirst } from './sessions';

export const BOOK_TAGS: readonly BookTag[] = ['Harvard research', 'Research', 'Mindset classic'];

export const BOOK_STATUS_LABELS: Readonly<Record<BookStatus, string>> = {
  current: 'Current',
  next: 'Next',
  queue: 'Queue',
  done: 'Done',
};

export interface LessonSummary {
  done: number;
  total: number;
  /** The first lesson that is not done. */
  next: Milestone | undefined;
}

export function lessonSummary(lessons: readonly Milestone[]): LessonSummary {
  return {
    done: lessons.filter((lesson) => lesson.done).length,
    total: lessons.length,
    next: lessons.find((lesson) => !lesson.done),
  };
}

export interface ReviewQueue {
  /** How many cards are due. */
  due: number;
  /** The position in the stored list of the card to review now. */
  index: number | undefined;
  card: Card | undefined;
}

/** The first due card, lowest box first, and the number of due cards. */
export function reviewQueue(cards: readonly Card[], today: DateKey): ReviewQueue {
  const indexes = dueCardIndexes(cards, today);
  const index = indexes[0];
  return {
    due: indexes.length,
    index,
    card: index === undefined ? undefined : cards[index],
  };
}

/** The last chapter note in the stored list, with its position. */
export function newestNote(notes: readonly ChapterNote[]): IndexedRow<ChapterNote> | undefined {
  const index = notes.length - 1;
  const item = notes[index];
  return item ? { index, item } : undefined;
}

/** Chapter notes, newest first, with the position of each note in the stored list. */
export function chapterNoteRows(notes: readonly ChapterNote[]): IndexedRow<ChapterNote>[] {
  return newestFirst(notes);
}

export function noteDates(notes: readonly ChapterNote[]): DateKey[] {
  return notes.map((note) => note.date);
}

/** False at the end of the list, where the book cannot move in that direction. */
export function canMoveBook(index: number, count: number, direction: -1 | 1): boolean {
  const target = index + direction;
  return index >= 0 && index < count && target >= 0 && target < count;
}

/** The text alternative for the progress of a book, for example "3 of 12 chapters". */
export function chapterLabel(book: Pick<Book, 'read' | 'chapters'>): string {
  if (book.chapters <= 0) {
    return book.read === 1 ? '1 chapter read' : `${book.read} chapters read`;
  }
  return `${book.read} of ${book.chapters} chapters`;
}

/** "1 day" or "n days". */
export function dayCount(days: number): string {
  return days === 1 ? '1 day' : `${days} days`;
}
