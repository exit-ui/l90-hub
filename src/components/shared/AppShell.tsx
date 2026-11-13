import { BookOpen, ChartLine, Dumbbell, Ellipsis, House, type LucideIcon, Plus, Send, Settings, TrendingUp, Waypoints } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useRef, useState } from 'react';
import { GradientDefs } from '@/components/charts/hub/GradientDefs';
import { useBarVisible } from '@/hooks/useBarVisible';
import { useToday } from '@/hooks/useToday';
import { buzz } from '@/lib/haptics';
import { BUTTON_TAP, FADE, NO_MOTION, SPRING } from '@/lib/motion';
import { MORE_PAGES, PAGE_LABELS, type PageId, PRIMARY_PAGES, routeHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { useHubActions } from '@/store/useHub';
import { Wordmark } from './Brand';
import { PressButton } from './PressButton';
import { Sheet } from './Sheet';
import { SampleBanner, SamplePreviewButtons } from './SamplePreview';
import { ThemeSwitch } from './ThemeSwitch';

const PAGE_ICONS: Readonly<Record<PageId, LucideIcon>> = {
  home: House,
  outreach: Send,
  progress: ChartLine,
  learning: BookOpen,
  fitness: Dumbbell,
  trading: TrendingUp,
  method: Waypoints,
  setup: Settings,
};

/** The pages that hold +1 DM in their own content. The sidebar hides its button there. */
const DM_PAGES: readonly PageId[] = ['home', 'outreach'];

function useAddDm() {
  const today = useToday();
  const { addDm } = useHubActions();
  return () => {
    addDm(today, 1);
    buzz();
  };
}

interface TabLinkProps {
  id: PageId;
  page: PageId;
}

/** One slot of the phone tab bar: an icon and a 12 px label. The active page is dark, the others grey. */
function TabLink({ id, page }: TabLinkProps) {
  const Icon = PAGE_ICONS[id];
  const active = id === page;
  return (
    <motion.a
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-control type-caption no-underline transition-colors',
        active ? 'font-semibold text-hub-text' : 'font-medium text-hub-label hover:text-hub-text',
      )}
      href={routeHref(id)}
      whileTap={BUTTON_TAP}
    >
      <Icon aria-hidden="true" className="size-6" strokeWidth={active ? 2 : 1.7} />
      {PAGE_LABELS[id]}
    </motion.a>
  );
}

function MoreSheet({
  open,
  onOpenChange,
  page,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: PageId;
}) {
  return (
    <Sheet description="The other areas and the settings." onOpenChange={onOpenChange} open={open} title="More">
      <nav aria-label="More pages">
        <ul className="surface-inset grid overflow-hidden">
          {MORE_PAGES.map((id) => {
            const active = id === page;
            const Icon = PAGE_ICONS[id];
            return (
              <li className="border-b border-hub-hairline last:border-b-0" key={id}>
                <a
                  aria-current={active ? 'page' : undefined}
                  className="flex min-h-14 items-center gap-3 px-4 type-body font-medium text-hub-text no-underline hover:bg-hub-chip"
                  href={routeHref(id)}
                  onClick={() => onOpenChange(false)}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hub-surface">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">{PAGE_LABELS[id]}</span>
                  <span className="type-label text-hub-label">{active ? 'Open now' : '›'}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <section aria-labelledby="more-appearance" className="mt-6 grid gap-2">
        <h3 className="type-label font-semibold text-hub-label-strong" id="more-appearance">
          Appearance
        </h3>
        <ThemeSwitch />
      </section>
      <section aria-labelledby="more-preview" className="mt-6 grid gap-2">
        <h3 className="type-label font-semibold text-hub-label-strong" id="more-preview">
          Preview with sample data
        </h3>
        <SamplePreviewButtons />
      </section>
    </Sheet>
  );
}

/** One row of the sidebar on a wide screen. */
function SideLink({ id, page }: { id: PageId; page: PageId }) {
  const Icon = PAGE_ICONS[id];
  const active = id === page;
  return (
    <a
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex min-h-11 items-center gap-3 rounded-full px-4 type-body no-underline transition-colors',
        active ? 'font-semibold text-hub-on-brand' : 'font-medium text-hub-label-strong hover:bg-hub-chip hover:text-hub-text',
      )}
      href={routeHref(id)}
    >
      {active ? <motion.span className="glass-pill absolute inset-0 rounded-full" layoutId="side-pill" transition={SPRING} /> : null}
      <Icon aria-hidden="true" className="relative size-5" strokeWidth={active ? 2 : 1.7} />
      <span className="relative">{PAGE_LABELS[id]}</span>
    </a>
  );
}

/** The sidebar from 1024 px: the wordmark, all pages and +1 DM. */
function Sidebar({ page }: { page: PageId }) {
  const addDm = useAddDm();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-hub-hairline bg-hub-surface px-4 py-8 lg:flex">
      <a className="mb-8 rounded-full px-4 no-underline" href={routeHref('home')}>
        <Wordmark />
        <span className="sr-only"> hub, Today</span>
      </a>
      <nav aria-label="Pages" className="grid gap-1">
        {PRIMARY_PAGES.map((id) => (
          <SideLink id={id} key={id} page={page} />
        ))}
        <p className="mt-6 mb-1 px-4 type-caption text-hub-label">More</p>
        {MORE_PAGES.map((id) => (
          <SideLink id={id} key={id} page={page} />
        ))}
      </nav>
      <div className="mt-auto grid gap-3 px-2">
        <ThemeSwitch className="[&_button]:px-2" />
      </div>
      <div className="mt-3 min-h-11 px-2">
        <AnimatePresence initial={false}>
          {DM_PAGES.includes(page) ? null : (
            <motion.div animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} transition={FADE}>
              <PressButton aria-label="Add 1 DM" className="w-full" onClick={addDm} tone="primary">
                <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />1 DM
              </PressButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

/**
 * The frosted white tab bar on a phone: Today, Outreach, the raised +1 DM button, Progress and More.
 * It slides away on a scroll down and comes back on a scroll up, at the top and at the end of the page.
 * It stays while a field has focus.
 */
function TabBar({ page, onMore }: { page: PageId; onMore: () => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const visible = useBarVisible(frame, page);
  const reduced = useReducedMotion();
  const addDm = useAddDm();
  const moreActive = MORE_PAGES.includes(page);
  const [home, outreach, progress] = PRIMARY_PAGES;

  return (
    <motion.div
      animate={{ y: visible ? 0 : '130%' }}
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      data-bar-visible={visible ? 'true' : 'false'}
      initial={false}
      ref={frame}
      transition={reduced ? NO_MOTION : SPRING}
    >
      <nav aria-label="Pages" className="glass pb-tabbar">
        <div className="mx-auto grid max-w-md grid-cols-5 items-center px-2 pt-1 pb-1">
          {home ? <TabLink id={home} page={page} /> : null}
          {outreach ? <TabLink id={outreach} page={page} /> : null}
          <div className="flex justify-center">
            <motion.button
              aria-label="Add 1 DM"
              className="shadow-brand flex size-15 -translate-y-4 cursor-pointer items-center justify-center rounded-full border-4 border-hub-bg-from bg-hub-brand text-hub-on-brand"
              onClick={addDm}
              type="button"
              whileTap={BUTTON_TAP}
            >
              <Plus aria-hidden="true" className="size-6" strokeWidth={2.2} />
            </motion.button>
          </div>
          {progress ? <TabLink id={progress} page={page} /> : null}
          <motion.button
            aria-current={moreActive ? 'page' : undefined}
            aria-haspopup="dialog"
            className={cn(
              'flex min-h-12 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-control type-caption transition-colors',
              moreActive ? 'font-semibold text-hub-text' : 'font-medium text-hub-label hover:text-hub-text',
            )}
            onClick={onMore}
            type="button"
            whileTap={BUTTON_TAP}
          >
            <Ellipsis aria-hidden="true" className="size-6" strokeWidth={moreActive ? 2 : 1.7} />
            More
          </motion.button>
        </div>
      </nav>
    </motion.div>
  );
}

interface AppShellProps {
  page: PageId;
  children: ReactNode;
  /** True while an expanded view is open: the page under it takes no focus and no input. */
  inert?: boolean;
}

/** The frame of the hub: a white sidebar on a wide screen and a frosted tab bar on a phone. */
export function AppShell({ page, children, inert = false }: AppShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="min-h-dvh overflow-x-clip" inert={inert}>
      <GradientDefs />
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-hub-surface focus:px-4 focus:py-3"
        href="#main"
      >
        Go to the page content
      </a>
      <Sidebar page={page} />
      <div className="lg:pl-64">
        <main
          className="mx-auto w-full max-w-280 px-4 pt-shell pb-shell md:px-6 lg:px-8 lg:pt-12 lg:pb-16"
          id="main"
          tabIndex={-1}
        >
          <SampleBanner />
          {children}
        </main>
      </div>
      <TabBar onMore={() => setMoreOpen(true)} page={page} />
      <MoreSheet onOpenChange={setMoreOpen} open={moreOpen} page={page} />
    </div>
  );
}
