import { formatNumber } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { TaskGroup } from './group-tasks';
import { TaskItem } from './TaskItem';

interface TaskGroupSectionProps {
  group: TaskGroup;
}

/** A due-date bucket with its heading and count; the overdue heading wears the warning hue. */
export function TaskGroupSection({ group }: TaskGroupSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-baseline gap-2 text-sm font-medium">
        <span className={cn(group.key === 'overdue' && 'text-warning')}>{group.label}</span>
        <span className="tabular font-mono text-xs text-muted-foreground">
          {formatNumber(group.tasks.length)}
        </span>
      </h2>
      <ul className="flex flex-col divide-y divide-border rounded-xl bg-card px-4 py-1 ring-1 ring-foreground/10">
        {group.tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
}
