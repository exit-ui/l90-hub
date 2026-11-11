import { useCallback } from 'react';
import type { PageId } from '@/lib/routes';
import { navigate, useRoute } from './useRoute';

/**
 * Keeps the selected tab in the hash route, for example #/learning/reading.
 * `prefix` holds route parts before the tab, for example ["day"] in #/trading/day/journal.
 * An unknown tab gives the first tab.
 */
export function useTabRoute<T extends string>(
  page: PageId,
  tabs: readonly T[],
  prefix: readonly string[] = [],
): [T, (tab: string) => void] {
  const route = useRoute();
  const segment = route.page === page ? route.segments[prefix.length] : undefined;
  const first = tabs[0];
  if (first === undefined) {
    throw new RangeError('The tab list is empty.');
  }
  const tab = tabs.find((id) => id === segment) ?? first;
  const prefixKey = prefix.join('/');
  const setTab = useCallback(
    (next: string) => {
      const parts = prefixKey === '' ? [] : prefixKey.split('/');
      navigate(page, ...parts, next);
    },
    [page, prefixKey],
  );
  return [tab, setTab];
}
