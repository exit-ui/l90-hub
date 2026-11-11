import { emptyDay } from '@/store/defaults';
import type { Book, ChapterNote, DateKey, DayRecord, HubState, Session } from '@/store/types';
import { normalizeBooks, readChapter } from './books';
import { isDateKey } from './dates';
import { isGymTask, isStudyTask, pillarOfTask } from './pillars';

/** The gym rotation. A task tick logs the next type after the last one. */
export const GYM_ROTATION: readonly string[] = ['Push', 'Pull', 'Legs'];
export const DEFAULT_TOPIC = 'Linux';
export const TICK_SESSION_MINUTES = 60;

/** The next type in the Push, Pull, Legs rotation. */
export function nextGymType(sessions: readonly Session[]): string {
  for (let index = sessions.length - 1; index >= 0; index -= 1) {
    const position = GYM_ROTATION.indexOf(sessions[index]?.type ?? '');
    if (position >= 0) {
      return GYM_ROTATION[(position + 1) % GYM_ROTATION.length] ?? 'Push';
    }
  }
  return GYM_ROTATION[0] ?? 'Push';
}

/** The topic of the last learning session. */
export function lastTopic(sessions: readonly Session[]): string {
  return sessions.at(-1)?.type ?? DEFAULT_TOPIC;
}

function withoutLastOn(sessions: readonly Session[], date: DateKey): Session[] {
  const last = sessions.map((session) => session.date).lastIndexOf(date);
  return last < 0 ? [...sessions] : sessions.filter((_, index) => index !== last);
}

/** Removes the chapter of the last note of the date. A finished book becomes current again. */
export function unreadChapter(
  books: readonly Book[],
  notes: readonly ChapterNote[],
  date: DateKey,
): { books: Book[]; chapterNotes: ChapterNote[] } {
  const noteIndex = notes.map((note) => note.date).lastIndexOf(date);
  const title = noteIndex >= 0 ? notes[noteIndex]?.book : undefined;
  const bookIndex =
    title === undefined
      ? books.findIndex((book) => book.status === 'current')
      : books.findIndex((book) => book.title === title);
  const chapterNotes = noteIndex >= 0 ? notes.filter((_, index) => index !== noteIndex) : [...notes];
  const target = books[bookIndex];
  if (!target || target.read <= 0) {
    return { books: [...books], chapterNotes };
  }
  const reopened = target.status === 'done';
  const changed: Book[] = books.map((book, index) => {
    if (index === bookIndex) {
      return { ...book, read: book.read - 1, status: reopened ? 'current' : book.status };
    }
    if (reopened && book.status === 'current') {
      return { ...book, status: 'next' };
    }
    if (reopened && book.status === 'next') {
      return { ...book, status: 'queue' };
    }
    return book;
  });
  return { books: normalizeBooks(changed), chapterNotes };
}

type TickState = Pick<HubState, 'days' | 'fitness' | 'learning' | 'books' | 'chapterNotes'>;

/**
 * One tap on a task. The tap ticks the task and does the act that the task names:
 * a gym task logs a gym session, a Linux, Python or code task logs a learning session,
 * a reading task adds one chapter to the current book. A second tap reverses both.
 */
export function toggleTaskState(state: TickState, date: DateKey, task: string): Partial<TickState> {
  if (!isDateKey(date)) {
    return {};
  }
  const record: DayRecord = state.days[date] ?? emptyDay();
  const ticking = record.done[task] !== true;
  const done = { ...record.done };
  if (ticking) {
    done[task] = true;
  } else {
    delete done[task];
  }
  const change: Partial<TickState> = { days: { ...state.days, [date]: { ...record, done } } };

  if (isGymTask(task)) {
    change.fitness = ticking
      ? [
          ...state.fitness,
          { date, type: nextGymType(state.fitness), minutes: TICK_SESSION_MINUTES, note: '' },
        ]
      : withoutLastOn(state.fitness, date);
  } else if (isStudyTask(task)) {
    change.learning = ticking
      ? [
          ...state.learning,
          { date, type: lastTopic(state.learning), minutes: TICK_SESSION_MINUTES, note: '' },
        ]
      : withoutLastOn(state.learning, date);
  } else if (pillarOfTask(task) === 'reading') {
    if (ticking) {
      const current = state.books.find((book) => book.status === 'current');
      if (current) {
        change.books = readChapter(state.books);
        change.chapterNotes = [
          ...state.chapterNotes,
          { date, book: current.title, idea: '', action: '' },
        ];
      }
    } else {
      const reversed = unreadChapter(state.books, state.chapterNotes, date);
      change.books = reversed.books;
      change.chapterNotes = reversed.chapterNotes;
    }
  }
  return change;
}
