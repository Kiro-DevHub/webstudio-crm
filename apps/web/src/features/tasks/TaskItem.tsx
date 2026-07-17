import { TaskStatus } from '@crm/shared';
import { Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { isTaskOverdue } from './group-tasks';
import type { TaskListItem } from './tasks.types';
import { useToggleTaskStatus } from './useTasks';

interface TaskItemProps {
  task: TaskListItem;
}

/** One task row: tick to complete, its due date, and a link back to the deal it belongs to. */
export function TaskItem({ task }: TaskItemProps) {
  const toggle = useToggleTaskStatus();
  const done = task.status === TaskStatus.DONE;
  const overdue = isTaskOverdue(task);

  return (
    <li className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      <Checkbox
        checked={done}
        disabled={toggle.isPending}
        aria-label={`Задача «${task.title}»${done ? ', выполнена' : ', отметить выполненной'}`}
        className="mt-0.5"
        onCheckedChange={(checked) => {
          toggle.mutate({ id: task.id, done: checked === true });
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('text-sm/snug', done && 'text-muted-foreground line-through')}>
          {task.title}
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span
            className={cn(
              'tabular font-mono',
              !done && overdue ? 'font-medium text-warning' : 'text-muted-foreground',
            )}
          >
            {done ? 'Выполнена · ' : overdue ? 'Просрочена · ' : 'До '}
            {formatDate(task.dueDate)}
          </span>
          {task.deal && (
            <Link
              to={`/deals/${task.deal.id}`}
              className="inline-flex min-w-0 items-center gap-1 text-primary underline-offset-2 hover:underline"
            >
              <Link2 aria-hidden="true" className="size-3 shrink-0" />
              <span className="truncate">{task.deal.title}</span>
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
