export type ChartTone = 'primary' | 'secondary' | 'data';

/** Solid token colours for lines, dots and heatmap cells. */
export const TONE_COLOR: Readonly<Record<ChartTone, string>> = {
  primary: 'var(--hub-chart-line)',
  secondary: 'var(--hub-accent)',
  data: 'var(--hub-success)',
};

/** Gradient paints for thick strokes. GradientDefs must be on the page. */
export const TONE_GRADIENT: Readonly<Record<ChartTone, string>> = {
  primary: 'url(#hub-grad-primary)',
  secondary: 'url(#hub-grad-secondary)',
  data: 'url(#hub-grad-data)',
};
