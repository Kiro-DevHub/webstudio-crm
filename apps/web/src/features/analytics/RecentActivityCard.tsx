import { Link } from 'react-router-dom';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { ACTIVITY_ICONS, describeActivity } from '@/lib/activity';
import { formatRelativeTime } from '@/lib/labels';
import type { RecentActivityEntry } from './analytics.types';

interface RecentActivityCardProps {
  data: RecentActivityEntry[];
}

/** The studio's pulse: who did what, most recent first, each linking back to its deal. */
export function RecentActivityCard({ data }: RecentActivityCardProps) {
  return (
    <ol className="flex flex-col">
      {data.map((entry, index) => {
        const Icon = ACTIVITY_ICONS[entry.type];
        const last = index === data.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-2.5 pb-4 last:pb-0">
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
              {Icon && <Icon className="size-3.5" />}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm/snug">{describeActivity(entry)}</span>
              {entry.deal && (
                <Link
                  to={`/deals/${entry.deal.id}`}
                  className="truncate text-xs text-primary underline-offset-2 hover:underline"
                >
                  {entry.deal.title}
                </Link>
              )}
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserAvatar
                  name={entry.user.name}
                  color={entry.user.avatarColor}
                  className="size-4 text-[8px]"
                />
                {entry.user.name} ·{' '}
                <time dateTime={entry.createdAt}>{formatRelativeTime(entry.createdAt)}</time>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
