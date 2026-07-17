import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { CLIENT_SOURCE_LABELS, formatDate } from '@/lib/labels';
import type { ClientListItem } from './clients.types';

interface ClientsColumnsOptions {
  canMutate: (client: ClientListItem) => boolean;
  onEdit: (client: ClientListItem) => void;
  onDelete: (client: ClientListItem) => void;
}

export function buildClientsColumns({
  canMutate,
  onEdit,
  onDelete,
}: ClientsColumnsOptions): ColumnDef<ClientListItem>[] {
  return [
    {
      id: 'companyName',
      accessorKey: 'companyName',
      header: 'Компания',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.companyName}</span>
          <span className="text-xs text-muted-foreground">{row.original.contactName}</span>
        </div>
      ),
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      enableSorting: true,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.email}</span>,
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: 'Телефон',
      enableSorting: false,
      cell: ({ row }) => <span className="tabular font-mono text-xs">{row.original.phone}</span>,
    },
    {
      id: 'source',
      accessorKey: 'source',
      header: 'Источник',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant="outline">{CLIENT_SOURCE_LABELS[row.original.source]}</Badge>
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
      id: 'deals',
      header: 'Сделки',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular font-mono text-xs text-muted-foreground">
          {row.original._count.deals}
        </span>
      ),
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Создан',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular font-mono text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      // A screen-reader-only header keeps the column from being announced as empty.
      header: () => <span className="sr-only">Действия</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const client = row.original;
        if (!canMutate(client)) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Действия: ${client.companyName}`}
                />
              }
            >
              <MoreHorizontal aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  onEdit(client);
                }}
              >
                <Pencil aria-hidden="true" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  onDelete(client);
                }}
              >
                <Trash2 aria-hidden="true" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
