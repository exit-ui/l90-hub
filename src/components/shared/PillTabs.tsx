import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface PillTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface PillTabsProps {
  tabs: readonly PillTab[];
  value: string;
  onChange: (id: string) => void;
  /** The name of the tab row for screen readers, for example "Outreach sections". */
  label: string;
  className?: string;
}

/** True when the pill row is wider than its box. The row then gives way to a pull-down menu. */
function useOverflow() {
  const box = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const outer = box.current;
    const inner = row.current;
    if (!outer || !inner) {
      return;
    }
    const check = () => setOverflow(inner.scrollWidth > outer.clientWidth + 1);
    const observer = new ResizeObserver(check);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);
  return { box, row, overflow };
}

/**
 * Pill tabs on the content material. Only the active pill is glass.
 * When the pills do not fit, a pull-down section menu shows instead, so nothing scrolls sideways.
 */
export function PillTabs({ tabs, value, onChange, label, className }: PillTabsProps) {
  const indicatorId = useId();
  const { box, row, overflow } = useOverflow();
  const current = tabs.find((tab) => tab.id === value) ?? tabs[0];

  return (
    <Tabs className={cn('gap-8', className)} onValueChange={(next) => onChange(String(next))} value={value}>
      <div className="relative -mx-2 -my-2 overflow-x-clip px-2 py-2" ref={box}>
        <div
          aria-hidden={overflow ? true : undefined}
          className={cn(overflow && 'pointer-events-none invisible absolute top-2 left-2')}
          ref={row}
        >
          <TabsList
            aria-label={label}
            className="h-auto w-max gap-1 rounded-full bg-hub-material p-1 rim-hairline group-data-horizontal/tabs:h-auto"
          >
            {tabs.map((tab) => {
              const active = tab.id === value;
              return (
                <TabsTrigger
                  className={cn(
                    'tap relative h-auto flex-none cursor-pointer rounded-full border-0 px-4 type-body font-medium transition-colors',
                    'bg-transparent data-active:bg-transparent dark:data-active:border-transparent dark:data-active:bg-transparent',
                    active
                      ? 'text-hub-text hover:text-hub-text data-active:text-hub-text'
                      : 'text-hub-label-strong hover:text-hub-text',
                  )}
                  key={tab.id}
                  tabIndex={overflow ? -1 : undefined}
                  value={tab.id}
                >
                  {active ? (
                    <motion.span
                      className="glass-pill absolute inset-0 rounded-full"
                      layoutId={indicatorId}
                      transition={SPRING}
                    />
                  ) : null}
                  <span className="relative">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        {overflow ? (
          <Menu.Root>
            <Menu.Trigger
              aria-label={`${label}: ${current?.label ?? ''}`}
              className="tap press inline-flex cursor-pointer items-center gap-2 rounded-full bg-hub-material px-4 type-body font-semibold text-hub-text rim-hairline hover:bg-hub-track"
            >
              {current?.label}
              <ChevronDown aria-hidden="true" className="size-4 text-hub-label-strong" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner align="start" className="z-50 outline-none" sideOffset={8}>
                <Menu.Popup className="glass-thick min-w-56 origin-(--transform-origin) rounded-card p-2 text-hub-text outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                  <Menu.RadioGroup
                    className="relative z-3"
                    onValueChange={(next: unknown) => {
                      if (typeof next === 'string') {
                        onChange(next);
                      }
                    }}
                    value={value}
                  >
                    {tabs.map((tab) => (
                      <Menu.RadioItem
                        className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-control px-3 type-body text-hub-text outline-none select-none data-highlighted:bg-hub-track"
                        closeOnClick
                        key={tab.id}
                        value={tab.id}
                      >
                        {tab.label}
                        <Menu.RadioItemIndicator>
                          <Check aria-hidden="true" className="size-4 text-hub-positive" />
                        </Menu.RadioItemIndicator>
                      </Menu.RadioItem>
                    ))}
                  </Menu.RadioGroup>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ) : null}
      </div>
      {tabs.map((tab) => (
        <TabsContent
          className="rounded-card type-body focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
          key={tab.id}
          value={tab.id}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
