# Medikl

Medical diagnosis clinic management system with AI-powered semantic search and clinical chat assistant.

Developed by **Javier Corani**

## Stack

| Layer | Technology |
|---|---|
| Backend | [NestJS 11](https://nestjs.com) · [TypeORM](https://typeorm.io) · [PostgreSQL](https://www.postgresql.org) |
| Frontend | [React 19](https://react.dev) · [TypeScript](https://www.typescriptlang.org) · [Vite](https://vite.dev) |
| Routing | [React Router v7](https://reactrouter.com) |
| Data fetching | [TanStack Query v5](https://tanstack.com/query/latest) |
| State | [Zustand v5](https://zustand-demo.pmnd.rs) |
| Forms | [React Hook Form v7](https://react-hook-form.com) · [Zod v4](https://zod.dev) |
| Styles | [Tailwind CSS v4](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) |
| AI | [OpenAI Node SDK](https://github.com/openai/openai-node) (`gpt-4o-mini` · `text-embedding-3-small`) |
| Auth | [passport-jwt](https://github.com/mikenicholson/passport-jwt) · [@nestjs/jwt](https://github.com/nestjs/jwt) |
| Validation | [class-validator](https://github.com/typestack/class-validator) · [class-transformer](https://github.com/typestack/class-transformer) |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) |
| Tests | [Jest](https://jestjs.io) (backend) · [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com) + [MSW](https://mswjs.io) (frontend) |

---

## Features

### Authentication
- JWT login via **email or patient HC code** (e.g. `42`)
- Role-based access: `admin`, `doctor`, `patient`
- Throttled login endpoint (5 req/min)

### User management (admin)
- Full CRUD for users with role assignment (`patient`, `doctor`, `admin`)
- Soft delete with `deletedAt` column
- Phone field, conflict detection on duplicate email
- Doctors have read-only access to patient list

### Appointments
- Schedule, complete and cancel appointments
- Role-scoped visibility: doctors see their own, patients see their own, admin sees all
- Linked to study types and patients
- Emit study result directly from the appointment row

### Study Types
- Catalog of medical studies (ultrasound, lab, radiology, etc.)
- Admin and doctor can manage; patients cannot access

### Study Results
- Clinical findings and conclusions linked to appointments
- IDOR-protected: `GET /study-results/by-appointment/:id` scoped by role
- Auto-completes the appointment status on creation

### Clinical History
- Search patient full history by **HC code**
- Returns merged appointments + study results in a single payload
- Clicking HC code on patient list auto-triggers the search

### Dashboard
- Role-aware stats cards:
  - **Admin**: total patients, doctors, appointments, pending results, patients this week, cancelled
  - **Doctor**: own appointments, scheduled, completed this week, cancelled this year
  - **Patient**: appointments this month, pending, cancelled this month

### Semantic Search
- Natural language search over `RESULT_CREATED` activities
- OpenAI embeddings + cosine similarity ranking
- Results scoped by role (patients only see their own)
- Enriched result cards: reason, notes, findings, conclusion

### AI Clinical Chat
- Floating chat panel on the Clinical History page
- Auto-generates a patient summary on open
- Multi-turn conversation — history sent on every request so the AI remembers context
- Context resets when closing the chat or switching patients
- Markdown rendering in assistant responses
- Warns about repeated failed treatments and potential contraindications
- Access restricted to admin and doctor

### Activities (event sourcing)
- Every entity change generates an `Activity` with:
  - `snapshot` — full object state at that moment
  - `delta` — changed fields only (for updates)
  - `generatedText` — auto-generated natural language description in Spanish
  - `embedding` — OpenAI vector stored async without blocking the response

### Security
- `@Roles` guard + service-level ownership checks on every endpoint
- `GET /users` restricted to admin/doctor; `role=admin` query restricted to admin only
- Swagger UI disabled in production (`NODE_ENV !== 'production'`)
- `softDeletePatient` uses TypeORM `@DeleteDateColumn` — account deactivation works correctly
- Duplicate email handled with `ConflictException` (no raw 500 from DB)

---

## Database schema

| Table | Description |
|---|---|
| `users` | All roles — patients, doctors, admins |
| `study_types` | Catalog of medical study types |
| `appointments` | Scheduled, completed or cancelled appointments |
| `study_results` | Clinical findings linked to an appointment |
| `activities` | Event log with snapshots, deltas, generated text and embeddings |

---

## Quick start

```bash
# Backend
cd backend
cp .env.example .env          # configure DB_*, JWT_SECRET, OPENAI_API_KEY
npm install
npm run migration:run
npm run seed                  # optional — loads demo users, appointments and results
npm run start:dev             # http://localhost:3000
# Swagger: http://localhost:3000/api/docs  (dev only)

# Frontend
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

### Environment variables (backend)

| Variable | Description |
|---|---|
| `DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASS` | PostgreSQL connection |
| `JWT_SECRET` | Secret for signing tokens |
| `JWT_EXPIRATION` | e.g. `7d` |
| `OPENAI_API_KEY` | Required for embeddings and chat |
| `OPENAI_CHAT_MODEL` | Default: `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Default: `text-embedding-3-small` |
| `OPENAI_CHAT_TEMPERATURE` | Default: `0.3` |
| `FRONTEND_URL` | CORS origin, default `http://localhost:5173` |

### Demo credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@medikl.dev | Password123! |
| Doctor | garcia@medikl.dev | Password123! |
| Doctor | rodriguez@medikl.dev | Password123! |
| Patient | carlos@medikl.dev | Password123! |

Patients can also log in with their **HC code** (e.g. `3` for Carlos López).

---

## Tests

```bash
# Backend (Jest)
cd backend && npm test

# Frontend (Vitest + RTL)
cd frontend && npx vitest run
```

Current coverage: **131 backend tests · 109 frontend tests**.
