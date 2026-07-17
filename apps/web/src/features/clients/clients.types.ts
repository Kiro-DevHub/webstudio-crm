import type { ActivityType, ClientSource, DealStage } from '@crm/shared';
import type { UserLite } from '@/features/users/users.types';

export interface ClientListItem {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  source: ClientSource;
  ownerId: string;
  owner: UserLite;
  createdAt: string;
  updatedAt: string;
  _count: { deals: number };
}

export interface ClientDeal {
  id: string;
  title: string;
  amount: number;
  stage: DealStage;
  createdAt: string;
}

export interface ClientActivity {
  id: string;
  type: ActivityType;
  payload: Record<string, unknown>;
  dealId: string | null;
  createdAt: string;
  user: UserLite;
}

export interface ClientDetail extends ClientListItem {
  deals: ClientDeal[];
  activities: ClientActivity[];
}

export const CLIENT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'companyName',
  'contactName',
  'email',
] as const;
export type ClientSortField = (typeof CLIENT_SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export interface ClientsListParams {
  page: number;
  limit: number;
  sortBy: ClientSortField;
  sortOrder: SortOrder;
  search?: string;
  source?: ClientSource;
  ownerId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ClientFormInput {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  source: ClientSource;
  ownerId?: string;
}
