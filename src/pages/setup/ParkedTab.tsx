import { type FormEvent, useId, useMemo, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { TextField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import { useToday } from '@/hooks/useToday';
import { formatMedium } from '@/lib/dates';
import { parkedNewestFirst } from '@/lib/setupView';
import { useHub, useHubActions } from '@/store/useHub';

/** The list of project ideas that wait until the mission is complete. */
export function ParkedTab() {
  const today = useToday();
  const parked = useHub((state) => state.parked);
  const { parkIdea } = useHubActions();
  const rows = useMemo(() => parkedNewestFirst(parked), [parked]);
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const id = useId();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const idea = text.trim();
    if (idea === '') {
      setError(true);
      return;
    }
    parkIdea(idea, today);
    setText('');
    setError(false);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card aria-labelledby={`${id}-new`} className="lg:col-span-5 lg:self-start">
        <CardTitle id={`${id}-new`}>New idea</CardTitle>
        <form className="mt-4 grid gap-4" noValidate onSubmit={submit}>
          <TextField
            error={error ? 'The field is empty. Write the idea first.' : undefined}
            label="Idea to park"
            onChange={(next) => {
              setText(next);
              setError(false);
            }}
            value={text}
          />
          <PressButton className="justify-self-end" tone="secondary" type="submit">
            Park the idea
          </PressButton>
        </form>
      </Card>
      <Card aria-labelledby={`${id}-list`} className="lg:col-span-7">
        <CardTitle id={`${id}-list`}>Parked list</CardTitle>
        {rows.length === 0 ? (
          <p className="py-4 type-body text-hub-label">
            The parked list is empty. Write each new project idea here.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-hub-hairline">
            {rows.map((row) => (
              <li
                className="grid min-w-0 gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4"
                key={row.index}
              >
                <span className="type-label text-hub-label">{formatMedium(row.date)}</span>
                <span className="min-w-0 type-body break-words text-hub-text">{row.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
