import { DealStage } from '@crm/shared';
import type { DealsBoard } from './deals.types';

/**
 * Applies a stage change to one cached board, purely (no mutation of the input): move a card
 * between open columns, or retire it into the WON/LOST summary. This is the optimistic patch the
 * kanban drop applies to every cached board variant before the PATCH resolves; a failure restores
 * the pre-move snapshot. Extracted from the mutation hook so the move rules are unit-testable.
 */
export function moveDealInBoard(board: DealsBoard, id: string, stage: DealStage): DealsBoard {
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
