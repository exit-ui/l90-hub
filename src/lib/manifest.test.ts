/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_BACKGROUND, APP_MANIFEST, manifestProblems } from './manifest';

const publicFile = (name: string) => new URL(`../../public/${name}`, import.meta.url);

describe('the web app manifest', () => {
  it('is valid for an install', () => {
    expect(manifestProblems(APP_MANIFEST)).toEqual([]);
    expect(APP_MANIFEST).toMatchObject({ name: '90-day hub', short_name: 'L90', start_url: './#/home', scope: './' });
  });

  it('uses the page background token for both colours', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
    expect(css).toContain(`--hub-bg-from: ${APP_BACKGROUND};`);
    expect(APP_MANIFEST.theme_color).toBe(APP_BACKGROUND);
  });

  it('points at icon files that exist', () => {
    for (const icon of APP_MANIFEST.icons) {
      expect(existsSync(publicFile(icon.src))).toBe(true);
    }
    expect(existsSync(publicFile('apple-touch-icon-180x180.png'))).toBe(true);
  });

  it('names each problem of a broken manifest', () => {
    expect(manifestProblems(null)).toEqual(['The manifest is not an object.']);
    const problems = manifestProblems({ ...APP_MANIFEST, display: 'browser', theme_color: 'black', icons: [] });
    expect(problems).toContain('The display must be "standalone".');
    expect(problems).toContain('The field "theme_color" must be a colour like #f4f5f2.');
    expect(problems).toContain('A 512 × 512 maskable PNG icon is missing.');
  });

  it('is valid in the build output when a build exists', () => {
    const built = new URL('../../dist/manifest.webmanifest', import.meta.url);
    if (!existsSync(built)) {
      return;
    }
    expect(manifestProblems(JSON.parse(readFileSync(built, 'utf8')))).toEqual([]);
  });
});

describe('the light status bar', () => {
  it('sets the theme colour and a dark status bar text in index.html', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    expect(html).toContain(`<meta name="theme-color" content="${APP_BACKGROUND}" />`);
    expect(html).toContain('<meta name="apple-mobile-web-app-status-bar-style" content="default" />');
    expect(html).not.toContain('class="dark"');
  });
});
