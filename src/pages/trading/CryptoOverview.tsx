import { Camera } from 'lucide-react';
import { useMemo } from 'react';
import { AllocationRing } from '@/components/charts/hub/AllocationRing';
import { MotionChart } from '@/components/charts/hub/MotionChart';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { CheckField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import { useToday } from '@/hooks/useToday';
import { monthKey } from '@/lib/dates';
import { formatGbp } from '@/lib/format';
import { portfolioValue, snapshotSeries } from '@/lib/trading';
import { allocationItems, trancheLabel } from '@/lib/tradingView';
import { useHub, useHubActions } from '@/store/useHub';

/** The wallet value, the tranche decision, the value over time and the allocation. */
export function CryptoOverview() {
  const today = useToday();
  const coins = useHub((state) => state.coins);
  const snapshots = useHub((state) => state.snapshots);
  const trancheDone = useHub((state) => state.tranche[monthKey(today)] === true);
  const { saveSnapshot, toggleTranche } = useHubActions();

  const total = useMemo(() => portfolioValue(coins), [coins]);
  const points = useMemo(() => snapshotSeries(snapshots), [snapshots]);
  const lines = useMemo(
    () => [{ key: 'wallet', points, color: 'var(--hub-positive)', area: true }],
    [points],
  );
  const items = useMemo(() => allocationItems(coins), [coins]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card aria-labelledby="wallet-value-title" className="lg:col-span-5">
        <CardTitle id="wallet-value-title">Total value</CardTitle>
        <p className="type-hero num mt-3 break-words text-hub-text">
          <RollingNumber format={formatGbp} value={total} whole={false} />
        </p>
        <p className="mt-2 type-label text-hub-label">
          The value comes from the amounts and the prices on the Wallet tab.
        </p>
        <div className="mt-4 border-t border-hub-hairline pt-3">
          <CheckField
            checked={trancheDone}
            label={trancheLabel(today)}
            onChange={() => toggleTranche(today)}
          />
        </div>
      </Card>

      <Card aria-labelledby="allocation-title" className="lg:col-span-7">
        <CardTitle id="allocation-title">Allocation</CardTitle>
        {items.length === 0 ? (
          <p className="mt-3 type-body text-hub-label">
            There are no coins with a value. Enter the amounts and the prices on the Wallet tab.
          </p>
        ) : (
          <AllocationRing
            className="mt-4"
            formatValue={formatGbp}
            items={items}
            label="The share of each coin in the wallet value"
          />
        )}
      </Card>

      <Card aria-labelledby="value-history-title" className="lg:col-span-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle id="value-history-title">Value over time</CardTitle>
          <PressButton onClick={() => saveSnapshot(today)} tone="secondary">
            <Camera aria-hidden="true" className="size-4" />
            Save a snapshot
          </PressButton>
        </div>
        <p className="mt-2 type-label text-hub-label">
          The hub keeps one snapshot for each date. A second snapshot on the same date replaces the
          first.
        </p>
        {points.length === 0 ? (
          <p className="mt-3 type-body text-hub-label">
            There are no snapshots. Save a snapshot to start the chart.
          </p>
        ) : (
          <div className="mt-4">
            <MotionChart
              formatValue={(value) => formatGbp(value, true)}
              height={200}
              label={`The wallet value in GBP for each day. The last value is ${formatGbp(points.at(-1)?.value ?? 0, true)}.`}
              lines={lines}
              today={today}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
