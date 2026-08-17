import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const currentColegio = authService.colegio();
  const token = authService.token();

  let headers = req.headers;

  if (currentColegio?.id) {
    headers = headers.set('x-colegio-id', currentColegio.id);
  }

  if (currentColegio?.slug) {
    headers = headers.set('x-colegio-slug', currentColegio.slug);
  }

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const modifiedReq = req.clone({ headers });
  return next(modifiedReq);
};
