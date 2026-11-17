/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DURATION, EXPAND_OPEN } from './motion';

const kit = readFileSync(new URL('../motion-kit.css', import.meta.url), 'utf8');

/** The body of a block that opens at `start` (the index of its "{"). */
function blockAt(text: string, start: number): string {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === '{') {
      depth += 1;
    } else if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start + 1, index);
      }
    }
  }
  throw new Error('A block in motion-kit.css is not closed.');
}

function keyframes(): { name: string; body: string }[] {
  return [...kit.matchAll(/@keyframes\s+(mk-[\w-]+)\s*\{/g)].map((match) => ({
    name: match[1] ?? '',
    body: blockAt(kit, (match.index ?? 0) + match[0].length - 1),
  }));
}

/** The classes that start an animation: ".mk-name { animation: ... }". */
function animatedClasses(): { name: string; rule: string }[] {
  return [...kit.matchAll(/\.(mk-[\w-]+)\s*\{([^}]*animation:[^}]*)\}/g)]
    .map((match) => ({ name: match[1] ?? '', rule: match[2] ?? '' }))
    .filter(({ rule }) => !/animation:\s*none/.test(rule));
}

function token(name: string): number {
  const match = new RegExp(`--${name}:\\s*(\\d+)ms`).exec(kit);
  if (!match) {
    throw new Error(`The token --${name} is missing in motion-kit.css.`);
  }
  return Number(match[1]);
}

describe('the motion kit standard', () => {
  it('animates transform and opacity only, so every recipe runs on the graphics chip', () => {
    const allowed = new Set(['transform', 'opacity', 'animation-timing-function']);
    const frames = keyframes();
    expect(frames.length).toBeGreaterThanOrEqual(6);
    for (const frame of frames) {
      const properties = [...frame.body.matchAll(/([a-z-]+)\s*:/g)].map((match) => match[1] ?? '');
      for (const property of properties) {
        expect(allowed.has(property), `${frame.name} animates ${property}`).toBe(true);
      }
    }
  });

  it('stops every animation and transition recipe under reduced motion', () => {
    const start = kit.indexOf('@media (prefers-reduced-motion: reduce)');
    expect(start).toBeGreaterThan(0);
    const reduced = blockAt(kit, kit.indexOf('{', start));
    for (const { name } of animatedClasses()) {
      expect(reduced.includes(`.${name}`), `${name} is missing in the reduced-motion block`).toBe(true);
    }
    for (const name of ['mk-press', 'mk-tilt']) {
      expect(reduced.includes(`.${name}`), `${name} is missing in the reduced-motion block`).toBe(true);
    }
  });

  it('takes every duration from a token, and keeps the daily-use tokens at 300 ms or less', () => {
    for (const { name, rule } of animatedClasses()) {
      expect(/animation:[^;]*var\(--mk-dur-/.test(rule), `${name} does not use a duration token`).toBe(true);
    }
    expect(token('mk-dur-instant')).toBeLessThanOrEqual(100);
    expect(token('mk-dur-quick')).toBeLessThanOrEqual(150);
    expect(token('mk-dur-base')).toBeLessThanOrEqual(250);
    expect(token('mk-dur-slow')).toBeLessThanOrEqual(300);
    expect(token('mk-dur-ceremony')).toBeLessThanOrEqual(900);
  });

  it('lets only the rare recipes use the ceremony duration', () => {
    const ceremony = animatedClasses().filter(({ rule }) => rule.includes('--mk-dur-ceremony')).map(({ name }) => name);
    expect(ceremony).toEqual(['mk-flip']);
  });

  it('never uses a linear curve except where a keyframe sets the curve on each step', () => {
    for (const { name, rule } of animatedClasses()) {
      if (/\blinear\b/.test(rule)) {
        const frame = keyframes().find((item) => name === item.name);
        expect(frame?.body.includes('animation-timing-function'), `${name} is linear without a curve on its steps`).toBe(true);
      }
    }
  });

  it('keeps the numbers of motion.ts equal to the tokens of the kit', () => {
    expect(DURATION.instant * 1000).toBe(token('mk-dur-instant'));
    expect(DURATION.quick * 1000).toBe(token('mk-dur-quick'));
    expect(DURATION.base * 1000).toBe(token('mk-dur-base'));
    expect(DURATION.slow * 1000).toBe(token('mk-dur-slow'));
    expect(DURATION.ceremony * 1000).toBe(token('mk-dur-ceremony'));
  });

  it('keeps the view grow inside the slow ceiling', () => {
    expect(EXPAND_OPEN.visualDuration).toBeLessThanOrEqual(DURATION.slow);
  });

  it('depends on nothing outside the file', () => {
    expect(kit.includes('--hub-')).toBe(false);
    expect(/@import|url\(/.test(kit)).toBe(false);
  });
});
