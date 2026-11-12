import { PILLAR_ICONS } from '@/components/shared/pillarIcons';
import { type CardTone, type PillarCard, type PillarCardId, sparkPath } from '@/lib/pillarCards';
import { routeHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

const HREFS: Readonly<Record<PillarCardId, string>> = {
  fitness: routeHref('fitness'),
  learning: routeHref('learning'),
  reading: routeHref('learning', 'reading'),
  trading: routeHref('trading'),
};

/** The calm line of a pillar with no data yet. No zero, no blame. */
const EMPTY_TEXT: Readonly<Record<PillarCardId, string>> = {
  fitness: 'No sessions yet',
  learning: 'No sessions yet',
  reading: 'No chapters yet',
  trading: 'No trades yet',
};

const TONES: Readonly<Record<CardTone, { line: string; fill: string }>> = {
  success: { line: 'stroke-hub-success', fill: 'fill-hub-success-soft' },
  accent: { line: 'stroke-hub-accent', fill: 'fill-hub-accent-soft' },
  negative: { line: 'stroke-hub-negative', fill: 'fill-hub-negative-soft' },
};

const SPARK_WIDTH = 156;
const SPARK_HEIGHT = 44;

function changeClass(card: PillarCard): string {
  if (card.change?.trend === 'up') {
    return 'text-hub-positive';
  }
  if (card.change?.trend === 'down' && card.id === 'trading') {
    return 'text-hub-negative-text';
  }
  return 'text-hub-label';
}

/** One pillar card: the name, a round icon chip, the metric, the change line and a soft area sparkline. */
function PillarCardLink({ card }: { card: PillarCard }) {
  const Icon = PILLAR_ICONS[card.id];
  const tone = TONES[card.tone];
  const path = sparkPath(card.spark, SPARK_WIDTH, SPARK_HEIGHT);
  return (
    <a
      aria-label={`${card.label} ${card.change?.text ?? ''} Open the ${card.name} page.`.replace(/\s+/g, ' ')}
      className="surface-card press relative flex size-40 shrink-0 snap-start flex-col overflow-hidden p-4 lg:w-full text-hub-text no-underline"
      href={HREFS[card.id]}
    >
      <span aria-hidden="true" className="flex items-start justify-between gap-2">
        <span className="type-label font-semibold text-hub-text">{card.name}</span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hub-chip">
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
      </span>
      {card.empty ? (
        <span aria-hidden="true" className="type-label mt-2 text-hub-label">
          {EMPTY_TEXT[card.id]}
        </span>
      ) : (
        <span aria-hidden="true" className="mt-1 flex flex-col">
          <span className="type-metric num whitespace-nowrap">
            {card.value}
            <span className="text-hub-faint">{card.tail}</span>
          </span>
          {card.change ? <span className={cn('type-caption num', changeClass(card))}>{card.change.text}</span> : null}
        </span>
      )}
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-11 w-full"
        preserveAspectRatio="none"
        viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      >
        {path.line ? (
          <>
            <path className={tone.fill} d={path.area} />
            <path className={tone.line} d={path.line} fill="none" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
          </>
        ) : (
          <line
            className="stroke-hub-track"
            strokeDasharray="4 4"
            strokeWidth={1.6}
            vectorEffect="non-scaling-stroke"
            x1={0}
            x2={SPARK_WIDTH}
            y1={SPARK_HEIGHT - 8}
            y2={SPARK_HEIGHT - 8}
          />
        )}
      </svg>
    </a>
  );
}

/** "My pillars": the four pillar cards in a row that scrolls sideways inside the page. */
export function PillarCards({ cards }: { cards: readonly PillarCard[] }) {
  return (
    <section aria-labelledby="pillars-title" className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="type-section text-hub-text" id="pillars-title">
          My pillars
        </h2>
        <a
          className="tap inline-flex items-center rounded-full px-2 type-label text-hub-label no-underline hover:text-hub-text"
          href={routeHref('progress')}
        >
          View details ›
        </a>
      </div>
      <ul className="scroll-row -mx-4 mt-1 flex snap-x gap-3 px-4 pt-1 pb-2 md:-mx-6 md:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0">
        {cards.map((card) => (
          <li className="shrink-0 lg:min-w-0" key={card.id}>
            <PillarCardLink card={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}
