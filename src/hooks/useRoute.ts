import { useMemo, useSyncExternalStore } from 'react';
import { parseRoute, type PageId, type Route, routeHref } from '@/lib/routes';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function readHash(): string {
  return window.location.hash;
}

/** The current hash route. The component renders again when the hash changes. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, readHash);
  return useMemo(() => parseRoute(hash), [hash]);
}

export function navigate(page: PageId, ...segments: string[]): void {
  window.location.hash = routeHref(page, ...segments).slice(1);
}
