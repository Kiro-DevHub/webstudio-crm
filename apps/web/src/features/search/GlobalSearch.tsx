import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/labels';
import type { ClientListItem } from '@/features/clients/clients.types';
import type { DealListItem } from '@/features/deals/deals.types';
import { useGlobalSearch } from './useGlobalSearch';

const SEARCH_DEBOUNCE_MS = 400;

type ResultEntry = { type: 'client'; item: ClientListItem } | { type: 'deal'; item: DealListItem };

function entryId(entry: ResultEntry): string {
  return `global-search-option-${entry.type}-${entry.item.id}`;
}

/**
 * Topbar search across clients and deals. Keeps DOM focus on the input the whole time
 * (aria-activedescendant) rather than moving it into the list, so closing on Escape needs
 * no explicit refocus and arrow-key navigation never fights the caret.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(inputValue.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  const { clients, deals, isLoading, hasResults } = useGlobalSearch(query);

  const entries = useMemo<ResultEntry[]>(
    () => [
      ...clients.map((item): ResultEntry => ({ type: 'client', item })),
      ...deals.map((item): ResultEntry => ({ type: 'deal', item })),
    ],
    [clients, deals],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [entries.length, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeDropdown = () => {
    setOpen(false);
    inputRef.current?.focus();
  };

  const selectEntry = (entry: ResultEntry) => {
    if (entry.type === 'client') {
      void navigate(`/clients?clientId=${entry.item.id}`);
    } else {
      void navigate(`/deals/${entry.item.id}`);
    }
    setInputValue('');
    setQuery('');
    setOpen(false);
  };

  const showDropdown = open && query !== '';

  return (
    <div ref={containerRef} className="relative w-full max-w-72">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
      />
      <Input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="global-search-listbox"
        aria-activedescendant={
          showDropdown && entries[activeIndex] ? entryId(entries[activeIndex]) : undefined
        }
        aria-autocomplete="list"
        placeholder="Поиск клиентов и сделок…"
        aria-label="Поиск по CRM"
        className="pl-8"
        value={inputValue}
        onChange={(event) => {
          setInputValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query !== '') setOpen(true);
        }}
        onKeyDown={(event) => {
          if (!showDropdown || entries.length === 0) {
            if (event.key === 'Escape') closeDropdown();
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % entries.length);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => (index - 1 + entries.length) % entries.length);
          } else if (event.key === 'Enter') {
            event.preventDefault();
            const entry = entries[activeIndex];
            if (entry) selectEntry(entry);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            closeDropdown();
          }
        }}
      />

      {showDropdown && (
        <div
          id="global-search-listbox"
          role="listbox"
          aria-label="Результаты поиска"
          className="absolute top-full left-0 z-50 mt-1 max-h-96 w-full min-w-72 overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {isLoading && <div className="px-2.5 py-2 text-sm text-muted-foreground">Поиск…</div>}

          {!isLoading && !hasResults && (
            <div className="px-2.5 py-2 text-sm text-muted-foreground">Ничего не найдено</div>
          )}

          {!isLoading && clients.length > 0 && (
            <div role="group" aria-labelledby="global-search-clients-label" className="p-1">
              <div
                id="global-search-clients-label"
                className="px-1.5 py-1 text-xs font-medium text-muted-foreground"
              >
                Клиенты
              </div>
              {clients.map((client) => {
                const entry: ResultEntry = { type: 'client', item: client };
                const index = entries.findIndex(
                  (e) => e.type === 'client' && e.item.id === client.id,
                );
                return (
                  <ResultRow
                    key={client.id}
                    id={entryId(entry)}
                    active={activeIndex === index}
                    onMouseEnter={() => {
                      setActiveIndex(index);
                    }}
                    onClick={() => {
                      selectEntry(entry);
                    }}
                  >
                    <span className="truncate font-medium">{client.companyName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {client.contactName}
                    </span>
                  </ResultRow>
                );
              })}
            </div>
          )}

          {!isLoading && deals.length > 0 && (
            <div role="group" aria-labelledby="global-search-deals-label" className="p-1">
              <div
                id="global-search-deals-label"
                className="px-1.5 py-1 text-xs font-medium text-muted-foreground"
              >
                Сделки
              </div>
              {deals.map((deal) => {
                const entry: ResultEntry = { type: 'deal', item: deal };
                const index = entries.findIndex((e) => e.type === 'deal' && e.item.id === deal.id);
                return (
                  <ResultRow
                    key={deal.id}
                    id={entryId(entry)}
                    active={activeIndex === index}
                    onMouseEnter={() => {
                      setActiveIndex(index);
                    }}
                    onClick={() => {
                      selectEntry(entry);
                    }}
                  >
                    <span className="truncate font-medium">{deal.title}</span>
                    <span className="truncate text-xs text-muted-foreground font-mono tabular">
                      {deal.client.companyName} · {formatMoney(deal.amount)}
                    </span>
                  </ResultRow>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ResultRowProps {
  id: string;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  children: React.ReactNode;
}

function ResultRow({ id, active, onMouseEnter, onClick, children }: ResultRowProps) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      className={cn(
        'flex cursor-default flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm select-none',
        active && 'bg-accent text-accent-foreground',
      )}
      onMouseEnter={onMouseEnter}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
