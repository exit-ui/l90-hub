import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToday } from '@/hooks/useToday';
import { formatMedium, isDateKey } from '@/lib/dates';
import { parseWhole } from '@/lib/format';
import { sessionRows } from '@/lib/sessions';
import type { SessionList } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';
import { Card } from './Card';
import { CardTitle, RemoveButton, TableShell } from './Controls';
import { SelectField, TextField } from './Field';
import { PressButton } from './PressButton';

interface SessionLogProps {
  list: SessionList;
  /** The options for the type or the topic. */
  types: readonly string[];
  /** "Type" for the gym. "Topic" for learning. */
  typeLabel: string;
  /** The label of the add button, for example "Add the session". */
  addButton: string;
  className?: string;
}

/** A form (date, type, minutes, note) and a table of sessions with remove. */
export function SessionLog({ list, types, typeLabel, addButton, className }: SessionLogProps) {
  const today = useToday();
  const sessions = useHub((state) => state[list]);
  const { addSession, removeSession } = useHubActions();
  const [date, setDate] = useState(today);
  const [type, setType] = useState(types[0] ?? 'Other');
  const [minutes, setMinutes] = useState('60');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const rows = sessionRows(sessions);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isDateKey(date)) {
      setError('The date is not complete. Select a day, a month and a year.');
      return;
    }
    setError('');
    addSession(list, { date, type, minutes: parseWhole(minutes), note: note.trim() });
    setNote('');
  };

  return (
    <div className={className}>
      <Card>
        <CardTitle>Add a session</CardTitle>
        <form className="mt-4 grid grid-cols-1 gap-4 min-[380px]:grid-cols-2" onSubmit={submit}>
          <TextField error={error} label="Date" onChange={setDate} type="date" value={date} />
          <SelectField label={typeLabel} onChange={setType} options={types} value={type} />
          <TextField
            inputMode="numeric"
            label="Minutes"
            min={0}
            onChange={setMinutes}
            type="number"
            value={minutes}
          />
          <TextField label="Note" onChange={setNote} value={note} />
          <PressButton className="col-span-full justify-self-end" tone="secondary" type="submit">
            <Plus aria-hidden="true" className="size-4" />
            {addButton}
          </PressButton>
        </form>
      </Card>

      <Card className="mt-4">
        <CardTitle>Sessions</CardTitle>
        <TableShell
          className="mt-4"
          empty="There are no sessions. Add the first session with the form."
          isEmpty={rows.length === 0}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>{typeLabel}</TableHead>
                <TableHead className="text-right">Minutes</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>
                  <span className="sr-only">Remove</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ session, index }) => (
                <TableRow key={`${index}-${session.date}`}>
                  <TableCell className="whitespace-nowrap">{formatMedium(session.date)}</TableCell>
                  <TableCell>{session.type}</TableCell>
                  <TableCell className="text-right">{session.minutes}</TableCell>
                  <TableCell className="max-w-56 whitespace-normal break-words">
                    {session.note}
                  </TableCell>
                  <TableCell className="text-right">
                    <RemoveButton
                      label={`Remove the session of ${formatMedium(session.date)}`}
                      onClick={() => removeSession(list, index)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      </Card>
    </div>
  );
}
