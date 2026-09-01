import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Parametro {
  id: string;
  grupo: string;
  codigo: string;
  nombre: string;
  valor?: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
}

const DEFAULT_CATALOGS: Record<string, Parametro[]> = {
  MEDIOS_PAGO: [
    { id: '1', grupo: 'MEDIOS_PAGO', codigo: 'EFECTIVO', nombre: '💵 Efectivo en Ventanilla (Caja)', orden: 1, activo: true },
    { id: '2', grupo: 'MEDIOS_PAGO', codigo: 'TRANSFERENCIA_BANCOLOMBIA', nombre: '🏦 Transferencia Bancolombia / PSE', orden: 2, activo: true },
    { id: '3', grupo: 'MEDIOS_PAGO', codigo: 'NEQUI_QR', nombre: '📱 Nequi / Daviplata QR', orden: 3, activo: true },
    { id: '4', grupo: 'MEDIOS_PAGO', codigo: 'TARJETA_CREDITO', nombre: '💳 Datáfono / Tarjeta Débito-Crédito', orden: 4, activo: true },
    { id: '5', grupo: 'MEDIOS_PAGO', codigo: 'CHEQUE', nombre: '📑 Cheque de Gerencia', orden: 5, activo: true },
  ],
  ESTADOS_CUENTA: [
    { id: '1', grupo: 'ESTADOS_CUENTA', codigo: 'AL_DIA', nombre: '🟢 Al Día (Pagado)', orden: 1, activo: true },
    { id: '2', grupo: 'ESTADOS_CUENTA', codigo: 'POR_VENCER', nombre: '🟡 Por Vencer', orden: 2, activo: true },
    { id: '3', grupo: 'ESTADOS_CUENTA', codigo: 'EN_MORA', nombre: '🔴 En Mora (>30 días)', orden: 3, activo: true },
    { id: '4', grupo: 'ESTADOS_CUENTA', codigo: 'ANULADO', nombre: '⚪ Anulado', orden: 4, activo: true },
  ],
  MESES_ACADEMICOS: [
    { id: '1', grupo: 'MESES_ACADEMICOS', codigo: 'Febrero 2026', nombre: 'Febrero 2026', orden: 1, activo: true },
    { id: '2', grupo: 'MESES_ACADEMICOS', codigo: 'Marzo 2026', nombre: 'Marzo 2026', orden: 2, activo: true },
    { id: '3', grupo: 'MESES_ACADEMICOS', codigo: 'Abril 2026', nombre: 'Abril 2026', orden: 3, activo: true },
    { id: '4', grupo: 'MESES_ACADEMICOS', codigo: 'Mayo 2026', nombre: 'Mayo 2026', orden: 4, activo: true },
    { id: '5', grupo: 'MESES_ACADEMICOS', codigo: 'Junio 2026', nombre: 'Junio 2026', orden: 5, activo: true },
    { id: '6', grupo: 'MESES_ACADEMICOS', codigo: 'Julio 2026', nombre: 'Julio 2026', orden: 6, activo: true },
    { id: '7', grupo: 'MESES_ACADEMICOS', codigo: 'Agosto 2026', nombre: 'Agosto 2026', orden: 7, activo: true },
    { id: '8', grupo: 'MESES_ACADEMICOS', codigo: 'Septiembre 2026', nombre: 'Septiembre 2026', orden: 8, activo: true },
    { id: '9', grupo: 'MESES_ACADEMICOS', codigo: 'Octubre 2026', nombre: 'Octubre 2026', orden: 9, activo: true },
    { id: '10', grupo: 'MESES_ACADEMICOS', codigo: 'Noviembre 2026', nombre: 'Noviembre 2026', orden: 10, activo: true },
    { id: '11', grupo: 'MESES_ACADEMICOS', codigo: 'Diciembre 2026', nombre: 'Diciembre 2026', orden: 11, activo: true },
  ],
};

@Injectable({
  providedIn: 'root',
})
export class ParametrosService {
  private readonly api = inject(ApiService);

  obtenerPorGrupo(grupo: string): Observable<Parametro[]> {
    return this.api.get<Parametro[]>('parametros', { grupo }).pipe(
      map((res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          return res.sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
        }
        return (DEFAULT_CATALOGS[grupo] || []).sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
      }),
      catchError(() => of((DEFAULT_CATALOGS[grupo] || []).sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0)))),
    );
  }

  obtenerPorCodigo(grupo: string, codigo: string): Observable<Parametro | undefined> {
    return this.api.get<Parametro>(`parametros/${grupo}/${codigo}`).pipe(
      catchError(() => {
        const list = DEFAULT_CATALOGS[grupo] || [];
        return of(list.find((p) => p.codigo === codigo));
      }),
    );
  }
}
