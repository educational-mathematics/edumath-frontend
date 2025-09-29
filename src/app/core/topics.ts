import { Injectable, inject } from '@angular/core';
import { Api } from './api';

@Injectable({
  providedIn: 'root'
})
export class Topics {
  private api = inject(Api);

  catalog() { return this.api.get<Record<number, any[]>>('/topics/catalog'); }
  myTopics() { return this.api.get<any[]>('/topics/my'); }
  addTopic(topicId: number) { return this.api.post<{ok:boolean; userTopicId:number}>(`/topics/add/${topicId}`, {}); }

  open(userTopicId: number) { return this.api.post<any>(`/topics/${userTopicId}/open`, {}); }
  answer(sessionId: number, index: number, answer: any) {
    return this.api.post<any>(`/topics/session/${sessionId}/answer`, { index, answer });
  }
  finish(sessionId: number) { return this.api.post<any>(`/topics/session/${sessionId}/finish`, {}); }

  openBySlug(slug: string) {
    return this.api.post<any>(`/topics/slug/${slug}/open`, {});
  }
}
