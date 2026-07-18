import { TaskStatus } from '@crm/shared';
import type { TaskListItem } from './tasks.types';

export type TaskGroupKey = 'overdue' | 'today' | 'upcoming' | 'done';

export interface TaskGroup {
  key: TaskGroupKey;
  label: string;
  tasks: TaskListItem[];
}

const GROUP_LABELS: Record<TaskGroupKey, string> = {
  overdue: 'Просроченные',
  today: 'Сегодня',
  upcoming: 'Предстоящие',
  done: 'Выполненные',
};

/** The minimal shape the overdue rule needs — satisfied by any task-like object. */
export interface OverdueCheckable {
  status: TaskStatus;
  dueDate: string;
}

/**
 * The single project-wide overdue rule: a task is overdue only while it is still open AND
 * its due date has passed. A finished task is never overdue, no matter how late it was done.
 */
export function isTaskOverdue(task: OverdueCheckable, now: number = Date.now()): boolean {
  return task.status !== TaskStatus.DONE && new Date(task.dueDate).getTime() < now;
}

function startOfToday(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Splits tasks (already sorted by due date ascending) into dashboard buckets: completed tasks
 * always land in "done" regardless of their due date, and the remaining open tasks split into
 * overdue / due today / later. Empty groups are dropped so the list never shows a bare heading.
 */
export function groupTasks(tasks: TaskListItem[], now: number = Date.now()): TaskGroup[] {
  const nextDayStart = startOfToday(now) + 24 * 60 * 60 * 1000;

  const buckets: Record<TaskGroupKey, TaskListItem[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    done: [],
  };
  for (const task of tasks) {
    if (task.status === TaskStatus.DONE) {
      buckets.done.push(task);
    } else if (isTaskOverdue(task, now)) {
      buckets.overdue.push(task);
    } else if (new Date(task.dueDate).getTime() < nextDayStart) {
      buckets.today.push(task);
    } else {
      buckets.upcoming.push(task);
    }
  }

  return (['overdue', 'today', 'upcoming', 'done'] as const)
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, label: GROUP_LABELS[key], tasks: buckets[key] }));
}
