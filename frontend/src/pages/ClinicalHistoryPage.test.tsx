import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/lib/config';
import { ClinicalHistoryPage } from './ClinicalHistoryPage';

const DOCTOR_USER = { id: 'u2', code: 2, email: 'doctor@test.com', fullName: 'Dra. García', role: 'doctor' as const };

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/clinical-history']}>
        <Routes>
          <Route path="/clinical-history" element={<ClinicalHistoryPage />} />
          <Route path="/appointments/:id" element={<div>Overview page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClinicalHistoryPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
  });

  it('renders the search form', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /clinical history/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/patient code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('search button is disabled when input is empty', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
  });

  it('shows patient card after a successful search', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/patient code/i), '1');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText('Carlos López')).toBeInTheDocument();
    expect(await screen.findByText(/HC-1/i)).toBeInTheDocument();
    expect(await screen.findByText(/carlos@test\.com/i)).toBeInTheDocument();
  });

  it('shows appointment count in patient header', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/patient code/i), '1');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText(/2 appointment/i)).toBeInTheDocument();
  });

  it('renders appointment cards with status badges', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/patient code/i), '1');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await screen.findByText('Carlos López');
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('renders study result findings for appointment with result', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/patient code/i), '1');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText('Sin hallazgos patológicos')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('shows "No study result yet" for appointment without result', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/patient code/i), '1');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await screen.findByText('Carlos López');
    const noResults = screen.getAllByText(/no study result yet/i);
    expect(noResults.length).toBeGreaterThanOrEqual(1);
  });

  it('shows error message when patient code is not found', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API_BASE_URL}/clinical-history/:code`, () =>
        HttpResponse.json({ message: 'Patient not found' }, { status: 404 }),
      ),
    );
    renderPage();

    await user.type(screen.getByPlaceholderText(/patient code/i), '999');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText(/patient not found or an error occurred/i)).toBeInTheDocument();
  });

  it('appointment code links to the overview page', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/patient code/i), '1');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await screen.findByText('Carlos López');
    const link = screen.getByRole('link', { name: /#1/i });
    expect(link).toHaveAttribute('href', '/appointments/appt-uuid-1');
  });

  it('shows "No appointments found" when patient has no appointments', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API_BASE_URL}/clinical-history/:code`, () =>
        HttpResponse.json({
          patient: { id: 'p-2', code: 5, fullName: 'Sin Citas', email: 'sin@test.com' },
          appointments: [],
        }),
      ),
    );
    renderPage();

    await user.type(screen.getByPlaceholderText(/patient code/i), '5');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText(/no appointments found/i)).toBeInTheDocument();
  });
});
