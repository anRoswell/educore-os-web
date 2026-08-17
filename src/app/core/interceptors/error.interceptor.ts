import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let title = 'Error del Sistema';
      let message = 'Ocurrió un error inesperado al procesar la solicitud.';

      if (error.status === 0) {
        title = 'Sin Conexión';
        message = 'No se pudo establecer comunicación con el servidor central de EduCoreOS. Verifique la conexión.';
      } else if (error.status === 400) {
        title = 'Datos Inválidos';
        if (Array.isArray(error.error?.message)) {
          message = error.error.message.join(' | ');
        } else {
          message = error.error?.message || 'Los datos enviados no cumplen con la estructura o reglas requeridas.';
        }
      } else if (error.status === 401) {
        title = 'Sesión Expirada';
        message = 'Su sesión ha vencido o el token es inválido. Inicie sesión nuevamente.';
        auth.logout();
      } else if (error.status === 403) {
        title = 'Acceso Denegado';
        message = error.error?.message || 'Su rol no tiene permisos suficientes o la institución no tiene este módulo contratado.';
      } else if (error.status === 404) {
        title = 'No Encontrado';
        message = error.error?.message || 'El registro o expediente consultado no existe en la institución.';
      } else if (error.status === 409) {
        title = 'Conflicto de Datos';
        message = error.error?.message || 'Ya existe un registro con estos datos o se presentó una colisión de horarios/cupos.';
      } else if (error.status === 422) {
        title = 'Entidad No Procesable';
        message = error.error?.message || 'No se pudo procesar la solicitud debido a restricciones de la regla de negocio.';
      } else if (error.status >= 500) {
        title = 'Error del Servidor';
        message = error.error?.message || 'Se produjo una falla en el servidor. El evento ha sido registrado en la bitácora.';
      }

      toast.error(title, message);

      return throwError(() => error);
    }),
  );
};
