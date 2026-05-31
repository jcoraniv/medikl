import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../../users/entities/user.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'medikl',
  entities: [User],
  synchronize: false,
  logging: false,
});

async function seedUsers(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(User);

  const users = [
    {
      email: 'admin@medikl.dev',
      fullName: 'Admin Sistema',
      password: 'Password123!',
      role: UserRole.ADMIN,
    },
    {
      email: 'doctor@medikl.dev',
      fullName: 'Dra. María García',
      password: 'Password123!',
      role: UserRole.DOCTOR,
    },
    {
      email: 'patient@medikl.dev',
      fullName: 'Carlos López',
      password: 'Password123!',
      role: UserRole.PATIENT,
    },
  ];

  for (const data of users) {
    const existing = await repo.findOne({ where: { email: data.email } });
    if (existing) {
      console.log(`  [skip] ${data.email} already exists`);
      continue;
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    await repo.save(
      repo.create({
        email: data.email,
        fullName: data.fullName,
        passwordHash,
        role: data.role,
      }),
    );
    console.log(`  [ok]   ${data.email} (${data.role})`);
  }
}

async function seed(): Promise<void> {
  await dataSource.initialize();
  console.log('Connected to database\n');

  console.log('Seeding users...');
  await seedUsers(dataSource);

  await dataSource.destroy();
  console.log('\nSeed complete ✓');
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
