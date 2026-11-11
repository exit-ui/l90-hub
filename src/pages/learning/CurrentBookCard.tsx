import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { ProgressRing } from '@/components/charts/hub/ProgressRing';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { TextAreaField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import { useToday } from '@/hooks/useToday';
import { currentBook } from '@/lib/books';
import { formatMedium } from '@/lib/dates';
import { chapterLabel, newestNote } from '@/lib/learningView';
import { cn } from '@/lib/utils';
import { useHub, useHubActions } from '@/store/useHub';

/** The current book with its progress and the "+1 chapter" button. */
export function CurrentBookCard({ className }: { className?: string }) {
  const today = useToday();
  const books = useHub((state) => state.books);
  const { readChapter } = useHubActions();
  const book = useMemo(() => currentBook(books), [books]);

  if (!book) {
    return (
      <Card aria-labelledby="current-book-title" className={className}>
        <CardTitle id="current-book-title">Current book</CardTitle>
        <p className="mt-3 type-body text-hub-label">All books are done. Add a book.</p>
      </Card>
    );
  }

  const hasChapters = book.chapters > 0;
  return (
    <Card aria-labelledby="current-book-title" className={className}>
      <CardTitle id="current-book-title">Current book</CardTitle>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {hasChapters ? (
          <ProgressRing
            label={`${chapterLabel(book)} in ${book.title}`}
            max={book.chapters}
            tone="secondary"
            value={book.read}
          >
            <span className="type-number num text-hub-text">{book.read}</span>
            <span className="type-label text-hub-label">of {book.chapters}</span>
          </ProgressRing>
        ) : (
          <div className="shrink-0">
            <p className="type-number num text-hub-text">{book.read}</p>
            <p className="type-label text-hub-label">
              {book.read === 1 ? 'chapter read' : 'chapters read'}
            </p>
          </div>
        )}
        <div className="min-w-0 flex-1 basis-48">
          <p className="type-section break-words text-hub-text">
            {book.title}
          </p>
          {book.author ? (
            <p className="mt-1 type-body break-words text-hub-label">{book.author}</p>
          ) : null}
          <p className="mt-2 inline-flex rounded-full border border-hub-hairline bg-hub-raised px-3 py-1 type-label text-hub-text">
            {book.tag}
          </p>
          {hasChapters ? null : (
            <p className="mt-2 type-label text-hub-label">
              Enter the number of chapters from the contents page.
            </p>
          )}
        </div>
      </div>
      <PressButton
        className="mt-4 w-full sm:w-auto"
        onClick={() => readChapter(today)}
        tone={hasChapters ? 'soft' : 'secondary'}
      >
        <Plus aria-hidden="true" className="size-4" />
        +1 chapter
      </PressButton>
    </Card>
  );
}

/** Two fields for the newest chapter note. Shown only when a note exists. */
export function NewestNoteCard({ className }: { className?: string }) {
  const notes = useHub((state) => state.chapterNotes);
  const { updateChapterNote } = useHubActions();
  const newest = useMemo(() => newestNote(notes), [notes]);

  if (!newest) {
    return null;
  }
  const { index, item } = newest;
  return (
    <Card aria-labelledby="newest-note-title" className={cn(className)}>
      <CardTitle id="newest-note-title">Newest chapter note</CardTitle>
      <p className="mt-2 type-label break-words text-hub-label">
        This note is for {item.book}, {formatMedium(item.date)}.
      </p>
      <div className="mt-4 grid gap-4">
        <TextAreaField
          autosave
          label="The main idea in my own words."
          onChange={(idea) => updateChapterNote(index, { idea })}
          value={item.idea}
        />
        <TextAreaField
          autosave
          label="One action for today."
          onChange={(action) => updateChapterNote(index, { action })}
          value={item.action}
        />
      </div>
    </Card>
  );
}
