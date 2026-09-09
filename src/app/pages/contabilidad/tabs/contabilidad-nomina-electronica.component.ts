import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import {
  NominaElectronicaModel,
  CrearNominaIndividualModel,
  Tercero,
} from '../models/contabilidad.models';

@Component({
  selector: 'app-contabilidad-nomina-electronica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .nomina-header-banner {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      border: 1.5px solid #e2e8f0;
      border-left: 5px solid #9333ea;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.03);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .nomina-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .nomina-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #faf5ff;
      border: 1.5px solid #e9d5ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }
    .nomina-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .nomina-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .nomina-title-text {
      font-size: 1.125rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .nomina-subtitle-text {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .nomina-actions-wrap {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }

    /* KPI Cards Grid & Widgets Estilo NIIF */
    .nomina-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .nomina-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .nomina-kpis-grid {
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
    <div class="tab-content space-y-4" data-testid="contabilidad-nomina-electronica-tab">
      <!-- Status Banner & Header Bar -->
      <div class="nomina-header-banner" data-testid="nomina-status-banner">
        <div class="nomina-header-main">
          <div class="nomina-icon-wrap">💼</div>
          <div class="nomina-texts-wrap">
            <div class="nomina-title-row">
              <h3 class="nomina-title-text" data-testid="title-nomina-electronica">
                Nómina Electrónica UBL DIAN
              </h3>
              <span class="badge-mini bg-purple-50 text-purple-700 border-purple-200">
                Res. DIAN 000013 / 000063
              </span>
            </div>
            <p class="nomina-subtitle-text">
              Documento soporte de pago de nómina individual y ajustes con CUNE, QR, devengados y deducciones de ley.
            </p>
          </div>
        </div>

        <div class="nomina-actions-wrap">
          <button
            type="button"
            class="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold shadow-sm"
            style="background: #9333ea; border-color: #7e22ce;"
            (click)="abrirModalIndividual()"
            data-testid="btn-nueva-nomina-individual"
          >
            <span>➕</span>
            <span>Nómina Individual</span>
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-sm flex items-center gap-1.5 font-semibold"
            (click)="abrirModalMasiva()"
            data-testid="btn-emision-masiva-nomina"
          >
            <span>⚡</span>
            <span>Emisión Masiva Mes</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards (Grid de 4 Columnas estilo NIIF Estandarizado) -->
      <div class="nomina-kpis-grid" data-testid="nomina-kpi-cards">
        <!-- KPI 1: Comprobantes Emitidos -->
        <div class="kpi-widget-card" data-testid="kpi-total-nominas">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title">Comprobantes Emitidos</span>
            <span class="text-purple-500 text-sm">📋</span>
          </div>
          <div class="kpi-widget-value text-slate-800" data-testid="kpi-total-nominas-val">
            {{ nominas().length }}
          </div>
          <div class="kpi-widget-footer">Nóminas transmitidas</div>
        </div>

        <!-- KPI 2: Validadas DIAN -->
        <div class="kpi-widget-card" style="border-color: #d1fae5; background: linear-gradient(135deg, rgba(209, 250, 229, 0.25) 0%, #ffffff 100%);" data-testid="kpi-total-aceptadas-nomina">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #047857;">Validadas DIAN</span>
            <span class="text-sm">✅</span>
          </div>
          <div class="kpi-widget-value" style="color: #047857;" data-testid="kpi-total-aceptadas-nomina-val">
            {{ totalAceptadas() }}
          </div>
          <div class="kpi-widget-footer" style="color: #059669;">Con CUNE validado</div>
        </div>

        <!-- KPI 3: Total Devengados -->
        <div class="kpi-widget-card" style="border-color: #dbeafe; background: linear-gradient(135deg, rgba(219, 234, 254, 0.25) 0%, #ffffff 100%);" data-testid="kpi-total-devengados">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #1d4ed8;">Total Devengados</span>
            <span class="text-sm">💵</span>
          </div>
          <div class="kpi-widget-value" style="color: #1d4ed8;" data-testid="kpi-total-devengados-val">
            \${{ totalDevengados() | number }}
          </div>
          <div class="kpi-widget-footer" style="color: #2563eb;">Sueldos + Auxilios</div>
        </div>

        <!-- KPI 4: Total Deducciones -->
        <div class="kpi-widget-card" style="border-color: #fee2e2; background: linear-gradient(135deg, rgba(254, 226, 226, 0.25) 0%, #ffffff 100%);" data-testid="kpi-total-deducciones">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #be123c;">Total Deducciones</span>
            <span class="text-sm">🛡️</span>
          </div>
          <div class="kpi-widget-value" style="color: #be123c;" data-testid="kpi-total-deducciones-val">
            \${{ totalDeducciones() | number }}
          </div>
          <div class="kpi-widget-footer" style="color: #e11d48;">Salud + Pensión Ley</div>
        </div>
      </div>

      <!-- Filtros y Búsqueda -->
      <div class="bg-white p-5 md:p-6 mb-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-4" data-testid="nomina-filters-bar">
        <div class="form-group-inline mb-0 w-[100px]">
          <label class="form-label-sm">Año</label>
          <input
            type="number"
            class="input-base input-sm w-full font-mono font-semibold"
            [ngModel]="filtroAnio()"
            (ngModelChange)="filtroAnio.set(+$event); filtrar()"
            data-testid="filtro-anio-nomina"
          />
        </div>

        <div class="form-group-inline mb-0 w-[150px]">
          <label class="form-label-sm">Mes</label>
          <select
            class="input-base input-sm w-full"
            [ngModel]="filtroMes()"
            (ngModelChange)="filtroMes.set(+$event); filtrar()"
            data-testid="filtro-mes-nomina"
          >
            <option [value]="0">Todos los meses</option>
            <option [value]="1">Enero</option>
            <option [value]="2">Febrero</option>
            <option [value]="3">Marzo</option>
            <option [value]="4">Abril</option>
            <option [value]="5">Mayo</option>
            <option [value]="6">Junio</option>
            <option [value]="7">Julio</option>
            <option [value]="8">Agosto</option>
            <option [value]="9">Septiembre</option>
            <option [value]="10">Octubre</option>
            <option [value]="11">Noviembre</option>
            <option [value]="12">Diciembre</option>
          </select>
        </div>

        <div class="form-group-inline mb-0 w-[170px]">
          <label class="form-label-sm">Estado</label>
          <select
            class="input-base input-sm w-full"
            [ngModel]="filtroEstado()"
            (ngModelChange)="filtroEstado.set($event); filtrar()"
            data-testid="filtro-estado-nomina"
          >
            <option value="">Todos los estados</option>
            <option value="ACEPTADO">Aceptado DIAN</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </div>

        <div class="form-group-inline mb-0 min-w-[340px] flex-1">
          <label class="form-label-sm">Buscar colaborador o documento</label>
          <input
            type="text"
            class="input-base input-sm w-full"
            placeholder="🔍 Buscar por colaborador o documento de identidad..."
            [ngModel]="busqueda()"
            (ngModelChange)="busqueda.set($event); filtrar()"
            data-testid="input-busqueda-nomina"
          />
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn-secondary btn-sm h-[38px] px-4 flex items-center gap-1.5"
            (click)="cargarNominas()"
            data-testid="btn-recargar-nomina"
          >
            <span>🔄</span>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Tabla de Nóminas Electrónicas -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs" data-testid="tabla-nominas-electronicas">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th class="py-3 px-4">Número / Prefijo</th>
                <th class="py-3 px-4">Periodo</th>
                <th class="py-3 px-4">Empleado / Docente</th>
                <th class="py-3 px-4 text-right">Devengados</th>
                <th class="py-3 px-4 text-right">Deducciones</th>
                <th class="py-3 px-4 text-right">Neto Pagado</th>
                <th class="py-3 px-4 text-center">Estado DIAN</th>
                <th class="py-3 px-4 text-center">CUNE</th>
                <th class="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (cargando()) {
                <tr>
                  <td colspan="9" class="py-8 text-center text-slate-400">
                    <span class="inline-block animate-spin mr-2">⏳</span> Cargando nóminas electrónicas...
                  </td>
                </tr>
              } @else if (nominas().length === 0) {
                <tr>
                  <td colspan="9" class="py-8 text-center text-slate-400" data-testid="sin-nominas-electronicas">
                    No se encontraron nóminas electrónicas registradas para los filtros seleccionados.
                  </td>
                </tr>
              } @else {
                @for (nom of nominas(); track nom.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors" [attr.data-testid]="'row-ne-' + nom.numeroNomina">
                    <td class="py-3 px-4 font-mono font-semibold text-purple-700">
                      {{ nom.numeroNomina }}
                    </td>
                    <td class="py-3 px-4 text-slate-600">
                      {{ getNombreMes(nom.periodoMes) }} {{ nom.periodoAnio }}
                    </td>
                    <td class="py-3 px-4">
                      <div class="font-medium text-slate-800">
                        {{ nom.terceroEmpleado?.nombreCompleto || 'Docente / Colaborador' }}
                      </div>
                      <div class="text-[10px] text-slate-400 font-mono">
                        Doc: {{ nom.terceroEmpleado?.numeroDocumento || 'N/A' }}
                      </div>
                    </td>
                    <td class="py-3 px-4 text-right font-mono font-medium text-blue-700">
                      \${{ nom.totalDevengado | number }}
                    </td>
                    <td class="py-3 px-4 text-right font-mono text-rose-700 font-medium">
                      \${{ nom.totalDeducciones | number }}
                    </td>
                    <td class="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      \${{ nom.totalComprobante | number }}
                    </td>
                    <td class="py-3 px-4 text-center">
                      @if (nom.estadoDian === 'ACEPTADO') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Aceptado DIAN
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {{ nom.estadoDian }}
                        </span>
                      }
                    </td>
                    <td class="py-3 px-4 text-center">
                      @if (nom.cune) {
                        <span class="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded" [title]="nom.cune">
                          {{ nom.cune.substring(0, 10) }}...
                        </span>
                      } @else {
                        <span class="text-slate-300">-</span>
                      }
                    </td>
                    <td class="py-3 px-4 text-center">
                      <button
                        type="button"
                        class="p-1 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                        title="Ver Detalle / CUNE / Devengados"
                        (click)="verDetalle(nom)"
                        [attr.data-testid]="'btn-detalle-ne-' + nom.numeroNomina"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: Crear Nómina Individual -->
      @if (modalIndividualVisible()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" data-testid="modal-crear-ne-backdrop" (click)="cerrarModalIndividual()">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()" data-testid="modal-crear-ne">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">💼</span>
                <div>
                  <h3 class="font-bold text-slate-800 text-base" data-testid="modal-crear-ne-title">
                    Emitir Nómina Electrónica Individual
                  </h3>
                  <p class="text-[11px] text-slate-400">Generación y transmisión con CUNE UBL a la DIAN</p>
                </div>
              </div>
              <button
                type="button"
                class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                (click)="cerrarModalIndividual()"
                data-testid="btn-close-modal-crear-ne"
              >
                ✕
              </button>
            </div>

            <div class="p-5 overflow-y-auto space-y-4 text-xs">
              @if (errorModal()) {
                <div class="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs" data-testid="alert-error-crear-ne">
                  ⚠️ {{ errorModal() }}
                </div>
              }

              <!-- Colaborador / Empleado -->
              <div class="form-group">
                <label class="form-label">Empleado / Docente Institucional *</label>
                <select
                  class="form-control"
                  [ngModel]="nuevoEmpleadoId()"
                  (ngModelChange)="nuevoEmpleadoId.set($event)"
                  data-testid="select-empleado-crear-ne"
                >
                  <option value="">-- Seleccionar Colaborador --</option>
                  @for (t of empleados(); track t.id) {
                    <option [value]="t.id">
                      {{ t.nombreCompleto || t.razonSocial }} ({{ t.tipoDocumento || t.tipoIdentificacion || 'CC' }}: {{ t.numeroDocumento || t.numeroIdentificacion }})
                    </option>
                  }
                </select>
              </div>

              <!-- Periodo y Días -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="form-group">
                  <label class="form-label">Año Fiscal *</label>
                  <input
                    type="number"
                    class="form-control font-mono font-semibold"
                    [ngModel]="nuevoAnio()"
                    (ngModelChange)="nuevoAnio.set(+$event)"
                    data-testid="input-anio-ne"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Mes Liquidado *</label>
                  <select
                    class="form-control"
                    [ngModel]="nuevoMes()"
                    (ngModelChange)="nuevoMes.set(+$event)"
                    data-testid="select-mes-ne"
                  >
                    <option [value]="1">Enero</option>
                    <option [value]="2">Febrero</option>
                    <option [value]="3">Marzo</option>
                    <option [value]="4">Abril</option>
                    <option [value]="5">Mayo</option>
                    <option [value]="6">Junio</option>
                    <option [value]="7">Julio</option>
                    <option [value]="8">Agosto</option>
                    <option [value]="9">Septiembre</option>
                    <option [value]="10">Octubre</option>
                    <option [value]="11">Noviembre</option>
                    <option [value]="12">Diciembre</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Días Trabajados</label>
                  <input
                    type="number"
                    class="form-control font-mono"
                    [ngModel]="nuevoDias()"
                    (ngModelChange)="nuevoDias.set(+$event)"
                    data-testid="input-dias-ne"
                  />
                </div>
              </div>

              <!-- Sueldo Básico y Conceptos -->
              <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div class="form-group">
                  <label class="form-label">Sueldo Básico Mensual (COP) *</label>
                  <input
                    type="number"
                    class="form-control font-mono font-bold text-slate-800"
                    placeholder="3200000"
                    [ngModel]="nuevoSueldoBasico()"
                    (ngModelChange)="nuevoSueldoBasico.set(+$event)"
                    data-testid="input-sueldo-basico-ne"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="form-group">
                    <label class="form-label">Auxilio de Transporte (COP)</label>
                    <input
                      type="number"
                      class="form-control font-mono"
                      [ngModel]="nuevoAuxTransporte()"
                      (ngModelChange)="nuevoAuxTransporte.set(+$event)"
                      data-testid="input-aux-transporte-ne"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Otros Devengados / Bonos (COP)</label>
                    <input
                      type="number"
                      class="form-control font-mono"
                      [ngModel]="nuevoOtrosDevengados()"
                      (ngModelChange)="nuevoOtrosDevengados.set(+$event)"
                      data-testid="input-otros-devengados-ne"
                    />
                  </div>
                </div>

                <!-- Deducciones automáticas -->
                <div class="p-2.5 bg-rose-50/50 border border-rose-100 rounded-lg text-xs space-y-1 font-mono">
                  <div class="flex justify-between text-rose-800">
                    <span>Aporte Salud (4% de Ley):</span>
                    <span>- \${{ deduccionSaludCalculada() | number }}</span>
                  </div>
                  <div class="flex justify-between text-rose-800">
                    <span>Aporte Pensión (4% de Ley):</span>
                    <span>- \${{ deduccionPensionCalculada() | number }}</span>
                  </div>
                </div>
              </div>

              <!-- Resumen Total Nómina -->
              <div class="p-3.5 bg-purple-50/60 border border-purple-100 rounded-xl space-y-1.5 font-mono text-xs">
                <div class="flex justify-between text-slate-700">
                  <span>Total Devengado (Básico + Auxilios):</span>
                  <span class="font-semibold text-blue-700">\${{ totalDevengadoCalculado() | number }}</span>
                </div>
                <div class="flex justify-between text-rose-700">
                  <span>Total Deducciones de Ley:</span>
                  <span>- \${{ totalDeduccionCalculada() | number }}</span>
                </div>
                <div class="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-purple-200 text-sm">
                  <span>Total Comprobante Nómina a Pagar:</span>
                  <span class="text-purple-700" data-testid="total-neto-calculado-ne">\${{ totalNetoNominaCalculado() | number }} COP</span>
                </div>
              </div>
            </div>

            <div class="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                class="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                (click)="cerrarModalIndividual()"
                data-testid="btn-cancelar-crear-ne"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                [disabled]="guardando()"
                (click)="guardarNominaIndividual()"
                data-testid="btn-confirmar-crear-ne"
              >
                @if (guardando()) {
                  <span class="animate-spin">⏳</span>
                  <span>Firmando y Transmitiendo UBL...</span>
                } @else {
                  <span>📤</span>
                  <span>Emitir Nómina Electrónica</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: Emisión Masiva del Periodo -->
      @if (modalMasivaVisible()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" data-testid="modal-masiva-ne-backdrop" (click)="cerrarModalMasiva()">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col" (click)="$event.stopPropagation()" data-testid="modal-masiva-ne">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">⚡</span>
                <div>
                  <h3 class="font-bold text-slate-800 text-base" data-testid="modal-masiva-ne-title">
                    Emisión Masiva de Nómina
                  </h3>
                  <p class="text-[11px] text-slate-400">Transmisión mensual de todo el personal escolar</p>
                </div>
              </div>
              <button
                type="button"
                class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                (click)="cerrarModalMasiva()"
                data-testid="btn-close-modal-masiva-ne"
              >
                ✕
              </button>
            </div>

            <div class="p-5 space-y-4 text-xs">
              <div class="p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl">
                Se generará y transmitirá el documento de nómina electrónica individual con CUNE para cada colaborador institucional del mes seleccionado.
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label">Año Fiscal</label>
                  <input
                    type="number"
                    class="form-control font-mono font-semibold"
                    [ngModel]="masivaAnio()"
                    (ngModelChange)="masivaAnio.set(+$event)"
                    data-testid="input-masiva-anio"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Mes a Transmitir</label>
                  <select
                    class="form-control"
                    [ngModel]="masivaMes()"
                    (ngModelChange)="masivaMes.set(+$event)"
                    data-testid="select-masiva-mes"
                  >
                    <option [value]="1">Enero</option>
                    <option [value]="2">Febrero</option>
                    <option [value]="3">Marzo</option>
                    <option [value]="4">Abril</option>
                    <option [value]="5">Mayo</option>
                    <option [value]="6">Junio</option>
                    <option [value]="7">Julio</option>
                    <option [value]="8">Agosto</option>
                    <option [value]="9">Septiembre</option>
                    <option [value]="10">Octubre</option>
                    <option [value]="11">Noviembre</option>
                    <option [value]="12">Diciembre</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                class="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                (click)="cerrarModalMasiva()"
                data-testid="btn-cancelar-masiva-ne"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                [disabled]="guardando()"
                (click)="ejecutarEmisionMasiva()"
                data-testid="btn-confirmar-masiva-ne"
              >
                @if (guardando()) {
                  <span class="animate-spin">⏳</span>
                  <span>Transmitiendo Masivamente...</span>
                } @else {
                  <span>⚡ Iniciar Emisión Masiva</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: Detalle de Nómina Electrónica -->
      @if (modalDetalleVisible() && nominaSeleccionada()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" data-testid="modal-detalle-ne-backdrop" (click)="cerrarModalDetalle()">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()" data-testid="modal-detalle-ne">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">💼</span>
                <div>
                  <h3 class="font-bold text-slate-800 text-base" data-testid="modal-detalle-ne-title">
                    Comprobante {{ nominaSeleccionada()?.numeroNomina }}
                  </h3>
                  <p class="text-[11px] text-slate-400">CUNE, devengados, deducciones y validación DIAN</p>
                </div>
              </div>
              <button
                type="button"
                class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                (click)="cerrarModalDetalle()"
                data-testid="btn-close-modal-detalle-ne"
              >
                ✕
              </button>
            </div>

            <div class="p-5 overflow-y-auto space-y-4 text-xs">
              <!-- Información Principal -->
              <div class="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span class="text-slate-400 block text-[10px]">Empleado / Colaborador:</span>
                  <strong class="text-slate-800">{{ nominaSeleccionada()?.terceroEmpleado?.nombreCompleto || 'Empleado' }}</strong>
                  <div class="text-[10px] text-slate-500 font-mono">Doc: {{ nominaSeleccionada()?.terceroEmpleado?.numeroDocumento }}</div>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Periodo de Nómina:</span>
                  <strong class="text-slate-800">{{ getNombreMes(nominaSeleccionada()?.periodoMes || 1) }} {{ nominaSeleccionada()?.periodoAnio }}</strong>
                  <div class="text-[10px] text-slate-500">Días: {{ nominaSeleccionada()?.diasTrabajados }} días</div>
                </div>
              </div>

              <!-- CUNE y QR -->
              <div class="p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2">
                <div class="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                  <span>🔐</span>
                  <span>Código Único de Nómina Electrónica (CUNE):</span>
                </div>
                <div class="bg-white p-2 rounded-lg border border-purple-200 text-[10px] font-mono break-all text-slate-700" data-testid="modal-detalle-cune">
                  {{ nominaSeleccionada()?.cune || 'No generado' }}
                </div>
              </div>

              <!-- Desglose Financiero -->
              <div class="border border-slate-200 rounded-xl p-3.5 space-y-2 font-mono">
                <div class="flex justify-between text-slate-600">
                  <span>Sueldo Básico:</span>
                  <span>\${{ nominaSeleccionada()?.sueldoBasico | number }}</span>
                </div>
                <div class="flex justify-between text-blue-700">
                  <span>Total Devengado:</span>
                  <span class="font-bold">\${{ nominaSeleccionada()?.totalDevengado | number }}</span>
                </div>
                <div class="flex justify-between text-rose-700">
                  <span>Total Deducciones de Ley:</span>
                  <span>- \${{ nominaSeleccionada()?.totalDeducciones | number }}</span>
                </div>
                <div class="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200 text-sm">
                  <span>Total Neto Pagado:</span>
                  <span class="text-purple-700">\${{ nominaSeleccionada()?.totalComprobante | number }} COP</span>
                </div>
              </div>
            </div>

            <div class="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
              <button
                type="button"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                (click)="cerrarModalDetalle()"
                data-testid="btn-cerrar-detalle-ne"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContabilidadNominaElectronicaComponent implements OnInit {
  private readonly service = inject(ContabilidadService);

  readonly nominas = signal<NominaElectronicaModel[]>([]);
  readonly empleados = signal<Tercero[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);

  // Filtros
  readonly filtroAnio = signal<number>(new Date().getFullYear());
  readonly filtroMes = signal<number>(0);
  readonly filtroEstado = signal<string>('');
  readonly busqueda = signal<string>('');

  // Modales
  readonly modalIndividualVisible = signal<boolean>(false);
  readonly modalMasivaVisible = signal<boolean>(false);
  readonly modalDetalleVisible = signal<boolean>(false);
  readonly nominaSeleccionada = signal<NominaElectronicaModel | null>(null);
  readonly errorModal = signal<string | null>(null);

  // Formulario Individual
  readonly nuevoEmpleadoId = signal<string>('');
  readonly nuevoAnio = signal<number>(new Date().getFullYear());
  readonly nuevoMes = signal<number>(new Date().getMonth() + 1);
  readonly nuevoDias = signal<number>(30);
  readonly nuevoSueldoBasico = signal<number>(3200000);
  readonly nuevoAuxTransporte = signal<number>(162000);
  readonly nuevoOtrosDevengados = signal<number>(0);

  // Formulario Masiva
  readonly masivaAnio = signal<number>(new Date().getFullYear());
  readonly masivaMes = signal<number>(new Date().getMonth() + 1);

  // Cálculos reactivos
  readonly deduccionSaludCalculada = computed(() => {
    return Math.round(this.nuevoSueldoBasico() * 0.04);
  });

  readonly deduccionPensionCalculada = computed(() => {
    return Math.round(this.nuevoSueldoBasico() * 0.04);
  });

  readonly totalDevengadoCalculado = computed(() => {
    return this.nuevoSueldoBasico() + this.nuevoAuxTransporte() + this.nuevoOtrosDevengados();
  });

  readonly totalDeduccionCalculada = computed(() => {
    return this.deduccionSaludCalculada() + this.deduccionPensionCalculada();
  });

  readonly totalNetoNominaCalculado = computed(() => {
    return Math.max(0, this.totalDevengadoCalculado() - this.totalDeduccionCalculada());
  });

  // KPIs
  readonly totalAceptadas = computed(() => {
    return this.nominas().filter((n) => n.estadoDian === 'ACEPTADO').length;
  });

  readonly totalDevengados = computed(() => {
    return this.nominas().reduce((acc, n) => acc + Number(n.totalDevengado || 0), 0);
  });

  readonly totalDeducciones = computed(() => {
    return this.nominas().reduce((acc, n) => acc + Number(n.totalDeducciones || 0), 0);
  });

  ngOnInit(): void {
    this.cargarNominas();
    this.cargarEmpleados();
  }

  cargarNominas(): void {
    this.cargando.set(true);
    this.service
      .listarNominasElectronicas({
        anio: this.filtroAnio() || undefined,
        mes: this.filtroMes() > 0 ? this.filtroMes() : undefined,
        estado: this.filtroEstado() || undefined,
        search: this.busqueda() || undefined,
      })
      .subscribe({
        next: (list) => {
          this.nominas.set(list || []);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        },
      });
  }

  cargarEmpleados(): void {
    this.service.getTerceros().subscribe({
      next: (list) => {
        this.empleados.set(list || []);
      },
      error: () => {},
    });
  }

  filtrar(): void {
    this.cargarNominas();
  }

  getNombreMes(mes: number): string {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return meses[mes - 1] || `Mes ${mes}`;
  }

  abrirModalIndividual(): void {
    this.errorModal.set(null);
    this.cargarEmpleados();
    this.modalIndividualVisible.set(true);
  }

  cerrarModalIndividual(): void {
    this.modalIndividualVisible.set(false);
  }

  guardarNominaIndividual(): void {
    if (!this.nuevoEmpleadoId()) {
      this.errorModal.set('Debe seleccionar el colaborador / empleado.');
      return;
    }
    if (this.nuevoSueldoBasico() <= 0) {
      this.errorModal.set('El sueldo básico debe ser mayor a cero.');
      return;
    }

    this.guardando.set(true);
    this.errorModal.set(null);

    const devengados = [];
    if (this.nuevoAuxTransporte() > 0) {
      devengados.push({
        conceptoCodigo: 'AUX_TRANSPORTE',
        descripcion: 'Auxilio de Transporte de Ley',
        valor: this.nuevoAuxTransporte(),
      });
    }
    if (this.nuevoOtrosDevengados() > 0) {
      devengados.push({
        conceptoCodigo: 'OTROS_DEVENGADOS',
        descripcion: 'Bonificación o devengado adicional',
        valor: this.nuevoOtrosDevengados(),
      });
    }

    const deducciones = [
      {
        conceptoCodigo: 'SALUD',
        descripcion: 'Aporte Salud Empleado (4%)',
        porcentaje: 4.0,
        valor: this.deduccionSaludCalculada(),
      },
      {
        conceptoCodigo: 'PENSION',
        descripcion: 'Aporte Pensión Empleado (4%)',
        porcentaje: 4.0,
        valor: this.deduccionPensionCalculada(),
      },
    ];

    const dto: CrearNominaIndividualModel = {
      terceroEmpleadoId: this.nuevoEmpleadoId(),
      periodoAnio: this.nuevoAnio(),
      periodoMes: this.nuevoMes(),
      diasTrabajados: this.nuevoDias(),
      sueldoBasico: this.nuevoSueldoBasico(),
      devengados,
      deducciones,
    };

    this.service.crearNominaIndividual(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModalIndividual();
        this.cargarNominas();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorModal.set(err.error?.message || err.message || 'Error al emitir nómina electrónica.');
      },
    });
  }

  abrirModalMasiva(): void {
    this.modalMasivaVisible.set(true);
  }

  cerrarModalMasiva(): void {
    this.modalMasivaVisible.set(false);
  }

  ejecutarEmisionMasiva(): void {
    this.guardando.set(true);
    this.service
      .generarNominaMasiva({
        anio: this.masivaAnio(),
        mes: this.masivaMes(),
      })
      .subscribe({
        next: (res) => {
          this.guardando.set(false);
          this.cerrarModalMasiva();
          this.cargarNominas();
        },
        error: (err) => {
          this.guardando.set(false);
          alert(`Error en emisión masiva: ${err.error?.message || err.message}`);
        },
      });
  }

  verDetalle(nom: NominaElectronicaModel): void {
    this.nominaSeleccionada.set(nom);
    this.modalDetalleVisible.set(true);
  }

  cerrarModalDetalle(): void {
    this.modalDetalleVisible.set(false);
    this.nominaSeleccionada.set(null);
  }
}
