import { useMemo, useState } from 'react';
import { HubFunnel } from '@/components/charts/hub/HubFunnel';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { TextField } from '@/components/shared/Field';
import { formatInteger, formatRate, parseWhole } from '@/lib/format';
import { funnelRates, funnelStages, RATE_LABELS } from '@/lib/funnel';
import { fieldText } from '@/lib/outreachView';
import type { FunnelKey } from '@/store/types';
import { useHub, useHubActions } from '@/store/useHub';

interface StageFieldProps {
  stage: FunnelKey;
  label: string;
  value: number;
}

/** One number field. The raw text stays in the field while the user types. */
function StageField({ stage, label, value }: StageFieldProps) {
  const { setFunnel } = useHubActions();
  const [draft, setDraft] = useState(String(value));

  return (
    <TextField
      inputMode="numeric"
      label={label}
      min={0}
      onChange={(text) => {
        setDraft(text);
        setFunnel(stage, parseWhole(text));
      }}
      step={1}
      type="number"
      value={fieldText(draft, value)}
    />
  );
}

/** The funnel numbers, the funnel chart, the 6 rates and the fix for the week. */
export function FunnelTab() {
  const funnel = useHub((state) => state.funnel);
  const days = useHub((state) => state.days);
  const baseContacted = useHub((state) => state.baseContacted);
  const weekFix = useHub((state) => state.weekFix);
  const { setWeekFix } = useHubActions();

  const stages = useMemo(
    () => funnelStages({ funnel, days, baseContacted }),
    [funnel, days, baseContacted],
  );
  const rates = useMemo(
    () => funnelRates({ funnel, days, baseContacted }),
    [funnel, days, baseContacted],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card aria-labelledby="funnel-inputs-title" className="lg:col-span-7">
        <CardTitle id="funnel-inputs-title">Funnel numbers</CardTitle>
        <p className="mt-1 type-label text-hub-label">Enter the total for each stage.</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stages.map((stage) =>
            stage.key === 'contacted' ? (
              <TextField
                className="text-hub-label"
                hint="The hub calculates this value."
                key={stage.key}
                label={stage.label}
                readOnly
                value={formatInteger(stage.value)}
              />
            ) : (
              <StageField key={stage.key} label={stage.label} stage={stage.key} value={stage.value} />
            ),
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:col-span-5 lg:self-start">
        <Card aria-labelledby="funnel-rates-title">
          <CardTitle id="funnel-rates-title">Rates</CardTitle>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
            {RATE_LABELS.map(({ key, label }) => (
              <div className="min-w-0" key={key}>
                <dt className="type-label break-words text-hub-label">{label}</dt>
                <dd className="type-number num mt-1 text-hub-text">{formatRate(rates[key])}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 type-label text-hub-label">
            A dash shows that the hub cannot calculate the rate.
          </p>
        </Card>

        <Card aria-labelledby="week-fix-title">
          <CardTitle id="week-fix-title">Fix for the week</CardTitle>
          <TextField
            fieldClassName="mt-3"
            hint="Write one change that you make this week."
            label="The one fix this week"
            onChange={setWeekFix}
            value={weekFix}
          />
        </Card>
      </div>

      <Card aria-labelledby="funnel-chart-title" className="lg:col-span-12">
        <CardTitle id="funnel-chart-title">Funnel</CardTitle>
        <HubFunnel
          className="mt-4"
          label={`The outreach funnel in ${stages.length} stages, from sourced to closed`}
          stages={stages}
        />
      </Card>
    </div>
  );
}
