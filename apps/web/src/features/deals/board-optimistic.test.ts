import { DealStage, Role } from '@crm/shared';
import { describe, expect, it } from 'vitest';
import { moveDealInBoard } from './board-optimistic';
import type { DealBoardItem, DealsBoard } from './deals.types';

function boardItem(id: string, stage: DealStage, amount: number): DealBoardItem {
  return {
    id,
    title: `Deal ${id}`,
    amount,
    stage,
    clientId: 'c1',
    client: { id: 'c1', companyName: 'ООО «Тест»' },
    ownerId: 'u1',
    owner: { id: 'u1', name: 'Ольга', avatarColor: '#6366f1', role: Role.MANAGER },
    expectedCloseDate: '2026-08-01T00:00:00.000Z',
    closedAt: null,
    lostReason: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    _count: { tasks: 0 },
  };
}

function makeBoard(): DealsBoard {
  return {
    deals: [boardItem('d1', DealStage.LEAD, 100_000), boardItem('d2', DealStage.BRIEF, 200_000)],
    closed: { won: { count: 3, amount: 900_000 }, lost: { count: 1, amount: 50_000 } },
  };
}

describe('moveDealInBoard', () => {
  it('moves a deal to another open column without touching closed totals', () => {
    const next = moveDealInBoard(makeBoard(), 'd1', DealStage.PROPOSAL);

    expect(next.deals.find((d) => d.id === 'd1')?.stage).toBe(DealStage.PROPOSAL);
    expect(next.deals).toHaveLength(2);
    expect(next.closed).toEqual({
      won: { count: 3, amount: 900_000 },
      lost: { count: 1, amount: 50_000 },
    });
  });

  it('retires a deal into the WON summary and removes it from the columns', () => {
    const next = moveDealInBoard(makeBoard(), 'd1', DealStage.WON);

    expect(next.deals.map((d) => d.id)).toEqual(['d2']);
    // Its amount folds into the WON drop zone total.
    expect(next.closed.won).toEqual({ count: 4, amount: 1_000_000 });
    expect(next.closed.lost).toEqual({ count: 1, amount: 50_000 });
  });

  it('retires a deal into the LOST summary', () => {
    const next = moveDealInBoard(makeBoard(), 'd2', DealStage.LOST);

    expect(next.deals.map((d) => d.id)).toEqual(['d1']);
    expect(next.closed.lost).toEqual({ count: 2, amount: 250_000 });
    expect(next.closed.won).toEqual({ count: 3, amount: 900_000 });
  });

  it('is a no-op for an unknown deal id', () => {
    const board = makeBoard();
    expect(moveDealInBoard(board, 'missing', DealStage.WON)).toBe(board);
  });

  it('does not mutate the input board', () => {
    const board = makeBoard();
    const snapshot = structuredClone(board);
    moveDealInBoard(board, 'd1', DealStage.WON);
    expect(board).toEqual(snapshot);
  });
});
