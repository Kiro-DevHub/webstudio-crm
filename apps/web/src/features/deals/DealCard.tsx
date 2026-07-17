import { DealStage } from '@crm/shared';
import { useDraggable } from '@dnd-kit/core';
import { AlarmClock, ArrowUpRight, CircleCheck, CircleX, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { DEAL_STAGE_LABELS, OPEN_DEAL_STAGES, formatMoney } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { DealBoardItem } from './deals.types';

/** The card face, shared between the board card and the drag overlay clone. */
export function DealCardContent({ deal }: { deal: DealBoardItem }) {
  const overdue = deal._count.tasks;
  return (
    <>
      <p className="line-clamp-2 pr-5 text-sm/tight font-medium text-foreground">{deal.title}</p>
      <p className="truncate text-xs text-muted-foreground">{deal.client.companyName}</p>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <span className="tabular font-mono text-xs font-medium">{formatMoney(deal.amount)}</span>
        <span className="flex items-center gap-1.5">
          {overdue > 0 && (
            <span
              className="flex items-center gap-0.5 text-xs font-medium text-warning"
              aria-label={`Просроченных задач: ${overdue}`}
              title={`Просроченных задач: ${overdue}`}
            >
              <AlarmClock aria-hidden="true" className="size-3.5" />
              {overdue}
            </span>
          )}
          <UserAvatar
            name={deal.owner.name}
            color={deal.owner.avatarColor}
            className="size-5 text-[9px]"
          />
        </span>
      </div>
    </>
  );
}

interface DealCardProps {
  deal: DealBoardItem;
  canMutate: boolean;
  onOpen: (deal: DealBoardItem) => void;
  onMove: (deal: DealBoardItem, stage: DealStage) => void;
}

/**
 * A draggable pipeline card. Pointer users drag it; keyboard users press Enter to get
 * the "Переместить на стадию…" menu — the accessible alternative to drag-and-drop.
 */
export function DealCard({ deal, canMutate, onOpen, onMove }: DealCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  // No `attributes` spread: keyboard access goes through the move menu (Enter), not the
  // KeyboardSensor, so dnd-kit's "press space to lift" instructions would only mislead.
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
    disabled: !canMutate,
  });

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      aria-haspopup="menu"
      aria-label={`Сделка «${deal.title}», ${deal.client.companyName}, ${formatMoney(deal.amount)}`}
      {...listeners}
      onClick={() => {
        onOpen(deal);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setMenuOpen(true);
        }
      }}
      className={cn(
        'group/card relative flex cursor-grab touch-manipulation flex-col gap-1 rounded-lg border border-border bg-card p-2.5 shadow-xs transition-[box-shadow,opacity] outline-none select-none hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <DealCardContent deal={deal} />

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              tabIndex={-1}
              aria-label={`Действия со сделкой «${deal.title}»`}
              className={cn(
                'absolute top-1 right-1 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100',
                menuOpen && 'opacity-100',
              )}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onPointerDown={(event) => {
                // Keep dnd-kit's PointerSensor from hijacking the click on the menu button.
                event.stopPropagation();
              }}
            />
          }
        >
          <MoreHorizontal aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              onOpen(deal);
            }}
          >
            <ArrowUpRight aria-hidden="true" />
            Открыть сделку
          </DropdownMenuItem>
          {canMutate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Переместить на стадию</DropdownMenuLabel>
                {OPEN_DEAL_STAGES.filter((stage) => stage !== deal.stage).map((stage) => (
                  <DropdownMenuItem
                    key={stage}
                    onClick={(event) => {
                      event.stopPropagation();
                      onMove(deal, stage);
                    }}
                  >
                    {DEAL_STAGE_LABELS[stage]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-success"
                onClick={(event) => {
                  event.stopPropagation();
                  onMove(deal, DealStage.WON);
                }}
              >
                <CircleCheck aria-hidden="true" />
                Выиграна
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onMove(deal, DealStage.LOST);
                }}
              >
                <CircleX aria-hidden="true" />
                Проиграна
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
