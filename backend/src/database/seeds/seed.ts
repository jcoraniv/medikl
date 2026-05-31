import 'reflect-metadata';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import { BCRYPT_ROUNDS, DEFAULT_LOCALE } from '../../common/constants/app.constants';
import { User, UserRole } from '../../users/entities/user.entity';
import { StudyType } from '../../study-types/entities/study-type.entity';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { StudyResult } from '../../study-results/entities/study-result.entity';
import { Activity, ActivityType } from '../../activities/entities/activity.entity';
import { CodeSubscriber } from '../../common/subscribers/code.subscriber';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'medikl',
  entities: [User, StudyType, Appointment, StudyResult, Activity],
  subscribers: [CodeSubscriber],
  synchronize: false,
  logging: false,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const user = await repo.save(repo.create({ ...data, passwordHash }));
  console.log(`  [ok]   ${data.email} (${data.role}) — HC-${user.code}`);
  return user;
}

// ─── Users ───────────────────────────────────────────────────────────────────

async function seedUsers(ds: DataSource) {
  const repo = ds.getRepository(User);

  const [admin, garcia, rodriguez, carlos, ana, roberto, laura, miguel] = await Promise.all([
    upsertUser(repo, { email: 'admin@medikl.dev',     fullName: 'Admin Sistema',     password: 'Password123!', role: UserRole.ADMIN }),
    upsertUser(repo, { email: 'garcia@medikl.dev',    fullName: 'Dra. María García', password: 'Password123!', role: UserRole.DOCTOR }),
    upsertUser(repo, { email: 'rodriguez@medikl.dev', fullName: 'Dr. Juan Rodríguez',password: 'Password123!', role: UserRole.DOCTOR }),
    upsertUser(repo, { email: 'carlos@medikl.dev',    fullName: 'Carlos López',      password: 'Password123!', role: UserRole.PATIENT }),
    upsertUser(repo, { email: 'ana@medikl.dev',       fullName: 'Ana Martínez',      password: 'Password123!', role: UserRole.PATIENT }),
    upsertUser(repo, { email: 'roberto@medikl.dev',   fullName: 'Roberto Silva',     password: 'Password123!', role: UserRole.PATIENT }),
    upsertUser(repo, { email: 'laura@medikl.dev',     fullName: 'Laura Pérez',       password: 'Password123!', role: UserRole.PATIENT }),
    upsertUser(repo, { email: 'miguel@medikl.dev',    fullName: 'Miguel Torres',     password: 'Password123!', role: UserRole.PATIENT }),
  ]);

  return { admin, garcia, rodriguez, carlos, ana, roberto, laura, miguel };
}

// ─── Study Types ──────────────────────────────────────────────────────────────

async function seedStudyTypes(ds: DataSource, admin: User): Promise<Record<string, StudyType>> {
  const repo = ds.getRepository(StudyType);

  const MEDIKL  = 'Medikl, Av. Panamericana, Edificio Medikal Piso 8';
  const CLINICA = 'Clínica del Valle, Av. Simón López Nro. 512';
  const MATERNO = 'Centro Materno San José, Calle Bolívar Nro. 230';
  const RADIO   = 'Centro de Radiología Smart, Av. Blanco Galindo Km. 3';
  const LAB     = 'Laboratorio Central, Calle Aroma Nro. 145';

  const catalog = [
    { name: 'Consulta médica general',     description: 'Consulta con médico general',                     duration: 20, address: MEDIKL  },
    { name: 'Consulta especialista',       description: 'Consulta con médico especialista',                duration: 30, address: MEDIKL  },
    { name: 'Ecografía abdominal',         description: 'Examen de órganos abdominales por ultrasonido',   duration: 30, address: CLINICA },
    { name: 'Ecografía pélvica',           description: 'Examen de órganos pélvicos por ultrasonido',      duration: 30, address: CLINICA },
    { name: 'Ecografía obstétrica',        description: 'Control y seguimiento del embarazo',              duration: 45, address: MATERNO },
    { name: 'Ecografía de partes blandas', description: 'Examen de tejidos blandos por ultrasonido',       duration: 20, address: MEDIKL  },
    { name: 'Radiografía de tórax',        description: 'Imagen radiológica del tórax',                   duration: 15, address: RADIO   },
    { name: 'Radiografía ósea',            description: 'Imagen radiológica de huesos y articulaciones',   duration: 15, address: RADIO   },
    { name: 'Electrocardiograma',          description: 'Registro de la actividad eléctrica del corazón', duration: 20, address: MEDIKL  },
    { name: 'Hemograma completo',          description: 'Análisis de células sanguíneas con diferencial',  duration: 10, address: LAB     },
    { name: 'Glucemia en ayunas',          description: 'Nivel de glucosa en sangre en ayunas',            duration: 10, address: LAB     },
    { name: 'Perfil lipídico',             description: 'Colesterol total, HDL, LDL y triglicéridos',      duration: 10, address: LAB     },
    { name: 'Perfil hepático',             description: 'Función hepática: ALT, AST, bilirrubina',         duration: 10, address: LAB     },
    { name: 'Uroanálisis',                 description: 'Análisis físico-químico de orina',                duration: 10, address: LAB     },
  ];

  const result: Record<string, StudyType> = {};
  for (const data of catalog) {
    const existing = await repo.findOne({ where: { name: data.name } });
    if (existing) {
      result[data.name] = await repo.save({ ...existing, ...data, createdById: existing.createdById ?? admin.id });
      console.log(`  [ok]   ${data.name} (updated)`);
    } else {
      result[data.name] = await repo.save(repo.create({ ...data, createdById: admin.id }));
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
): Promise<Appointment[]> {
  const existing = await repo.count({ where: { patientId: patient.id } });
  if (existing > 0) {
    console.log(`  [skip] ${patient.fullName} — already has appointments`);
    return repo.find({ where: { patientId: patient.id }, relations: ['patient', 'doctor', 'studyType'] });
  }
  const saved: Appointment[] = [];
  for (const appt of appointments) {
    const a = await repo.save(repo.create({
      patientId: patient.id,
      doctorId: doctor.id,
      studyTypeId: appt.studyType.id,
      scheduledDate: appt.scheduledDate,
      duration: appt.duration,
      reason: appt.reason,
      notes: appt.notes ?? null,
      status: appt.status,
    }));
    saved.push(await repo.findOne({ where: { id: a.id }, relations: ['patient', 'doctor', 'studyType'] }) as Appointment);
  }
  console.log(`  [ok]   ${patient.fullName} — ${appointments.length} appointment(s)`);
  return saved;
}

async function seedAppointments(
  ds: DataSource,
  users: Awaited<ReturnType<typeof seedUsers>>,
  st: Record<string, StudyType>,
): Promise<Appointment[]> {
  const repo = ds.getRepository(Appointment);
  const { garcia, rodriguez, carlos, ana, roberto, laura, miguel } = users;

  const all = await Promise.all([
    seedAppointmentsForPatient(repo, carlos, garcia, [
      { studyType: st['Ecografía abdominal'],    scheduledDate: daysAgo(30),    duration: 30, reason: 'Dolor abdominal recurrente en cuadrante inferior derecho',               status: AppointmentStatus.COMPLETED },
      { studyType: st['Hemograma completo'],      scheduledDate: daysAgo(30),    duration: 10, reason: 'Descarte de proceso infeccioso asociado a dolor abdominal',              status: AppointmentStatus.COMPLETED },
      { studyType: st['Consulta médica general'], scheduledDate: daysFromNow(5), duration: 20, reason: 'Control post-ecografía abdominal, evaluación de resultados',             status: AppointmentStatus.SCHEDULED },
    ]),
    seedAppointmentsForPatient(repo, ana, garcia, [
      { studyType: st['Glucemia en ayunas'],   scheduledDate: daysAgo(90),    duration: 10, reason: 'Control glucémico trimestral — diabetes tipo 2 diagnosticada hace 3 años', status: AppointmentStatus.COMPLETED },
      { studyType: st['Perfil lipídico'],      scheduledDate: daysAgo(90),    duration: 10, reason: 'Control de dislipidemia asociada a diabetes tipo 2',                       status: AppointmentStatus.COMPLETED },
      { studyType: st['Glucemia en ayunas'],   scheduledDate: daysAgo(3),     duration: 10, reason: 'Control glucémico trimestral — ajuste de dosis de metformina',             status: AppointmentStatus.COMPLETED },
      { studyType: st['Hemograma completo'],   scheduledDate: daysAgo(3),     duration: 10, reason: 'Control hematológico de rutina en paciente diabética',                    status: AppointmentStatus.COMPLETED },
      { studyType: st['Consulta especialista'],scheduledDate: daysFromNow(14),duration: 30, reason: 'Consulta con endocrinólogo por descontrol glucémico reciente',             status: AppointmentStatus.SCHEDULED },
    ]),
    seedAppointmentsForPatient(repo, roberto, rodriguez, [
      { studyType: st['Electrocardiograma'],   scheduledDate: daysAgo(60),   duration: 20, reason: 'Dolor precordial al esfuerzo físico moderado, posible angina',             status: AppointmentStatus.COMPLETED },
      { studyType: st['Radiografía de tórax'], scheduledDate: daysAgo(60),   duration: 15, reason: 'Evaluación de silueta cardíaca por sospecha de cardiomegalia',             status: AppointmentStatus.COMPLETED },
      { studyType: st['Perfil lipídico'],      scheduledDate: daysAgo(60),   duration: 10, reason: 'Control lipídico en paciente con factores de riesgo cardiovascular',        status: AppointmentStatus.COMPLETED },
      { studyType: st['Electrocardiograma'],   scheduledDate: daysAgo(10),   duration: 20, reason: 'Control post-tratamiento antianginoso, evaluación de respuesta',           status: AppointmentStatus.COMPLETED },
      { studyType: st['Consulta especialista'],scheduledDate: daysFromNow(7),duration: 30, reason: 'Seguimiento cardiológico mensual — cardiopatía isquémica estable',         status: AppointmentStatus.SCHEDULED },
    ]),
    seedAppointmentsForPatient(repo, laura, garcia, [
      { studyType: st['Ecografía obstétrica'], scheduledDate: daysAgo(56),    duration: 45, reason: 'Control prenatal semana 20 — morfología fetal',                           status: AppointmentStatus.COMPLETED },
      { studyType: st['Hemograma completo'],   scheduledDate: daysAgo(56),    duration: 10, reason: 'Control hematológico prenatal — descarte de anemia gestacional',          status: AppointmentStatus.COMPLETED },
      { studyType: st['Ecografía obstétrica'], scheduledDate: daysAgo(7),     duration: 45, reason: 'Control prenatal semana 28 — biometría fetal y líquido amniótico',        status: AppointmentStatus.COMPLETED },
      { studyType: st['Glucemia en ayunas'],   scheduledDate: daysAgo(7),     duration: 10, reason: 'Cribado de diabetes gestacional semana 28',                               status: AppointmentStatus.COMPLETED },
      { studyType: st['Ecografía obstétrica'], scheduledDate: daysFromNow(21),duration: 45, reason: 'Control prenatal semana 32 — posición fetal y placenta',                  status: AppointmentStatus.SCHEDULED },
    ]),
    seedAppointmentsForPatient(repo, miguel, rodriguez, [
      { studyType: st['Consulta médica general'],scheduledDate: daysAgo(5),    duration: 20, reason: 'Chequeo preventivo anual — paciente asintomático',                       status: AppointmentStatus.COMPLETED, notes: 'Paciente refiere cansancio leve. Sin antecedentes patológicos.' },
      { studyType: st['Hemograma completo'],     scheduledDate: daysAgo(5),    duration: 10, reason: 'Laboratorios de rutina solicitados en chequeo anual',                    status: AppointmentStatus.COMPLETED },
      { studyType: st['Perfil lipídico'],        scheduledDate: daysAgo(5),    duration: 10, reason: 'Perfil lipídico basal en paciente joven con antecedentes familiares de dislipidemia', status: AppointmentStatus.CANCELLED, notes: 'Paciente no asistió. Reprogramar.' },
      { studyType: st['Perfil lipídico'],        scheduledDate: daysFromNow(3),duration: 10, reason: 'Perfil lipídico basal — reprogramado por inasistencia previa',           status: AppointmentStatus.SCHEDULED },
    ]),
  ]);

  return all.flat();
}

// ─── Study Results ────────────────────────────────────────────────────────────

async function seedStudyResults(
  ds: DataSource,
  appointments: Appointment[],
): Promise<StudyResult[]> {
  const repo = ds.getRepository(StudyResult);
  const completed = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED);

  const existingCount = await repo.count();
  if (existingCount > 0) {
    console.log(`  [skip] study results already exist`);
    return repo.find({ relations: ['patient', 'doctor', 'appointment'] });
  }

  const resultData: Array<{ appointment: Appointment; findings: string; conclusion: string }> = [
    // Carlos — ecografía abdominal
    {
      appointment: completed.find((a) => a.patient.fullName === 'Carlos López' && a.studyType?.name === 'Ecografía abdominal')!,
      findings: 'Ecografía abdominal: hígado de tamaño y ecogenicidad normal. Vesícula biliar sin litiasis. Páncreas no visualizado adecuadamente por interposición gaseosa. Bazo homogéneo. Riñones sin alteraciones. Pequeña cantidad de líquido libre en espacio de Morrison, hallazgo inespecífico.',
      conclusion: 'Estudio dentro de límites normales para la edad. Se recomienda repetir en 6 meses si persiste sintomatología. Correlacionar con cuadro clínico y laboratorios.',
    },
    // Carlos — hemograma
    {
      appointment: completed.find((a) => a.patient.fullName === 'Carlos López' && a.studyType?.name === 'Hemograma completo')!,
      findings: 'Hemograma: leucocitos 7.200/mm³ con fórmula normal. Hemoglobina 14.2 g/dL. Hematocrito 42%. Plaquetas 210.000/mm³. Sin leucocitosis ni desviación izquierda.',
      conclusion: 'Hemograma dentro de parámetros normales. No evidencia de proceso infeccioso activo.',
    },
    // Ana — glucemia primera
    {
      appointment: completed.find((a) => a.patient.fullName === 'Ana Martínez' && a.studyType?.name === 'Glucemia en ayunas' && a.scheduledDate < daysAgo(30))!,
      findings: 'Glucemia en ayunas: 142 mg/dL (valor de referencia < 100 mg/dL). HbA1c solicitada en paralelo: 7.8%. Paciente refiere buena adherencia a metformina 850 mg c/12h.',
      conclusion: 'Diabetes tipo 2 con control subóptimo. Se ajusta metformina a 1000 mg c/12h. Dieta estricta. Control en 3 meses.',
    },
    // Ana — perfil lipídico
    {
      appointment: completed.find((a) => a.patient.fullName === 'Ana Martínez' && a.studyType?.name === 'Perfil lipídico')!,
      findings: 'Colesterol total: 218 mg/dL. HDL: 42 mg/dL. LDL: 148 mg/dL. Triglicéridos: 210 mg/dL. Índice aterogénico aumentado.',
      conclusion: 'Dislipidemia mixta. Se inicia atorvastatina 20 mg/día. Dieta hipocalórica e hipolipemiante. Control en 3 meses.',
    },
    // Ana — glucemia segunda
    {
      appointment: completed.find((a) => a.patient.fullName === 'Ana Martínez' && a.studyType?.name === 'Glucemia en ayunas' && a.scheduledDate > daysAgo(30))!,
      findings: 'Glucemia en ayunas: 118 mg/dL. Mejoría respecto al control previo (142 mg/dL). HbA1c: 7.1%. Paciente refiere buena tolerancia al esquema actual.',
      conclusion: 'Mejoría del control glucémico con ajuste de metformina. Mantener esquema actual. Próximo control en 3 meses.',
    },
    // Ana — hemograma
    {
      appointment: completed.find((a) => a.patient.fullName === 'Ana Martínez' && a.studyType?.name === 'Hemograma completo')!,
      findings: 'Hemograma: leucocitos 6.800/mm³. Hemoglobina 12.4 g/dL (leve anemia normocítica). Hematocrito 37%. Plaquetas 195.000/mm³.',
      conclusion: 'Anemia leve normocítica normocrómica. Se solicita ferritina y vitamina B12. Probable déficit nutricional.',
    },
    // Roberto — electrocardiograma primero
    {
      appointment: completed.find((a) => a.patient.fullName === 'Roberto Silva' && a.studyType?.name === 'Electrocardiograma' && a.scheduledDate < daysAgo(30))!,
      findings: 'ECG: ritmo sinusal a 78 lpm. Eje normal. PR 0.18 seg. QRS 0.08 seg. ST con depresión de 1 mm en V4-V6 en reposo. QT normal.',
      conclusion: 'Cambios isquémicos sugestivos en cara lateral. Se deriva a cardiología para ecocardiograma y prueba de esfuerzo.',
    },
    // Roberto — radiografía tórax
    {
      appointment: completed.find((a) => a.patient.fullName === 'Roberto Silva' && a.studyType?.name === 'Radiografía de tórax')!,
      findings: 'Radiografía PA de tórax: índice cardiotorácico 0.52 (límite superior normal). Campos pulmonares sin opacidades. Senos costofrénicos libres. Aorta elongada.',
      conclusion: 'Cardiomegalia leve. Aorta elongada compatible con edad y factores de riesgo. Correlacionar con ecocardiograma.',
    },
    // Roberto — perfil lipídico
    {
      appointment: completed.find((a) => a.patient.fullName === 'Roberto Silva' && a.studyType?.name === 'Perfil lipídico')!,
      findings: 'Colesterol total: 245 mg/dL. HDL: 35 mg/dL (bajo). LDL: 175 mg/dL (elevado). Triglicéridos: 280 mg/dL (elevados).',
      conclusion: 'Dislipidemia severa con riesgo cardiovascular alto. Se inicia rosuvastatina 20 mg/día + fenofibrato 145 mg/día. Control en 6 semanas.',
    },
    // Roberto — electrocardiograma segundo
    {
      appointment: completed.find((a) => a.patient.fullName === 'Roberto Silva' && a.studyType?.name === 'Electrocardiograma' && a.scheduledDate > daysAgo(30))!,
      findings: 'ECG control: ritmo sinusal a 72 lpm. Desaparición de la depresión del ST en V4-V6. QRS normal. Sin nuevos cambios.',
      conclusion: 'Mejoría electrocardiográfica con tratamiento antianginoso. Continuar con nitratos y betabloqueante. Seguimiento mensual.',
    },
    // Laura — ecografía obstétrica semana 20
    {
      appointment: completed.find((a) => a.patient.fullName === 'Laura Pérez' && a.studyType?.name === 'Ecografía obstétrica' && a.scheduledDate < daysAgo(30))!,
      findings: 'Ecografía obstétrica semana 20: feto único vivo en presentación cefálica. Biometría acorde a edad gestacional: DBP 48mm, CC 174mm, CA 150mm, LF 34mm. Placenta anterior grado I. Líquido amniótico normal (ILA 14cm). Morfología fetal sin alteraciones detectables.',
      conclusion: 'Embarazo de 20 semanas evolutivo. Morfología normal. Próximo control a las 28 semanas.',
    },
    // Laura — hemograma
    {
      appointment: completed.find((a) => a.patient.fullName === 'Laura Pérez' && a.studyType?.name === 'Hemograma completo')!,
      findings: 'Hemograma: leucocitos 9.200/mm³ (leucocitosis fisiológica del embarazo). Hemoglobina 10.8 g/dL. Hematocrito 32%. Plaquetas 220.000/mm³.',
      conclusion: 'Anemia leve gestacional. Se inicia sulfato ferroso 300 mg/día + ácido fólico. Control en 4 semanas.',
    },
    // Laura — ecografía obstétrica semana 28
    {
      appointment: completed.find((a) => a.patient.fullName === 'Laura Pérez' && a.studyType?.name === 'Ecografía obstétrica' && a.scheduledDate > daysAgo(30))!,
      findings: 'Ecografía obstétrica semana 28: feto único vivo en presentación cefálica. Biometría acorde: DBP 70mm, CC 260mm, CA 240mm, LF 54mm. Peso fetal estimado 1.100g (percentil 45). Placenta anterior grado II. ILA 13cm. Movimientos fetales presentes.',
      conclusion: 'Embarazo de 28 semanas en evolución normal. Crecimiento fetal adecuado. Próximo control a las 32 semanas.',
    },
    // Laura — glucemia
    {
      appointment: completed.find((a) => a.patient.fullName === 'Laura Pérez' && a.studyType?.name === 'Glucemia en ayunas')!,
      findings: 'Glucemia en ayunas: 88 mg/dL. Test de O\'Sullivan (50g glucosa): 128 mg/dL (valor de corte 140 mg/dL).',
      conclusion: 'Cribado de diabetes gestacional negativo. No requiere PTOG. Mantener dieta equilibrada.',
    },
    // Miguel — consulta médica
    {
      appointment: completed.find((a) => a.patient.fullName === 'Miguel Torres' && a.studyType?.name === 'Consulta médica general')!,
      findings: 'Paciente masculino de 28 años, asintomático. PA: 118/76 mmHg. FC: 72 lpm. Peso: 78 kg. Talla: 175 cm. IMC: 25.5 kg/m² (sobrepeso leve). Examen físico sin hallazgos patológicos.',
      conclusion: 'Paciente en buen estado general. Sobrepeso leve. Se recomienda actividad física regular y dieta balanceada. Chequeo anual programado.',
    },
    // Miguel — hemograma
    {
      appointment: completed.find((a) => a.patient.fullName === 'Miguel Torres' && a.studyType?.name === 'Hemograma completo')!,
      findings: 'Hemograma: leucocitos 6.500/mm³ con fórmula normal. Hemoglobina 15.1 g/dL. Hematocrito 45%. Plaquetas 230.000/mm³.',
      conclusion: 'Hemograma completamente normal.',
    },
  ];

  const saved: StudyResult[] = [];
  for (const { appointment, findings, conclusion } of resultData) {
    if (!appointment) continue;
    const result = await repo.save(repo.create({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      findings,
      conclusion,
    }));
    saved.push(result);
    console.log(`  [ok]   ${appointment.patient.fullName} — ${appointment.studyType?.name}`);
  }
  return saved;
}

// ─── Activities ───────────────────────────────────────────────────────────────

function buildAppointmentSnapshot(a: Appointment): Record<string, unknown> {
  return {
    id: a.id,
    code: a.code,
    status: a.status,
    scheduledDate: a.scheduledDate,
    duration: a.duration,
    reason: a.reason,
    patient: { id: a.patient.id, fullName: a.patient.fullName, code: a.patient.code },
    doctor:  { id: a.doctor.id,  fullName: a.doctor.fullName },
    studyType: a.studyType ? { id: a.studyType.id, name: a.studyType.name } : null,
  };
}

function buildResultSnapshot(r: StudyResult, a: Appointment): Record<string, unknown> {
  return {
    id: r.id,
    findings:   r.findings,
    conclusion: r.conclusion,
    patient: { id: a.patient.id, fullName: a.patient.fullName, code: a.patient.code },
    doctor:  { id: a.doctor.id,  fullName: a.doctor.fullName },
    appointment: {
      id:            a.id,
      code:          a.code,
      scheduledDate: a.scheduledDate,
      duration:      a.duration,
      reason:        a.reason,
      notes:         a.notes,
      studyType: a.studyType ? { id: a.studyType.id, name: a.studyType.name } : null,
    },
  };
}

function appointmentText(type: ActivityType, a: Appointment): string {
  const p = `${a.patient.fullName} (HC-${a.patient.code})`;
  const d = a.doctor.fullName;
  const st = a.studyType?.name;
  const date = new Date(a.scheduledDate).toLocaleString(DEFAULT_LOCALE);

  switch (type) {
    case ActivityType.APPOINTMENT_SCHEDULED:
      return `Cita programada para ${p} con ${d} el ${date}${st ? `. Tipo de estudio: ${st}` : ''}${a.reason ? `. Motivo: ${a.reason}` : ''}.`;
    case ActivityType.APPOINTMENT_COMPLETED:
      return `Cita completada para ${p} con ${d}.`;
    case ActivityType.APPOINTMENT_CANCELLED:
      return `Cita cancelada para ${p} con ${d}.`;
    default:
      return `Actividad registrada para ${p}.`;
  }
}

function resultText(r: StudyResult, a: Appointment): string {
  const p  = `${a.patient.fullName} (HC-${a.patient.code})`;
  const st = a.studyType?.name;
  let text = `Resultado clínico registrado para ${p} por ${a.doctor.fullName}`;
  if (st)           text += `. Estudio: ${st}`;
  if (a.reason)     text += `. Motivo: ${a.reason}`;
  if (a.notes)      text += `. Notas: ${a.notes}`;
  text += `. Hallazgos: ${r.findings}`;
  if (r.conclusion) text += `. Conclusión: ${r.conclusion}`;
  return text + '.';
}

async function seedActivities(
  ds: DataSource,
  appointments: Appointment[],
  results: StudyResult[],
): Promise<void> {
  const repo = ds.getRepository(Activity);

  const existingCount = await repo.count();
  if (existingCount > 0) {
    console.log(`  [skip] activities already exist`);
    return;
  }

  const activities: Array<Partial<Activity>> = [];

  for (const a of appointments) {
    // SCHEDULED para todas las citas
    activities.push({
      type: ActivityType.APPOINTMENT_SCHEDULED,
      patientId: a.patientId,
      entityId: a.id,
      entityType: 'Appointment',
      snapshot: buildAppointmentSnapshot(a),
      delta: null,
      generatedText: appointmentText(ActivityType.APPOINTMENT_SCHEDULED, a),
      embedding: null,
    });

    if (a.status === AppointmentStatus.COMPLETED) {
      activities.push({
        type: ActivityType.APPOINTMENT_COMPLETED,
        patientId: a.patientId,
        entityId: a.id,
        entityType: 'Appointment',
        snapshot: buildAppointmentSnapshot(a),
        delta: null,
        generatedText: appointmentText(ActivityType.APPOINTMENT_COMPLETED, a),
        embedding: null,
      });
    }

    if (a.status === AppointmentStatus.CANCELLED) {
      activities.push({
        type: ActivityType.APPOINTMENT_CANCELLED,
        patientId: a.patientId,
        entityId: a.id,
        entityType: 'Appointment',
        snapshot: buildAppointmentSnapshot(a),
        delta: null,
        generatedText: appointmentText(ActivityType.APPOINTMENT_CANCELLED, a),
        embedding: null,
      });
    }
  }

  for (const r of results) {
    const appt = appointments.find((a) => a.id === r.appointmentId);
    if (!appt) continue;
    activities.push({
      type: ActivityType.RESULT_CREATED,
      patientId: r.patientId,
      entityId: r.id,
      entityType: 'StudyResult',
      snapshot: buildResultSnapshot(r, appt),
      delta: null,
      generatedText: resultText(r, appt),
      embedding: null,
    });
  }

  for (const act of activities) {
    await repo.save(repo.create(act));
  }
  console.log(`  [ok]   ${activities.length} activities created`);
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

async function seedEmbeddings(ds: DataSource): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('  [skip] OPENAI_API_KEY not set — embeddings skipped');
    return;
  }

  const repo = ds.getRepository(Activity);
  const pending = await repo
    .createQueryBuilder('a')
    .where('a.embedding IS NULL')
    .getMany();

  if (pending.length === 0) {
    console.log('  [skip] all activities already have embeddings');
    return;
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';

  console.log(`  Generating embeddings for ${pending.length} activities (batch)...`);
  const response = await openai.embeddings.create({
    model,
    input: pending.map((a) => a.generatedText),
  });

  for (let i = 0; i < pending.length; i++) {
    await repo.update(pending[i].id, { embedding: response.data[i].embedding });
  }
  console.log(`  [ok]   ${pending.length} embeddings stored`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  await dataSource.initialize();
  console.log('Connected to database\n');

  console.log('Seeding users...');
  const users = await seedUsers(dataSource);

  console.log('\nSeeding study types...');
  const studyTypes = await seedStudyTypes(dataSource, users.admin);

  console.log('\nSeeding appointments...');
  const appointments = await seedAppointments(dataSource, users, studyTypes);

  console.log('\nSeeding study results...');
  const results = await seedStudyResults(dataSource, appointments);

  console.log('\nSeeding activities...');
  await seedActivities(dataSource, appointments, results);

  console.log('\nGenerating embeddings...');
  await seedEmbeddings(dataSource);

  await dataSource.destroy();
  console.log('\nSeed complete ✓');
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
