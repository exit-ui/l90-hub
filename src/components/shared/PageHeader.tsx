import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** A short line below the title. */
  detail?: ReactNode;
  /** A small line above the title, for example the date. */
  eyebrow?: ReactNode;
  /** Small controls on the right of the title, for example chips. */
  aside?: ReactNode;
}

/** The title of a page: 28 px, with room above and below it. */
export function PageHeader({ title, detail, eyebrow, aside }: PageHeaderProps) {
  return (
    <header className="mb-8 md:mb-12">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1 type-label font-medium text-hub-label">{eyebrow}</p> : null}
          <h1 className="type-title font-semibold text-hub-text">{title}</h1>
        </div>
        {aside ? <div className="flex shrink-0 items-center gap-2">{aside}</div> : null}
      </div>
      {detail ? <div className="mt-2 max-w-prose type-body text-hub-label-strong">{detail}</div> : null}
    </header>
  );
}
