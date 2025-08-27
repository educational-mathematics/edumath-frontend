import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../../core/auth';

export const blockifdoneGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  if (!user) return router.parseUrl('/login');
  if (user.firstLoginDone === true) return router.parseUrl('/home');
  return true; // puede ver welcome/test
};
