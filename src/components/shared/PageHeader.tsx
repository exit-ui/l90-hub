import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { routeHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  /** A short line below the title. */
  detail?: ReactNode;
  /** A small line above the title, for example the date. */
  eyebrow?: ReactNode;
  /**
   * A sub-screen below 1024 px: a round back button to Today on the left and the title in the centre.
   * From 1024 px the sidebar is the way back, so the title sits on the left as on every page.
   */
  back?: boolean;
}

/** The title of a page. A sub-screen gets the back button and a centred title on a phone. */
export function PageHeader({ title, detail, eyebrow, back = false }: PageHeaderProps) {
  return (
    <header className="mb-6 sm:mb-8">
      {eyebrow ? <p className={cn('mb-1 type-label text-hub-label', back && 'hidden lg:block')}>{eyebrow}</p> : null}
      <div className={cn(back && 'grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 lg:block')}>
        {back ? (
          <a
            aria-label="Back to Today"
            className="press flex size-11 items-center justify-center rounded-full bg-hub-surface text-hub-text no-underline rim-hairline hover:bg-hub-inset lg:hidden"
            href={routeHref('home')}
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.8} />
          </a>
        ) : null}
        <h1 className={cn('text-hub-text', back ? 'type-section truncate text-center lg:type-title lg:text-left' : 'type-title')}>
          {title}
        </h1>
      </div>
      {detail ? (
        <div className={cn('mt-1 max-w-prose type-body text-hub-label sm:mt-2', back && 'text-center lg:text-left')}>{detail}</div>
      ) : null}
    </header>
  );
}
