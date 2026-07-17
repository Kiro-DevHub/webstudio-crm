import { DealStage, Role } from '@crm/shared';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { AlertCircle, Handshake } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { OPEN_DEAL_STAGES } from '@/lib/labels';
import { BoardColumn } from './BoardColumn';
import { ClosedDropZone } from './ClosedDropZone';
import { DealCardContent } from './DealCard';
import { LostReasonDialog } from './LostReasonDialog';
import type { DealBoardItem, DealsBoardParams } from './deals.types';
import { useChangeDealStage, useDealsBoard } from './useDeals';

/** Pointer position decides the target; rect overlap is the fallback near edges. */
const collisionDetection: CollisionDetection = (args) => {
  const byPointer = pointerWithin(args);
  return byPointer.length > 0 ? byPointer : rectIntersection(args);
};

function isDealStage(value: unknown): value is DealStage {
  return typeof value === 'string' && value in DealStage;
}

interface DealsBoardProps {
  params: DealsBoardParams;
  onCreate: () => void;
}

export function DealsBoard({ params, onCreate }: DealsBoardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isFetching, isError, refetch } = useDealsBoard(params);
  const changeStage = useChangeDealStage();

  const [activeDeal, setActiveDeal] = useState<DealBoardItem | null>(null);
  const [lostCandidate, setLostCandidate] = useState<DealBoardItem | null>(null);
  /** A drop fires a click on the source card right after; this flag swallows that click. */
  const justDropped = useRef(false);

  // The 4px threshold keeps plain clicks (open the deal) from starting a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const dealsByStage = useMemo(() => {
    const groups = new Map<DealStage, DealBoardItem[]>(
      OPEN_DEAL_STAGES.map((stage) => [stage, []]),
    );
    for (const deal of data?.deals ?? []) {
      groups.get(deal.stage)?.push(deal);
    }
    return groups;
  }, [data]);

  const canMutate = (deal: DealBoardItem) => user?.role === Role.ADMIN || deal.ownerId === user?.id;

  const openDeal = (deal: DealBoardItem) => {
    if (justDropped.current) return;
    void navigate(`/deals/${deal.id}`);
  };

  const moveDeal = (deal: DealBoardItem, stage: DealStage) => {
    if (stage === deal.stage) return;
    if (stage === DealStage.LOST) {
      setLostCandidate(deal);
      return;
    }
    changeStage.mutate({ id: deal.id, stage });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const deal = event.active.data.current?.deal as DealBoardItem | undefined;
    setActiveDeal(deal ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    justDropped.current = true;
    setTimeout(() => {
      justDropped.current = false;
    }, 0);

    const deal = event.active.data.current?.deal as DealBoardItem | undefined;
    const target = event.over?.id;
    if (deal === undefined || !isDealStage(target)) return;
    moveDeal(deal, target);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <AlertCircle aria-hidden="true" className="size-6 text-destructive" strokeWidth={1.5} />
        <p className="max-w-sm text-sm text-muted-foreground">
          Не удалось загрузить доску сделок. Проверьте подключение и попробуйте ещё раз.
        </p>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Повторить
        </Button>
      </div>
    );
  }

  if (isLoading || (isFetching && data === undefined)) {
    return (
      <div
        className="flex min-h-0 flex-1 gap-3 overflow-hidden"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Загрузка доски сделок…</span>
        {OPEN_DEAL_STAGES.map((stage) => (
          <Skeleton key={stage} className="h-full max-h-96 w-70 shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }

  if (data === undefined) return null;

  const isEmpty = data.deals.length === 0;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveDeal(null);
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {isEmpty ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
              <Handshake
                aria-hidden="true"
                className="size-6 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="max-w-sm text-sm text-muted-foreground">
                Открытых сделок не найдено. Измените фильтры или создайте новую сделку.
              </p>
              <Button type="button" onClick={onCreate}>
                Новая сделка
              </Button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-1">
              {OPEN_DEAL_STAGES.map((stage) => (
                <BoardColumn
                  key={stage}
                  stage={stage}
                  deals={dealsByStage.get(stage) ?? []}
                  canMutate={canMutate}
                  onOpen={openDeal}
                  onMove={moveDeal}
                />
              ))}
            </div>
          )}

          <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <ClosedDropZone
              stage={DealStage.WON}
              summary={data.closed.won}
              dragActive={activeDeal !== null}
            />
            <ClosedDropZone
              stage={DealStage.LOST}
              summary={data.closed.lost}
              dragActive={activeDeal !== null}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDeal !== null && (
            <div className="flex rotate-2 cursor-grabbing flex-col gap-1 rounded-lg border border-border bg-card p-2.5 shadow-lg ring-1 ring-ring/20">
              <DealCardContent deal={activeDeal} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <LostReasonDialog
        deal={lostCandidate}
        onCancel={() => {
          setLostCandidate(null);
        }}
        onConfirm={(reason) => {
          if (lostCandidate !== null) {
            changeStage.mutate({ id: lostCandidate.id, stage: DealStage.LOST, lostReason: reason });
          }
          setLostCandidate(null);
        }}
      />
    </>
  );
}
