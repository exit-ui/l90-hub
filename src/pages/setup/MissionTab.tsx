import { useId, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { PressButton } from '@/components/shared/PressButton';
import { CardTitle } from '@/components/shared/Controls';
import { TextField } from '@/components/shared/Field';
import { formatMedium, isDateKey } from '@/lib/dates';
import { lastMissionDate, reviewDate } from '@/lib/phases';
import { parseSetting, SETTING_FIELDS, type SettingField, settingError } from '@/lib/setupView';
import { useHub, useHubActions } from '@/store/useHub';

/**
 * Keeps the raw text of one field, so the field can be empty while the user types.
 * When the stored value changes, the text follows it.
 */
function useDraft(stored: string): [string, (text: string) => void] {
  const [text, setText] = useState(stored);
  const [seen, setSeen] = useState(stored);
  if (seen !== stored) {
    setSeen(stored);
    setText(stored);
  }
  return [text, setText];
}

function StartDateCard({ className }: { className?: string }) {
  const startDate = useHub((state) => state.startDate);
  const { setStartDate } = useHubActions();
  const [text, setText] = useDraft(startDate);
  const id = useId();
  return (
    <Card aria-labelledby={`${id}-title`} className={className}>
      <CardTitle id={`${id}-title`}>Mission dates</CardTitle>
      <TextField
        fieldClassName="mt-4"
        hint="Day 1 of the mission."
        label="Start date"
        onBlur={() => setText(startDate)}
        onChange={(next) => {
          setText(next);
          if (isDateKey(next)) {
            setStartDate(next);
          }
        }}
        type="date"
        value={text}
      />
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div className="min-w-0">
          <dt className="type-label text-hub-label">Day 90</dt>
          <dd className="mt-1 type-body font-semibold text-hub-text">
            {formatMedium(lastMissionDate(startDate))}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="type-label text-hub-label">Review date</dt>
          <dd className="mt-1 type-body font-semibold text-hub-text">
            {formatMedium(reviewDate(startDate))}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function SettingInput({ field }: { field: SettingField }) {
  const stored = useHub((state) => state[field.key]);
  const { setSetting } = useHubActions();
  const [text, setText] = useDraft(String(stored));
  return (
    <TextField
      error={settingError(text, field.minimum)}
      hint={field.hint}
      inputMode="numeric"
      label={field.label}
      min={field.minimum}
      onBlur={() => {
        if (parseSetting(text, field.minimum) === null) {
          setText(String(stored));
        }
      }}
      onChange={(next) => {
        setText(next);
        const value = parseSetting(next, field.minimum);
        if (value !== null) {
          setSetting(field.key, value);
        }
      }}
      step={1}
      type="number"
      value={text}
    />
  );
}

/** The mission settings: the start date, the targets and the limits. */
export function MissionTab() {
  const id = useId();
  const { reopenOnboarding } = useHubActions();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <StartDateCard className="lg:col-span-5 lg:self-start" />
      <Card aria-labelledby={`${id}-title`} className="lg:col-span-7">
        <CardTitle id={`${id}-title`}>Targets and limits</CardTitle>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SETTING_FIELDS.map((field) => (
            <SettingInput field={field} key={field.key} />
          ))}
        </div>
      </Card>
      <Card aria-labelledby={`${id}-questions`} className="lg:col-span-12">
        <CardTitle id={`${id}-questions`}>Setup questions</CardTitle>
        <p className="mt-2 type-body text-hub-label">
          Answer the setup questions again. The questions show the numbers that the hub has now.
        </p>
        <PressButton className="mt-4" onClick={reopenOnboarding} tone="secondary">
          <RotateCcw aria-hidden="true" className="size-4" />
          Run the setup questions again
        </PressButton>
      </Card>
    </div>
  );
}
