import { ImagePlus, Trash2 } from 'lucide-react';
import { type ChangeEvent, useId, useRef, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { PressButton } from '@/components/shared/PressButton';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { scrimAlpha } from '@/lib/backdrop';
import { useAppearance } from '@/store/useAppearance';

/** One sample module on the chosen backdrop, so the user sees the contrast before they leave. */
function Preview() {
  const photoUrl = useAppearance((state) => state.photoUrl);
  const cityUrl = useAppearance((state) => state.cityUrl);
  const luminance = useAppearance((state) => state.photoLuminance);
  const url = photoUrl ?? cityUrl;
  return (
    <div
      aria-label={photoUrl ? 'Preview of your photo with one module on it' : 'Preview of the Night city with one module on it'}
      className="relative isolate h-64 overflow-hidden rounded-card bg-hub-bg-from"
      role="img"
    >
      {url ? (
        <div
          className={photoUrl ? 'photo-filter absolute -inset-4 bg-cover bg-center' : 'absolute inset-0 bg-cover bg-bottom'}
          style={{ backgroundImage: `url("${url}")` }}
        />
      ) : null}
      {photoUrl ? <div className="absolute inset-0 bg-hub-shade" style={{ opacity: scrimAlpha(luminance) }} /> : null}
      <div aria-hidden="true" className="surface-card absolute inset-x-4 bottom-4 p-4">
        <div className="flex items-center justify-between">
          <span className="type-body font-semibold text-hub-text">Outreach</span>
          <span className="type-label text-hub-label">1 of 2</span>
        </div>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="type-number num text-hub-text">12</span>
          <span className="type-body text-hub-label">/ 20</span>
        </p>
        <ProgressBar className="mt-4" fraction={0.6} label="12 of 20 DMs" tone="primary" />
      </div>
    </div>
  );
}

/** The look of the hub on this device: the background photo. */
export function AppearanceTab() {
  const photoUrl = useAppearance((state) => state.photoUrl);
  const choosePhoto = useAppearance((state) => state.choosePhoto);
  const clearPhoto = useAppearance((state) => state.clearPhoto);
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const error = await choosePhoto(file);
    setBusy(false);
    setMessage(error ?? 'The photo is stored on this device.');
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card aria-labelledby="photo-title" className="lg:col-span-8 lg:col-start-3">
        <CardTitle id="photo-title">Choose a background photo</CardTitle>
        <p className="mt-2 type-body text-hub-label">
          The photo stays on this device. The hub does not send it anywhere. The hub makes it darker and softer, so
          the text stays easy to read.
        </p>
        <div className="mt-6">
          <Preview />
        </div>
        <input
          accept="image/*"
          className="sr-only"
          id={inputId}
          onChange={(event) => void onFile(event)}
          ref={input}
          tabIndex={-1}
          type="file"
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <PressButton disabled={busy} onClick={() => input.current?.click()} tone="secondary">
            <ImagePlus aria-hidden="true" className="size-4" />
            {busy ? 'Preparing the photo' : 'Choose a photo'}
          </PressButton>
          {photoUrl ? (
            <PressButton
              onClick={() => {
                void clearPhoto();
                setMessage('The Night city is back.');
              }}
              tone="soft"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Remove the photo
            </PressButton>
          ) : null}
        </div>
        <p aria-live="polite" className="mt-4 min-h-5 type-body text-hub-label-strong">
          {message}
        </p>
      </Card>
    </div>
  );
}
