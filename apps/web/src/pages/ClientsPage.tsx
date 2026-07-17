import { Role } from '@crm/shared';
import { useState } from 'react';
import { ClientDetailsDrawer } from '@/features/clients/ClientDetailsDrawer';
import { ClientFormDialog } from '@/features/clients/ClientFormDialog';
import { ClientsTable } from '@/features/clients/ClientsTable';
import { ClientsToolbar } from '@/features/clients/ClientsToolbar';
import { DeleteClientDialog } from '@/features/clients/DeleteClientDialog';
import type { ClientListItem } from '@/features/clients/clients.types';
import { useClients } from '@/features/clients/useClients';
import { useClientsSearchParams } from '@/features/clients/useClientsSearchParams';
import { useAuth } from '@/features/auth/useAuth';

export function ClientsPage() {
  const { user } = useAuth();
  const { params, setPage, setSearch, setSource, setOwnerId, setSorting } =
    useClientsSearchParams();
  const { data, isLoading, isFetching, isError, refetch } = useClients(params);

  const [formState, setFormState] = useState<{ open: boolean; client: ClientListItem | null }>({
    open: false,
    client: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<ClientListItem | null>(null);
  const [drawerClientId, setDrawerClientId] = useState<string | null>(null);

  const canMutate = (client: ClientListItem) =>
    user?.role === Role.ADMIN || client.ownerId === user?.id;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Клиенты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          База клиентов студии: поиск, фильтры по источнику и владельцу, карточка компании.
        </p>
      </div>

      <ClientsToolbar
        search={params.search ?? ''}
        source={params.source}
        ownerId={params.ownerId}
        onSearchChange={setSearch}
        onSourceChange={setSource}
        onOwnerChange={setOwnerId}
        onCreate={() => {
          setFormState({ open: true, client: null });
        }}
      />

      <ClientsTable
        data={data}
        isLoading={isLoading || (isFetching && data === undefined)}
        isError={isError}
        onRetry={() => void refetch()}
        page={params.page}
        sortBy={params.sortBy}
        sortOrder={params.sortOrder}
        onSortingChange={setSorting}
        onPageChange={setPage}
        onRowOpen={(client) => {
          setDrawerClientId(client.id);
        }}
        canMutate={canMutate}
        onEdit={(client) => {
          setFormState({ open: true, client });
        }}
        onDelete={(client) => {
          setDeleteTarget(client);
        }}
        onCreate={() => {
          setFormState({ open: true, client: null });
        }}
      />

      <ClientFormDialog
        open={formState.open}
        onOpenChange={(open) => {
          setFormState((state) => ({ ...state, open }));
        }}
        client={formState.client}
      />

      <DeleteClientDialog
        client={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />

      <ClientDetailsDrawer
        clientId={drawerClientId}
        onOpenChange={(open) => {
          if (!open) setDrawerClientId(null);
        }}
        onEdit={(client) => {
          setDrawerClientId(null);
          setFormState({ open: true, client });
        }}
        onDelete={(client) => {
          setDrawerClientId(null);
          setDeleteTarget(client);
        }}
      />
    </div>
  );
}
