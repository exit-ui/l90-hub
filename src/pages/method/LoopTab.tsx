import { useId, useMemo } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { formatMedium } from '@/lib/dates';
import { dailyWins } from '@/lib/status';
import { cn } from '@/lib/utils';
import { useHub } from '@/store/useHub';
import { Statement } from './Statement';

interface LoopNode {
  label: string;
  x: number;
  y: number;
}

const NODE_WIDTH = 136;
const NODE_HEIGHT = 44;
const NODES: readonly LoopNode[] = [
  { label: 'Small progress', x: 180, y: 34 },
  { label: 'Motivation', x: 284, y: 176 },
  { label: 'Better work', x: 76, y: 176 },
];
/** Each arrow goes from one node to the next node in the loop. */
const ARROWS: readonly string[] = ['M226 62 L270 148', 'M210 176 L152 176', 'M90 148 L134 62'];

function LoopDiagram() {
  const markerId = useId();
  return (
    <svg
      aria-label="Loop diagram with 3 steps. Small progress gives motivation. Motivation gives better work. Better work gives more small progress."
      className="mx-auto h-auto w-full max-w-md"
      role="img"
      viewBox="0 0 360 210"
    >
      <defs>
        <marker
          id={markerId}
          markerHeight={8}
          markerWidth={8}
          orient="auto"
          refX={7}
          refY={4}
          viewBox="0 0 8 8"
        >
          <path className="fill-hub-label" d="M0 0 L8 4 L0 8 Z" />
        </marker>
      </defs>
      {ARROWS.map((arrow) => (
        <path
          className="stroke-hub-label"
          d={arrow}
          fill="none"
          key={arrow}
          markerEnd={`url(#${markerId})`}
          strokeLinecap="round"
          strokeWidth={2}
        />
      ))}
      {NODES.map((node, index) => {
        const first = index === 0;
        return (
          <g key={node.label}>
            <rect
              className={first ? undefined : 'fill-hub-raised stroke-hub-hairline'}
              fill={first ? 'url(#hub-grad-primary)' : undefined}
              height={NODE_HEIGHT}
              rx={NODE_HEIGHT / 2}
              width={NODE_WIDTH}
              x={node.x - NODE_WIDTH / 2}
              y={node.y - NODE_HEIGHT / 2}
            />
            <text
              className={cn('type-body font-semibold', first ? 'fill-hub-ink' : 'fill-hub-text')}
              dominantBaseline="central"
              textAnchor="middle"
              x={node.x}
              y={node.y}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function WinLog({ className }: { className?: string }) {
  const days = useHub((state) => state.days);
  const wins = useMemo(() => dailyWins(days), [days]);
  const id = useId();
  return (
    <Card aria-labelledby={`${id}-title`} className={className}>
      <CardTitle id={`${id}-title`}>Daily wins</CardTitle>
      {wins.length === 0 ? (
        <p className="py-4 type-body text-hub-label">
          There are no daily wins. Write one win in the task card today.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-hub-hairline">
          {wins.map((entry) => (
            <li
              className="grid min-w-0 gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4"
              key={entry.date}
            >
              <span className="type-label text-hub-label">{formatMedium(entry.date)}</span>
              <span className="min-w-0 type-body break-words whitespace-pre-wrap text-hub-text">
                {entry.win}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function LoopTab() {
  const id = useId();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card aria-labelledby={`${id}-title`} className="lg:col-span-5">
        <CardTitle id={`${id}-title`}>Progress loop</CardTitle>
        <div className="mt-3">
          <Statement
            source="Amabile and Kramer, Harvard Business School."
            tag="Harvard research"
            text="Amabile and Kramer read almost 12,000 diary entries from 238 workers. On the best days, the most frequent event was progress in meaningful work."
          />
        </div>
      </Card>
      <Card aria-labelledby={`${id}-loop`} className="lg:col-span-7">
        <CardTitle id={`${id}-loop`}>The loop</CardTitle>
        <div className="mt-3">
          <LoopDiagram />
        </div>
      </Card>
      <WinLog className="lg:col-span-12" />
    </div>
  );
}
