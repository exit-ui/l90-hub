/** The look of the app. "system" follows the phone or computer setting. A device setting, not part of the hub record. */
export const THEME_KEY = 'l90-hub-theme';

export const THEME_CHOICES = ['light', 'dark', 'system'] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
export type Theme = 'light' | 'dark';

export const THEME_LABELS: Readonly<Record<ThemeChoice, string>> = {
  light: 'Light',
  dark: 'Dark',
  system: 'Auto',
};

/** The page colour of each theme, for the browser bar and the status bar. Matches --hub-bg-from. */
export const THEME_BACKGROUND: Readonly<Record<Theme, string>> = {
  light: '#f4f5f2',
  dark: '#05060a',
};

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return THEME_CHOICES.some((choice) => choice === value);
}

/** A stored value that is missing or wrong gives "light", the look the app had first. */
export function parseThemeChoice(raw: string | null): ThemeChoice {
  return isThemeChoice(raw) ? raw : 'light';
}

export function resolveTheme(choice: ThemeChoice, systemDark: boolean): Theme {
  if (choice === 'system') {
    return systemDark ? 'dark' : 'light';
  }
  return choice;
}

/** Sets the theme on <html> and the colour of the browser bar. */
export interface ThemeTarget {
  documentElement: { dataset: DOMStringMap };
  querySelector: (selector: string) => { setAttribute: (name: string, value: string) => void } | null;
}

export function applyTheme(theme: Theme, doc: ThemeTarget = document): void {
  doc.documentElement.dataset.theme = theme;
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_BACKGROUND[theme]);
}
