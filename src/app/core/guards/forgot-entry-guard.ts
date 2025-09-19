import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/**
 * Permite entrar a /login/forgot solo si existe un pase en sessionStorage.
 * El pase se consume al usarlo (no se puede refrescar/entrar directo por URL).
 */
export const forgotEntryGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const flag = sessionStorage.getItem('allowForgot');

  if (flag === '1') {
    sessionStorage.removeItem('allowForgot');
    return true;
  }
  return router.parseUrl('/login');
};
