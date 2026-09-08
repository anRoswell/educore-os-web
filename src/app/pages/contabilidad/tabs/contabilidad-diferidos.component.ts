import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';
import { ContabilidadService } from '../services/contabilidad.service';
import { IngresoDiferidoModel, AmortizacionCuotaModel } from '../models/contabilidad.models';

@Component({
  selector: 'app-contabilidad-diferidos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective],
  styles: [`
    .diferidos-header-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .diferidos-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .diferidos-icon-wrap {
      font-size: 1.75rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .diferidos-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .diferidos-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .diferidos-title-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .diferidos-subtitle-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .diferidos-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .diferidos-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .diferidos-kpis-grid {
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
    .kpi-progress-bar {
      width: 100%;
      height: 6px;
      background-color: #e2e8f0;
      border-radius: 9999px;
      margin-top: 0.5rem;
      overflow: hidden;
    }
    .kpi-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #4f46e5);
      border-radius: 9999px;
      transition: width 0.4s ease-out;
    }
  `],
  template: `
    <div class="tab-content" data-testid="tab-content-diferidos">
      <!-- Encabezado y Acciones -->
      <div class="diferidos-header-banner">
        <div class="diferidos-header-main">
          <div class="diferidos-icon-wrap">⏳</div>
          <div class="diferidos-texts-wrap">
            <div class="diferidos-title-row">
              <h3 class="diferidos-title-text" data-testid="diferidos-titulo">
                Ingresos Diferidos por Matrículas (NIIF 15)
              </h3>
              <span class="badge-mini bg-indigo-100 text-indigo-800 border-indigo-200">
                Pasivos Diferidos 270505
              </span>
            </div>
            <p class="diferidos-subtitle-text">
              Amortización mensual lineal del servicio educativo prestado a lo largo del año lectivo (10 cuotas).
            </p>
          </div>
        </div>

        <div class="flex items-end gap-2.5 flex-wrap">
          <div class="form-group-inline">
            <label class="form-label-sm">Año Lectivo</label>
            <select
              class="input-base input-sm w-select-year"
              data-testid="select-anio-diferidos"
              [ngModel]="anioSeleccionado()"
              (ngModelChange)="onAnioChange($event)"
            >
              @for (a of aniosDisponibles; track a) {
                <option [value]="a">{{ a }}</option>
              }
            </select>
          </div>

          <div class="form-group-inline">
            <label class="form-label-sm">Mes a Amortizar</label>
            <select
              class="input-base input-sm"
              data-testid="select-mes-amortizar"
              [ngModel]="mesAmortizar()"
              (ngModelChange)="mesAmortizar.set(+$event)"
            >
              @for (m of mesesDisponibles; track m.num) {
                <option [value]="m.num">{{ m.nombre }}</option>
              }
            </select>
          </div>

          <button
            type="button"
            class="btn-primary btn-sm flex items-center gap-1"
            data-testid="btn-amortizar-mes"
            [disabled]="procesando()"
            (click)="ejecutarAmortizacionMes()"
          >
            <span>⚡</span>
            <span>{{ procesando() ? 'Amortizando...' : 'Amortizar Mes Seleccionado' }}</span>
          </button>

          <button
            type="button"
            class="btn-secondary btn-sm"
            data-testid="btn-nuevo-diferido"
            (click)="abrirModalNuevo()"
          >
            + Nuevo Contrato NIIF 15
          </button>
        </div>
      </div>

      <!-- Banner de Alerta / Mensaje -->
      @if (mensajeExito()) {
        <div class="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg flex items-center justify-between" data-testid="alerta-exito-diferidos">
          <div class="flex items-center gap-2">
            <span>✅</span>
            <span>{{ mensajeExito() }}</span>
          </div>
          <button type="button" class="text-green-700 font-bold hover:text-green-900" (click)="mensajeExito.set('')">✕</button>
        </div>
      }

      @if (errorMensaje()) {
        <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between" data-testid="alerta-error-diferidos">
          <div class="flex items-center gap-2">
            <span>⚠️</span>
            <span>{{ errorMensaje() }}</span>
          </div>
          <button type="button" class="text-red-600 font-bold hover:text-red-800" (click)="errorMensaje.set('')">✕</button>
        </div>
      }

      <!-- KPI Summary Cards (Grid de 4 Columnas) -->
      <div class="diferidos-kpis-grid" data-testid="diferidos-kpis">
        <div class="kpi-widget-card">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title">Total Pasivo Diferido (270505)</span>
            <span class="text-sm">📜</span>
          </div>
          <div class="kpi-widget-value text-slate-800" data-testid="kpi-total-diferido">
            \${{ totalDiferido() | number:'1.0-0' }}
          </div>
          <div class="kpi-widget-footer">Matrículas contratadas vigencia</div>
        </div>

        <div class="kpi-widget-card" style="border-color: #d1fae5; background: linear-gradient(135deg, rgba(209, 250, 229, 0.25) 0%, #ffffff 100%);">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #047857;">Ingresos Reconocidos (416005)</span>
            <span class="text-sm">📈</span>
          </div>
          <div class="kpi-widget-value" style="color: #047857;" data-testid="kpi-total-amortizado">
            \${{ totalAmortizado() | number:'1.0-0' }}
          </div>
          <div class="kpi-widget-footer" style="color: #059669;">Causado proporcionalmente NIIF</div>
        </div>

        <div class="kpi-widget-card" style="border-color: #fef3c7; background: linear-gradient(135deg, rgba(254, 243, 199, 0.25) 0%, #ffffff 100%);">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #b45309;">Saldo por Devengar</span>
            <span class="text-sm">⏳</span>
          </div>
          <div class="kpi-widget-value" style="color: #b45309;" data-testid="kpi-total-pendiente">
            \${{ totalPendiente() | number:'1.0-0' }}
          </div>
          <div class="kpi-widget-footer" style="color: #d97706;">Pendiente en vigencia</div>
        </div>

        <div class="kpi-widget-card" style="border-color: #e0e7ff; background: linear-gradient(135deg, rgba(224, 231, 255, 0.25) 0%, #ffffff 100%);">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #4338ca;">Avance de Reconocimiento</span>
            <span class="text-sm">🎯</span>
          </div>
          <div class="kpi-widget-value" style="color: #4338ca;" data-testid="kpi-porcentaje-avance">
            {{ porcentajeAvance() | number:'1.1-1' }}%
          </div>
          <div class="kpi-progress-bar">
            <div
              class="kpi-progress-fill"
              [style.width.%]="porcentajeAvance()"
            ></div>
          </div>
          <div class="kpi-widget-footer" style="color: #6366f1;">Progreso de causación lineal</div>
        </div>
      </div>

      <!-- Tabla Principal de Ingresos Diferidos -->
      @if (cargando()) {
        <div class="flex justify-center py-10" data-testid="diferidos-loading-spinner">
          <div class="spinner"></div>
        </div>
      } @else {
        <div class="tabla-base overflow-auto" data-testid="tabla-diferidos-container">
          <table class="tabla-datos w-full text-xs" data-testid="tabla-diferidos">
            <thead>
              <tr>
                <th class="py-2.5 px-3">Estudiante / Matrícula</th>
                <th class="py-2.5 px-3">Concepto Contable</th>
                <th class="text-right py-2.5 px-3">Valor Total</th>
                <th class="text-center py-2.5 px-3">Cuotas (Amort/Pact)</th>
                <th class="text-right py-2.5 px-3">Saldo Pasivo</th>
                <th class="text-center py-2.5 px-3">Estado</th>
                <th class="text-center w-28 py-2.5 px-3">Progreso</th>
                <th class="text-center w-24 py-2.5 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (item of ingresos(); track item.id) {
                <tr class="border-b hover:bg-gray-50/50" [attr.data-testid]="'row-diferido-' + item.id">
                  <td class="py-2.5 px-3">
                    <div class="font-semibold text-gray-800">{{ item.estudianteNombre || 'Estudiante Institucional' }}</div>
                    <div class="text-[10px] text-gray-400 font-mono">{{ item.id | slice:0:8 }}</div>
                  </td>
                  <td class="py-2.5 px-3 text-gray-700">{{ item.concepto }}</td>
                  <td class="py-2.5 px-3 text-right font-mono font-semibold text-gray-800">
                    \${{ item.valorTotal | number:'1.0-0' }}
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono">
                    <span class="font-bold text-indigo-700">{{ item.cuotasAmortizadas }}</span> / {{ item.cuotasPactadas }}
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono font-medium text-amber-700">
                    \${{ item.saldoPendiente | number:'1.0-0' }}
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span [class]="badgeEstado(item.estado)">{{ item.estado }}</span>
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <div class="flex items-center gap-1.5 justify-center">
                      <div class="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          class="bg-indigo-600 h-1.5 rounded-full"
                          [style.width.%]="(item.cuotasAmortizadas / item.cuotasPactadas) * 100"
                        ></div>
                      </div>
                      <span class="text-[10px] text-gray-500 font-mono">
                        {{ ((item.cuotasAmortizadas / item.cuotasPactadas) * 100) | number:'1.0-0' }}%
                      </span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      class="btn-icon text-indigo-600 hover:text-indigo-800 text-xs px-2 py-1 rounded bg-indigo-50 border border-indigo-100"
                      title="Ver cronograma de cuotas"
                      [attr.data-testid]="'btn-ver-cuotas-' + item.id"
                      (click)="verCuotas(item)"
                    >
                      📋 Cuotas
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center py-8 text-gray-400 text-xs" data-testid="sin-diferidos">
                    No se registraron ingresos diferidos para la vigencia {{ anioSeleccionado() }}.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal de Cronograma de Cuotas -->
      @if (cuotasModalVisible() && diferidoSeleccionado()) {
        <div class="modal-backdrop" data-testid="modal-cuotas-backdrop" (click)="cerrarModalCuotas()">
          <div class="modal-box w-[650px]" data-testid="modal-cuotas" style="max-width: 680px; width: 100%; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);" (click)="$event.stopPropagation()">
            <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100" style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 0.85rem; border-bottom: 1.5px solid #f1f5f9;">
              <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 text-lg shadow-xs" style="width: 42px; height: 42px; border-radius: 12px; background: #e0e7ff; border: 1.5px solid #c7d2fe; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                  📅
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-cuotas-title" style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #1e293b; letter-spacing: -0.015em;">
                      Cronograma de Amortización Mensual (NIIF 15)
                    </h3>
                    <span class="badge-mini badge-blue" style="font-size: 0.65rem;">Amortización</span>
                  </div>
                  <span class="text-xs text-slate-400 block" style="font-size: 0.75rem; color: #64748b; margin-top: 2px; display: block;">
                    {{ diferidoSeleccionado()!.concepto }} — {{ diferidoSeleccionado()!.estudianteNombre || 'Estudiante Institucional' }}
                  </span>
                </div>
              </div>
              <button
                type="button"
                style="width: 32px; height: 32px; border-radius: 8px; border: none; background: #f1f5f9; color: #64748b; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                (click)="cerrarModalCuotas()"
              >
                ✕
              </button>
            </div>

            <div class="modal-body space-y-4 pt-3">
              <div class="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded border text-xs">
                <div>
                  <span class="text-gray-400 block">Total Contratado</span>
                  <strong class="text-gray-800 font-mono">\${{ diferidoSeleccionado()!.valorTotal | number:'1.0-0' }}</strong>
                </div>
                <div>
                  <span class="text-gray-400 block">Amortizado</span>
                  <strong class="text-green-700 font-mono">
                    \${{ (diferidoSeleccionado()!.valorTotal - diferidoSeleccionado()!.saldoPendiente) | number:'1.0-0' }}
                  </strong>
                </div>
                <div>
                  <span class="text-gray-400 block">Saldo en Pasivo (270505)</span>
                  <strong class="text-amber-700 font-mono">\${{ diferidoSeleccionado()!.saldoPendiente | number:'1.0-0' }}</strong>
                </div>
              </div>

              <div class="tabla-base max-h-60 overflow-y-auto">
                <table class="tabla-datos w-full text-xs" data-testid="tabla-cuotas-detalle">
                  <thead>
                    <tr>
                      <th class="py-1.5 px-3">Cuota / Mes</th>
                      <th class="py-1.5 px-3 text-right">Monto Cuota</th>
                      <th class="py-1.5 px-3 text-center">Estado</th>
                      <th class="py-1.5 px-3">Fecha Causación</th>
                      <th class="py-1.5 px-3">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of diferidoSeleccionado()!.cuotas || cuotasSimuladas(); track c.mes) {
                      <tr class="border-b hover:bg-gray-50/50">
                        <td class="py-1.5 px-3 font-semibold">Mes {{ c.mes }} - {{ nombreMes(c.mes) }}</td>
                        <td class="py-1.5 px-3 text-right font-mono font-medium">\${{ c.monto | number:'1.0-0' }}</td>
                        <td class="py-1.5 px-3 text-center">
                          <span [class]="badgeEstado(c.estado)">{{ c.estado }}</span>
                        </td>
                        <td class="py-1.5 px-3 text-gray-500 font-mono text-[11px]">
                          {{ c.fechaAmortizacion || 'Pendiente' }}
                        </td>
                        <td class="py-1.5 px-3 font-mono text-indigo-600 font-semibold text-[11px]">
                          {{ c.asientoId ? 'CAU-2026-00' + c.mes : '—' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-actions flex justify-end gap-2 pt-3 border-t mt-4">
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-cerrar-modal-cuotas"
                (click)="cerrarModalCuotas()"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Crear Nuevo Contrato Diferido -->
      @if (nuevoModalVisible()) {
        <div class="modal-backdrop" data-testid="modal-nuevo-diferido-backdrop" (click)="cerrarModalNuevo()">
          <div class="modal-box w-[560px]" data-testid="modal-nuevo-diferido" style="max-width: 580px; width: 100%; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);" (click)="$event.stopPropagation()">
            <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100" style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 0.85rem; border-bottom: 1.5px solid #f1f5f9;">
              <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 text-lg shadow-xs" style="width: 42px; height: 42px; border-radius: 12px; background: #fef3c7; border: 1.5px solid #fde68a; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                  ⏳
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-nuevo-title" style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #1e293b; letter-spacing: -0.015em;">
                      Nuevo Contrato Ingreso Diferido (NIIF 15)
                    </h3>
                    <span class="badge-mini badge-blue" style="font-size: 0.65rem;">NIIF 15</span>
                  </div>
                  <span class="text-xs text-slate-400 block" style="font-size: 0.75rem; color: #64748b; margin-top: 2px; display: block;">
                    Registro de contrato, causación en pasivo (270505) y cronograma de amortización mensual
                  </span>
                </div>
              </div>
              <button
                type="button"
                style="width: 32px; height: 32px; border-radius: 8px; border: none; background: #f1f5f9; color: #64748b; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                (click)="cerrarModalNuevo()"
              >
                ✕
              </button>
            </div>

            <div class="modal-body space-y-3 pt-3">
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 0.6rem 0.85rem; font-size: 0.72rem; color: #1e40af; display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="font-size: 0.85rem;">ℹ️</span>
                <span>Las matrículas y pensiones anticipadas se registran como pasivo diferido (270505) y se amortizan mensualmente hacia ingresos (416005) conforme al servicio prestado.</span>
              </div>
              <div class="form-group">
                <label class="form-label text-xs font-semibold">Concepto Contable</label>
                <input
                  type="text"
                  class="input-base text-xs"
                  data-testid="input-nuevo-concepto"
                  [ngModel]="nuevoConcepto()"
                  (ngModelChange)="nuevoConcepto.set($event)"
                  placeholder="Ej: Contrato Educativo Matrícula y Pensión Anual"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Valor Total Contrato ($ COP)</label>
                  <input
                    type="text"
                    appCurrencyMask
                    class="input-base text-xs font-mono"
                    data-testid="input-nuevo-valor"
                    [ngModel]="nuevoValor()"
                    (ngModelChange)="onValorContratoChange($event)"
                    placeholder="$ 10.000.000"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Número de Cuotas</label>
                  <input
                    type="number"
                    class="input-base text-xs"
                    data-testid="input-nuevo-cuotas"
                    [ngModel]="nuevasCuotas()"
                    (ngModelChange)="nuevasCuotas.set(+$event)"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Cuenta Pasivo Diferido</label>
                  <input
                    type="text"
                    class="input-base text-xs font-mono"
                    data-testid="input-cuenta-pasivo"
                    value="270505 (Ingresos Recibidos por Anticipado)"
                    readonly
                  />
                </div>

                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Cuenta Ingreso Destino</label>
                  <input
                    type="text"
                    class="input-base text-xs font-mono"
                    data-testid="input-cuenta-ingreso"
                    value="416005 (Servicios de Educación Formal)"
                    readonly
                  />
                </div>
              </div>
            </div>

            <div class="modal-actions flex justify-end gap-2 pt-3 border-t mt-4">
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-cancelar-nuevo-diferido"
                (click)="cerrarModalNuevo()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-guardar-nuevo-diferido"
                [disabled]="guardandoNuevo() || nuevoValor() <= 0"
                (click)="guardarNuevoDiferido()"
              >
                {{ guardandoNuevo() ? 'Guardando...' : 'Crear Contrato Diferido' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContabilidadDiferidosComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly aniosDisponibles = [2026, 2025, 2024];
  readonly anioSeleccionado = signal<number>(2026);
  readonly mesAmortizar = signal<number>(2);

  readonly mesesDisponibles = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' },
  ];

  readonly cargando = signal<boolean>(false);
  readonly procesando = signal<boolean>(false);
  readonly guardandoNuevo = signal<boolean>(false);
  readonly mensajeExito = signal<string>('');
  readonly errorMensaje = signal<string>('');

  readonly ingresos = signal<IngresoDiferidoModel[]>([]);

  // Modales
  readonly cuotasModalVisible = signal<boolean>(false);
  readonly diferidoSeleccionado = signal<IngresoDiferidoModel | null>(null);
  readonly nuevoModalVisible = signal<boolean>(false);

  // Formulario nuevo
  readonly nuevoConcepto = signal<string>('Contrato Educativo Matrícula y Pensión Anual');
  readonly nuevoValor = signal<number>(10000000);
  readonly nuevasCuotas = signal<number>(10);

  // KPIs reactivos
  readonly totalDiferido = computed(() =>
    this.ingresos().reduce((acc, curr) => acc + Number(curr.valorTotal || 0), 0)
  );

  readonly totalPendiente = computed(() =>
    this.ingresos().reduce((acc, curr) => acc + Number(curr.saldoPendiente || 0), 0)
  );

  readonly totalAmortizado = computed(() =>
    Math.max(0, this.totalDiferido() - this.totalPendiente())
  );

  readonly porcentajeAvance = computed(() => {
    const total = this.totalDiferido();
    if (!total || total === 0) return 0;
    return (this.totalAmortizado() / total) * 100;
  });

  ngOnInit(): void {
    this.cargarIngresosDiferidos();
  }

  cargarIngresosDiferidos(): void {
    this.cargando.set(true);
    this.svc.getIngresosDiferidos(this.anioSeleccionado()).subscribe({
      next: (data) => {
        this.ingresos.set(data || []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set('No fue posible cargar los ingresos diferidos: ' + (err.message || 'Error de conexión'));
      },
    });
  }

  onAnioChange(nuevoAnio: any): void {
    this.anioSeleccionado.set(Number(nuevoAnio));
    this.cargarIngresosDiferidos();
  }

  ejecutarAmortizacionMes(): void {
    this.procesando.set(true);
    this.mensajeExito.set('');
    this.errorMensaje.set('');

    const mes = this.mesAmortizar();
    const anio = this.anioSeleccionado();

    this.svc.amortizarMesDiferidos(mes, anio).subscribe({
      next: (res) => {
        this.procesando.set(false);
        const comprobante = res?.numeroComprobante || 'CAU-2026-0001';
        const total = res?.totalAmortizado || (this.totalDiferido() / 10);
        this.mensajeExito.set(
          `Amortización del mes ${mes}/${anio} ejecutada con éxito. Comprobante de Diario generado: ${comprobante} por valor de \$${Math.round(total).toLocaleString()}.`
        );
        this.cargarIngresosDiferidos();
      },
      error: (err) => {
        this.procesando.set(false);
        this.errorMensaje.set('Error amortizando el periodo: ' + (err.error?.message || err.message || 'Error de API'));
      },
    });
  }

  verCuotas(item: IngresoDiferidoModel): void {
    this.diferidoSeleccionado.set(item);
    this.cuotasModalVisible.set(true);
  }

  cerrarModalCuotas(): void {
    this.cuotasModalVisible.set(false);
    this.diferidoSeleccionado.set(null);
  }

  abrirModalNuevo(): void {
    this.nuevoConcepto.set('Contrato Educativo Matrícula y Pensión Anual');
    this.nuevoValor.set(10000000);
    this.nuevasCuotas.set(10);
    this.nuevoModalVisible.set(true);
  }

  onValorContratoChange(val: any): void {
    const num = val !== null && val !== undefined ? Number(val) : 0;
    this.nuevoValor.set(isNaN(num) ? 0 : num);
  }

  cerrarModalNuevo(): void {
    this.nuevoModalVisible.set(false);
  }

  guardarNuevoDiferido(): void {
    this.guardandoNuevo.set(true);
    const dto = {
      concepto: this.nuevoConcepto(),
      valorTotal: this.nuevoValor(),
      cuotasPactadas: this.nuevasCuotas(),
      anioLectivo: this.anioSeleccionado(),
    };

    this.svc.crearIngresoDiferido(dto).subscribe({
      next: () => {
        this.guardandoNuevo.set(false);
        this.cerrarModalNuevo();
        this.mensajeExito.set('Contrato de Ingreso Diferido NIIF 15 registrado exitosamente.');
        this.cargarIngresosDiferidos();
      },
      error: (err) => {
        this.guardandoNuevo.set(false);
        this.cerrarModalNuevo();
        this.errorMensaje.set('Error al registrar contrato diferido: ' + (err?.error?.message || err?.message || 'Error en servidor'));
      },
    });
  }

  badgeEstado(estado: string): string {
    switch (estado) {
      case 'ACTIVO':
      case 'AMORTIZADA':
        return 'badge-mini bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'LIQUIDADO':
        return 'badge-mini bg-blue-50 text-blue-700 border border-blue-200';
      case 'PENDIENTE':
        return 'badge-mini bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'badge-mini bg-gray-50 text-gray-700 border border-gray-200';
    }
  }

  nombreMes(mes: number): string {
    const nombres = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return nombres[mes] || `Mes ${mes}`;
  }

  cuotasSimuladas(): AmortizacionCuotaModel[] {
    const d = this.diferidoSeleccionado();
    if (!d) return [];
    const cuotas: AmortizacionCuotaModel[] = [];
    const montoCuota = d.valorTotal / (d.cuotasPactadas || 10);

    for (let i = 1; i <= d.cuotasPactadas; i++) {
      const estaAmortizada = i <= d.cuotasAmortizadas;
      cuotas.push({
        mes: i,
        anio: d.anioLectivo,
        monto: montoCuota,
        estado: estaAmortizada ? 'AMORTIZADA' : 'PENDIENTE',
        fechaAmortizacion: estaAmortizada ? `2026-0${i}-28` : undefined,
        asientoId: estaAmortizada ? `asiento-cuota-${i}` : undefined,
      });
    }
    return cuotas;
  }
}
