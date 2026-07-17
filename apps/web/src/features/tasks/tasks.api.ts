import type { TaskStatus } from '@crm/shared';
import { api } from '@/lib/api';
import type { Paginated } from '@/lib/pagination';
import type { MyTasksParams, TaskListItem } from './tasks.types';

export const tasksKeys = {
  all: ['tasks'] as const,
  lists: ['tasks', 'list'] as const,
  list: (params: MyTasksParams) => ['tasks', 'list', params] as const,
};

/**
 * The whole of the user's matching tasks in one page: the view groups them by due date
 * client-side, so a server page boundary would split a group. The set is a personal task
 * list, not a studio-wide table, so it stays small.
 */
export async function fetchMyTasks(params: MyTasksParams): Promise<TaskListItem[]> {
  const { data } = await api.get<Paginated<TaskListItem>>('/tasks', {
    params: { ...params, limit: 100, sortBy: 'dueDate', sortOrder: 'asc' },
  });
  return data.data;
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<TaskListItem> {
  const { data } = await api.patch<TaskListItem>(`/tasks/${id}`, { status });
  return data;
}
