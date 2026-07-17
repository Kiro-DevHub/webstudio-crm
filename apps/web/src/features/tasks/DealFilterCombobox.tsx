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
import { fetchDeals } from '@/features/deals/deals.api';

const SEARCH_DEBOUNCE_MS = 300;

interface DealOption {
  id: string;
  title: string;
}

interface DealFilterComboboxProps {
  value: DealOption | null;
  onChange: (deal: DealOption | null) => void;
}

/** Filters the task list to one deal — searches deals by title on the server as you type. */
export function DealFilterCombobox({ value, onChange }: DealFilterComboboxProps) {
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(inputValue.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [inputValue]);

  const { data, isFetching } = useQuery({
    queryKey: ['deals', 'list', 'task-filter', search],
    queryFn: () =>
      fetchDeals({
        page: 1,
        limit: 20,
        sortBy: 'title',
        sortOrder: 'asc',
        search: search === '' ? undefined : search,
      }),
    placeholderData: keepPreviousData,
  });

  const deals = data?.data ?? [];

  return (
    <Combobox
      items={deals}
      value={value}
      onValueChange={(next: DealOption | null) => {
        onChange(next === null ? null : { id: next.id, title: next.title });
      }}
      onInputValueChange={setInputValue}
      filter={null}
      itemToStringLabel={(deal: DealOption) => deal.title}
      isItemEqualToValue={(a: DealOption, b: DealOption) => a.id === b.id}
    >
      <ComboboxControl>
        <ComboboxInput placeholder="Все сделки" aria-label="Фильтр по сделке" />
        {value !== null && <ComboboxClear />}
        <ComboboxTrigger />
      </ComboboxControl>
      <ComboboxContent>
        <ComboboxStatus>{isFetching ? 'Поиск…' : null}</ComboboxStatus>
        <ComboboxEmpty>{isFetching ? null : 'Сделки не найдены'}</ComboboxEmpty>
        <ComboboxList>
          {(deal: DealOption) => (
            <ComboboxItem key={deal.id} value={deal}>
              <span className="truncate">{deal.title}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
