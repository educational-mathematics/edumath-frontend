import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../../core/auth';

export const publicGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  // Si no está logueado → puede acceder
  if (!user) {
    return true;
  }

  // Si está logueado pero es primera vez → welcome
  if (user.firstLoginDone !== true) {
    return router.parseUrl('/welcome');
  }

  // Si ya completó onboarding → home
  return router.parseUrl('/home');
};
