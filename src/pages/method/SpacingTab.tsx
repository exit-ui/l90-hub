import { useId } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import {
  areaPath,
  baselineY,
  linePath,
  REVIEW_DAYS,
  SPACING_FRAME,
  spacingCurve,
  xOfDay,
} from '@/lib/methodCurves';
import { SchematicLabel, Statement } from './Statement';

const CURVE = spacingCurve();
const LINE = linePath(CURVE, SPACING_FRAME);
const AREA = areaPath(CURVE, SPACING_FRAME);
const BASE = baselineY(SPACING_FRAME);
const REVIEW_LIST = REVIEW_DAYS.join(', ');

function ForgettingCurve() {
  return (
    <svg
      aria-label={`Schematic forgetting curve with reviews on days ${REVIEW_LIST}. The memory drops after the first learning. Each review lifts the memory back up. After each review, the memory drops more slowly.`}
      className="h-auto w-full"
      role="img"
      viewBox={`0 0 ${SPACING_FRAME.width} ${SPACING_FRAME.height}`}
    >
      <path d={AREA} fill="url(#hub-grad-secondary)" fillOpacity={0.3} />
      {REVIEW_DAYS.map((day) => (
        <line
          className="stroke-hub-hairline"
          key={day}
          strokeDasharray="4 4"
          strokeWidth={1.5}
          x1={xOfDay(day, SPACING_FRAME)}
          x2={xOfDay(day, SPACING_FRAME)}
          y1={SPACING_FRAME.top}
          y2={BASE}
        />
      ))}
      <path
        className="stroke-hub-accent-text"
        d={LINE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
      <line
        className="stroke-hub-hairline"
        strokeWidth={1.5}
        x1={SPACING_FRAME.left}
        x2={SPACING_FRAME.width - SPACING_FRAME.right}
        y1={BASE}
        y2={BASE}
      />
      {REVIEW_DAYS.map((day) => (
        <g key={day}>
          <circle
            className="fill-hub-success stroke-hub-surface"
            cx={xOfDay(day, SPACING_FRAME)}
            cy={BASE}
            r={5}
            strokeWidth={2}
          />
          <text
            className="fill-hub-text type-label font-semibold"
            textAnchor="middle"
            x={xOfDay(day, SPACING_FRAME)}
            y={BASE + 22}
          >
            {day}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function SpacingTab() {
  const id = useId();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card aria-labelledby={`${id}-title`} className="lg:col-span-5">
        <CardTitle id={`${id}-title`}>Spacing</CardTitle>
        <div className="mt-3">
          <Statement
            source="Roediger and Karpicke, 2006. Cepeda and others, 2006."
            text="A test from memory makes the memory stronger than a second reading does. Reviews with longer intervals keep the memory longer."
          />
        </div>
      </Card>
      <Card aria-labelledby={`${id}-curve`} className="lg:col-span-7">
        <CardTitle id={`${id}-curve`}>Memory and reviews</CardTitle>
        <div className="mt-3">
          <ForgettingCurve />
        </div>
        <p className="mt-2 flex items-center gap-2 type-label text-hub-text">
          <span
            aria-hidden="true"
            className="inline-block size-3 shrink-0 rounded-full bg-hub-success"
          />
          Review days: {REVIEW_LIST}.
        </p>
        <SchematicLabel />
      </Card>
    </div>
  );
}
