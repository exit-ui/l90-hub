import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  /** A short line below the title. */
  detail?: ReactNode;
  /** A small line above the title, for example the date. */
  eyebrow?: ReactNode;
  /** Small controls on the right of the title, for example chips. */
  aside?: ReactNode;
}

/**
 * The title of a page. On a phone with an eyebrow, the eyebrow and the controls share the first line,
 * so the content starts sooner (round 6). From 640 px the controls sit right of the title.
 */
export function PageHeader({ title, detail, eyebrow, aside }: PageHeaderProps) {
  const split = Boolean(eyebrow && aside);
  return (
    <header className="mb-5 sm:mb-8 md:mb-12">
      {split ? (
        <div className="mb-1 flex min-h-8 items-center justify-between gap-3 sm:hidden">
          <p className="type-label min-w-0 truncate font-medium text-hub-label">{eyebrow}</p>
          <div className="flex shrink-0 items-center gap-2">{aside}</div>
        </div>
      ) : null}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className={cn('mb-1 type-label font-medium text-hub-label', split && 'hidden sm:block')}>{eyebrow}</p>
          ) : null}
          <h1 className="type-title font-semibold text-hub-text">{title}</h1>
        </div>
        {aside ? <div className={cn('flex shrink-0 items-center gap-2', split && 'hidden sm:flex')}>{aside}</div> : null}
      </div>
      {detail ? <div className="mt-1 max-w-prose type-body text-hub-label-strong sm:mt-2">{detail}</div> : null}
    </header>
  );
}
