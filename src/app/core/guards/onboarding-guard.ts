import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../../core/auth';

export const onboardingGuard: CanActivateFn = (route, state) => {
  console.log('🎯 onboardingGuard ejecutándose para:', state.url);
  
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.getCurrentUser();
  
  console.log('👤 Usuario actual en onboardingGuard:', user);

  // Si no está logueado → login
  if (!user) {
    console.log('❌ No hay usuario, redirigiendo a login');
    return router.parseUrl('/login');
  }

  // Si ya completó el onboarding → home
  if (user.firstLoginDone === true) {
    console.log('✅ Onboarding completado, redirigiendo a home');
    return router.parseUrl('/home');
  }

  // Si es primera vez → puede acceder a welcome/test
  console.log('🆕 Primera vez, puede acceder a onboarding');
  return true;
};
