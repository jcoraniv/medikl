import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { mockStats } from '@/test/mocks/handlers';
import { DashboardPage } from './DashboardPage';

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
    // QueryClient is recreated per render, so no extra cleanup needed
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

  it('displays stat cards with correct values after loading', async () => {
    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText(mockStats.totalPatients)).toBeInTheDocument();
      expect(screen.getByText(mockStats.totalDoctors)).toBeInTheDocument();
      expect(screen.getByText(mockStats.totalAppointments)).toBeInTheDocument();
      expect(screen.getByText(mockStats.pendingResults)).toBeInTheDocument();
    });
  });

  it('displays card titles after loading', async () => {
    renderDashboardPage();

    expect(await screen.findByText('Total Patients')).toBeInTheDocument();
    expect(await screen.findByText('Total Doctors')).toBeInTheDocument();
    expect(await screen.findByText('Appointments')).toBeInTheDocument();
    expect(await screen.findByText('Pending Results')).toBeInTheDocument();
  });

  it('shows error message when the API fails', async () => {
    server.use(
      http.get('http://localhost:3000/api/dashboard/stats', () => {
        return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
      }),
    );

    renderDashboardPage();

    expect(await screen.findByText(/failed to load stats/i)).toBeInTheDocument();
  });
});
