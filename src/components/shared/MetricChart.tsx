import { useMemo } from 'react';
import { MotionChart } from '@/components/charts/hub/MotionChart';
import { useToday } from '@/hooks/useToday';
import { chartModel, chartValueFormat } from '@/lib/chartModel';
import type { Metric, Range } from '@/lib/progressSeries';
import { useHub } from '@/store/useHub';
import { ChartTable } from './ProgressChart';

interface MetricChartProps {
  metric: Metric;
  range: Range;
  /** The title above the chart, for example "Last 14 days". */
  title: string;
  height?: number;
  /** Show the first insight of the last 30 days under the chart. */
  insight?: boolean;
}

/**
 * One metric over a fixed range, drawn by the motion chart with the same axes everywhere.
 * It has its summary for screen readers and the data table.
 */
export function MetricChart({ metric, range, title, height = 180, insight = false }: MetricChartProps) {
  const today = useToday();
  const days = useHub((state) => state.days);
  const weekTemplate = useHub((state) => state.weekTemplate);
  const startDate = useHub((state) => state.startDate);
  const fitness = useHub((state) => state.fitness);
  const learning = useHub((state) => state.learning);
  const trades = useHub((state) => state.trades);
  const dmTarget = useHub((state) => state.dmTarget);
  const fitTarget = useHub((state) => state.fitTarget);
  const learnTarget = useHub((state) => state.learnTarget);
  const series = useMemo(
    () => ({ days, weekTemplate, startDate, fitness, learning, trades }),
    [days, weekTemplate, startDate, fitness, learning, trades],
  );
  const settings = useMemo(() => ({ dmTarget, fitTarget, learnTarget }), [dmTarget, fitTarget, learnTarget]);
  const model = useMemo(() => chartModel(series, settings, { metric, range, compare: [] }, today), [series, settings, metric, range, today]);
  const first = useMemo(
    () => (insight ? (chartModel(series, settings, { metric, range: 30, compare: [] }, today).insights[0] ?? null) : null),
    [insight, series, settings, metric, today],
  );
  const format = useMemo(() => chartValueFormat(metric, false), [metric]);
  return (
    <section aria-label={title}>
      <h3 className="type-section text-hub-text">{title}</h3>
      <div className="mt-4">
        <MotionChart
          bars={model.bars}
          formatValue={format}
          height={height}
          label={model.summary}
          lines={model.lines}
          reference={model.reference}
          today={today}
        />
      </div>
      <ChartTable columns={model.columns} format={format} rows={model.rows} summary={model.summary} />
      {first ? <p className="type-body mt-4 text-hub-label-strong">{first.text}</p> : null}
    </section>
  );
}
