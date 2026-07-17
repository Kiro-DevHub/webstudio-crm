import { api } from '@/lib/api';
import type {
  ClientDetail,
  ClientFormInput,
  ClientListItem,
  ClientsListParams,
  Paginated,
} from './clients.types';

export const clientsKeys = {
  all: ['clients'] as const,
  list: (params: ClientsListParams) => ['clients', params] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
};

export async function fetchClients(params: ClientsListParams): Promise<Paginated<ClientListItem>> {
  const { data } = await api.get<Paginated<ClientListItem>>('/clients', { params });
  return data;
}

export async function fetchClient(id: string): Promise<ClientDetail> {
  const { data } = await api.get<ClientDetail>(`/clients/${id}`);
  return data;
}

export async function createClient(input: ClientFormInput): Promise<ClientListItem> {
  const { data } = await api.post<ClientListItem>('/clients', input);
  return data;
}

export async function updateClient(id: string, input: ClientFormInput): Promise<ClientListItem> {
  const { data } = await api.patch<ClientListItem>(`/clients/${id}`, input);
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}
