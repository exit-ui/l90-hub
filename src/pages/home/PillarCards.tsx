import { memo } from 'react';
import { PillarGlyph } from '@/components/shared/PillarGlyph';
import type { PillarCard } from '@/lib/pillarCards';
import { type ExpandId, routeHref } from '@/lib/routes';

/** The calm line of a pillar with no data yet. No zero, no blame. */
const EMPTY_TEXT: Readonly<Record<PillarCard['id'], string>> = {
  fitness: 'No sessions yet',
  learning: 'No sessions yet',
  reading: 'No chapters yet',
  trading: 'No trades yet',
};

/** The short word under the number. */
const UNIT_LINE: Readonly<Record<PillarCard['id'], string>> = {
  fitness: 'this week',
  learning: 'this week',
  reading: 'current book',
  trading: 'all trades',
};

/**
 * One pillar card (v3): the pillar gradient, the name, the playful icon, the big number and one short line.
 * A tap opens the pillar's view, which grows out of this card.
 */
function PillarCardButton({ card, onOpen, index }: { card: PillarCard; onOpen: (id: ExpandId) => void; index: number }) {
  return (
    <button
      aria-label={`${card.label} ${card.change?.text ?? ''} Open ${card.name}.`.replace(/\s+/g, ' ')}
      className={`pillar-card pillar-${card.id} press flex h-44 w-37 shrink-0 cursor-pointer snap-start flex-col justify-between p-4 text-left lg:w-full`}
      data-open-target={card.id}
      onClick={() => onOpen(card.id)}
      type="button"
    >
      <span aria-hidden="true" className="flex w-full items-start justify-between gap-2">
        <span className="type-label font-semibold text-white">{card.name}</span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
          <PillarGlyph delayMs={500 + index * 90} id={card.id} play={1} size={20} />
        </span>
      </span>
      <span aria-hidden="true" className="grid gap-0.5">
        {card.empty ? (
          <span className="type-label text-white">{EMPTY_TEXT[card.id]}</span>
        ) : (
          <>
            <span className="num whitespace-nowrap text-[30px] leading-9 font-bold tracking-tight text-white">
              {card.value}
              <span className="text-lg text-white/60">{card.tail}</span>
            </span>
            <span className="type-caption truncate text-white">{card.change?.text ?? UNIT_LINE[card.id]}</span>
          </>
        )}
      </span>
    </button>
  );
}

/** The four pillar cards, in a row that scrolls sideways inside the page. A grid of four from 1024 px. */
function PillarCardsBase({ cards, onOpen }: { cards: readonly PillarCard[]; onOpen: (id: ExpandId) => void }) {
  return (
    <section aria-labelledby="pillars-title" className="mb-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="type-section text-hub-text" id="pillars-title">
          Pillars
        </h2>
        <a className="tap inline-flex items-center rounded-full px-2 type-label text-hub-label no-underline hover:text-hub-text" href={routeHref('progress')}>
          See all ›
        </a>
      </div>
      <ul className="scroll-row -mx-4 flex snap-x gap-3 px-4 pt-1 pb-11 md:-mx-6 md:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0">
        {cards.map((card, index) => (
          <li className="shrink-0 lg:min-w-0" key={card.id}>
            <PillarCardButton card={card} index={index} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export const PillarCards = memo(PillarCardsBase);
