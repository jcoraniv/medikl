import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { mockStudyResults } from '@/test/mocks/handlers';
import { useAuthStore } from '@/store/authStore';
import { StudyResultsPage } from './StudyResultsPage';

const PATIENT_USER = { id: 'u-patient', email: 'patient@test.com', fullName: 'Carlos López', role: 'patient' as const };
const DOCTOR_USER  = { id: 'u-doctor',  email: 'doctor@test.com',  fullName: 'Dra. García',  role: 'doctor' as const };

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <StudyResultsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StudyResultsPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'mock-token', user: PATIENT_USER, isAuthenticated: true });
  });

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /study results/i })).toBeInTheDocument();
  });

  it('shows results list after loading', async () => {
    renderPage();
    expect(await screen.findByText('Carlos López')).toBeInTheDocument();
    expect(await screen.findByText('Dra. García')).toBeInTheDocument();
  });

  it('shows empty state when there are no results', async () => {
    server.use(
      http.get(`${(await import('@/lib/config')).API_BASE_URL}/study-results`, () =>
        HttpResponse.json([]),
      ),
    );
    renderPage();
    expect(await screen.findByText(/no study results yet/i)).toBeInTheDocument();
  });

  it('does not show "New result" button for patient role', async () => {
    renderPage();
    await screen.findByText('Carlos López');
    expect(screen.queryByRole('button', { name: /new result/i })).not.toBeInTheDocument();
  });

  it('shows "New result" button for doctor role', () => {
    useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    renderPage();
    expect(screen.getByRole('button', { name: /new result/i })).toBeInTheDocument();
  });

  it('opens create dialog when "New result" button is clicked', async () => {
    useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /new result/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New study result')).toBeInTheDocument();
  });

  it('shows edit button for doctor role', async () => {
    useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
    });
  });

  it('opens edit dialog with prefilled findings', async () => {
    useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    renderPage();
    await waitFor(() => screen.getByTitle('Edit'));
    await userEvent.click(screen.getByTitle('Edit'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit study result')).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockStudyResults[0].findings)).toBeInTheDocument();
  });
});
