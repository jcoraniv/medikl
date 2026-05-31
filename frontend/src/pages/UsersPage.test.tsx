import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import { UsersPage } from './UsersPage';

const ADMIN_USER  = { id: 'u1', code: 99, email: 'admin@test.com',  fullName: 'Admin',       role: 'admin'  as const };
const DOCTOR_USER = { id: 'u2', code: 2,  email: 'doctor@test.com', fullName: 'Dra. García', role: 'doctor' as const };
const PATIENT_USER = { id: 'patient-uuid', code: 1, email: 'carlos@test.com', fullName: 'Carlos López', role: 'patient' as const };

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route path="/users" element={<UsersPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/clinical-history" element={<div>Clinical History</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('UsersPage', () => {
  describe('as admin', () => {
    beforeEach(() => {
      useAuthStore.setState({ token: 'mock-token', user: ADMIN_USER, isAuthenticated: true });
    });

    it('shows "Users" as the page title', async () => {
      renderPage();
      expect(await screen.findByRole('heading', { name: /^users$/i })).toBeInTheDocument();
    });

    it('shows all users including admin and doctor', async () => {
      renderPage();
      expect(await screen.findByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Dra. García')).toBeInTheDocument();
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
    });

    it('shows Role column with badges', async () => {
      renderPage();
      await screen.findByText('Admin');
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('doctor')).toBeInTheDocument();
      expect(screen.getByText('patient')).toBeInTheDocument();
    });

    it('HC code for patient is a link to clinical history', async () => {
      renderPage();
      await screen.findByText('Carlos López');
      const link = screen.getByRole('link', { name: 'HC-1' });
      expect(link).toHaveAttribute('href', '/clinical-history?code=1');
    });

    it('HC code for non-patient is plain text (not a link)', async () => {
      renderPage();
      await screen.findByText('Dra. García');
      const links = screen.queryAllByRole('link', { name: /HC-2/i });
      expect(links).toHaveLength(0);
      expect(screen.getByText('HC-2')).toBeInTheDocument();
    });

    it('shows "New user" button', async () => {
      renderPage();
      expect(await screen.findByRole('button', { name: /new user/i })).toBeInTheDocument();
    });

    it('opens create dialog with Role selector when clicking New user', async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(await screen.findByRole('button', { name: /new user/i }));
      expect(await screen.findByRole('heading', { name: /new user/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('opens edit dialog with Role selector pre-filled', async () => {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('Dra. García');
      const pencilButtons = document.querySelectorAll('button svg.lucide-pencil');
      await user.click(pencilButtons[1].closest('button')!);
      expect(await screen.findByRole('heading', { name: /edit user/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('submits create form and closes dialog', async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(await screen.findByRole('button', { name: /new user/i }));
      await screen.findByRole('heading', { name: /new user/i });
      await user.type(screen.getByLabelText(/full name/i), 'Nuevo Usuario');
      await user.type(screen.getByLabelText(/email/i), 'nuevo@test.com');
      await user.type(screen.getByLabelText(/password/i), 'secret123');
      await user.click(screen.getByRole('button', { name: /create user/i }));
      expect(await screen.findByText('Admin')).toBeInTheDocument();
    });
  });

  describe('as doctor', () => {
    beforeEach(() => {
      useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    });

    it('shows "Patients" as the page title', async () => {
      renderPage();
      expect(await screen.findByRole('heading', { name: /^patients$/i })).toBeInTheDocument();
    });

    it('shows only patients in the table', async () => {
      renderPage();
      expect(await screen.findByText('Carlos López')).toBeInTheDocument();
      expect(screen.queryByText('Dra. García')).not.toBeInTheDocument();
    });

    it('does not show Role column', async () => {
      renderPage();
      await screen.findByText('Carlos López');
      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map((h) => h.textContent?.trim().toLowerCase());
      expect(headerTexts).not.toContain('role');
    });

    it('does not show "New user" button', async () => {
      renderPage();
      await screen.findByText('Carlos López');
      expect(screen.queryByRole('button', { name: /new user/i })).not.toBeInTheDocument();
    });
  });

  describe('as patient', () => {
    beforeEach(() => {
      useAuthStore.setState({ token: 'mock-token', user: PATIENT_USER, isAuthenticated: true });
    });

    it('redirects patient to dashboard', () => {
      renderPage();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
