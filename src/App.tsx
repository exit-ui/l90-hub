import { MotionConfig } from 'motion/react';
import { type ReactNode, Suspense, useEffect, useLayoutEffect } from 'react';
import { AppShell } from '@/components/shared/AppShell';
import { useRoute } from '@/hooks/useRoute';
import { useApplyTheme } from '@/hooks/useTheme';
import { lazyPage } from '@/lib/lazyPage';
import { expandedFrom, type PageId, redirectHash } from '@/lib/routes';
import { HomePage } from '@/pages/home/HomePage';
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';
import { useHub } from '@/store/useHub';

/** The other pages load on first use or when the app is idle, so the first load only carries Today. */
const PAGES = {
  outreach: lazyPage(() => import('@/pages/outreach/OutreachPage').then((module) => module.OutreachPage)),
  progress: lazyPage(() => import('@/pages/progress/ProgressPage').then((module) => module.ProgressPage)),
  learning: lazyPage(() => import('@/pages/learning/LearningPage').then((module) => module.LearningPage)),
  fitness: lazyPage(() => import('@/pages/fitness/FitnessPage').then((module) => module.FitnessPage)),
  trading: lazyPage(() => import('@/pages/trading/TradingPage').then((module) => module.TradingPage)),
  method: lazyPage(() => import('@/pages/method/MethodPage').then((module) => module.MethodPage)),
  setup: lazyPage(() => import('@/pages/setup/SetupPage').then((module) => module.SetupPage)),
} as const;

function renderPage(page: PageId): ReactNode {
  if (page === 'home') {
    return <HomePage />;
  }
  const { Page } = PAGES[page];
  return <Page />;
}

/** After the first paint, load the other pages in the background, so a tab change is instant. */
function usePreloadPages() {
  useEffect(() => {
    const start = () => {
      for (const entry of Object.values(PAGES)) {
        void entry.preload().catch(() => undefined);
      }
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 1000);
    return () => window.clearTimeout(id);
  }, []);
}

/** A new page starts at the top. A tab change inside a page keeps the scroll. */
function useScrollTopOnPage(page: PageId) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);
}

/** Old links keep working: "#/calendar" moves to "#/progress/days" without a new history entry. */
function useRedirects() {
  useEffect(() => {
    const apply = () => {
      const next = redirectHash(window.location.hash);
      if (next) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);
}

export default function App() {
  const route = useRoute();
  const onboarded = useHub((state) => state.onboarded);
  useRedirects();
  useApplyTheme();
  usePreloadPages();
  useScrollTopOnPage(route.page);
  if (!onboarded) {
    return (
      <MotionConfig reducedMotion="user">
        <OnboardingPage />
      </MotionConfig>
    );
  }
  return (
    <MotionConfig reducedMotion="user">
      <AppShell inert={expandedFrom(route) !== null} page={route.page}>
        {/* The page swaps at once, like a native tab bar. A fade here showed an empty frame on each change. */}
        <Suspense fallback={null}>
          <div key={route.page}>{renderPage(route.page)}</div>
        </Suspense>
      </AppShell>
    </MotionConfig>
  );
}
