import { Role } from '@crm/shared';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { renderWithProviders } from '@/test/utils';
import { http, HttpResponse, server } from '@/test/server';

const MANAGER = {
  id: 'u1',
  email: 'olga@crm.dev',
  name: 'Ольга Соколова',
  role: Role.MANAGER,
  avatarColor: '#6366f1',
};

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<div>Домашняя страница</div>} />
    </Routes>,
    { route: '/login' },
  );
}

describe('LoginPage', () => {
  it('shows required-field errors and sends no request on an empty submit', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    server.use(
      http.post('*/api/auth/login', () => {
        onLogin();
        return HttpResponse.json({ accessToken: 't' });
      }),
    );

    renderLogin();
    await user.click(await screen.findByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Введите email')).toBeInTheDocument();
    expect(screen.getByText('Введите пароль')).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(await screen.findByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Пароль'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Введите корректный email')).toBeInTheDocument();
  });

  it('submits valid credentials and redirects on success', async () => {
    const user = userEvent.setup();
    let sentBody: unknown;
    // Logged out until /auth/login succeeds, so the form renders before the session exists.
    let loggedIn = false;
    server.use(
      http.post('*/api/auth/login', async ({ request }) => {
        sentBody = await request.json();
        loggedIn = true;
        return HttpResponse.json({ accessToken: 'access-token' });
      }),
      http.get('*/api/auth/me', () =>
        loggedIn ? HttpResponse.json(MANAGER) : new HttpResponse(null, { status: 401 }),
      ),
    );

    renderLogin();
    await user.type(await screen.findByLabelText('Email'), 'olga@crm.dev');
    await user.type(screen.getByLabelText('Пароль'), 'Demo1234!');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Домашняя страница')).toBeInTheDocument();
    expect(sentBody).toEqual({ email: 'olga@crm.dev', password: 'Demo1234!' });
  });

  it('surfaces a Russian error message when the credentials are wrong', async () => {
    const user = userEvent.setup();
    server.use(http.post('*/api/auth/login', () => new HttpResponse(null, { status: 401 })));

    renderLogin();
    await user.type(await screen.findByLabelText('Email'), 'olga@crm.dev');
    await user.type(screen.getByLabelText('Пароль'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Неверный email или пароль.');
    await waitFor(() => {
      expect(screen.getByLabelText('Пароль')).toBeEnabled();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();

    const password = await screen.findByLabelText('Пароль');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Показать пароль' }));
    expect(password).toHaveAttribute('type', 'text');
  });
});
