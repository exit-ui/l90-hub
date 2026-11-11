import { useEffect, useState } from 'react';

const STEP_MS = 60_000;

/** The current time. It changes each minute, so a time cue like "06:20" becomes due. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = window.setInterval(update, STEP_MS);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return now;
}
