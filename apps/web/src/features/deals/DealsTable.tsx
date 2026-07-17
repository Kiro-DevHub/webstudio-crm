import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Handshake,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { DEAL_STAGE_BADGE_CLASS, DEAL_STAGE_LABELS, formatMoney } from '@/lib/labels';
import type { Paginated, SortOrder } from '@/lib/pagination';
import { buildDealsColumns } from './deals-columns';
import type { DealListItem, DealSortField } from './deals.types';

interface DealsTableProps {
  data: Paginated<DealListItem> | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  page: number;
  sortBy: DealSortField;
  sortOrder: SortOrder;
  onSortingChange: (sortBy: DealSortField, sortOrder: SortOrder) => void;
  onPageChange: (page: number) => void;
  onRowOpen: (deal: DealListItem) => void;
  onCreate: () => void;
}

/** The stage-6 table pattern verbatim: server sort/pagination, keyboard-openable rows. */
export function DealsTable({
  data,
  isLoading,
  isError,
  onRetry,
  page,
  sortBy,
  sortOrder,
  onSortingChange,
  onPageChange,
  onRowOpen,
  onCreate,
}: DealsTableProps) {
  const columns = buildDealsColumns();
  const rows = data?.data ?? [];
  const sorting: SortingState = [{ id: sortBy, desc: sortOrder === 'desc' }];

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    manualSorting: true,
    manualPagination: true,
    enableSortingRemoval: false,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const first = next[0];
      if (first === undefined) return;
      onSortingChange(first.id as DealSortField, first.desc ? 'desc' : 'asc');
    },
    getCoreRowModel: getCoreRowModel(),
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <AlertCircle aria-hidden="true" className="size-6 text-destructive" strokeWidth={1.5} />
        <p className="max-w-sm text-sm text-muted-foreground">
          Не удалось загрузить список сделок. Проверьте подключение и попробуйте ещё раз.
        </p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
        <span className="sr-only">Загрузка сделок…</span>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <Handshake aria-hidden="true" className="size-6 text-muted-foreground" strokeWidth={1.5} />
        <p className="max-w-sm text-sm text-muted-foreground">
          Сделки не найдены. Измените фильтры или создайте новую сделку.
        </p>
        <Button type="button" onClick={onCreate}>
          Новая сделка
        </Button>
      </div>
    );
  }

  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-3">
      {/* Desktop / tablet: real table */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead key={header.id}>
                      {canSort ? (
                        <button
                          type="button"
                          className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && (
                            <ArrowUp aria-hidden="true" className="size-3.5" />
                          )}
                          {header.column.getIsSorted() === 'desc' && (
                            <ArrowDown aria-hidden="true" className="size-3.5" />
                          )}
                          {header.column.getIsSorted() === false && (
                            <ArrowUpDown
                              aria-hidden="true"
                              className="size-3.5 text-muted-foreground/50"
                            />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                tabIndex={0}
                className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:-ring-offset-1"
                onClick={() => {
                  onRowOpen(row.original);
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onRowOpen(row.original);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((deal) => (
          <li key={deal.id}>
            <button
              type="button"
              onClick={() => {
                onRowOpen(deal);
              }}
              className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-foreground">{deal.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {deal.client.companyName}
                  </span>
                </div>
                <Badge className={DEAL_STAGE_BADGE_CLASS[deal.stage]} variant="secondary">
                  {DEAL_STAGE_LABELS[deal.stage]}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="tabular font-mono text-sm font-medium">
                  {formatMoney(deal.amount)}
                </span>
                <div className="flex items-center gap-2">
                  <UserAvatar name={deal.owner.name} color={deal.owner.avatarColor} />
                  <span className="text-xs">{deal.owner.name}</span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {meta !== undefined && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Стр. {meta.page} из {meta.totalPages} · всего {meta.total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Предыдущая страница"
              disabled={page <= 1}
              onClick={() => {
                onPageChange(page - 1);
              }}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Следующая страница"
              disabled={page >= meta.totalPages}
              onClick={() => {
                onPageChange(page + 1);
              }}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
