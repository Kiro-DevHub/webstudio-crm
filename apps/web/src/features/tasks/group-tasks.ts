import { TaskStatus } from '@crm/shared';
import type { TaskListItem } from './tasks.types';

export type TaskGroupKey = 'overdue' | 'today' | 'upcoming';

export interface TaskGroup {
  key: TaskGroupKey;
  label: string;
  tasks: TaskListItem[];
}

const GROUP_LABELS: Record<TaskGroupKey, string> = {
  overdue: 'Просроченные',
  today: 'Сегодня',
  upcoming: 'Предстоящие',
};

/** A task counts as overdue only while it is still open — a finished task is never overdue. */
export function isTaskOverdue(task: TaskListItem, now: number = Date.now()): boolean {
  return task.status !== TaskStatus.DONE && new Date(task.dueDate).getTime() < startOfToday(now);
}

function startOfToday(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Splits tasks (already sorted by due date ascending) into the three dashboard buckets:
 * anything due before today, anything due today, and everything later. Empty groups are
 * dropped so the list never shows a bare heading.
 */
export function groupTasks(tasks: TaskListItem[], now: number = Date.now()): TaskGroup[] {
  const dayStart = startOfToday(now);
  const nextDayStart = dayStart + 24 * 60 * 60 * 1000;

  const buckets: Record<TaskGroupKey, TaskListItem[]> = { overdue: [], today: [], upcoming: [] };
  for (const task of tasks) {
    const due = new Date(task.dueDate).getTime();
    if (due < dayStart) buckets.overdue.push(task);
    else if (due < nextDayStart) buckets.today.push(task);
    else buckets.upcoming.push(task);
  }

  return (['overdue', 'today', 'upcoming'] as const)
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, label: GROUP_LABELS[key], tasks: buckets[key] }));
}
