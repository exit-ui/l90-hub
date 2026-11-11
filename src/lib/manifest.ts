/**
 * The web app manifest of the hub. Plain data with no imports, so vite.config.ts can use it too.
 * The colours are the darkest background token (--hub-bg-from) in src/index.css.
 */
export const APP_BACKGROUND = '#05060a';

export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable';
}

export interface AppManifest {
  name: string;
  short_name: string;
  description: string;
  lang: string;
  display: 'standalone';
  orientation: 'portrait';
  start_url: string;
  scope: string;
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
}

export const APP_MANIFEST: AppManifest = {
  name: '90-day hub',
  short_name: 'L90',
  description: 'Track the 90-day mission: daily DMs, ticks for each area, and your progress.',
  lang: 'en-GB',
  display: 'standalone',
  orientation: 'portrait',
  start_url: './#/home',
  scope: './',
  background_color: APP_BACKGROUND,
  theme_color: APP_BACKGROUND,
  icons: [
    { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

/** The problems that stop an install or show a poor icon. An empty list means the manifest is valid. */
export function manifestProblems(manifest: unknown): string[] {
  const problems: string[] = [];
  if (typeof manifest !== 'object' || manifest === null) {
    return ['The manifest is not an object.'];
  }
  const value = manifest as Partial<Record<keyof AppManifest, unknown>>;
  for (const key of ['name', 'short_name', 'start_url', 'scope', 'display', 'background_color', 'theme_color'] as const) {
    if (typeof value[key] !== 'string' || value[key] === '') {
      problems.push(`The field "${key}" is missing.`);
    }
  }
  if (value.display !== 'standalone') {
    problems.push('The display must be "standalone".');
  }
  for (const key of ['background_color', 'theme_color'] as const) {
    if (typeof value[key] === 'string' && !/^#[0-9a-f]{6}$/i.test(value[key])) {
      problems.push(`The field "${key}" must be a colour like #05060a.`);
    }
  }
  const icons = Array.isArray(value.icons) ? (value.icons as Partial<ManifestIcon>[]) : [];
  const has = (size: string, purpose?: string) =>
    icons.some((icon) => icon.sizes === size && icon.type === 'image/png' && (purpose ? icon.purpose === purpose : icon.purpose !== 'maskable'));
  if (!has('192x192')) {
    problems.push('A 192 × 192 PNG icon is missing.');
  }
  if (!has('512x512')) {
    problems.push('A 512 × 512 PNG icon is missing.');
  }
  if (!has('512x512', 'maskable')) {
    problems.push('A 512 × 512 maskable PNG icon is missing.');
  }
  return problems;
}
