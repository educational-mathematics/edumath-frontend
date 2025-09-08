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

  // Para /auth/login con OAuth2PasswordRequestForm (x-www-form-urlencoded)
  form<T>(path: string, form: Record<string, string>) {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(form)) body.set(k, v);
    return this.http.post<T>(`${this.base}${path}`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }
}