import { memo, useEffect, useState } from 'react';
import { onPulse } from '@/lib/pulse';

/**
 * The glows behind every page (v4): three that drift slowly and one that flashes on a pulse
 * (a DM, a tick, a sign-off). It is the only part of the app that draws for a pulse, so the page does not.
 * The drift is the one continuous animation of the app: transform only, off under reduced motion.
 */
export const GlowLayer = memo(function GlowLayer() {
  const [count, setCount] = useState(0);
  useEffect(() => onPulse(() => setCount((current) => current + 1)), []);
  return (
    <div aria-hidden="true">
      <div className="glow glow-a" />
      <div className="glow glow-b" />
      <div className="glow glow-c" />
      <div className={count === 0 ? 'glow glow-pulse' : `glow glow-pulse ${count % 2 ? 'glow-pulse-a' : 'glow-pulse-b'}`} />
    </div>
  );
});
