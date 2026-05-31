import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { Activity, ActivityType } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);
  private readonly openai: OpenAI;

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  async createActivity(dto: CreateActivityDto): Promise<Activity> {
    const generatedText = this.generateText(dto.type, dto.snapshot);

    const activity = await this.activityRepo.save(
      this.activityRepo.create({
        type: dto.type,
        patientId: dto.patientId,
        entityId: dto.entityId,
        entityType: dto.entityType,
        snapshot: dto.snapshot,
        delta: dto.delta ?? null,
        generatedText,
        embedding: null,
      }),
    );

    // Generate the embedding asynchronously without blocking the response
    this.generateEmbeddingAsync(activity.id, generatedText);

    return activity;
  }

  findByPatient(patientId: string): Promise<Activity[]> {
    return this.activityRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  findAllWithEmbeddings(types?: ActivityType[]): Promise<Activity[]> {
    const qb = this.activityRepo
      .createQueryBuilder('a')
      .where('a.embedding IS NOT NULL');
    if (types?.length) {
      qb.andWhere('a.type IN (:...types)', { types });
    }
    return qb.getMany();
  }

  private generateText(
    type: ActivityType,
    snapshot: Record<string, unknown>,
  ): string {
    const patient = snapshot.patient as
      | { fullName?: string; code?: number }
      | undefined;
    const doctor = snapshot.doctor as { fullName?: string } | undefined;
    const patientName = patient?.fullName ?? 'Paciente desconocido';
    const patientHC = patient?.code != null ? ` (HC-${patient.code})` : '';
    const doctorName = doctor?.fullName ?? 'Médico desconocido';

    switch (type) {
      case ActivityType.APPOINTMENT_SCHEDULED: {
        const date = snapshot.scheduledDate as string | undefined;
        const studyType = snapshot.studyType as { name?: string } | undefined;
        const reason = snapshot.reason as string | undefined;
        const dateStr = date ? new Date(date).toLocaleString('es-BO') : '';
        let text = `Cita programada para ${patientName}${patientHC} con ${doctorName}`;
        if (dateStr) text += ` el ${dateStr}`;
        if (studyType?.name) text += `. Tipo de estudio: ${studyType.name}`;
        if (reason) text += `. Motivo: ${reason}`;
        return text + '.';
      }

      case ActivityType.APPOINTMENT_UPDATED: {
        const delta = snapshot.delta as
          | Record<string, { before: unknown; after: unknown }>
          | undefined;
        const changes = delta
          ? Object.entries(delta)
              .map(([k, v]) => `${k}: "${v.before}" → "${v.after}"`)
              .join(', ')
          : '';
        return `Cita actualizada para ${patientName}${patientHC} con ${doctorName}${changes ? '. Cambios: ' + changes : ''}.`;
      }

      case ActivityType.APPOINTMENT_COMPLETED:
        return `Cita completada para ${patientName}${patientHC} con ${doctorName}.`;

      case ActivityType.APPOINTMENT_CANCELLED:
        return `Cita cancelada para ${patientName}${patientHC} con ${doctorName}.`;

      case ActivityType.RESULT_CREATED: {
        const findings   = snapshot.findings   as string | undefined;
        const conclusion = snapshot.conclusion as string | undefined;
        const appt = snapshot.appointment as {
          reason?: string; notes?: string; scheduledDate?: string;
          studyType?: { name?: string };
        } | undefined;
        const studyType = appt?.studyType?.name;
        const reason    = appt?.reason;
        const notes     = appt?.notes;
        let text = `Resultado clínico registrado para ${patientName}${patientHC} por ${doctorName}`;
        if (studyType) text += `. Estudio: ${studyType}`;
        if (reason)    text += `. Motivo: ${reason}`;
        if (notes)     text += `. Notas: ${notes}`;
        if (findings)  text += `. Hallazgos: ${findings}`;
        if (conclusion) text += `. Conclusión: ${conclusion}`;
        return text + '.';
      }

      case ActivityType.RESULT_UPDATED:
        return `Resultado clínico actualizado para ${patientName}${patientHC} por ${doctorName}.`;

      default:
        return `Actividad registrada para ${patientName}${patientHC}.`;
    }
  }

  private async generateEmbeddingAsync(
    activityId: string,
    text: string,
  ): Promise<void> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      const embedding = response.data[0].embedding;
      await this.activityRepo.update(activityId, { embedding });
    } catch (err) {
      this.logger.warn(
        `Embedding generation failed for activity ${activityId}: ${(err as Error).message}`,
      );
    }
  }
}
