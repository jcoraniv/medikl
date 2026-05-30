# Medical Diagnosis System

Medical office management system with AI-powered semantic search.

## Architecture

### Tech Stack
- **Backend**: NestJS + TypeORM
- **Database**: PostgreSQL/MySQL
- **AI**: OpenAI Embeddings (text-embedding-3-small)
- **Search**: Cosine similarity over embedding vectors

### Database Structure
See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for full details.

**7 core tables:**
1. `users` - Authentication
2. `patients` - Patients
3. `doctors` - Doctors
4. `study_types` - Study catalog
5. `appointments` - Appointments
6. `study_results` - Medical results
7. `activities` - Event sourcing + embeddings

### Activities System (Core Innovation)

Every change in the system generates an `activity` with:
- **Snapshot**: Complete object state (JSON)
- **Delta**: Only modified fields (for updates)
- **Generated Text**: Auto-generated natural language description
- **Embedding**: Vector for semantic search

## Quick Start

```bash
# Install dependencies
npm install

# Environment variables
cp .env.example .env
# Configure OPENAI_API_KEY and DB_*

# Run migrations
npm run migration:run

# Development
npm run start:dev
```

## Sprint 1 Features

- Patient and doctor CRUD
- Appointment management
- Medical results
- Activities system with event sourcing
- Semantic search with OpenAI
- Basic dashboard

## Code Conventions

### Creating Activities

Always after entity operations:

```typescript
// BAD
await this.appointmentRepo.save(appointment);
// No activity created

// GOOD
await this.appointmentRepo.save(appointment);
await this.activityService.createActivity({
  activityType: ActivityType.APPOINTMENT_SCHEDULED,
  snapshot: {...},
  // Auto-generates text and embedding
});
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT
