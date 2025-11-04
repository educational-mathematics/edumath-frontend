import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../auth';
import { filter, map, take } from 'rxjs';

function waitUser() {
  const auth = inject(Auth);
  return auth.user$.pipe(
    filter(u => u !== undefined), // espera a que deje de estar "cargando"
    take(1)
  );
}

/** Requiere sesión (si no, /login) */
export const authenticationGuard: CanMatchFn = () => {
  const router = inject(Router);
  return waitUser().pipe(
    map(user => user ? true : router.parseUrl('/login'))
  );
};

/** Solo permite rutas de la app si completó onboarding (si no, /welcome) */
export const completedGuard: CanMatchFn = () => {
  const router = inject(Router);
  return waitUser().pipe(
    map(user => (user as any)?.firstLoginDone === true ? true : router.parseUrl('/welcome'))
  );
};

/** Solo permite onboarding si AÚN NO está completo (si ya está, /home) */
export const onboardingOnlyGuard: CanMatchFn = () => {
  const router = inject(Router);
  return waitUser().pipe(
    map(user => (user as any)?.firstLoginDone !== true ? true : router.parseUrl('/home'))
  );
};

/** Público: si ya está logueado → /home */
export const publicGuard: CanMatchFn = () => {
  const router = inject(Router);
  return waitUser().pipe(
    map(user => user ? router.parseUrl('/home') : true)
  );
};