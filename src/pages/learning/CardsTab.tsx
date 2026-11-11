import { Check, Eye, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type FormEvent, useMemo, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle, RemoveButton, TableShell } from '@/components/shared/Controls';
import { TextAreaField, TextField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToday } from '@/hooks/useToday';
import { formatMedium } from '@/lib/dates';
import { reviewQueue } from '@/lib/learningView';
import { FADE } from '@/lib/motion';
import { useHub, useHubActions } from '@/store/useHub';

function ReviewCard() {
  const today = useToday();
  const cards = useHub((state) => state.cards);
  const { answerCard } = useHubActions();
  const [answerShown, setAnswerShown] = useState(false);
  const queue = useMemo(() => reviewQueue(cards, today), [cards, today]);
  const { card, index } = queue;

  const answer = (correct: boolean) => {
    if (index === undefined) {
      return;
    }
    setAnswerShown(false);
    answerCard(index, correct, today);
  };

  return (
    <Card aria-labelledby="review-title" className="lg:col-span-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle id="review-title">Review</CardTitle>
        <p aria-live="polite" className="type-label text-hub-label">
          {queue.due === 1 ? '1 card is due.' : `${queue.due} cards are due.`}
        </p>
      </div>
      <AnimatePresence initial={false} mode="wait">
        {card && index !== undefined ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid gap-4"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: 8 }}
            key={`${index}-${card.due}-${card.q}`}
            transition={FADE}
          >
            <div className="rounded-control border border-hub-hairline bg-hub-raised p-4">
              <p className="type-label text-hub-label">Question · Box {card.box}</p>
              <p className="mt-2 type-section break-words whitespace-pre-wrap text-hub-text">
                {card.q}
              </p>
              {answerShown ? (
                <>
                  <p className="type-label text-hub-label mt-4">Answer</p>
                  <p className="mt-2 type-body break-words whitespace-pre-wrap text-hub-text">
                    {card.a}
                  </p>
                </>
              ) : null}
            </div>
            {answerShown ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <PressButton
                  className="whitespace-normal"
                  onClick={() => answer(true)}
                  tone="secondary"
                >
                  <Check aria-hidden="true" className="size-4 shrink-0" />I knew the answer
                </PressButton>
                <PressButton className="whitespace-normal" onClick={() => answer(false)} tone="soft">
                  <X aria-hidden="true" className="size-4 shrink-0" />I did not know the answer
                </PressButton>
              </div>
            ) : (
              <PressButton
                className="sm:justify-self-start"
                onClick={() => setAnswerShown(true)}
                tone="secondary"
              >
                <Eye aria-hidden="true" className="size-4" />
                Show the answer
              </PressButton>
            )}
          </motion.div>
        ) : (
          <motion.p
            animate={{ opacity: 1 }}
            className="mt-4 type-body text-hub-label"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="empty"
            transition={FADE}
          >
            No cards are due today.
          </motion.p>
        )}
      </AnimatePresence>
    </Card>
  );
}

function AddCardForm() {
  const today = useToday();
  const { addCard } = useHubActions();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (question.trim() === '' || answer.trim() === '') {
      setError('The question or the answer is empty. Enter the question and the answer.');
      return;
    }
    setError('');
    addCard(question, answer, today);
    setQuestion('');
    setAnswer('');
  };

  return (
    <Card aria-labelledby="add-card-title" className="lg:col-span-5">
      <CardTitle id="add-card-title">Add a card</CardTitle>
      <form className="mt-4 grid gap-4" onSubmit={submit}>
        <TextField error={error} label="Question" onChange={setQuestion} value={question} />
        <TextAreaField label="Answer" onChange={setAnswer} value={answer} />
        <PressButton className="sm:justify-self-start" tone="soft" type="submit">
          <Plus aria-hidden="true" className="size-4" />
          Add the card
        </PressButton>
      </form>
    </Card>
  );
}

function CardList() {
  const cards = useHub((state) => state.cards);
  const { removeCard } = useHubActions();

  return (
    <Card aria-labelledby="card-list-title" className="lg:col-span-12">
      <CardTitle id="card-list-title">All cards</CardTitle>
      <TableShell
        className="mt-4"
        empty="There are no cards. Add the first card with the form."
        isEmpty={cards.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead className="text-right">Box</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>
                <span className="sr-only">Remove</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.map((card, index) => (
              <TableRow key={`${index}-${card.q}`}>
                <TableCell className="max-w-72 min-w-40 whitespace-normal break-words">
                  {card.q}
                </TableCell>
                <TableCell className="text-right">{card.box}</TableCell>
                <TableCell className="whitespace-nowrap">{formatMedium(card.due)}</TableCell>
                <TableCell className="text-right">
                  <RemoveButton
                    label={`Remove the card "${card.q}"`}
                    onClick={() => removeCard(index)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </Card>
  );
}

/** Leitner flashcards: review the due cards, add a card, and see all cards. */
export function CardsTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ReviewCard />
      <AddCardForm />
      <CardList />
    </div>
  );
}
