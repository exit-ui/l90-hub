import { describe, expect, it } from 'vitest';
import { createDefaultState } from '@/store/defaults';
import { dataOnly } from './setupBackup';
import {
  parkedNewestFirst,
  parseSetting,
  phaseDays,
  SETTING_FIELDS,
  settingError,
} from './setupView';
import { parseBackup, serializeBackup } from './storage';

describe('parseSetting', () => {
  it('reads a whole number at or above the minimum', () => {
    expect(parseSetting('20', 1)).toBe(20);
    expect(parseSetting(' 7 ', 1)).toBe(7);
    expect(parseSetting('0', 0)).toBe(0);
    expect(parseSetting('020', 1)).toBe(20);
  });

  it('gives null for text that is not a correct value', () => {
    expect(parseSetting('', 1)).toBeNull();
    expect(parseSetting('0', 1)).toBeNull();
    expect(parseSetting('-3', 0)).toBeNull();
    expect(parseSetting('2.5', 1)).toBeNull();
    expect(parseSetting('1e3', 1)).toBeNull();
    expect(parseSetting('abc', 1)).toBeNull();
    expect(parseSetting('99999999999999999999', 1)).toBeNull();
  });
});

describe('settingError', () => {
  it('gives no error for an empty field or a correct value', () => {
    expect(settingError('', 1)).toBeUndefined();
    expect(settingError('5', 1)).toBeUndefined();
  });

  it('says what is wrong and how to correct it', () => {
    expect(settingError('0', 1)).toBe(
      'The value is not correct. Type a whole number of 1 or more.',
    );
    expect(settingError('-1', 0)).toBe(
      'The value is not correct. Type a whole number of 0 or more.',
    );
  });
});

describe('setting fields', () => {
  it('has a minimum of 1 for each target and 0 for the start count', () => {
    for (const field of SETTING_FIELDS) {
      expect(field.minimum).toBe(field.key === 'baseContacted' ? 0 : 1);
    }
    expect(SETTING_FIELDS).toHaveLength(5);
  });
});

describe('phaseDays', () => {
  it('gives the day range of each phase', () => {
    expect(phaseDays(1)).toEqual({ first: 1, last: 30 });
    expect(phaseDays(2)).toEqual({ first: 31, last: 60 });
    expect(phaseDays(3)).toEqual({ first: 61, last: 90 });
  });
});

describe('parkedNewestFirst', () => {
  it('sorts by date and keeps the stored index', () => {
    const rows = parkedNewestFirst([
      { text: 'a', date: '2026-11-01' },
      { text: 'b', date: '2026-11-03' },
      { text: 'c', date: '2026-11-03' },
      { text: 'd', date: '2026-10-30' },
    ]);
    expect(rows.map((row) => row.text)).toEqual(['c', 'b', 'a', 'd']);
    expect(rows.map((row) => row.index)).toEqual([2, 1, 0, 3]);
  });

  it('gives an empty list for an empty list', () => {
    expect(parkedNewestFirst([])).toEqual([]);
  });
});

describe('dataOnly', () => {
  it('removes the actions and keeps the data', () => {
    const state = createDefaultState();
    const store = { ...state, actions: { reset: () => undefined } };
    const data = dataOnly(store);
    expect('actions' in data).toBe(false);
    expect(data).toEqual(state);
    expect('actions' in store).toBe(true);
  });

  it('gives a record that the hub can load again', () => {
    const state = createDefaultState();
    const text = serializeBackup(dataOnly({ ...state, actions: {} }));
    expect(text).not.toContain('actions');
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state).toEqual(state);
    }
  });
});
