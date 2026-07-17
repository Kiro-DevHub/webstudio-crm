import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { DEAL_STAGE_BADGE_CLASS, DEAL_STAGE_LABELS, formatDate, formatMoney } from '@/lib/labels';
import type { DealListItem } from './deals.types';

export function buildDealsColumns(): ColumnDef<DealListItem>[] {
  return [
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Сделка',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex max-w-72 flex-col">
          <span className="truncate font-medium text-foreground">{row.original.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {row.original.client.companyName}
          </span>
        </div>
      ),
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Сумма',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular font-mono text-xs font-medium">
          {formatMoney(row.original.amount)}
        </span>
      ),
    },
    {
      id: 'stage',
      accessorKey: 'stage',
      header: 'Стадия',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge className={DEAL_STAGE_BADGE_CLASS[row.original.stage]} variant="secondary">
          {DEAL_STAGE_LABELS[row.original.stage]}
        </Badge>
      ),
    },
    {
      id: 'owner',
      header: 'Владелец',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserAvatar name={row.original.owner.name} color={row.original.owner.avatarColor} />
          <span className="text-sm">{row.original.owner.name}</span>
        </div>
      ),
    },
    {
      id: 'expectedCloseDate',
      accessorKey: 'expectedCloseDate',
      header: 'Закрытие (план)',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular font-mono text-xs text-muted-foreground">
          {formatDate(row.original.expectedCloseDate)}
        </span>
      ),
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Создана',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular font-mono text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];
}
