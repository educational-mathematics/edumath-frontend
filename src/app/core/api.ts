import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

const API_BASE_URL = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private base = API_BASE_URL;

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    let httpParams = new HttpParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) httpParams = httpParams.set(k, String(v));
      }
    }
    return this.http.get<T>(`${this.base}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: any) {
    return this.http.post<T>(`${this.base}${path}`, body);
  }

  put<T>(path: string, body: any) {
    return this.http.put<T>(`${this.base}${path}`, body);
  }

  // Para /auth/login con OAuth2PasswordRequestForm (x-www-form-urlencoded)
  form<T>(path: string, body: Record<string, string>) {
    const x = new URLSearchParams();
    Object.entries(body).forEach(([k, v]) => x.append(k, v));
    return this.http.post<T>(this.base + path, x.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  upload<T>(path: string, formData: FormData) { 
    return this.http.post<T>(this.base + path, formData); 
  }

  absolute(url?: string): string | undefined {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    return this.base.replace(/\/$/, '') + url; // pega el base del Api
  }
}