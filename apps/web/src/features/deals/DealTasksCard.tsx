import { Role, TaskStatus } from '@crm/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { useAuth } from '@/features/auth/useAuth';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { DealTask } from './deals.types';
import { useCreateDealTask, useUpdateTaskStatus } from './useDeals';

const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Введите название задачи').max(200),
  dueDate: z.string().min(1, 'Укажите срок'),
});
type TaskFormValues = z.input<typeof taskFormSchema>;

/** Default due date: in three days, in the date input's YYYY-MM-DD format. */
function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

function isOverdue(task: DealTask): boolean {
  return task.status !== TaskStatus.DONE && new Date(task.dueDate).getTime() < Date.now();
}

interface DealTasksCardProps {
  dealId: string;
  tasks: DealTask[];
}

export function DealTasksCard({ dealId, tasks }: DealTasksCardProps) {
  const { user } = useAuth();
  const updateStatus = useUpdateTaskStatus();
  const createTask = useCreateDealTask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: '', dueDate: defaultDueDate() },
  });

  const canToggle = (task: DealTask) => user?.role === Role.ADMIN || task.assigneeId === user?.id;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTask.mutateAsync({
        title: values.title,
        dueDate: new Date(`${values.dueDate}T12:00:00`).toISOString(),
        dealId,
      });
      reset({ title: '', dueDate: defaultDueDate() });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  const open = tasks.filter((task) => task.status !== TaskStatus.DONE).length;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <h2 className="text-sm font-medium">
        Задачи{' '}
        <span className="tabular font-mono text-xs text-muted-foreground">
          {open}/{tasks.length}
        </span>
      </h2>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Задач пока нет — добавьте первую, чтобы сделка не простаивала.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {tasks.map((task) => {
            const done = task.status === TaskStatus.DONE;
            const overdue = isOverdue(task);
            return (
              <li key={task.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                <Checkbox
                  checked={done}
                  disabled={!canToggle(task) || updateStatus.isPending}
                  aria-label={`Задача «${task.title}»${done ? ', выполнена' : ''}`}
                  onCheckedChange={(checked) => {
                    updateStatus.mutate(
                      { id: task.id, status: checked ? TaskStatus.DONE : TaskStatus.TODO },
                      {
                        onError: (error) => {
                          toast.error(getApiErrorMessage(error));
                        },
                      },
                    );
                  }}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn('truncate text-sm', done && 'text-muted-foreground line-through')}
                  >
                    {task.title}
                  </span>
                  <span
                    className={cn(
                      'tabular font-mono text-xs',
                      overdue ? 'font-medium text-warning' : 'text-muted-foreground',
                    )}
                  >
                    {overdue ? 'Просрочена · ' : 'До '}
                    {formatDate(task.dueDate)}
                  </span>
                </div>
                <UserAvatar
                  name={task.assignee.name}
                  color={task.assignee.avatarColor}
                  className="size-5 text-[9px]"
                />
              </li>
            );
          })}
        </ul>
      )}

      <form
        noValidate
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        className="flex flex-col gap-2 border-t border-border pt-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="task-title" className="sr-only">
              Название задачи
            </Label>
            <Input
              id="task-title"
              placeholder="Новая задача…"
              aria-invalid={errors.title !== undefined}
              aria-describedby={errors.title !== undefined ? 'task-title-error' : undefined}
              {...register('title')}
            />
            {errors.title && (
              <p id="task-title-error" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="task-due" className="sr-only">
              Срок задачи
            </Label>
            <Input
              id="task-due"
              type="date"
              className="tabular font-mono sm:w-36"
              aria-invalid={errors.dueDate !== undefined}
              aria-describedby={errors.dueDate !== undefined ? 'task-due-error' : undefined}
              {...register('dueDate')}
            />
            {errors.dueDate && (
              <p id="task-due-error" className="text-xs text-destructive">
                {errors.dueDate.message}
              </p>
            )}
          </div>
          <Button type="submit" variant="outline" disabled={createTask.isPending}>
            {createTask.isPending ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : (
              <Plus aria-hidden="true" />
            )}
            Добавить
          </Button>
        </div>
      </form>
    </section>
  );
}
