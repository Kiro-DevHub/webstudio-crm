import { AlertTriangle, ListChecks, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { groupTasks } from '@/features/tasks/group-tasks';
import { TaskGroupSection } from '@/features/tasks/TaskGroupSection';
import { TasksToolbar } from '@/features/tasks/TasksToolbar';
import { useMyTasks } from '@/features/tasks/useTasks';
import { useTasksParams } from '@/features/tasks/useTasksParams';
import { cn } from '@/lib/utils';

export function TasksPage() {
  const { user } = useAuth();
  const { params, status, overdue, dealId, hasFilters, setStatus, setOverdue, setDealId, clear } =
    useTasksParams(user?.id ?? '');
  const { data, isLoading, isError, isFetching, refetch } = useMyTasks(params);

  const groups = useMemo(() => (data ? groupTasks(data) : []), [data]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Мои задачи</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ваши задачи по срокам: просроченные, на сегодня и предстоящие. Отметьте выполненные.
        </p>
      </div>

      <TasksToolbar
        status={status}
        overdue={overdue}
        dealId={dealId}
        hasFilters={hasFilters}
        onStatusChange={setStatus}
        onOverdueChange={setOverdue}
        onDealChange={setDealId}
        onClear={clear}
      />

      {isLoading ? (
        <div className="flex flex-col gap-6">
          {[3, 2].map((rows, groupIndex) => (
            <div key={groupIndex} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                {Array.from({ length: rows }).map((_, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Skeleton className="size-4 rounded" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-4 py-12 text-center ring-1 ring-foreground/10">
          <AlertTriangle
            aria-hidden="true"
            className="size-5 text-muted-foreground"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted-foreground">Не удалось загрузить задачи.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            <RotateCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <ListChecks
            aria-hidden="true"
            className="size-6 text-muted-foreground"
            strokeWidth={1.5}
          />
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasFilters
              ? 'Под фильтры ничего не подходит. Попробуйте изменить или сбросить их.'
              : 'Задач нет — всё разобрано. Новые появятся здесь, как только их назначат.'}
          </p>
        </div>
      ) : (
        <div className={cn('flex flex-col gap-6 transition-opacity', isFetching && 'opacity-60')}>
          {groups.map((group) => (
            <TaskGroupSection key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
