import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CircleCheck,
  Clock,
  type LucideIcon,
  Plus,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { SelectField, TextField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import { parseWhole } from '@/lib/format';
import { BOOK_STATUS_LABELS, BOOK_TAGS, canMoveBook, chapterLabel } from '@/lib/learningView';
import { cn } from '@/lib/utils';
import type { Book, BookStatus, BookTag } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';

const STATUS_ICONS: Readonly<Record<BookStatus, LucideIcon>> = {
  current: BookOpen,
  next: ArrowRight,
  queue: Clock,
  done: CircleCheck,
};

const STATUS_CLASSES: Readonly<Record<BookStatus, string>> = {
  current: 'text-hub-accent-text',
  next: 'text-hub-text',
  queue: 'text-hub-label',
  done: 'text-hub-positive',
};

interface BookRowProps {
  book: Book;
  index: number;
  count: number;
}

function BookRow({ book, index, count }: BookRowProps) {
  const { setBookChapters, moveBook } = useHubActions();
  const [chapters, setChapters] = useState(String(book.chapters));
  const StatusIcon = STATUS_ICONS[book.status];

  /** Saves the number when the user leaves the field, so a half-typed number changes nothing. */
  const commit = () => {
    const value = parseWhole(chapters);
    setChapters(String(value));
    if (value !== book.chapters) {
      setBookChapters(index, value);
    }
  };

  return (
    <li className="grid gap-3 rounded-control border border-hub-hairline bg-hub-raised p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <p className="type-body font-semibold break-words text-hub-text">{book.title}</p>
        {book.author ? (
          <p className="mt-1 type-label break-words text-hub-label">{book.author}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 type-label">
          <span className="rounded-full border border-hub-hairline px-3 py-1 text-hub-text">
            {book.tag}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-2 font-semibold',
              STATUS_CLASSES[book.status],
            )}
          >
            <StatusIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="sr-only">Status: </span>
            {BOOK_STATUS_LABELS[book.status]}
          </span>
          <span className="text-hub-label">{chapterLabel(book)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <TextField
          aria-label={`Chapters in ${book.title}`}
          fieldClassName="w-24"
          inputMode="numeric"
          label="Chapters"
          min={0}
          onBlur={commit}
          onChange={setChapters}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commit();
            }
          }}
          type="number"
          value={chapters}
        />
        <PressButton
          aria-label={`Move up ${book.title}`}
          disabled={!canMoveBook(index, count, -1)}
          iconOnly
          onClick={() => moveBook(index, -1)}
          title="Move up"
        >
          <ArrowUp aria-hidden="true" className="size-4" />
        </PressButton>
        <PressButton
          aria-label={`Move down ${book.title}`}
          disabled={!canMoveBook(index, count, 1)}
          iconOnly
          onClick={() => moveBook(index, 1)}
          title="Move down"
        >
          <ArrowDown aria-hidden="true" className="size-4" />
        </PressButton>
      </div>
    </li>
  );
}

/** The books in reading order. Each book is one stacked row, so a phone shows no wide table. */
export function BookList({ className }: { className?: string }) {
  const books = useHub((state) => state.books);

  return (
    <Card aria-labelledby="book-list-title" className={className}>
      <CardTitle id="book-list-title">Book list</CardTitle>
      {books.length === 0 ? (
        <p className="mt-3 type-body text-hub-label">
          There are no books. Add the first book with the form.
        </p>
      ) : (
        <>
          <p className="mt-2 type-label text-hub-label">
            The list is the reading order. Leave the chapters field to save the number.
          </p>
          <ul className="mt-4 grid gap-3">
            {books.map((book, index) => (
              <BookRow
                book={book}
                count={books.length}
                index={index}
                key={`${index}-${book.title}-${book.chapters}`}
              />
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

export function AddBookForm({ className }: { className?: string }) {
  const { addBook } = useHubActions();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [tag, setTag] = useState<BookTag>('Research');
  const [chapters, setChapters] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (title.trim() === '') {
      setError('The title is empty. Enter the title of the book.');
      return;
    }
    setError('');
    addBook({ title, author, tag, chapters: parseWhole(chapters) });
    setTitle('');
    setAuthor('');
    setChapters('');
  };

  return (
    <Card aria-labelledby="add-book-title" className={className}>
      <CardTitle id="add-book-title">Add a book</CardTitle>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <TextField error={error} label="Title" onChange={setTitle} value={title} />
        <TextField label="Author" onChange={setAuthor} value={author} />
        <SelectField label="Tag" onChange={setTag} options={BOOK_TAGS} value={tag} />
        <TextField
          hint="Enter 0 if you do not know the number."
          inputMode="numeric"
          label="Chapters"
          min={0}
          onChange={setChapters}
          type="number"
          value={chapters}
        />
        <PressButton className="sm:col-span-2 sm:justify-self-start" tone="soft" type="submit">
          <Plus aria-hidden="true" className="size-4" />
          Add the book
        </PressButton>
      </form>
    </Card>
  );
}
