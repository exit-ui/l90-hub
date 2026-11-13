import { CircleCheck, ClipboardCopy, OctagonAlert, Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { Field, FieldTextarea, TextAreaField } from '@/components/shared/Field';
import { Notice } from '@/components/shared/Notice';
import { PressButton } from '@/components/shared/PressButton';
import { SamplePreviewButtons } from '@/components/shared/SamplePreview';
import { dataOnly } from '@/lib/setupBackup';
import { parseBackup, serializeBackup } from '@/lib/storage';
import { useHub, useHubActions } from '@/store/useHub';

function Success({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2 type-body font-medium text-hub-positive" role="status">
      <CircleCheck aria-hidden="true" className="mt-1 size-5 shrink-0" />
      <span className="min-w-0 text-hub-text">{children}</span>
    </p>
  );
}

function Failure({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2 type-body font-medium text-hub-danger" role="alert">
      <OctagonAlert aria-hidden="true" className="mt-1 size-5 shrink-0" />
      <span className="min-w-0 break-words">Error: {children}</span>
    </p>
  );
}

type CopyStatus = { kind: 'idle' } | { kind: 'copied' } | { kind: 'failed'; record: string };

function CopyCard({ className }: { className?: string }) {
  const [status, setStatus] = useState<CopyStatus>({ kind: 'idle' });
  const id = useId();

  const copy = async () => {
    const record = serializeBackup(dataOnly(useHub.getState()));
    try {
      await navigator.clipboard.writeText(record);
      setStatus({ kind: 'copied' });
    } catch {
      setStatus({ kind: 'failed', record });
    }
  };

  return (
    <Card aria-labelledby={`${id}-title`} className={className}>
      <CardTitle id={`${id}-title`}>Copy</CardTitle>
      <p className="mt-3 type-body text-hub-label">
        The record holds all the data of the hub. Keep a copy in a safe place.
      </p>
      <PressButton className="mt-4" onClick={() => void copy()} tone="primary">
        <ClipboardCopy aria-hidden="true" className="size-4" />
        Copy the record
      </PressButton>
      <div className="mt-4 grid gap-4 empty:hidden">
        {status.kind === 'copied' ? <Success>The record is in the clipboard.</Success> : null}
        {status.kind === 'failed' ? (
          <>
            <Failure>
              The browser did not allow the copy. Select the text below and copy it.
            </Failure>
            <Field htmlFor={`${id}-record`} label="Record">
              <FieldTextarea
                className="h-56 font-mono"
                id={`${id}-record`}
                onFocus={(event) => event.target.select()}
                readOnly
                value={status.record}
              />
            </Field>
          </>
        ) : null}
      </div>
    </Card>
  );
}

type LoadStatus = { kind: 'idle' } | { kind: 'loaded' } | { kind: 'failed'; error: string };

function LoadCard({ className }: { className?: string }) {
  const { replaceState } = useHubActions();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<LoadStatus>({ kind: 'idle' });
  const id = useId();

  const load = () => {
    const result = parseBackup(text);
    if (!result.ok) {
      setStatus({ kind: 'failed', error: result.error });
      return;
    }
    replaceState(result.state);
    setText('');
    setStatus({ kind: 'loaded' });
  };

  return (
    <Card aria-labelledby={`${id}-title`} className={className}>
      <CardTitle id={`${id}-title`}>Load</CardTitle>
      <p className="type-body mt-2 text-hub-label">
        The app on the home screen keeps its own data. Load a backup to move data from Safari.
      </p>
      <Notice className="mt-3" kind="CAUTION">
        The load replaces all the data in this browser. Copy the current record first.
      </Notice>
      <TextAreaField
        className="h-40 font-mono text-base md:text-base"
        fieldClassName="mt-4"
        label="Record to load"
        onChange={(next) => {
          setText(next);
          setStatus({ kind: 'idle' });
        }}
        spellCheck={false}
        value={text}
      />
      <PressButton className="mt-4" onClick={load} tone="secondary">
        <Upload aria-hidden="true" className="size-4" />
        Load the record
      </PressButton>
      <div className="mt-4 empty:hidden">
        {status.kind === 'loaded' ? <Success>The record is loaded.</Success> : null}
        {status.kind === 'failed' ? <Failure>{status.error}</Failure> : null}
      </div>
    </Card>
  );
}

/** Copies the record to the clipboard and loads a record from text. */
export function BackupTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <CopyCard className="lg:col-span-5 lg:self-start" />
      <LoadCard className="lg:col-span-7" />
      <Card aria-labelledby="preview-title" className="lg:col-span-5">
        <CardTitle id="preview-title">Preview with sample data</CardTitle>
        <div className="mt-4">
          <SamplePreviewButtons />
        </div>
      </Card>
    </div>
  );
}
