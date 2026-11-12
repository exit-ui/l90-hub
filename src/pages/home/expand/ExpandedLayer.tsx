import { X } from 'lucide-react';
import {
  animate,
  motion,
  type PanInfo,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useIsPresent,
  useTransform,
} from 'motion/react';
import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  CHROME_IN,
  CONTENT_OUT,
  DRAG_RETURN,
  EXPAND_OPEN,
  FADE,
  NO_MOTION,
  OVERLAY_FADE,
  SWIPE_CLOSE,
  VIEW_RADIUS,
} from '@/lib/motion';
import type { ExpandId } from '@/lib/routes';
import { cn } from '@/lib/utils';

/** "shared": the card flies into the view. "fade": a deep link, a reload, or a card out of view. */
export type ViewEntry = 'shared' | 'fade';

interface ExpandedLayerProps {
  id: ExpandId;
  entry: ViewEntry;
  /** The id of the expanded title. It names the dialog and gets the focus on open. */
  titleId: string;
  /** The shared title element. */
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** How many views hold the scroll lock. Two can overlap while one closes and the next opens. */
let locks = 0;
let savedTop = 0;

function lockScroll() {
  if (locks === 0) {
    savedTop = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  locks += 1;
}

function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    window.scrollTo({ top: savedTop, behavior: 'instant' });
  }
}

/**
 * Locks the page while the view is present. The lock ends when the close starts,
 * not when the exit animation ends, so the page is free at once.
 */
function useScrollLock(present: boolean) {
  const held = useRef(false);
  useEffect(() => {
    if (present && !held.current) {
      held.current = true;
      lockScroll();
    } else if (!present && held.current) {
      held.current = false;
      unlockScroll();
    }
  }, [present]);
  useEffect(
    () => () => {
      if (held.current) {
        held.current = false;
        unlockScroll();
      }
    },
    [],
  );
}

/**
 * The expanded view of a card: an overlay that dims and blurs the page, and a modal panel.
 * The panel shares its surface with the card (layoutId "card-<id>"). It closes with the Close button,
 * Escape, a tap on the overlay, a swipe down on a phone, and the browser Back button.
 */
export function ExpandedLayer({ id, entry, titleId, title, onClose, children }: ExpandedLayerProps) {
  const reduced = useReducedMotion();
  const phone = !useMediaQuery('(min-width: 768px)');
  const panel = useRef<HTMLDivElement>(null);
  const controls = useDragControls();
  const y = useMotionValue(0);
  const overlayOpacity = useTransform(y, [0, SWIPE_CLOSE.fadeRange], [1, SWIPE_CLOSE.fadeTo]);
  const closeRef = useRef(onClose);
  useLayoutEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  const present = useIsPresent();
  useScrollLock(present);

  useEffect(() => {
    if (!present) {
      // The close starts: focus goes back to the open target of the card, which is in the grid again.
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-open-target="${id}"]`)?.focus({ preventScroll: true });
      });
      return;
    }
    document.getElementById(titleId)?.focus({ preventScroll: true });
    const onKey = (event: globalThis.KeyboardEvent) => {
      const active = document.activeElement;
      const inside = !active || active === document.body || panel.current?.contains(active);
      if (event.key === 'Escape' && inside && !event.defaultPrevented) {
        event.preventDefault();
        closeRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [id, titleId, present]);

  /** Tab and Shift+Tab stay inside the view. */
  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !panel.current) {
      return;
    }
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (item) => item.offsetParent !== null,
    );
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) {
      return;
    }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === document.getElementById(titleId))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /** The swipe starts on the grabber or the header row, and only at the top of the view. */
  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (phone && (panel.current?.scrollTop ?? 0) <= 0) {
      controls.start(event);
    }
  };

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > SWIPE_CLOSE.offset || info.velocity.y > SWIPE_CLOSE.velocity) {
      closeRef.current();
    } else {
      animate(y, 0, reduced ? NO_MOTION : DRAG_RETURN);
    }
  };

  const corner = VIEW_RADIUS;
  const bottomCorner = phone ? 0 : VIEW_RADIUS;

  return createPortal(
    <>
      <motion.div
        animate={{ opacity: 1, transition: OVERLAY_FADE.in }}
        className={present ? 'fixed inset-0 z-40' : 'pointer-events-none fixed inset-0 z-40'}
        data-overlay="true"
        exit={{ opacity: 0, transition: OVERLAY_FADE.out }}
        initial={{ opacity: 0 }}
        onClick={() => closeRef.current()}
      >
        <motion.div aria-hidden="true" className="overlay-scrim absolute inset-0" style={{ opacity: overlayOpacity }} />
      </motion.div>
      <div className="pointer-events-none fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          aria-labelledby={titleId}
          aria-modal="true"
          className={cn(
            'surface-solid relative isolate max-h-sheet w-full overflow-y-auto overscroll-contain px-4 pb-panel text-hub-text md:max-h-panel md:w-panel md:px-8 md:pb-8',
            present && 'pointer-events-auto',
          )}
          inert={!present}
          drag={phone ? 'y' : false}
          dragConstraints={{ top: 0 }}
          dragControls={controls}
          dragElastic={{ top: 0, bottom: 0.5 }}
          dragListener={false}
          exit={{ opacity: 0, transition: reduced ? FADE : CONTENT_OUT }}
          id={`view-${id}`}
          initial={entry === 'fade' ? { opacity: 0, scale: reduced ? 1 : 0.98 } : false}
          layoutId={entry === 'shared' ? `card-${id}` : undefined}
          onDragEnd={onDragEnd}
          onKeyDown={trapFocus}
          ref={panel}
          role="dialog"
          style={{
            y,
            borderTopLeftRadius: corner,
            borderTopRightRadius: corner,
            borderBottomLeftRadius: bottomCorner,
            borderBottomRightRadius: bottomCorner,
          }}
          transition={reduced ? FADE : EXPAND_OPEN}
        >
          <div
            className="sticky top-0 z-10 -mx-4 bg-hub-material-solid px-4 pt-2 md:-mx-8 md:px-8 md:pt-8"
            onPointerDown={startDrag}
            style={{ touchAction: phone ? 'none' : 'auto' }}
          >
            <motion.div
              animate={{ opacity: 1 }}
              aria-hidden="true"
              className="mx-auto mb-1 h-1 w-10 rounded-full bg-hub-track md:hidden"
              initial={{ opacity: 0 }}
              transition={CHROME_IN}
            />
            <div className="flex items-center justify-between gap-4 pb-1 sm:items-start sm:pb-2">
              {title}
              <motion.button
                aria-label="Close"
                animate={{ opacity: 1 }}
                className="tap press inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-hub-chip text-hub-text hover:bg-hub-track"
                initial={{ opacity: 0 }}
                transition={CHROME_IN}
                onClick={() => closeRef.current()}
                type="button"
              >
                <X aria-hidden="true" className="relative z-3 size-5" />
              </motion.button>
            </div>
          </div>
          {children}
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
