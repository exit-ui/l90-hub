import { ExternalLink, ListPlus, SkipForward } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { Card } from '@/components/shared/Card';
import { CardTitle, RemoveButton } from '@/components/shared/Controls';
import { CheckField, TextField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import { useToday } from '@/hooks/useToday';
import { seedHref } from '@/lib/outreachView';
import { VET_QUESTIONS } from '@/store/defaults';
import { useHub, useHubActions } from '@/store/useHub';

function VetTool() {
  const today = useToday();
  const sent = useHub((state) => state.days[today]?.vetSend ?? 0);
  const skipped = useHub((state) => state.days[today]?.vetSkip ?? 0);
  const { recordVet } = useHubActions();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const decide = (decision: 'send' | 'skip') => {
    recordVet(today, decision);
    setAnswers({});
  };

  return (
    <Card aria-labelledby="vet-title" className="lg:col-span-7 lg:self-start">
      <CardTitle id="vet-title">60-second vet</CardTitle>
      <p className="mt-1 type-label text-hub-label">
        Answer the 3 questions for one account. Then select one button.
      </p>
      <ul className="mt-3">
        {VET_QUESTIONS.map((question) => (
          <li className="border-b border-hub-hairline last:border-b-0" key={question}>
            <CheckField
              checked={answers[question] === true}
              label={question}
              onChange={(checked) => setAnswers((current) => ({ ...current, [question]: checked }))}
            />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <PressButton onClick={() => decide('send')} tone="primary">
          <ListPlus aria-hidden="true" className="size-4" />
          Add to the send list
        </PressButton>
        <PressButton onClick={() => decide('skip')} tone="soft">
          <SkipForward aria-hidden="true" className="size-4" />
          Skip
        </PressButton>
      </div>
      <dl aria-live="polite" className="mt-4 grid grid-cols-2 gap-4 border-t border-hub-hairline pt-4">
        <div className="min-w-0">
          <dt className="type-label text-hub-label">Added today</dt>
          <dd className="type-number num mt-1 text-hub-positive">
            <RollingNumber value={sent} />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="type-label text-hub-label">Skipped today</dt>
          <dd className="type-number num mt-1 text-hub-text">
            <RollingNumber value={skipped} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function SeedAccounts() {
  const seeds = useHub((state) => state.seeds);
  const { addSeed, removeSeed } = useHubActions();
  const [draft, setDraft] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    addSeed(draft);
    setDraft('');
  };

  return (
    <Card aria-labelledby="seeds-title" className="lg:col-span-5 lg:self-start">
      <CardTitle id="seeds-title">Seed accounts</CardTitle>
      <p className="mt-1 type-label text-hub-label">Each account opens on Instagram in a new tab.</p>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={submit}>
        <TextField
          autoCapitalize="none"
          autoComplete="off"
          fieldClassName="min-w-40 flex-1"
          label="New seed account"
          onChange={setDraft}
          spellCheck={false}
          value={draft}
        />
        <PressButton disabled={draft.trim() === ''} tone="secondary" type="submit">
          Add the account
        </PressButton>
      </form>
      {seeds.length === 0 ? (
        <p className="mt-4 type-body text-hub-label">The list is empty. Add the first account.</p>
      ) : (
        <ul className="mt-3">
          {seeds.map((handle, index) => (
            <li
              className="flex items-center gap-2 border-b border-hub-hairline last:border-b-0"
              key={handle}
            >
              <a
                className="flex min-h-11 min-w-0 flex-1 items-center gap-2 type-body font-medium text-hub-text underline-offset-4 hover:underline"
                href={seedHref(handle)}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="min-w-0 break-all">@{handle}</span>
                <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-hub-label" />
                <span className="sr-only">(opens Instagram in a new tab)</span>
              </a>
              <RemoveButton label={`Remove the account ${handle}`} onClick={() => removeSeed(index)} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** The 60-second vet tool and the list of seed accounts. */
export function VetTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <VetTool />
      <SeedAccounts />
    </div>
  );
}
