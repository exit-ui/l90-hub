import type { Book } from '@/store/types';

function isComplete(book: Book): boolean {
  return book.chapters > 0 && book.read >= book.chapters;
}

/**
 * Makes the list obey the book rules:
 * a complete book is "done", only one book is "current", only one book is "next".
 * When the current book is done, the "next" book becomes "current".
 */
export function normalizeBooks(books: readonly Book[]): Book[] {
  const list: Book[] = books.map((book) => {
    if (isComplete(book)) {
      return { ...book, read: book.chapters, status: 'done' };
    }
    // A book that is not complete cannot stay "done", for example after a new chapter count.
    return book.status === 'done' ? { ...book, status: 'queue' } : { ...book };
  });

  let currentSeen = false;
  let nextSeen = false;
  for (const book of list) {
    if (book.status === 'current') {
      if (currentSeen) {
        book.status = 'queue';
      }
      currentSeen = true;
    } else if (book.status === 'next') {
      if (nextSeen) {
        book.status = 'queue';
      }
      nextSeen = true;
    }
  }

  if (!currentSeen) {
    const promoted = list.find((book) => book.status === 'next') ??
      list.find((book) => book.status === 'queue');
    if (promoted) {
      if (promoted.status === 'next') {
        nextSeen = false;
      }
      promoted.status = 'current';
    }
  }
  if (!nextSeen) {
    const queued = list.find((book) => book.status === 'queue');
    if (queued) {
      queued.status = 'next';
    }
  }
  return list;
}

export function currentBook(books: readonly Book[]): Book | undefined {
  return books.find((book) => book.status === 'current');
}

/** Adds one chapter to the current book. Then applies the book rules. */
export function readChapter(books: readonly Book[]): Book[] {
  const index = books.findIndex((book) => book.status === 'current');
  if (index < 0) {
    return normalizeBooks(books);
  }
  return normalizeBooks(
    books.map((book, position) => (position === index ? { ...book, read: book.read + 1 } : book)),
  );
}

export function setChapters(books: readonly Book[], index: number, chapters: number): Book[] {
  const safe = Math.max(0, Math.floor(chapters));
  return normalizeBooks(
    books.map((book, position) => (position === index ? { ...book, chapters: safe } : book)),
  );
}

/**
 * Moves a book one place up or down the list.
 * The reading order follows the list: after the current book, the first book that is not done is "next".
 */
export function moveBook(books: readonly Book[], index: number, direction: -1 | 1): Book[] {
  const target = index + direction;
  if (index < 0 || index >= books.length || target < 0 || target >= books.length) {
    return [...books];
  }
  const list = [...books];
  const moved = list[index];
  const other = list[target];
  if (!moved || !other) {
    return list;
  }
  list[index] = other;
  list[target] = moved;
  const reordered = list.map((book) =>
    book.status === 'next' ? { ...book, status: 'queue' as const } : book,
  );
  return normalizeBooks(reordered);
}

export function addBook(books: readonly Book[], book: Omit<Book, 'read' | 'status'>): Book[] {
  return normalizeBooks([...books, { ...book, read: 0, status: 'queue' }]);
}

/** 0 to 1. A book with 0 chapters has no progress value. */
export function bookProgress(book: Book | undefined): number | null {
  if (!book || book.chapters <= 0) {
    return null;
  }
  return Math.min(1, book.read / book.chapters);
}

export function chaptersRead(books: readonly Book[]): number {
  return books.reduce((sum, book) => sum + book.read, 0);
}
