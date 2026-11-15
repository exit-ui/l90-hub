import { MotionConfig } from 'motion/react';
import { type ReactNode, Suspense, useEffect, useLayoutEffect } from 'react';
import { AppShell } from '@/components/shared/AppShell';
import { useRoute } from '@/hooks/useRoute';
import { useApplyTheme } from '@/hooks/useTheme';
import { lazyPage } from '@/lib/lazyPage';
import { analyticsFrom } from '@/lib/pillarAnalytics';
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

/** The page a link like "#/outreach/funnel" opens, when it is one of the pages that load later. */
function lazyPageOf(href: string | null): keyof typeof PAGES | null {
  const id = href?.match(/^#\/([a-z]+)/)?.[1];
  return id && id in PAGES ? (id as keyof typeof PAGES) : null;
}

/**
 * The other pages load in the background, one at a time, a few seconds after the app opens,
 * so the first taps on a phone do not wait behind them. A press on a link loads its page at once.
 */
function usePreloadPages() {
  useEffect(() => {
    const onPress = (event: PointerEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href^="#/"]') : null;
      const page = lazyPageOf(link?.getAttribute('href') ?? null);
      if (page) {
        void PAGES[page].preload().catch(() => undefined);
      }
    };
    document.addEventListener('pointerdown', onPress, { passive: true });
    const timers: number[] = [];
    Object.values(PAGES).forEach((entry, index) => {
      timers.push(window.setTimeout(() => void entry.preload().catch(() => undefined), 2500 + index * 400));
    });
    return () => {
      document.removeEventListener('pointerdown', onPress);
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
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
      <AppShell inert={expandedFrom(route) !== null || analyticsFrom(route) !== null} page={route.page}>
        {/* The page swaps at once, like a native tab bar. Then it settles from its top-left corner and
            its parts rise in, 50 ms apart (v3: the page first, then the details). */}
        <Suspense fallback={null}>
          <div className="page-enter" key={route.page}>
            {renderPage(route.page)}
          </div>
        </Suspense>
      </AppShell>
    </MotionConfig>
  );
}
