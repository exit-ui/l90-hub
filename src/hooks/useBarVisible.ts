import { type RefObject, useEffect, useRef, useState } from 'react';
import { nextBarState } from '@/lib/barScroll';

/** True for an element that takes text: the bar stays while it has focus. */
function isField(element: Element | null): boolean {
  if (!element) {
    return false;
  }
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return true;
  }
  if (element instanceof HTMLInputElement) {
    return !['button', 'checkbox', 'radio', 'submit', 'reset', 'range'].includes(element.type);
  }
  return element instanceof HTMLElement && element.isContentEditable;
}

/**
 * The phone tab bar: it hides on a scroll down and shows on a scroll up, at the top and at the end.
 * It never hides while a field or the bar has focus. A new page shows it again.
 */
export function useBarVisible(bar: RefObject<HTMLElement | null>, page: string): boolean {
  const [visible, setVisible] = useState(true);
  const [seenPage, setSeenPage] = useState(page);
  if (seenPage !== page) {
    setSeenPage(page);
    setVisible(true);
  }
  const state = useRef({ visible: true, anchor: 0 });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.scrollingElement ?? document.documentElement;
      const active = document.activeElement;
      const next = nextBarState({
        y: window.scrollY,
        anchor: state.current.anchor,
        maxY: root.scrollHeight - window.innerHeight,
        pinned: isField(active) || Boolean(active && bar.current?.contains(active)),
        visible: state.current.visible,
      });
      state.current = next;
      setVisible(next.visible);
    };
    const schedule = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update);
      }
    };
    state.current = { visible: true, anchor: window.scrollY };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [bar, page]);

  return visible;
}
