import { Skeleton } from '@/components/ui/skeleton';

/** The revenue chart's footprint: one tall block the size of the plot. */
export function RevenueSkeleton() {
  return <Skeleton className="h-72 w-full" />;
}

/** Label-over-bar rows, for the funnel and lost-reasons widgets. */
export function BarsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Avatar + name + bar rows, for the top-managers widget. */
export function ManagersSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-1.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Icon dot + two text lines, for the activity feed. */
export function FeedSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-2.5">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
