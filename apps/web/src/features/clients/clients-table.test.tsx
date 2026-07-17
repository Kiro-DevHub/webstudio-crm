import { ClientSource, Role } from '@crm/shared';
import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientsPage } from '@/pages/ClientsPage';
import type { ClientListItem } from '@/features/clients/clients.types';
import { renderWithProviders } from '@/test/utils';
import { http, HttpResponse, server } from '@/test/server';

function client(id: string, companyName: string): ClientListItem {
  return {
    id,
    companyName,
    contactName: 'Иван Петров',
    email: `${id}@test.dev`,
    phone: '+7 999 123-45-67',
    source: ClientSource.WEBSITE,
    ownerId: 'u1',
    owner: { id: 'u1', name: 'Ольга Соколова', avatarColor: '#6366f1', role: Role.MANAGER },
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    _count: { deals: 2 },
  };
}

const PAGE_1 = [client('a', 'ООО «Ромашка»'), client('b', 'ООО «Лютик»')];
const PAGE_2 = [client('c', 'ООО «Василёк»')];

/** No CSS in jsdom, so the desktop table and the mobile card list both render; count via getAllBy. */
function usersLiteEmpty() {
  return http.get('*/api/users/lite', () => HttpResponse.json([]));
}

describe('ClientsPage / ClientsTable', () => {
  it('renders the clients returned by the API', async () => {
    server.use(
      usersLiteEmpty(),
      http.get('*/api/clients', () =>
        HttpResponse.json({ data: PAGE_1, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } }),
      ),
    );

    renderWithProviders(<ClientsPage />, { route: '/clients' });

    expect(await screen.findAllByText('ООО «Ромашка»')).not.toHaveLength(0);
    expect(screen.getAllByText('ООО «Лютик»').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1, name: 'Клиенты' })).toBeInTheDocument();
  });

  it('paginates: the next-page control fetches and shows the next page', async () => {
    server.use(
      usersLiteEmpty(),
      http.get('*/api/clients', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
        const meta = { page, limit: 2, total: 3, totalPages: 2 };
        return HttpResponse.json({ data: page === 1 ? PAGE_1 : PAGE_2, meta });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ClientsPage />, { route: '/clients' });

    expect(await screen.findAllByText('ООО «Ромашка»')).not.toHaveLength(0);
    expect(screen.getByText(/Стр\. 1 из 2/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Следующая страница' }));

    expect(await screen.findAllByText('ООО «Василёк»')).not.toHaveLength(0);
    expect(screen.getByText(/Стр\. 2 из 2/)).toBeInTheDocument();
    expect(screen.queryByText('ООО «Ромашка»')).not.toBeInTheDocument();
  });

  it('disables the previous-page control on the first page', async () => {
    server.use(
      usersLiteEmpty(),
      http.get('*/api/clients', () =>
        HttpResponse.json({ data: PAGE_1, meta: { page: 1, limit: 2, total: 3, totalPages: 2 } }),
      ),
    );

    renderWithProviders(<ClientsPage />, { route: '/clients' });
    await screen.findAllByText('ООО «Ромашка»');

    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Следующая страница' })).toBeEnabled();
  });

  it('shows an empty state when there are no clients', async () => {
    server.use(
      usersLiteEmpty(),
      http.get('*/api/clients', () =>
        HttpResponse.json({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
      ),
    );

    renderWithProviders(<ClientsPage />, { route: '/clients' });

    expect(await screen.findByText(/Клиенты не найдены/)).toBeInTheDocument();
  });

  it('shows an error state with a working retry', async () => {
    let shouldFail = true;
    server.use(
      usersLiteEmpty(),
      http.get('*/api/clients', () => {
        if (shouldFail) return new HttpResponse(null, { status: 500 });
        return HttpResponse.json({
          data: PAGE_1,
          meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ClientsPage />, { route: '/clients' });

    const alert = await screen.findByText(/Не удалось загрузить список клиентов/);
    const region = alert.closest('div') as HTMLElement;

    // The retry succeeds now.
    shouldFail = false;
    await user.click(within(region).getByRole('button', { name: 'Повторить' }));

    await waitFor(() => {
      expect(screen.getAllByText('ООО «Ромашка»').length).toBeGreaterThan(0);
    });
  });
});
