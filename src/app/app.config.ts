import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth-interceptor';
import { Theme } from './core/theme';
import { Auth } from './core/auth';

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
  ]
};
