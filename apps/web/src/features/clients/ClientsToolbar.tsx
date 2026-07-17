import { ClientSource } from '@crm/shared';
import { Plus, Search, X } from 'lucide-react';
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
import { useUsersLite } from '@/features/users/useUsersLite';
import { CLIENT_SOURCE_LABELS } from '@/lib/labels';

const SEARCH_DEBOUNCE_MS = 400;
const ALL_VALUE = '__all__';

interface ClientsToolbarProps {
  search: string;
  source: ClientSource | undefined;
  ownerId: string | undefined;
  onSearchChange: (value: string) => void;
  onSourceChange: (value: ClientSource | undefined) => void;
  onOwnerChange: (value: string | undefined) => void;
  onCreate: () => void;
}

export function ClientsToolbar({
  search,
  source,
  ownerId,
  onSearchChange,
  onSourceChange,
  onOwnerChange,
  onCreate,
}: ClientsToolbarProps) {
  const [searchInput, setSearchInput] = useState(search);
  const { data: owners } = useUsersLite();
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-64">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Поиск по компании, контакту, email…"
            aria-label="Поиск клиентов"
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
          value={source ?? ALL_VALUE}
          onValueChange={(value) => {
            onSourceChange(value === ALL_VALUE ? undefined : (value as ClientSource));
          }}
        >
          <SelectTrigger aria-label="Фильтр по источнику" className="w-full sm:w-44">
            <SelectValue placeholder="Источник">
              {(value: string) =>
                value === ALL_VALUE ? 'Все источники' : CLIENT_SOURCE_LABELS[value as ClientSource]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Все источники</SelectItem>
            {Object.values(ClientSource).map((value) => (
              <SelectItem key={value} value={value}>
                {CLIENT_SOURCE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={ownerId ?? ALL_VALUE}
          onValueChange={(value) => {
            onOwnerChange(value === ALL_VALUE || value === null ? undefined : value);
          }}
        >
          <SelectTrigger aria-label="Фильтр по владельцу" className="w-full sm:w-44">
            <SelectValue placeholder="Владелец">
              {(value: string) =>
                value === ALL_VALUE
                  ? 'Все владельцы'
                  : (owners?.find((owner) => owner.id === value)?.name ?? 'Владелец')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Все владельцы</SelectItem>
            {owners?.map((owner) => (
              <SelectItem key={owner.id} value={owner.id}>
                {owner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="button" onClick={onCreate} className="sm:self-start">
        <Plus aria-hidden="true" />
        Добавить клиента
      </Button>
    </div>
  );
}
