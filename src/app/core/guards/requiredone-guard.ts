import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../../core/auth';

export const requiredoneGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  if (!user) {
    return router.parseUrl('/login');
  }
  
  if (user.firstLoginDone !== true) {
    return router.parseUrl('/welcome'); // O la ruta apropiada para first-time users
  }
  
  return true;
};
