import { Injectable, inject } from '@angular/core';
import { Api } from './api';
import { Observable } from 'rxjs';

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
  finish(sessionId: number, timeSec: number): Observable<any> {
    return this.api.post<any>(`/topics/session/${sessionId}/finish`, { timeSec });
  }

  openBySlug(slug: string, reset: boolean = false) {
    const q = reset ? '?reset=true' : '';
    return this.api.post<any>(`/topics/slug/${slug}/open${q}`, {});
  }

  save(sessionId: number, currentIndex: number, elapsedSec: number) {
        return this.api.post(
      `/topics/save/${sessionId}`,
      { current_index: currentIndex, elapsed_sec: elapsedSec }
    );
  }

  exit(sessionId: number, elapsedSec: number) {
    return this.api.post<any>(`/topics/session/${sessionId}/exit`, { elapsedSec });
  }
}
