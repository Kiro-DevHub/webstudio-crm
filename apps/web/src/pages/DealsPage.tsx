import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DealFormDialog } from '@/features/deals/DealFormDialog';
import { DealsBoard } from '@/features/deals/DealsBoard';
import { DealsTable } from '@/features/deals/DealsTable';
import { DealsToolbar } from '@/features/deals/DealsToolbar';
import { useDealsList } from '@/features/deals/useDeals';
import { useDealsSearchParams } from '@/features/deals/useDealsSearchParams';

export function DealsPage() {
  const navigate = useNavigate();
  const {
    view,
    search,
    ownerId,
    clientId,
    boardParams,
    listParams,
    setView,
    setSearch,
    setOwnerId,
    setClientId,
    setPage,
    setSorting,
  } = useDealsSearchParams();

  // The table's query only runs while the table is visible; the board has its own.
  const list = useDealsList(listParams, view === 'table');
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">Сделки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Воронка студии: перетаскивайте карточки между стадиями или закрывайте сделки в зоны
          «Выиграна» и «Проиграна».
        </p>
      </div>

      <div className="shrink-0">
        <DealsToolbar
          search={search}
          ownerId={ownerId}
          clientId={clientId}
          view={view}
          onSearchChange={setSearch}
          onOwnerChange={setOwnerId}
          onClientChange={setClientId}
          onViewChange={setView}
          onCreate={() => {
            setCreateOpen(true);
          }}
        />
      </div>

      {view === 'board' ? (
        <DealsBoard
          params={boardParams}
          onCreate={() => {
            setCreateOpen(true);
          }}
        />
      ) : (
        <div className="min-h-0 overflow-y-auto">
          <DealsTable
            data={list.data}
            isLoading={list.isLoading || (list.isFetching && list.data === undefined)}
            isError={list.isError}
            onRetry={() => void list.refetch()}
            page={listParams.page}
            sortBy={listParams.sortBy}
            sortOrder={listParams.sortOrder}
            onSortingChange={setSorting}
            onPageChange={setPage}
            onRowOpen={(deal) => {
              void navigate(`/deals/${deal.id}`);
            }}
            onCreate={() => {
              setCreateOpen(true);
            }}
          />
        </div>
      )}

      <DealFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
