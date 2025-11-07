import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Toast } from './toast';
import { environment } from '../../environments/environment';

const API_BASE_URL = environment.apiUrl;
const AWARDS_SEEN_KEY = 'awards_seen_v1';

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private base = API_BASE_URL;

  // memoria deinsignias ya mostradas (deduplicación global)
  private awardsSeen = new Set<string>(
    JSON.parse(localStorage.getItem(AWARDS_SEEN_KEY) || '[]')
  );

  private saveAwardsSeen() {
    localStorage.setItem(AWARDS_SEEN_KEY, JSON.stringify([...this.awardsSeen]));
  }

  private toAbsolute(url?: string): string | undefined {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    return this.base.replace(/\/$/, '') + url;
  }

  /** Dispara toasts si la respuesta contiene awardedBadges (o awarded_badges) */
  private handleAwards(resp: any) {
    if (!resp) return;

    const list = resp.awardedBadges ?? resp.awarded_badges;
    if (!Array.isArray(list) || list.length === 0) return;

    for (const b of list) {
      const slug: string | undefined = b?.slug;
      if (!slug) continue;
      if (this.awardsSeen.has(slug)) continue; // ya mostrado

      this.awardsSeen.add(slug);
      this.saveAwardsSeen();

      // imagen absoluta si viene relativa
      const imgAbs = this.toAbsolute(b?.imageUrl ?? b?.image_url);

      this.toast.success(`¡Insignia obtenida! ${b?.title ?? ''}`, {
        message: b?.description,
        imageUrl: imgAbs,
        timeoutMs: 4000
      });
    }
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    let httpParams = new HttpParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) httpParams = httpParams.set(k, String(v));
      }
    }
    return this.http.get<T>(`${this.base}${path}`, { params: httpParams })
    .pipe(tap((resp: any) => this.handleAwards(resp)));
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http
      .post<T>(`${this.base}${path}`, body)
      .pipe(tap((resp: any) => this.handleAwards(resp)));
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http
      .put<T>(`${this.base}${path}`, body)
      .pipe(tap((resp: any) => this.handleAwards(resp)));
  }

  // Para /auth/login con OAuth2PasswordRequestForm (x-www-form-urlencoded)
  form<T>(path: string, body: Record<string, string>): Observable<T> {
    const x = new URLSearchParams();
    Object.entries(body).forEach(([k, v]) => x.append(k, v));
    return this.http
      .post<T>(this.base + path, x.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      .pipe(tap((resp: any) => this.handleAwards(resp)));
  }

  upload<T>(path: string, formData: FormData): Observable<T> {
    return this.http
      .post<T>(this.base + path, formData)
      .pipe(tap((resp: any) => this.handleAwards(resp)));
  }

  absolute(url?: string): string | undefined {
    return this.toAbsolute(url);
  }
}