import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { mockAppointments } from '@/test/mocks/handlers';
import { useAuthStore } from '@/store/authStore';
import { AppointmentsPage } from './AppointmentsPage';

const ADMIN_USER = { id: 'u1', code: 99, email: 'admin@test.com', fullName: 'Admin', role: 'admin' as const };
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
      http.get('http://localhost:3000/api/appointments', () => HttpResponse.json([])),
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

  it('shows complete and cancel buttons for scheduled appointments', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it('does not show action buttons for completed appointments', async () => {
    server.use(
      http.get('http://localhost:3000/api/appointments', () =>
        HttpResponse.json([{ ...mockAppointments[0], status: 'completed' }]),
      ),
    );
    renderPage();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /complete/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
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
