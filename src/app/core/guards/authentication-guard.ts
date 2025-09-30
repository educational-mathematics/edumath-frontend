import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../../core/auth';

/** Requiere sesión (si no, /login) */
export const authenticationGuard: CanMatchFn = (route, segments) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.getCurrentUser();
  return user ? true : router.parseUrl('/login');
};

/** Solo permite rutas de la app si completó onboarding (si no, /welcome) */
export const completedGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.getCurrentUser();
  if (!user) return router.parseUrl('/login');
  return user.firstLoginDone === true ? true : router.parseUrl('/welcome');
};

/** Solo permite onboarding (welcome/test) si AÚN NO está completo (si ya está, /home) */
export const onboardingOnlyGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.getCurrentUser();
  if (!user) return router.parseUrl('/login');
  return user.firstLoginDone !== true ? true : router.parseUrl('/home');
};

/** Público: si ya está logueado, sácalo al /home; si no, permite 
export const publicGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.getCurrentUser();
  return user ? router.parseUrl('/home') : true;
};*/