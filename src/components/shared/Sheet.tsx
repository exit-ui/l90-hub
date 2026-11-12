import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** A line under the title for screen readers and sighted users. */
  description?: ReactNode;
  /** Hide the title visually. It stays for screen readers. */
  hideTitle?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * A white sheet: a bottom sheet with 32 px top corners on a phone,
 * a centred 480 px dialog on a wide screen. It opens in 350 ms.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  hideTitle = false,
  children,
  className,
}: SheetProps) {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-hub-overlay transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={cn(
            'glass-sheet inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto rounded-t-sheet px-4 pt-4 pb-sheet text-hub-text outline-none',
            'transition-[translate,scale,opacity] duration-350 ease-sheet',
            'data-ending-style:translate-y-full data-starting-style:translate-y-full',
            'md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-120 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-sheet md:p-6',
            'md:data-ending-style:-translate-y-1/2 md:data-ending-style:scale-95 md:data-ending-style:opacity-0 md:data-starting-style:-translate-y-1/2 md:data-starting-style:scale-95 md:data-starting-style:opacity-0',
            className,
          )}
        >
          <div aria-hidden="true" className="mx-auto mb-4 h-1 w-12 shrink-0 rounded-full bg-hub-track md:hidden" />
          <div className="relative z-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className={cn('type-section font-semibold', hideTitle && 'sr-only')}>
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 type-body text-hub-label">{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="tap press -mt-2 -mr-2 inline-flex cursor-pointer items-center justify-center rounded-full text-hub-label-strong hover:bg-hub-inset hover:text-hub-text"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          <div className="relative z-3 mt-4">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
