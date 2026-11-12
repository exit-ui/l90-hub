import { type ComponentType, lazy, type ReactElement } from 'react';

export interface LazyPage {
  /** The page. Once loaded, it renders at once with no Suspense fallback. */
  Page: () => ReactElement;
  /** Starts the download early, for example when the app is idle. */
  preload: () => Promise<unknown>;
}

/**
 * A page that loads on first use. After the load, the page renders straight away,
 * so a page change never shows an empty frame.
 */
export function lazyPage(load: () => Promise<ComponentType>): LazyPage {
  let loaded: ComponentType | null = null;
  let pending: Promise<ComponentType> | null = null;
  const preload = () => {
    pending ??= load().then((component) => {
      loaded = component;
      return component;
    });
    return pending;
  };
  const Lazy = lazy(() => preload().then((component) => ({ default: component })));
  function Page() {
    const Loaded = loaded;
    return Loaded ? <Loaded /> : <Lazy />;
  }
  return { Page, preload };
}
