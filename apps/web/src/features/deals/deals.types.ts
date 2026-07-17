import type { ActivityType, DealStage, TaskStatus } from '@crm/shared';
import type { UserLite } from '@/features/users/users.types';
import type { SortOrder } from '@/lib/pagination';

export interface DealClientLite {
  id: string;
  companyName: string;
}

export interface DealListItem {
  id: string;
  title: string;
  /** Kopecks, like everywhere else. */
  amount: number;
  stage: DealStage;
  clientId: string;
  client: DealClientLite;
  ownerId: string;
  owner: UserLite;
  expectedCloseDate: string;
  closedAt: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealBoardItem extends DealListItem {
  /** The board include counts only overdue tasks (not DONE, dueDate in the past). */
  _count: { tasks: number };
}

export interface BoardClosedSummary {
  count: number;
  amount: number;
}

export interface DealsBoard {
  deals: DealBoardItem[];
  closed: { won: BoardClosedSummary; lost: BoardClosedSummary };
}

export interface DealTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string;
  dealId: string | null;
  assigneeId: string;
  assignee: UserLite;
  createdAt: string;
}

export interface DealNote {
  id: string;
  body: string;
  authorId: string;
  author: UserLite;
  createdAt: string;
}

export interface DealActivity {
  id: string;
  type: ActivityType;
  payload: Record<string, unknown>;
  createdAt: string;
  user: UserLite;
}

export interface DealClientFull extends DealClientLite {
  contactName: string;
  email: string;
  phone: string;
}

export interface DealDetail extends Omit<DealListItem, 'client'> {
  client: DealClientFull;
  tasks: DealTask[];
  notes: DealNote[];
  activities: DealActivity[];
}

export const DEAL_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'amount',
  'title',
  'expectedCloseDate',
  'closedAt',
] as const;
export type DealSortField = (typeof DEAL_SORT_FIELDS)[number];

export interface DealsBoardParams {
  search?: string;
  ownerId?: string;
  clientId?: string;
}

export interface DealsListParams extends DealsBoardParams {
  page: number;
  limit: number;
  sortBy: DealSortField;
  sortOrder: SortOrder;
  stage?: DealStage;
}

export interface DealFormInput {
  title: string;
  /** Kopecks. */
  amount: number;
  clientId: string;
  /** ISO string; the API coerces it to Date. */
  expectedCloseDate: string;
  ownerId?: string;
}

export interface TaskFormInput {
  title: string;
  dueDate: string;
  dealId: string;
}
