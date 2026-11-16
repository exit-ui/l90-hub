import { useEffect, useState } from 'react';

/**
 * The time in ms, drawn again each second while the component is on screen.
 * It also updates the moment the app comes back to the front, so a timer shows the right time at once
 * after the phone was locked. The component that uses it is small and mounts only while a timer is on.
 */
export function useClock(stepMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, stepMs);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    window.addEventListener('pageshow', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
      window.removeEventListener('pageshow', update);
    };
  }, [stepMs]);
  return now;
}
