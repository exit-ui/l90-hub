import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { fractionOf } from '@/lib/summary';
import type { MilestoneList as MilestoneListKey } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';
import { Card } from './Card';
import { CardTitle, RemoveButton } from './Controls';
import { CheckField, TextField } from './Field';
import { PressButton } from './PressButton';
import { ProgressBar } from './ProgressBar';

interface MilestoneListProps {
  list: MilestoneListKey;
  title: string;
  /** The label of the field that adds an item, for example "New lesson". */
  addLabel: string;
  /** The label of the add button, for example "Add the lesson". */
  addButton: string;
  className?: string;
}

/** A list with checkboxes, add and remove. Used for lessons and for work milestones. */
export function MilestoneList({ list, title, addLabel, addButton, className }: MilestoneListProps) {
  const items = useHub((state) => state[list]);
  const { addMilestone, toggleMilestone, removeMilestone } = useHubActions();
  const [draft, setDraft] = useState('');
  const done = items.filter((item) => item.done).length;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    addMilestone(list, draft);
    setDraft('');
  };

  return (
    <Card className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <p className="type-label text-hub-label">
          {done} of {items.length} complete
        </p>
      </div>
      <ProgressBar
        className="mt-3"
        fraction={fractionOf(done, items.length)}
        label={`${done} of ${items.length} complete`}
        tone="data"
      />
      {items.length === 0 ? (
        <p className="mt-4 type-body text-hub-label">The list is empty. Add the first item.</p>
      ) : (
        <ul className="mt-3">
          {items.map((item, index) => (
            <li
              className="flex items-center gap-2 border-b border-hub-hairline last:border-b-0"
              key={`${index}-${item.text}`}
            >
              <CheckField
                checked={item.done}
                className="flex-1"
                label={item.text}
                onChange={() => toggleMilestone(list, index)}
                strike
              />
              <RemoveButton label={`Remove: ${item.text}`} onClick={() => removeMilestone(list, index)} />
            </li>
          ))}
        </ul>
      )}
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={submit}>
        <TextField
          fieldClassName="min-w-0 flex-1 basis-56"
          label={addLabel}
          onChange={setDraft}
          value={draft}
        />
        <PressButton disabled={draft.trim() === ''} tone="secondary" type="submit">
          <Plus aria-hidden="true" className="size-4" />
          {addButton}
        </PressButton>
      </form>
    </Card>
  );
}
