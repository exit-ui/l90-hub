export type ChartTone = 'primary' | 'secondary' | 'data';

/** Solid token colours for lines and dots. */
export const TONE_COLOR: Readonly<Record<ChartTone, string>> = {
  primary: 'var(--hub-primary)',
  secondary: 'var(--hub-accent-text)',
  data: 'var(--hub-positive)',
};

/** Gradient paints for thick strokes. GradientDefs must be on the page. */
export const TONE_GRADIENT: Readonly<Record<ChartTone, string>> = {
  primary: 'url(#hub-grad-primary)',
  secondary: 'url(#hub-grad-secondary)',
  data: 'url(#hub-grad-data)',
};

export const TONE_GLOW: Readonly<Record<ChartTone, string>> = {
  primary: 'drop-glow-primary',
  secondary: 'drop-glow-secondary',
  data: 'drop-glow-data',
};
