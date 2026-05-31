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
  patientsThisWeek: 4,
  cancelledAppointments: 6,
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
    return HttpResponse.json({ data: mockAppointments, total: mockAppointments.length, page: 1, limit: 10, totalPages: 1 });
  }),

  http.post(`${API_BASE_URL}/appointments`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockAppointments[0], ...body, id: 'new-uuid' }, { status: 201 });
  }),

  http.get(`${API_BASE_URL}/appointments/:id`, ({ params }) => {
    const appt = mockAppointments.find((a) => a.id === params.id) ?? mockAppointments[0];
    return HttpResponse.json(appt);
  }),

  http.get(`${API_BASE_URL}/study-results/by-appointment/:appointmentId`, ({ params }) => {
    const results = mockStudyResults.filter((r) => r.appointmentId === params.appointmentId);
    return HttpResponse.json(results);
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
    return HttpResponse.json({ data: mockStudyTypes, total: mockStudyTypes.length, page: 1, limit: 10, totalPages: 1 });
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
    return HttpResponse.json({ data: mockStudyResults, total: mockStudyResults.length, page: 1, limit: 10, totalPages: 1 });
  }),

  http.post(`${API_BASE_URL}/study-results`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockStudyResults[0], ...body, id: 'new-result-uuid' }, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/study-results/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockStudyResults[0], id: params.id, ...body });
  }),

  http.post(`${API_BASE_URL}/users`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(
      { id: 'new-user-uuid', code: 10, phone: null, createdAt: '2026-06-01T00:00:00Z', deletedAt: null, role: 'patient', ...body },
      { status: 201 },
    );
  }),

  http.get(`${API_BASE_URL}/users/all`, ({ request }) => {
    const page = new URL(request.url).searchParams.get('page') ?? '1';
    return HttpResponse.json({
      data: [
        { id: 'admin-uuid', code: 99, fullName: 'Admin', email: 'admin@test.com', phone: null, role: 'admin', createdAt: '2026-01-01T00:00:00Z', deletedAt: null },
        { id: 'doctor-uuid', code: 2, fullName: 'Dra. García', email: 'doctor@test.com', phone: null, role: 'doctor', createdAt: '2026-01-01T00:00:00Z', deletedAt: null },
        { id: 'patient-uuid', code: 1, fullName: 'Carlos López', email: 'carlos@test.com', phone: '+591 70000000', role: 'patient', createdAt: '2026-01-01T00:00:00Z', deletedAt: null },
      ],
      total: 3, page: Number(page), limit: 10, totalPages: 1,
    });
  }),

  http.post(`${API_BASE_URL}/users/patients`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(
      { id: 'new-patient-uuid', code: 3, role: 'patient', phone: null, createdAt: '2026-06-01T00:00:00Z', deletedAt: null, ...body },
      { status: 201 },
    );
  }),

  http.get(`${API_BASE_URL}/users/patients`, ({ request }) => {
    const page = new URL(request.url).searchParams.get('page') ?? '1';
    return HttpResponse.json({
      data: [
        { id: 'patient-uuid', code: 1, fullName: 'Carlos López', email: 'carlos@test.com', phone: '+591 70000000', role: 'patient', createdAt: '2026-01-01T00:00:00Z', deletedAt: null },
        { id: 'patient-uuid-2', code: 2, fullName: 'Ana Torres', email: 'ana@test.com', phone: null, role: 'patient', createdAt: '2026-01-02T00:00:00Z', deletedAt: null },
      ],
      total: 2, page: Number(page), limit: 10, totalPages: 1,
    });
  }),

  http.patch(`${API_BASE_URL}/users/patients/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: params.id, code: 1, role: 'patient', createdAt: '2026-01-01T00:00:00Z', deletedAt: null, ...body });
  }),

  http.delete(`${API_BASE_URL}/users/patients/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE_URL}/clinical-history/:code`, ({ params }) => {
    if (params.code === '999') {
      return HttpResponse.json({ message: 'Patient not found' }, { status: 404 });
    }
    return HttpResponse.json({
      patient: { id: 'patient-uuid', code: Number(params.code), fullName: 'Carlos López', email: 'carlos@test.com' },
      appointments: [
        {
          id: 'appt-uuid-1',
          code: 1,
          scheduledDate: '2026-06-01T10:00:00Z',
          duration: 30,
          status: 'completed',
          reason: 'Routine check',
          notes: null,
          doctor: { id: 'doctor-uuid', fullName: 'Dra. García' },
          studyType: { id: 'st-uuid-1', name: 'Ecografía abdominal' },
          studyResult: {
            id: 'result-uuid-1',
            findings: 'Sin hallazgos patológicos',
            conclusion: 'Normal',
            createdAt: '2026-06-01T12:00:00Z',
          },
        },
        {
          id: 'appt-uuid-2',
          code: 2,
          scheduledDate: '2026-05-15T09:00:00Z',
          duration: 45,
          status: 'scheduled',
          reason: null,
          notes: null,
          doctor: { id: 'doctor-uuid', fullName: 'Dra. García' },
          studyType: null,
          studyResult: null,
        },
      ],
    });
  }),

];
