import { Injectable, inject } from '@angular/core';
import { Api } from './api';
import { AssistantTopicInfo, HistoryGroup, Explanation, VakStyle } from './models/assistant.model';

@Injectable({
  providedIn: 'root'
})
export class AssistantApi {
  private api = inject(Api);

  getTopics() {
    return this.api.get<AssistantTopicInfo[]>('/assistant/topics');
  }

  getHistory() {
    return this.api.get<HistoryGroup[]>('/assistant/history');
  }

  startExplanation(topicId: number, style: VakStyle) {
    return this.api.post<{ explanationId: string }>('/assistant/explanations/start', { topicId, style });
  }

  getExplanation(id: string) {
    return this.api.get<Explanation>(`/assistant/explanations/${id}`);
  }

  resumeExplanation(id: string) {
    return this.api.post<{ ok: true }>(`/assistant/explanations/${id}/resume`, {});
  }
}
