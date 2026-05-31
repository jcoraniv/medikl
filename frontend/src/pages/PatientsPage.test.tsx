import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/lib/config';
import { PatientsPage } from './PatientsPage';

const ADMIN_USER  = { id: 'u1', code: 99, email: 'admin@test.com', fullName: 'Admin', role: 'admin'  as const };
const DOCTOR_USER = { id: 'u2', code: 2,  email: 'doctor@test.com', fullName: 'Dra. García', role: 'doctor' as const };
const PATIENT_USER = { id: 'patient-uuid', code: 1, email: 'carlos@test.com', fullName: 'Carlos López', role: 'patient' as const };

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/patients']}>
        <Routes>
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/clinical-history" element={<div>Clinical History</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PatientsPage', () => {
  describe('as admin', () => {
    beforeEach(() => {
      useAuthStore.setState({ token: 'mock-token', user: ADMIN_USER, isAuthenticated: true });
    });

    it('renders the page heading', async () => {
      renderPage();
      expect(await screen.findByRole('heading', { name: /patients/i })).toBeInTheDocument();
    });

    it('shows "New patient" button', async () => {
      renderPage();
      expect(await screen.findByRole('button', { name: /new patient/i })).toBeInTheDocument();
    });

    it('opens create dialog with password field when clicking New patient', async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(await screen.findByRole('button', { name: /new patient/i }));
      expect(await screen.findByRole('heading', { name: /new patient/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('submits create form and refreshes list', async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(await screen.findByRole('button', { name: /new patient/i }));
      await screen.findByRole('heading', { name: /new patient/i });
      await user.type(screen.getByLabelText(/full name/i), 'Nuevo Paciente');
      await user.type(screen.getByLabelText(/email/i), 'nuevo@test.com');
      await user.type(screen.getByLabelText(/password/i), 'secret123');
      await user.click(screen.getByRole('button', { name: /create patient/i }));
      expect(await screen.findByText('Carlos López')).toBeInTheDocument();
    });

    it('shows patients in table with HC code and name', async () => {
      renderPage();
      expect(await screen.findByText('Carlos López')).toBeInTheDocument();
      expect(screen.getByText('Ana Torres')).toBeInTheDocument();
      expect(screen.getByText('HC-1')).toBeInTheDocument();
      expect(screen.getByText('HC-2')).toBeInTheDocument();
    });

    it('HC code is a link to clinical history with code query param', async () => {
      renderPage();
      await screen.findByText('HC-1');
      const link = screen.getByRole('link', { name: 'HC-1' });
      expect(link).toHaveAttribute('href', '/clinical-history?code=1');
    });

    it('shows Edit and Delete buttons for each patient', async () => {
      renderPage();
      await screen.findByText('Carlos López');
      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        (b) => b.querySelector('svg'),
      );
      expect(editButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('opens edit dialog when clicking the Edit button', async () => {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('Carlos López');
      const pencilButtons = document.querySelectorAll('button svg.lucide-pencil');
      await user.click(pencilButtons[0].closest('button')!);
      expect(await screen.findByRole('heading', { name: /edit patient/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Carlos López')).toBeInTheDocument();
    });

    it('closes dialog and refreshes list after successful edit', async () => {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('Carlos López');
      const pencilButtons = document.querySelectorAll('button svg.lucide-pencil');
      await user.click(pencilButtons[0].closest('button')!);
      await screen.findByRole('heading', { name: /edit patient/i });
      await user.click(screen.getByRole('button', { name: /save changes/i }));
      expect(await screen.findByText('Carlos López')).toBeInTheDocument();
    });

    it('calls delete endpoint when clicking Delete button', async () => {
      const user = userEvent.setup();
      let deleteCalled = false;
      server.use(
        http.delete(`${API_BASE_URL}/users/patients/:id`, () => {
          deleteCalled = true;
          return new HttpResponse(null, { status: 204 });
        }),
      );
      renderPage();
      await screen.findByText('Carlos López');
      const trashButtons = document.querySelectorAll('button svg.lucide-trash-2');
      await user.click(trashButtons[0].closest('button')!);
      await new Promise((r) => setTimeout(r, 50));
      expect(deleteCalled).toBe(true);
    });
  });

  describe('as doctor', () => {
    beforeEach(() => {
      useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    });

    it('does not show "New patient" button', async () => {
      renderPage();
      await screen.findByText('Carlos López');
      expect(screen.queryByRole('button', { name: /new patient/i })).not.toBeInTheDocument();
    });

    it('shows patients list without action buttons', async () => {
      renderPage();
      expect(await screen.findByText('Carlos López')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    it('does not render the Actions column header', async () => {
      renderPage();
      await screen.findByText('Carlos López');
      const headers = screen.getAllByRole('columnheader');
      const texts = headers.map((h) => h.textContent?.trim());
      expect(texts).not.toContain('');
    });
  });

  describe('as patient', () => {
    beforeEach(() => {
      useAuthStore.setState({ token: 'mock-token', user: PATIENT_USER, isAuthenticated: true });
    });

    it('redirects patient to dashboard', () => {
      renderPage();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /patients/i })).not.toBeInTheDocument();
    });
  });
});
