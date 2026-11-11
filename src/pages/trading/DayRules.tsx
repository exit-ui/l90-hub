import { Check, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { TextField } from '@/components/shared/Field';
import { PressButton } from '@/components/shared/PressButton';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { useToday } from '@/hooks/useToday';
import { formatMedium } from '@/lib/dates';
import { newestFirst } from '@/lib/sessions';
import { setupProgress } from '@/lib/trading';
import { cn } from '@/lib/utils';
import { DAY_TRADING_RULES } from '@/store/defaults';
import type { SetupResult } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';
import { RuleList } from './RuleList';
import { useNumberText } from './useNumberText';

const RESULT_LOOK = {
  taken: { icon: Check, tone: 'text-hub-positive', name: 'Taken' },
  missed: { icon: EyeOff, tone: 'text-hub-amber', name: 'Missed' },
} as const satisfies Record<SetupResult, unknown>;

function RiskCard({ className }: { className?: string }) {
  const riskPercent = useHub((state) => state.riskPercent);
  const { setRiskPercent } = useHubActions();
  const risk = useNumberText(riskPercent, setRiskPercent);
  return (
    <Card className={className}>
      <CardTitle>Risk for each trade</CardTitle>
      <TextField
        fieldClassName="mt-4 max-w-56"
        hint="This risk is 1R. Do not increase the risk after a loss."
        inputMode="decimal"
        label="Risk as a percentage"
        min={0}
        onBlur={risk.onBlur}
        onChange={risk.onChange}
        step={0.1}
        type="number"
        value={risk.text}
      />
    </Card>
  );
}

function SetupLog({ className }: { className?: string }) {
  const today = useToday();
  const setups = useHub((state) => state.setups);
  const { addSetup } = useHubActions();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const progress = setupProgress(setups);
  const rows = useMemo(() => newestFirst(setups), [setups]);

  const log = (result: SetupResult) => {
    const clean = text.trim();
    if (clean === '') {
      setError('The setup text is empty. Describe the setup in a few words.');
      return;
    }
    setError('');
    addSetup({ date: today, text: clean, result });
    setText('');
  };

  return (
    <Card className={className}>
      <CardTitle>Setup log</CardTitle>
      <div className="mt-4 grid gap-2">
        <p className="type-body text-hub-text">
          {progress.count} of {progress.goal} setups
        </p>
        <ProgressBar
          fraction={progress.fraction}
          label={`${progress.count} of ${progress.goal} setups logged`}
          tone="data"
        />
        <p className="type-label text-hub-label">
          Do not change a rule before you log {progress.goal} setups.
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <TextField
          error={error}
          label="Describe the setup"
          onChange={setText}
          placeholder="EURUSD 4h close above the range"
          value={text}
        />
        <div className="flex flex-wrap gap-3">
          <PressButton onClick={() => log('taken')} tone="secondary">
            <Check aria-hidden="true" className="size-4" />
            Taken
          </PressButton>
          <PressButton onClick={() => log('missed')} tone="soft">
            <EyeOff aria-hidden="true" className="size-4" />
            Missed
          </PressButton>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 type-body text-hub-label">
          There are no setups. Log the first setup with the text field.
        </p>
      ) : (
        <ul className="mt-4 grid">
          {rows.map(({ item: setup, index }) => {
            const { icon: Icon, tone, name } = RESULT_LOOK[setup.result];
            return (
              <li
                className="flex min-w-0 items-start justify-between gap-3 border-t border-hub-hairline py-3"
                key={`${index}-${setup.date}`}
              >
                <div className="min-w-0">
                  <p className="type-body break-words text-hub-text">{setup.text}</p>
                  <p className="mt-1 type-label text-hub-label">{formatMedium(setup.date)}</p>
                </div>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 type-label font-semibold',
                    tone,
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {name}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** The rule list, the risk for each trade and the setup log. */
export function DayRules() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="grid content-start gap-4 lg:col-span-5">
        <RuleList rules={DAY_TRADING_RULES} title="The day trading rules" />
        <RiskCard />
      </div>
      <SetupLog className="lg:col-span-7" />
    </div>
  );
}
