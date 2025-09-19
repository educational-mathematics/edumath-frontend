import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/**
 * Permite entrar a /register/verify-email solo si existe un pase en sessionStorage.
 * El pase se consume al usarlo (no se puede refrescar/entrar directo por URL).
 */
export const verifyEntryGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const flag = sessionStorage.getItem('allowVerifyEmail');

  if (flag === '1') {
    // consumir el pase para que no pueda recargar ni entrar directo
    sessionStorage.removeItem('allowVerifyEmail');
    return true;
  }
  return router.parseUrl('/login');
};
