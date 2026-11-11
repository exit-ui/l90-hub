import type { Card, DateKey, LeitnerBox } from '@/store/types';
import { addDays } from './dates';

/** Days until the next review, for each Leitner box. */
export const LEITNER_INTERVALS: Readonly<Record<LeitnerBox, number>> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
};

export function nextBox(box: LeitnerBox, correct: boolean): LeitnerBox {
  if (!correct) {
    return 1;
  }
  return Math.min(5, box + 1) as LeitnerBox;
}

/** A correct answer moves the card up one box. A wrong answer moves it to box 1. */
export function reviewCard(card: Card, correct: boolean, today: DateKey): Card {
  const box = nextBox(card.box, correct);
  return { ...card, box, due: addDays(today, LEITNER_INTERVALS[box]) };
}

export function isDue(card: Card, today: DateKey): boolean {
  return card.due <= today;
}

/** Positions of the cards that are due, lowest box first. */
export function dueCardIndexes(cards: readonly Card[], today: DateKey): number[] {
  return cards
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => isDue(card, today))
    .sort((a, b) => a.card.box - b.card.box || (a.card.due < b.card.due ? -1 : 1))
    .map(({ index }) => index);
}
