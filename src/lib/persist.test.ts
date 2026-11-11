import { describe, expect, it } from 'vitest';
import { requestPersistentStorage } from './persist';

describe('requestPersistentStorage', () => {
  it('asks only when the data is not yet persistent', async () => {
    let asked = 0;
    const api = { persisted: async () => false, persist: async () => { asked += 1; return true; } };
    expect(await requestPersistentStorage(api)).toBe(true);
    expect(asked).toBe(1);
    expect(await requestPersistentStorage({ persisted: async () => true, persist: async () => { asked += 1; return true; } })).toBe(true);
    expect(asked).toBe(1);
  });

  it('gives false without the API or after an error', async () => {
    expect(await requestPersistentStorage(undefined)).toBe(false);
    expect(await requestPersistentStorage({ persist: async () => { throw new Error('no'); } })).toBe(false);
  });
});
