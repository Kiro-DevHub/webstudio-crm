import type { DealStage } from '@crm/shared';
import { useDroppable } from '@dnd-kit/core';
import { DEAL_STAGE_LABELS, formatMoneyCompact } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { DealCard } from './DealCard';
import type { DealBoardItem } from './deals.types';

interface BoardColumnProps {
  stage: DealStage;
  deals: DealBoardItem[];
  canMutate: (deal: DealBoardItem) => boolean;
  onOpen: (deal: DealBoardItem) => void;
  onMove: (deal: DealBoardItem, stage: DealStage) => void;
}

/** One pipeline stage: header with count and total, then a scrollable drop list of cards. */
export function BoardColumn({ stage, deals, canMutate, onOpen, onMove }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((sum, deal) => sum + deal.amount, 0);

  return (
    <section
      aria-label={`Стадия «${DEAL_STAGE_LABELS[stage]}», сделок: ${deals.length}`}
      className="flex w-70 shrink-0 flex-col rounded-xl bg-muted/50"
    >
      <header className="flex items-baseline gap-1.5 px-3 pt-2.5 pb-1.5">
        <h3 className="text-sm font-medium">{DEAL_STAGE_LABELS[stage]}</h3>
        <span className="tabular font-mono text-xs text-muted-foreground">{deals.length}</span>
        <span className="tabular ml-auto font-mono text-xs text-muted-foreground">
          {total > 0 ? formatMoneyCompact(total) : '—'}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-b-xl p-2 pt-0.5 transition-colors',
          isOver && 'bg-accent/60',
        )}
      >
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            canMutate={canMutate(deal)}
            onOpen={onOpen}
            onMove={onMove}
          />
        ))}
        {deals.length === 0 && (
          <p className="rounded-lg border border-dashed border-border/80 px-3 py-4 text-center text-xs text-muted-foreground">
            Нет сделок
          </p>
        )}
      </div>
    </section>
  );
}
