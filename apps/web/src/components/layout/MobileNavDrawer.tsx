import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from './Brand';
import { SidebarNav } from './SidebarNav';

interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Mobile navigation. Dialog's modal mode traps focus, locks page scroll, closes on Escape
 * and returns focus to the trigger, so none of that is hand-rolled here.
 */
export function MobileNavDrawer({ open, onOpenChange }: MobileNavDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 motion-reduce:transition-none data-ending-style:opacity-0 data-starting-style:opacity-0 lg:hidden" />
        <Dialog.Popup
          // overscroll-contain keeps a scroll gesture inside the drawer from scrolling the page.
          className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col overscroll-contain border-r border-sidebar-border bg-sidebar shadow-lg transition-transform duration-200 outline-none motion-reduce:transition-none data-ending-style:-translate-x-full data-starting-style:-translate-x-full lg:hidden"
        >
          <div className="flex h-12 items-center justify-between border-b border-sidebar-border px-3">
            <Dialog.Title className="text-sm font-semibold">
              <Brand />
            </Dialog.Title>
            <Dialog.Close
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Закрыть меню">
                  <X aria-hidden="true" strokeWidth={1.75} />
                </Button>
              }
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <SidebarNav
              onNavigate={() => {
                onOpenChange(false);
              }}
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
