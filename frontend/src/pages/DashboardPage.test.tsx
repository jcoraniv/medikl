import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { mockStats } from '@/test/mocks/handlers';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/lib/config';
import { DashboardPage } from './DashboardPage';

const ADMIN_USER   = { id: 'u1', code: 99, email: 'admin@test.com',   fullName: 'Admin',       role: 'admin'   as const };
const DOCTOR_USER  = { id: 'u2', code: 2,  email: 'doctor@test.com',  fullName: 'Dra. García', role: 'doctor'  as const };
const PATIENT_USER = { id: 'u3', code: 3,  email: 'patient@test.com', fullName: 'Carlos López', role: 'patient' as const };

function renderDashboardPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'mock-token', user: ADMIN_USER, isAuthenticated: true });
  });

  it('renders the dashboard heading', async () => {
    renderDashboardPage();
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('shows skeleton placeholders while loading', () => {
    renderDashboardPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error message when the API fails', async () => {
    server.use(
      http.get(`${API_BASE_URL}/dashboard/stats`, () => {
        return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
      }),
    );

    renderDashboardPage();

    expect(await screen.findByText(/failed to load stats/i)).toBeInTheDocument();
  });

  // ─── Admin role ───────────────────────────────────────────────────────────

  describe('admin role', () => {
    it('displays all six stat cards after loading', async () => {
      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(mockStats.totalPatients)).toBeInTheDocument();
        expect(screen.getByText(mockStats.totalDoctors)).toBeInTheDocument();
        expect(screen.getByText(mockStats.totalAppointments)).toBeInTheDocument();
        expect(screen.getByText(mockStats.pendingResults)).toBeInTheDocument();
        expect(screen.getByText(mockStats.patientsThisWeek)).toBeInTheDocument();
        expect(screen.getByText(mockStats.cancelledAppointments)).toBeInTheDocument();
      });
    });

    it('displays all six card titles', async () => {
      renderDashboardPage();

      expect(await screen.findByText('Total Patients')).toBeInTheDocument();
      expect(await screen.findByText('Total Doctors')).toBeInTheDocument();
      expect(await screen.findByText('Appointments')).toBeInTheDocument();
      expect(await screen.findByText('Pending Results')).toBeInTheDocument();
      expect(await screen.findByText('Patients This Week')).toBeInTheDocument();
      expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    });
  });

  // ─── Doctor role ──────────────────────────────────────────────────────────

  describe('doctor role', () => {
    beforeEach(() => {
      useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    });

    it('shows My Appointments, Pending, Patients This Week and Cancelled cards', async () => {
      renderDashboardPage();

      expect(await screen.findByText('My Appointments')).toBeInTheDocument();
      expect(await screen.findByText('Pending')).toBeInTheDocument();
      expect(await screen.findByText('Patients This Week')).toBeInTheDocument();
      expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    });

    it('does not show Total Patients or Total Doctors cards', async () => {
      renderDashboardPage();
      await screen.findByText('My Appointments');

      expect(screen.queryByText('Total Patients')).not.toBeInTheDocument();
      expect(screen.queryByText('Total Doctors')).not.toBeInTheDocument();
    });

    it('displays appointment, pending, this-week and cancelled values', async () => {
      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(mockStats.totalAppointments)).toBeInTheDocument();
        expect(screen.getByText(mockStats.pendingResults)).toBeInTheDocument();
        expect(screen.getByText(mockStats.patientsThisWeek)).toBeInTheDocument();
        expect(screen.getByText(mockStats.cancelledAppointments)).toBeInTheDocument();
      });
    });
  });

  // ─── Patient role ─────────────────────────────────────────────────────────

  describe('patient role', () => {
    beforeEach(() => {
      useAuthStore.setState({ token: 'mock-token', user: PATIENT_USER, isAuthenticated: true });
    });

    it('shows This Month, Pending and Cancelled cards', async () => {
      renderDashboardPage();

      expect(await screen.findByText('This Month')).toBeInTheDocument();
      expect(await screen.findByText('Pending')).toBeInTheDocument();
      expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    });

    it('does not show admin-only cards', async () => {
      renderDashboardPage();
      await screen.findByText('This Month');

      expect(screen.queryByText('Total Patients')).not.toBeInTheDocument();
      expect(screen.queryByText('Total Doctors')).not.toBeInTheDocument();
      expect(screen.queryByText('Patients This Week')).not.toBeInTheDocument();
      expect(screen.queryByText('My Appointments')).not.toBeInTheDocument();
    });

    it('displays this-month, pending and cancelled values', async () => {
      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(mockStats.totalAppointments)).toBeInTheDocument();
        expect(screen.getByText(mockStats.pendingResults)).toBeInTheDocument();
        expect(screen.getByText(mockStats.cancelledAppointments)).toBeInTheDocument();
      });
    });
  });
});
