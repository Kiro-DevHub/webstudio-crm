import type { DealStage, TaskStatus } from '@crm/shared';
import type { UserLite } from '@/features/users/users.types';

/** Mirrors the API's task list item (Task + assignee + its deal). */
export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string;
  dealId: string | null;
  assigneeId: string;
  assignee: UserLite;
  deal: { id: string; title: string; stage: DealStage } | null;
  createdAt: string;
}

/** The current user's task list, scoped by the toolbar filters. */
export interface MyTasksParams {
  /** Always the signed-in user — /tasks shows your own work. */
  assigneeId: string;
  status?: TaskStatus;
  overdue?: boolean;
  dealId?: string;
}
