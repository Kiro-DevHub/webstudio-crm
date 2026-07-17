import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clientsKeys,
  createClient,
  deleteClient,
  fetchClient,
  fetchClients,
  updateClient,
} from './clients.api';
import type { ClientFormInput, ClientsListParams } from './clients.types';

export function useClients(params: ClientsListParams) {
  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () => fetchClients(params),
    placeholderData: keepPreviousData,
  });
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: clientsKeys.detail(id ?? ''),
    queryFn: () => fetchClient(id as string),
    enabled: id !== null,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientFormInput) => createClient(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClientFormInput }) => updateClient(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}
