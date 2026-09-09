import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';
import { ContabilidadService } from '../services/contabilidad.service';
import {
  DocumentoSoporteModel,
  ItemDocumentoSoporteModel,
  DocumentoSoporteNotaModel,
  CrearDocumentoSoporteModel,
  Tercero,
} from '../models/contabilidad.models';

@Component({
  selector: 'app-contabilidad-documento-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule, FlatpickrDirective],
  styles: [`
    .dse-header-banner {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      border: 1.5px solid #e2e8f0;
      border-left: 5px solid #4f46e5;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.03);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .dse-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .dse-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #eef2ff;
      border: 1.5px solid #c7d2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }
    .dse-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .dse-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .dse-title-text {
      font-size: 1.125rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .dse-subtitle-text {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .dse-actions-wrap {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }

    /* KPI Cards Grid & Widgets Estilo NIIF */
    .dse-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .dse-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .dse-kpis-grid {
        grid-template-columns: 1fr;
      }
    }

    .kpi-widget-card {
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
    .kpi-widget-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
      border-color: #cbd5e1;
    }
    .kpi-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }
    .kpi-widget-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    .kpi-widget-value {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: var(--font-mono);
      line-height: 1.2;
    }
    .kpi-widget-footer {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.35rem;
    }
  `],
  template: `
    <div class="tab-content space-y-4" data-testid="contabilidad-documento-soporte-tab">
      <!-- Status Banner & Header Bar -->
      <div class="dse-header-banner" data-testid="dse-status-banner">
        <div class="dse-header-main">
          <div class="dse-icon-wrap">📝</div>
          <div class="dse-texts-wrap">
            <div class="dse-title-row">
              <h3 class="dse-title-text" data-testid="title-documento-soporte">
                Documento Soporte Electrónico (No Obligados)
              </h3>
              <span class="badge-mini bg-indigo-50 text-indigo-700 border-indigo-200">
                Res. DIAN 000167
              </span>
            </div>
            <p class="dse-subtitle-text">
              Generación con CUDS, firma digital XAdES, transmisión SOAP DIAN y causación contable automática.
            </p>
          </div>
        </div>

        <div class="dse-actions-wrap">
          <button
            type="button"
            class="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold shadow-sm"
            (click)="abrirModalCrear()"
            data-testid="btn-nuevo-documento-soporte"
          >
            <span>➕</span>
            <span>Nuevo Documento Soporte</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards (Grid de 4 Columnas estilo NIIF Estandarizado) -->
      <div class="dse-kpis-grid" data-testid="dse-kpi-cards">
        <!-- KPI 1: Total Documentos -->
        <div class="kpi-widget-card" data-testid="kpi-total-documentos">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title">Total Emitidos</span>
            <span class="text-sm">📋</span>
          </div>
          <div class="kpi-widget-value text-slate-800" data-testid="kpi-total-documentos-val">
            {{ documentos().length }}
          </div>
          <div class="kpi-widget-footer">Documentos registrados</div>
        </div>

        <!-- KPI 2: Validados DIAN -->
        <div class="kpi-widget-card" style="border-color: #d1fae5; background: linear-gradient(135deg, rgba(209, 250, 229, 0.25) 0%, #ffffff 100%);" data-testid="kpi-total-aceptados">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #047857;">Validados DIAN</span>
            <span class="text-sm">✅</span>
          </div>
          <div class="kpi-widget-value" style="color: #047857;" data-testid="kpi-total-aceptados-val">
            {{ totalAceptados() }}
          </div>
          <div class="kpi-widget-footer" style="color: #059669;">Con CUDS oficial emitido</div>
        </div>

        <!-- KPI 3: Total Causado -->
        <div class="kpi-widget-card" style="border-color: #dbeafe; background: linear-gradient(135deg, rgba(219, 234, 254, 0.25) 0%, #ffffff 100%);" data-testid="kpi-total-valor">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #1d4ed8;">Total Causado</span>
            <span class="text-sm">💰</span>
          </div>
          <div class="kpi-widget-value" style="color: #1d4ed8;" data-testid="kpi-total-valor-val">
            \${{ totalCausado() | number }}
          </div>
          <div class="kpi-widget-footer" style="color: #2563eb;">Subtotal acumulado</div>
        </div>

        <!-- KPI 4: Retenciones Practicadas -->
        <div class="kpi-widget-card" style="border-color: #fef3c7; background: linear-gradient(135deg, rgba(254, 243, 199, 0.25) 0%, #ffffff 100%);" data-testid="kpi-total-retenciones">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #b45309;">Retenciones Practicadas</span>
            <span class="text-sm">⚖️</span>
          </div>
          <div class="kpi-widget-value" style="color: #b45309;" data-testid="kpi-total-retenciones-val">
            \${{ totalRetenciones() | number }}
          </div>
          <div class="kpi-widget-footer" style="color: #d97706;">Retefuente + ReteICA</div>
        </div>
      </div>

      <!-- Filtros y Búsqueda -->
      <div class="bg-white p-5 md:p-6 mb-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-4" data-testid="dse-filters-bar">
        <div class="form-group-inline mb-0 w-[140px] sm:w-[150px]">
          <label class="form-label-sm">Desde</label>
          <input
            type="text"
            appFlatpickr
            placeholder="dd/mm/aaaa"
            class="input-base input-sm w-full"
            [ngModel]="filtroFechaInicio()"
            (ngModelChange)="filtroFechaInicio.set($event); filtrar()"
            data-testid="filtro-fecha-inicio-ds"
          />
        </div>

        <div class="form-group-inline mb-0 w-[140px] sm:w-[150px]">
          <label class="form-label-sm">Hasta</label>
          <input
            type="text"
            appFlatpickr
            [minDate]="filtroFechaInicio()"
            placeholder="dd/mm/aaaa"
            class="input-base input-sm w-full"
            [ngModel]="filtroFechaFin()"
            (ngModelChange)="filtroFechaFin.set($event); filtrar()"
            data-testid="filtro-fecha-fin-ds"
          />
        </div>

        <div class="form-group-inline mb-0 w-[160px] sm:w-[180px]">
          <label class="form-label-sm">Estado</label>
          <select
            class="input-base input-sm w-full"
            [ngModel]="filtroEstado()"
            (ngModelChange)="filtroEstado.set($event); filtrar()"
            data-testid="filtro-estado-ds"
          >
            <option value="">Todos los estados</option>
            <option value="ACEPTADO">Aceptado DIAN</option>
            <option value="ANULADO">Anulado (NDS)</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </div>

        <div class="form-group-inline mb-0 min-w-[340px] flex-1">
          <label class="form-label-sm">Buscar número o proveedor</label>
          <input
            type="text"
            class="input-base input-sm w-full"
            placeholder="🔍 Buscar por número de documento o nombre del proveedor..."
            [ngModel]="busqueda()"
            (ngModelChange)="busqueda.set($event); filtrar()"
            data-testid="input-busqueda-ds"
          />
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn-secondary btn-sm h-[38px] px-4 flex items-center gap-1.5"
            (click)="cargarDocumentos()"
            data-testid="btn-recargar-ds"
          >
            <span>🔄</span>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Tabla de Documentos Soporte -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs" data-testid="tabla-documentos-soporte">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th class="py-3 px-4">Número / Prefijo</th>
                <th class="py-3 px-4">Fecha Emisión</th>
                <th class="py-3 px-4">Proveedor / Tercero</th>
                <th class="py-3 px-4 text-right">Subtotal</th>
                <th class="py-3 px-4 text-right">Retenciones</th>
                <th class="py-3 px-4 text-right">Total Neto</th>
                <th class="py-3 px-4 text-center">Estado DIAN</th>
                <th class="py-3 px-4 text-center">CUDS</th>
                <th class="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (cargando()) {
                <tr>
                  <td colspan="9" class="py-8 text-center text-slate-400">
                    <span class="inline-block animate-spin mr-2">⏳</span> Cargando documentos soporte...
                  </td>
                </tr>
              } @else if (documentos().length === 0) {
                <tr>
                  <td colspan="9" class="py-8 text-center text-slate-400" data-testid="sin-documentos-soporte">
                    No se encontraron documentos soporte electrónicos registrados.
                  </td>
                </tr>
              } @else {
                @for (doc of documentos(); track doc.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors" [attr.data-testid]="'row-ds-' + doc.numeroDocumento">
                    <td class="py-3 px-4 font-mono font-semibold text-indigo-700">
                      {{ doc.numeroDocumento }}
                    </td>
                    <td class="py-3 px-4 text-slate-600">
                      {{ doc.fechaEmision }}
                    </td>
                    <td class="py-3 px-4">
                      <div class="font-medium text-slate-800">
                        {{ doc.tercero?.nombreCompleto || doc.tercero?.razonSocial || 'Proveedor General' }}
                      </div>
                      <div class="text-[10px] text-slate-400 font-mono">
                        Doc: {{ doc.tercero?.numeroDocumento || 'N/A' }}
                      </div>
                    </td>
                    <td class="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      \${{ doc.subtotal | number }}
                    </td>
                    <td class="py-3 px-4 text-right font-mono text-amber-700 font-medium">
                      \${{ sumarRetenciones(doc.totalRetefuente, doc.totalReteica) | number }}
                    </td>
                    <td class="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      \${{ doc.totalPagar | number }}
                    </td>
                    <td class="py-3 px-4 text-center">
                      @if (doc.estadoDian === 'ACEPTADO') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Aceptado DIAN
                        </span>
                      } @else if (doc.estadoDian === 'ANULADO') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          ✕ Anulado (NDS)
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {{ doc.estadoDian }}
                        </span>
                      }
                    </td>
                    <td class="py-3 px-4 text-center">
                      @if (doc.cuds) {
                        <span class="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded" [title]="doc.cuds">
                          {{ doc.cuds.substring(0, 10) }}...
                        </span>
                      } @else {
                        <span class="text-slate-300">-</span>
                      }
                    </td>
                    <td class="py-3 px-4 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          class="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                          title="Ver Detalle / CUDS / Asiento"
                          (click)="verDetalle(doc)"
                          [attr.data-testid]="'btn-detalle-ds-' + doc.numeroDocumento"
                        >
                          👁️
                        </button>
                        @if (doc.estadoDian === 'ACEPTADO') {
                          <button
                            type="button"
                            class="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Anular con Nota de Ajuste NDS"
                            (click)="abrirModalAnular(doc)"
                            [attr.data-testid]="'btn-anular-ds-' + doc.numeroDocumento"
                          >
                            🚫
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: Crear Documento Soporte -->
      @if (modalCrearVisible()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" data-testid="modal-crear-ds-backdrop" (click)="cerrarModalCrear()">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()" data-testid="modal-crear-ds">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">📝</span>
                <div>
                  <h3 class="font-bold text-slate-800 text-base" data-testid="modal-crear-ds-title">
                    Emitir Documento Soporte Electrónico
                  </h3>
                  <p class="text-[11px] text-slate-400">Adquisición a proveedores no obligados a facturar (Res. 000167)</p>
                </div>
              </div>
              <button
                type="button"
                class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                (click)="cerrarModalCrear()"
                data-testid="btn-close-modal-crear-ds"
              >
                ✕
              </button>
            </div>

            <div class="p-5 overflow-y-auto space-y-4 text-xs">
              @if (errorModal()) {
                <div class="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs" data-testid="alert-error-crear-ds">
                  ⚠️ {{ errorModal() }}
                </div>
              }

              <!-- Proveedor Tercero -->
              <div class="form-group">
                <label class="form-label">Tercero / Proveedor No Obligado *</label>
                <select
                  class="form-control"
                  [ngModel]="nuevoTerceroId()"
                  (ngModelChange)="nuevoTerceroId.set($event)"
                  data-testid="select-tercero-crear-ds"
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  @for (t of terceros(); track t.id) {
                    <option [value]="t.id">
                      {{ t.nombreCompleto || t.razonSocial }} ({{ t.tipoDocumento || t.tipoIdentificacion || 'CC' }}: {{ t.numeroDocumento || t.numeroIdentificacion }})
                    </option>
                  }
                </select>
              </div>

              <!-- Fechas y Medio de Pago -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="form-group">
                  <label class="form-label">Fecha Emisión *</label>
                  <input
                    type="text"
                    appFlatpickr
                    placeholder="dd/mm/aaaa"
                    class="form-control"
                    [ngModel]="nuevaFechaEmision()"
                    (ngModelChange)="nuevaFechaEmision.set($event)"
                    data-testid="input-fecha-emision-ds"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha Vencimiento</label>
                  <input
                    type="text"
                    appFlatpickr
                    placeholder="dd/mm/aaaa"
                    class="form-control"
                    [ngModel]="nuevaFechaVencimiento()"
                    (ngModelChange)="nuevaFechaVencimiento.set($event)"
                    data-testid="input-fecha-vencimiento-ds"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Medio de Pago</label>
                  <select
                    class="form-control"
                    [ngModel]="nuevoMedioPago()"
                    (ngModelChange)="nuevoMedioPago.set($event)"
                    data-testid="select-medio-pago-ds"
                  >
                    <option value="10">Efectivo (10)</option>
                    <option value="47">Transferencia Bancaria (47)</option>
                    <option value="42">Consignación Bancaria (42)</option>
                    <option value="1">Instrumento no definido (1)</option>
                  </select>
                </div>
              </div>

              <!-- Detalle del Ítem / Servicio -->
              <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div class="font-bold text-slate-700 text-xs">Detalle del Bien o Servicio Prestado</div>
                <div class="form-group">
                  <label class="form-label">Descripción del Servicio o Suministro *</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej: Mantenimiento locativo de instalaciones eléctricas"
                    [ngModel]="itemDescripcion()"
                    (ngModelChange)="itemDescripcion.set($event)"
                    data-testid="input-item-descripcion-ds"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="form-group">
                    <label class="form-label">Cantidad</label>
                    <input
                      type="number"
                      class="form-control font-mono"
                      [ngModel]="itemCantidad()"
                      (ngModelChange)="itemCantidad.set(+$event)"
                      data-testid="input-item-cantidad-ds"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Precio Unitario (COP) *</label>
                    <input
                      type="number"
                      class="form-control font-mono"
                      [ngModel]="itemPrecioUnitario()"
                      (ngModelChange)="itemPrecioUnitario.set(+$event)"
                      data-testid="input-item-precio-ds"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Cuenta Gasto PUC</label>
                    <input
                      type="text"
                      class="form-control font-mono"
                      [ngModel]="itemCuentaGasto()"
                      (ngModelChange)="itemCuentaGasto.set($event)"
                      data-testid="input-item-cuenta-gasto-ds"
                    />
                  </div>
                </div>

                <!-- Retenciones -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div class="form-group">
                    <label class="form-label">% Retefuente (Ej: 4.0 o 3.5)</label>
                    <input
                      type="number"
                      step="0.1"
                      class="form-control font-mono"
                      [ngModel]="itemRetefuentePct()"
                      (ngModelChange)="itemRetefuentePct.set(+$event)"
                      data-testid="input-item-retefuente-ds"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">% ReteICA (Ej: 0.966)</label>
                    <input
                      type="number"
                      step="0.001"
                      class="form-control font-mono"
                      [ngModel]="itemReteicaPct()"
                      (ngModelChange)="itemReteicaPct.set(+$event)"
                      data-testid="input-item-reteica-ds"
                    />
                  </div>
                </div>
              </div>

              <!-- Resumen Financiero Calculado -->
              <div class="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1.5 font-mono text-xs">
                <div class="flex justify-between text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span class="font-semibold">\${{ subtotalCalculado() | number }}</span>
                </div>
                <div class="flex justify-between text-amber-700">
                  <span>Retefuente ({{ itemRetefuentePct() }}%):</span>
                  <span>- \${{ valorRetefuenteCalculado() | number }}</span>
                </div>
                <div class="flex justify-between text-amber-700">
                  <span>ReteICA ({{ itemReteicaPct() }}%):</span>
                  <span>- \${{ valorReteicaCalculado() | number }}</span>
                </div>
                <div class="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-indigo-200 text-sm">
                  <span>Total Neto a Pagar:</span>
                  <span class="text-indigo-700" data-testid="total-neto-calculado-ds">\${{ totalNetoCalculado() | number }} COP</span>
                </div>
              </div>

              <!-- Observaciones -->
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Notas u Observaciones Adicionales</label>
                <textarea
                  rows="2"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  placeholder="Información adicional del servicio o contrato escolar..."
                  [ngModel]="nuevoNotas()"
                  (ngModelChange)="nuevoNotas.set($event)"
                  data-testid="textarea-notas-ds"
                ></textarea>
              </div>
            </div>

            <div class="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                class="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                (click)="cerrarModalCrear()"
                data-testid="btn-cancelar-crear-ds"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                [disabled]="guardando()"
                (click)="guardarDocumentoSoporte()"
                data-testid="btn-confirmar-crear-ds"
              >
                @if (guardando()) {
                  <span class="animate-spin">⏳</span>
                  <span>Transmitiendo a DIAN...</span>
                } @else {
                  <span>📤</span>
                  <span>Emitir y Contabilizar</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: Detalle de Documento Soporte -->
      @if (modalDetalleVisible() && documentoSeleccionado()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" data-testid="modal-detalle-ds-backdrop" (click)="cerrarModalDetalle()">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()" data-testid="modal-detalle-ds">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">📄</span>
                <div>
                  <h3 class="font-bold text-slate-800 text-base" data-testid="modal-detalle-ds-title">
                    Detalle Documento Soporte {{ documentoSeleccionado()?.numeroDocumento }}
                  </h3>
                  <p class="text-[11px] text-slate-400">CUDS, XML UBL y comprobante de causación</p>
                </div>
              </div>
              <button
                type="button"
                class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                (click)="cerrarModalDetalle()"
                data-testid="btn-close-modal-detalle-ds"
              >
                ✕
              </button>
            </div>

            <div class="p-5 overflow-y-auto space-y-4 text-xs">
              <!-- Información Principal -->
              <div class="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span class="text-slate-400 block text-[10px]">Proveedor / Tercero:</span>
                  <strong class="text-slate-800">{{ documentoSeleccionado()?.tercero?.nombreCompleto || 'Proveedor' }}</strong>
                  <div class="text-[10px] text-slate-500 font-mono">Doc: {{ documentoSeleccionado()?.tercero?.numeroDocumento }}</div>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Fecha de Emisión:</span>
                  <strong class="text-slate-800">{{ documentoSeleccionado()?.fechaEmision }}</strong>
                  <div class="text-[10px] text-slate-500">Estado: {{ documentoSeleccionado()?.estadoDian }}</div>
                </div>
              </div>

              <!-- CUDS y QR -->
              <div class="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div class="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                  <span>🔐</span>
                  <span>Código Único de Documento Soporte (CUDS):</span>
                </div>
                <div class="bg-white p-2 rounded-lg border border-indigo-200 text-[10px] font-mono break-all text-slate-700" data-testid="modal-detalle-cuds">
                  {{ documentoSeleccionado()?.cuds || 'No generado' }}
                </div>
              </div>

              <!-- Desglose de Valores -->
              <div class="border border-slate-200 rounded-xl p-3.5 space-y-2 font-mono">
                <div class="flex justify-between text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span>\${{ documentoSeleccionado()?.subtotal | number }}</span>
                </div>
                <div class="flex justify-between text-amber-700">
                  <span>Retefuente Practicada:</span>
                  <span>- \${{ documentoSeleccionado()?.totalRetefuente | number }}</span>
                </div>
                <div class="flex justify-between text-amber-700">
                  <span>ReteICA Practicado:</span>
                  <span>- \${{ documentoSeleccionado()?.totalReteica | number }}</span>
                </div>
                <div class="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200 text-sm">
                  <span>Total Neto Pagado:</span>
                  <span class="text-indigo-700">\${{ documentoSeleccionado()?.totalPagar | number }} COP</span>
                </div>
              </div>

              <!-- Asiento Contable Vinculado -->
              @if (documentoSeleccionado()?.asientoId) {
                <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center justify-between">
                  <span>✓ Comprobante Contable CAU generado exitosamente</span>
                  <span class="font-mono font-bold text-[10px]">{{ documentoSeleccionado()?.asientoId }}</span>
                </div>
              }
            </div>

            <div class="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
              <button
                type="button"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                (click)="cerrarModalDetalle()"
                data-testid="btn-cerrar-detalle-ds"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: Anular Documento Soporte (Nota NDS) -->
      @if (modalAnularVisible() && documentoSeleccionado()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" data-testid="modal-anular-ds-backdrop" (click)="cerrarModalAnular()">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col" (click)="$event.stopPropagation()" data-testid="modal-anular-ds">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">🚫</span>
                <div>
                  <h3 class="font-bold text-slate-800 text-base" data-testid="modal-anular-ds-title">
                    Anular Documento Soporte
                  </h3>
                  <p class="text-[11px] text-slate-400">Emisión de Nota de Ajuste NDS ante la DIAN</p>
                </div>
              </div>
              <button
                type="button"
                class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                (click)="cerrarModalAnular()"
                data-testid="btn-close-modal-anular-ds"
              >
                ✕
              </button>
            </div>

            <div class="p-5 space-y-4 text-xs">
              <div class="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
                Está a punto de anular el Documento Soporte <strong>{{ documentoSeleccionado()?.numeroDocumento }}</strong>. Se transmitirá la Nota de Ajuste (NDS) a la DIAN y se reversará el comprobante contable de causación.
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Motivo de Anulación *</label>
                <textarea
                  rows="3"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  placeholder="Ingrese el motivo de anulación o desacuerdo comercial..."
                  [ngModel]="motivoAnulacion()"
                  (ngModelChange)="motivoAnulacion.set($event)"
                  data-testid="textarea-motivo-anulacion-ds"
                ></textarea>
              </div>
            </div>

            <div class="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                class="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                (click)="cerrarModalAnular()"
                data-testid="btn-cancelar-anular-ds"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                [disabled]="guardando()"
                (click)="confirmarAnulacion()"
                data-testid="btn-confirmar-anular-ds"
              >
                @if (guardando()) {
                  <span class="animate-spin">⏳</span>
                  <span>Transmitiendo Nota NDS...</span>
                } @else {
                  <span>Anular Documento</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContabilidadDocumentoSoporteComponent implements OnInit {
  private readonly service = inject(ContabilidadService);

  readonly documentos = signal<DocumentoSoporteModel[]>([]);
  readonly terceros = signal<Tercero[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);

  // Filtros
  readonly filtroFechaInicio = signal<string>('');
  readonly filtroFechaFin = signal<string>('');
  readonly filtroEstado = signal<string>('');
  readonly busqueda = signal<string>('');

  // Modales
  readonly modalCrearVisible = signal<boolean>(false);
  readonly modalDetalleVisible = signal<boolean>(false);
  readonly modalAnularVisible = signal<boolean>(false);
  readonly documentoSeleccionado = signal<DocumentoSoporteModel | null>(null);
  readonly errorModal = signal<string | null>(null);

  // Formulario Crear
  readonly nuevoTerceroId = signal<string>('');
  readonly nuevaFechaEmision = signal<string>(new Date().toISOString().split('T')[0]);
  readonly nuevaFechaVencimiento = signal<string>(new Date().toISOString().split('T')[0]);
  readonly nuevoMedioPago = signal<string>('10');
  readonly itemDescripcion = signal<string>('');
  readonly itemCantidad = signal<number>(1);
  readonly itemPrecioUnitario = signal<number>(0);
  readonly itemCuentaGasto = signal<string>('513505');
  readonly itemRetefuentePct = signal<number>(4.0);
  readonly itemReteicaPct = signal<number>(0.966);
  readonly nuevoNotas = signal<string>('');
  readonly motivoAnulacion = signal<string>('');

  // Cálculos reactivos
  readonly subtotalCalculado = computed(() => {
    return Math.round(this.itemCantidad() * this.itemPrecioUnitario() * 100) / 100;
  });

  readonly valorRetefuenteCalculado = computed(() => {
    return Math.round(this.subtotalCalculado() * (this.itemRetefuentePct() / 100) * 100) / 100;
  });

  readonly valorReteicaCalculado = computed(() => {
    return Math.round(this.subtotalCalculado() * (this.itemReteicaPct() / 100) * 100) / 100;
  });

  readonly totalNetoCalculado = computed(() => {
    const sub = this.subtotalCalculado();
    const ret = this.valorRetefuenteCalculado() + this.valorReteicaCalculado();
    return Math.max(0, sub - ret);
  });

  // KPIs
  readonly totalAceptados = computed(() => {
    return this.documentos().filter((d) => d.estadoDian === 'ACEPTADO').length;
  });

  readonly totalCausado = computed(() => {
    return this.documentos().reduce((acc, d) => acc + Number(d.subtotal || 0), 0);
  });

  readonly totalRetenciones = computed(() => {
    return this.documentos().reduce(
      (acc, d) => acc + Number(d.totalRetefuente || 0) + Number(d.totalReteica || 0),
      0,
    );
  });

  ngOnInit(): void {
    this.cargarDocumentos();
    this.cargarTerceros();
  }

  cargarDocumentos(): void {
    this.cargando.set(true);
    this.service
      .listarDocumentosSoporte({
        fechaInicio: this.filtroFechaInicio() || undefined,
        fechaFin: this.filtroFechaFin() || undefined,
        estado: this.filtroEstado() || undefined,
        search: this.busqueda() || undefined,
      })
      .subscribe({
        next: (docs) => {
          this.documentos.set(docs || []);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        },
      });
  }

  cargarTerceros(): void {
    this.service.getTerceros().subscribe({
      next: (t) => this.terceros.set(t || []),
      error: () => {},
    });
  }

  filtrar(): void {
    this.cargarDocumentos();
  }

  abrirModalCrear(): void {
    this.errorModal.set(null);
    this.itemDescripcion.set('');
    this.itemCantidad.set(1);
    this.itemPrecioUnitario.set(0);
    this.nuevoNotas.set('');
    this.cargarTerceros();
    this.modalCrearVisible.set(true);
  }

  cerrarModalCrear(): void {
    this.modalCrearVisible.set(false);
  }

  guardarDocumentoSoporte(): void {
    if (!this.nuevoTerceroId()) {
      this.errorModal.set('Debe seleccionar el tercero / proveedor no obligado a facturar.');
      return;
    }
    if (!this.itemDescripcion().trim()) {
      this.errorModal.set('Debe detallar la descripción del bien o servicio adquirido.');
      return;
    }
    if (this.itemPrecioUnitario() <= 0) {
      this.errorModal.set('El precio unitario debe ser mayor a cero.');
      return;
    }

    this.guardando.set(true);
    this.errorModal.set(null);

    const dto: CrearDocumentoSoporteModel = {
      terceroId: this.nuevoTerceroId(),
      fechaEmision: this.nuevaFechaEmision(),
      fechaVencimiento: this.nuevaFechaVencimiento(),
      medioPago: this.nuevoMedioPago(),
      metodoPago: '1',
      items: [
        {
          descripcion: this.itemDescripcion().trim(),
          cantidad: this.itemCantidad(),
          precioUnitario: this.itemPrecioUnitario(),
          porcentajeRetefuente: this.itemRetefuentePct(),
          porcentajeReteica: this.itemReteicaPct(),
          cuentaGastoCodigo: this.itemCuentaGasto(),
          centroCostoCodigo: 'CC-ADM',
        },
      ],
      notasAdicionales: this.nuevoNotas().trim() || undefined,
    };

    this.service.crearDocumentoSoporte(dto).subscribe({
      next: (doc) => {
        this.guardando.set(false);
        this.cerrarModalCrear();
        this.cargarDocumentos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorModal.set(err.error?.message || err.message || 'Error al emitir documento soporte.');
      },
    });
  }

  verDetalle(doc: DocumentoSoporteModel): void {
    this.documentoSeleccionado.set(doc);
    this.modalDetalleVisible.set(true);
  }

  cerrarModalDetalle(): void {
    this.modalDetalleVisible.set(false);
    this.documentoSeleccionado.set(null);
  }

  abrirModalAnular(doc: DocumentoSoporteModel): void {
    this.documentoSeleccionado.set(doc);
    this.motivoAnulacion.set('Anulación por error en causación o mutuo acuerdo');
    this.modalAnularVisible.set(true);
  }

  cerrarModalAnular(): void {
    this.modalAnularVisible.set(false);
    this.documentoSeleccionado.set(null);
  }

  confirmarAnulacion(): void {
    const doc = this.documentoSeleccionado();
    if (!doc) return;

    this.guardando.set(true);
    this.service.anularDocumentoSoporte(doc.id, this.motivoAnulacion().trim()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModalAnular();
        this.cargarDocumentos();
      },
      error: (err) => {
        this.guardando.set(false);
        alert(`Error al anular: ${err.error?.message || err.message}`);
      },
    });
  }

  sumarRetenciones(retefuente: any, reteica: any): number {
    return Number(retefuente || 0) + Number(reteica || 0);
  }
}
