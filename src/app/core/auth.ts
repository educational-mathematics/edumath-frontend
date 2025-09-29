import { Injectable, inject } from '@angular/core';
import { Api } from './api';
import { Observable, of, map, switchMap, tap, catchError, BehaviorSubject, firstValueFrom  } from 'rxjs';
import { User } from './models/user.model';
import { LoginRequest } from './models/login.model';
import { RegisterRequest } from './models/register.model';
import { RankingRow } from './models/ranking.model';
import { Toast } from './toast';

type Purpose = 'register' | 'reset_password';

interface Token {
  access_token: string;
  token_type: string;
}

interface FirstLoginDoneResp {
  ok: boolean;
  awardedBadges?: Array<{
    id: number; slug: string; title: string; description: string;
    imageUrl: string; rarityPct: number; owned: boolean;
  }>;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private toast = inject(Toast);
  private api = inject(Api);

  private tokenKey = 'token';
  private userKey  = 'user';

  private userSubject = new BehaviorSubject<User | null>(this.readUserFromSession());
  user$ = this.userSubject.asObservable();

  // ---------- Utils de storage ----------
  private readUserFromSession(): User | null {
    const raw = sessionStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      const u = JSON.parse(raw);
      // normaliza avatar relativo -> absoluto
      if (u?.avatarUrl?.startsWith('/')) {
        const base = (this as any).api?.['base'] || 'http://localhost:8000';
        u.avatarUrl = base.replace(/\/$/, '') + u.avatarUrl;
      }
      return u as User;
    } catch { return null; }
  }

  private readUserFromLocal(): User | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      const u = JSON.parse(raw);
      if (u?.avatarUrl?.startsWith('/')) {
        const base = (this as any).api?.['base'] || 'http://localhost:8000';
        u.avatarUrl = base.replace(/\/$/, '') + u.avatarUrl;
      }
      return u as User;
    } catch { return null; }
  }

  private isTokenValidStr(t?: string | null): boolean {
    if (!t) return false;
    try {
      const [, payloadB64] = t.split('.');
      const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(json);
      return Date.now() < (payload.exp ?? 0) * 1000;
    } catch { return false; }
  }

  private setSession(user: User | null, token?: string | null) {
    // sessionStorage (runtime)
    if (user) sessionStorage.setItem(this.userKey, JSON.stringify(user));
    else sessionStorage.removeItem(this.userKey);

    if (token === null) sessionStorage.removeItem(this.tokenKey);
    else if (token)     sessionStorage.setItem(this.tokenKey, token);

    // localStorage (solo para rehidratar)
    if (user) localStorage.setItem(this.userKey, JSON.stringify(user));
    else localStorage.removeItem(this.userKey);

    if (token === null) localStorage.removeItem(this.tokenKey);
    else if (token)     localStorage.setItem(this.tokenKey, token);

    this.userSubject.next(user);
  }

  // ---------- Rehidratación en arranque ----------
  async rehydrateSession(): Promise<void> {
    const sessionToken = sessionStorage.getItem(this.tokenKey);
    if (this.isTokenValidStr(sessionToken)) {
      // Ya hay sesión en pestaña → asegura emitir user actual
      this.userSubject.next(this.readUserFromSession());
      return;
    }

    // No hay sesión en pestaña. ¿Hay copia válida en localStorage?
    const localToken = localStorage.getItem(this.tokenKey);
    if (!this.isTokenValidStr(localToken)) {
      // token inválido → limpia todo
      this.setSession(null, null);
      return;
    }

    // Copia token a session, intenta traer user desde local; si no, llama /me
    const localUser = this.readUserFromLocal();
    if (localUser) {
      this.setSession(localUser, localToken!);
      return;
    }

    // No hay user en local: pide al backend
    try {
      const u = await firstValueFrom(this.me()); // Observable<User> -> Promise<User>
      this.setSession(u, localToken!);
    } catch {
      this.setSession(null, null);
    }
  }

  // ---------- Auth flows ----------
  login(data: LoginRequest) {
    return this.api
      .form<Token>('/auth/login', { username: data.email, password: data.password })
      .pipe(
        tap(t => {
          // ✅ token disponible para el interceptor ANTES de llamar a /users/me
          sessionStorage.setItem(this.tokenKey, t.access_token);
          localStorage.setItem(this.tokenKey, t.access_token); // copia para rehidratación
        }),
        switchMap(() => this.me()),
        tap(u => {
          // ✅ ya con el user, consolidamos session+local y emitimos por user$
          const tok = sessionStorage.getItem(this.tokenKey);
          this.setSession(u, tok);
        }),
        catchError(err => {
          // limpieza defensiva si algo falla
          sessionStorage.removeItem(this.tokenKey);
          sessionStorage.removeItem(this.userKey);
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.userKey);
          console.error('❌ login', err);
          return of(null);
        })
      );
  }

  logout() {
    this.setSession(null, null);
  }

  // ---------- API helpers ----------
  register(data: RegisterRequest): Observable<User> {
    return this.api.post<any>('/auth/register', data).pipe(map(this.mapUserDto));
  }

  sendCode(email: string, purpose: Purpose) {
    return this.api.post<{ message: string }>('/verification/send', { email, purpose });
  }

  verifyCode(email: string, code: string, purpose: Purpose) {
    return this.api.post<{ message: string }>('/verification/verify', { email, code, purpose });
  }

  forgot(email: string) {
    return this.api.post<{ message: string }>('/auth/forgot', { email });
  }

  reset(email: string, code: string, newPassword: string) {
    return this.api.post<{ message: string }>('/auth/reset', {
      email, code, new_password: newPassword,
    });
  }

  me() {
    return this.api.get<any>('/users/me').pipe(map(this.mapUserDto));
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  updateUser(partial: Partial<User>) {
    return this.api.put<any>('/users/me', this.mapUserToDto(partial)).pipe(
      map(this.mapUserDto),
      tap(u => this.setSession(u, sessionStorage.getItem(this.tokenKey)))
    );
  }

  uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.api.upload<any>('/users/me/avatar', fd).pipe(
      map(this.mapUserDto),
      map(u => {
        if (u.avatarUrl) {
          const sep = u.avatarUrl.includes('?') ? '&' : '?';
          u.avatarUrl = `${u.avatarUrl}${sep}v=${Date.now()}`;
        }
        return u;
      }),
      tap(u => this.setSession(u, sessionStorage.getItem(this.tokenKey)))
    );
  }

  setAlias(alias: string) {
    return this.api.post<User>('/users/me/alias', { alias }).pipe(
      map(this.mapUserDto),
      tap(u => this.setSession(u, sessionStorage.getItem(this.tokenKey)))
    );
  }

  getRanking() {
    return this.api.get<RankingRow[]>('/ranking'); // Top 100
  }

  getMyRank() {
    return this.api.get<RankingRow>('/ranking/me'); // tu fila (aunque estés fuera del top100)
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.api.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  checkPassword(currentPassword: string) {
    return this.api.post<{ ok: boolean }>('/auth/check-password', {
      current_password: currentPassword,
    });
  }

  // ---------- Mappers ----------
  private mapUserDto = (dto: any): User => ({
    id: dto.id,
    email: dto.email,
    name: dto.name,
    firstLoginDone: dto.first_login_done ?? false,
    emailVerified: dto.email_verified ?? false,
    avatarUrl: this.api.absolute(dto.avatar_url),
    vakStyle: dto.vak_style ?? undefined,
    vakScores: dto.vak_scores ?? undefined,
    testAnsweredBy: dto.test_answered_by ?? undefined,
    testDate: dto.test_date ?? undefined,
    points: dto.points ?? 0,
    alias: dto.alias ?? undefined,
    badges: dto.badges ?? undefined,
  });

  private mapUserToDto(p: Partial<User>) {
    const dto: any = {};
    if (p.name !== undefined) dto.name = p.name;
    if (p.firstLoginDone !== undefined) dto.first_login_done = p.firstLoginDone;
    if (p.vakStyle !== undefined) dto.vak_style = p.vakStyle;
    if (p.vakScores !== undefined) dto.vak_scores = p.vakScores;
    if (p.testAnsweredBy !== undefined) dto.test_answered_by = p.testAnsweredBy;
    if (p.testDate !== undefined) dto.test_date = p.testDate;
    if (p.avatarUrl !== undefined) dto.avatar_url = p.avatarUrl;
    return dto;
  }

  private setUser(u: User | null) {
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    this.userSubject.next(u);
  }

  refreshMe() {
    return this.me().pipe(
      tap(u => this.setUser(u)) // actualiza user$ y storage
    );
  }

  markFirstLoginDone() {
    return this.api.post<FirstLoginDoneResp>('/users/me/first-login-done', {}).pipe(
      tap(resp => {
        const list = resp.awardedBadges ?? [];
        for (const b of list) {
          this.toast.success(`¡Insignia obtenida! ${b.title}`, {
            imageUrl: this.api.absolute(b.imageUrl),
            timeoutMs: 4000
          });
        }
        if (list.length) {
          this.refreshMe().subscribe(); // mantener consistente el user$
        }
      }),
    );
  }
}
