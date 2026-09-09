import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { AutoMatchResultadoModel, InformeConciliacionModel } from '../models/contabilidad.models';

export interface ExtractoItem {
  id: string;
  banco: string;
  numeroCuenta: string;
  fechaInicial: string;
  fechaFinal: string;
  saldoInicial: number;
  saldoFinal: number;
  archivoNombre: string;
  formato: string;
  totalLineas: number;
  estado: string;
  createdAt: string;
}

export interface ExtractoLineaItem {
  id: string;
  extractoId: string;
  fecha: string;
  concepto: string;
  referencia?: string;
  monto: number;
  tipoMovimiento: 'DEBITO' | 'CREDITO';
  estado: 'PENDIENTE' | 'CONCILIADO' | 'PARTIDA_CONCILIATORIA';
  asientoLineaId?: string;
}

@Component({
  selector: 'app-contabilidad-conciliacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .concil-header-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .concil-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .concil-icon-wrap {
      font-size: 1.75rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .concil-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .concil-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .concil-title-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .concil-subtitle-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .concil-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .concil-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .concil-kpis-grid {
        grid-template-columns: 1fr;
      }
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
    }
    .kpi-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
      border-color: #cbd5e1;
    }
    .kpi-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    .kpi-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin-top: 0.25rem;
    }
    .kpi-subtext {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }
    .concil-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    .concil-card-header {
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .table-custom {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      text-align: left;
    }
    .table-custom th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .table-custom td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .table-custom tr:hover {
      background: #f8fafc;
    }
    .badge-status {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 600;
    }
    .badge-status-conciliado {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .badge-status-pendiente {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .badge-status-partida {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(2px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 0.875rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 100%;
      max-width: 38rem;
      overflow: hidden;
      animation: modalFadeIn 0.15s ease-out;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
    }
    .modal-body {
      padding: 1.25rem;
    }
    .modal-footer {
      padding: 0.875rem 1.25rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `],
  template: `
    <div class="tab-content" data-testid="tab-content-conciliacion">
      <!-- Header Banner -->
      <div class="concil-header-banner" data-testid="conciliacion-header-banner">
        <div class="concil-header-main">
          <div class="concil-icon-wrap">🏦</div>
          <div class="concil-texts-wrap">
            <div class="concil-title-row">
              <h2 class="concil-title-text" data-testid="conciliacion-title">
                Conciliación Bancaria Automática y Manual
              </h2>
              <span class="badge-mini" style="background: rgba(59, 130, 246, 0.1); color: #2563eb; border-color: rgba(59, 130, 246, 0.2);">
                Control Financiero
              </span>
            </div>
            <p class="concil-subtitle-text" data-testid="conciliacion-subtitle">
              Cruce sistemático de extractos bancarios (.xlsx, .csv, .ofx) contra la cuenta corriente escolar 111005.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="btn-secondary btn-sm flex items-center gap-1.5"
            data-testid="btn-abrir-importar-extracto"
            (click)="abrirModalImportar()"
          >
            <span>📥</span>
            <span>Importar Extracto</span>
          </button>

          <button
            type="button"
            class="btn-primary btn-sm flex items-center gap-1.5"
            data-testid="btn-ejecutar-auto-match"
            [disabled]="cargando() || extractos().length === 0"
            (click)="ejecutarAutoMatch()"
          >
            <span>⚡</span>
            <span>Auto-Match (Cruce Automático)</span>
          </button>

          <button
            type="button"
            class="btn-secondary btn-sm flex items-center gap-1.5"
            data-testid="btn-ver-acta-conciliacion"
            (click)="mostrarModalActa.set(true)"
          >
            <span>📄</span>
            <span>Acta de Conciliación</span>
          </button>
        </div>
      </div>

      <!-- Error / Success Banners -->
      @if (mensajeExito()) {
        <div class="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between" data-testid="conciliacion-success-banner">
          <span>{{ mensajeExito() }}</span>
          <button type="button" class="text-emerald-500 font-bold ml-2" (click)="mensajeExito.set(null)">✕</button>
        </div>
      }

      @if (errorMensaje()) {
        <div class="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between" data-testid="conciliacion-error-banner">
          <span>{{ errorMensaje() }}</span>
          <button type="button" class="text-red-500 font-bold ml-2" (click)="errorMensaje.set(null)">✕</button>
        </div>
      }

      <!-- Selector de Extracto -->
      <div class="card p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs mb-4 flex flex-wrap items-end justify-between gap-4">
        <div class="form-group-inline flex-1 min-w-[320px] mb-0">
          <label class="form-label-sm">Extracto Bancario Activo</label>
          <select
            class="input-base input-sm w-full font-semibold"
            data-testid="select-extracto-activo"
            [ngModel]="extractoSeleccionadoId()"
            (ngModelChange)="onExtractoChange($event)"
          >
            @for (ext of extractos(); track ext.id) {
              <option [value]="ext.id">
                {{ ext.banco }} (Cta: {{ ext.numeroCuenta }}) — Periodo: {{ ext.fechaInicial }} a {{ ext.fechaFinal }} ({{ ext.totalLineas }} movs)
              </option>
            } @empty {
              <option value="">No hay extractos importados. Haga clic en "+ Importar Extracto".</option>
            }
          </select>
        </div>
        <button
          type="button"
          class="btn-secondary btn-sm h-[38px] inline-flex items-center gap-1.5 font-semibold shadow-2xs"
          data-testid="btn-refrescar-extractos"
          (click)="cargarExtractos()"
        >
          <span>🔄</span>
          <span>Actualizar</span>
        </button>
      </div>

      <!-- KPIs Grid -->
      <div class="concil-kpis-grid" data-testid="conciliacion-kpis">
        <div class="kpi-card" data-testid="kpi-saldo-extracto">
          <span class="kpi-title">Saldo en Extracto Bancario</span>
          <div class="kpi-value text-indigo-600">
            $ {{ (informe()?.saldoExtracto || 0) | number:'1.0-0' }}
          </div>
          <span class="kpi-subtext">Certificado según banco</span>
        </div>

        <div class="kpi-card" data-testid="kpi-saldo-libros">
          <span class="kpi-title">Saldo en Libros Contables</span>
          <div class="kpi-value">
            $ {{ (informe()?.saldoLibrosContables || 0) | number:'1.0-0' }}
          </div>
          <span class="kpi-subtext">Cuenta PUC 111005 Bancos</span>
        </div>

        <div class="kpi-card" data-testid="kpi-saldo-conciliado">
          <span class="kpi-title">Saldo Conciliado en Libros</span>
          <div class="kpi-value text-slate-800">
            $ {{ (informe()?.saldoConciliadoLibros || 0) | number:'1.0-0' }}
          </div>
          <span class="kpi-subtext">Ajustado por partidas temporales</span>
        </div>

        <div class="kpi-card" data-testid="kpi-diferencia">
          <span class="kpi-title">Diferencia Conciliatoria</span>
          <div class="kpi-value" [class.text-emerald-600]="(informe()?.diferencia || 0) === 0" [class.text-red-600]="(informe()?.diferencia || 0) !== 0">
            $ {{ (informe()?.diferencia || 0) | number:'1.0-0' }}
          </div>
          <span class="kpi-subtext">
            {{ (informe()?.diferencia || 0) === 0 ? '✅ Conciliación 100% Cuadrada' : '⚠️ Pendiente de conciliar' }}
          </span>
        </div>
      </div>

      <!-- AutoMatch KPI Summary if executed -->
      @if (resultadoAutoMatch()) {
        <div class="mb-4 p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between flex-wrap gap-3" data-testid="banner-auto-match-result">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚡</span>
            <div>
              <h4 class="text-xs font-bold text-indigo-900">Resultado del Algoritmo de Auto-Match (HashMap O(N+M))</h4>
              <p class="text-xs text-indigo-700">
                Se cruzaron <strong>{{ resultadoAutoMatch()!.partidasConciliadas }}</strong> partidas con coincidencia exacta. Pendientes: <strong>{{ resultadoAutoMatch()!.partidasPendientes }}</strong>.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-indigo-800 bg-white px-2.5 py-1 rounded-full border border-indigo-200" data-testid="badge-tasa-exito">
              Tasa de Éxito: {{ resultadoAutoMatch()!.tasaExito }}%
            </span>
          </div>
        </div>
      }

      <!-- Movimientos del Extracto Table -->
      <div class="concil-card" data-testid="card-movimientos-extracto">
        <div class="concil-card-header">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-slate-800" data-testid="table-movimientos-title">
              Movimientos del Extracto Bancario
            </span>
            <span class="text-xs text-slate-500">
              ({{ lineas().length }} movimientos registrados)
            </span>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar por referencia o concepto..."
              class="text-xs p-1.5 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 w-64"
              data-testid="input-buscar-linea"
              [ngModel]="filtroTexto()"
              (ngModelChange)="filtroTexto.set($event)"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table-custom" data-testid="table-extracto-lineas">
            <thead>
              <tr>
                <th class="w-10 text-center">#</th>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Referencia</th>
                <th class="text-center">Tipo</th>
                <th class="text-right">Monto ($)</th>
                <th class="text-center">Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (linea of lineasFiltradas(); track linea.id; let idx = $index) {
                <tr [attr.data-testid]="'row-linea-' + idx">
                  <td class="text-center font-semibold text-slate-400">{{ idx + 1 }}</td>
                  <td class="font-mono text-xs text-slate-600" [attr.data-testid]="'linea-fecha-' + idx">
                    {{ linea.fecha }}
                  </td>
                  <td class="font-medium text-slate-800" [attr.data-testid]="'linea-concepto-' + idx">
                    {{ linea.concepto }}
                  </td>
                  <td class="font-mono text-xs text-indigo-700" [attr.data-testid]="'linea-ref-' + idx">
                    {{ linea.referencia || '-' }}
                  </td>
                  <td class="text-center">
                    <span
                      class="text-xs font-semibold px-2 py-0.5 rounded"
                      [class.bg-emerald-100]="linea.tipoMovimiento === 'CREDITO'"
                      [class.text-emerald-800]="linea.tipoMovimiento === 'CREDITO'"
                      [class.bg-blue-100]="linea.tipoMovimiento === 'DEBITO'"
                      [class.text-blue-800]="linea.tipoMovimiento === 'DEBITO'"
                    >
                      {{ linea.tipoMovimiento }}
                    </span>
                  </td>
                  <td class="text-right font-bold text-slate-900" [attr.data-testid]="'linea-monto-' + idx">
                    $ {{ linea.monto | number:'1.0-0' }}
                  </td>
                  <td class="text-center">
                    <span [class]="getBadgeEstadoClass(linea.estado)" [attr.data-testid]="'linea-estado-' + idx">
                      {{ linea.estado }}
                    </span>
                  </td>
                  <td class="text-center">
                    <button
                      type="button"
                      class="text-xs text-indigo-600 hover:text-indigo-900 font-semibold p-1 hover:bg-indigo-50 rounded"
                      [attr.data-testid]="'btn-conciliar-manual-' + idx"
                      (click)="abrirModalManual(linea)"
                    >
                      ✏️ Conciliar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center py-8 text-slate-400" data-testid="empty-extracto-lineas">
                    No hay movimientos para mostrar. Seleccione un extracto o importe uno nuevo.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Importar Extracto -->
      @if (mostrarModalImportar()) {
        <div class="modal-overlay" data-testid="modal-importar-extracto-overlay" (click)="cerrarModalImportar()">
          <div class="modal-card" data-testid="modal-importar-extracto" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="flex items-center gap-2">
                <span class="text-lg">📥</span>
                <h3 class="font-bold text-slate-800 text-sm" data-testid="modal-importar-title">
                  Importar Extracto Bancario Institucional
                </h3>
              </div>
              <button type="button" class="text-slate-400 hover:text-slate-600 font-bold text-sm" (click)="cerrarModalImportar()">✕</button>
            </div>

            <div class="modal-body space-y-3">
              <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs">
                Suba el archivo del extracto bancario mensual o utilice los parámetros institucionales para sincronizar los movimientos con la cuenta contable 111005.
              </div>

              <div class="form-group">
                <label class="form-label">Nombre del Archivo:</label>
                <input
                  type="text"
                  class="form-control"
                  data-testid="input-importar-archivo-nombre"
                  [(ngModel)]="nuevoExtracto.archivoNombre"
                  placeholder="ej. Extracto_Bogota_Agosto_2026.xlsx"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label">Entidad Bancaria</label>
                  <select
                    class="form-control"
                    data-testid="select-importar-banco"
                    [(ngModel)]="nuevoExtracto.banco"
                  >
                    <option value="Banco de Bogotá">Banco de Bogotá</option>
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Davivienda">Davivienda</option>
                    <option value="Banco de Occidente">Banco de Occidente</option>
                    <option value="Banco Popular">Banco Popular</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Formato</label>
                  <select
                    class="form-control"
                    data-testid="select-importar-formato"
                    [(ngModel)]="nuevoExtracto.formato"
                  >
                    <option value="XLSX">Excel (.xlsx)</option>
                    <option value="CSV">CSV Delimitado (;)</option>
                    <option value="OFX">OFX Bancario Estándar</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Número de Cuenta Corriente</label>
                <input
                  type="text"
                  class="form-control"
                  data-testid="input-importar-numero-cuenta"
                  [(ngModel)]="nuevoExtracto.numeroCuenta"
                  placeholder="ej. 001-987654-32"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-cancelar-importar-extracto"
                [disabled]="procesandoImportacion()"
                (click)="cerrarModalImportar()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary btn-sm flex items-center gap-1.5"
                data-testid="btn-confirmar-importar-extracto"
                [disabled]="procesandoImportacion() || !nuevoExtracto.archivoNombre"
                (click)="ejecutarImportacion()"
              >
                <span>📥</span>
                <span>{{ procesandoImportacion() ? 'Procesando...' : 'Importar Movimientos' }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Conciliar Manual -->
      @if (lineaSeleccionadaManual()) {
        <div class="modal-overlay" data-testid="modal-conciliar-manual-overlay" (click)="cerrarModalManual()">
          <div class="modal-card" data-testid="modal-conciliar-manual" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="flex items-center gap-2">
                <span class="text-lg">✏️</span>
                <h3 class="font-bold text-slate-800 text-sm" data-testid="modal-manual-title">
                  Conciliación Asistida de Partida
                </h3>
              </div>
              <button type="button" class="text-slate-400 hover:text-slate-600 font-bold text-sm" (click)="cerrarModalManual()">✕</button>
            </div>

            <div class="modal-body space-y-3 text-xs">
              <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div class="flex justify-between">
                  <span class="text-slate-500">Fecha:</span>
                  <span class="font-semibold">{{ lineaSeleccionadaManual()!.fecha }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Concepto:</span>
                  <span class="font-semibold">{{ lineaSeleccionadaManual()!.concepto }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Referencia:</span>
                  <span class="font-semibold font-mono">{{ lineaSeleccionadaManual()!.referencia || 'N/A' }}</span>
                </div>
                <div class="flex justify-between text-sm font-bold text-indigo-700">
                  <span>Monto:</span>
                  <span>$ {{ lineaSeleccionadaManual()!.monto | number:'1.0-0' }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-partida-conciliatoria"
                  class="rounded text-indigo-600 focus:ring-0"
                  data-testid="chk-partida-conciliatoria"
                  [ngModel]="esPartidaConciliatoria()"
                  (ngModelChange)="esPartidaConciliatoria.set($event)"
                />
                <label for="chk-partida-conciliatoria" class="text-xs font-semibold text-slate-700 cursor-pointer">
                  Marcar como Partida Conciliatoria (Pendiente de cobro / En tránsito)
                </label>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Observación de Auditoría Contable:
                </label>
                <textarea
                  class="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                  rows="2"
                  data-testid="textarea-manual-obs"
                  [ngModel]="observacionManual()"
                  (ngModelChange)="observacionManual.set($event)"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-cancelar-manual"
                (click)="cerrarModalManual()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary btn-sm flex items-center gap-1.5"
                data-testid="btn-guardar-conciliar-manual"
                (click)="guardarConciliacionManual()"
              >
                <span>💾</span>
                <span>Guardar Conciliación</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Acta Mensual de Conciliación -->
      @if (mostrarModalActa()) {
        <div class="modal-overlay" data-testid="modal-acta-overlay" (click)="mostrarModalActa.set(false)">
          <div class="modal-card max-w-2xl" data-testid="modal-acta-conciliacion" (click)="$event.stopPropagation()">
            <div class="modal-header bg-indigo-50 border-indigo-200">
              <div class="flex items-center gap-2">
                <span class="text-xl">📄</span>
                <h3 class="font-bold text-indigo-900 text-sm" data-testid="modal-acta-title">
                  Acta Oficial Mensual de Conciliación Bancaria
                </h3>
              </div>
              <button type="button" class="text-slate-400 hover:text-slate-600 font-bold text-sm" (click)="mostrarModalActa.set(false)">✕</button>
            </div>

            <div class="modal-body space-y-4 text-xs">
              <div class="text-center border-b pb-2">
                <h4 class="font-bold text-slate-800 text-sm">COLEGIO MAYOR DE SAN BARTOLOMÉ</h4>
                <p class="text-slate-500 text-xs">NIT: 860.001.234-5 — Revisoría Fiscal y Contaduría</p>
                <span class="inline-block mt-1 font-bold text-indigo-800 bg-indigo-100/60 px-2.5 py-0.5 rounded text-xs">
                  Conciliación al Cierre Mensual
                </span>
              </div>

              <div class="space-y-2 text-slate-700">
                <div class="flex justify-between py-1 border-b">
                  <span>(+) Saldo según Extracto Bancario:</span>
                  <span class="font-bold font-mono">$ {{ (informe()?.saldoExtracto || 0) | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between py-1 border-b text-amber-700">
                  <span>(-) Menos: Cheques Girados y No Cobrados:</span>
                  <span class="font-bold font-mono">$ {{ (informe()?.menosChequesGiradosNoCobrados || 0) | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between py-1 border-b text-emerald-700">
                  <span>(+) Más: Consignaciones y Transferencias en Tránsito:</span>
                  <span class="font-bold font-mono">$ {{ (informe()?.masConsignacionesEnTransito || 0) | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between py-1 border-b text-red-700">
                  <span>(-) Menos: Notas Débito Bancarias Pendientes de Causar:</span>
                  <span class="font-bold font-mono">$ {{ (informe()?.menosNotasDebitoNoContabilizadas || 0) | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between py-1.5 border-t-2 border-slate-400 font-bold text-sm bg-slate-50 px-2">
                  <span>(=) Saldo Conciliado en Libros:</span>
                  <span class="font-mono text-indigo-800">$ {{ (informe()?.saldoConciliadoLibros || 0) | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between py-1.5 border-b font-bold text-sm bg-slate-50 px-2">
                  <span>(=) Saldo Real en Libros Contables (Cta 111005):</span>
                  <span class="font-mono text-slate-900">$ {{ (informe()?.saldoLibrosContables || 0) | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between py-2 text-sm font-bold px-2 rounded" [class.bg-emerald-100]="(informe()?.diferencia || 0) === 0" [class.text-emerald-900]="(informe()?.diferencia || 0) === 0" [class.bg-red-100]="(informe()?.diferencia || 0) !== 0" [class.text-red-900]="(informe()?.diferencia || 0) !== 0">
                  <span>Diferencia Neta de Conciliación:</span>
                  <span class="font-mono" data-testid="acta-diferencia">$ {{ (informe()?.diferencia || 0) | number:'1.0-0' }}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-6 pt-4 border-t text-center text-xs text-slate-500">
                <div class="border-t border-slate-300 pt-1">
                  <p class="font-semibold text-slate-800">Contador Público</p>
                  <p>T.P. 182934-T</p>
                </div>
                <div class="border-t border-slate-300 pt-1">
                  <p class="font-semibold text-slate-800">Revisor Fiscal</p>
                  <p>T.P. 94821-T</p>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-cerrar-acta-conciliacion"
                (click)="mostrarModalActa.set(false)"
              >
                Cerrar Acta
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContabilidadConciliacionComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly extractos = signal<ExtractoItem[]>([]);
  readonly extractoSeleccionadoId = signal<string>('');
  readonly lineas = signal<ExtractoLineaItem[]>([]);
  readonly informe = signal<InformeConciliacionModel | null>(null);
  readonly resultadoAutoMatch = signal<AutoMatchResultadoModel | null>(null);

  readonly cargando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly filtroTexto = signal<string>('');

  // Modales
  readonly mostrarModalImportar = signal<boolean>(false);
  readonly procesandoImportacion = signal<boolean>(false);
  readonly mostrarModalActa = signal<boolean>(false);

  readonly lineaSeleccionadaManual = signal<ExtractoLineaItem | null>(null);
  readonly esPartidaConciliatoria = signal<boolean>(false);
  readonly observacionManual = signal<string>('');

  readonly nuevoExtracto = {
    archivoNombre: 'Extracto_Bancario_Agosto_2026.xlsx',
    banco: 'Banco de Bogotá',
    numeroCuenta: '001-987654-32',
    formato: 'XLSX' as 'XLSX' | 'CSV' | 'OFX',
  };

  readonly lineasFiltradas = computed(() => {
    const txt = this.filtroTexto().toLowerCase().trim();
    if (!txt) return this.lineas();
    return this.lineas().filter((l) =>
      (l.concepto && l.concepto.toLowerCase().includes(txt)) ||
      (l.referencia && l.referencia.toLowerCase().includes(txt))
    );
  });

  ngOnInit(): void {
    this.cargarExtractos();
    this.cargarInforme();
  }

  cargarExtractos(): void {
    this.cargando.set(true);
    this.svc.getExtractosBancarios().subscribe({
      next: (res) => {
        this.extractos.set(res || []);
        if (res && res.length > 0 && !this.extractoSeleccionadoId()) {
          this.extractoSeleccionadoId.set(res[0].id);
          this.cargarLineas(res[0].id);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al listar extractos:', err);
        this.cargando.set(false);
      },
    });
  }

  cargarLineas(extractoId: string): void {
    if (!extractoId) return;
    this.svc.getLineasExtracto(extractoId).subscribe({
      next: (res) => {
        this.lineas.set(res || []);
      },
      error: (err) => {
        console.error('Error al obtener lineas de extracto:', err);
      },
    });
  }

  cargarInforme(): void {
    const extId = this.extractoSeleccionadoId() || undefined;
    this.svc.getInformeConciliacion(extId).subscribe({
      next: (res) => {
        this.informe.set(res);
      },
      error: (err) => {
        console.error('Error al obtener informe de conciliacion:', err);
      },
    });
  }

  onExtractoChange(id: string): void {
    this.extractoSeleccionadoId.set(id);
    this.cargarLineas(id);
    this.cargarInforme();
  }

  ejecutarAutoMatch(): void {
    const extId = this.extractoSeleccionadoId() || (this.extractos().length > 0 ? this.extractos()[0].id : 'ext-001');
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.svc.autoMatchConciliacion({ extractoId: extId }).subscribe({
      next: (res) => {
        this.resultadoAutoMatch.set(res);
        this.mensajeExito.set(`Auto-Match exitoso: ${res.partidasConciliadas} partidas cruzadas con 0 diferencias.`);
        this.cargando.set(false);
        if (this.extractoSeleccionadoId()) {
          this.cargarLineas(this.extractoSeleccionadoId());
        }
        this.cargarInforme();
      },
      error: (err) => {
        console.error('Error en auto-match:', err);
        this.errorMensaje.set('Error al ejecutar cruce automático de conciliación.');
        this.cargando.set(false);
      },
    });
  }

  abrirModalImportar(): void {
    this.nuevoExtracto.archivoNombre = `Extracto_BancoBogota_${new Date().toISOString().split('T')[0]}.xlsx`;
    this.mostrarModalImportar.set(true);
  }

  cerrarModalImportar(): void {
    this.mostrarModalImportar.set(false);
  }

  ejecutarImportacion(): void {
    this.procesandoImportacion.set(true);
    this.errorMensaje.set(null);

    const dto = {
      archivoNombre: this.nuevoExtracto.archivoNombre,
      banco: this.nuevoExtracto.banco,
      numeroCuenta: this.nuevoExtracto.numeroCuenta,
      formato: this.nuevoExtracto.formato,
    };

    this.svc.importarExtractoBancario(dto).subscribe({
      next: (res) => {
        this.procesandoImportacion.set(false);
        this.mostrarModalImportar.set(false);
        this.mensajeExito.set(`Extracto "${res.banco}" importado con éxito: ${res.totalLineas} movimientos registrados.`);
        this.cargarExtractos();
      },
      error: (err) => {
        console.error('Error al importar extracto:', err);
        this.errorMensaje.set('Error al procesar el archivo del extracto bancario.');
        this.procesandoImportacion.set(false);
      },
    });
  }

  abrirModalManual(linea: ExtractoLineaItem): void {
    this.lineaSeleccionadaManual.set(linea);
    this.esPartidaConciliatoria.set(linea.estado === 'PARTIDA_CONCILIATORIA');
    this.observacionManual.set('Conciliación manual confirmada por Tesorería');
  }

  cerrarModalManual(): void {
    this.lineaSeleccionadaManual.set(null);
  }

  guardarConciliacionManual(): void {
    const l = this.lineaSeleccionadaManual();
    if (!l) return;

    const dto = {
      extractoLineaId: l.id,
      esPartidaConciliatoria: this.esPartidaConciliatoria(),
      observacion: this.observacionManual(),
    };

    this.svc.conciliarLineaManual(dto).subscribe({
      next: (res) => {
        this.mensajeExito.set(`Movimiento "${l.concepto}" conciliado exitosamente.`);
        this.cerrarModalManual();
        if (this.extractoSeleccionadoId()) {
          this.cargarLineas(this.extractoSeleccionadoId());
        }
        this.cargarInforme();
      },
      error: (err) => {
        console.error('Error al conciliar manualmente:', err);
        this.errorMensaje.set('Error al registrar la conciliación manual.');
      },
    });
  }

  getBadgeEstadoClass(estado: string): string {
    switch (estado) {
      case 'CONCILIADO':
        return 'badge-status badge-status-conciliado';
      case 'PARTIDA_CONCILIATORIA':
        return 'badge-status badge-status-partida';
      default:
        return 'badge-status badge-status-pendiente';
    }
  }
}
