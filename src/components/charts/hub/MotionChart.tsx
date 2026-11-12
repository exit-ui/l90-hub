import { animate, useReducedMotion } from 'motion/react';
import {
  type PointerEvent,
  type RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { diffDays, formatShort } from '@/lib/dates';
import { CHART_EASE, CHART_MORPH_MS } from '@/lib/motion';
import type { Point } from '@/lib/progressSeries';
import type { DateKey } from '@/store/types';

export interface ChartLine {
  key: string;
  points: readonly Point[];
  /** A CSS colour token, for example "var(--hub-accent)". */
  color: string;
  /** An SVG dash pattern. Each compare line has a different one, so colour is not the only cue. */
  dash?: string;
  width?: number;
  /** Fill the room under the line, for a rolling count that reads as a level. */
  area?: boolean;
}

interface MotionChartProps {
  /** Bars for the daily value. Leave empty in compare mode. */
  bars?: readonly Point[];
  lines?: readonly ChartLine[];
  /** The dashed projection after today. */
  projection?: readonly Point[];
  /** A dashed reference line, for example the target or 100 %. */
  reference?: { value: number; label: string } | null;
  /** The text alternative of the chart. */
  label: string;
  today: DateKey;
  height: number;
  formatValue: (value: number) => string;
  /** The y-axis name, for example "% of target". */
  yAxisLabel?: string;
  /** "area": the daily values as a green line over a soft gradient fill (the default). "bars": one bar a day. */
  look?: 'area' | 'bars';
}

const EPOCH = '2020-01-01';
const MARGIN = { top: 16, right: 8, bottom: 24, left: 36 } as const;
const BAR_SHARE = 0.62;

type Values = Map<number, number | null>;

interface Frame {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** The values of each series by day index. "bars" holds the bars. */
  series: Map<string, Values>;
}

function dayIndex(date: DateKey): number {
  return diffDays(date, EPOCH);
}

function toValues(points: readonly Point[]): Values {
  return new Map(points.map((point) => [dayIndex(point.date), point.value]));
}

function niceMax(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((item) => item * power >= value) ?? 10;
  return step * power;
}

type FrameInput = Pick<MotionChartProps, 'bars' | 'lines' | 'projection' | 'reference'>;

const NO_LINES: readonly ChartLine[] = [];

function buildFrame(props: FrameInput): Frame {
  const series = new Map<string, Values>();
  const all: number[] = [];
  const indexes: number[] = [];
  const add = (key: string, points: readonly Point[]) => {
    series.set(key, toValues(points));
    for (const point of points) {
      indexes.push(dayIndex(point.date));
      if (point.value !== null) {
        all.push(point.value);
      }
    }
  };
  if (props.bars && props.bars.length > 0) {
    add('bars', props.bars);
  }
  for (const line of props.lines ?? []) {
    add(line.key, line.points);
  }
  if (props.projection && props.projection.length > 0) {
    add('projection', props.projection);
  }
  if (props.reference) {
    all.push(props.reference.value);
  }
  const x0 = indexes.length > 0 ? Math.min(...indexes) : 0;
  const x1 = indexes.length > 0 ? Math.max(...indexes) : 1;
  const low = Math.min(0, ...all);
  const high = niceMax(Math.max(...all, 1) * 1.08);
  return { x0, x1: Math.max(x1, x0 + 1), y0: low < 0 ? -niceMax(-low * 1.08) : 0, y1: high, series };
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

interface Mark {
  index: number;
  value: number;
  alpha: number;
}

/** The series at one moment of the morph. Values that exist in both frames move; the others fade. */
function marksAt(from: Frame, to: Frame, key: string, t: number): Mark[] {
  const before = from.series.get(key);
  const after = to.series.get(key);
  const indexes = new Set<number>([...(before?.keys() ?? []), ...(after?.keys() ?? [])]);
  const marks: Mark[] = [];
  for (const index of [...indexes].sort((a, b) => a - b)) {
    const start = before?.get(index) ?? null;
    const end = after?.get(index) ?? null;
    if (start === null && end === null) {
      continue;
    }
    if (start !== null && end !== null) {
      marks.push({ index, value: lerp(start, end, t), alpha: 1 });
    } else if (end !== null) {
      marks.push({ index, value: end, alpha: before === undefined ? t : Math.max(t, 0.001) });
    } else if (start !== null) {
      marks.push({ index, value: start, alpha: 1 - t });
    }
  }
  return marks;
}

function frameAt(from: Frame, to: Frame, t: number): Frame {
  const series = new Map<string, Values>();
  for (const key of new Set([...from.series.keys(), ...to.series.keys()])) {
    series.set(key, new Map(marksAt(from, to, key, t).map((mark) => [mark.index, mark.value])));
  }
  return {
    x0: lerp(from.x0, to.x0, t),
    x1: lerp(from.x1, to.x1, t),
    y0: lerp(from.y0, to.y0, t),
    y1: lerp(from.y1, to.y1, t),
    series,
  };
}

function useWidth(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => setWidth(Math.round(element.clientWidth)));
    observer.observe(element);
    setWidth(Math.round(element.clientWidth));
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function areaPath(marks: readonly Mark[], x: (index: number) => number, y: (value: number) => number, base: number): string {
  let path = '';
  let segment: Mark[] = [];
  const close = () => {
    const first = segment[0];
    const last = segment.at(-1);
    if (first && last) {
      path += `M${x(first.index).toFixed(1)},${base.toFixed(1)}`;
      for (const mark of segment) {
        path += `L${x(mark.index).toFixed(1)},${y(mark.value).toFixed(1)}`;
      }
      path += `L${x(last.index).toFixed(1)},${base.toFixed(1)}Z`;
    }
    segment = [];
  };
  for (const mark of marks) {
    const previous = segment.at(-1);
    if (previous && mark.index - previous.index !== 1) {
      close();
    }
    segment.push(mark);
  }
  close();
  return path;
}

function linePath(marks: readonly Mark[], x: (index: number) => number, y: (value: number) => number): string {
  let path = '';
  let previous: number | null = null;
  for (const mark of marks) {
    const command = previous !== null && mark.index - previous === 1 ? 'L' : 'M';
    path += `${command}${x(mark.index).toFixed(1)},${y(mark.value).toFixed(1)}`;
    previous = mark.index;
  }
  return path;
}

/**
 * The motion chart. It never remounts on a filter change: the x and y domains and all marks
 * morph from the current frame to the new data in 300 ms. A new change during a morph
 * starts from the frame on screen. With reduced motion the new state shows at once.
 */
export function MotionChart({
  bars: barPoints,
  lines = NO_LINES,
  projection: projectionPoints,
  reference,
  label,
  today,
  height,
  formatValue,
  yAxisLabel,
  look = 'area',
}: MotionChartProps) {
  const reduced = useReducedMotion();
  const clipId = `motion-chart-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [containerRef, width] = useWidth();
  const target = useMemo(
    () => buildFrame({ bars: barPoints, lines, projection: projectionPoints, reference }),
    [barPoints, lines, projectionPoints, reference],
  );
  const [motionState, setMotionState] = useState<{ from: Frame; to: Frame; t: number }>(() => ({
    from: target,
    to: target,
    t: 1,
  }));
  const [seenTarget, setSeenTarget] = useState(target);
  // New data: the morph starts from the frame on screen, so a change during a morph is smooth.
  if (seenTarget !== target) {
    setSeenTarget(target);
    setMotionState({
      from: frameAt(motionState.from, motionState.to, motionState.t),
      to: target,
      t: reduced ? 1 : 0,
    });
  }
  const goal = motionState.to;
  const waiting = motionState.t < 1;
  useEffect(() => {
    if (reduced || !waiting) {
      return;
    }
    const controls = animate(0, 1, {
      duration: CHART_MORPH_MS / 1000,
      ease: CHART_EASE,
      onUpdate: (value) => setMotionState((current) => (current.to === goal ? { ...current, t: value } : current)),
    });
    return () => controls.stop();
  }, [goal, reduced, waiting]);
  const { from, to, t } = motionState;

  const [hover, setHover] = useState<number | null>(null);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);
  const x0 = lerp(from.x0, to.x0, t);
  const x1 = lerp(from.x1, to.x1, t);
  const y0 = lerp(from.y0, to.y0, t);
  const y1 = lerp(from.y1, to.y1, t);
  const span = Math.max(1, x1 - x0 + 1);
  const band = innerWidth / span;
  const x = (index: number) => MARGIN.left + (index - x0 + 0.5) * band;
  const y = (value: number) => MARGIN.top + innerHeight - ((value - y0) / Math.max(1e-6, y1 - y0)) * innerHeight;
  const zeroY = y(Math.max(y0, 0));

  const bars = marksAt(from, to, 'bars', t);
  const projection = marksAt(from, to, 'projection', t);
  const lineKeys = new Set([...from.series.keys(), ...to.series.keys()]);
  lineKeys.delete('bars');
  lineKeys.delete('projection');
  const lineStyles = new Map(lines.map((line) => [line.key, line]));
  const ticks = [y0 < 0 ? y0 : null, 0, (y0 + y1) / 2, y1].filter(
    (value): value is number => value !== null,
  );
  const todayIndex = dayIndex(today);

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.round(x0 + (event.clientX - box.left - MARGIN.left) / band - 0.5);
    setHover(index >= Math.round(to.x0) && index <= Math.round(to.x1) ? index : null);
  };

  const hoverBar = hover === null ? null : (to.series.get('bars')?.get(hover) ?? null);
  const hoverText = (() => {
    if (hover === null) {
      return null;
    }
    const key = keyOf(hover);
    const parts: string[] = [];
    const bar = to.series.get('bars')?.get(hover);
    if (bar !== undefined && bar !== null) {
      parts.push(formatValue(bar));
    }
    for (const line of lines) {
      const value = to.series.get(line.key)?.get(hover);
      if (value !== undefined && value !== null && !to.series.has('bars')) {
        parts.push(formatValue(value));
      }
    }
    return `${formatShort(key)} · ${parts.length > 0 ? parts.join(' · ') : 'no data'}`;
  })();

  return (
    <div className="relative w-full min-w-0" ref={containerRef}>
      {hoverText && hover !== null ? (
        <p
          aria-hidden="true"
          className="type-caption num pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-full bg-hub-black px-2.5 py-1 whitespace-nowrap text-hub-on-black"
          style={{ left: Math.min(Math.max(x(hover), 64), Math.max(64, width - 64)) }}
        >
          {hoverText}
        </p>
      ) : null}
      <div aria-label={label} role="img" style={{ height }}>
        {width > 0 ? (
          <svg
            className="block touch-pan-y overflow-visible"
            height={height}
            onPointerDown={onPointerMove}
            onPointerLeave={() => setHover(null)}
            onPointerMove={onPointerMove}
            width={width}
          >
            <defs>
              <clipPath id={clipId}>
                <rect height={innerHeight + MARGIN.top} width={innerWidth} x={MARGIN.left} y={0} />
              </clipPath>
              <linearGradient id={`${clipId}-fill`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--hub-chart-fill)" stopOpacity={0.32} />
                <stop offset="1" stopColor="var(--hub-chart-fill)" stopOpacity={0} />
              </linearGradient>
            </defs>
            {todayIndex < Math.round(to.x1) && todayIndex >= Math.round(to.x0) ? (
              <g aria-hidden="true">
                <rect
                  fill="var(--hub-chart-future)"
                  height={innerHeight}
                  opacity={0.7}
                  width={Math.max(0, MARGIN.left + innerWidth - (x(todayIndex) + band / 2))}
                  x={x(todayIndex) + band / 2}
                  y={MARGIN.top}
                />
                {MARGIN.left + innerWidth - (x(todayIndex) + band / 2) > 72 ? (
                  <text
                    className="fill-hub-label type-caption"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    x={(x(todayIndex) + band / 2 + MARGIN.left + innerWidth) / 2}
                    y={MARGIN.top + innerHeight / 2}
                  >
                    Days ahead
                  </text>
                ) : null}
              </g>
            ) : null}
            {ticks.map((value) => (
              <g key={`tick-${value.toFixed(3)}`}>
                <line stroke="var(--hub-chart-grid)" x1={MARGIN.left} x2={MARGIN.left + innerWidth} y1={y(value)} y2={y(value)} />
                <text
                  className="fill-hub-label type-caption num"
                  dominantBaseline="middle"
                  textAnchor="end"
                  x={MARGIN.left - 8}
                  y={y(value)}
                >
                  {formatValue(Math.round(value))}
                </text>
              </g>
            ))}
            <g clipPath={`url(#${clipId})`}>
              {look === 'area' && bars.length > 0 ? (
                <g>
                  <path d={areaPath(bars, x, y, zeroY)} fill={`url(#${clipId}-fill)`} />
                  <path
                    d={linePath(bars, x, y)}
                    fill="none"
                    stroke="var(--hub-chart-line)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                  />
                </g>
              ) : null}
              {(look === 'bars' ? bars : []).map((mark) => {
                const top = y(Math.max(mark.value, 0));
                const bottom = y(Math.min(mark.value, 0));
                return (
                  <rect
                    fill={
                      mark.index === todayIndex
                        ? 'var(--hub-chart-bar-today)'
                        : mark.index > todayIndex
                          ? 'var(--hub-chart-bar-future)'
                          : 'var(--hub-chart-bar)'
                    }
                    height={Math.max(mark.value === 0 ? 0 : 1, bottom - top)}
                    key={`bar-${mark.index}`}
                    opacity={hover === null || hover === mark.index ? mark.alpha : mark.alpha * 0.55}
                    width={Math.max(1, band * BAR_SHARE)}
                    x={x(mark.index) - (band * BAR_SHARE) / 2}
                    y={top}
                  />
                );
              })}
              {[...lineKeys].map((key) => {
                const style = lineStyles.get(key);
                const presentBefore = from.series.has(key);
                const presentAfter = to.series.has(key);
                const alpha = lerp(presentBefore ? 1 : 0, presentAfter ? 1 : 0, t);
                const marks = marksAt(from, to, key, t);
                return (
                  <g key={key} opacity={alpha}>
                    {style?.area ? (
                      <path d={areaPath(marks, x, y, zeroY)} fill={style.color} fillOpacity={0.14} />
                    ) : null}
                  <path
                    d={linePath(marks, x, y)}
                    fill="none"
                    stroke={style?.color ?? 'var(--hub-chart-mean)'}
                    strokeDasharray={style?.dash}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={style?.width ?? 2}
                  />
                  </g>
                );
              })}
              {projection.length > 0 ? (
                <path
                  d={linePath(projection, x, y)}
                  fill="none"
                  opacity={projection[0]?.alpha ?? 1}
                  stroke="var(--hub-chart-target)"
                  strokeDasharray="3 5"
                  strokeLinecap="round"
                  strokeWidth={1.5}
                />
              ) : null}
            </g>
            {reference ? (
              <g>
                <line
                  stroke="var(--hub-chart-target)"
                  strokeDasharray="6 6"
                  x1={MARGIN.left}
                  x2={MARGIN.left + innerWidth}
                  y1={y(reference.value)}
                  y2={y(reference.value)}
                />
              </g>
            ) : null}
            {todayIndex >= x0 && todayIndex <= x1 && todayIndex < Math.round(to.x1) ? (
              <line
                stroke="var(--hub-chart-today)"
                strokeDasharray="2 4"
                x1={x(todayIndex)}
                x2={x(todayIndex)}
                y1={MARGIN.top}
                y2={MARGIN.top + innerHeight}
              />
            ) : null}
            {hover !== null ? (
              <line
                stroke="var(--hub-chart-today)"
                strokeDasharray="2 3"
                x1={x(hover)}
                x2={x(hover)}
                y1={MARGIN.top}
                y2={MARGIN.top + innerHeight}
              />
            ) : null}
            {hover !== null && hoverBar !== null && look === 'area' ? (
              <circle
                cx={x(hover)}
                cy={y(hoverBar)}
                fill="var(--hub-surface)"
                r={5.5}
                stroke="var(--hub-chart-line)"
                strokeWidth={2.5}
              />
            ) : null}
            <line stroke="var(--hub-chart-grid)" x1={MARGIN.left} x2={MARGIN.left + innerWidth} y1={zeroY} y2={zeroY} />
            <text className="fill-hub-label type-caption" x={MARGIN.left} y={height - 4}>
              {formatShort(keyOf(Math.round(to.x0)))}
            </text>
            <text className="fill-hub-label type-caption" textAnchor="end" x={MARGIN.left + innerWidth} y={height - 4}>
              {formatShort(keyOf(Math.round(to.x1)))}
            </text>
            {yAxisLabel ? (
              <text className="fill-hub-label type-caption" textAnchor="middle" x={MARGIN.left + innerWidth / 2} y={height - 4}>
                {yAxisLabel}
              </text>
            ) : null}
          </svg>
        ) : null}
      </div>
      {reference ? (
        <p aria-hidden="true" className="type-caption mt-2 flex items-center gap-2 text-hub-label">
          <svg height="8" width="20">
            <line stroke="var(--hub-chart-target)" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="20" y1="4" y2="4" />
          </svg>
          {reference.label}
        </p>
      ) : null}
    </div>
  );
}

function keyOf(index: number): DateKey {
  const date = new Date(2020, 0, 1 + index);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
