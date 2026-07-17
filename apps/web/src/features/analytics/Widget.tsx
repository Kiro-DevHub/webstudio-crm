import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { WidgetError } from './WidgetError';

interface WidgetProps {
  title: string;
  /** What this widget shows, in one muted line under the title. */
  description?: string;
  /** Trailing header slot — a legend key or a small count. */
  action?: ReactNode;
  /** Loading accusative for the error message ("выручку"). */
  errorSubject: string;
  /** True only on the first load, when there is no data to hold. */
  isLoading: boolean;
  isError: boolean;
  /** True during a background refetch — the body dims but keeps its frame. */
  isFetching?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry: () => void;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
  /** Padding around the body; charts opt out to bleed to the card edge. */
  bodyClassName?: string;
}

/**
 * The card shell every dashboard block shares: a header, and a body that resolves to exactly
 * one of skeleton / error / empty / content. Refetches hold the previous content at reduced
 * opacity instead of flashing a skeleton, so a period change reflows without a jump.
 */
export function Widget({
  title,
  description,
  action,
  errorSubject,
  isLoading,
  isError,
  isFetching = false,
  isEmpty = false,
  emptyMessage = 'Нет данных за выбранный период.',
  onRetry,
  skeleton,
  children,
  className,
  bodyClassName = 'px-4 pb-4',
}: WidgetProps) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>

      <div className={cn('flex min-h-0 flex-1 flex-col', bodyClassName)}>
        {isLoading ? (
          skeleton
        ) : isError ? (
          <WidgetError subject={errorSubject} onRetry={onRetry} />
        ) : isEmpty ? (
          <p className="px-1 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col transition-opacity',
              isFetching && 'opacity-60',
            )}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
