import { cn } from '@/lib/utils';

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
      <span
        aria-hidden="true"
        className="grid size-6 shrink-0 place-items-center rounded-md bg-primary font-mono text-[11px] font-semibold text-primary-foreground"
      >
        W
      </span>
      <span className={cn('truncate text-sm font-semibold', collapsed && 'sr-only')}>
        WebStudio CRM
      </span>
    </div>
  );
}
