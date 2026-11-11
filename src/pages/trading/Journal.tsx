import { Check, Minus, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/shared/Card';
import { CardTitle, RemoveButton, TableShell } from '@/components/shared/Controls';
import { CheckField, SelectField, TextField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import { useToday } from '@/hooks/useToday';
import { formatMedium, isDateKey } from '@/lib/dates';
import { formatR, parseNumber } from '@/lib/format';
import { newestFirst } from '@/lib/sessions';
import { type ResultTone, resultTone } from '@/lib/tradingView';
import { cn } from '@/lib/utils';
import type { Direction, Market } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';

const MARKETS: readonly Market[] = ['Forex', 'BTC perp', 'Other'];
const DIRECTIONS: readonly Direction[] = ['long', 'short'];

const RESULT_LOOK = {
  gain: { icon: TrendingUp, tone: 'text-hub-positive', name: 'Win' },
  loss: { icon: TrendingDown, tone: 'text-hub-danger', name: 'Loss' },
  flat: { icon: Minus, tone: 'text-hub-label', name: 'Break-even' },
} as const satisfies Record<ResultTone, unknown>;

function ResultCell({ resultR }: { resultR: number }) {
  const { icon: Icon, tone, name } = RESULT_LOOK[resultTone(resultR)];
  return (
    <span className={cn('inline-flex items-center justify-end gap-2 font-semibold num', tone)}>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">{name}: </span>
      {formatR(resultR)}
    </span>
  );
}

function RulesCell({ followed }: { followed: boolean }) {
  const Icon = followed ? Check : X;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2',
        followed ? 'text-hub-positive' : 'text-hub-amber',
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {followed ? 'Yes' : 'No'}
    </span>
  );
}

/** A form for one trade and the table of trades. */
export function Journal() {
  const today = useToday();
  const trades = useHub((state) => state.trades);
  const { addTrade, removeTrade } = useHubActions();
  const [date, setDate] = useState(today);
  const [market, setMarket] = useState<Market>('Forex');
  const [instrument, setInstrument] = useState('');
  const [direction, setDirection] = useState<Direction>('long');
  const [result, setResult] = useState('');
  const [followedRules, setFollowedRules] = useState(true);
  const [note, setNote] = useState('');
  const [dateError, setDateError] = useState('');
  const [instrumentError, setInstrumentError] = useState('');
  const [resultError, setResultError] = useState('');
  const rows = useMemo(() => newestFirst(trades), [trades]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const resultR = parseNumber(result);
    const cleanInstrument = instrument.trim();
    const nextDateError = isDateKey(date)
      ? ''
      : 'The date is not complete. Select a day, a month and a year.';
    const nextInstrumentError =
      cleanInstrument === '' ? 'The instrument is empty. Enter the instrument, for example EURUSD.' : '';
    const nextResultError =
      resultR === null ? 'The result is not a number. Enter a number, for example -1 or 2.5.' : '';
    setDateError(nextDateError);
    setInstrumentError(nextInstrumentError);
    setResultError(nextResultError);
    if (resultR === null || nextDateError !== '' || nextInstrumentError !== '') {
      return;
    }
    addTrade({
      date,
      market,
      instrument: cleanInstrument,
      direction,
      resultR,
      followedRules,
      note: note.trim(),
    });
    setResult('');
    setNote('');
  };

  return (
    <div>
      <Card>
        <CardTitle>Add a trade</CardTitle>
        <form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" noValidate onSubmit={submit}>
          <TextField error={dateError} label="Date" onChange={setDate} type="date" value={date} />
          <SelectField label="Market" onChange={setMarket} options={MARKETS} value={market} />
          <TextField
            autoCapitalize="characters"
            error={instrumentError}
            label="Instrument"
            onChange={setInstrument}
            value={instrument}
          />
          <SelectField
            label="Direction"
            onChange={setDirection}
            options={DIRECTIONS}
            value={direction}
          />
          <TextField
            error={resultError}
            hint="A loss is a negative number. 1R is the risk on one trade."
            label="Result in R"
            onChange={setResult}
            step={0.1}
            type="number"
            value={result}
          />
          <TextField fieldClassName="lg:col-span-3" label="Note" onChange={setNote} value={note} />
          <CheckField
            checked={followedRules}
            className="sm:col-span-2 lg:col-span-4"
            label="I followed the rules"
            onChange={setFollowedRules}
          />
          <PressButton
            className="sm:col-span-2 lg:col-span-4 lg:justify-self-start"
            tone="secondary"
            type="submit"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add the trade
          </PressButton>
        </form>
      </Card>

      <Card className="mt-4">
        <CardTitle>Trades</CardTitle>
        <TableShell
          className="mt-4"
          empty="There are no trades. Add the first trade with the form."
          isEmpty={rows.length === 0}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="text-right">Result</TableHead>
                <TableHead>Rules</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>
                  <span className="sr-only">Remove</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ item: trade, index }) => (
                <TableRow key={`${index}-${trade.date}`}>
                  <TableCell className="whitespace-nowrap">{formatMedium(trade.date)}</TableCell>
                  <TableCell>{trade.market}</TableCell>
                  <TableCell>{trade.instrument}</TableCell>
                  <TableCell>{trade.direction}</TableCell>
                  <TableCell className="text-right">
                    <ResultCell resultR={trade.resultR} />
                  </TableCell>
                  <TableCell>
                    <RulesCell followed={trade.followedRules} />
                  </TableCell>
                  <TableCell className="max-w-56 min-w-32 whitespace-normal break-words">
                    {trade.note}
                  </TableCell>
                  <TableCell className="text-right">
                    <RemoveButton
                      label={`Remove the ${trade.instrument} trade of ${formatMedium(trade.date)}`}
                      onClick={() => removeTrade(index)}
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
