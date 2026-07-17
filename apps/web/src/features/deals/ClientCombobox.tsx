import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxControl,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import { fetchClients } from '@/features/clients/clients.api';
import type { ClientListItem } from '@/features/clients/clients.types';
import type { DealClientLite } from './deals.types';

const SEARCH_DEBOUNCE_MS = 300;

interface ClientComboboxProps {
  value: DealClientLite | null;
  onChange: (client: DealClientLite | null) => void;
  id?: string;
  placeholder?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * A client picker that searches on the server: the studio's client base outgrows a
 * static dropdown, so every keystroke (debounced) asks the API for matches.
 */
export function ClientCombobox({
  value,
  onChange,
  id,
  placeholder = 'Найдите клиента…',
  ...aria
}: ClientComboboxProps) {
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');

  // The popup list follows what the user types, debounced against the API.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(inputValue.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [inputValue]);

  const { data, isFetching } = useQuery({
    queryKey: ['clients', 'combobox', search],
    queryFn: () =>
      fetchClients({
        page: 1,
        limit: 20,
        sortBy: 'companyName',
        sortOrder: 'asc',
        search: search === '' ? undefined : search,
      }),
    placeholderData: keepPreviousData,
  });

  const clients = data?.data ?? [];

  return (
    <Combobox
      items={clients}
      value={value}
      onValueChange={(next) => {
        onChange(next === null ? null : { id: next.id, companyName: next.companyName });
      }}
      onInputValueChange={setInputValue}
      filter={null}
      itemToStringLabel={(client: DealClientLite) => client.companyName}
      isItemEqualToValue={(a: DealClientLite, b: DealClientLite) => a.id === b.id}
    >
      <ComboboxControl>
        <ComboboxInput id={id} placeholder={placeholder} {...aria} />
        {value !== null && <ComboboxClear />}
        <ComboboxTrigger />
      </ComboboxControl>
      <ComboboxContent>
        <ComboboxStatus>{isFetching ? 'Поиск…' : null}</ComboboxStatus>
        <ComboboxEmpty>{isFetching ? null : 'Клиенты не найдены'}</ComboboxEmpty>
        <ComboboxList>
          {(client: ClientListItem) => (
            <ComboboxItem key={client.id} value={client}>
              <span className="truncate">{client.companyName}</span>
              <span className="truncate text-xs text-muted-foreground">{client.contactName}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
