import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '@/lib/config';

const mockUser = {
  id: 'uuid-123',
  code: 1,
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'patient',
};

// u1 = admin, u2 = doctor (matches ids used in test auth store setup)
export const mockStudyTypes = [
  { id: 'st-uuid-1', name: 'Ecografía abdominal', description: 'Examen abdominal', duration: 30, address: 'Clínica del Valle, Av. Simón López Nro. 512', createdById: 'u1', deletedAt: null },
  { id: 'st-uuid-2', name: 'Ecografía obstétrica', description: null, duration: 45, address: null, createdById: 'u2', deletedAt: null },
];

export const mockAppointments = [
  {
    id: 'appt-uuid-1',
    code: 1,
    patientId: 'patient-uuid',
    patient: { id: 'patient-uuid', code: 1, email: 'patient@test.com', fullName: 'Carlos López', role: 'patient' },
    doctorId: 'doctor-uuid',
    doctor: { id: 'doctor-uuid', code: 2, email: 'doctor@test.com', fullName: 'Dra. García', role: 'doctor' },
    studyTypeId: null,
    studyType: null,
    scheduledDate: '2026-06-01T10:00:00Z',
    duration: 30,
    reason: 'Routine check',
    notes: null,
    status: 'scheduled',
    createdAt: '2026-05-30T00:00:00Z',
    updatedAt: '2026-05-30T00:00:00Z',
  },
];

export const mockStudyResults = [
  {
    id: 'result-uuid-1',
    appointmentId: 'appt-uuid-1',
    appointment: {
      ...mockAppointments[0],
      studyType: mockStudyTypes[0],
    },
    patientId: 'patient-uuid',
    patient: { id: 'patient-uuid', code: 1, email: 'patient@test.com', fullName: 'Carlos López', role: 'patient' },
    doctorId: 'doctor-uuid',
    doctor: { id: 'doctor-uuid', code: 2, email: 'doctor@test.com', fullName: 'Dra. García', role: 'doctor' },
    findings: 'Hallazgos dentro de parámetros normales para la edad del paciente',
    conclusion: null,
    createdAt: '2026-05-30T00:00:00Z',
    updatedAt: '2026-05-30T00:00:00Z',
  },
];

export const mockStats = {
  totalPatients: 5,
  totalDoctors: 2,
  totalAppointments: 10,
  pendingResults: 3,
};

export const handlers = [
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({ access_token: 'mock-token', user: mockUser });
    }

    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.get(`${API_BASE_URL}/dashboard/stats`, () => {
    return HttpResponse.json(mockStats);
  }),

  http.get(`${API_BASE_URL}/appointments`, () => {
    return HttpResponse.json(mockAppointments);
  }),

  http.post(`${API_BASE_URL}/appointments`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockAppointments[0], ...body, id: 'new-uuid' }, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/appointments/:id/cancel`, ({ params }) => {
    return HttpResponse.json({ ...mockAppointments[0], id: params.id, status: 'cancelled' });
  }),

  http.patch(`${API_BASE_URL}/appointments/:id/complete`, ({ params }) => {
    return HttpResponse.json({ ...mockAppointments[0], id: params.id, status: 'completed' });
  }),

  http.get(`${API_BASE_URL}/users`, ({ request }) => {
    const role = new URL(request.url).searchParams.get('role');
    if (role === 'patient') {
      return HttpResponse.json([{ id: 'patient-uuid', code: 1, email: 'patient@test.com', fullName: 'Carlos López', role: 'patient' }]);
    }
    if (role === 'doctor') {
      return HttpResponse.json([{ id: 'doctor-uuid', code: 2, email: 'doctor@test.com', fullName: 'Dra. García', role: 'doctor' }]);
    }
    return HttpResponse.json([mockUser]);
  }),

  http.get(`${API_BASE_URL}/study-types`, () => {
    return HttpResponse.json(mockStudyTypes);
  }),

  http.post(`${API_BASE_URL}/study-types`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockStudyTypes[0], ...body, id: 'new-st-uuid' }, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/study-types/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockStudyTypes[0], id: params.id, ...body });
  }),

  http.delete(`${API_BASE_URL}/study-types/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE_URL}/study-results`, () => {
    return HttpResponse.json(mockStudyResults);
  }),

  http.post(`${API_BASE_URL}/study-results`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockStudyResults[0], ...body, id: 'new-result-uuid' }, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/study-results/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockStudyResults[0], id: params.id, ...body });
  }),

];
