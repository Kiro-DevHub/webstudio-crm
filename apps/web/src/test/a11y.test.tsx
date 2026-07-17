import { ClientSource, Role } from '@crm/shared';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { TasksPage } from '@/pages/TasksPage';
import { ClientFormDialog } from '@/features/clients/ClientFormDialog';
import { Toaster } from '@/components/ui/sonner';
import type { ClientListItem } from '@/features/clients/clients.types';
import { renderWithProviders } from '@/test/utils';
import { http, HttpResponse, server } from '@/test/server';

// jsdom computes no layout, so axe auto-skips colour-contrast; these runs cover structure:
// labels, roles, names, aria wiring, heading order. `region` is disabled because components are
// rendered outside the app's <main> landmark here. Returns compact "id: help" strings so a
// failure names the offending rule instead of dumping the whole axe result.
async function axeViolations(container: HTMLElement): Promise<string[]> {
  const results = await axe(container, { rules: { region: { enabled: false } } });
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}

const CLIENT: ClientListItem = {
  id: 'a',
  companyName: 'ООО «Ромашка»',
  contactName: 'Иван Петров',
  email: 'a@test.dev',
  phone: '+7 999 123-45-67',
  source: ClientSource.WEBSITE,
  ownerId: 'u1',
  owner: { id: 'u1', name: 'Ольга Соколова', avatarColor: '#6366f1', role: Role.MANAGER },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  _count: { deals: 2 },
};

describe('accessibility (axe)', () => {
  it('LoginPage has no violations', async () => {
    const { container } = renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { route: '/login' },
    );
    await screen.findByLabelText('Email');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('NotFoundPage has no violations', async () => {
    const { container } = renderWithProviders(<NotFoundPage />, { route: '/nope' });
    await screen.findByRole('heading', { name: 'Страница не найдена' });
    expect(await axeViolations(container)).toEqual([]);
  });

  it('ClientsPage with data has no violations', async () => {
    server.use(
      http.get('*/api/users/lite', () => HttpResponse.json([])),
      http.get('*/api/clients', () =>
        HttpResponse.json({
          data: [CLIENT],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      ),
    );
    const { container } = renderWithProviders(<ClientsPage />, { route: '/clients' });
    await screen.findAllByText('ООО «Ромашка»');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('TasksPage empty state has no violations', async () => {
    server.use(http.get('*/api/tasks', () => HttpResponse.json({ data: [], meta: {} })));
    const { container } = renderWithProviders(<TasksPage />, { route: '/tasks' });
    await screen.findByText(/Задач нет|Под фильтры/);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('ClientFormDialog (open) has no violations', async () => {
    server.use(http.get('*/api/users/lite', () => HttpResponse.json([])));
    renderWithProviders(<ClientFormDialog open onOpenChange={() => {}} client={null} />, {
      route: '/clients',
    });
    await screen.findByRole('dialog');
    // The dialog portals to <body>, so scan the whole document, not just the render root.
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('toast accessibility', () => {
  it('renders toasts inside an aria-live region', async () => {
    renderWithProviders(<Toaster />, { route: '/' });
    toast('Готово');

    await waitFor(() => {
      expect(screen.getByText('Готово')).toBeInTheDocument();
    });
    // Sonner announces toasts through a polite live region.
    expect(document.querySelector('[aria-live]')).not.toBeNull();
  });
});
