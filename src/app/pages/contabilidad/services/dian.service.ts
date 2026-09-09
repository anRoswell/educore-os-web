import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DianConfigModel,
  DocumentoElectronicoModel,
} from '../models/contabilidad.models';

@Injectable({ providedIn: 'root' })
export class DianService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3001/api/v1/contabilidad/dian';

  getConfig(): Observable<{ config: DianConfigModel | null; configurado: boolean; tieneCertificado: boolean }> {
    return this.http.get<{ config: DianConfigModel | null; configurado: boolean; tieneCertificado: boolean }>(
      `${this.base}/config`,
    );
  }

  saveConfig(dto: Partial<DianConfigModel>): Observable<{ success: boolean; message: string; config: DianConfigModel }> {
    return this.http.post<{ success: boolean; message: string; config: DianConfigModel }>(
      `${this.base}/config`,
      dto,
    );
  }

  testConnection(): Observable<{ success: boolean; message: string; details?: any }> {
    return this.http.post<{ success: boolean; message: string; details?: any }>(
      `${this.base}/test-connection`,
      {},
    );
  }

  getDocumentos(filters?: {
    tipoDocumento?: string;
    estadoDian?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<{ items: DocumentoElectronicoModel[]; total: number; page: number; limit: number }> {
    let params = new HttpParams();
    if (filters?.tipoDocumento) params = params.set('tipoDocumento', filters.tipoDocumento);
    if (filters?.estadoDian) params = params.set('estadoDian', filters.estadoDian);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<{ items: DocumentoElectronicoModel[]; total: number; page: number; limit: number }>(
      `${this.base}/documentos`,
      { params },
    );
  }

  emitirFactura(cuentaCobroId: string, sendToDian: boolean = true): Observable<{ success: boolean; message: string; documento: DocumentoElectronicoModel }> {
    return this.http.post<{ success: boolean; message: string; documento: DocumentoElectronicoModel }>(
      `${this.base}/facturas/emitir`,
      { cuentaCobroId, sendToDian },
    );
  }

  emitirFacturaDirecta(dto: import('../models/contabilidad.models').EmitirFacturaDirectaModel): Observable<{ success: boolean; message: string; documento: DocumentoElectronicoModel }> {
    return this.http.post<{ success: boolean; message: string; documento: DocumentoElectronicoModel }>(
      `${this.base}/facturas/emitir-directa`,
      dto,
    );
  }

  emitirFacturasMasivas(dto: import('../models/contabilidad.models').EmitirFacturasMasivasModel): Observable<import('../models/contabilidad.models').ResultadoFacturasMasivasModel> {
    return this.http.post<import('../models/contabilidad.models').ResultadoFacturasMasivasModel>(
      `${this.base}/facturas/emitir-masiva`,
      dto,
    );
  }

  enviarFacturaEmail(documentoId: string, dto?: import('../models/contabilidad.models').EnviarFacturaEmailModel): Observable<{ success: boolean; message: string; enviadoA: string }> {
    return this.http.post<{ success: boolean; message: string; enviadoA: string }>(
      `${this.base}/documentos/${documentoId}/enviar-email`,
      dto || {},
    );
  }

  emitirNotaCredito(dto: {
    documentoReferenciadoId: string;
    concepto: string;
    valorTotal?: number;
    sendToDian?: boolean;
  }): Observable<{ success: boolean; message: string; documento: DocumentoElectronicoModel }> {
    return this.http.post<{ success: boolean; message: string; documento: DocumentoElectronicoModel }>(
      `${this.base}/notas-credito/emitir`,
      dto,
    );
  }

  emitirNotaDebito(dto: {
    documentoReferenciadoId: string;
    concepto: string;
    valorTotal: number;
    sendToDian?: boolean;
  }): Observable<{ success: boolean; message: string; documento: DocumentoElectronicoModel }> {
    return this.http.post<{ success: boolean; message: string; documento: DocumentoElectronicoModel }>(
      `${this.base}/notas-debito/emitir`,
      dto,
    );
  }

  emitirDocumentoSoporte(dto: {
    terceroId: string;
    concepto: string;
    subtotal: number;
    retenciones?: number;
    cuentaPorPagarId?: string;
    sendToDian?: boolean;
  }): Observable<{ success: boolean; message: string; documento: DocumentoElectronicoModel }> {
    return this.http.post<{ success: boolean; message: string; documento: DocumentoElectronicoModel }>(
      `${this.base}/documentos-soporte/emitir`,
      dto,
    );
  }

  reconsultar(documentoId: string): Observable<{ success: boolean; estadoDian: string; mensajeRespuesta: string; documento: DocumentoElectronicoModel }> {
    return this.http.post<{ success: boolean; estadoDian: string; mensajeRespuesta: string; documento: DocumentoElectronicoModel }>(
      `${this.base}/documentos/${documentoId}/reconsultar`,
      {},
    );
  }

  descargarXml(documentoId: string): Observable<Blob> {
    return this.http.get(`${this.base}/documentos/${documentoId}/xml`, {
      responseType: 'blob',
    });
  }

  descargarPdf(documentoId: string): Observable<Blob> {
    return this.http.get(`${this.base}/documentos/${documentoId}/pdf`, {
      responseType: 'blob',
    });
  }
}
