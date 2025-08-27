import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../../core/auth';

export const firstloginGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  const user = authService.getCurrentUser(); // obtén el usuario actual de tu servicio
  
  if (user && user.firstLoginDone === false) {
    // Primera vez: permitir acceso
    return true;
  } else {
    // Ya hizo el primer login: redirigir a dashboard (o donde quieras)
    router.navigate(['/home']);
    return false;
  }
};
