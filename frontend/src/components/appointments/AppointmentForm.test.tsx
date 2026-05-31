import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import { AppointmentForm } from './AppointmentForm';

const ADMIN_USER  = { id: 'u1', code: 99, email: 'admin@test.com',  fullName: 'Admin',       role: 'admin'   as const };
const DOCTOR_USER = { id: 'u2', code: 2,  email: 'doctor@test.com', fullName: 'Dra. García', role: 'doctor'  as const };

function renderForm(onSuccess = () => {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AppointmentForm onSuccess={onSuccess} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppointmentForm', () => {
  describe('as admin', () => {
    beforeEach(() => {
      useAuthStore.setState({ token: 'mock-token', user: ADMIN_USER, isAuthenticated: true });
    });

    it('renders the patient selector', async () => {
      renderForm();
      expect(await screen.findByLabelText(/patient/i)).toBeInTheDocument();
    });

    it('renders the doctor selector', async () => {
      renderForm();
      expect(await screen.findByLabelText(/doctor/i)).toBeInTheDocument();
    });

    it('populates doctor selector with fetched doctors', async () => {
      renderForm();
      expect(await screen.findByRole('option', { name: /Dra. García/i })).toBeInTheDocument();
    });

    it('renders date, duration and reason fields', async () => {
      renderForm();
      await screen.findByLabelText(/patient/i);
      expect(screen.getByLabelText(/date & time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    });

    it('shows validation errors when required fields are empty', async () => {
      renderForm();
      await screen.findByLabelText(/patient/i);
      await userEvent.click(screen.getByRole('button', { name: /create appointment/i }));
      const errors = await screen.findAllByText(/required/i);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('as doctor', () => {
    beforeEach(() => {
      useAuthStore.setState({ token: 'mock-token', user: DOCTOR_USER, isAuthenticated: true });
    });

    it('renders the patient selector', async () => {
      renderForm();
      expect(await screen.findByLabelText(/patient/i)).toBeInTheDocument();
    });

    it('does not render a doctor selector', async () => {
      renderForm();
      await waitFor(() => {
        expect(screen.queryByLabelText(/doctor/i)).not.toBeInTheDocument();
      });
    });

    it('does not show doctor options in the form', async () => {
      renderForm();
      await screen.findByLabelText(/patient/i);
      expect(screen.queryByRole('option', { name: /Dra. García/i })).not.toBeInTheDocument();
    });

    it('renders date, duration and reason fields', async () => {
      renderForm();
      await screen.findByLabelText(/patient/i);
      expect(screen.getByLabelText(/date & time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    });
  });
});
