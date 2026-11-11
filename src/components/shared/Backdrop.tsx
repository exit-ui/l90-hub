import { useEffect, useRef } from 'react';
import { scrimAlpha } from '@/lib/backdrop';
import { useAppearance } from '@/store/useAppearance';
import { paintCity } from './backdrop/paintCity';

/** The canvas is never larger than this on its long edge, and the pixel ratio stays low. */
const MAX_EDGE = 2560;
const MAX_RATIO = 1.5;
/** A taller view only paints again when the height grows by more than this fraction. */
const HEIGHT_STEP = 0.15;

interface ViewSize {
  width: number;
  height: number;
}

function viewSize(): ViewSize {
  return { width: window.innerWidth, height: Math.max(window.innerHeight, window.screen?.height ?? 0) };
}

/** Paints the Night city one time for each view size and keeps it as an image URL. */
function useCityImage(enabled: boolean): string | null {
  const url = useAppearance((state) => state.cityUrl);
  const setCityUrl = useAppearance((state) => state.setCityUrl);
  const painted = useRef<ViewSize | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    let timer = 0;
    const paint = () => {
      const size = viewSize();
      const last = painted.current;
      if (last && last.width === size.width && size.height <= last.height * (1 + HEIGHT_STEP)) {
        return;
      }
      painted.current = size;
      const ratio = Math.min(MAX_RATIO, window.devicePixelRatio || 1, MAX_EDGE / Math.max(size.width, size.height));
      const canvas = document.createElement('canvas');
      try {
        if (!paintCity(canvas, size.width, size.height, ratio)) {
          return;
        }
        canvas.toBlob((blob) => {
          if (!cancelled && blob) {
            setCityUrl(URL.createObjectURL(blob));
          }
        }, 'image/png');
      } catch {
        // A browser that cannot paint the canvas keeps the plain night gradient.
      }
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(paint, 180);
    };
    // The first paint waits for the page to show, so it never delays the first frame.
    timer = window.setTimeout(paint, 0);
    window.addEventListener('resize', schedule);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('resize', schedule);
    };
  }, [enabled, setCityUrl]);

  return url;
}

/**
 * The backdrop behind all content: the Night city, or the user's own photo with a dark overlay.
 * It is fixed, so it never moves or paints again on scroll.
 */
export function Backdrop() {
  const photoUrl = useAppearance((state) => state.photoUrl);
  const luminance = useAppearance((state) => state.photoLuminance);
  const load = useAppearance((state) => state.load);
  const cityUrl = useCityImage(true);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-lvh overflow-hidden bg-hub-bg-from">
      <div className="absolute inset-0 bg-linear-to-b from-hub-bg-from to-hub-bg-to" />
      {cityUrl && !photoUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-bottom transition-opacity duration-150"
          style={{ backgroundImage: `url("${cityUrl}")` }}
        />
      ) : null}
      {photoUrl ? (
        <>
          <div
            className="absolute -inset-4 photo-filter bg-cover bg-center"
            style={{ backgroundImage: `url("${photoUrl}")` }}
          />
          <div className="absolute inset-0 bg-hub-shade" style={{ opacity: scrimAlpha(luminance) }} />
        </>
      ) : null}
      <div className="grain-layer" />
      <div className="absolute inset-x-0 top-0 h-2/5 bg-linear-to-b from-hub-scrim-top to-transparent" />
    </div>
  );
}
