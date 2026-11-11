import { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { TextAreaField } from '@/components/shared/Field';
import { templateLines, templateText, WEEKDAY_ROWS } from '@/lib/calendarGrid';
import { PILLAR_LABELS, pillarOfTask } from '@/lib/pillars';
import type { Weekday } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';

interface WeekdayFieldProps {
  weekday: Weekday;
  label: string;
}

/** The tasks of one weekday, and the pillar that the hub finds for each line. */
function WeekdayField({ weekday, label }: WeekdayFieldProps) {
  const stored = useHub((state) => state.weekTemplate[weekday]);
  const { setWeekTemplate } = useHubActions();
  const [text, setText] = useState(() => templateText(stored));

  return (
    <div className="surface-inset grid content-start gap-3 p-4">
      <TextAreaField
        hint={`Tasks: ${stored?.length ?? 0}`}
        label={label}
        onChange={(next) => {
          setText(next);
          setWeekTemplate(weekday, templateLines(next));
        }}
        rows={5}
        value={text}
      />
      {stored && stored.length > 0 ? (
        <ul aria-label={`Pillars for ${label}`} className="grid gap-2">
          {stored.map((task, index) => (
            <li className="flex items-start justify-between gap-3 type-label" key={`${index}-${task}`}>
              <span className="min-w-0 text-hub-label-strong">{task}</span>
              <span className="shrink-0 rounded-full bg-hub-track px-2 py-1 font-semibold text-hub-text">
                {PILLAR_LABELS[pillarOfTask(task)]}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** One text area for each weekday, Monday first. A change applies to all weeks. */
export function WeekTab() {
  return (
    <Card aria-labelledby="template-title">
      <CardTitle id="template-title">Tasks for each weekday</CardTitle>
      <p className="mt-2 type-body text-hub-label">
        Write one task on each line. The hub saves each change, and the change applies to all weeks.
        Start a line with a time, for example 06:20, to make it the cue of the task.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {WEEKDAY_ROWS.map((row) => (
          <WeekdayField key={row.weekday} label={row.label} weekday={row.weekday} />
        ))}
      </div>
    </Card>
  );
}
