import { ArrowRight, Bell, Play } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle, RemoveButton } from '@/components/shared/Controls';
import { TextField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import { useHub, useHubActions } from '@/store/useHub';
import { Statement } from './Statement';

function CueActionDiagram() {
  return (
    <div
      aria-label="Diagram. A cue leads to an action."
      className="mt-4 flex items-center justify-center gap-3 rounded-control bg-hub-raised/60 p-4"
      role="img"
    >
      <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-hub-hairline bg-hub-surface px-4 type-body font-semibold text-hub-text">
        <Bell aria-hidden="true" className="size-4 text-hub-accent-text" />
        Cue
      </span>
      <ArrowRight aria-hidden="true" className="size-6 shrink-0 text-hub-label" />
      <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-grad-secondary px-4 type-body font-semibold text-hub-text">
        <Play aria-hidden="true" className="size-4" />
        Action
      </span>
    </div>
  );
}

function PlanBuilder({ className }: { className?: string }) {
  const { addPlan } = useHubActions();
  const id = useId();
  const [cue, setCue] = useState('');
  const [action, setAction] = useState('');
  const [error, setError] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const plan = { cue: cue.trim(), action: action.trim() };
    if (plan.cue === '' || plan.action === '') {
      setError(true);
      return;
    }
    addPlan(plan);
    setCue('');
    setAction('');
    setError(false);
  };

  return (
    <Card aria-labelledby={`${id}-title`} className={className}>
      <CardTitle id={`${id}-title`}>New plan</CardTitle>
      <form className="mt-4 grid gap-4" noValidate onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField label="If (the cue)" onChange={setCue} placeholder="I stand at the bus stop" value={cue} />
          <TextField label="Then (the action)" onChange={setAction} placeholder="I send the drafted DMs." value={action} />
        </div>
        {error ? (
          <p className="type-label font-medium text-hub-danger" role="alert">
            Error: The plan is not complete. Write the cue and the action.
          </p>
        ) : null}
        <PressButton className="justify-self-end" tone="secondary" type="submit">
          Add the plan
        </PressButton>
      </form>
    </Card>
  );
}

function PlanList({ className }: { className?: string }) {
  const plans = useHub((state) => state.plans);
  const { removePlan } = useHubActions();
  const id = useId();
  return (
    <Card aria-labelledby={`${id}-title`} className={className}>
      <CardTitle id={`${id}-title`}>Your plans</CardTitle>
      {plans.length === 0 ? (
        <p className="py-4 type-body text-hub-label">
          There are no plans. Add the first plan in the form.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-hub-hairline">
          {plans.map((plan, index) => {
            const sentence = `If ${plan.cue}, then ${plan.action}`;
            return (
              <li
                className="flex min-w-0 items-center justify-between gap-3 py-2"
                key={`${index}-${sentence}`}
              >
                <p className="min-w-0 type-body break-words text-hub-text">{sentence}</p>
                <RemoveButton
                  label={`Remove the plan: ${sentence}`}
                  onClick={() => removePlan(index)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function PlansTab() {
  const id = useId();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card aria-labelledby={`${id}-title`} className="lg:col-span-5">
        <CardTitle id={`${id}-title`}>If-then plans</CardTitle>
        <div className="mt-3">
          <Statement
            source="Gollwitzer and Sheeran, 2006. 94 tests gave an average effect of d = 0.65. A 2024 analysis of 642 tests gave smaller corrected estimates. The method helps. The method is not a guarantee."
            text="An if-then plan connects a cue to an action. You decide one time. Then the cue starts the action."
          />
        </div>
        <CueActionDiagram />
      </Card>
      <PlanBuilder className="lg:col-span-7" />
      <PlanList className="lg:col-span-12" />
    </div>
  );
}
