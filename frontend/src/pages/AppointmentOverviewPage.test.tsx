import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { mockAppointments, mockStudyResults } from '@/test/mocks/handlers';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/lib/config';
import { AppointmentOverviewPage } from './AppointmentOverviewPage';

const ADMIN_USER = { id: 'u1', code: 99, email: 'admin@test.com', fullName: 'Admin', role: 'admin' as const };
const APPT_ID = mockAppointments[0].id;

function renderPage(id = APPT_ID) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/appointments/${id}`]}>
        <Routes>
          <Route path="/appointments/:id" element={<AppointmentOverviewPage />} />
          <Route path="/appointments" element={<div>Appointments list</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppointmentOverviewPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'mock-token', user: ADMIN_USER, isAuthenticated: true });
  });

  it('shows loading spinner while fetching', () => {
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders appointment code and status after loading', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: /appointment #1/i })).toBeInTheDocument();
    expect(await screen.findByText('scheduled')).toBeInTheDocument();
  });

  it('renders patient name in appointment details', async () => {
    renderPage();
    expect(await screen.findByText('Carlos López')).toBeInTheDocument();
  });

  it('renders doctor name in appointment details', async () => {
    renderPage();
    // Appears in both Doctor and Emitted by rows
    const occurrences = await screen.findAllByText('Dra. García');
    expect(occurrences.length).toBeGreaterThanOrEqual(1);
  });

  it('renders duration in appointment details', async () => {
    renderPage();
    expect(await screen.findByText('30 min')).toBeInTheDocument();
  });

  it('renders study result findings when a result exists', async () => {
    renderPage();
    expect(await screen.findByText('Hallazgos dentro de parámetros normales para la edad del paciente')).toBeInTheDocument();
  });

  it('shows "No result yet" when appointment has no study result', async () => {
    server.use(
      http.get(`${API_BASE_URL}/study-results/by-appointment/:appointmentId`, () =>
        HttpResponse.json([]),
      ),
    );
    renderPage();
    expect(await screen.findByText(/no result yet/i)).toBeInTheDocument();
  });

  it('shows error message when appointment is not found', async () => {
    server.use(
      http.get(`${API_BASE_URL}/appointments/:id`, () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 }),
      ),
    );
    renderPage('nonexistent-id');
    expect(await screen.findByText(/appointment not found/i)).toBeInTheDocument();
  });

  it('renders a back link to the appointments list', async () => {
    renderPage();
    await screen.findByText('Carlos López');
    expect(screen.getByRole('link', { name: /back to appointments/i })).toHaveAttribute('href', '/appointments');
  });

  it('appointment code in list is a link to the overview page', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { AppointmentsPage } = await import('./AppointmentsPage');
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/appointments']}>
          <Routes>
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/appointments/:id" element={<AppointmentOverviewPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const link = await screen.findByRole('link', { name: /#1/i });
    expect(link).toHaveAttribute('href', `/appointments/${APPT_ID}`);
  });
});
