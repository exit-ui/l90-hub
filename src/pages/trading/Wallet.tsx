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
import { Card } from '@/components/shared/Card';
import { CardTitle, RemoveButton, TableShell } from '@/components/shared/Controls';
import { FieldInput, TextField } from '@/components/shared/Field';
import { Notice } from '@/components/shared/Notice';
import { PressButton } from '@/components/shared/PressButton';
import { formatGbp } from '@/lib/format';
import { coinValue, portfolioValue } from '@/lib/trading';
import type { Coin } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';
import { useNumberText } from './useNumberText';

interface NumberCellProps {
  /** The full name of the field, for example "Amount of BTC". */
  label: string;
  value: number;
  step: number;
  onSave: (value: number) => void;
}

/** A number input in a table cell. It keeps the raw text while the user types. */
function NumberCell({ label, value, step, onSave }: NumberCellProps) {
  const field = useNumberText(value, onSave);
  return (
    <FieldInput
      aria-label={label}
      className="num min-w-28 text-right"
      inputMode="decimal"
      min={0}
      onBlur={field.onBlur}
      onChange={(event) => field.onChange(event.target.value)}
      step={step}
      type="number"
      value={field.text}
    />
  );
}

function CoinRow({ coin, index }: { coin: Coin; index: number }) {
  const { updateCoin, removeCoin } = useHubActions();
  return (
    <TableRow>
      <TableCell className="font-semibold text-hub-text">{coin.symbol}</TableCell>
      <TableCell>
        <NumberCell
          label={`Amount of ${coin.symbol}`}
          onSave={(amount) => updateCoin(index, { amount })}
          step={0.0001}
          value={coin.amount}
        />
      </TableCell>
      <TableCell>
        <NumberCell
          label={`Price of ${coin.symbol} in GBP`}
          onSave={(priceGbp) => updateCoin(index, { priceGbp })}
          step={0.01}
          value={coin.priceGbp}
        />
      </TableCell>
      <TableCell className="text-right num">{formatGbp(coinValue(coin))}</TableCell>
      <TableCell className="text-right">
        <RemoveButton label={`Remove ${coin.symbol}`} onClick={() => removeCoin(index)} />
      </TableCell>
    </TableRow>
  );
}

/** The coins with a manual amount and a manual price. */
export function Wallet() {
  const coins = useHub((state) => state.coins);
  const { addCoin } = useHubActions();
  const [symbol, setSymbol] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (symbol.trim() === '') {
      setError('The symbol is empty. Enter the symbol of the coin, for example BTC.');
      return;
    }
    setError('');
    addCoin(symbol);
    setSymbol('');
  };

  return (
    <div className="grid gap-4">
      <Notice kind="NOTE">
        The prices are manual. The hub does not get live prices. Enter each price in GBP.
      </Notice>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle>Wallet</CardTitle>
          <p className="type-body text-hub-text">
            Total <span className="font-semibold num">{formatGbp(portfolioValue(coins))}</span>
          </p>
        </div>
        <TableShell
          className="mt-4"
          empty="There are no coins. Add the first coin with the form."
          isEmpty={coins.length === 0}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coin</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Price in GBP</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>
                  <span className="sr-only">Remove</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coins.map((coin, index) => (
                <CoinRow coin={coin} index={index} key={`${index}-${coin.symbol}`} />
              ))}
            </TableBody>
          </Table>
        </TableShell>
      </Card>

      <Card>
        <CardTitle>Add a coin</CardTitle>
        <form className="mt-4 flex flex-wrap items-end gap-3" noValidate onSubmit={submit}>
          <TextField
            autoCapitalize="characters"
            error={error}
            fieldClassName="min-w-40 flex-1"
            label="Symbol"
            onChange={setSymbol}
            placeholder="BTC"
            value={symbol}
          />
          <PressButton tone="secondary" type="submit">
            <Plus aria-hidden="true" className="size-4" />
            Add the coin
          </PressButton>
        </form>
      </Card>
    </div>
  );
}
