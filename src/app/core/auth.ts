import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError } from 'rxjs';
import { of } from 'rxjs';
import { User } from './models/user.model';
import { LoginRequest } from './models/login.model';
import { RegisterRequest } from './models/register.model';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<User | null> {
    const url = `${this.apiUrl}?email=${data.email}&password=${data.password}`;
    console.log('🔍 Haciendo petición a:', url);
    
    return this.http
      .get<User[]>(url)
      .pipe(
        tap(response => {
          console.log('📥 Respuesta cruda del servidor:', response);
          console.log('📊 Cantidad de usuarios encontrados:', response?.length || 0);
        }),
        map(users => {
          const user = users.length > 0 ? users[0] : null;
          console.log('👤 Usuario mapeado:', user);
          return user;
        }),
        catchError(error => {
          console.error('❌ Error en petición de login:', error);
          console.error('🔧 Detalles del error:', {
            status: error.status,
            message: error.message,
            url: error.url
          });
          return of(null);
        })
      );
  }

  register(data: RegisterRequest): Observable<User> {
    const userWithFlag = {
      ...data,
      firstLoginDone: false
    };
    return this.http.post<User>(this.apiUrl, userWithFlag);
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      const u = JSON.parse(raw);
      // valida forma mínima
      if (
        u && (typeof u.id === 'number' || typeof u.id === 'string') &&
        typeof u.email === 'string' &&
        typeof u.firstLoginDone === 'boolean'
      ) return u as User;
      return null; // cualquier objeto inválido => no logueado
    } catch { return null; }
  }

  updateUser(partial: Partial<User>): Observable<User> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No hay sesión');
  
    const updated = { ...user, ...partial };

    return this.http.put<User>(`${this.apiUrl}/${user.id}`, updated).pipe(
      map(u => {
        // actualizar storage también
        localStorage.setItem('user', JSON.stringify(u));
        return u;
      })
    );
  }
}
