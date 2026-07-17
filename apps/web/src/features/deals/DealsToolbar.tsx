import { Columns3, Plus, Search, TableProperties, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClient } from '@/features/clients/useClients';
import { useUsersLite } from '@/features/users/useUsersLite';
import { cn } from '@/lib/utils';
import { ClientCombobox } from './ClientCombobox';
import type { DealsView } from './useDealsSearchParams';

const SEARCH_DEBOUNCE_MS = 400;
const ALL_VALUE = '__all__';

interface DealsToolbarProps {
  search: string;
  ownerId: string | undefined;
  clientId: string | undefined;
  view: DealsView;
  onSearchChange: (value: string) => void;
  onOwnerChange: (value: string | undefined) => void;
  onClientChange: (value: string | undefined) => void;
  onViewChange: (view: DealsView) => void;
  onCreate: () => void;
}

export function DealsToolbar({
  search,
  ownerId,
  clientId,
  view,
  onSearchChange,
  onOwnerChange,
  onClientChange,
  onViewChange,
  onCreate,
}: DealsToolbarProps) {
  const [searchInput, setSearchInput] = useState(search);
  const { data: owners } = useUsersLite();
  // A clientId restored from the URL arrives as a bare id; the combobox needs its name.
  const { data: filterClient } = useClient(clientId ?? null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The URL is the source of truth; a filter set elsewhere (e.g. browser back) must sync in.
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== search) onSearchChange(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-64">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Поиск по названию, клиенту…"
            aria-label="Поиск сделок"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
            }}
            className="pl-8"
          />
          {searchInput !== '' && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Очистить поиск"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              onClick={() => {
                setSearchInput('');
              }}
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>

        <Select
          value={ownerId ?? ALL_VALUE}
          onValueChange={(value) => {
            onOwnerChange(value === ALL_VALUE || value === null ? undefined : value);
          }}
        >
          <SelectTrigger aria-label="Фильтр по менеджеру" className="w-full sm:w-44">
            <SelectValue placeholder="Менеджер">
              {(value: string) =>
                value === ALL_VALUE
                  ? 'Все менеджеры'
                  : (owners?.find((owner) => owner.id === value)?.name ?? 'Менеджер')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Все менеджеры</SelectItem>
            {owners?.map((owner) => (
              <SelectItem key={owner.id} value={owner.id}>
                {owner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-full sm:w-56" aria-label="Фильтр по клиенту">
          <ClientCombobox
            placeholder="Все клиенты"
            value={
              clientId !== undefined && filterClient !== undefined
                ? { id: filterClient.id, companyName: filterClient.companyName }
                : null
            }
            onChange={(client) => {
              onClientChange(client?.id);
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label="Вид списка сделок"
          className="flex rounded-lg border border-border p-0.5"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={view === 'board'}
            className={cn('gap-1', view === 'board' && 'bg-muted text-foreground')}
            onClick={() => {
              onViewChange('board');
            }}
          >
            <Columns3 aria-hidden="true" />
            Доска
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={view === 'table'}
            className={cn('gap-1', view === 'table' && 'bg-muted text-foreground')}
            onClick={() => {
              onViewChange('table');
            }}
          >
            <TableProperties aria-hidden="true" />
            Таблица
          </Button>
        </div>

        <Button type="button" onClick={onCreate}>
          <Plus aria-hidden="true" />
          Новая сделка
        </Button>
      </div>
    </div>
  );
}
