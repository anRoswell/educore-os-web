import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.user();
  if (currentUser && currentUser.role === 'SUPER_ADMIN') {
    return true;
  }

  // Si no es super admin, redirigir a dashboard
  router.navigate(['/dashboard']);
  return false;
};
