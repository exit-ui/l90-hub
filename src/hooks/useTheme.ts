import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { applyTheme, parseThemeChoice, resolveTheme, THEME_KEY, type ThemeChoice } from '@/lib/theme';
import { useMediaQuery } from './useMediaQuery';

const listeners = new Set<() => void>();

function readChoice(): ThemeChoice {
  try {
    return parseThemeChoice(window.localStorage.getItem(THEME_KEY));
  } catch {
    return 'light';
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** The stored theme choice and a setter. Every user of the hook sees a change at once. */
export function useThemeChoice(): [ThemeChoice, (choice: ThemeChoice) => void] {
  const choice = useSyncExternalStore(subscribe, readChoice, () => 'light' as const);
  const setChoice = useCallback((next: ThemeChoice) => {
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode: the choice holds until the app closes.
    }
    for (const listener of listeners) {
      listener();
    }
  }, []);
  return [choice, setChoice];
}

/** Keeps <html data-theme> in step with the choice and, for "Auto", with the device. */
export function useApplyTheme(): void {
  const [choice] = useThemeChoice();
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  useEffect(() => {
    applyTheme(resolveTheme(choice, systemDark));
  }, [choice, systemDark]);
}
