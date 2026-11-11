import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { lazy, type ReactNode, Suspense, useEffect } from 'react';
import { AppShell } from '@/components/shared/AppShell';
import { useRoute } from '@/hooks/useRoute';
import { FADE } from '@/lib/motion';
import { expandedFrom, type PageId, redirectHash } from '@/lib/routes';
import { HomePage } from '@/pages/home/HomePage';
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';
import { useHub } from '@/store/useHub';

/** The other pages load on first use, so the first load only carries Today. */
const OutreachPage = lazy(() => import('@/pages/outreach/OutreachPage').then((module) => ({ default: module.OutreachPage })));
const ProgressPage = lazy(() => import('@/pages/progress/ProgressPage').then((module) => ({ default: module.ProgressPage })));
const LearningPage = lazy(() => import('@/pages/learning/LearningPage').then((module) => ({ default: module.LearningPage })));
const FitnessPage = lazy(() => import('@/pages/fitness/FitnessPage').then((module) => ({ default: module.FitnessPage })));
const TradingPage = lazy(() => import('@/pages/trading/TradingPage').then((module) => ({ default: module.TradingPage })));
const MethodPage = lazy(() => import('@/pages/method/MethodPage').then((module) => ({ default: module.MethodPage })));
const SetupPage = lazy(() => import('@/pages/setup/SetupPage').then((module) => ({ default: module.SetupPage })));

function renderPage(page: PageId): ReactNode {
  switch (page) {
    case 'home':
      return <HomePage />;
    case 'outreach':
      return <OutreachPage />;
    case 'progress':
      return <ProgressPage />;
    case 'learning':
      return <LearningPage />;
    case 'fitness':
      return <FitnessPage />;
    case 'trading':
      return <TradingPage />;
    case 'method':
      return <MethodPage />;
    case 'setup':
      return <SetupPage />;
  }
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
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={route.page}
            transition={FADE}
          >
            <Suspense fallback={null}>{renderPage(route.page)}</Suspense>
          </motion.div>
        </AnimatePresence>
      </AppShell>
    </MotionConfig>
  );
}
