import { ACTIVITY_ICONS, describeActivity } from '@/lib/activity';
import { formatRelativeTime } from '@/lib/labels';
import type { DealActivity } from './deals.types';

interface DealActivityTimelineProps {
  activities: DealActivity[];
}

/** The deal's history, newest first: one icon, one sentence, who and when. */
export function DealActivityTimeline({ activities }: DealActivityTimelineProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">Активности пока нет.</p>;
  }

  return (
    <ol className="flex flex-col">
      {activities.map((activity, index) => {
        const Icon = ACTIVITY_ICONS[activity.type];
        const last = index === activities.length - 1;
        return (
          <li key={activity.id} className="relative flex gap-2.5 pb-4 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className="absolute top-6 left-3 h-[calc(100%-1.25rem)] w-px bg-border"
              />
            )}
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground"
            >
              <Icon className="size-3.5" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm/snug">{describeActivity(activity)}</span>
              <span className="text-xs text-muted-foreground">
                {activity.user.name} ·{' '}
                <time dateTime={activity.createdAt}>{formatRelativeTime(activity.createdAt)}</time>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
