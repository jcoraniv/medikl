import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { mockAppointments } from '@/test/mocks/handlers';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/lib/config';
import { AppointmentsPage } from './AppointmentsPage';

const ADMIN_USER  = { id: 'u1', code: 99, email: 'admin@test.com',  fullName: 'Admin',       role: 'admin'  as const };
const DOCTOR_USER = { id: 'doctor-uuid', code: 2, email: 'doctor@test.com', fullName: 'Dra. García', role: 'doctor' as const };

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AppointmentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppointmentsPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'mock-token', user: ADMIN_USER, isAuthenticated: true });
  });

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /appointments/i })).toBeInTheDocument();
  });

  it('displays appointments after loading', async () => {
    renderPage();
    expect(await screen.findByText('Carlos López')).toBeInTheDocument();
  });

  it('shows status badge for each appointment', async () => {
    renderPage();
    expect(await screen.findByText('scheduled')).toBeInTheDocument();
  });

  it('shows empty state when there are no appointments', async () => {
    server.use(
      http.get(`${API_BASE_URL}/appointments`, () =>
        HttpResponse.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
      ),
    );
    renderPage();
    expect(await screen.findByText(/no appointments yet/i)).toBeInTheDocument();
  });

  it('opens new appointment dialog on button click', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /new appointment/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'New appointment' })).toBeInTheDocument();
  });

  // ─── Three-dots menu ──────────────────────────────────────────────────────

  it('shows the three-dots menu button for scheduled appointments', async () => {
    renderPage();
    await screen.findByText('Carlos López');
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('reveals Complete, Cancel and Emit result options on menu open', async () => {
    renderPage();
    await screen.findByText('Carlos López');
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(await screen.findByRole('menuitem', { name: /complete/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /emit result/i })).toBeInTheDocument();
  });

  it('does not show three-dots menu for completed appointments', async () => {
    server.use(
      http.get(`${API_BASE_URL}/appointments`, () =>
        HttpResponse.json({ data: [{ ...mockAppointments[0], status: 'completed' }], total: 1, page: 1, limit: 10, totalPages: 1 }),
      ),
    );
    renderPage();
    await screen.findByText('Carlos López');
    // completed appointments still show Emit result — menu is visible but no Complete/Cancel
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(await screen.findByRole('menuitem', { name: /emit result/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /complete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('hides three-dots menu entirely for cancelled appointments', async () => {
    server.use(
      http.get(`${API_BASE_URL}/appointments`, () =>
        HttpResponse.json({ data: [{ ...mockAppointments[0], status: 'cancelled' }], total: 1, page: 1, limit: 10, totalPages: 1 }),
      ),
    );
    renderPage();
    await screen.findByText('Carlos López');
    expect(screen.queryByRole('button', { name: /open menu/i })).not.toBeInTheDocument();
  });

  // ─── Doctor column visibility ─────────────────────────────────────────────

  it('shows Doctor column for admin role', async () => {
    renderPage();
    expect(await screen.findByText('Dra. García')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /doctor/i })).toBeInTheDocument();
  });

  it('hides Doctor column for doctor role', async () => {
    useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    renderPage();
    await screen.findByText('Carlos López');
    expect(screen.queryByRole('columnheader', { name: /doctor/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Dra. García')).not.toBeInTheDocument();
  });

  // ─── Appointment form — doctor field ──────────────────────────────────────

  it('shows doctor selector in form for admin role', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /new appointment/i }));
    await screen.findByRole('dialog');
    expect(screen.getByLabelText(/doctor/i)).toBeInTheDocument();
  });

  it('hides doctor selector in form for doctor role', async () => {
    useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /new appointment/i }));
    await screen.findByRole('dialog');
    expect(screen.queryByLabelText(/doctor/i)).not.toBeInTheDocument();
  });
});
