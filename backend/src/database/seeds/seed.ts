import 'reflect-metadata';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../../users/entities/user.entity';
import { StudyType } from '../../study-types/entities/study-type.entity';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'medikl',
  entities: [User, StudyType, Appointment],
  synchronize: false,
  logging: false,
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysFromNow(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function upsertUser(
  repo: Repository<User>,
  data: { email: string; fullName: string; password: string; role: UserRole },
): Promise<User> {
  const existing = await repo.findOne({ where: { email: data.email } });
  if (existing) {
    console.log(`  [skip] ${data.email}`);
    return existing;
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await repo.save(repo.create({ ...data, passwordHash }));
  console.log(`  [ok]   ${data.email} (${data.role})`);
  return user;
}

// ─── Users ──────────────────────────────────────────────────────────────────

async function seedUsers(ds: DataSource) {
  const repo = ds.getRepository(User);

  const [admin, garcia, rodriguez, carlos, ana, roberto, laura, miguel] = await Promise.all([
    upsertUser(repo, { email: 'admin@medikl.dev',     fullName: 'Admin Sistema',          password: 'Password123!', role: UserRole.ADMIN }),
    upsertUser(repo, { email: 'garcia@medikl.dev',    fullName: 'Dra. María García',       password: 'Password123!', role: UserRole.DOCTOR }),
    upsertUser(repo, { email: 'rodriguez@medikl.dev', fullName: 'Dr. Juan Rodríguez',      password: 'Password123!', role: UserRole.DOCTOR }),
    upsertUser(repo, { email: 'carlos@medikl.dev',    fullName: 'Carlos López',            password: 'Password123!', role: UserRole.PATIENT }),
    upsertUser(repo, { email: 'ana@medikl.dev',       fullName: 'Ana Martínez',            password: 'Password123!', role: UserRole.PATIENT }),
    upsertUser(repo, { email: 'roberto@medikl.dev',   fullName: 'Roberto Silva',           password: 'Password123!', role: UserRole.PATIENT }),
    upsertUser(repo, { email: 'laura@medikl.dev',     fullName: 'Laura Pérez',             password: 'Password123!', role: UserRole.PATIENT }),
    upsertUser(repo, { email: 'miguel@medikl.dev',    fullName: 'Miguel Torres',           password: 'Password123!', role: UserRole.PATIENT }),
  ]);

  return { admin, garcia, rodriguez, carlos, ana, roberto, laura, miguel };
}

// ─── Study Types ─────────────────────────────────────────────────────────────

async function seedStudyTypes(ds: DataSource): Promise<Record<string, StudyType>> {
  const repo = ds.getRepository(StudyType);

  const MEDIKL  = 'Medikl, Av. Panamericana, Edificio Medikal Piso 8';
  const CLINICA = 'Clínica del Valle, Av. Simón López Nro. 512';
  const MATERNO = 'Centro Materno San José, Calle Bolívar Nro. 230';
  const RADIO   = 'Centro de Radiología Smart, Av. Blanco Galindo Km. 3';
  const LAB     = 'Laboratorio Central, Calle Aroma Nro. 145';

  const catalog = [
    // Consultas
    { name: 'Consulta médica general',      description: 'Consulta con médico general',                     duration: 20, address: MEDIKL },
    { name: 'Consulta especialista',        description: 'Consulta con médico especialista',                duration: 30, address: MEDIKL },

    // Ecografías
    { name: 'Ecografía abdominal',          description: 'Examen de órganos abdominales por ultrasonido',   duration: 30, address: CLINICA },
    { name: 'Ecografía pélvica',            description: 'Examen de órganos pélvicos por ultrasonido',      duration: 30, address: CLINICA },
    { name: 'Ecografía obstétrica',         description: 'Control y seguimiento del embarazo',              duration: 45, address: MATERNO },
    { name: 'Ecografía de partes blandas',  description: 'Examen de tejidos blandos por ultrasonido',       duration: 20, address: MEDIKL },

    // Imágenes
    { name: 'Radiografía de tórax',         description: 'Imagen radiológica del tórax',                   duration: 15, address: RADIO },
    { name: 'Radiografía ósea',             description: 'Imagen radiológica de huesos y articulaciones',   duration: 15, address: RADIO },
    { name: 'Electrocardiograma',           description: 'Registro de la actividad eléctrica del corazón', duration: 20, address: MEDIKL },

    // Laboratorios
    { name: 'Hemograma completo',           description: 'Análisis de células sanguíneas con diferencial',  duration: 10, address: LAB },
    { name: 'Glucemia en ayunas',           description: 'Nivel de glucosa en sangre en ayunas',            duration: 10, address: LAB },
    { name: 'Perfil lipídico',              description: 'Colesterol total, HDL, LDL y triglicéridos',      duration: 10, address: LAB },
    { name: 'Perfil hepático',              description: 'Función hepática: ALT, AST, bilirrubina',         duration: 10, address: LAB },
    { name: 'Uroanálisis',                  description: 'Análisis físico-químico de orina',                duration: 10, address: LAB },
  ];

  const result: Record<string, StudyType> = {};

  for (const data of catalog) {
    const existing = await repo.findOne({ where: { name: data.name } });
    if (existing) {
      result[data.name] = await repo.save({ ...existing, ...data });
      console.log(`  [ok]   ${data.name} (updated)`);
    } else {
      result[data.name] = await repo.save(repo.create(data));
      console.log(`  [ok]   ${data.name} (created)`);
    }
  }

  return result;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

async function seedAppointmentsForPatient(
  repo: Repository<Appointment>,
  patient: User,
  doctor: User,
  appointments: Array<{
    studyType: StudyType;
    scheduledDate: Date;
    duration: number;
    reason: string;
    status: AppointmentStatus;
    notes?: string;
  }>,
): Promise<void> {
  const existing = await repo.count({ where: { patientId: patient.id } });
  if (existing > 0) {
    console.log(`  [skip] ${patient.fullName} — already has appointments`);
    return;
  }
  for (const appt of appointments) {
    await repo.save(repo.create({
      patientId: patient.id,
      doctorId: doctor.id,
      studyTypeId: appt.studyType.id,
      scheduledDate: appt.scheduledDate,
      duration: appt.duration,
      reason: appt.reason,
      notes: appt.notes ?? null,
      status: appt.status,
    }));
  }
  console.log(`  [ok]   ${patient.fullName} — ${appointments.length} appointment(s)`);
}

async function seedAppointments(
  ds: DataSource,
  users: Awaited<ReturnType<typeof seedUsers>>,
  st: Record<string, StudyType>,
): Promise<void> {
  const repo = ds.getRepository(Appointment);
  const { garcia, rodriguez, carlos, ana, roberto, laura, miguel } = users;

  // Carlos López — dolor abdominal recurrente, seguimiento digestivo
  await seedAppointmentsForPatient(repo, carlos, garcia, [
    { studyType: st['Ecografía abdominal'],   scheduledDate: daysAgo(30), duration: 30, reason: 'Dolor abdominal recurrente en cuadrante inferior derecho', status: AppointmentStatus.COMPLETED },
    { studyType: st['Hemograma completo'],     scheduledDate: daysAgo(30), duration: 10, reason: 'Descarte de proceso infeccioso asociado a dolor abdominal', status: AppointmentStatus.COMPLETED },
    { studyType: st['Consulta médica general'],scheduledDate: daysFromNow(5), duration: 20, reason: 'Control post-ecografía abdominal, evaluación de resultados', status: AppointmentStatus.SCHEDULED },
  ]);

  // Ana Martínez — diabetes tipo 2, control metabólico trimestral
  await seedAppointmentsForPatient(repo, ana, garcia, [
    { studyType: st['Glucemia en ayunas'],     scheduledDate: daysAgo(90), duration: 10, reason: 'Control glucémico trimestral — diabetes tipo 2 diagnosticada hace 3 años', status: AppointmentStatus.COMPLETED },
    { studyType: st['Perfil lipídico'],        scheduledDate: daysAgo(90), duration: 10, reason: 'Control de dislipidemia asociada a diabetes tipo 2', status: AppointmentStatus.COMPLETED },
    { studyType: st['Glucemia en ayunas'],     scheduledDate: daysAgo(3),  duration: 10, reason: 'Control glucémico trimestral — ajuste de dosis de metformina', status: AppointmentStatus.COMPLETED },
    { studyType: st['Hemograma completo'],     scheduledDate: daysAgo(3),  duration: 10, reason: 'Control hematológico de rutina en paciente diabética', status: AppointmentStatus.COMPLETED },
    { studyType: st['Consulta especialista'], scheduledDate: daysFromNow(14), duration: 30, reason: 'Consulta con endocrinólogo por descontrol glucémico reciente', status: AppointmentStatus.SCHEDULED },
  ]);

  // Roberto Silva — cardiopatía isquémica, seguimiento cardiológico
  await seedAppointmentsForPatient(repo, roberto, rodriguez, [
    { studyType: st['Electrocardiograma'],     scheduledDate: daysAgo(60), duration: 20, reason: 'Dolor precordial al esfuerzo físico moderado, posible angina', status: AppointmentStatus.COMPLETED },
    { studyType: st['Radiografía de tórax'],   scheduledDate: daysAgo(60), duration: 15, reason: 'Evaluación de silueta cardíaca por sospecha de cardiomegalia', status: AppointmentStatus.COMPLETED },
    { studyType: st['Perfil lipídico'],        scheduledDate: daysAgo(60), duration: 10, reason: 'Control lipídico en paciente con factores de riesgo cardiovascular', status: AppointmentStatus.COMPLETED },
    { studyType: st['Electrocardiograma'],     scheduledDate: daysAgo(10), duration: 20, reason: 'Control post-tratamiento antianginoso, evaluación de respuesta', status: AppointmentStatus.COMPLETED },
    { studyType: st['Consulta especialista'], scheduledDate: daysFromNow(7), duration: 30, reason: 'Seguimiento cardiológico mensual — cardiopatía isquémica estable', status: AppointmentStatus.SCHEDULED },
  ]);

  // Laura Pérez — embarazo de 28 semanas, control prenatal
  await seedAppointmentsForPatient(repo, laura, garcia, [
    { studyType: st['Ecografía obstétrica'],   scheduledDate: daysAgo(56), duration: 45, reason: 'Control prenatal semana 20 — morfología fetal', status: AppointmentStatus.COMPLETED },
    { studyType: st['Hemograma completo'],     scheduledDate: daysAgo(56), duration: 10, reason: 'Control hematológico prenatal — descarte de anemia gestacional', status: AppointmentStatus.COMPLETED },
    { studyType: st['Ecografía obstétrica'],   scheduledDate: daysAgo(7),  duration: 45, reason: 'Control prenatal semana 28 — biometría fetal y líquido amniótico', status: AppointmentStatus.COMPLETED },
    { studyType: st['Glucemia en ayunas'],     scheduledDate: daysAgo(7),  duration: 10, reason: 'Cribado de diabetes gestacional semana 28', status: AppointmentStatus.COMPLETED },
    { studyType: st['Ecografía obstétrica'],   scheduledDate: daysFromNow(21), duration: 45, reason: 'Control prenatal semana 32 — posición fetal y placenta', status: AppointmentStatus.SCHEDULED },
  ]);

  // Miguel Torres — chequeo preventivo anual, paciente joven
  await seedAppointmentsForPatient(repo, miguel, rodriguez, [
    { studyType: st['Consulta médica general'],scheduledDate: daysAgo(5),  duration: 20, reason: 'Chequeo preventivo anual — paciente asintomático', status: AppointmentStatus.COMPLETED, notes: 'Paciente refiere cansancio leve. Sin antecedentes patológicos.' },
    { studyType: st['Hemograma completo'],     scheduledDate: daysAgo(5),  duration: 10, reason: 'Laboratorios de rutina solicitados en chequeo anual', status: AppointmentStatus.COMPLETED },
    { studyType: st['Perfil lipídico'],        scheduledDate: daysAgo(5),  duration: 10, reason: 'Perfil lipídico basal en paciente joven con antecedentes familiares de dislipidemia', status: AppointmentStatus.CANCELLED, notes: 'Paciente no asistió. Reprogramar.' },
    { studyType: st['Perfil lipídico'],        scheduledDate: daysFromNow(3), duration: 10, reason: 'Perfil lipídico basal — reprogramado por inasistencia previa', status: AppointmentStatus.SCHEDULED },
  ]);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  await dataSource.initialize();
  console.log('Connected to database\n');

  console.log('Seeding users...');
  const users = await seedUsers(dataSource);

  console.log('\nSeeding study types...');
  const studyTypes = await seedStudyTypes(dataSource);

  console.log('\nSeeding appointments...');
  await seedAppointments(dataSource, users, studyTypes);

  await dataSource.destroy();
  console.log('\nSeed complete ✓');
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
