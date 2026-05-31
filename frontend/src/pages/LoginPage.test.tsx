import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '@/store/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
    mockNavigate.mockClear();
  });

  it('renders email and password fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    renderLoginPage();
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));
    expect(await screen.findByText(/email inválido/i)).toBeInTheDocument();
  });

  it('redirects to dashboard on successful login', async () => {
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message on invalid credentials', async () => {
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(await screen.findByText(/credenciales inválidas/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
