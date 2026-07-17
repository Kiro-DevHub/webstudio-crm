import type { DealStage, TaskStatus } from '@crm/shared';
import { api } from '@/lib/api';
import type { Paginated } from '@/lib/pagination';
import type {
  DealDetail,
  DealFormInput,
  DealListItem,
  DealNote,
  DealTask,
  DealsBoard,
  DealsBoardParams,
  DealsListParams,
  TaskFormInput,
} from './deals.types';

export const dealsKeys = {
  all: ['deals'] as const,
  /** Prefix matching every cached board variant — the optimistic update walks all of them. */
  boards: ['deals', 'board'] as const,
  board: (params: DealsBoardParams) => ['deals', 'board', params] as const,
  list: (params: DealsListParams) => ['deals', 'list', params] as const,
  detail: (id: string) => ['deals', 'detail', id] as const,
};

export async function fetchDealsBoard(params: DealsBoardParams): Promise<DealsBoard> {
  const { data } = await api.get<DealsBoard>('/deals/board', { params });
  return data;
}

export async function fetchDeals(params: DealsListParams): Promise<Paginated<DealListItem>> {
  const { data } = await api.get<Paginated<DealListItem>>('/deals', { params });
  return data;
}

export async function fetchDeal(id: string): Promise<DealDetail> {
  const { data } = await api.get<DealDetail>(`/deals/${id}`);
  return data;
}

export async function createDeal(input: DealFormInput): Promise<DealListItem> {
  const { data } = await api.post<DealListItem>('/deals', input);
  return data;
}

export interface ChangeStageInput {
  id: string;
  stage: DealStage;
  lostReason?: string;
}

export async function changeDealStage({ id, stage, lostReason }: ChangeStageInput): Promise<void> {
  await api.patch(`/deals/${id}/stage`, { stage, lostReason });
}

export async function createDealTask(input: TaskFormInput): Promise<DealTask> {
  const { data } = await api.post<DealTask>('/tasks', input);
  return data;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<DealTask> {
  const { data } = await api.patch<DealTask>(`/tasks/${id}`, { status });
  return data;
}

export async function createNote(dealId: string, body: string): Promise<DealNote> {
  const { data } = await api.post<DealNote>(`/deals/${dealId}/notes`, { body });
  return data;
}

export async function deleteNote(dealId: string, noteId: string): Promise<void> {
  await api.delete(`/deals/${dealId}/notes/${noteId}`);
}
