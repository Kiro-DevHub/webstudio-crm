import { DealStage } from '@crm/shared';
import { useDroppable } from '@dnd-kit/core';
import { Trophy, XCircle } from 'lucide-react';
import { formatMoneyCompact } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { BoardClosedSummary } from './deals.types';

interface ClosedDropZoneProps {
  stage: typeof DealStage.WON | typeof DealStage.LOST;
  summary: BoardClosedSummary;
  /** True while any card is being dragged — the zones light up as targets. */
  dragActive: boolean;
}

/**
 * WON and LOST are not columns: a closed deal leaves the board. These two strips at the
 * bottom are pure drop targets, showing running totals of everything closed so far.
 */
export function ClosedDropZone({ stage, summary, dragActive }: ClosedDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const won = stage === DealStage.WON;
  const Icon = won ? Trophy : XCircle;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed px-3 text-sm transition-colors',
        won ? 'border-success/40 text-success' : 'border-destructive/40 text-destructive',
        dragActive && (won ? 'border-success bg-success/5' : 'border-destructive bg-destructive/5'),
        isOver && (won ? 'border-solid bg-success/15' : 'border-solid bg-destructive/15'),
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      <span className="font-medium">{won ? 'Выиграна' : 'Проиграна'}</span>
      <span className="tabular font-mono text-xs opacity-80">
        {summary.count} · {formatMoneyCompact(summary.amount)}
      </span>
    </div>
  );
}
