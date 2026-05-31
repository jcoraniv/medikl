import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/lib/config';
import { StudyTypesPage } from './StudyTypesPage';

// u1 = admin, u2 = doctor — matches createdById in mockStudyTypes handler
const ADMIN_USER  = { id: 'u1', code: 99, email: 'admin@test.com',  fullName: 'Admin',       role: 'admin'   as const };
const DOCTOR_USER = { id: 'u2', code: 2,  email: 'doctor@test.com', fullName: 'Dra. García', role: 'doctor'  as const };

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
    useAuthStore.setState({ token: 'mock-token', user: ADMIN_USER, isAuthenticated: true });
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
    server.use(http.get(`${API_BASE_URL}/study-types`, () =>
      HttpResponse.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
    ));
    renderPage();
    expect(await screen.findByText(/no study types yet/i)).toBeInTheDocument();
  });

  // ─── Create button visibility ─────────────────────────────────────────────

  it('shows New study type button for admin', async () => {
    renderPage();
    expect(await screen.findByRole('button', { name: /new study type/i })).toBeInTheDocument();
  });

  it('shows New study type button for doctor', async () => {
    useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    renderPage();
    expect(await screen.findByRole('button', { name: /new study type/i })).toBeInTheDocument();
  });

  it('hides New study type button for patient role', async () => {
    useAuthStore.setState({
      token: 'mock-token',
      user: { id: 'u3', code: 3, email: 'patient@test.com', fullName: 'Patient', role: 'patient' },
      isAuthenticated: true,
    });
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

  // ─── Edit / Delete button visibility ─────────────────────────────────────

  it('admin sees edit and delete buttons for all study types', async () => {
    renderPage();
    await screen.findByText('Ecografía abdominal');
    // 2 study types × 2 buttons (edit + delete) = 4 icon buttons
    const iconButtons = screen.getAllByRole('button').filter((b) => b.querySelector('svg'));
    // at least the New button + 4 action buttons
    expect(iconButtons.length).toBeGreaterThanOrEqual(5);
  });

  it('doctor sees delete only for study types they created', async () => {
    // mockStudyTypes: st-uuid-1 → createdById:'u1' (admin), st-uuid-2 → createdById:'u2' (doctor)
    useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    renderPage();
    await screen.findByText('Ecografía abdominal');
    // Edit button (Pencil) must not appear at all for doctors
    expect(screen.queryByTestId?.('edit-btn')).not.toBeInTheDocument();
    // Only 1 delete button — for the study type owned by this doctor
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button').filter((b) =>
        b.querySelector('svg') && !b.textContent?.includes('New'),
      );
      expect(deleteButtons).toHaveLength(1);
    });
  });

  it('doctor does not see delete button for study types they do not own', async () => {
    // Only expose the study type owned by the admin
    server.use(
      http.get(`${API_BASE_URL}/study-types`, () =>
        HttpResponse.json({ data: [{ id: 'st-uuid-1', name: 'Ecografía abdominal', description: null, duration: 30, address: null, createdById: 'u1', deletedAt: null }], total: 1, page: 1, limit: 10, totalPages: 1 }),
      ),
    );
    useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    renderPage();
    await screen.findByText('Ecografía abdominal');
    // No action buttons visible (other than "New study type")
    const actionButtons = screen.getAllByRole('button').filter((b) =>
      b.querySelector('svg') && !b.textContent?.includes('New'),
    );
    expect(actionButtons).toHaveLength(0);
  });
});
