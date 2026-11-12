import { buzz } from '@/lib/haptics';
import { ChartLine, Ellipsis, LayoutGrid, type LucideIcon, Plus, Send } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type PointerEvent, type ReactNode, useRef, useState } from 'react';
import { GradientDefs } from '@/components/charts/hub/GradientDefs';
import { useBarVisible } from '@/hooks/useBarVisible';
import { useLens } from '@/hooks/useLens';
import { useToday } from '@/hooks/useToday';
import { BUTTON_TAP, FADE, NO_MOTION, SPRING } from '@/lib/motion';
import { MORE_PAGES, PAGE_LABELS, type PageId, PRIMARY_PAGES, routeHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { useHubActions } from '@/store/useHub';
import { Backdrop } from './Backdrop';
import { PressButton } from './PressButton';
import { Sheet } from './Sheet';
import { placeSheen } from './sheen';

const TAB_ICONS: Readonly<Partial<Record<PageId, LucideIcon>>> = {
  home: LayoutGrid,
  outreach: Send,
  progress: ChartLine,
};

/** The pages that hold +1 DM in their own content. The shell hides its button there. */
const DM_PAGES: readonly PageId[] = ['home', 'outreach'];

interface NavItem {
  id: PageId | 'more';
  label: string;
  icon: LucideIcon;
  active: boolean;
  href?: string;
}

function navItems(page: PageId): NavItem[] {
  return [
    ...PRIMARY_PAGES.map((id) => ({
      id,
      label: PAGE_LABELS[id],
      icon: TAB_ICONS[id] ?? LayoutGrid,
      active: id === page,
      href: routeHref(id),
    })),
    { id: 'more', label: 'More', icon: Ellipsis, active: MORE_PAGES.includes(page) },
  ];
}

function useAddDm() {
  const today = useToday();
  const { addDm } = useHubActions();
  return () => {
    addDm(today, 1);
    buzz();
  };
}

/** The active pill. It is the only part of the bar with the pointer sheen. */
function ActivePill({ layoutId }: { layoutId: string }) {
  return (
    <motion.span
      className="glass-pill sheen absolute inset-0 rounded-full"
      layoutId={layoutId}
      transition={SPRING}
    />
  );
}

interface TabItemProps {
  item: NavItem;
  layoutId: string;
  wide: boolean;
  onMore: () => void;
}

function TabItem({ item, layoutId, wide, onMore }: TabItemProps) {
  const Icon = item.icon;
  const className = cn(
    'relative flex cursor-pointer items-center justify-center rounded-full no-underline transition-colors',
    wide ? 'min-h-11 gap-2 px-4 type-body font-medium' : 'h-12 min-w-0 flex-1 flex-col gap-0.5 px-1 type-caption font-semibold',
    item.active ? 'text-hub-text' : 'text-hub-label-strong hover:text-hub-text',
  );
  const content = (
    <>
      {item.active ? <ActivePill layoutId={layoutId} /> : null}
      <Icon aria-hidden="true" className={cn('relative', wide ? 'size-4' : 'size-5')} strokeWidth={item.active ? 2.2 : 1.8} />
      <span className="relative">{item.label}</span>
    </>
  );
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const pill = event.currentTarget.querySelector<HTMLElement>('.sheen');
    if (pill) {
      placeSheen(pill, event.clientX, event.clientY);
    }
  };
  if (item.href) {
    return (
      <motion.a
        aria-current={item.active ? 'page' : undefined}
        className={className}
        href={item.href}
        onPointerMove={onPointerMove}
        whileTap={BUTTON_TAP}
      >
        {content}
      </motion.a>
    );
  }
  return (
    <motion.button
      aria-haspopup="dialog"
      className={className}
      onClick={onMore}
      onPointerMove={onPointerMove}
      type="button"
      whileTap={BUTTON_TAP}
    >
      {content}
    </motion.button>
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
        <ul className="grid gap-1">
          {MORE_PAGES.map((id) => {
            const active = id === page;
            return (
              <li key={id}>
                <a
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'press flex min-h-14 items-center justify-between gap-3 rounded-control px-4 type-body font-medium text-hub-text no-underline hover:bg-hub-inset',
                    active && 'bg-hub-inset',
                  )}
                  href={routeHref(id)}
                  onClick={() => onOpenChange(false)}
                >
                  {PAGE_LABELS[id]}
                  {active ? <span className="type-label text-hub-label">Open now</span> : null}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </Sheet>
  );
}

/** The floating glass top bar on a wide screen: the mark, the 4 tabs and +1 DM. */
function TopBar({ page, onMore }: { page: PageId; onMore: () => void }) {
  const { ref: barRef, filter: barFilter, style: barStyle } = useLens<HTMLDivElement>({
    radius: 40,
    bezel: 16,
    strength: 36,
  });
  const addDm = useAddDm();
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 hidden justify-center px-8 pt-4 lg:flex">
      <div
        className="glass pointer-events-auto flex w-full max-w-280 items-center gap-3 rounded-full py-1 pr-1 pl-6"
        ref={barRef}
        style={barStyle}
      >
        {barFilter}
        <a className="relative z-3 shrink-0 rounded-full text-hub-text no-underline" href={routeHref('home')}>
          <span className="type-body font-semibold tracking-wide">L90</span>
          <span className="sr-only"> hub, Today</span>
        </a>
        <nav aria-label="Pages" className="relative z-3 flex min-w-0 flex-1 items-center justify-center gap-1">
          {navItems(page).map((item) => (
            <TabItem item={item} key={item.id} layoutId="top-pill" onMore={onMore} wide />
          ))}
        </nav>
        <div className="relative z-3 flex min-h-11 min-w-24 justify-end">
          <AnimatePresence initial={false}>
            {DM_PAGES.includes(page) ? null : (
              <motion.div animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} transition={FADE}>
                <PressButton aria-label="Add 1 DM" onClick={addDm} tone="primary">
                  <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />1 DM
                </PressButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

/**
 * The floating glass tab bar on a phone, in the thumb zone (round 6).
 * 56 px tall, 8 px above the safe area. It slides away on a scroll down and comes back
 * on a scroll up, at the top and at the end of the page. It stays while a field has focus.
 */
function TabBar({ page, onMore }: { page: PageId; onMore: () => void }) {
  const { ref: navRef, filter: navFilter, style: navStyle } = useLens<HTMLElement>({
    radius: 28,
    bezel: 12,
    strength: 30,
  });
  const frame = useRef<HTMLDivElement>(null);
  const visible = useBarVisible(frame, page);
  const reduced = useReducedMotion();
  const transition = reduced ? NO_MOTION : SPRING;

  return (
    <>
      <motion.div
        animate={{ opacity: visible ? 1 : 0 }}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-24 bg-linear-to-t from-hub-bg-from/85 via-hub-bg-from/30 to-transparent lg:hidden"
        initial={false}
        transition={reduced ? NO_MOTION : FADE}
      />
      <motion.div
        animate={{ y: visible ? 0 : '220%' }}
        className="pointer-events-none fixed inset-x-0 bottom-shell z-40 flex justify-center px-4 lg:hidden"
        data-bar-visible={visible ? 'true' : 'false'}
        initial={false}
        ref={frame}
        transition={transition}
      >
        <nav
          aria-label="Pages"
          className="glass pointer-events-auto flex w-full max-w-md min-w-0 items-center rounded-full p-1"
          ref={navRef}
          style={navStyle}
        >
          {navFilter}
          <div className="relative z-3 flex min-w-0 flex-1 items-center gap-0.5">
            {navItems(page).map((item) => (
              <TabItem item={item} key={item.id} layoutId="tab-pill" onMore={onMore} wide={false} />
            ))}
          </div>
        </nav>
      </motion.div>
    </>
  );
}

interface AppShellProps {
  page: PageId;
  children: ReactNode;
  /** True while an expanded view is open: the page under it takes no focus and no input. */
  inert?: boolean;
}

/** The frame of the hub: the backdrop, a glass top bar on a wide screen and a glass tab bar on a phone. */
export function AppShell({ page, children, inert = false }: AppShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const openMore = () => setMoreOpen(true);
  return (
    <div className="min-h-dvh overflow-x-clip" inert={inert}>
      <Backdrop />
      <GradientDefs />
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-hub-raised focus:px-4 focus:py-3"
        href="#main"
      >
        Go to the page content
      </a>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-30 h-top-edge bg-linear-to-b from-hub-bg-from/80 to-transparent lg:hidden"
      />
      <TopBar onMore={openMore} page={page} />
      <main
        className="mx-auto w-full max-w-280 px-4 pt-shell pb-shell md:px-6 lg:px-8 lg:pt-24 lg:pb-16"
        id="main"
        tabIndex={-1}
      >
        {children}
      </main>
      <TabBar onMore={openMore} page={page} />
      <MoreSheet onOpenChange={setMoreOpen} open={moreOpen} page={page} />
    </div>
  );
}
