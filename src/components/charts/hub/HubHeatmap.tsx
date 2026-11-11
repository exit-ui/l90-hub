import { motion, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import {
  type HeatmapBin,
  HeatmapCells,
  HeatmapChart,
  type HeatmapColumn,
  type HeatmapLevelColors,
  HeatmapYAxis,
  useHeatmap,
} from '@/components/charts/heatmap';
import { formatMedium, parseKey } from '@/lib/dates';
import { formatInteger } from '@/lib/format';
import { CHART_ENTER, NO_MOTION } from '@/lib/motion';
import type { HeatCell } from '@/lib/sessions';
import { cn } from '@/lib/utils';
import { type ChartTone, TONE_COLOR } from './tones';

interface HubHeatmapProps {
  /** One cell for each day. Row 0 is Monday. Column 0 is the oldest week. */
  cells: readonly HeatCell[];
  /** The text alternative, for example "Training sessions for the last 13 weeks". */
  label: string;
  tone?: ChartTone;
  className?: string;
}

const DAYS_PER_WEEK = 7;
const MARGIN = { top: 0, right: 0, bottom: 0, left: 36 } as const;
const CELL_GAP = 3;
const CELL_RADIUS = 4;
const EMPTY_HEIGHT = 140;
/** The label opacity for each row. It hides the Sunday label: the labels are Mon, Wed, Fri. */
const LABEL_ROW_OPACITY = [1, 1, 1, 1, 1, 1, 0] as const;
const FALLBACK_DATE = new Date(2000, 0, 1);

/** The cell colours from low to high. Level 0 has no paint: the backdrop draws the empty cells. */
function levelColors(tone: ChartTone): HeatmapLevelColors {
  const color = TONE_COLOR[tone];
  return [
    'none',
    `color-mix(in oklab, ${color} 35%, var(--hub-surface))`,
    `color-mix(in oklab, ${color} 55%, var(--hub-surface))`,
    `color-mix(in oklab, ${color} 78%, var(--hub-surface))`,
    color,
  ];
}

/**
 * The cells below the Bklit cells: a filled track for a past day without a value
 * and a dashed outline for a future day. The Bklit cells have no state for a future day.
 */
function CellBackdrop({ cells }: { cells: readonly HeatCell[] }) {
  const { xScale, yScale, binWidth, binHeight, gap } = useHeatmap();
  const width = Math.max(binWidth - gap, 0);
  const height = Math.max(binHeight - gap, 0);
  return (
    <g pointerEvents="none">
      {cells.map((cell) =>
        cell.future ? (
          <rect
            fill="none"
            height={Math.max(height - 1, 0)}
            key={cell.date}
            rx={CELL_RADIUS}
            stroke="var(--hub-label)"
            strokeDasharray="2 2"
            strokeOpacity={0.4}
            strokeWidth={1}
            width={Math.max(width - 1, 0)}
            x={xScale(cell.column) + 0.5}
            y={yScale(cell.row) + gap + 0.5}
          />
        ) : (
          <rect
            fill="var(--hub-track)"
            height={height}
            key={cell.date}
            rx={CELL_RADIUS}
            width={width}
            x={xScale(cell.column)}
            y={yScale(cell.row) + gap}
          />
        ),
      )}
    </g>
  );
}

/**
 * Week columns for the Bklit heatmap. The Bklit source order starts on Sunday,
 * thus the Sunday row (row 6) comes first. `weekStartDay={1}` puts Monday at the top.
 */
function toColumns(cells: readonly HeatCell[]): HeatmapColumn[] {
  const columnCount = cells.reduce((max, cell) => Math.max(max, cell.column + 1), 0);
  const grid = new Map<string, HeatCell>();
  for (const cell of cells) {
    grid.set(`${cell.column}-${cell.row}`, cell);
  }
  return Array.from({ length: columnCount }, (_, column) => {
    const bins: HeatmapBin[] = Array.from({ length: DAYS_PER_WEEK }, (_, sourceIndex) => {
      const row = (sourceIndex + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;
      const cell = grid.get(`${column}-${row}`);
      return {
        bin: sourceIndex,
        count: cell && !cell.future ? Math.max(cell.value, 0) : 0,
        date: (cell ? parseKey(cell.date) : null) ?? FALLBACK_DATE,
      };
    });
    return { bin: column, bins };
  });
}

/**
 * A grid of weeks by days. A stronger colour shows a higher value.
 * A wrapper for the Bklit HeatmapChart.
 */
export function HubHeatmap({ cells, label, tone = 'data', className }: HubHeatmapProps) {
  const reduced = useReducedMotion();
  const columns = useMemo(() => toColumns(cells), [cells]);
  const colors = useMemo(() => levelColors(tone), [tone]);
  const valid = useMemo(
    () => cells.filter((cell) => cell.row >= 0 && cell.row < DAYS_PER_WEEK && cell.column >= 0),
    [cells],
  );

  if (valid.length === 0) {
    return (
      <div
        aria-label={`${label}. There is no data for this chart.`}
        className={cn(
          'flex w-full min-w-0 items-center justify-center rounded-control bg-hub-track px-4 text-center',
          className,
        )}
        role="img"
        style={{ height: EMPTY_HEIGHT }}
      >
        <p className="type-body text-hub-label">There is no data for this chart.</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full min-w-0', className)}>
      <motion.div
        animate={{ opacity: 1 }}
        aria-label={label}
        className="w-full max-w-md min-w-0"
        initial={{ opacity: 0 }}
        role="img"
        transition={reduced ? NO_MOTION : CHART_ENTER}
      >
        <HeatmapChart
          animate={false}
          data={columns}
          gap={CELL_GAP}
          layout="fluid"
          levelColors={colors}
          margin={MARGIN}
          weekStartDay={1}
        >
          <CellBackdrop cells={valid} />
          <HeatmapCells cornerRadius={CELL_RADIUS} hideGhostCells={false} interactive={false} />
          <HeatmapYAxis
            className="type-label text-hub-label"
            rowOpacity={LABEL_ROW_OPACITY}
            tickFilter="even"
          />
        </HeatmapChart>
      </motion.div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {valid
            .filter((cell) => !cell.future)
            .map((cell) => (
              <tr key={cell.date}>
                <th scope="row">{parseKey(cell.date) ? formatMedium(cell.date) : cell.date}</th>
                <td>{formatInteger(cell.value)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
