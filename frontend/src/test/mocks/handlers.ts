import { http, HttpResponse } from 'msw';

const mockUser = {
  id: 'uuid-123',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'patient',
};

export const mockStats = {
  totalPatients: 5,
  totalDoctors: 2,
  totalAppointments: 10,
  pendingResults: 3,
};

export const handlers = [
  http.post('http://localhost:3000/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({ access_token: 'mock-token', user: mockUser });
    }

    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.get('http://localhost:3000/api/dashboard/stats', () => {
    return HttpResponse.json(mockStats);
  }),
];
