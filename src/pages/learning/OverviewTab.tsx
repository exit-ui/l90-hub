import { GraduationCap, Layers, ListChecks } from 'lucide-react';
import { useMemo } from 'react';
import { HubHeatmap } from '@/components/charts/hub/HubHeatmap';
import { ProgressRing } from '@/components/charts/hub/ProgressRing';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { StatCard } from '@/components/shared/StatCard';
import { useToday } from '@/hooks/useToday';
import { lessonSummary, reviewQueue } from '@/lib/learningView';
import { heatmapCells, sessionsInWeek } from '@/lib/sessions';
import { fractionOf } from '@/lib/summary';
import { useHub } from '@/store/useHub';

/** The week, the lessons, the due cards, the next lesson and the session heatmap. */
export function OverviewTab() {
  const today = useToday();
  const learning = useHub((state) => state.learning);
  const learnTarget = useHub((state) => state.learnTarget);
  const lessons = useHub((state) => state.lessons);
  const cards = useHub((state) => state.cards);

  const week = useMemo(() => sessionsInWeek(learning, today), [learning, today]);
  const lesson = useMemo(() => lessonSummary(lessons), [lessons]);
  const queue = useMemo(() => reviewQueue(cards, today), [cards, today]);
  const cells = useMemo(
    () => heatmapCells(learning.map((session) => session.date), today),
    [learning, today],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <StatCard
        chart={
          <ProgressRing
            label={`${week} of ${learnTarget} learning sessions this week`}
            max={learnTarget}
            size={72}
            strokeWidth={7}
            tone="secondary"
            value={week}
          >
            <span className="type-label font-semibold text-hub-text">
              {week}/{learnTarget}
            </span>
          </ProgressRing>
        }
        chartPlacement="side"
        className="lg:col-span-4"
        detail={`The target is ${learnTarget} for each week.`}
        icon={GraduationCap}
        label="Sessions this week"
        value={<RollingNumber value={week} />}
      />
      <StatCard
        chart={
          <ProgressBar
            fraction={fractionOf(lesson.done, lesson.total)}
            label={`${lesson.done} of ${lesson.total} lessons complete`}
            tone="data"
          />
        }
        className="lg:col-span-4"
        detail={`of ${lesson.total} lessons`}
        icon={ListChecks}
        label="Lessons complete"
        value={<RollingNumber value={lesson.done} />}
      />
      <StatCard
        chart={
          <ProgressBar
            fraction={fractionOf(queue.due, cards.length)}
            label={`${queue.due} of ${cards.length} cards are due today`}
            tone="data"
          />
        }
        className="lg:col-span-4"
        detail={`of ${cards.length} cards`}
        icon={Layers}
        label="Cards due"
        value={<RollingNumber value={queue.due} />}
      />

      <Card aria-labelledby="next-lesson-title" className="lg:col-span-5">
        <CardTitle id="next-lesson-title">Next lesson</CardTitle>
        {lesson.next ? (
          <p className="mt-3 type-section break-words text-hub-text">
            {lesson.next.text}
          </p>
        ) : (
          <p className="mt-3 type-body text-hub-label">
            {lesson.total === 0
              ? 'There are no lessons. Add a lesson in the Lessons tab.'
              : 'All lessons are complete.'}
          </p>
        )}
      </Card>

      <Card aria-labelledby="learning-heatmap-title" className="lg:col-span-7">
        <CardTitle id="learning-heatmap-title">Sessions in the last 13 weeks</CardTitle>
        <HubHeatmap
          cells={cells}
          className="mt-4"
          label="Learning sessions for each day of the last 13 weeks"
          tone="secondary"
        />
      </Card>
    </div>
  );
}
