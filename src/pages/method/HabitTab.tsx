import { useId } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { Notice } from '@/components/shared/Notice';
import { useToday } from '@/hooks/useToday';
import {
  areaPath,
  baselineY,
  HABIT_FRAME,
  HABIT_TICKS,
  habitCurve,
  habitValue,
  labelAnchor,
  linePath,
  xOfDay,
  yOfValue,
} from '@/lib/methodCurves';
import { HABIT_MEDIAN_DAY, missionClock } from '@/lib/phases';
import { useHub } from '@/store/useHub';
import { SchematicLabel, Statement } from './Statement';

const CURVE = habitCurve();
const LINE = linePath(CURVE, HABIT_FRAME);
const AREA = areaPath(CURVE, HABIT_FRAME);
const BASE = baselineY(HABIT_FRAME);
const MEDIAN_X = xOfDay(HABIT_MEDIAN_DAY, HABIT_FRAME);

function HabitCurve({ day }: { day: number }) {
  const markerX = xOfDay(day, HABIT_FRAME);
  const markerY = yOfValue(habitValue(day), HABIT_FRAME);
  return (
    <svg
      aria-label={`Schematic habit curve from day 0 to day 90. The curve rises fast in the first days. Then the curve becomes flat. A vertical line marks day ${HABIT_MEDIAN_DAY}. A marker shows mission day ${day}.`}
      className="h-auto w-full"
      role="img"
      viewBox={`0 0 ${HABIT_FRAME.width} ${HABIT_FRAME.height}`}
    >
      <path d={AREA} fill="url(#hub-grad-primary)" fillOpacity={0.22} />
      <path
        className="stroke-hub-primary-end"
        d={LINE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
      <line
        className="stroke-hub-hairline"
        strokeWidth={1.5}
        x1={HABIT_FRAME.left}
        x2={HABIT_FRAME.width - HABIT_FRAME.right}
        y1={BASE}
        y2={BASE}
      />
      <line
        className="stroke-hub-accent-text"
        strokeDasharray="4 4"
        strokeWidth={1.5}
        x1={MEDIAN_X}
        x2={MEDIAN_X}
        y1={HABIT_FRAME.top - 8}
        y2={BASE}
      />
      <text
        className="fill-hub-accent-text type-label font-semibold"
        textAnchor={labelAnchor(HABIT_MEDIAN_DAY, HABIT_FRAME)}
        x={MEDIAN_X}
        y={HABIT_FRAME.top - 14}
      >
        Day {HABIT_MEDIAN_DAY}
      </text>
      {HABIT_TICKS.map((tick) => (
        <text
          className="fill-hub-label type-label"
          key={tick}
          textAnchor={labelAnchor(tick, HABIT_FRAME)}
          x={xOfDay(tick, HABIT_FRAME)}
          y={BASE + 20}
        >
          {tick}
        </text>
      ))}
      <line
        className="stroke-hub-text"
        strokeWidth={1.5}
        x1={markerX}
        x2={markerX}
        y1={markerY}
        y2={BASE}
      />
      <circle
        className="fill-hub-surface stroke-hub-text"
        cx={markerX}
        cy={markerY}
        r={6}
        strokeWidth={3}
      />
    </svg>
  );
}

export function HabitTab() {
  const today = useToday();
  const startDate = useHub((state) => state.startDate);
  const day = missionClock(today, startDate).dayClamped;
  const id = useId();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card aria-labelledby={`${id}-title`} className="lg:col-span-5">
        <CardTitle id={`${id}-title`}>Habit curve</CardTitle>
        <div className="mt-3">
          <Statement
            source="Lally and others, 2010, University College London."
            text="The first repetitions give the largest increase. In the study, the median time was 66 days. The range was 18 to 254 days. One missed day did not stop the process."
          />
        </div>
        <Notice className="mt-4" kind="CAUTION">
          Do not miss two days in a row.
        </Notice>
      </Card>
      <Card aria-labelledby={`${id}-curve`} className="lg:col-span-7">
        <CardTitle id={`${id}-curve`}>Day 0 to day 90</CardTitle>
        <div className="mt-3">
          <HabitCurve day={day} />
        </div>
        <p className="mt-2 flex items-center gap-2 type-label text-hub-text">
          <span
            aria-hidden="true"
            className="inline-block size-3 shrink-0 rounded-full border-2 border-hub-text bg-hub-surface"
          />
          The marker shows mission day {day}.
        </p>
        <SchematicLabel />
      </Card>
    </div>
  );
}
