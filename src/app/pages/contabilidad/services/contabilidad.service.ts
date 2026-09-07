import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PucCuenta,
  Tercero,
  PeriodoContable,
  Asiento,
  AsientosPaginados,
  ConceptoMapping,
  BalanceGeneral,
  EstadoResultados,
  LibroDiarioItem,
  LibroMayorCuenta,
  AuxiliarTerceroReporte,
} from '../models/contabilidad.models';

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3001/api/v1/contabilidad';

  // ─── PUC (Plan Único de Cuentas) ─────────────────────────────────────────
  getPucTree(): Observable<PucCuenta[]> {
    return this.http.get<PucCuenta[]>(`${this.base}/puc`, {
      params: new HttpParams().set('formato', 'arbol'),
    });
  }

  getPucArbol(): Observable<PucCuenta[]> {
    return this.getPucTree();
  }

  getPucList(search?: string): Observable<PucCuenta[]> {
    let params = new HttpParams().set('formato', 'lista');
    if (search) params = params.set('search', search);
    return this.http.get<PucCuenta[]>(`${this.base}/puc`, { params });
  }

  getPucAuxiliares(): Observable<PucCuenta[]> {
    return this.getPucList().pipe(
      map((cuentas) => cuentas.filter((c) => c.esAuxiliar && c.activo)),
    );
  }

  crearCuentaPuc(dto: Partial<PucCuenta>): Observable<PucCuenta> {
    return this.http.post<PucCuenta>(`${this.base}/puc`, dto);
  }

  updateCuentaPuc(id: string, dto: Partial<PucCuenta>): Observable<PucCuenta> {
    return this.http.put<PucCuenta>(`${this.base}/puc/${id}`, dto);
  }

  toggleCuentaPuc(id: string, activoActual?: boolean): Observable<PucCuenta> {
    if (activoActual !== undefined) {
      return this.http.put<PucCuenta>(`${this.base}/puc/${id}`, { activo: !activoActual });
    }
    return this.http.put<PucCuenta>(`${this.base}/puc/${id}/toggle`, {});
  }

  seedPucCatalog(): Observable<{ message: string; count?: number }> {
    return this.http.post<{ message: string; count?: number }>(`${this.base}/puc/seed`, {});
  }

  // ─── Directorio de Terceros ──────────────────────────────────────────────
  getTerceros(search?: string): Observable<Tercero[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<any>(`${this.base}/terceros`, { params }).pipe(
      map((res) => (Array.isArray(res) ? res : res.data ?? [])),
    );
  }

  crearTercero(dto: Partial<Tercero>): Observable<Tercero> {
    return this.http.post<Tercero>(`${this.base}/terceros`, dto);
  }

  syncTerceros(): Observable<{ message: string; sincronizados?: number }> {
    return this.http.post<{ message: string; sincronizados?: number }>(`${this.base}/terceros/sync`, {});
  }

  sincronizarTerceros(): Observable<{ message: string; sincronizados?: number }> {
    return this.syncTerceros();
  }

  // ─── Asientos y Comprobantes ─────────────────────────────────────────────
  getComprobantes(params: {
    fechaInicio?: string;
    fechaFin?: string;
    tipo?: string;
    tipoComprobante?: string;
    estado?: string;
    terceroId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<AsientosPaginados> {
    let httpParams = new HttpParams();
    if (params.fechaInicio) httpParams = httpParams.set('fechaInicio', params.fechaInicio);
    if (params.fechaFin) httpParams = httpParams.set('fechaFin', params.fechaFin);
    const tipo = params.tipoComprobante || params.tipo;
    if (tipo) httpParams = httpParams.set('tipoComprobante', tipo);
    if (params.estado) httpParams = httpParams.set('estado', params.estado);
    if (params.terceroId) httpParams = httpParams.set('terceroId', params.terceroId);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<any>(`${this.base}/asientos`, { params: httpParams }).pipe(
      map((res) => {
        if (Array.isArray(res)) {
          return { data: res, total: res.length, page: 1, limit: res.length };
        }
        return {
          data: res.data ?? [],
          total: res.total ?? 0,
          page: res.page ?? 1,
          limit: res.limit ?? 20,
        };
      }),
    );
  }

  getComprobante(id: string): Observable<Asiento> {
    return this.http.get<Asiento>(`${this.base}/asientos/${id}`);
  }

  crearAsiento(dto: any): Observable<Asiento> {
    return this.http.post<Asiento>(`${this.base}/asientos`, dto);
  }

  anularAsiento(id: string, motivo: string): Observable<Asiento> {
    return this.http.post<Asiento>(`${this.base}/asientos/${id}/anular`, { motivo });
  }

  // ─── Periodos Contables ──────────────────────────────────────────────────
  getPeriodos(anio?: number): Observable<PeriodoContable[]> {
    let params = new HttpParams();
    if (anio) params = params.set('anio', anio.toString());
    return this.http.get<PeriodoContable[]>(`${this.base}/periodos`, { params });
  }

  initPeriodosAnio(anio: number): Observable<any> {
    return this.http.post<any>(`${this.base}/periodos/init`, { anio });
  }

  abrirPeriodo(anio: number, _mes?: number): Observable<any> {
    return this.initPeriodosAnio(anio);
  }

  bloquearPeriodo(id: string): Observable<PeriodoContable> {
    return this.http.post<PeriodoContable>(`${this.base}/periodos/${id}/bloquear`, {});
  }

  cerrarPeriodo(id: string, observaciones?: string): Observable<PeriodoContable> {
    return this.http.post<PeriodoContable>(`${this.base}/periodos/${id}/cerrar`, { observaciones });
  }

  reabrirPeriodo(id: string): Observable<PeriodoContable> {
    return this.http.post<PeriodoContable>(`${this.base}/periodos/${id}/reabrir`, {});
  }

  // ─── Mapeo de Conceptos de Cobro ────────────────────────────────────────
  getConceptoMappings(): Observable<ConceptoMapping[]> {
    return this.http.get<ConceptoMapping[]>(`${this.base}/mapeo`);
  }

  upsertConceptoMapping(dto: Partial<ConceptoMapping>): Observable<ConceptoMapping> {
    return this.http.put<ConceptoMapping>(`${this.base}/mapeo`, dto);
  }

  seedConceptoMappings(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/mapeo/seed`, {});
  }

  // ─── Reportes Financieros NIIF ──────────────────────────────────────────
  getBalanceGeneral(fechaCorte: string): Observable<BalanceGeneral> {
    return this.http.get<BalanceGeneral>(`${this.base}/reportes/balance-general`, {
      params: new HttpParams().set('fechaCorte', fechaCorte),
    });
  }

  getEstadoResultados(fechaInicio: string, fechaFin: string, centroCostoId?: string): Observable<EstadoResultados> {
    let p = new HttpParams().set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    if (centroCostoId) p = p.set('centroCostoId', centroCostoId);
    return this.http.get<EstadoResultados>(`${this.base}/reportes/estado-resultados`, { params: p });
  }

  getLibroDiario(fechaInicio: string, fechaFin: string): Observable<LibroDiarioItem[]> {
    const params = new HttpParams().set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    return this.http.get<LibroDiarioItem[]>(`${this.base}/reportes/libro-diario`, { params });
  }

  getLibroMayor(fechaInicio: string, fechaFin: string, codigoCuenta?: string): Observable<LibroMayorCuenta[]> {
    let p = new HttpParams().set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    if (codigoCuenta) p = p.set('codigoCuenta', codigoCuenta);
    return this.http.get<LibroMayorCuenta[]>(`${this.base}/reportes/libro-mayor`, { params: p });
  }

  getAuxiliarTercero(fechaInicio: string, fechaFin: string, terceroId?: string, codigoCuenta?: string): Observable<AuxiliarTerceroReporte> {
    let p = new HttpParams().set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    if (terceroId) p = p.set('terceroId', terceroId);
    if (codigoCuenta) p = p.set('codigoCuenta', codigoCuenta);
    return this.http.get<AuxiliarTerceroReporte>(`${this.base}/reportes/auxiliar-tercero`, { params: p });
  }

  descargarReporteExcel(tipo: string, params: Record<string, string>): void {
    let httpParams = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) httpParams = httpParams.set(k, v);
    }
    const url = `${this.base}/reportes/${tipo}/excel?${httpParams.toString()}`;
    window.open(url, '_blank');
  }

  descargarExcel(reporte: string, params: Record<string, string>): void {
    this.descargarReporteExcel(reporte, params);
  }

  descargarReportePdf(tipo: string, params: Record<string, string>): void {
    let httpParams = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) httpParams = httpParams.set(k, v);
    }
    const url = `${this.base}/reportes/${tipo}/pdf?${httpParams.toString()}`;
    window.open(url, '_blank');
  }
}
