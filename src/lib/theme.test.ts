import { describe, expect, it } from 'vitest';
import { applyTheme, parseThemeChoice, resolveTheme, THEME_BACKGROUND } from './theme';

describe('theme', () => {
  it('reads a stored choice and falls back to dark', () => {
    expect(parseThemeChoice('dark')).toBe('dark');
    expect(parseThemeChoice('light')).toBe('light');
    expect(parseThemeChoice('system')).toBe('system');
    expect(parseThemeChoice(null)).toBe('dark');
    expect(parseThemeChoice('blue')).toBe('dark');
  });

  it('follows the device only for the automatic choice', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('sets the attribute on <html> and the browser bar colour', () => {
    const attributes = new Map<string, string>();
    const doc = {
      documentElement: { dataset: {} as DOMStringMap },
      querySelector: (selector: string) =>
        selector === 'meta[name="theme-color"]' ? { setAttribute: (name: string, value: string) => void attributes.set(name, value) } : null,
    };
    applyTheme('dark', doc);
    expect(doc.documentElement.dataset.theme).toBe('dark');
    expect(attributes.get('content')).toBe(THEME_BACKGROUND.dark);
  });
});
