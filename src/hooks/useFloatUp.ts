import { useCallback, useRef, useState } from 'react';

export interface Bubble {
  id: number;
  text: string;
}

/** Labels like "+1" that rise above a button and fade. Each call to show() adds one. */
export function useFloatUp(): { bubbles: Bubble[]; show: (text: string) => void } {
  const next = useRef(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const show = useCallback((text: string) => {
    next.current += 1;
    const id = next.current;
    setBubbles((current) => [...current.slice(-3), { id, text }]);
    window.setTimeout(() => setBubbles((current) => current.filter((bubble) => bubble.id !== id)), 420);
  }, []);
  return { bubbles, show };
}

