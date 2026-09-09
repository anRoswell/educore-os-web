import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import {
  BalancePrevioCierreModel,
  ResultadoCierreModel,
  ResultadoAperturaModel,
} from '../models/contabilidad.models';

@Component({
  selector: 'app-contabilidad-cierre',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .cierre-header-banner {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #7c3aed;
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .cierre-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .cierre-icon-wrap {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.75rem;
      background: #f5f3ff;
      border: 1px solid #ede9fe;
      font-size: 1.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .cierre-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .cierre-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .cierre-title-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .cierre-subtitle-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .cierre-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .cierre-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .cierre-kpis-grid {
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
      transform: translateY(-1px);
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
      font-size: 1.35rem;
      font-weight: 800;
      font-family: var(--font-mono, monospace);
      line-height: 1.2;
    }
    .kpi-widget-footer {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.35rem;
    }
    .wizard-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      margin-bottom: 1.25rem;
    }
    .wizard-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .step-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .step-circle {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .step-active .step-circle {
      background: #4f46e5;
      color: #ffffff;
    }
    .step-done .step-circle {
      background: #10b981;
      color: #ffffff;
    }
    .step-pending .step-circle {
      background: #e2e8f0;
      color: #64748b;
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
    <div class="tab-content" data-testid="tab-content-cierre">
      <!-- Header Banner -->
      <div class="cierre-header-banner" data-testid="cierre-header-banner">
        <div class="cierre-header-main">
          <div class="cierre-icon-wrap">🏛️</div>
          <div class="cierre-texts-wrap">
            <div class="cierre-title-row">
              <h2 class="cierre-title-text" data-testid="cierre-title">
                Cierre Fiscal Anual y Balance de Apertura (Periodo 13)
              </h2>
              <span class="badge-mini" style="background: rgba(124, 58, 237, 0.1); color: #7c3aed; border-color: rgba(124, 58, 237, 0.2);">
                Fin de Año Fiscal
              </span>
            </div>
            <p class="cierre-subtitle-text" data-testid="cierre-subtitle">
              Cancelación automática de cuentas de resultado (clases 4, 5, 6 a la 5905), traslado al patrimonio y generación de apertura fiscal APE.
            </p>
          </div>
        </div>

        <div class="flex items-end gap-3 flex-wrap">
          <div class="form-group-inline mb-0">
            <label class="form-label-sm">Año Fiscal</label>
            <select
              class="input-base input-sm w-28 font-semibold"
              data-testid="select-anio-cierre"
              [ngModel]="anio()"
              (ngModelChange)="onAnioChange($event)"
            >
              <option [value]="2026">2026</option>
              <option [value]="2025">2025</option>
              <option [value]="2024">2024</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 font-semibold"
              data-testid="btn-simular-cierre"
              [disabled]="cargando()"
              (click)="cargarBalancePrevio()"
            >
              <span>🔄</span>
              <span>Simular Balance Previo</span>
            </button>

            <button
              type="button"
              class="btn-primary btn-sm h-[38px] flex items-center gap-1.5 font-semibold shadow-sm"
              style="background: #7c3aed; border-color: #6d28d9;"
              data-testid="btn-ejecutar-cierre"
              [disabled]="cargando() || !balancePrevio()?.balanceCuadrado"
              (click)="abrirModalConfirmarCierre()"
            >
              <span>🏛️</span>
              <span>Ejecutar Cierre (CIER)</span>
            </button>

            <button
              type="button"
              class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 font-semibold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 shadow-2xs"
              data-testid="btn-ejecutar-apertura"
              [disabled]="cargando()"
              (click)="abrirModalConfirmarApertura()"
            >
              <span>🌅</span>
              <span>Generar Apertura (APE {{ anio() + 1 }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Messages Banners -->
      @if (mensajeExito()) {
        <div class="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between" data-testid="cierre-success-banner">
          <span>{{ mensajeExito() }}</span>
          <button type="button" class="text-emerald-500 font-bold ml-2" (click)="mensajeExito.set(null)">✕</button>
        </div>
      }

      @if (errorMensaje()) {
        <div class="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between" data-testid="cierre-error-banner">
          <span>{{ errorMensaje() }}</span>
          <button type="button" class="text-red-500 font-bold ml-2" (click)="errorMensaje.set(null)">✕</button>
        </div>
      }

      <!-- Stepper Visual -->
      <div class="wizard-card" data-testid="cierre-stepper">
        <div class="wizard-header">
          <div class="step-item" [class.step-active]="pasoActual() === 1" [class.step-done]="pasoActual() > 1" data-testid="step-1">
            <div class="step-circle">1</div>
            <div>
              <span class="block text-slate-800">1. Simulación & Sumas Iguales</span>
              <span class="text-2xs text-slate-500 font-normal">Liquidación clases 4, 5, 6</span>
            </div>
          </div>

          <span class="text-slate-300 font-bold">→</span>

          <div class="step-item" [class.step-active]="pasoActual() === 2" [class.step-done]="pasoActual() > 2" [class.step-pending]="pasoActual() < 2" data-testid="step-2">
            <div class="step-circle">2</div>
            <div>
              <span class="block text-slate-800">2. Asiento CIER (Periodo 13)</span>
              <span class="text-2xs text-slate-500 font-normal">Cuenta 5905 y bloqueo mensual</span>
            </div>
          </div>

          <span class="text-slate-300 font-bold">→</span>

          <div class="step-item" [class.step-active]="pasoActual() === 3" [class.step-done]="pasoActual() > 3" [class.step-pending]="pasoActual() < 3" data-testid="step-3">
            <div class="step-circle">3</div>
            <div>
              <span class="block text-slate-800">3. Balance de Apertura APE</span>
              <span class="text-2xs text-slate-500 font-normal">Traslado a 1 de enero {{ anio() + 1 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- KPIs Grid -->
      <div class="cierre-kpis-grid" data-testid="cierre-kpis">
        <!-- KPI 1: Ingresos -->
        <div
          class="kpi-widget-card"
          style="border-color: #dcfce7; background: linear-gradient(135deg, rgba(220, 252, 231, 0.35) 0%, #ffffff 100%);"
          data-testid="kpi-ingresos"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #15803d;">Ingresos Operativos (Clase 4)</span>
            <span class="text-base">💰</span>
          </div>
          <div class="kpi-widget-value" style="color: #16a34a;">
            $ {{ (balancePrevio()?.totalClase4Ingresos || 0) | number:'1.0-0' }}
          </div>
          <div class="kpi-widget-footer" style="color: #22c55e;">Pensiones, matrículas y otros</div>
        </div>

        <!-- KPI 2: Gastos y Costos -->
        <div
          class="kpi-widget-card"
          style="border-color: #fee2e2; background: linear-gradient(135deg, rgba(254, 226, 226, 0.35) 0%, #ffffff 100%);"
          data-testid="kpi-gastos-costos"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #b91c1c;">Gastos y Costos (Clases 5 y 6)</span>
            <span class="text-base">📉</span>
          </div>
          <div class="kpi-widget-value" style="color: #dc2626;">
            $ {{ ((balancePrevio()?.totalClase5Gastos || 0) + (balancePrevio()?.totalClase6Costos || 0)) | number:'1.0-0' }}
          </div>
          <div class="kpi-widget-footer" style="color: #ef4444;">Nómina docente, admón y dotación</div>
        </div>

        <!-- KPI 3: Excedente Neto -->
        <div
          class="kpi-widget-card"
          [style.borderColor]="(balancePrevio()?.excedenteNeto || 0) >= 0 ? '#e0e7ff' : '#fee2e2'"
          [style.background]="(balancePrevio()?.excedenteNeto || 0) >= 0 ? 'linear-gradient(135deg, rgba(224, 231, 255, 0.35) 0%, #ffffff 100%)' : 'linear-gradient(135deg, rgba(254, 226, 226, 0.35) 0%, #ffffff 100%)'"
          data-testid="kpi-excedente"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" [style.color]="(balancePrevio()?.excedenteNeto || 0) >= 0 ? '#4338ca' : '#b91c1c'">Excedente Neto Ejercicio</span>
            <span class="text-base">📊</span>
          </div>
          <div class="kpi-widget-value font-bold" [style.color]="(balancePrevio()?.excedenteNeto || 0) >= 0 ? '#4f46e5' : '#dc2626'">
            $ {{ (balancePrevio()?.excedenteNeto || 0) | number:'1.0-0' }}
          </div>
          <div class="kpi-widget-footer" [style.color]="(balancePrevio()?.excedenteNeto || 0) >= 0 ? '#6366f1' : '#ef4444'">Resultado contable a trasladar</div>
        </div>

        <!-- KPI 4: Control Cuadre -->
        <div
          class="kpi-widget-card"
          [style.borderColor]="balancePrevio()?.balanceCuadrado ? '#d1fae5' : '#fee2e2'"
          [style.background]="balancePrevio()?.balanceCuadrado ? 'linear-gradient(135deg, rgba(209, 250, 229, 0.35) 0%, #ffffff 100%)' : 'linear-gradient(135deg, rgba(254, 226, 226, 0.35) 0%, #ffffff 100%)'"
          data-testid="kpi-cuadre"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" [style.color]="balancePrevio()?.balanceCuadrado ? '#047857' : '#b91c1c'">Control Partida Doble</span>
            <span class="text-base">{{ balancePrevio()?.balanceCuadrado ? '✅' : '🚨' }}</span>
          </div>
          <div class="kpi-widget-value text-base font-bold" [style.color]="balancePrevio()?.balanceCuadrado ? '#059669' : '#dc2626'">
            {{ balancePrevio()?.balanceCuadrado ? 'Sumas Iguales Verificadas' : 'Descuadre Contable' }}
          </div>
          <div class="kpi-widget-footer" [style.color]="balancePrevio()?.balanceCuadrado ? '#10b981' : '#ef4444'">Destino: {{ balancePrevio()?.cuentaPatrimonialDestino || '320505' }}</div>
        </div>
      </div>

      <!-- Resumen Estructurado del Asiento CIER -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm mb-4" data-testid="card-detalle-cierre">
        <h3 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2" data-testid="title-mecanica-cierre">
          <span>📜</span>
          <span>Mecánica de Cancelación y Cierre de Cuentas (Decreto 2420 NIIF)</span>
        </h3>

        <div class="space-y-3 text-xs">
          <div class="flex items-center justify-between p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors">
            <div class="pr-3">
              <span class="font-bold text-slate-800 block mb-0.5">1. Débito a Cuentas de Ingresos (Clase 4):</span>
              <p class="text-slate-500 text-xs leading-relaxed m-0">Se debitan todas las cuentas 41xx para dejarlas en saldo cero ($0).</p>
            </div>
            <span class="font-mono font-bold text-sm text-slate-900 whitespace-nowrap">$ {{ (balancePrevio()?.totalClase4Ingresos || 0) | number:'1.0-0' }}</span>
          </div>

          <div class="flex items-center justify-between p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors">
            <div class="pr-3">
              <span class="font-bold text-slate-800 block mb-0.5">2. Crédito a Cuentas de Gastos y Costos (Clases 5 y 6):</span>
              <p class="text-slate-500 text-xs leading-relaxed m-0">Se acreditan las cuentas 51xx, 52xx, 61xx para cancelarlas a saldo cero ($0).</p>
            </div>
            <span class="font-mono font-bold text-sm text-slate-900 whitespace-nowrap">$ {{ ((balancePrevio()?.totalClase5Gastos || 0) + (balancePrevio()?.totalClase6Costos || 0)) | number:'1.0-0' }}</span>
          </div>

          <div class="flex items-center justify-between p-3.5 sm:p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors">
            <div class="pr-3">
              <span class="font-bold text-indigo-900 block mb-0.5">3. Cuenta Transitoria de Cierre: 590505 (Ganancias y Pérdidas):</span>
              <p class="text-indigo-700 text-xs leading-relaxed m-0">Cruce de sumas iguales sin afectar terceros operativos.</p>
            </div>
            <span class="font-mono font-bold text-sm text-indigo-800 whitespace-nowrap">$ 0 (Balanceado)</span>
          </div>

          <div class="flex items-center justify-between p-3.5 sm:p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition-colors">
            <div class="pr-3">
              <span class="font-bold text-emerald-900 block mb-0.5">4. Traslado Final a Patrimonio: Cta {{ balancePrevio()?.cuentaPatrimonialDestino || '320505' }}:</span>
              <p class="text-emerald-700 text-xs leading-relaxed m-0">Aumento o disminución del fondo patrimonial de la institución educativa.</p>
            </div>
            <span class="font-mono font-bold text-sm text-emerald-800 whitespace-nowrap">$ {{ (balancePrevio()?.excedenteNeto || 0) | number:'1.0-0' }}</span>
          </div>
        </div>
      </div>

      <!-- Modal Confirmar Cierre CIER -->
      @if (mostrarModalCierre()) {
        <div class="modal-overlay" data-testid="modal-confirmar-cierre-overlay" (click)="cerrarModalCierre()">
          <div class="modal-card" data-testid="modal-confirmar-cierre" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="flex items-center gap-2">
                <span class="text-lg">🏛️</span>
                <h3 class="font-bold text-slate-800 text-sm" data-testid="modal-cierre-title">
                  Confirmar Ejecución de Cierre Anual (Periodo 13)
                </h3>
              </div>
              <button type="button" class="text-slate-400 hover:text-slate-600 font-bold text-sm" (click)="cerrarModalCierre()">✕</button>
            </div>

            <div class="modal-body space-y-3 text-xs">
              <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900">
                <strong>Bloqueo de Periodos:</strong> Al ejecutar el cierre contable, los 12 periodos ordinarios de la vigencia {{ anio() }} se marcarán como <strong>CERRADO</strong> y se generará el comprobante formal <strong>CIER</strong>.
              </div>

              <div class="space-y-1.5 border-t pt-2 text-slate-700">
                <div class="flex justify-between">
                  <span>Año Fiscal:</span>
                  <span class="font-bold">{{ anio() }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Excedente Neto a Trasladar:</span>
                  <span class="font-bold text-indigo-700">$ {{ (balancePrevio()?.excedenteNeto || 0) | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Cuenta Patrimonial:</span>
                  <span class="font-mono font-semibold">{{ balancePrevio()?.cuentaPatrimonialDestino || '320505' }}</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Observación de Cierre:</label>
                <textarea
                  class="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                  rows="2"
                  data-testid="textarea-cierre-obs"
                  [(ngModel)]="observacionCierre"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-cancelar-modal-cierre"
                [disabled]="procesandoCierre()"
                (click)="cerrarModalCierre()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary btn-sm flex items-center gap-1.5"
                style="background: #7c3aed; border-color: #6d28d9;"
                data-testid="btn-confirmar-modal-cierre"
                [disabled]="procesandoCierre()"
                (click)="ejecutarCierre()"
              >
                <span>🏛️</span>
                <span>{{ procesandoCierre() ? 'Cerrando...' : 'Confirmar Cierre Fiscal' }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Confirmar Apertura APE -->
      @if (mostrarModalApertura()) {
        <div class="modal-overlay" data-testid="modal-confirmar-apertura-overlay" (click)="cerrarModalApertura()">
          <div class="modal-card" data-testid="modal-confirmar-apertura" (click)="$event.stopPropagation()">
            <div class="modal-header bg-indigo-50 border-indigo-200">
              <div class="flex items-center gap-2">
                <span class="text-lg">🌅</span>
                <h3 class="font-bold text-indigo-900 text-sm" data-testid="modal-apertura-title">
                  Generar Comprobante de Apertura Fiscal (APE {{ anio() + 1 }})
                </h3>
              </div>
              <button type="button" class="text-slate-400 hover:text-slate-600 font-bold text-sm" (click)="cerrarModalApertura()">✕</button>
            </div>

            <div class="modal-body space-y-3 text-xs">
              <div class="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-800">
                Se generará el comprobante de apertura <strong>APE-1</strong> con corte al 1 de enero de {{ anio() + 1 }}, trasladando los saldos finales de las cuentas reales de Balance (Activo, Pasivo y Patrimonio).
              </div>

              <div class="space-y-1.5 text-slate-700">
                <div class="flex justify-between">
                  <span>Nueva Vigencia Fiscal:</span>
                  <span class="font-bold">{{ anio() + 1 }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Tipo de Comprobante:</span>
                  <span class="font-semibold">APE (Apertura)</span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-cancelar-modal-apertura"
                [disabled]="procesandoApertura()"
                (click)="cerrarModalApertura()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary btn-sm flex items-center gap-1.5"
                data-testid="btn-confirmar-modal-apertura"
                [disabled]="procesandoApertura()"
                (click)="ejecutarApertura()"
              >
                <span>🌅</span>
                <span>{{ procesandoApertura() ? 'Generando...' : 'Generar Apertura Fiscal' }}</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContabilidadCierreComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly anio = signal<number>(2026);
  readonly pasoActual = signal<number>(1);
  readonly cargando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly balancePrevio = signal<BalancePrevioCierreModel | null>(null);
  readonly resultadoCierre = signal<ResultadoCierreModel | null>(null);
  readonly resultadoApertura = signal<ResultadoAperturaModel | null>(null);

  readonly mostrarModalCierre = signal<boolean>(false);
  readonly procesandoCierre = signal<boolean>(false);
  observacionCierre = 'Cierre Contable Anual y Traslado a Patrimonio Periodo 13';

  readonly mostrarModalApertura = signal<boolean>(false);
  readonly procesandoApertura = signal<boolean>(false);

  ngOnInit(): void {
    this.cargarBalancePrevio();
  }

  onAnioChange(a: number): void {
    this.anio.set(Number(a));
    this.cargarBalancePrevio();
  }

  cargarBalancePrevio(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.svc.getBalancePrevioCierre(this.anio()).subscribe({
      next: (res) => {
        this.balancePrevio.set(res);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener balance previo:', err);
        this.errorMensaje.set('No se pudo simular el balance previo de cierre.');
        this.cargando.set(false);
      },
    });
  }

  abrirModalConfirmarCierre(): void {
    this.mostrarModalCierre.set(true);
  }

  cerrarModalCierre(): void {
    this.mostrarModalCierre.set(false);
  }

  ejecutarCierre(): void {
    this.procesandoCierre.set(true);
    this.errorMensaje.set(null);

    this.svc.ejecutarCierreAnual(this.anio()).subscribe({
      next: (res) => {
        this.resultadoCierre.set(res);
        this.procesandoCierre.set(false);
        this.mostrarModalCierre.set(false);
        this.pasoActual.set(2);
        this.mensajeExito.set(`Cierre contable ejecutado con éxito: Comprobante CIER-${res.consecutivo} generado. Periodos cerrados: ${res.periodosCerrados}.`);
      },
      error: (err) => {
        console.error('Error al ejecutar cierre anual:', err);
        this.errorMensaje.set('Error al ejecutar el comprobante de cierre contable.');
        this.procesandoCierre.set(false);
      },
    });
  }

  abrirModalConfirmarApertura(): void {
    this.mostrarModalApertura.set(true);
  }

  cerrarModalApertura(): void {
    this.mostrarModalApertura.set(false);
  }

  ejecutarApertura(): void {
    this.procesandoApertura.set(true);
    this.errorMensaje.set(null);

    const nuevaVigencia = this.anio() + 1;
    this.svc.ejecutarAperturaAnual(nuevaVigencia).subscribe({
      next: (res) => {
        this.resultadoApertura.set(res);
        this.procesandoApertura.set(false);
        this.mostrarModalApertura.set(false);
        this.pasoActual.set(3);
        this.mensajeExito.set(`Apertura fiscal ${res.anio} generada con éxito: Comprobante ${res.tipoComprobante} con sumas iguales de $ ${res.totalDebito.toLocaleString()}.`);
      },
      error: (err) => {
        console.error('Error al generar apertura anual:', err);
        this.errorMensaje.set('Error al generar comprobante de apertura anual.');
        this.procesandoApertura.set(false);
      },
    });
  }
}
