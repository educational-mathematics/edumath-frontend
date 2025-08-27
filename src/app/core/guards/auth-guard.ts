import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../../core/auth';

export const authGuard: CanActivateFn = (route, state) => {
   console.log('🛡️ authGuard ejecutándose para:', state.url);
  
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.getCurrentUser();
  
  console.log('👤 Usuario actual en authGuard:', user);

  // Si no está logueado → login
  if (!user) {
    console.log('❌ No hay usuario, redirigiendo a login');
    return router.parseUrl('/login');
  }

  // Si es primera vez → welcome
  if (user.firstLoginDone !== true) {
    console.log('🆕 Primera vez, redirigiendo a welcome');
    return router.parseUrl('/welcome');
  }

  // Si ya completó el onboarding → puede acceder
  console.log('✅ Usuario puede acceder a ruta protegida');
  return true;
};
