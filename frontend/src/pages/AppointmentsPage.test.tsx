import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect } from 'vitest';
import { server } from '@/test/mocks/server';
import { mockAppointments } from '@/test/mocks/handlers';
import { AppointmentsPage } from './AppointmentsPage';

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
  it('renders the page heading', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /appointments/i })).toBeInTheDocument();
  });

  it('displays appointments after loading', async () => {
    renderPage();

    expect(await screen.findByText('Carlos López')).toBeInTheDocument();
    expect(await screen.findByText('Dra. García')).toBeInTheDocument();
  });

  it('shows status badge for each appointment', async () => {
    renderPage();
    expect(await screen.findByText('scheduled')).toBeInTheDocument();
  });

  it('shows empty state when there are no appointments', async () => {
    server.use(
      http.get('http://localhost:3000/api/appointments', () => {
        return HttpResponse.json([]);
      }),
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

  it('does not show action buttons for non-scheduled appointments', async () => {
    server.use(
      http.get('http://localhost:3000/api/appointments', () => {
        return HttpResponse.json([{ ...mockAppointments[0], status: 'completed' }]);
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /complete/i })).not.toBeInTheDocument();
    });
  });
});
