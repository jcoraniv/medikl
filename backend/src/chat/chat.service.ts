import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '../common/constants/app.constants';
import {
  ClinicalHistory,
  ClinicalHistoryAppointment,
  ClinicalHistoryService,
} from '../clinical-history/clinical-history.service';
import { User } from '../users/entities/user.entity';
import { AskDto } from './dto/ask.dto';

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly temperature: number;

  constructor(
    private readonly clinicalHistoryService: ClinicalHistoryService,
    private readonly config: ConfigService,
  ) {
    this.openai      = new OpenAI({ apiKey: this.config.get<string>('OPENAI_API_KEY') });
    this.model       = this.config.get<string>('OPENAI_CHAT_MODEL', 'gpt-4o-mini');
    this.temperature = parseFloat(this.config.get<string>('OPENAI_CHAT_TEMPERATURE', '0.3'));
  }

  async ask(dto: AskDto, currentUser: User): Promise<string> {
    const history = await this.clinicalHistoryService.findByPatientCode(
      dto.patientCode,
      currentUser,
    );

    const contextText = this.buildContext(history);
    const currentDate = new Date().toLocaleDateString(DEFAULT_LOCALE, {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const systemMessage = `Eres un asistente médico especializado en análisis de historias clínicas.

Instrucciones:
- Usa ÚNICAMENTE los datos del paciente proporcionados en cada mensaje del usuario.
- Sé específico con fechas, tratamientos y resultados clínicos.
- Advierte si el historial muestra tratamientos que ya se aplicaron y no funcionaron.
- Si detectas posibles contraindicaciones o patrones relevantes, menciónalos claramente.
- Si la información solicitada no está en los datos, dilo explícitamente.
- No inventes datos que no estén en el historial.
- La fecha actual es ${currentDate}.
- Responde siempre en español.`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      temperature: this.temperature,
      messages: [
        { role: 'system', content: systemMessage },
        ...dto.history,
        {
          role: 'user',
          content: `DATOS DEL PACIENTE:\n${contextText}\n\nPREGUNTA: ${dto.query}`,
        },
      ],
    });

    return response.choices[0].message.content ?? 'No se pudo generar una respuesta.';
  }

  private buildContext(history: ClinicalHistory): string {
    const { patient, appointments } = history;

    const lines: string[] = [
      '=== INFORMACIÓN DEL PACIENTE ===',
      `Nombre: ${patient.fullName}`,
      `Historia Clínica: HC-${patient.code}`,
      `Email: ${patient.email}`,
    ];

    if (appointments.length === 0) {
      lines.push('', 'Sin citas registradas.');
      return lines.join('\n');
    }

    lines.push('', `=== HISTORIAL CLÍNICO (${appointments.length} cita(s)) ===`);

    for (const appt of appointments) {
      lines.push('', ...this.buildAppointmentBlock(appt));
    }

    return lines.join('\n');
  }

  private buildAppointmentBlock(appt: ClinicalHistoryAppointment): string[] {
    const date = new Date(appt.scheduledDate).toLocaleDateString(DEFAULT_LOCALE, {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const lines = [
      `[CITA #${appt.code}] ${date} — ${appt.status.toUpperCase()}`,
      `Doctor: ${appt.doctor.fullName}`,
      `Duración: ${appt.duration} min`,
    ];

    if (appt.studyType) lines.push(`Tipo de estudio: ${appt.studyType.name}`);
    if (appt.reason)    lines.push(`Motivo de consulta: ${appt.reason}`);
    if (appt.notes)     lines.push(`Notas del médico: ${appt.notes}`);

    if (appt.studyResult) {
      lines.push(
        'Resultado:',
        `  Hallazgos: ${appt.studyResult.findings}`,
      );
      if (appt.studyResult.conclusion) {
        lines.push(`  Conclusión: ${appt.studyResult.conclusion}`);
      }
    } else {
      lines.push('Resultado: Sin resultado registrado.');
    }

    lines.push('-'.repeat(40));
    return lines;
  }
}
