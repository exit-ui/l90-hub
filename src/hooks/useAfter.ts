import { useEffect, useState } from 'react';

/**
 * True from `ms` after `on` turned true, and false at once when `on` turns false.
 * Used for work that a view does not need in its first frames, for example the `inert` of the page behind it.
 */
export function useAfter(on: boolean, ms: number): boolean {
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (!on) {
      return;
    }
    const timer = window.setTimeout(() => setLate(true), ms);
    return () => {
      window.clearTimeout(timer);
      setLate(false);
    };
  }, [on, ms]);
  return on && late;
}
