import { useMemo } from 'react';
import { HubHeatmap } from '@/components/charts/hub/HubHeatmap';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { useToday } from '@/hooks/useToday';
import { formatMedium } from '@/lib/dates';
import { DASH } from '@/lib/format';
import { chapterNoteRows, dayCount, noteDates } from '@/lib/learningView';
import { heatmapCells } from '@/lib/sessions';
import { dateStreak } from '@/lib/streak';
import { useHub } from '@/store/useHub';
import { AddBookForm, BookList } from './BookList';
import { CurrentBookCard, NewestNoteCard } from './CurrentBookCard';

function StreakCard({ className }: { className?: string }) {
  const today = useToday();
  const notes = useHub((state) => state.chapterNotes);
  const dates = useMemo(() => noteDates(notes), [notes]);
  const streak = useMemo(() => dateStreak(dates, today), [dates, today]);
  const cells = useMemo(() => heatmapCells(dates, today), [dates, today]);

  return (
    <Card aria-labelledby="reading-streak-title" className={className}>
      <CardTitle id="reading-streak-title">Reading streak</CardTitle>
      <p className="type-number num mt-2 text-hub-text">
        <RollingNumber value={streak} />
        <span className="ml-2 type-body text-hub-label">
          {streak === 1 ? 'day' : 'days'}
        </span>
        <span className="sr-only">. The reading streak is {dayCount(streak)}.</span>
      </p>
      <HubHeatmap
        cells={cells}
        className="mt-4"
        label="Chapters read for each day of the last 13 weeks"
      />
    </Card>
  );
}

function ChapterNotes({ className }: { className?: string }) {
  const notes = useHub((state) => state.chapterNotes);
  const rows = useMemo(() => chapterNoteRows(notes), [notes]);

  return (
    <Card aria-labelledby="chapter-notes-title" className={className}>
      <CardTitle id="chapter-notes-title">Chapter notes</CardTitle>
      {rows.length === 0 ? (
        <p className="mt-3 type-body text-hub-label">
          There are no chapter notes. Read a chapter. Then write the main idea.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {rows.map(({ item, index }) => (
            <li
              className="min-w-0 rounded-control border border-hub-hairline bg-hub-raised p-4"
              key={`${index}-${item.date}`}
            >
              <p className="type-label text-hub-label">{formatMedium(item.date)}</p>
              <p className="mt-1 type-body font-semibold break-words text-hub-text">
                {item.book}
              </p>
              <dl className="mt-3 grid gap-3">
                <div>
                  <dt className="type-label text-hub-label">Idea</dt>
                  <dd className="mt-1 type-body break-words whitespace-pre-wrap text-hub-text">
                    {item.idea || DASH}
                  </dd>
                </div>
                <div>
                  <dt className="type-label text-hub-label">Action</dt>
                  <dd className="mt-1 type-body break-words whitespace-pre-wrap text-hub-text">
                    {item.action || DASH}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** The current book, the newest chapter note, the book list, the streak and all notes. */
export function ReadingTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="grid min-w-0 content-start gap-4 lg:col-span-5">
        <CurrentBookCard />
        <NewestNoteCard />
        <StreakCard />
      </div>
      <div className="grid min-w-0 content-start gap-4 lg:col-span-7">
        <BookList />
        <AddBookForm />
      </div>
      <ChapterNotes className="lg:col-span-12" />
    </div>
  );
}
