import { Eye } from 'lucide-react';
import { sampleHref, sampleKind, type SampleKind } from '@/store/sample';
import { PressButton } from './PressButton';

function open(kind: SampleKind) {
  window.location.assign(sampleHref(kind, window.location));
}

const KIND = sampleKind();

/** A strip at the top while sample data shows. Exit goes back to the user's own data. */
export function SampleBanner() {
  if (KIND === 'none') {
    return null;
  }
  return (
    <div
      className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 bg-hub-black px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-hub-on-black md:-mx-6 md:px-6 lg:-mx-8 lg:rounded-b-card lg:px-8"
      role="status"
    >
      <Eye aria-hidden="true" className="size-4 shrink-0" />
      <p className="type-label min-w-0 flex-1">
        {KIND === 'full' ? 'Sample data, all 90 days.' : 'Sample data, up to today.'} Your own data is safe.
      </p>
      <button
        className="tap min-h-11 cursor-pointer rounded-full px-3 type-label font-semibold underline underline-offset-4"
        onClick={() => open('none')}
        type="button"
      >
        Exit
      </button>
    </div>
  );
}

/** Buttons to preview the hub with sample data. Nothing is saved while it shows. */
export function SamplePreviewButtons() {
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <PressButton aria-pressed={KIND === 'today'} onClick={() => open('today')} tone={KIND === 'today' ? 'primary' : 'secondary'}>
          Up to today
        </PressButton>
        <PressButton aria-pressed={KIND === 'full'} onClick={() => open('full')} tone={KIND === 'full' ? 'primary' : 'secondary'}>
          Full 90 days
        </PressButton>
      </div>
      {KIND === 'none' ? (
        <p className="type-caption text-hub-label">Shows example data. Your own data stays as it is.</p>
      ) : (
        <PressButton onClick={() => open('none')} tone="secondary">
          Back to my data
        </PressButton>
      )}
    </div>
  );
}
