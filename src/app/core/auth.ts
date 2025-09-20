import { Injectable, inject } from '@angular/core';
import { Api } from './api';
import { Observable, of, map, switchMap, tap, catchError } from 'rxjs';
import { User } from './models/user.model';
import { LoginRequest } from './models/login.model';
import { RegisterRequest } from './models/register.model';

type Purpose = 'register' | 'reset_password';

interface Token {
  access_token: string;
  token_type: string; // "bearer"
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private api = inject(Api);

  private tokenKey = 'token';
  private userKey = 'user';

  /** LOGIN: envía form-urlencoded con username (email) y password */
  login(data: LoginRequest): Observable<User | null> {
    return this.api
      .form<Token>('/auth/login', { username: data.email, password: data.password })
      .pipe(
        tap(t => sessionStorage.setItem(this.tokenKey, t.access_token)),
        switchMap(() => this.me()),
        tap(u => {
          if (u) sessionStorage.setItem(this.userKey, JSON.stringify(u));
        }),
        catchError(err => {
          console.error('❌ Error login', err);
          return of(null);
        })
      );
  }

  /** REGISTER: el backend ya envía el código por correo */
  register(data: RegisterRequest): Observable<User> {
    // Puedes añadir más campos si luego decides (vakStyle, etc.)
    return this.api.post<any>('/auth/register', data).pipe(map(this.mapUserDto));
  }

  /** Enviar código de verificación o de reset */
  sendCode(email: string, purpose: Purpose) {
    return this.api.post<{ message: string }>('/verification/send', { email, purpose });
  }

  /** Verificar código; si es de registro, marca email_verified=True en backend */
  verifyCode(email: string, code: string, purpose: Purpose) {
    return this.api.post<{ message: string }>('/verification/verify', { email, code, purpose });
  }

  /** Forgot / Reset password */
  forgot(email: string) {
    return this.api.post<{ message: string }>('/auth/forgot', { email });
  }

  reset(email: string, code: string, newPassword: string) {
    return this.api.post<{ message: string }>('/auth/reset', {
      email,
      code,
      new_password: newPassword,
    });
  }

  /** Usuario actual (requiere token) */
  me(): Observable<User> {
    return this.api.get<any>('/users/me').pipe(map(this.mapUserDto));
  }

  /** Storage helpers */
  getCurrentUser(): User | null {
    const raw = sessionStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  logout() {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
  }

  /** Mapea snake_case del backend a camelCase del front */
  private mapUserDto = (dto: any): User => ({
    id: dto.id,
    email: dto.email,
    name: dto.name,
    firstLoginDone: dto.first_login_done ?? false,
    emailVerified: dto.email_verified ?? false,
    avatarUrl: dto.avatar_url ?? undefined,
    vakStyle: dto.vak_style ?? undefined,
    vakScores: dto.vak_scores ?? undefined,
    testAnsweredBy: dto.test_answered_by ?? undefined,
    testDate: dto.test_date ?? undefined,
  });

   /** Actualiza datos del usuario actual (requiere token). */
  updateUser(partial: Partial<User>): Observable<User> {
    // mapeamos camelCase -> snake_case para el backend
    const payload: any = {};
    if (partial.name !== undefined) payload.name = partial.name;
    if (partial.firstLoginDone !== undefined) payload.first_login_done = partial.firstLoginDone;
    if (partial.vakStyle !== undefined) payload.vak_style = partial.vakStyle;
    if (partial.vakScores !== undefined) payload.vak_scores = partial.vakScores;
    if (partial.testAnsweredBy !== undefined) payload.test_answered_by = partial.testAnsweredBy;
    if (partial.testDate !== undefined) payload.test_date = partial.testDate;
    if (partial.avatarUrl !== undefined) payload.avatar_url = partial.avatarUrl;

    return this.api.put<any>('/users/me', payload).pipe(
      map(this.mapUserDto),
      tap(u => sessionStorage.setItem(this.userKey, JSON.stringify(u)))
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.api.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }
}
