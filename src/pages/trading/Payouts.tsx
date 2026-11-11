import { Plus } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { Card } from '@/components/shared/Card';
import { CardTitle, RemoveButton, TableShell } from '@/components/shared/Controls';
import { TextField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import { useToday } from '@/hooks/useToday';
import { formatMedium, isDateKey } from '@/lib/dates';
import { formatGbp, parseNumber } from '@/lib/format';
import { newestFirst } from '@/lib/sessions';
import { payoutTotal } from '@/lib/trading';
import { useHub, useHubActions } from '@/store/useHub';

/** A form for one payout, the total and the table of payouts. */
export function Payouts() {
  const today = useToday();
  const payouts = useHub((state) => state.payouts);
  const { addPayout, removePayout } = useHubActions();
  const [date, setDate] = useState(today);
  const [firm, setFirm] = useState('');
  const [amount, setAmount] = useState('');
  const [dateError, setDateError] = useState('');
  const [firmError, setFirmError] = useState('');
  const [amountError, setAmountError] = useState('');
  const rows = useMemo(() => newestFirst(payouts), [payouts]);
  const total = useMemo(() => payoutTotal(payouts), [payouts]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const amountGbp = parseNumber(amount);
    const cleanFirm = firm.trim();
    const nextDateError = isDateKey(date)
      ? ''
      : 'The date is not complete. Select a day, a month and a year.';
    const nextFirmError = cleanFirm === '' ? 'The firm is empty. Enter the name of the firm.' : '';
    const nextAmountError =
      amountGbp === null || amountGbp <= 0
        ? 'The amount is not a number above 0. Enter the amount in GBP, for example 250.'
        : '';
    setDateError(nextDateError);
    setFirmError(nextFirmError);
    setAmountError(nextAmountError);
    if (amountGbp === null || nextDateError !== '' || nextFirmError !== '' || nextAmountError !== '') {
      return;
    }
    addPayout({ date, firm: cleanFirm, amountGbp });
    setAmount('');
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-4 lg:self-start">
        <CardTitle>Total payouts</CardTitle>
        <p className="type-hero num mt-3 break-words text-hub-positive">
          <RollingNumber format={formatGbp} value={total} whole={false} />
        </p>
        <p className="mt-2 type-label text-hub-label">
          {rows.length === 1 ? '1 payout' : `${rows.length} payouts`} in the log
        </p>
      </Card>

      <Card className="lg:col-span-8">
        <CardTitle>Add a payout</CardTitle>
        <form className="mt-4 grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 lg:grid-cols-3" noValidate onSubmit={submit}>
          <TextField error={dateError} label="Date" onChange={setDate} type="date" value={date} />
          <TextField error={firmError} label="Firm" onChange={setFirm} value={firm} />
          <TextField
            error={amountError}
            inputMode="decimal"
            label="Amount in GBP"
            min={0}
            onChange={setAmount}
            step={0.01}
            type="number"
            value={amount}
          />
          <PressButton className="col-span-full justify-self-end" tone="secondary" type="submit">
            <Plus aria-hidden="true" className="size-4" />
            Add the payout
          </PressButton>
        </form>
      </Card>

      <Card className="lg:col-span-12">
        <CardTitle>Payouts</CardTitle>
        <TableShell
          className="mt-4"
          empty="There are no payouts. Add the first payout with the form."
          isEmpty={rows.length === 0}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Firm</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Remove</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ item: payout, index }) => (
                <TableRow key={`${index}-${payout.date}`}>
                  <TableCell className="whitespace-nowrap">{formatMedium(payout.date)}</TableCell>
                  <TableCell className="max-w-56 whitespace-normal break-words">
                    {payout.firm}
                  </TableCell>
                  <TableCell className="text-right num">
                    {formatGbp(payout.amountGbp)}
                  </TableCell>
                  <TableCell className="text-right">
                    <RemoveButton
                      label={`Remove the ${payout.firm} payout of ${formatMedium(payout.date)}`}
                      onClick={() => removePayout(index)}
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
