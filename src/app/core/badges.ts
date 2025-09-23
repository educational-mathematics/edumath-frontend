import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';
import { Badge } from './models/badge.model';
import { Api } from './api';

@Injectable({
  providedIn: 'root'
})
export class Badges {
  private http = inject(HttpClient);
  private api = inject(Api);
  private base = `${environment.apiUrl}/badges`;

  list(): Observable<Badge[]> {
    return this.http.get<Badge[]>(this.base).pipe(
      map(list => list.map((b): Badge => {
        // normaliza a absoluta y asegura string con fallback
        const abs = this.api.absolute(b.imageUrl || '');
        const imageUrl = abs || 'assets/badge-placeholder.png';
        return { ...b, imageUrl };
      }))
    );
  }
}
