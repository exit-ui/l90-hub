import { type ReactNode, useState } from 'react';
import { Notice } from '@/components/shared/Notice';
import { PressButton } from '@/components/shared/PressButton';
import { TextField } from '@/components/shared/Field';
import { currentBook } from '@/lib/books';
import { dayNumber, formatShort } from '@/lib/dates';
import { FUNNEL_INPUTS } from '@/lib/funnel';
import { plural } from '@/lib/format';
import {
  type Draft,
  pastDates,
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
      <TextField
        error={errors.dmTarget}
        hint="The number of DMs that you send each day."
        inputMode="numeric"
        label="Daily DM target"
        min={1}
        onChange={(value) => actions.setScalar('dmTarget', value)}
        step={1}
        type="number"
        value={draft.dmTarget}
      />
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
      <Intro>Enter the targets for the side quests. You can change them later in Setup.</Intro>
      <span className="hidden sm:block" />
      <TextField
        error={errors.fitTarget}
        hint="The number of gym sessions in each week."
        inputMode="numeric"
        label="Gym sessions each week"
        min={1}
        onChange={(value) => actions.setScalar('fitTarget', value)}
        step={1}
        type="number"
        value={draft.fitTarget}
      />
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
}

export function ReviewStep({ summary, day }: ReviewStepProps) {
  const { state, contacted, daysPast, daysWithDms, warnings } = summary;
  const missed = daysPast - daysWithDms;
  const rows: { label: string; value: string }[] = [
    { label: 'Mission day today', value: String(day) },
    { label: 'Creators contacted', value: String(contacted) },
    { label: 'Daily DM target', value: String(state.dmTarget) },
    { label: 'Gym sessions each week', value: String(state.fitTarget) },
    { label: 'Learning sessions each week', value: String(state.learnTarget) },
    { label: 'Replies', value: String(state.funnel.replied) },
    { label: 'Booked calls', value: String(state.funnel.booked) },
  ];
  return (
    <div className="grid gap-4">
      <Intro>Check the numbers. Go back to correct a number. Then start the hub.</Intro>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        {rows.map((row) => (
          <div className="min-w-0" key={row.label}>
            <dt className="type-label text-hub-label">{row.label}</dt>
            <dd className="mt-1 type-section font-semibold text-hub-text num">{row.value}</dd>
          </div>
        ))}
      </dl>
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
