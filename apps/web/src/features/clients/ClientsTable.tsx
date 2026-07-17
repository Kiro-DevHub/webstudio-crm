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
  Building2,
  ChevronLeft,
  ChevronRight,
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
import { CLIENT_SOURCE_LABELS, formatDate } from '@/lib/labels';
import { buildClientsColumns } from './columns';
import type { ClientListItem, ClientSortField, Paginated, SortOrder } from './clients.types';

interface ClientsTableProps {
  data: Paginated<ClientListItem> | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  page: number;
  sortBy: ClientSortField;
  sortOrder: SortOrder;
  onSortingChange: (sortBy: ClientSortField, sortOrder: SortOrder) => void;
  onPageChange: (page: number) => void;
  onRowOpen: (client: ClientListItem) => void;
  canMutate: (client: ClientListItem) => boolean;
  onEdit: (client: ClientListItem) => void;
  onDelete: (client: ClientListItem) => void;
  onCreate: () => void;
}

export function ClientsTable({
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
  canMutate,
  onEdit,
  onDelete,
  onCreate,
}: ClientsTableProps) {
  const columns = buildClientsColumns({ canMutate, onEdit, onDelete });
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
      onSortingChange(first.id as ClientSortField, first.desc ? 'desc' : 'asc');
    },
    getCoreRowModel: getCoreRowModel(),
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <AlertCircle aria-hidden="true" className="size-6 text-destructive" strokeWidth={1.5} />
        <p className="max-w-sm text-sm text-muted-foreground">
          Не удалось загрузить список клиентов. Проверьте подключение и попробуйте ещё раз.
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
        <span className="sr-only">Загрузка клиентов…</span>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <Building2 aria-hidden="true" className="size-6 text-muted-foreground" strokeWidth={1.5} />
        <p className="max-w-sm text-sm text-muted-foreground">
          Клиенты не найдены. Измените фильтры или добавьте первого клиента.
        </p>
        <Button type="button" onClick={onCreate}>
          Добавить клиента
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
                  <TableCell
                    key={cell.id}
                    onClick={(event) => {
                      if (cell.column.id === 'actions') event.stopPropagation();
                    }}
                  >
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
        {rows.map((client) => (
          <li key={client.id}>
            <button
              type="button"
              onClick={() => {
                onRowOpen(client);
              }}
              className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{client.companyName}</span>
                  <span className="text-xs text-muted-foreground">{client.contactName}</span>
                </div>
                <Badge variant="outline">{CLIENT_SOURCE_LABELS[client.source]}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{client.email}</span>
                <span className="tabular font-mono">{formatDate(client.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserAvatar name={client.owner.name} color={client.owner.avatarColor} />
                  <span className="text-xs">{client.owner.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">Сделок: {client._count.deals}</span>
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
