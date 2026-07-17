import { DealStage, TaskStatus } from '@crm/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  changeDealStage,
  createDeal,
  createDealTask,
  createNote,
  dealsKeys,
  deleteNote,
  fetchDeal,
  fetchDeals,
  fetchDealsBoard,
  updateTaskStatus,
} from './deals.api';
import type {
  DealFormInput,
  DealsBoard,
  DealsBoardParams,
  DealsListParams,
  TaskFormInput,
} from './deals.types';

export function useDealsBoard(params: DealsBoardParams) {
  return useQuery({
    queryKey: dealsKeys.board(params),
    queryFn: () => fetchDealsBoard(params),
    placeholderData: keepPreviousData,
  });
}

export function useDealsList(params: DealsListParams, enabled = true) {
  return useQuery({
    queryKey: dealsKeys.list(params),
    queryFn: () => fetchDeals(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: dealsKeys.detail(id ?? ''),
    queryFn: () => fetchDeal(id as string),
    enabled: id !== undefined,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DealFormInput) => createDeal(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealsKeys.all });
      // The clients table shows a deal count per client.
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

/** Applies a stage change to one cached board: move between columns or retire into WON/LOST. */
function moveDealInBoard(board: DealsBoard, id: string, stage: DealStage): DealsBoard {
  const deal = board.deals.find((item) => item.id === id);
  if (deal === undefined) return board;

  if (stage === DealStage.WON || stage === DealStage.LOST) {
    const key = stage === DealStage.WON ? 'won' : 'lost';
    const summary = board.closed[key];
    return {
      deals: board.deals.filter((item) => item.id !== id),
      closed: {
        ...board.closed,
        [key]: { count: summary.count + 1, amount: summary.amount + deal.amount },
      },
    };
  }

  return {
    ...board,
    deals: board.deals.map((item) => (item.id === id ? { ...item, stage } : item)),
  };
}

/**
 * The kanban drop. The card lands in its new column the instant it is dropped (onMutate
 * patches every cached board variant), and a failed PATCH puts everything back from the
 * snapshot and explains itself with a toast.
 */
export function useChangeDealStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changeDealStage,
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: dealsKeys.boards });
      const snapshots = queryClient.getQueriesData<DealsBoard>({ queryKey: dealsKeys.boards });
      queryClient.setQueriesData<DealsBoard>({ queryKey: dealsKeys.boards }, (board) =>
        board === undefined ? board : moveDealInBoard(board, id, stage),
      );
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      for (const [queryKey, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
      toast.error('Не удалось переместить сделку', { description: getApiErrorMessage(error) });
    },
    onSuccess: (_data, { stage }) => {
      if (stage === DealStage.WON) toast.success('Сделка закрыта: выиграна');
      if (stage === DealStage.LOST) toast.success('Сделка закрыта: проиграна');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: dealsKeys.all });
      // Stage badges also appear in the client drawer's deal list.
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

/** Task and note mutations refresh the whole deal cache: each of them writes an Activity. */
function useInvalidateDeals() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: dealsKeys.all });
  };
}

export function useCreateDealTask() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (input: TaskFormInput) => createDealTask(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTaskStatus() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useCreateNote(dealId: string) {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (body: string) => createNote(dealId, body),
    onSuccess: invalidate,
  });
}

export function useDeleteNote(dealId: string) {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(dealId, noteId),
    onSuccess: invalidate,
  });
}
