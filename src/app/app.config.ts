import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth-interceptor';
import { Theme } from './core/theme';
import { APP_INITIALIZER } from '@angular/core';
import { Auth } from './core/auth';

export function initAuth(auth: Auth) {
  return () => auth.rehydrateSession(); // devuelve Promise<void>
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])),
    // Inicializadores modernos (reemplazan APP_INITIALIZER):
    provideAppInitializer(() => {
      // Tema global al arrancar
      const theme = inject(Theme);
      theme.initFromStorage();
    }),
    provideAppInitializer(() => {
      // Rehidratar sesión si hay token válido
      const auth = inject(Auth);
      return auth.rehydrateSession(); // puede devolver Promise<void>
    }),
    { provide: APP_INITIALIZER, useFactory: initAuth, deps: [Auth], multi: true },
  ]
};
