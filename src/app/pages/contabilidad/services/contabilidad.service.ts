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
  IngresoDiferidoModel,
  AmortizacionCuotaModel,
  NominaResumenModel,
  BalancePrevioCierreModel,
  ResultadoCierreModel,
  ResultadoAperturaModel,
  CajaMenorModel,
  CajaMenorLegalizacionModel,
  CrearCajaMenorModel,
  RegistrarGastoCajaMenorModel,
  ProveedorRetencionModel,
  CertificadoProveedorResumenModel,
  Formulario350ResumenModel,
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

  // ─── Certificados Tributarios Escolares (Art. 387 E.T.) ─────────────────
  getCertificadoTributario(estudianteId: string, anio: number): Observable<any> {
    const params = new HttpParams().set('estudianteId', estudianteId).set('anio', String(anio));
    return this.http.get<any>(`${this.base}/certificados/anual`, { params });
  }

  descargarCertificadoPdf(estudianteId: string, anio: number): void {
    const url = `${this.base}/certificados/descargar-pdf?estudianteId=${estudianteId}&anio=${anio}`;
    window.open(url, '_blank');
  }

  // ─── Medios Magnéticos e Información Exógena DIAN ────────────────────────
  validarExogena(anio: number): Observable<any> {
    const params = new HttpParams().set('anio', String(anio));
    return this.http.get<any>(`${this.base}/exogena/validar`, { params });
  }

  getExogenaFormato(formato: string, anio: number): Observable<any> {
    const params = new HttpParams().set('anio', String(anio));
    return this.http.get<any>(`${this.base}/exogena/exportar/${formato}`, { params });
  }

  descargarExogenaExcel(formato: string, anio: number): void {
    const url = `${this.base}/exogena/exportar/${formato}/excel?anio=${anio}`;
    window.open(url, '_blank');
  }

  descargarExogenaXml(formato: string, anio: number): void {
    const url = `${this.base}/exogena/exportar/${formato}/xml?anio=${anio}`;
    window.open(url, '_blank');
  }

  // ─── Control Presupuestal Escolar ─────────────────────────────────────────
  getPresupuestos(anio?: number): Observable<any[]> {
    let params = new HttpParams();
    if (anio) params = params.set('anio', String(anio));
    return this.http.get<any[]>(`${this.base}/presupuestos`, { params });
  }

  getPresupuestoEjecucion(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/presupuestos/${id}/ejecucion`);
  }

  crearPresupuesto(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/presupuestos`, data);
  }

  agregarRubroPresupuesto(id: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/presupuestos/${id}/rubros`, data);
  }

  adicionPresupuestal(id: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/presupuestos/${id}/adicion`, data);
  }

  // ─── Conciliación Bancaria Automática ─────────────────────────────────────
  importarExtractoBancario(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/conciliacion/importar`, data);
  }

  autoMatchConciliacion(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/conciliacion/auto-match`, data);
  }

  conciliarLineaManual(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/conciliacion/manual`, data);
  }

  getInformeConciliacion(extractoId?: string): Observable<any> {
    let params = new HttpParams();
    if (extractoId) params = params.set('extractoId', extractoId);
    return this.http.get<any>(`${this.base}/conciliacion/informe`, { params });
  }

  getExtractosBancarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/conciliacion/extractos`);
  }

  getLineasExtracto(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/conciliacion/extractos/${id}/lineas`);
  }

  // ─── Ingresos Diferidos NIIF 15 ───────────────────────────────────────────
  getIngresosDiferidos(anio?: number): Observable<IngresoDiferidoModel[]> {
    let params = new HttpParams();
    if (anio) params = params.set('anio', String(anio));
    return this.http.get<any>(`${this.base}/ingresos-diferidos`, { params }).pipe(
      map((res) => {
        const rawList: any[] = Array.isArray(res)
          ? res
          : (res?.diferidos ?? res?.data ?? []);
        return rawList.map((raw) => this.mapIngresoDiferido(raw));
      }),
    );
  }

  amortizarMesDiferidos(mes: number, anio: number): Observable<any> {
    return this.http.post<any>(`${this.base}/ingresos-diferidos/amortizar-mes`, { mes, anio });
  }

  crearIngresoDiferido(data: Partial<IngresoDiferidoModel> & Record<string, any>): Observable<IngresoDiferidoModel> {
    const payload = {
      ...data,
      numeroMeses: data.cuotasPactadas || data['numeroMeses'] || 10,
      anio: data.anioLectivo || data['anio'] || new Date().getFullYear(),
      cuentaPasivo: data.cuentaPasivoCodigo || data['cuentaPasivo'] || '270505',
      cuentaIngreso: data.cuentaIngresoCodigo || data['cuentaIngreso'] || '416005',
    };
    return this.http.post<any>(`${this.base}/ingresos-diferidos`, payload).pipe(
      map((res) => this.mapIngresoDiferido(res)),
    );
  }

  private mapIngresoDiferido(raw: any): IngresoDiferidoModel {
    const cuotasRaw = Array.isArray(raw?.cuotas) ? raw.cuotas : [];
    const cuotas: AmortizacionCuotaModel[] = cuotasRaw.map((c: any) => ({
      id: c.id,
      mes: Number(c.mes),
      anio: Number(c.anio),
      monto: Number(c.valorCuota ?? c.monto ?? 0),
      estado: (c.estado === 'AMORTIZADO' || c.estado === 'AMORTIZADA') ? 'AMORTIZADA' : (c.estado || 'PENDIENTE'),
      fechaAmortizacion: c.fechaAmortizado ? String(c.fechaAmortizado).split('T')[0] : (c.fechaAmortizacion || undefined),
      asientoId: c.asientoId || undefined,
    }));

    cuotas.sort((a, b) => a.mes - b.mes);

    const cuotasAmortizadasCount = cuotas.filter((c) => c.estado === 'AMORTIZADA').length;
    const cuotasPactadasCount = Number(raw?.numeroMeses ?? raw?.cuotasPactadas ?? (cuotas.length > 0 ? cuotas.length : 10));

    return {
      id: raw?.id || '',
      colegioId: raw?.colegioId || '',
      estudianteId: raw?.estudianteId || undefined,
      matriculaId: raw?.matriculaId || raw?.contratoId || undefined,
      estudianteNombre: raw?.estudianteNombre || (raw?.estudiante ? `${raw.estudiante.primerNombre || ''} ${raw.estudiante.primerApellido || ''}`.trim() : undefined) || 'Estudiante Institucional',
      concepto: raw?.concepto || 'Diferido Matrícula Escolar NIIF 15',
      valorTotal: Number(raw?.valorTotal ?? 0),
      cuotasPactadas: cuotasPactadasCount,
      cuotasAmortizadas: raw?.cuotasAmortizadas !== undefined ? Number(raw.cuotasAmortizadas) : cuotasAmortizadasCount,
      saldoPendiente: Number(raw?.saldoPendiente ?? 0),
      anioLectivo: Number(raw?.anio ?? raw?.anioLectivo ?? new Date().getFullYear()),
      estado: raw?.estado === 'AMORTIZADO_TOTAL' ? 'LIQUIDADO' : (raw?.estado || 'ACTIVO'),
      cuentaPasivoCodigo: raw?.cuentaPasivo || raw?.cuentaPasivoCodigo || '270505',
      cuentaIngresoCodigo: raw?.cuentaIngreso || raw?.cuentaIngresoCodigo || '416005',
      cuotas: cuotas.length > 0 ? cuotas : undefined,
      createdAt: raw?.createdAt,
    };
  }

  // ─── Nómina Contable NIC 19 ───────────────────────────────────────────────
  getResumenNomina(mes: number, anio: number): Observable<NominaResumenModel> {
    let params = new HttpParams().set('anio', String(anio));
    return this.http.get<NominaResumenModel>(`${this.base}/nomina/resumen-periodo/${mes}`, { params });
  }

  causarNomina(mes: number, anio: number): Observable<any> {
    return this.http.post<any>(`${this.base}/nomina/causar-periodo`, { mes, anio });
  }

  provisionarNomina(mes: number, anio: number): Observable<any> {
    return this.http.post<any>(`${this.base}/nomina/provisiones`, { mes, anio });
  }

  dispersarNomina(mes: number, anio: number, bancoCuentaCodigo?: string): Observable<any> {
    const cuenta = bancoCuentaCodigo || '111005';
    return this.http.post<any>(`${this.base}/nomina/dispersar-pagos`, {
      mes,
      anio,
      cuentaBancaria: cuenta,
      bancoCuentaCodigo: cuenta,
    });
  }

  // ─── Cierre Anual Periodo 13 & Apertura APE ───────────────────────────────
  getBalancePrevioCierre(anio: number): Observable<BalancePrevioCierreModel> {
    let params = new HttpParams().set('anio', String(anio));
    return this.http.get<BalancePrevioCierreModel>(`${this.base}/cierre/balance-previo`, { params });
  }

  ejecutarCierreAnual(anio: number): Observable<ResultadoCierreModel> {
    return this.http.post<ResultadoCierreModel>(`${this.base}/cierre/ejecutar`, { anio });
  }

  ejecutarAperturaAnual(anio: number): Observable<ResultadoAperturaModel> {
    return this.http.post<ResultadoAperturaModel>(`${this.base}/cierre/apertura`, { anio });
  }

  // ─── Caja Menor & Fondos Fijos Escolar ────────────────────────────────────
  getCajasMenores(): Observable<CajaMenorModel[]> {
    return this.http.get<CajaMenorModel[]>(`${this.base}/caja-menor`);
  }

  getCajaMenorById(id: string): Observable<CajaMenorModel> {
    return this.http.get<CajaMenorModel>(`${this.base}/caja-menor/${id}`);
  }

  crearCajaMenor(dto: CrearCajaMenorModel): Observable<CajaMenorModel> {
    return this.http.post<CajaMenorModel>(`${this.base}/caja-menor`, dto);
  }

  registrarGastoCajaMenor(cajaId: string, dto: RegistrarGastoCajaMenorModel): Observable<any> {
    return this.http.post<any>(`${this.base}/caja-menor/${cajaId}/gastos`, dto);
  }

  reembolsarCajaMenor(cajaId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/caja-menor/${cajaId}/reembolso`, {});
  }

  // ─── Certificados a Proveedores Art. 381 & Formulario 350 ─────────────────
  getProveedoresRetenciones(anio: number): Observable<ProveedorRetencionModel[]> {
    return this.http.get<ProveedorRetencionModel[]>(`${this.base}/certificados-proveedores/${anio}`);
  }

  getCertificadoProveedor(terceroId: string, anio: number): Observable<CertificadoProveedorResumenModel> {
    return this.http.get<CertificadoProveedorResumenModel>(`${this.base}/certificados-proveedores/${anio}/detalle/${terceroId}`);
  }

  descargarPdfCertificadoProveedor(terceroId: string, anio: number): Observable<Blob> {
    return this.http.get(`${this.base}/certificados-proveedores/${anio}/pdf/${terceroId}`, {
      responseType: 'blob',
    });
  }

  enviarEmailCertificadoProveedor(terceroId: string, anio: number): Observable<any> {
    return this.http.post<any>(`${this.base}/certificados-proveedores/${anio}/enviar-email/${terceroId}`, {});
  }

  getFormulario350(anio: number, mes: number): Observable<Formulario350ResumenModel> {
    return this.http.get<Formulario350ResumenModel>(`${this.base}/formulario-350/${anio}/${mes}`);
  }
}
