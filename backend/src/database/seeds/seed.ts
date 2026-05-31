import 'reflect-metadata';
import { DataSource } from 'typeorm';
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

async function seedUsers(ds: DataSource): Promise<Record<string, User>> {
  const repo = ds.getRepository(User);

  const users = [
    { email: 'admin@medikl.dev',   fullName: 'Admin Sistema',    password: 'Password123!', role: UserRole.ADMIN },
    { email: 'doctor@medikl.dev',  fullName: 'Dra. María García', password: 'Password123!', role: UserRole.DOCTOR },
    { email: 'patient@medikl.dev', fullName: 'Carlos López',      password: 'Password123!', role: UserRole.PATIENT },
  ];

  const result: Record<string, User> = {};

  for (const data of users) {
    let user = await repo.findOne({ where: { email: data.email } });
    if (user) {
      console.log(`  [skip] ${data.email}`);
    } else {
      const passwordHash = await bcrypt.hash(data.password, 10);
      user = await repo.save(repo.create({ email: data.email, fullName: data.fullName, passwordHash, role: data.role }));
      console.log(`  [ok]   ${data.email} (${data.role})`);
    }
    result[data.role] = user;
  }

  return result;
}

async function seedStudyTypes(ds: DataSource): Promise<StudyType[]> {
  const repo = ds.getRepository(StudyType);

  const catalog = [
    { name: 'Ecografía abdominal',  description: 'Examen de órganos abdominales por ultrasonido', duration: 30 },
    { name: 'Ecografía pélvica',    description: 'Examen de órganos pélvicos por ultrasonido',    duration: 30 },
    { name: 'Ecografía obstétrica', description: 'Control y seguimiento del embarazo',              duration: 45 },
    { name: 'Radiografía de tórax', description: 'Imagen radiológica del tórax',                   duration: 15 },
    { name: 'Análisis de sangre',   description: 'Hemograma completo con diferencial',              duration: 15 },
    { name: 'Electrocardiograma',   description: 'Registro de la actividad eléctrica del corazón', duration: 20 },
  ];

  const saved: StudyType[] = [];

  for (const data of catalog) {
    const existing = await repo.findOne({ where: { name: data.name } });
    if (existing) {
      console.log(`  [skip] ${data.name}`);
      saved.push(existing);
    } else {
      const st = await repo.save(repo.create(data));
      console.log(`  [ok]   ${data.name}`);
      saved.push(st);
    }
  }

  return saved;
}

async function seedAppointments(
  ds: DataSource,
  doctor: User,
  patient: User,
  studyTypes: StudyType[],
): Promise<void> {
  const repo = ds.getRepository(Appointment);

  const existing = await repo.count({ where: { patientId: patient.id, doctorId: doctor.id } });
  if (existing > 0) {
    console.log(`  [skip] appointments already exist`);
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 30, 0, 0);

  await repo.save(repo.create({
    patientId: patient.id,
    doctorId: doctor.id,
    studyTypeId: studyTypes[0].id,
    scheduledDate: yesterday,
    duration: 30,
    reason: 'Dolor abdominal recurrente',
    status: AppointmentStatus.COMPLETED,
  }));
  console.log(`  [ok]   completed appointment (${studyTypes[0].name})`);

  await repo.save(repo.create({
    patientId: patient.id,
    doctorId: doctor.id,
    studyTypeId: studyTypes[2].id,
    scheduledDate: nextWeek,
    duration: 45,
    reason: 'Control de embarazo',
    status: AppointmentStatus.SCHEDULED,
  }));
  console.log(`  [ok]   scheduled appointment (${studyTypes[2].name})`);
}

async function seed(): Promise<void> {
  await dataSource.initialize();
  console.log('Connected to database\n');

  console.log('Seeding users...');
  const users = await seedUsers(dataSource);

  console.log('\nSeeding study types...');
  const studyTypes = await seedStudyTypes(dataSource);

  console.log('\nSeeding appointments...');
  await seedAppointments(dataSource, users[UserRole.DOCTOR], users[UserRole.PATIENT], studyTypes);

  await dataSource.destroy();
  console.log('\nSeed complete ✓');
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
