import { Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useId, useState } from 'react';
import { Notice } from '@/components/shared/Notice';
import { PressButton } from '@/components/shared/PressButton';
import { TextField } from '@/components/shared/Field';
import { currentBook } from '@/lib/books';
import { dayNumber, formatShort } from '@/lib/dates';
import { FUNNEL_INPUTS } from '@/lib/funnel';
import { formatInteger, plural } from '@/lib/format';
import { BUTTON_TAP } from '@/lib/motion';
import { MISSION_DAYS } from '@/lib/phases';
import { cn } from '@/lib/utils';
import {
  type Draft,
  pastDates,
  type OnboardingStep,
  type ReviewSummary,
  type ScalarDraftKey,
  type StepErrors,
} from '@/lib/onboarding';
import type { DateKey, FunnelKey } from '@/store/types';
import { useHub } from '@/store/useHub';

export interface DraftActions {
  setScalar: (key: ScalarDraftKey, value: string) => void;
  setPast: (date: DateKey, value: string) => void;
  fillPast: (value: string) => void;
  setFunnel: (key: FunnelKey, value: string) => void;
  setCoin: (index: number, field: 'amount' | 'price', value: string) => void;
  setReward: (index: 0 | 1 | 2, value: string) => void;
}

export interface StepProps {
  draft: Draft;
  errors: StepErrors;
  today: DateKey;
  actions: DraftActions;
}

function Intro({ children }: { children: ReactNode }) {
  return <p className="type-body text-hub-label">{children}</p>;
}

function wholeNumber(text: string): number | null {
  const value = Number(text.trim());
  return text.trim() !== '' && Number.isInteger(value) ? value : null;
}

/** A big stepper: a round "−", the number (it is also a field) and a round "+". */
function Stepper({
  label,
  unit,
  value,
  min,
  max,
  error,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  min: number;
  max: number;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const current = wholeNumber(value);
  const step = (amount: number) => onChange(String(Math.min(max, Math.max(min, (current ?? min) + amount))));
  return (
    <div className="grid gap-2">
      <label className="type-label px-4 text-hub-label" htmlFor={id}>
        {label}
      </label>
      <div className="surface-card flex items-center justify-between gap-3 px-4 py-6">
        <motion.button
          aria-label={`Decrease the ${label.toLowerCase()}`}
          className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-hub-chip text-hub-text disabled:cursor-not-allowed disabled:opacity-40"
          disabled={current !== null && current <= min}
          onClick={() => step(-1)}
          type="button"
          whileTap={BUTTON_TAP}
        >
          <Minus aria-hidden="true" className="size-5" />
        </motion.button>
        <div className="min-w-0 text-center">
          <input
            aria-invalid={error ? true : undefined}
            className="type-hero num w-full min-w-0 rounded-control bg-transparent text-center text-hub-text"
            id={id}
            inputMode="numeric"
            onChange={(event) => onChange(event.target.value)}
            value={value}
          />
          <p aria-hidden="true" className="type-label text-hub-label">
            {unit}
          </p>
        </div>
        <motion.button
          aria-label={`Increase the ${label.toLowerCase()}`}
          className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-hub-black text-hub-on-black disabled:cursor-not-allowed disabled:opacity-40"
          disabled={current !== null && current >= max}
          onClick={() => step(1)}
          type="button"
          whileTap={BUTTON_TAP}
        >
          <Plus aria-hidden="true" className="size-5" />
        </motion.button>
      </div>
      {error ? (
        <p className="type-label px-4 text-hub-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** A row of number chips, one choice. The chosen chip is brand green. */
function ChoiceChips({
  label,
  options,
  value,
  error,
  onChange,
}: {
  label: string;
  options: readonly number[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const current = wholeNumber(value);
  return (
    <div className="grid gap-2">
      <p className="type-label text-hub-label">{label}</p>
      <div aria-label={label} className="grid grid-chips gap-2" role="group">
        {options.map((option) => {
          const selected = option === current;
          return (
            <motion.button
              aria-pressed={selected}
              className={cn(
                'type-metric num h-16 cursor-pointer rounded-tile transition-colors',
                selected ? 'bg-hub-brand text-hub-on-brand' : 'bg-hub-surface text-hub-text rim-hairline hover:bg-hub-inset',
              )}
              key={option}
              onClick={() => onChange(String(option))}
              type="button"
              whileTap={BUTTON_TAP}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
      {error ? (
        <p className="type-label px-4 text-hub-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function MissionStep({ draft, errors, actions }: StepProps) {
  return (
    <div className="grid gap-4">
      <Intro>Enter the dates and the daily target of the main quest.</Intro>
      <TextField
        error={errors.startDate}
        hint="Day 1 of the mission. The mission lasts 90 days."
        label="Start date"
        onChange={(value) => actions.setScalar('startDate', value)}
        type="date"
        value={draft.startDate}
      />
      <Stepper
        error={errors.dmTarget}
        label="Daily DM target"
        max={500}
        min={1}
        onChange={(value) => actions.setScalar('dmTarget', value)}
        unit="DMs a day"
        value={draft.dmTarget}
      />
      {wholeNumber(draft.dmTarget) !== null ? (
        <p className="type-label px-4 text-hub-label">
          {`That is ${formatInteger((wholeNumber(draft.dmTarget) ?? 0) * MISSION_DAYS)} DMs over ${MISSION_DAYS} days.`}
        </p>
      ) : null}
      <TextField
        error={errors.baseContacted}
        hint="Count all the DMs that you sent before the hub. The hub adds the new DMs to this number."
        inputMode="numeric"
        label="DMs sent before the hub"
        min={0}
        onChange={(value) => actions.setScalar('baseContacted', value)}
        step={1}
        type="number"
        value={draft.baseContacted}
      />
    </div>
  );
}

export function TargetsStep({ draft, errors, actions }: StepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-4 sm:col-span-2">
        <Intro>Enter the targets for the side quests. You can change them later in Setup.</Intro>
        <ChoiceChips
          error={errors.fitTarget}
          label="Gym days each week"
          onChange={(value) => actions.setScalar('fitTarget', value)}
          options={[1, 2, 3, 4, 5, 6, 7]}
          value={draft.fitTarget}
        />
        <p className="surface-inset type-label p-4 text-hub-label">
          Pick a number that you can keep on a busy week. Missed days do not reset anything.
        </p>
      </div>
      <TextField
        error={errors.learnTarget}
        hint="The number of Linux and Python sessions in each week."
        inputMode="numeric"
        label="Learning sessions each week"
        min={1}
        onChange={(value) => actions.setScalar('learnTarget', value)}
        step={1}
        type="number"
        value={draft.learnTarget}
      />
      <TextField
        error={errors.chartCheckLimit}
        hint="The most times that you open the charts in one day."
        inputMode="numeric"
        label="Chart checks each day"
        min={1}
        onChange={(value) => actions.setScalar('chartCheckLimit', value)}
        step={1}
        type="number"
        value={draft.chartCheckLimit}
      />
      <TextField
        error={errors.riskPercent}
        hint="The share of the account that you risk on one trade."
        inputMode="decimal"
        label="Risk for each trade (%)"
        min={0}
        onChange={(value) => actions.setScalar('riskPercent', value)}
        step="any"
        type="number"
        value={draft.riskPercent}
      />
    </div>
  );
}

export function PastStep({ draft, errors, today, actions }: StepProps) {
  const [fill, setFill] = useState('');
  const dates = pastDates(draft.startDate, today);
  return (
    <div className="grid gap-4">
      <Intro>
        Enter the DMs that you sent on each day. Leave a day empty when you sent 0 DMs.
      </Intro>
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          fieldClassName="min-w-0 flex-1 basis-40"
          inputMode="numeric"
          label="The same number for all the days"
          min={0}
          onChange={setFill}
          step={1}
          type="number"
          value={fill}
        />
        <PressButton disabled={fill.trim() === ''} onClick={() => actions.fillPast(fill)}>
          Fill all the days
        </PressButton>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {dates.map((date) => (
          <TextField
            error={errors[`past-${date}`]}
            inputMode="numeric"
            key={date}
            label={`Day ${dayNumber(date, draft.startDate)} · ${formatShort(date)}`}
            min={0}
            onChange={(value) => actions.setPast(date, value)}
            step={1}
            type="number"
            value={draft.pastDm[date] ?? ''}
          />
        ))}
      </div>
    </div>
  );
}

export function FunnelStep({ draft, errors, actions }: StepProps) {
  return (
    <div className="grid gap-4">
      <Intro>
        Enter the total for each stage since you started. Leave a field empty for 0.
      </Intro>
      <p className="type-label text-hub-label">
        The hub calculates the number of contacted creators from your DMs.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FUNNEL_INPUTS.map(({ key, label }) => (
          <TextField
            error={errors[`funnel-${key}`]}
            inputMode="numeric"
            key={key}
            label={label}
            min={0}
            onChange={(value) => actions.setFunnel(key, value)}
            step={1}
            type="number"
            value={draft.funnel[key]}
          />
        ))}
      </div>
    </div>
  );
}

export function BookStep({ draft, errors, actions }: StepProps) {
  const book = useHub((state) => currentBook(state.books));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Intro>
          {book
            ? `The current book is "${book.title}" by ${book.author}. Enter the numbers from its contents page.`
            : 'Enter the numbers from the contents page of the current book.'}
        </Intro>
      </div>
      <TextField
        error={errors.bookChapters}
        hint="Enter 0 if you do not know the number."
        inputMode="numeric"
        label="Chapters in the book"
        min={0}
        onChange={(value) => actions.setScalar('bookChapters', value)}
        step={1}
        type="number"
        value={draft.bookChapters}
      />
      <TextField
        error={errors.bookRead}
        inputMode="numeric"
        label="Chapters that you read"
        min={0}
        onChange={(value) => actions.setScalar('bookRead', value)}
        step={1}
        type="number"
        value={draft.bookRead}
      />
    </div>
  );
}

export function WalletStep({ draft, errors, actions }: StepProps) {
  return (
    <div className="grid gap-4">
      <Intro>
        Enter the amount of each coin and its price in GBP. Leave a coin empty when you do not hold it.
      </Intro>
      <Notice kind="NOTE">The hub does not get live prices. You enter each price by hand.</Notice>
      <ul className="grid gap-4">
        {draft.coins.map((coin, index) => (
          <li className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)] items-end gap-3" key={coin.symbol}>
            <p className="pb-3 type-body font-semibold text-hub-text">{coin.symbol}</p>
            <TextField
              error={errors[`coin-${index}-amount`]}
              inputMode="decimal"
              label="Amount"
              min={0}
              onChange={(value) => actions.setCoin(index, 'amount', value)}
              step="any"
              type="number"
              value={coin.amount}
            />
            <TextField
              error={errors[`coin-${index}-price`]}
              inputMode="decimal"
              label="Price (GBP)"
              min={0}
              onChange={(value) => actions.setCoin(index, 'price', value)}
              step="any"
              type="number"
              value={coin.price}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RewardsStep({ draft, actions }: StepProps) {
  return (
    <div className="grid gap-4">
      <Intro>Write one reward for each phase. You can change the rewards later in Setup.</Intro>
      {([0, 1, 2] as const).map((index) => (
        <TextField
          key={index}
          label={`Reward for phase ${index + 1}`}
          onChange={(value) => actions.setReward(index, value)}
          value={draft.rewards[index] ?? ''}
        />
      ))}
    </div>
  );
}

interface ReviewStepProps {
  summary: ReviewSummary;
  day: number;
  /** Opens the step of a row, so the user can change the answer. */
  onEdit: (step: OnboardingStep) => void;
}

export function ReviewStep({ summary, day, onEdit }: ReviewStepProps) {
  const { state, contacted, daysPast, daysWithDms, warnings } = summary;
  const missed = daysPast - daysWithDms;
  const rows: { label: string; value: string; step: OnboardingStep }[] = [
    { label: 'Mission day today', value: String(day), step: 'mission' },
    { label: 'Creators contacted', value: formatInteger(contacted), step: 'mission' },
    { label: 'Daily DM target', value: String(state.dmTarget), step: 'mission' },
    { label: 'Gym days each week', value: String(state.fitTarget), step: 'targets' },
    { label: 'Learning sessions each week', value: String(state.learnTarget), step: 'targets' },
    { label: 'Replies', value: String(state.funnel.replied), step: 'funnel' },
    { label: 'Booked calls', value: String(state.funnel.booked), step: 'funnel' },
  ];
  return (
    <div className="grid gap-4">
      <Intro>Check your answers. Tap a row to change it.</Intro>
      <ul className="surface-card px-4">
        {rows.map((row) => (
          <li className="border-b border-hub-hairline last:border-b-0" key={row.label}>
            <button
              aria-label={`${row.label}: ${row.value}. Change it.`}
              className="flex min-h-13 w-full cursor-pointer items-center justify-between gap-3 text-left"
              onClick={() => onEdit(row.step)}
              type="button"
            >
              <span className="type-body text-hub-label">{row.label}</span>
              <span className="type-body num font-semibold text-hub-text">{row.value}</span>
            </button>
          </li>
        ))}
      </ul>
      {daysPast > 0 ? (
        <Notice kind="NOTE">
          {`You sent DMs on ${daysWithDms} of ${daysPast} past ${plural(daysPast, 'day', 'days')}. ${
            missed > 0
              ? `${missed} ${plural(missed, 'day shows', 'days show')} as missed in the calendar.`
              : 'No past day shows as missed.'
          }`}
        </Notice>
      ) : null}
      {warnings.map((text) => (
        <Notice announce={false} key={text} kind="CAUTION">
          {text}
        </Notice>
      ))}
    </div>
  );
}
