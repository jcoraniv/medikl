import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { mockStudyTypes } from '@/test/mocks/handlers';
import { useAuthStore } from '@/store/authStore';
import { StudyTypesPage } from './StudyTypesPage';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <StudyTypesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StudyTypesPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'mock-token', user: { id: 'u1', email: 'admin@test.com', fullName: 'Admin', role: 'admin' }, isAuthenticated: true });
  });

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /study types/i })).toBeInTheDocument();
  });

  it('displays study types after loading', async () => {
    renderPage();
    expect(await screen.findByText('Ecografía abdominal')).toBeInTheDocument();
    expect(await screen.findByText('Ecografía obstétrica')).toBeInTheDocument();
  });

  it('shows duration for each study type', async () => {
    renderPage();
    expect(await screen.findByText('30 min')).toBeInTheDocument();
    expect(await screen.findByText('45 min')).toBeInTheDocument();
  });

  it('shows empty state when there are no study types', async () => {
    server.use(http.get(`${(await import('@/lib/config')).API_BASE_URL}/study-types`, () => HttpResponse.json([])));
    renderPage();
    expect(await screen.findByText(/no study types yet/i)).toBeInTheDocument();
  });

  it('shows New study type button for admin users', async () => {
    renderPage();
    expect(await screen.findByRole('button', { name: /new study type/i })).toBeInTheDocument();
  });

  it('hides New study type button for non-admin users', async () => {
    useAuthStore.setState({ token: 'mock-token', user: { id: 'u2', email: 'doctor@test.com', fullName: 'Doctor', role: 'doctor' }, isAuthenticated: true });
    renderPage();
    await screen.findByText('Ecografía abdominal');
    expect(screen.queryByRole('button', { name: /new study type/i })).not.toBeInTheDocument();
  });

  it('opens create dialog on button click', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /new study type/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /new study type/i })).toBeInTheDocument();
  });

  it('shows edit and delete buttons for admin', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByRole('button').some(b => b.querySelector('svg'))).toBe(true);
    });
    expect(await screen.findByText('Ecografía abdominal')).toBeInTheDocument();
  });

  it('does not show edit/delete buttons for non-admin', async () => {
    useAuthStore.setState({ token: 'mock-token', user: { id: 'u2', email: 'doctor@test.com', fullName: 'Doctor', role: 'doctor' }, isAuthenticated: true });
    renderPage();
    await screen.findByText('Ecografía abdominal');
    const studyTypeInMock = mockStudyTypes[0];
    expect(screen.queryByText(studyTypeInMock.name)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new study type/i })).not.toBeInTheDocument();
  });
});
