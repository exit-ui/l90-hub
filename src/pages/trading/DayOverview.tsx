import { Activity, ListChecks, Plus, Scale, Sigma, Target, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';
import { HubAreaChart } from '@/components/charts/hub/HubAreaChart';
import { HubBarChart } from '@/components/charts/hub/HubBarChart';
import { HubGauge } from '@/components/charts/hub/HubGauge';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { Notice } from '@/components/shared/Notice';
import { PressButton } from '@/components/shared/PressButton';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { useToday } from '@/hooks/useToday';
import { formatCount, formatR, formatRate } from '@/lib/format';
import { tradeStats } from '@/lib/trading';
import { aboveCheckLimit, cumulativePoints, LAST_TRADES, lastTradePoints } from '@/lib/tradingView';
import { useHub, useHubActions } from '@/store/useHub';
import { StatTile } from './StatTile';

const EMPTY_LINE = 'There are no trades. Add the first trade on the Journal tab.';

/** The results in R, two charts and the gauge for chart checks. */
export function DayOverview() {
  const today = useToday();
  const trades = useHub((state) => state.trades);
  const checks = useHub((state) => state.days[today]?.chartChecks ?? 0);
  const limit = useHub((state) => state.chartCheckLimit);
  const { addChartCheck } = useHubActions();

  const stats = useMemo(() => tradeStats(trades), [trades]);
  const cumulative = useMemo(() => cumulativePoints(trades), [trades]);
  const last = useMemo(() => lastTradePoints(trades, LAST_TRADES), [trades]);
  const above = aboveCheckLimit(checks, limit);

  return (
    <div className="grid gap-4">
      {above ? (
        <Notice kind="CAUTION">
          You are above the limit for chart checks today. Close the charts. Wait for the alert.
        </Notice>
      ) : null}

      <section aria-label="Day trading results" className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatTile icon={Activity} label="Trades" value={formatCount(stats.count === 0 ? null : stats.count)} />
        <StatTile
          bar={
            <ProgressBar
              fraction={stats.winRate ?? 0}
              label={`Win rate ${formatRate(stats.winRate)}`}
              tone="data"
            />
          }
          icon={Target}
          label="Win rate"
          value={formatRate(stats.winRate)}
        />
        <StatTile
          detail="for each trade"
          icon={Scale}
          label="Expectancy"
          value={formatR(stats.expectancy)}
        />
        <StatTile icon={Sigma} label="Cumulative R" value={formatR(stats.cumulativeR)} />
        <StatTile
          detail="losses in a row"
          icon={TrendingDown}
          label="Longest losing streak"
          value={formatCount(stats.longestLosingStreak)}
        />
        <StatTile
          bar={
            <ProgressBar
              fraction={stats.ruleAdherence ?? 0}
              label={`Rule adherence ${formatRate(stats.ruleAdherence)}`}
              tone="secondary"
            />
          }
          icon={ListChecks}
          label="Rule adherence"
          value={formatRate(stats.ruleAdherence)}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card aria-labelledby="cumulative-r-title" className="lg:col-span-8">
          <CardTitle id="cumulative-r-title">Cumulative R</CardTitle>
          {cumulative.length === 0 ? (
            <p className="mt-3 type-body text-hub-label">{EMPTY_LINE}</p>
          ) : (
            <HubAreaChart
              className="mt-4"
              data={cumulative}
              formatLabel={(label) => `Trade ${label}`}
              formatValue={formatR}
              label="Cumulative R after each trade in date order"
              tone="data"
            />
          )}
        </Card>

        <Card aria-labelledby="chart-checks-title" className="lg:col-span-4">
          <CardTitle id="chart-checks-title">Chart checks today</CardTitle>
          <div className="mt-4 flex flex-col items-center gap-4">
            <HubGauge
              label={`${checks} chart checks today. The limit is ${limit}.`}
              limit={limit}
              value={checks}
            />
            <p className="text-center type-body text-hub-text">
              {checks} of {limit} checks
            </p>
            <PressButton
              aria-label="Add 1 chart check"
              onClick={() => addChartCheck(today)}
              tone="secondary"
            >
              <Plus aria-hidden="true" className="size-4" />
              +1 check
            </PressButton>
            <p className="text-center type-label text-hub-label">
              Press the button each time you open the charts.
            </p>
          </div>
        </Card>

        <Card aria-labelledby="last-trades-title" className="lg:col-span-12">
          <CardTitle id="last-trades-title">The last {LAST_TRADES} trades in R</CardTitle>
          {last.length === 0 ? (
            <p className="mt-3 type-body text-hub-label">{EMPTY_LINE}</p>
          ) : (
            <HubBarChart
              className="mt-4"
              data={last}
              formatValue={formatR}
              label={`The result in R for each of the last ${LAST_TRADES} trades`}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
