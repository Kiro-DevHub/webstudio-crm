import { TaskStatus } from '@crm/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { analyticsKeys } from '@/features/analytics/analytics.api';
import { getApiErrorMessage } from '@/lib/api-error';
import { fetchMyTasks, setTaskStatus, tasksKeys } from './tasks.api';
import type { MyTasksParams, TaskListItem } from './tasks.types';

export function useMyTasks(params: MyTasksParams) {
  return useQuery({
    queryKey: tasksKeys.list(params),
    queryFn: () => fetchMyTasks(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * The completion checkbox, optimistic: the task flips status in every cached list the instant
 * it is ticked, and a failed PATCH restores the snapshot with a toast. Completing a task also
 * writes an Activity and shifts the overdue-tasks KPI, so analytics is invalidated on settle.
 */
export function useToggleTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      setTaskStatus(id, done ? TaskStatus.DONE : TaskStatus.TODO),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists });
      const snapshots = queryClient.getQueriesData<TaskListItem[]>({ queryKey: tasksKeys.lists });
      queryClient.setQueriesData<TaskListItem[]>({ queryKey: tasksKeys.lists }, (list) =>
        list?.map((task) =>
          task.id === id ? { ...task, status: done ? TaskStatus.DONE : TaskStatus.TODO } : task,
        ),
      );
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
      toast.error('Не удалось обновить задачу', { description: getApiErrorMessage(error) });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}
