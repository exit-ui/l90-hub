/** The SVG gradients that the charts share. Render this one time in the app shell. */
export function GradientDefs() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute size-0" focusable="false">
      <defs>
        <linearGradient id="hub-grad-primary" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--hub-primary)" />
          <stop offset="1" stopColor="var(--hub-primary-end)" />
        </linearGradient>
        <linearGradient id="hub-grad-secondary" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--hub-accent)" />
          <stop offset="1" stopColor="var(--hub-accent-end)" />
        </linearGradient>
        <linearGradient id="hub-grad-data" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--hub-positive)" />
          <stop offset="1" stopColor="var(--hub-positive-end)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
