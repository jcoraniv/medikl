import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ActivitiesService } from '../activities/activities.service';
import { Activity, ActivityType } from '../activities/entities/activity.entity';

export interface SearchResult {
  activity: Activity;
  score: number;
}

@Injectable()
export class SearchService {
  private readonly openai: OpenAI;

  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({ apiKey: this.config.get<string>('OPENAI_API_KEY') });
  }

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = response.data[0].embedding;

    const activities = await this.activitiesService.findAllWithEmbeddings([ActivityType.RESULT_CREATED]);

    return activities
      .map((activity) => ({
        activity,
        score: this.cosineSimilarity(queryEmbedding, activity.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot   += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
