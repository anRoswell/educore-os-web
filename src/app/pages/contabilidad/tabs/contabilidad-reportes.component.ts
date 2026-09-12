import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { ConfigGuideComponent, ConfigRequirement } from '../components/config-guide.component';
import { ContabilidadComponent } from '../contabilidad.component';
import {
  BalanceGeneral,
  EstadoResultados,
  LibroDiarioItem,
  LibroMayorCuenta,
  AuxiliarTerceroReporte,
  Tercero,
  FlujoEfectivoModel,
  NotasNiifModel,
} from '../models/contabilidad.models';

import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';

type ReporteActivo = 'graficas' | 'balance' | 'pyg' | 'diario' | 'mayor' | 'auxiliar' | 'flujo' | 'notas' | 'certificados' | 'exogena' | 'presupuesto' | 'conciliacion';

@Component({
  selector: 'app-contabilidad-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfigGuideComponent, FlatpickrDirective],
  styles: [`
    .stat-card {
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
    .stat-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
      border-color: #cbd5e1;
    }
    .stat-card.border-blue-500 {
      border-color: #bfdbfe;
      background: linear-gradient(135deg, rgba(219, 234, 254, 0.3) 0%, #ffffff 100%);
    }
    .stat-card.border-red-500 {
      border-color: #fee2e2;
      background: linear-gradient(135deg, rgba(254, 226, 226, 0.3) 0%, #ffffff 100%);
    }
    .stat-card.border-green-500 {
      border-color: #d1fae5;
      background: linear-gradient(135deg, rgba(209, 250, 229, 0.3) 0%, #ffffff 100%);
    }
    .stat-card.border-purple-500 {
      border-color: #f3e8ff;
      background: linear-gradient(135deg, rgba(243, 232, 255, 0.3) 0%, #ffffff 100%);
    }
    .stat-card.border-indigo-500 {
      border-color: #e0e7ff;
      background: linear-gradient(135deg, rgba(224, 231, 255, 0.3) 0%, #ffffff 100%);
    }
    .stat-card.border-yellow-500 {
      border-color: #fef3c7;
      background: linear-gradient(135deg, rgba(254, 243, 199, 0.3) 0%, #ffffff 100%);
    }
    .stat-card.border-gray-200 {
      border-color: #e2e8f0;
      background: #ffffff;
    }
    .stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }
    .stat-value {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: var(--font-mono);
      line-height: 1.2;
    }
    .stat-footer {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.35rem;
    }
    .reportes-filter-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 0.75rem;
    }
    .reportes-filter-group {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .reportes-filter-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
      margin-bottom: 2px;
      line-height: 1.25;
    }
    .w-date {
      width: 140px !important;
    }
    .w-select-md {
      width: 220px !important;
    }
    .w-select-formato-dian {
      width: 330px !important;
      min-width: 290px !important;
    }
    .w-year {
      width: 120px !important;
      min-width: 110px !important;
      text-align: center;
      font-weight: 600;
    }
    .w-code {
      width: 220px !important;
      min-width: 180px !important;
    }
    .reportes-card-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .reportes-card-title-group {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .reportes-card-icon {
      font-size: 1.5rem;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .reportes-card-title-texts {
      display: flex;
      flex-direction: column;
    }
    .reportes-card-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      line-height: 1.25;
    }
    .reportes-card-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      margin-top: 0.125rem;
      line-height: 1.25;
    }
    .reportes-info-badge {
      font-size: 0.75rem;
      padding: 0.35rem 0.65rem;
      border-radius: 0.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      line-height: 1.3;
    }
    /* Estilos Dashboard Gerencial NIIF */
    .chart-container-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
    }
    .chart-container-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }
    .chart-bars-wrap {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      height: 230px;
      padding-top: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      overflow-x: auto;
    }
    .chart-bar-group {
      flex: 1;
      min-width: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      cursor: pointer;
      position: relative;
      padding: 0 2px;
      border-radius: 6px;
      transition: background-color 0.15s ease;
    }
    .chart-bar-group:hover {
      background-color: rgba(241, 245, 249, 0.8);
    }
    .chart-bar-columns {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      width: 100%;
      height: 100%;
      justify-content: center;
    }
    .bar-col {
      width: 11px;
      border-radius: 4px 4px 0 0;
      transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease;
      min-height: 4px;
    }
    .bar-col:hover {
      transform: scaleY(1.05);
      filter: brightness(1.15);
    }
    .bar-col-ingreso {
      background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
    }
    .bar-col-gasto {
      background: linear-gradient(180deg, #f87171 0%, #dc2626 100%);
    }
    .bar-col-excedente {
      background: linear-gradient(180deg, #10b981 0%, #047857 100%);
    }
    .bar-col-flujo-in {
      background: linear-gradient(180deg, #06b6d4 0%, #0891b2 100%);
    }
    .bar-col-flujo-out {
      background: linear-gradient(180deg, #fb923c 0%, #ea580c 100%);
    }
    .chart-month-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      margin-top: 0.5rem;
      text-transform: uppercase;
    }
    .legend-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: #475569;
    }
    .legend-dot {
      width: 9px;
      height: 9px;
      border-radius: 2px;
    }
  `],
  template: `
    @if (faltanRequisitos()) {
      <div class="p-6">
        <app-config-guide 
          title="Configuración Requerida para Reportes" 
          description="Para generar informes financieros y gerenciales, debes configurar previamente el Plan de Cuentas (PUC) y los Periodos Contables."
          [requirements]="requisitosFaltantes()"
          (onNavigate)="navegarA($event)" />
      </div>
    } @else {
      <div class="tab-content" data-testid="tab-content-reportes">
        <!-- Selector de reporte -->
      <div class="tabs-nav mb-5 flex-wrap" data-testid="nav-reportes">
        @for (r of reportes; track r.key) {
          <button
            type="button"
            class="tab-btn"
            [class.active]="reporteActivo() === r.key"
            [attr.data-testid]="'btn-subreporte-' + r.key"
            (click)="seleccionarReporte(r.key)"
          >
            {{ r.icono }} {{ r.label }}
          </button>
        }
      </div>

      <!-- ─── 0. DASHBOARD FINANCIERO GERENCIAL (GRÁFICAS NIIF) ──────────── -->
      @if (reporteActivo() === 'graficas') {
        <div data-testid="seccion-dashboard-gerencial" class="space-y-4">
          <!-- Banner Superior & Filtros Gerenciales -->
          <div class="card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">📊</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title">Dashboard Financiero Gerencial</h3>
                  <p class="reportes-card-subtitle">Analítica gráfica comparativa de rentabilidad, estructura patrimonial, flujo de fondos y presupuesto NIIF</p>
                </div>
              </div>
              <div class="reportes-info-badge text-indigo-800 bg-indigo-50/90 border border-indigo-200">
                <span>🏛️</span>
                <span><strong>Norma Técnica NIIF:</strong> Consolidación automática de cuentas nominales, patrimoniales y flujo de fondos.</span>
              </div>
            </div>

            <div class="reportes-filter-row justify-between">
              <div class="flex flex-wrap items-end gap-3">
                <div class="reportes-filter-group">
                  <label class="reportes-filter-label">Vigencia Fiscal (Año)</label>
                  <input
                    class="input-base input-sm w-year font-mono font-bold"
                    data-testid="input-dashboard-anio"
                    type="number"
                    min="2020"
                    max="2035"
                    [ngModel]="dashboardAnio()"
                    (ngModelChange)="onDashboardAnioChange($event)"
                  />
                </div>

                <div class="reportes-filter-group">
                  <label class="reportes-filter-label">Modo de Comparación</label>
                  <div class="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-100 shadow-sm">
                    <button
                      type="button"
                      class="px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5"
                      [class.bg-indigo-600]="dashboardModo() === 'MENSUAL'"
                      [class.text-white]="dashboardModo() === 'MENSUAL'"
                      [class.shadow-md]="dashboardModo() === 'MENSUAL'"
                      [class.text-slate-500]="dashboardModo() !== 'MENSUAL'"
                      [class.hover:text-slate-700]="dashboardModo() !== 'MENSUAL'"
                      [class.hover:bg-slate-200]="dashboardModo() !== 'MENSUAL'"
                      data-testid="btn-modo-mensual"
                      (click)="setDashboardModo('MENSUAL')"
                    >
                      <span>📅</span>
                      <span>Mensual (12 Meses)</span>
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5"
                      [class.bg-indigo-600]="dashboardModo() === 'TRIMESTRAL'"
                      [class.text-white]="dashboardModo() === 'TRIMESTRAL'"
                      [class.shadow-md]="dashboardModo() === 'TRIMESTRAL'"
                      [class.text-slate-500]="dashboardModo() !== 'TRIMESTRAL'"
                      [class.hover:text-slate-700]="dashboardModo() !== 'TRIMESTRAL'"
                      [class.hover:bg-slate-200]="dashboardModo() !== 'TRIMESTRAL'"
                      data-testid="btn-modo-trimestral"
                      (click)="setDashboardModo('TRIMESTRAL')"
                    >
                      <span>📈</span>
                      <span>Trimestral (T1 - T4)</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn-primary btn-sm inline-flex items-center gap-1.5 font-semibold"
                  data-testid="btn-actualizar-dashboard"
                  (click)="cargarDashboardGerencial()"
                  [disabled]="cargando()"
                >
                  <span>🔄</span>
                  <span>{{ cargando() ? 'Consolidando...' : 'Actualizar Analítica' }}</span>
                </button>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn-secondary btn-sm inline-flex items-center gap-1.5"
                  data-testid="btn-exportar-dashboard-excel"
                  (click)="exportarDashboardExcel()"
                >
                  <span>⬇</span>
                  <span>Exportar Informe (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Spinner si está cargando -->
          @if (cargando()) {
            <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-slate-500">
              <div class="spinner mb-3"></div>
              <span class="text-xs font-semibold">Generando métricas y consolidando gráficas financieras NIIF...</span>
            </div>
          } @else if (dashboardGerencial()) {
            <!-- 1. Cuadrícula de KPIs Ejecutivos NIIF -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" data-testid="dashboard-kpis-grid">
              <!-- KPI 1: Excedente Neto Anual -->
              <div class="stat-card border-green-500">
                <div class="stat-label">
                  <span>Excedente Neto Anual</span>
                  <span class="text-base">💎</span>
                </div>
                <div class="stat-value text-emerald-700" data-testid="kpi-excedente-neto">
                  $ {{ dashboardGerencial()?.totalesAnuales?.excedenteNeto | number:'1.0-0' }}
                </div>
                <div class="stat-footer flex items-center justify-between">
                  <span>Margen Neto NIIF:</span>
                  <span class="ratio-badge bg-emerald-100 text-emerald-800 font-bold" data-testid="badge-margen-neto">
                    {{ dashboardGerencial()?.ratiosFinancieros?.margenNeto }}%
                  </span>
                </div>
              </div>

              <!-- KPI 2: Razón Corriente / Liquidez -->
              <div class="stat-card border-blue-500">
                <div class="stat-label">
                  <span>Razón Corriente (Liquidez)</span>
                  <span class="text-base">💧</span>
                </div>
                <div class="stat-value text-blue-700" data-testid="kpi-razon-corriente">
                  {{ dashboardGerencial()?.ratiosFinancieros?.razonCorriente }}x
                </div>
                <div class="stat-footer flex items-center justify-between">
                  <span>Activo vs Pasivo Corto Plazo</span>
                  <span
                    class="ratio-badge font-bold"
                    [class.bg-blue-100]="(dashboardGerencial()?.ratiosFinancieros?.razonCorriente || 0) >= 1.2"
                    [class.text-blue-800]="(dashboardGerencial()?.ratiosFinancieros?.razonCorriente || 0) >= 1.2"
                    [class.bg-amber-100]="(dashboardGerencial()?.ratiosFinancieros?.razonCorriente || 0) < 1.2"
                    [class.text-amber-800]="(dashboardGerencial()?.ratiosFinancieros?.razonCorriente || 0) < 1.2"
                  >
                    {{ (dashboardGerencial()?.ratiosFinancieros?.razonCorriente || 0) >= 1.2 ? 'Solvencia Óptima' : 'Vigilar Liquidez' }}
                  </span>
                </div>
              </div>

              <!-- KPI 3: Nivel de Endeudamiento -->
              <div class="stat-card border-purple-500">
                <div class="stat-label">
                  <span>Nivel de Endeudamiento</span>
                  <span class="text-base">⚖️</span>
                </div>
                <div class="stat-value text-purple-700" data-testid="kpi-nivel-endeudamiento">
                  {{ dashboardGerencial()?.ratiosFinancieros?.nivelEndeudamiento }}%
                </div>
                <div class="stat-footer flex items-center justify-between">
                  <span>Pasivos / Activo Total</span>
                  <span class="ratio-badge bg-purple-100 text-purple-800 font-bold">
                    {{ (dashboardGerencial()?.ratiosFinancieros?.nivelEndeudamiento || 0) <= 50 ? 'Estructura Sana' : 'Apalancado' }}
                  </span>
                </div>
              </div>

              <!-- KPI 4: Autonomía de Caja -->
              <div class="stat-card border-indigo-500">
                <div class="stat-label">
                  <span>Autonomía de Caja</span>
                  <span class="text-base">⏱️</span>
                </div>
                <div class="stat-value text-indigo-700" data-testid="kpi-dias-caja">
                  {{ dashboardGerencial()?.ratiosFinancieros?.diasRotacionCaja }} Días
                </div>
                <div class="stat-footer flex items-center justify-between">
                  <span>Cobertura Operativa</span>
                  <span class="ratio-badge bg-indigo-100 text-indigo-800 font-bold">
                    Disponible / Gasto Diario
                  </span>
                </div>
              </div>
            </div>

            <!-- 2. Gráfica 1: Comparativo Mensual / Trimestral (Ingresos vs Gastos vs Excedente) -->
            <div class="chart-container-card space-y-3" data-testid="seccion-grafica-comparativa">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span>📈</span>
                    <span>Comparativo {{ dashboardModo() === 'MENSUAL' ? 'Mensual' : 'Trimestral' }}: Ingresos (Clase 4) vs Gastos/Costos (Clases 5, 6, 7) vs Excedente</span>
                  </h4>
                  <p class="text-xs text-slate-500 mt-0.5">
                    Visualización de devengo y rentabilidad institucional durante la vigencia {{ dashboardAnio() }}
                  </p>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                  <div class="legend-chip">
                    <span class="legend-dot" style="background: #2563eb;"></span>
                    <span>Ingresos</span>
                  </div>
                  <div class="legend-chip">
                    <span class="legend-dot" style="background: #dc2626;"></span>
                    <span>Gastos y Costos</span>
                  </div>
                  <div class="legend-chip">
                    <span class="legend-dot" style="background: #059669;"></span>
                    <span>Excedente Neto</span>
                  </div>
                </div>
              </div>

              <!-- Contenedor Visual de Barras Verticales -->
              <div class="chart-bars-wrap" data-testid="contenedor-barras-comparativas">
                @if (dashboardModo() === 'MENSUAL') {
                  @for (item of dashboardGerencial()?.resumenMensual; track item.mes) {
                    <div
                      class="chart-bar-group"
                      [class.bg-indigo-50]="mesDetalleSeleccionado()?.mes === item.mes"
                      (click)="seleccionarMesDetalle(item)"
                      [title]="item.mesNombre + ':\nIngresos: $' + (item.ingresos | number:'1.0-0') + '\nGastos: $' + (item.gastos + item.costos | number:'1.0-0') + '\nExcedente: $' + (item.excedenteNeto | number:'1.0-0')"
                      data-testid="bar-group-mes"
                    >
                      <div class="chart-bar-columns">
                        <!-- Barra Ingreso -->
                        <div
                          class="bar-col bar-col-ingreso"
                          [style.height.%]="calcularPorcentajeBarra(item.ingresos, maxIngresosGastos())"
                          [title]="'Ingresos: $' + (item.ingresos | number:'1.0-0')"
                        ></div>
                        <!-- Barra Gastos y Costos -->
                        <div
                          class="bar-col bar-col-gasto"
                          [style.height.%]="calcularPorcentajeBarra(item.gastos + item.costos, maxIngresosGastos())"
                          [title]="'Gastos: $' + ((item.gastos + item.costos) | number:'1.0-0')"
                        ></div>
                        <!-- Barra Excedente -->
                        <div
                          class="bar-col bar-col-excedente"
                          [style.height.%]="calcularPorcentajeBarra(Math.max(0, item.excedenteNeto), maxIngresosGastos())"
                          [title]="'Excedente: $' + (item.excedenteNeto | number:'1.0-0')"
                        ></div>
                      </div>
                      <span class="chart-month-label">{{ item.mesNombre }}</span>
                    </div>
                  }
                } @else {
                  @for (tri of trimestresData(); track tri.trimestre) {
                    <div
                      class="chart-bar-group"
                      [title]="tri.nombre + ':\nIngresos: $' + (tri.ingresos | number:'1.0-0') + '\nGastos: $' + (tri.gastos | number:'1.0-0') + '\nExcedente: $' + (tri.excedente | number:'1.0-0')"
                      data-testid="bar-group-trimestre"
                    >
                      <div class="chart-bar-columns">
                        <div
                          class="bar-col bar-col-ingreso !w-4"
                          [style.height.%]="calcularPorcentajeBarra(tri.ingresos, maxTrimestres())"
                        ></div>
                        <div
                          class="bar-col bar-col-gasto !w-4"
                          [style.height.%]="calcularPorcentajeBarra(tri.gastos, maxTrimestres())"
                        ></div>
                        <div
                          class="bar-col bar-col-excedente !w-4"
                          [style.height.%]="calcularPorcentajeBarra(Math.max(0, tri.excedente), maxTrimestres())"
                        ></div>
                      </div>
                      <span class="chart-month-label">{{ tri.nombre }}</span>
                    </div>
                  }
                }
              </div>

              <!-- Detalle del mes seleccionado en tarjeta desplegable -->
              @if (mesDetalleSeleccionado()) {
                <div class="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs" data-testid="card-detalle-mes-seleccionado">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-indigo-900 uppercase">📅 Detalle {{ mesDetalleSeleccionado()?.mesNombre }}:</span>
                    <span class="text-blue-700 font-semibold">Ingresos: <strong>$ {{ mesDetalleSeleccionado()?.ingresos | number:'1.0-0' }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span class="text-rose-700 font-semibold">Gastos/Costos: <strong>$ {{ (mesDetalleSeleccionado()?.gastos + mesDetalleSeleccionado()?.costos) | number:'1.0-0' }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span class="text-emerald-700 font-semibold">Excedente: <strong>$ {{ mesDetalleSeleccionado()?.excedenteNeto | number:'1.0-0' }}</strong></span>
                  </div>
                  <button type="button" class="text-indigo-600 hover:text-indigo-900 font-bold cursor-pointer" (click)="mesDetalleSeleccionado.set(null)">✕ Cerrar</button>
                </div>
              }

              <!-- Tabla de datos comparativos -->
              <div class="overflow-x-auto w-full pt-1">
                <table class="tabla-datos w-full text-xs" data-testid="tabla-datos-comparativos">
                  <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th class="py-2 px-3 text-left font-semibold text-slate-600">Periodo</th>
                      <th class="py-2 px-3 text-right font-semibold text-blue-700">Ingresos (Clase 4)</th>
                      <th class="py-2 px-3 text-right font-semibold text-rose-700">Gastos (Clase 5 y 7)</th>
                      <th class="py-2 px-3 text-right font-semibold text-amber-700">Costos (Clase 6)</th>
                      <th class="py-2 px-3 text-right font-semibold text-emerald-700">Excedente Neto</th>
                      <th class="py-2 px-3 text-right font-semibold text-slate-600">% Margen</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (m of dashboardGerencial()?.resumenMensual; track m.mes) {
                      <tr class="hover:bg-slate-50/60 transition-colors">
                        <td class="py-1.5 px-3 font-semibold text-slate-800">{{ m.mesNombre }}</td>
                        <td class="py-1.5 px-3 text-right font-mono text-blue-800">$ {{ m.ingresos | number:'1.0-0' }}</td>
                        <td class="py-1.5 px-3 text-right font-mono text-rose-800">$ {{ m.gastos | number:'1.0-0' }}</td>
                        <td class="py-1.5 px-3 text-right font-mono text-amber-800">$ {{ m.costos | number:'1.0-0' }}</td>
                        <td class="py-1.5 px-3 text-right font-mono font-bold" [class.text-emerald-700]="m.excedenteNeto >= 0" [class.text-rose-700]="m.excedenteNeto < 0">
                          $ {{ m.excedenteNeto | number:'1.0-0' }}
                        </td>
                        <td class="py-1.5 px-3 text-right font-mono font-semibold text-slate-700">
                          {{ m.ingresos > 0 ? (Math.round((m.excedenteNeto / m.ingresos) * 1000) / 10) : 0 }}%
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot class="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td class="py-2 px-3 text-slate-800 uppercase">Total Anual</td>
                      <td class="py-2 px-3 text-right font-mono text-blue-900">$ {{ dashboardGerencial()?.totalesAnuales?.totalIngresos | number:'1.0-0' }}</td>
                      <td class="py-2 px-3 text-right font-mono text-rose-900">$ {{ dashboardGerencial()?.totalesAnuales?.totalGastos | number:'1.0-0' }}</td>
                      <td class="py-2 px-3 text-right font-mono text-amber-900">$ {{ dashboardGerencial()?.totalesAnuales?.totalCostos | number:'1.0-0' }}</td>
                      <td class="py-2 px-3 text-right font-mono text-emerald-900">$ {{ dashboardGerencial()?.totalesAnuales?.excedenteNeto | number:'1.0-0' }}</td>
                      <td class="py-2 px-3 text-right font-mono text-slate-800">{{ dashboardGerencial()?.ratiosFinancieros?.margenNeto }}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- 3. Fila Doble: Estructura Patrimonial NIIF & Flujo de Efectivo -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <!-- Gráfica 2: Estructura Patrimonial (Activos vs Pasivos vs Patrimonio) -->
              <div class="chart-container-card space-y-3" data-testid="seccion-estructura-patrimonial">
                <div class="pb-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span>🏛️</span>
                      <span>Estructura Patrimonial NIIF</span>
                    </h4>
                    <p class="text-xs text-slate-500 mt-0.5">Ecuación Patrimonial: Activo = Pasivo + Patrimonio</p>
                  </div>
                  <span
                    class="badge-mini px-2 py-0.5 rounded font-bold text-xs"
                    [class.bg-emerald-50]="dashboardGerencial()?.estructuraPatrimonial?.cuadra"
                    [class.text-emerald-800]="dashboardGerencial()?.estructuraPatrimonial?.cuadra"
                    [class.border-emerald-200]="dashboardGerencial()?.estructuraPatrimonial?.cuadra"
                    data-testid="badge-cuadre-patrimonial"
                  >
                    {{ dashboardGerencial()?.estructuraPatrimonial?.cuadra ? '✅ Cuadrado NIIF' : '⚠️ En Revisión' }}
                  </span>
                </div>

                <!-- Barras de Composición Proporcional -->
                <div class="space-y-3 py-1">
                  <!-- Activos -->
                  <div>
                    <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Total Activos: $ {{ dashboardGerencial()?.estructuraPatrimonial?.totalActivos | number:'1.0-0' }}</span>
                      <span class="text-blue-700">Corriente {{ dashboardGerencial()?.estructuraPatrimonial?.porcentajeActivoCorriente }}% · No Corriente {{ dashboardGerencial()?.estructuraPatrimonial?.porcentajeActivoNoCorriente }}%</span>
                    </div>
                    <div class="w-full bg-slate-100 h-6 rounded-lg flex overflow-hidden p-0.5 border border-slate-200 shadow-2xs">
                      <div
                        class="bg-blue-600 h-full rounded-l-md flex items-center justify-center text-[10px] text-white font-bold transition-all"
                        [style.width.%]="dashboardGerencial()?.estructuraPatrimonial?.porcentajeActivoCorriente || 50"
                        [title]="'Activo Corriente: $' + (dashboardGerencial()?.estructuraPatrimonial?.activoCorriente | number:'1.0-0')"
                      >
                        Corriente ({{ dashboardGerencial()?.estructuraPatrimonial?.porcentajeActivoCorriente }}%)
                      </div>
                      <div
                        class="bg-indigo-400 h-full rounded-r-md flex items-center justify-center text-[10px] text-white font-bold transition-all"
                        [style.width.%]="dashboardGerencial()?.estructuraPatrimonial?.porcentajeActivoNoCorriente || 50"
                        [title]="'Activo No Corriente: $' + (dashboardGerencial()?.estructuraPatrimonial?.activoNoCorriente | number:'1.0-0')"
                      >
                        Fijo ({{ dashboardGerencial()?.estructuraPatrimonial?.porcentajeActivoNoCorriente }}%)
                      </div>
                    </div>
                  </div>

                  <!-- Pasivo + Patrimonio (Financiación) -->
                  <div>
                    <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Pasivos + Patrimonio: $ {{ (dashboardGerencial()?.estructuraPatrimonial?.totalPasivos + dashboardGerencial()?.estructuraPatrimonial?.patrimonio) | number:'1.0-0' }}</span>
                      <span class="text-purple-700">Pasivo {{ dashboardGerencial()?.estructuraPatrimonial?.porcentajePasivo }}% · Patrimonio {{ dashboardGerencial()?.estructuraPatrimonial?.porcentajePatrimonio }}%</span>
                    </div>
                    <div class="w-full bg-slate-100 h-6 rounded-lg flex overflow-hidden p-0.5 border border-slate-200 shadow-2xs">
                      <div
                        class="bg-rose-500 h-full rounded-l-md flex items-center justify-center text-[10px] text-white font-bold transition-all"
                        [style.width.%]="dashboardGerencial()?.estructuraPatrimonial?.porcentajePasivo || 25"
                        [title]="'Pasivos: $' + (dashboardGerencial()?.estructuraPatrimonial?.totalPasivos | number:'1.0-0')"
                      >
                        Pasivo ({{ dashboardGerencial()?.estructuraPatrimonial?.porcentajePasivo }}%)
                      </div>
                      <div
                        class="bg-emerald-600 h-full rounded-r-md flex items-center justify-center text-[10px] text-white font-bold transition-all"
                        [style.width.%]="dashboardGerencial()?.estructuraPatrimonial?.porcentajePatrimonio || 75"
                        [title]="'Patrimonio Institucional: $' + (dashboardGerencial()?.estructuraPatrimonial?.patrimonio | number:'1.0-0')"
                      >
                        Patrimonio ({{ dashboardGerencial()?.estructuraPatrimonial?.porcentajePatrimonio }}%)
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Detalle en cuadrícula de 3 columnas -->
                <div class="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div class="bg-blue-50/70 border border-blue-100 p-2.5 rounded-xl">
                    <span class="text-blue-700 font-bold block">Activos</span>
                    <strong class="font-mono text-slate-800">$ {{ dashboardGerencial()?.estructuraPatrimonial?.totalActivos | number:'1.0-0' }}</strong>
                  </div>
                  <div class="bg-rose-50/70 border border-rose-100 p-2.5 rounded-xl">
                    <span class="text-rose-700 font-bold block">Pasivos</span>
                    <strong class="font-mono text-slate-800">$ {{ dashboardGerencial()?.estructuraPatrimonial?.totalPasivos | number:'1.0-0' }}</strong>
                  </div>
                  <div class="bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl">
                    <span class="text-emerald-700 font-bold block">Patrimonio</span>
                    <strong class="font-mono text-slate-800">$ {{ dashboardGerencial()?.estructuraPatrimonial?.patrimonio | number:'1.0-0' }}</strong>
                  </div>
                </div>
              </div>

              <!-- Gráfica 3: Tendencia de Flujo de Efectivo (NIC 7) -->
              <div class="chart-container-card space-y-3" data-testid="seccion-flujo-tendencia">
                <div class="pb-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span>💵</span>
                      <span>Flujo de Efectivo & Disponible (NIC 7)</span>
                    </h4>
                    <p class="text-xs text-slate-500 mt-0.5">Entradas vs Salidas efectivas en Caja y Bancos (Cuentas 11)</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="legend-chip">
                      <span class="legend-dot" style="background: #06b6d4;"></span>
                      <span>Entradas</span>
                    </div>
                    <div class="legend-chip">
                      <span class="legend-dot" style="background: #ea580c;"></span>
                      <span>Salidas</span>
                    </div>
                  </div>
                </div>

                <!-- Barras de Flujo Mensual -->
                <div class="chart-bars-wrap !h-[145px]" data-testid="contenedor-barras-flujo">
                  @for (f of dashboardGerencial()?.resumenMensual; track f.mes) {
                    <div
                      class="chart-bar-group"
                      [title]="f.mesNombre + ':\nEntradas: $' + (f.entradasEfectivo | number:'1.0-0') + '\nSalidas: $' + (f.salidasEfectivo | number:'1.0-0') + '\nNeto Mes: $' + (f.flujoDisponible | number:'1.0-0')"
                    >
                      <div class="chart-bar-columns">
                        <div
                          class="bar-col bar-col-flujo-in"
                          [style.height.%]="calcularPorcentajeBarra(f.entradasEfectivo, maxFlujo())"
                        ></div>
                        <div
                          class="bar-col bar-col-flujo-out"
                          [style.height.%]="calcularPorcentajeBarra(f.salidasEfectivo, maxFlujo())"
                        ></div>
                      </div>
                      <span class="chart-month-label">{{ f.mesNombre }}</span>
                    </div>
                  }
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div class="bg-cyan-50/70 border border-cyan-100 p-2 rounded-lg flex justify-between items-center">
                    <span class="text-cyan-800 font-semibold">Total Entradas Efectivas:</span>
                    <strong class="font-mono text-cyan-900">$ {{ (dashboardGerencial()?.totalesAnuales?.totalIngresos || 0) | number:'1.0-0' }}</strong>
                  </div>
                  <div class="bg-orange-50/70 border border-orange-100 p-2 rounded-lg flex justify-between items-center">
                    <span class="text-orange-800 font-semibold">Total Salidas Efectivas:</span>
                    <strong class="font-mono text-orange-900">$ {{ ((dashboardGerencial()?.totalesAnuales?.totalGastos || 0) + (dashboardGerencial()?.totalesAnuales?.totalCostos || 0)) | number:'1.0-0' }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Gráfica 4: Control & Ejecución Presupuestal Global -->
            <div class="chart-container-card space-y-3" data-testid="seccion-ejecucion-presupuestal-dashboard">
              <div class="pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span>🎯</span>
                    <span>Ejecución Presupuestal Global vs Contabilidad Real</span>
                  </h4>
                  <p class="text-xs text-slate-500 mt-0.5">Metas aprobadas por Consejo Directivo vs Recaudo y Giros ejecutados</p>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="badge-mini font-bold px-2.5 py-0.5 rounded text-xs inline-flex items-center gap-1"
                    [class.bg-emerald-100]="dashboardGerencial()?.ejecucionPresupuestal?.semaforo === 'VERDE'"
                    [class.text-emerald-800]="dashboardGerencial()?.ejecucionPresupuestal?.semaforo === 'VERDE'"
                    [class.bg-amber-100]="dashboardGerencial()?.ejecucionPresupuestal?.semaforo === 'AMARILLO'"
                    [class.text-amber-800]="dashboardGerencial()?.ejecucionPresupuestal?.semaforo === 'AMARILLO'"
                    [class.bg-rose-100]="dashboardGerencial()?.ejecucionPresupuestal?.semaforo === 'ROJO'"
                    [class.text-rose-800]="dashboardGerencial()?.ejecucionPresupuestal?.semaforo === 'ROJO'"
                    data-testid="badge-semaforo-presupuesto-dashboard"
                  >
                    <span>●</span>
                    <span>Semáforo de Gasto: {{ dashboardGerencial()?.ejecucionPresupuestal?.semaforo }}</span>
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Barra Ingresos Presupuestados vs Recaudados -->
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-blue-900">📥 Recaudo de Ingresos</span>
                    <span class="font-mono font-bold text-blue-700">{{ dashboardGerencial()?.ejecucionPresupuestal?.porcentajeIngresos }}% ejecutado</span>
                  </div>
                  <div class="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      class="bg-blue-600 h-full rounded-full transition-all duration-500"
                      [style.width.%]="Math.min(100, dashboardGerencial()?.ejecucionPresupuestal?.porcentajeIngresos || 0)"
                    ></div>
                  </div>
                  <div class="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Recaudado: $ {{ dashboardGerencial()?.ejecucionPresupuestal?.ingresosRecaudados | number:'1.0-0' }}</span>
                    <span>Meta: $ {{ dashboardGerencial()?.ejecucionPresupuestal?.ingresosPresupuestados | number:'1.0-0' }}</span>
                  </div>
                </div>

                <!-- Barra Gastos Presupuestados vs Pagados -->
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-rose-900">📤 Ejecución de Gastos</span>
                    <span class="font-mono font-bold text-rose-700">{{ dashboardGerencial()?.ejecucionPresupuestal?.porcentajeGastos }}% ejecutado</span>
                  </div>
                  <div class="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [class.bg-emerald-500]="(dashboardGerencial()?.ejecucionPresupuestal?.porcentajeGastos || 0) <= 85"
                      [class.bg-amber-500]="(dashboardGerencial()?.ejecucionPresupuestal?.porcentajeGastos || 0) > 85 && (dashboardGerencial()?.ejecucionPresupuestal?.porcentajeGastos || 0) <= 100"
                      [class.bg-rose-600]="(dashboardGerencial()?.ejecucionPresupuestal?.porcentajeGastos || 0) > 100"
                      [style.width.%]="Math.min(100, dashboardGerencial()?.ejecucionPresupuestal?.porcentajeGastos || 0)"
                    ></div>
                  </div>
                  <div class="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Pagado: $ {{ dashboardGerencial()?.ejecucionPresupuestal?.gastosPagados | number:'1.0-0' }}</span>
                    <span>Apropiación: $ {{ dashboardGerencial()?.ejecucionPresupuestal?.gastosPresupuestados | number:'1.0-0' }}</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ─── 1. BALANCE GENERAL ─────────────────────────────────────────── -->
      @if (reporteActivo() === 'balance') {
        <div data-testid="seccion-balance-general" class="space-y-4">
          <!-- FILTROS SUPERIORES COMPACTOS -->
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">🏛️</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title">Parámetros del Balance General</h3>
                  <p class="reportes-card-subtitle">Corte contable oficial NIIF para Pymes (Decreto 2420)</p>
                </div>
              </div>
              <div class="reportes-info-badge text-blue-800 bg-blue-50/80 border border-blue-200/70">
                <span>ℹ️</span>
                <span><strong>Ecuación Patrimonial:</strong> Activo = Pasivo + Patrimonio. Valida saldos acumulados al corte.</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Fecha de Corte *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-balance-fecha-corte"
                  type="text"
                  appFlatpickr
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="balanceFechaCorte"
                />
              </div>

              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-generar-balance"
                (click)="generarBalance()"
                [disabled]="cargando()"
              >
                {{ cargando() ? 'Generando...' : '📊 Generar Balance' }}
              </button>

              @if (balance()) {
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-excel-balance"
                  (click)="exportarExcel('balance-general')"
                >
                  ⬇ Exportar Excel
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-pdf-balance"
                  (click)="exportarPdf('balance-general')"
                >
                  🖨 Exportar PDF
                </button>
              }
            </div>
          </div>

          <!-- RESULTADOS A TODO EL ANCHO -->
          <div class="w-full">
            @if (cargando()) {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-slate-500">
                <div class="spinner mb-3"></div>
                <span class="text-xs font-semibold">Consolidando Balance General...</span>
              </div>
            } @else if (balance()) {
              <!-- KPIs Balance General Estilo NIIF 15 -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4" data-testid="kpis-balance">
                <div class="stat-card border-blue-500">
                  <div class="stat-label">
                    <span style="color: #1d4ed8;">Total Activos</span>
                    <span class="text-sm">🏛️</span>
                  </div>
                  <div class="stat-value text-blue-700 font-mono">$ {{ balance()!.totalActivos | number:'1.2-2' }}</div>
                  <div class="stat-footer" style="color: #3b82f6;">Bienes y derechos (Clase 1)</div>
                </div>
                <div class="stat-card border-red-500">
                  <div class="stat-label">
                    <span style="color: #b91c1c;">Total Pasivos</span>
                    <span class="text-sm">📋</span>
                  </div>
                  <div class="stat-value text-red-600 font-mono">$ {{ balance()!.totalPasivos | number:'1.2-2' }}</div>
                  <div class="stat-footer" style="color: #ef4444;">Obligaciones con terceros (Clase 2)</div>
                </div>
                <div class="stat-card border-purple-500">
                  <div class="stat-label">
                    <span style="color: #6b21a8;">Total Patrimonio</span>
                    <span class="text-sm">🛡️</span>
                  </div>
                  <div class="stat-value text-purple-700 font-mono">$ {{ balance()!.totalPatrimonio | number:'1.2-2' }}</div>
                  <div class="stat-footer" style="color: #a855f7;">Fondos y reservas (Clase 3)</div>
                </div>
                <div
                  class="stat-card"
                  [class.border-green-500]="balance()!.cuadra"
                  [class.border-red-500]="!balance()!.cuadra"
                >
                  <div class="stat-label">
                    <span [style.color]="balance()!.cuadra ? '#047857' : '#be123c'">Ecuación Patrimonial</span>
                    <span class="text-sm">{{ balance()!.cuadra ? '⚖️' : '⚠️' }}</span>
                  </div>
                  <div
                    class="stat-value"
                    [class.text-green-600]="balance()!.cuadra"
                    [class.text-red-600]="!balance()!.cuadra"
                  >
                    {{ balance()!.cuadra ? '✓ CUADRA' : '✗ DESCUADRADO' }}
                  </div>
                  <div class="stat-footer" [style.color]="balance()!.cuadra ? '#059669' : '#e11d48'">
                    {{ balance()!.cuadra ? 'Activo = Pasivo + Patrimonio' : 'Existe descuadre aritmético' }}
                  </div>
                </div>
              </div>

              <!-- Tablas ACTIVOS / PASIVOS+PATRIMONIO a todo el ancho -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <h4 class="font-bold mb-2 text-blue-800 text-xs">ACTIVOS (Clase 1)</h4>
                  <ng-container *ngTemplateOutlet="tablaBalance; context: { $implicit: balance()!.activos, total: balance()!.totalActivos }"></ng-container>
                </div>
                <div class="card p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
                  <div>
                    <h4 class="font-bold mb-2 text-red-800 text-xs">PASIVOS (Clase 2)</h4>
                    <ng-container *ngTemplateOutlet="tablaBalance; context: { $implicit: balance()!.pasivos, total: balance()!.totalPasivos }"></ng-container>
                  </div>
                  <div>
                    <h4 class="font-bold mb-2 text-purple-800 text-xs">PATRIMONIO (Clase 3)</h4>
                    <ng-container *ngTemplateOutlet="tablaBalance; context: { $implicit: balance()!.patrimonio, total: balance()!.totalPatrimonio }"></ng-container>
                  </div>
                </div>
              </div>
            } @else {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-center text-slate-400">
                <div class="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-2xl mb-3 text-blue-600">
                  🏛️
                </div>
                <h4 class="font-bold text-slate-700 text-sm mb-1">Balance General Listo para Generar</h4>
                <p class="text-xs text-slate-500 max-w-md">
                  Seleccione la fecha de corte en los filtros superiores y presione "Generar Balance" para calcular los activos, pasivos y patrimonio.
                </p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ─── 2. ESTADO DE RESULTADOS (PyG) ──────────────────────────────── -->
      @if (reporteActivo() === 'pyg') {
        <div data-testid="seccion-pyg" class="space-y-4">
          <!-- FILTROS SUPERIORES COMPACTOS -->
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">📈</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title">Parámetros de Estado de Resultados</h3>
                  <p class="reportes-card-subtitle">Pérdidas y Ganancias del periodo contable</p>
                </div>
              </div>
              <div class="reportes-info-badge text-emerald-800 bg-emerald-50/80 border border-emerald-200/70">
                <span>ℹ️</span>
                <span><strong>Clasificación NIIF Pymes:</strong> Ingresos (Clase 4) menos Gastos (Clase 5) y Costos (Clase 6).</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Desde *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-pyg-desde"
                  type="text"
                  appFlatpickr
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="pygDesde"
                />
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Hasta *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-pyg-hasta"
                  type="text"
                  appFlatpickr
                  [minDate]="pygDesde"
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="pygHasta"
                />
              </div>

              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-generar-pyg"
                (click)="generarPyg()"
                [disabled]="cargando()"
              >
                {{ cargando() ? 'Generando...' : '📊 Generar PyG' }}
              </button>

              @if (pyg()) {
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-excel-pyg"
                  (click)="exportarExcel('estado-resultados')"
                >
                  ⬇ Exportar Excel
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-pdf-pyg"
                  (click)="exportarPdf('estado-resultados')"
                >
                  🖨 Exportar PDF
                </button>
              }
            </div>
          </div>

          <!-- RESULTADOS A TODO EL ANCHO -->
          <div class="w-full">
            @if (cargando()) {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-slate-500">
                <div class="spinner mb-3"></div>
                <span class="text-xs font-semibold">Generando Estado de Resultados...</span>
              </div>
            } @else if (pyg()) {
              <!-- KPIs Estado de Resultados Estilo NIIF 15 -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4" data-testid="kpis-pyg">
                <div class="stat-card border-green-500">
                  <div class="stat-label">
                    <span style="color: #047857;">Total Ingresos</span>
                    <span class="text-sm">📈</span>
                  </div>
                  <div class="stat-value text-green-600 font-mono">$ {{ pyg()!.totalIngresos | number:'1.2-2' }}</div>
                  <div class="stat-footer" style="color: #059669;">Ingresos operativos (Clase 4)</div>
                </div>
                <div class="stat-card border-red-500">
                  <div class="stat-label">
                    <span style="color: #b91c1c;">Total Gastos</span>
                    <span class="text-sm">📉</span>
                  </div>
                  <div class="stat-value text-red-600 font-mono">$ {{ pyg()!.totalGastos | number:'1.2-2' }}</div>
                  <div class="stat-footer" style="color: #ef4444;">Gastos y costos (Clase 5/6)</div>
                </div>
                <div
                  class="stat-card"
                  [class.border-green-500]="pyg()!.excedente >= 0"
                  [class.border-red-500]="pyg()!.excedente < 0"
                >
                  <div class="stat-label">
                    <span [style.color]="pyg()!.excedente >= 0 ? '#047857' : '#be123c'">{{ pyg()!.excedente >= 0 ? 'Excedente Neto' : 'Déficit del Ejercicio' }}</span>
                    <span class="text-sm">{{ pyg()!.excedente >= 0 ? '💰' : '⚠️' }}</span>
                  </div>
                  <div
                    class="stat-value font-mono"
                    [class.text-green-600]="pyg()!.excedente >= 0"
                    [class.text-red-600]="pyg()!.excedente < 0"
                  >
                    $ {{ pyg()!.excedente | number:'1.2-2' }}
                  </div>
                  <div class="stat-footer" [style.color]="pyg()!.excedente >= 0 ? '#059669' : '#e11d48'">
                    {{ pyg()!.excedente >= 0 ? 'Resultado positivo del periodo' : 'Requiere medidas de optimización' }}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <h4 class="font-bold mb-2 text-green-800 text-xs">INGRESOS EDUCATIVOS (Clase 4)</h4>
                  <ng-container *ngTemplateOutlet="tablaBalance; context: { $implicit: pyg()!.ingresos, total: pyg()!.totalIngresos }"></ng-container>
                </div>
                <div class="card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <h4 class="font-bold mb-2 text-red-800 text-xs">GASTOS Y COSTOS OPERACIONALES</h4>
                  <ng-container *ngTemplateOutlet="tablaBalance; context: { $implicit: pyg()!.gastos, total: pyg()!.totalGastos }"></ng-container>
                </div>
              </div>
            } @else {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-center text-slate-400">
                <div class="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-2xl mb-3 text-emerald-600">
                  📈
                </div>
                <h4 class="font-bold text-slate-700 text-sm mb-1">Estado de Resultados Listo para Generar</h4>
                <p class="text-xs text-slate-500 max-w-md">
                  Indique las fechas de inicio y fin en los filtros superiores y presione "Generar PyG" para ver la utilidad o excedente neto.
                </p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ─── 3. LIBRO DIARIO ────────────────────────────────────────────── -->
      @if (reporteActivo() === 'diario') {
        <div data-testid="seccion-libro-diario" class="space-y-4">
          <!-- FILTROS SUPERIORES COMPACTOS -->
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">📋</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title">Parámetros del Libro Diario</h3>
                  <p class="reportes-card-subtitle">Registro cronológico fidedigno de operaciones contables</p>
                </div>
              </div>
              <div class="reportes-info-badge text-amber-800 bg-amber-50/80 border border-amber-200/70">
                <span>ℹ️</span>
                <span><strong>Partida Doble:</strong> Cronología de comprobantes (CAU, ING, EGR, NOT) con sumas iguales.</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Desde *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-diario-desde"
                  type="text"
                  appFlatpickr
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="desdeFiltro"
                />
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Hasta *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-diario-hasta"
                  type="text"
                  appFlatpickr
                  [minDate]="desdeFiltro"
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="hastaFiltro"
                />
              </div>

              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-generar-diario"
                (click)="generarDiario()"
                [disabled]="cargando()"
              >
                {{ cargando() ? 'Cargando...' : '📋 Consultar Diario' }}
              </button>

              @if (libroDiario().length > 0) {
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-excel-diario"
                  (click)="exportarExcel('libro-diario')"
                >
                  ⬇ Exportar Excel
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-pdf-diario"
                  (click)="exportarPdf('libro-diario')"
                >
                  🖨 Exportar PDF
                </button>
              }
            </div>
          </div>

          <!-- RESULTADOS A TODO EL ANCHO -->
          <div class="card p-5 bg-white border border-slate-200 rounded-xl shadow-xs w-full">
            @if (cargando()) {
              <div class="flex flex-col items-center justify-center py-16 text-slate-500">
                <div class="spinner mb-3"></div>
                <span class="text-xs font-semibold">Cargando movimientos del Libro Diario...</span>
              </div>
            } @else {
              <div class="tabla-base overflow-auto max-h-[560px] w-full" data-testid="tabla-diario-container">
                <table class="tabla-datos w-full text-xs" data-testid="tabla-diario">
                  <thead>
                    <tr>
                      <th class="w-24">Fecha</th>
                      <th class="w-16">Tipo</th>
                      <th class="w-20">Consec.</th>
                      <th class="w-48">Concepto</th>
                      <th class="w-28">Cuenta</th>
                      <th>Nombre Cuenta</th>
                      <th>Tercero</th>
                      <th class="w-28 text-right">Débito</th>
                      <th class="w-28 text-right">Crédito</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of libroDiario(); track $index) {
                      <tr class="border-b hover:bg-gray-50/50">
                        <td class="font-mono">{{ row.fecha }}</td>
                        <td><span class="badge-gray font-mono">{{ row.tipo }}</span></td>
                        <td class="font-mono">{{ row.consecutivo }}</td>
                        <td class="truncate max-w-[200px]" [title]="row.concepto">{{ row.concepto }}</td>
                        <td class="font-mono">{{ row.codigoCuenta }}</td>
                        <td>{{ row.nombreCuenta }}</td>
                        <td class="truncate max-w-[180px]" [title]="row.terceroNombre || ''">{{ row.terceroNombre || '—' }}</td>
                        <td class="text-right font-mono">{{ row.debito | number:'1.2-2' }}</td>
                        <td class="text-right font-mono">{{ row.credito | number:'1.2-2' }}</td>
                      </tr>
                    }
                    @if (libroDiario().length === 0 && !cargando()) {
                      <tr class="empty-row">
                        <td colspan="9" class="text-center py-8 text-gray-400">
                          Sin registros en el periodo seleccionado.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <div class="flex justify-end gap-6 mt-3 text-xs font-semibold font-mono border-t pt-2" data-testid="totales-diario">
                <span>Total Débitos: <strong>{{ totalDiarioDB() | number:'1.2-2' }}</strong></span>
                <span>Total Créditos: <strong>{{ totalDiarioCR() | number:'1.2-2' }}</strong></span>
              </div>
            }
          </div>
        </div>
      }

      <!-- ─── 4. LIBRO MAYOR Y BALANCES ──────────────────────────────────── -->
      @if (reporteActivo() === 'mayor') {
        <div data-testid="seccion-libro-mayor" class="space-y-4">
          <!-- FILTROS SUPERIORES COMPACTOS -->
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">📒</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title">Parámetros de Libro Mayor</h3>
                  <p class="reportes-card-subtitle">Saldos iniciales, débitos, créditos y saldos finales por cuenta</p>
                </div>
              </div>
              <div class="reportes-info-badge text-indigo-800 bg-indigo-50/80 border border-indigo-200/70">
                <span>ℹ️</span>
                <span><strong>Estructura Mayor:</strong> Consolida saldo inicial, débitos, créditos y saldo final por cuenta.</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Desde *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-mayor-desde"
                  type="text"
                  appFlatpickr
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="desdeFiltro"
                />
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Hasta *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-mayor-hasta"
                  type="text"
                  appFlatpickr
                  [minDate]="desdeFiltro"
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="hastaFiltro"
                />
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Prefijo Cuenta</label>
                <input
                  class="input-base input-sm w-code font-mono"
                  data-testid="input-mayor-cuenta"
                  [(ngModel)]="mayorCuenta"
                  placeholder="ej: 130"
                />
              </div>

              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-generar-mayor"
                (click)="generarMayor()"
                [disabled]="cargando()"
              >
                {{ cargando() ? 'Cargando...' : '📒 Consultar Mayor' }}
              </button>

              @if (libroMayor().length > 0) {
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-excel-mayor"
                  (click)="exportarExcel('libro-mayor')"
                >
                  ⬇ Exportar Excel
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-pdf-mayor"
                  (click)="exportarPdf('libro-mayor')"
                >
                  🖨 Exportar PDF
                </button>
              }
            </div>
          </div>

          <!-- RESULTADOS A TODO EL ANCHO -->
          <div class="w-full">
            @if (cargando()) {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-slate-500">
                <div class="spinner mb-3"></div>
                <span class="text-xs font-semibold">Calculando Libro Mayor y Balances...</span>
              </div>
            } @else if (libroMayor().length > 0) {
              <div class="space-y-4">
                @for (cuenta of libroMayor(); track cuenta.codigoCuenta) {
                  <div class="card p-0 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs" [attr.data-testid]="'card-mayor-' + cuenta.codigoCuenta">
                    <div class="bg-gray-50 px-4 py-3 flex items-center justify-between border-b text-xs">
                      <div>
                        <span class="font-mono font-bold text-gray-900 text-sm">{{ cuenta.codigoCuenta }}</span>
                        <span class="ml-2 font-medium text-gray-800 text-sm">{{ cuenta.nombreCuenta }}</span>
                        <span class="ml-4 text-gray-500 font-mono">Saldo inicial: {{ cuenta.saldoInicial | number:'1.2-2' }}</span>
                      </div>
                      <div
                        class="font-semibold font-mono text-sm"
                        [class.text-green-600]="cuenta.saldoFinal >= 0"
                        [class.text-red-500]="cuenta.saldoFinal < 0"
                      >
                        Saldo Final: {{ cuenta.saldoFinal | number:'1.2-2' }}
                      </div>
                    </div>
                    <div class="overflow-auto max-h-56">
                      <table class="tabla-datos w-full text-xs">
                        <thead>
                          <tr>
                            <th class="w-24">Fecha</th>
                            <th class="w-16">Tipo</th>
                            <th>Concepto</th>
                            <th class="w-28 text-right">Débito</th>
                            <th class="w-28 text-right">Crédito</th>
                            <th class="w-28 text-right">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (m of cuenta.movimientos; track $index) {
                            <tr class="border-b hover:bg-gray-50/50">
                              <td class="font-mono">{{ m.fecha }}</td>
                              <td class="font-mono">{{ m.tipo }}</td>
                              <td class="truncate max-w-[280px]" [title]="m.concepto">{{ m.concepto }}</td>
                              <td class="text-right font-mono">{{ m.debito | number:'1.2-2' }}</td>
                              <td class="text-right font-mono">{{ m.credito | number:'1.2-2' }}</td>
                              <td class="text-right font-mono font-semibold">{{ m.saldoAcumulado | number:'1.2-2' }}</td>
                            </tr>
                          }
                        </tbody>
                        <tfoot>
                          <tr class="font-bold bg-gray-50">
                            <td colspan="3" class="text-right py-2 px-3">TOTALES:</td>
                            <td class="text-right font-mono py-2 px-3">{{ cuenta.totalDebitos | number:'1.2-2' }}</td>
                            <td class="text-right font-mono py-2 px-3">{{ cuenta.totalCreditos | number:'1.2-2' }}</td>
                            <td class="text-right font-mono py-2 px-3">{{ cuenta.saldoFinal | number:'1.2-2' }}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-center text-slate-400">
                <div class="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-2xl mb-3 text-indigo-600">
                  📒
                </div>
                <h4 class="font-bold text-slate-700 text-sm mb-1">Libro Mayor Listo para Consultar</h4>
                <p class="text-xs text-slate-500 max-w-md">
                  Indique las fechas de consulta y opcionalmente un prefijo de cuenta en los filtros superiores para ver los movimientos y saldos finales.
                </p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ─── 5. AUXILIAR POR TERCERO ────────────────────────────────────── -->
      @if (reporteActivo() === 'auxiliar') {
        <div data-testid="seccion-auxiliar-tercero" class="space-y-4">
          <!-- FILTROS SUPERIORES COMPACTOS -->
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">👤</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title">Parámetros de Auxiliar por Tercero</h3>
                  <p class="reportes-card-subtitle">Detalle de movimientos imputados a un tercero o cuenta</p>
                </div>
              </div>
              <div class="reportes-info-badge text-purple-800 bg-purple-50/80 border border-purple-200/70">
                <span>ℹ️</span>
                <span><strong>Auditoría por NIT:</strong> Rastreo de comprobantes imputados a padres, proveedores o empleados.</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Desde *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-auxiliar-desde"
                  type="text"
                  appFlatpickr
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="desdeFiltro"
                />
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Hasta *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-auxiliar-hasta"
                  type="text"
                  appFlatpickr
                  [minDate]="desdeFiltro"
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="hastaFiltro"
                />
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Tercero</label>
                <select
                  class="input-base input-sm w-select-md"
                  data-testid="select-auxiliar-tercero"
                  [(ngModel)]="terceroFiltroId"
                >
                  <option value="">Todos los terceros</option>
                  @for (t of terceros(); track t.id) {
                    <option [value]="t.id">{{ t.numeroIdentificacion }} — {{ t.nombreCompleto || t.razonSocial }}</option>
                  }
                </select>
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Cuenta PUC</label>
                <input
                  class="input-base input-sm w-code font-mono"
                  data-testid="input-auxiliar-cuenta"
                  [(ngModel)]="auxiliarCuentaCodigo"
                  placeholder="ej: 130505"
                />
              </div>

              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-generar-auxiliar"
                (click)="generarAuxiliar()"
                [disabled]="cargando()"
              >
                {{ cargando() ? 'Cargando...' : '👤 Consultar Auxiliar' }}
              </button>

              @if (auxiliarTercero()) {
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-excel-auxiliar"
                  (click)="exportarExcel('auxiliar-tercero')"
                >
                  ⬇ Exportar Excel
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-pdf-auxiliar"
                  (click)="exportarPdf('auxiliar-tercero')"
                >
                  🖨 Exportar PDF
                </button>
              }
            </div>
          </div>

          <!-- RESULTADOS A TODO EL ANCHO -->
          <div class="w-full">
            @if (cargando()) {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-slate-500">
                <div class="spinner mb-3"></div>
                <span class="text-xs font-semibold">Consultando auxiliar por tercero...</span>
              </div>
            } @else if (auxiliarTercero()) {
              <div class="card p-0 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs" data-testid="card-auxiliar-resultado">
                <div class="bg-gray-50 px-4 py-3 border-b flex justify-between items-center text-xs">
                  <div>
                    <strong class="text-gray-900 text-sm">{{ auxiliarTercero()!.terceroNombre }}</strong>
                    <span class="ml-3 font-mono text-gray-600">NIT: {{ auxiliarTercero()!.numeroIdentificacion }}</span>
                  </div>
                  <div class="font-mono font-bold text-sm text-blue-700">
                    Saldo Final: {{ auxiliarTercero()!.saldoFinal | number:'1.2-2' }}
                  </div>
                </div>
                <div class="overflow-auto max-h-[500px]">
                  <table class="tabla-datos w-full text-xs">
                    <thead>
                      <tr>
                        <th class="w-24">Fecha</th>
                        <th class="w-28">Comprobante</th>
                        <th class="w-24">Cuenta</th>
                        <th>Nombre Cuenta</th>
                        <th>Concepto</th>
                        <th class="w-28 text-right">Débito</th>
                        <th class="w-28 text-right">Crédito</th>
                        <th class="w-28 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (m of auxiliarTercero()!.movimientos; track $index) {
                        <tr class="border-b hover:bg-gray-50/50">
                          <td class="font-mono">{{ m.fecha }}</td>
                          <td class="font-mono">{{ m.comprobante }}</td>
                          <td class="font-mono">{{ m.cuentaCodigo }}</td>
                          <td>{{ m.cuentaNombre }}</td>
                          <td class="truncate max-w-[240px]" [title]="m.concepto">{{ m.concepto }}</td>
                          <td class="text-right font-mono">{{ m.debito | number:'1.2-2' }}</td>
                          <td class="text-right font-mono">{{ m.credito | number:'1.2-2' }}</td>
                          <td class="text-right font-mono font-semibold">{{ m.saldoAcumulado | number:'1.2-2' }}</td>
                        </tr>
                      }
                      @if (!auxiliarTercero()?.movimientos || auxiliarTercero()!.movimientos.length === 0) {
                        <tr>
                          <td colspan="8" class="text-center py-8 text-gray-400">
                            Sin movimientos para este tercero en el periodo seleccionado.
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot>
                      <tr class="font-bold bg-gray-50">
                        <td colspan="5" class="text-right py-2 px-3">TOTALES:</td>
                        <td class="text-right font-mono py-2 px-3">{{ auxiliarTercero()!.totalDebito | number:'1.2-2' }}</td>
                        <td class="text-right font-mono py-2 px-3">{{ auxiliarTercero()!.totalCredito | number:'1.2-2' }}</td>
                        <td class="text-right font-mono py-2 px-3">{{ auxiliarTercero()!.saldoFinal | number:'1.2-2' }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            } @else {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-center text-slate-400">
                <div class="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-2xl mb-3 text-purple-600">
                  👤
                </div>
                <h4 class="font-bold text-slate-700 text-sm mb-1">Auxiliar por Tercero Listo para Consultar</h4>
                <p class="text-xs text-slate-500 max-w-md">
                  Indique el periodo y opcionalmente el tercero o cuenta PUC en los filtros superiores para auditar los registros detallados.
                </p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ─── 6. CERTIFICADOS TRIBUTARIOS ESCOLARES ──────────────────────── -->
      @if (reporteActivo() === 'certificados') {
        <div data-testid="seccion-certificados-tributarios" class="space-y-4">
          <!-- FILTROS SUPERIORES COMPACTOS -->
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">📜</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title">Certificados Tributarios Escolares</h3>
                  <p class="reportes-card-subtitle">Certificado oficial de pagos Art. 387 E.T. (Deducción por Dependientes)</p>
                </div>
              </div>
              <div class="reportes-info-badge text-teal-800 bg-teal-50/80 border border-teal-200/70">
                <span>ℹ️</span>
                <span><strong>Art. 387 E.T.:</strong> Constancia oficial de matrícula y pensión canceladas para declaración de renta.</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Año Gravable *</label>
                <input
                  class="input-base input-sm w-year"
                  data-testid="input-cert-anio"
                  type="number"
                  [(ngModel)]="certAnio"
                />
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Estudiante (ID o Doc) *</label>
                <input
                  class="input-base input-sm w-select-md"
                  data-testid="input-cert-estudiante"
                  type="text"
                  placeholder="ID o Doc Estudiante"
                  [(ngModel)]="certEstudianteId"
                />
              </div>

              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-consultar-certificado"
                (click)="generarCertificado()"
                [disabled]="cargando()"
              >
                {{ cargando() ? 'Consultando...' : '📜 Consultar' }}
              </button>

              @if (certificado()) {
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-descargar-certificado-pdf"
                  (click)="descargarCertificadoPdf()"
                >
                  🖨 Descargar PDF
                </button>
              }
            </div>
          </div>

          <!-- RESULTADOS A TODO EL ANCHO -->
          <div class="w-full">
            @if (cargando()) {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-slate-500">
                <div class="spinner mb-3"></div>
                <span class="text-xs font-semibold">Generando Certificado Tributario...</span>
              </div>
            } @else if (certificado()) {
              <div class="card p-5 bg-white border border-blue-200 rounded-xl shadow-xs" data-testid="card-certificado-resumen">
                <div class="flex justify-between items-start mb-4 border-b pb-3">
                  <div>
                    <h3 class="text-sm font-bold text-blue-900">{{ certificado().colegioNombre }}</h3>
                    <span class="text-xs text-gray-500">NIT: {{ certificado().nitColegio }}</span>
                  </div>
                  <span class="badge-success text-xs font-semibold">AÑO GRAVABLE {{ certificado().anioGravable }}</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                  <div>
                    <span class="text-gray-500 block">Estudiante:</span>
                    <strong class="text-gray-900">{{ certificado().estudianteNombre }}</strong> ({{ certificado().documentoEstudiante }})
                  </div>
                  <div>
                    <span class="text-gray-500 block">Acudiente / Responsable:</span>
                    <strong class="text-gray-900">{{ certificado().acudienteNombre }}</strong> ({{ certificado().documentoAcudiente }})
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="tabla-datos w-full text-xs mb-3">
                    <thead class="bg-gray-100">
                      <tr>
                        <th class="text-left py-2 px-3">Concepto Educativo</th>
                        <th class="text-center py-2 px-3">Calidad Tributaria (Art. 387 E.T.)</th>
                        <th class="text-right py-2 px-3">Valor Pagado (COP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (c of certificado().conceptos; track c.concepto) {
                        <tr class="border-b">
                          <td class="py-2 px-3 font-semibold">{{ c.concepto }}</td>
                          <td class="text-center py-2 px-3">
                            <span [class]="c.deducible ? 'badge-success text-xs' : 'badge-neutral text-xs'">
                              {{ c.deducible ? '✔ Deducible' : 'No deducible' }}
                            </span>
                          </td>
                          <td class="text-right font-mono py-2 px-3">{{ c.valor | number:'1.2-2' }}</td>
                        </tr>
                      }
                    </tbody>
                    <tfoot class="bg-gray-50 font-bold border-t">
                      <tr>
                        <td colspan="2" class="text-right py-2 px-3">TOTAL RECAUDADO EN EL AÑO:</td>
                        <td class="text-right font-mono text-blue-800 py-2 px-3">
                          {{ certificado().totalPagado | number:'1.2-2' }}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <p class="text-xs text-gray-500 italic mt-2">
                  {{ certificado().normativa }}
                </p>
              </div>
            } @else {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-center text-slate-400">
                <div class="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-2xl mb-3 text-teal-600">
                  📜
                </div>
                <h4 class="font-bold text-slate-700 text-sm mb-1">Certificado Tributario Listo para Consultar</h4>
                <p class="text-xs text-slate-500 max-w-md">
                  Indique el año gravable y el ID o documento del estudiante en los filtros superiores y presione "Consultar".
                </p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ─── 7. MEDIOS MAGNÉTICOS EXÓGENA DIAN ──────────────────────────── -->
      @if (reporteActivo() === 'exogena') {
        <div data-testid="seccion-exogena-dian" class="space-y-4">
          <!-- FILTROS SUPERIORES COMPACTOS -->
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">🏛️</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title">Parámetros de Medios Magnéticos</h3>
                  <p class="reportes-card-subtitle">Generación y pre-validación de formatos de Información Exógena DIAN</p>
                </div>
              </div>
              <div class="reportes-info-badge text-cyan-800 bg-cyan-50/80 border border-cyan-200/70">
                <span>ℹ️</span>
                <span><strong>Resolución DIAN:</strong> Pre-valida NITs, DV, direcciones y cuantías menores antes del Muisca.</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Año Gravable *</label>
                <input
                  class="input-base input-sm w-year"
                  data-testid="input-exogena-anio"
                  type="number"
                  [(ngModel)]="exogenaAnio"
                />
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Formato DIAN *</label>
                <select
                  class="input-base input-sm w-select-formato-dian"
                  data-testid="select-exogena-formato"
                  [(ngModel)]="exogenaFormato"
                >
                  <option value="1001">1001 — Pagos y Retenciones</option>
                  <option value="1007">1007 — Ingresos Recibidos</option>
                  <option value="1008">1008 — Cuentas por Cobrar</option>
                  <option value="1009">1009 — Cuentas por Pagar</option>
                  <option value="2276">2276 — Rentas de Trabajo</option>
                </select>
              </div>

              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-consultar-exogena"
                (click)="consultarExogena()"
                [disabled]="cargando()"
              >
                {{ cargando() ? 'Generando...' : '📊 Consultar Formato' }}
              </button>
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-validar-exogena"
                (click)="validarExogena()"
                [disabled]="cargando()"
              >
                🔍 Pre-Validar Consistencia
              </button>

              @if (exogenaResultado()) {
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-exogena-excel"
                  (click)="exportarExogenaExcel()"
                >
                  ⬇ Exportar Excel (.xlsx)
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  data-testid="btn-exportar-exogena-xml"
                  (click)="exportarExogenaXml()"
                >
                  🏛 Descargar XML DIAN
                </button>
              }
            </div>
          </div>

          <!-- RESULTADOS A TODO EL ANCHO -->
          <div class="w-full space-y-4">
            @if (cargando()) {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-slate-500">
                <div class="spinner mb-3"></div>
                <span class="text-xs font-semibold">Procesando información exógena DIAN...</span>
              </div>
            } @else {
              <!-- Panel de Pre-validación de consistencia fiscal -->
              @if (exogenaValidacion()) {
                <div class="card p-4 border bg-white rounded-xl shadow-xs" [class.border-green-300]="exogenaValidacion().valido" [class.border-yellow-300]="!exogenaValidacion().valido" data-testid="card-validacion-exogena">
                  <div class="flex justify-between items-center mb-3">
                    <h4 class="text-xs font-bold text-gray-800">Resultado de Pre-Validación Fiscal</h4>
                    <span [class]="exogenaValidacion().valido ? 'badge-success text-xs' : 'badge-warning text-xs'">
                      {{ exogenaValidacion().valido ? '✔ Válido para Presentación' : '⚠️ Alertas Detectadas' }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div class="stat-card border-gray-200">
                      <span class="stat-label">Terceros Auditados</span>
                      <span class="stat-value text-gray-800">{{ exogenaValidacion().totalTercerosAuditados }}</span>
                    </div>
                    <div class="stat-card border-gray-200">
                      <span class="stat-label">Alertas NITs</span>
                      <span class="stat-value text-red-600">{{ exogenaValidacion().alertasNits }}</span>
                    </div>
                    <div class="stat-card border-gray-200">
                      <span class="stat-label">Alertas Direcciones</span>
                      <span class="stat-value text-yellow-600">{{ exogenaValidacion().alertasDirecciones }}</span>
                    </div>
                    <div class="stat-card border-gray-200">
                      <span class="stat-label">Alertas DANE</span>
                      <span class="stat-value text-blue-600">{{ exogenaValidacion().alertasCodigosDane }}</span>
                    </div>
                  </div>
                </div>
              }

              <!-- Vista previa de datos del formato a todo el ancho -->
              @if (exogenaResultado()) {
                <div class="card p-4 bg-white border border-slate-200 rounded-xl shadow-xs w-full" data-testid="card-datos-exogena">
                  <div class="flex justify-between items-center mb-3">
                    <span class="font-bold text-xs">Formato {{ exogenaResultado().formato }} v{{ exogenaResultado().version }} ({{ exogenaResultado().registros }} registros)</span>
                    <span class="text-xs text-gray-500">Año Gravable: {{ exogenaResultado().anio }}</span>
                  </div>
                  <div class="overflow-x-auto max-h-96 w-full">
                    <table class="tabla-datos w-full text-xs">
                      <thead class="bg-gray-100">
                        <tr>
                          @for (col of exogenaResultado().columnas; track col) {
                            <th class="text-left py-1.5 px-2">{{ col }}</th>
                          }
                        </tr>
                      </thead>
                      <tbody>
                        @for (fila of exogenaResultado().datos; track $index) {
                          <tr class="border-b hover:bg-gray-50/50">
                            @for (col of exogenaResultado().columnas; track col) {
                              <td class="py-1.5 px-2 font-mono text-xs">{{ fila[col] }}</td>
                            }
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              @if (!exogenaValidacion() && !exogenaResultado()) {
                <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-center text-slate-400">
                  <div class="w-14 h-14 rounded-full bg-cyan-50 flex items-center justify-center text-2xl mb-3 text-cyan-600">
                    🏛️
                  </div>
                  <h4 class="font-bold text-slate-700 text-sm mb-1">Medios Magnéticos Listos para Generar</h4>
                  <p class="text-xs text-slate-500 max-w-md">
                    Seleccione el año gravable y formato DIAN en los filtros superiores para consultar o pre-validar los registros fiscales.
                  </p>
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- ─── 8. CONTROL PRESUPUESTAL ESCOLAR ───────────────────────────── -->
      @if (reporteActivo() === 'presupuesto') {
        <div data-testid="seccion-presupuesto" class="space-y-4">
          <!-- FILTROS SUPERIORES COMPACTOS -->
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">📊</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title">Parámetros de Control Presupuestal</h3>
                  <p class="reportes-card-subtitle">Seguimiento de ejecución por centros de costo y rubros</p>
                </div>
              </div>
              <div class="reportes-info-badge text-violet-800 bg-violet-50/80 border border-violet-200/70">
                <span>ℹ️</span>
                <span><strong>Gasto Educativo:</strong> Audita ejecución por rubro (Presupuestado vs. Comprometido, Causado y Pagado).</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Vigencia Fiscal *</label>
                <input
                  class="input-base input-sm w-year"
                  data-testid="input-presupuesto-anio"
                  type="number"
                  [(ngModel)]="presupuestoAnio"
                />
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Centro de Costo</label>
                <input
                  class="input-base input-sm w-code"
                  data-testid="input-presupuesto-id"
                  type="text"
                  [(ngModel)]="presupuestoIdSeleccionado"
                  placeholder="pres-1"
                />
              </div>

              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-consultar-presupuesto"
                (click)="consultarPresupuesto()"
                [disabled]="cargando()"
              >
                {{ cargando() ? 'Consultando...' : '📊 Consultar Ejecución' }}
              </button>
            </div>
          </div>

          <!-- RESULTADOS A TODO EL ANCHO -->
          <div class="w-full space-y-4">
            @if (cargando()) {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-slate-500">
                <div class="spinner mb-3"></div>
                <span class="text-xs font-semibold">Consolidando ejecución presupuestal...</span>
              </div>
            } @else if (presupuestoEjecucion()) {
              <!-- KPIs Presupuesto Estilo NIIF 15 -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2" data-testid="kpis-presupuesto">
                <div class="stat-card border-blue-500">
                  <div class="stat-label">
                    <span style="color: #1d4ed8;">Presupuestado</span>
                    <span class="text-sm">📊</span>
                  </div>
                  <div class="stat-value text-blue-700 font-mono">$ {{ presupuestoEjecucion().totales.totalPresupuestado | number:'1.2-2' }}</div>
                  <div class="stat-footer" style="color: #3b82f6;">Meta aprobada del año</div>
                </div>
                <div class="stat-card border-indigo-500">
                  <div class="stat-label">
                    <span style="color: #4338ca;">Causado</span>
                    <span class="text-sm">⚡</span>
                  </div>
                  <div class="stat-value text-indigo-700 font-mono">$ {{ presupuestoEjecucion().totales.totalCausado | number:'1.2-2' }}</div>
                  <div class="stat-footer" style="color: #6366f1;">Comprometido y devengado</div>
                </div>
                <div class="stat-card border-green-500">
                  <div class="stat-label">
                    <span style="color: #047857;">Pagado</span>
                    <span class="text-sm">✅</span>
                  </div>
                  <div class="stat-value text-green-700 font-mono">$ {{ presupuestoEjecucion().totales.totalPagado | number:'1.2-2' }}</div>
                  <div class="stat-footer" style="color: #059669;">Desembolsos ejecutados</div>
                </div>
                <div class="stat-card border-purple-500">
                  <div class="stat-label">
                    <span style="color: #6b21a8;">Desviación</span>
                    <span class="text-sm">🎯</span>
                  </div>
                  <div class="stat-value text-purple-700 font-mono">{{ presupuestoEjecucion().totales.desviacionGlobal }}%</div>
                  <div class="stat-footer" style="color: #7c3aed;">Variación presupuestal</div>
                </div>
              </div>

              <!-- Tabla de Rubros Presupuestales a todo el ancho -->
              <div class="card p-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-auto max-h-[500px] w-full" data-testid="tabla-rubros-presupuesto">
                <h4 class="font-bold text-gray-800 text-xs mb-3">
                  Ejecución por Rubros — {{ presupuestoEjecucion().centroCosto || 'Institucional' }} (Vigencia {{ presupuestoEjecucion().anio }})
                </h4>
                <table class="tabla-datos w-full text-xs">
                  <thead class="bg-gray-50 border-b">
                    <tr>
                      <th class="py-2 px-2 text-left">Código</th>
                      <th class="py-2 px-2 text-left">Rubro Presupuestal</th>
                      <th class="py-2 px-2 text-right">Presupuestado</th>
                      <th class="py-2 px-2 text-right">Comprometido</th>
                      <th class="py-2 px-2 text-right">Causado</th>
                      <th class="py-2 px-2 text-right">Pagado</th>
                      <th class="py-2 px-2 text-right">% Ejecución</th>
                      <th class="py-2 px-2 text-center">Semáforo</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of presupuestoEjecucion().rubros; track r.codigo) {
                      <tr class="border-b hover:bg-gray-50/50">
                        <td class="py-1.5 px-2 font-mono font-semibold">{{ r.codigo }}</td>
                        <td class="py-1.5 px-2">{{ r.nombre }}</td>
                        <td class="py-1.5 px-2 text-right font-mono">{{ r.presupuestado | number:'1.2-2' }}</td>
                        <td class="py-1.5 px-2 text-right font-mono">{{ r.comprometido | number:'1.2-2' }}</td>
                        <td class="py-1.5 px-2 text-right font-mono">{{ r.causado | number:'1.2-2' }}</td>
                        <td class="py-1.5 px-2 text-right font-mono">{{ r.pagado | number:'1.2-2' }}</td>
                        <td class="py-1.5 px-2 text-right font-mono font-bold">{{ r.porcentajeEjecucion }}%</td>
                        <td class="py-1.5 px-2 text-center">
                          <span
                            class="badge-mini font-bold px-2 py-0.5 rounded"
                            [class.bg-green-100]="r.semaforo === 'VERDE'"
                            [class.text-green-800]="r.semaforo === 'VERDE'"
                            [class.bg-yellow-100]="r.semaforo === 'AMARILLO'"
                            [class.text-yellow-800]="r.semaforo === 'AMARILLO'"
                            [class.bg-red-100]="r.semaforo === 'ROJO'"
                            [class.text-red-800]="r.semaforo === 'ROJO'"
                            data-testid="badge-semaforo"
                          >
                            {{ r.semaforo }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-center text-slate-400">
                <div class="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center text-2xl mb-3 text-violet-600">
                  📊
                </div>
                <h4 class="font-bold text-slate-700 text-sm mb-1">Control Presupuestal Listo para Consultar</h4>
                <p class="text-xs text-slate-500 max-w-md">
                  Indique la vigencia fiscal en los filtros superiores y presione "Consultar Ejecución" para visualizar los rubros presupuestales y sus semáforos.
                </p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ─── 9. CONCILIACIÓN BANCARIA AUTOMÁTICA ───────────────────────── -->
      @if (reporteActivo() === 'conciliacion') {
        <div data-testid="seccion-conciliacion" class="space-y-4">
          <!-- FILTROS SUPERIORES COMPACTOS -->
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">💳</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title">Parámetros de Conciliación Bancaria</h3>
                  <p class="reportes-card-subtitle">Cruce inteligente de extractos bancarios vs. libros contables</p>
                </div>
              </div>
              <div class="reportes-info-badge text-emerald-800 bg-emerald-50/80 border border-emerald-200/70">
                <span>ℹ️</span>
                <span><strong>Auto-Match:</strong> Cruza automáticamente referencias, valores y fechas con la cuenta 111005.</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Formato Extracto *</label>
                <select
                  class="input-base input-sm w-select-md"
                  data-testid="select-conciliacion-formato"
                  [(ngModel)]="conciliacionFormato"
                >
                  <option value="XLSX">Excel (.xlsx)</option>
                  <option value="CSV">Valores Separados (.csv)</option>
                  <option value="OFX">Open Financial Exchange (.ofx)</option>
                </select>
              </div>

              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-importar-extracto"
                (click)="importarExtracto()"
                [disabled]="cargando()"
              >
                {{ cargando() ? 'Importando...' : '📥 Importar Extracto' }}
              </button>
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-auto-match"
                (click)="autoMatch()"
                [disabled]="cargando()"
              >
                🔄 Cruce Automático (Auto-Match)
              </button>
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-informe-conciliacion"
                (click)="generarInformeConciliacion()"
                [disabled]="cargando()"
              >
                📋 Informe Oficial Conciliación
              </button>
            </div>
          </div>

          <!-- RESULTADOS A TODO EL ANCHO -->
          <div class="w-full space-y-4">
            @if (cargando()) {
              <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-slate-500">
                <div class="spinner mb-3"></div>
                <span class="text-xs font-semibold">Procesando conciliación bancaria...</span>
              </div>
            } @else {
              @if (extractoImportado()) {
                <!-- KPI Extracto Importado a todo el ancho -->
                <div class="card p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-xs" data-testid="card-extracto-importado">
                  <div class="flex justify-between items-center text-xs">
                    <div>
                      <span class="font-bold text-blue-900">{{ extractoImportado().banco }}</span> — Cuenta:
                      <span class="font-mono">{{ extractoImportado().numeroCuenta }}</span>
                      ({{ extractoImportado().fechaInicial }} a {{ extractoImportado().fechaFinal }})
                    </div>
                    <span class="badge-mini bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded">
                      {{ extractoImportado().totalLineas }} movimientos importados
                    </span>
                  </div>
                </div>
              }

              @if (conciliacionResultado()) {
                <!-- KPIs Auto-Match Estilo NIIF 15 -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="kpis-auto-match">
                  <div class="stat-card border-green-500">
                    <div class="stat-label">
                      <span style="color: #047857;">Conciliadas</span>
                      <span class="text-sm">✓</span>
                    </div>
                    <div class="stat-value text-green-700 font-mono">{{ conciliacionResultado().partidasConciliadas }}</div>
                    <div class="stat-footer" style="color: #059669;">Partidas coincidentes</div>
                  </div>
                  <div class="stat-card border-yellow-500">
                    <div class="stat-label">
                      <span style="color: #b45309;">Pendientes</span>
                      <span class="text-sm">⏳</span>
                    </div>
                    <div class="stat-value text-yellow-700 font-mono">{{ conciliacionResultado().partidasPendientes }}</div>
                    <div class="stat-footer" style="color: #d97706;">En tránsito o pendientes</div>
                  </div>
                  <div class="stat-card border-blue-500">
                    <div class="stat-label">
                      <span style="color: #1d4ed8;">Tasa Éxito</span>
                      <span class="text-sm">📈</span>
                    </div>
                    <div class="stat-value text-blue-700 font-mono">{{ conciliacionResultado().tasaExito }}%</div>
                    <div class="stat-footer" style="color: #3b82f6;">Efectividad conciliación</div>
                  </div>
                  <div class="stat-card border-indigo-500">
                    <div class="stat-label">
                      <span style="color: #4338ca;">Diferencia</span>
                      <span class="text-sm">⚖️</span>
                    </div>
                    <div class="stat-value text-indigo-700 font-mono">$ {{ conciliacionResultado().diferenciaNeta | number:'1.2-2' }}</div>
                    <div class="stat-footer" style="color: #6366f1;">Saldo neto no conciliado</div>
                  </div>
                </div>
              }

              @if (conciliacionInforme()) {
                <!-- Informe Oficial de Conciliación a todo el ancho -->
                <div class="card p-5 bg-white border border-slate-200 rounded-xl shadow-xs w-full" data-testid="card-informe-conciliacion">
                  <h4 class="font-bold text-gray-800 text-xs mb-3 border-b pb-2">
                    Informe Oficial de Conciliación Bancaria — Cuenta 111005
                  </h4>
                  <div class="space-y-2 text-xs">
                    <div class="flex justify-between py-1.5 border-b">
                      <span>Saldo según Extracto Bancario:</span>
                      <span class="font-mono font-bold">{{ conciliacionInforme().saldoExtracto | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between py-1.5 text-red-600 border-b">
                      <span>(-) Menos: Cheques Girados y No Cobrados:</span>
                      <span class="font-mono">-{{ conciliacionInforme().menosChequesGiradosNoCobrados | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between py-1.5 text-green-700 border-b">
                      <span>(+) Más: Consignaciones / Recaudos en Tránsito:</span>
                      <span class="font-mono">+{{ conciliacionInforme().masConsignacionesEnTransito | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between py-1.5 text-red-600 border-b">
                      <span>(-) Menos: Notas Débito Bancarias No Contabilizadas:</span>
                      <span class="font-mono">-{{ conciliacionInforme().menosNotasDebitoNoContabilizadas | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between py-1.5 font-bold text-blue-900 border-b bg-blue-50 px-2 rounded">
                      <span>(=) Saldo Conciliado en Libros:</span>
                      <span class="font-mono">{{ conciliacionInforme().saldoConciliadoLibros | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between py-1.5 font-bold text-gray-900 border-b bg-gray-50 px-2 rounded">
                      <span>(=) Saldo según Libros Contables:</span>
                      <span class="font-mono">{{ conciliacionInforme().saldoLibrosContables | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between py-1.5 font-bold px-2 rounded" [class.text-green-700]="conciliacionInforme().diferencia === 0" [class.text-red-600]="conciliacionInforme().diferencia !== 0">
                      <span>Diferencia Conciliatoria:</span>
                      <span class="font-mono">{{ conciliacionInforme().diferencia | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
              }

              @if (!extractoImportado() && !conciliacionResultado() && !conciliacionInforme()) {
                <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-center text-slate-400">
                  <div class="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-2xl mb-3 text-emerald-600">
                    💳
                  </div>
                  <h4 class="font-bold text-slate-700 text-sm mb-1">Conciliación Bancaria Lista</h4>
                  <p class="text-xs text-slate-500 max-w-md">
                    Seleccione el formato e importe un extracto bancario en los filtros superiores para iniciar el cruce automático.
                  </p>
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- ─── FLUJO DE EFECTIVO (NIC 7 — Método Indirecto) ────────────────── -->
      @if (reporteActivo() === 'flujo') {
        <div data-testid="seccion-flujo-efectivo" class="space-y-4">
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">💵</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title" data-testid="title-flujo-efectivo">Estado de Flujos de Efectivo</h3>
                  <p class="reportes-card-subtitle">Método Indirecto NIIF (NIC 7) — Actividades de Operación, Inversión y Financiación</p>
                </div>
              </div>
              <div class="reportes-info-badge text-emerald-800 bg-emerald-50/80 border border-emerald-200/70">
                <span>ℹ️</span>
                <span>Reconcilia el excedente neto con la liquidez real en Caja y Bancos.</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Fecha Inicio *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-flujo-desde"
                  type="text"
                  appFlatpickr
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="flujoDesde"
                />
              </div>
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Fecha Fin *</label>
                <input
                  class="input-base input-sm w-date"
                  data-testid="input-flujo-hasta"
                  type="text"
                  appFlatpickr
                  placeholder="dd/mm/aaaa"
                  [(ngModel)]="flujoHasta"
                />
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn-primary btn-sm flex items-center gap-1.5"
                  (click)="generarFlujo()"
                  [disabled]="cargando()"
                  data-testid="btn-generar-flujo"
                >
                  🔍 Generar Flujo
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm flex items-center gap-1.5"
                  (click)="descargarFlujoPdf()"
                  data-testid="btn-exportar-flujo-pdf"
                >
                  📄 PDF
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm flex items-center gap-1.5"
                  (click)="descargarFlujoExcel()"
                  data-testid="btn-exportar-flujo-excel"
                >
                  📊 Excel
                </button>
              </div>
            </div>
          </div>

          @if (cargando()) {
            <div class="card p-8 text-center text-slate-500">
              ⏳ Calculando Estado de Flujos de Efectivo...
            </div>
          } @else if (flujo(); as f) {
            <!-- KPIs Resumen de Flujo -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="kpis-flujo-grid">
              <div class="stat-card border-blue-500">
                <div class="stat-label">Excedente Neto Base</div>
                <div class="stat-value text-blue-700">\${{ f.excedenteNeto | number:'1.0-0' }}</div>
                <div class="stat-footer">Punto de partida del PyG</div>
              </div>
              <div class="stat-card border-green-500">
                <div class="stat-label">Flujo Neto Operación</div>
                <div class="stat-value text-emerald-700">\${{ f.flujoNetoOperacion | number:'1.0-0' }}</div>
                <div class="stat-footer">Ajustes no monetarios + KTO</div>
              </div>
              <div class="stat-card border-yellow-500">
                <div class="stat-label">Flujo Neto Inversión</div>
                <div class="stat-value text-amber-700">\${{ f.flujoNetoInversion | number:'1.0-0' }}</div>
                <div class="stat-footer">Propiedades y equipos</div>
              </div>
              <div class="stat-card border-purple-500">
                <div class="stat-label">Flujo Neto Financiación</div>
                <div class="stat-value text-purple-700">\${{ f.flujoNetoFinanciacion | number:'1.0-0' }}</div>
                <div class="stat-footer">Obligaciones y capital</div>
              </div>
            </div>

            <!-- Conciliación de Efectivo Banner -->
            <div class="card p-4 bg-slate-900 text-white rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <span class="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Saldo Inicial de Efectivo</span>
                <span class="text-lg font-bold font-mono">\${{ f.saldoInicialEfectivo | number:'1.0-0' }} COP</span>
              </div>
              <div class="text-center">
                <span class="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Variación Neta del Periodo</span>
                <span class="text-lg font-bold font-mono" [class.text-emerald-400]="f.variacionNetaEfectivo >= 0" [class.text-red-400]="f.variacionNetaEfectivo < 0">
                  {{ f.variacionNetaEfectivo >= 0 ? '+' : '' }}\${{ f.variacionNetaEfectivo | number:'1.0-0' }} COP
                </span>
              </div>
              <div class="text-right">
                <span class="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Saldo Final de Efectivo</span>
                <span class="text-xl font-bold font-mono text-emerald-400">\${{ f.saldoFinalEfectivo | number:'1.0-0' }} COP</span>
              </div>
            </div>

            <!-- Desglose por Actividades -->
            <div class="card p-4 bg-white border border-slate-200 rounded-xl space-y-4">
              <h4 class="text-sm font-bold text-slate-800 border-b pb-2">1. Actividades de Operación</h4>
              <table class="tabla-datos w-full text-xs">
                <thead>
                  <tr class="bg-slate-50">
                    <th class="text-left py-2 px-3">Concepto / Partida</th>
                    <th class="text-right py-2 px-3 w-44">Valor (COP)</th>
                    <th class="text-left py-2 px-3 w-48">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="font-semibold bg-blue-50/50">
                    <td class="py-2 px-3">Excedente Neto del Ejercicio (PyG)</td>
                    <td class="text-right py-2 px-3 font-mono">\${{ f.excedenteNeto | number:'1.0-0' }}</td>
                    <td class="py-2 px-3 text-slate-500">Resultado operacional base</td>
                  </tr>
                  @for (p of f.ajustesNoMonetarios; track p.concepto) {
                    <tr class="border-b">
                      <td class="py-1.5 px-3">{{ p.concepto }}</td>
                      <td class="text-right py-1.5 px-3 font-mono" [class.text-emerald-700]="p.valor > 0">\${{ p.valor | number:'1.0-0' }}</td>
                      <td class="py-1.5 px-3 text-slate-500">{{ p.nota }}</td>
                    </tr>
                  }
                  @for (p of f.cambiosCapitalTrabajo; track p.concepto) {
                    <tr class="border-b">
                      <td class="py-1.5 px-3">{{ p.concepto }}</td>
                      <td class="text-right py-1.5 px-3 font-mono" [class.text-emerald-700]="p.valor > 0" [class.text-red-600]="p.valor < 0">\${{ p.valor | number:'1.0-0' }}</td>
                      <td class="py-1.5 px-3 text-slate-500">{{ p.nota }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot class="bg-slate-100 font-bold">
                  <tr>
                    <td class="py-2 px-3">FLUJO NETO DE ACTIVIDADES DE OPERACIÓN</td>
                    <td class="text-right py-2 px-3 font-mono text-emerald-800">\${{ f.flujoNetoOperacion | number:'1.0-0' }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              <h4 class="text-sm font-bold text-slate-800 border-b pb-2 pt-2">2. Actividades de Inversión</h4>
              <table class="tabla-datos w-full text-xs">
                <thead>
                  <tr class="bg-slate-50">
                    <th class="text-left py-2 px-3">Concepto / Partida</th>
                    <th class="text-right py-2 px-3 w-44">Valor (COP)</th>
                    <th class="text-left py-2 px-3 w-48">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of f.actividadesInversion; track p.concepto) {
                    <tr class="border-b">
                      <td class="py-1.5 px-3">{{ p.concepto }}</td>
                      <td class="text-right py-1.5 px-3 font-mono" [class.text-red-600]="p.valor < 0" [class.text-emerald-700]="p.valor > 0">\${{ p.valor | number:'1.0-0' }}</td>
                      <td class="py-1.5 px-3 text-slate-500">{{ p.nota }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot class="bg-slate-100 font-bold">
                  <tr>
                    <td class="py-2 px-3">FLUJO NETO DE ACTIVIDADES DE INVERSIÓN</td>
                    <td class="text-right py-2 px-3 font-mono text-amber-800">\${{ f.flujoNetoInversion | number:'1.0-0' }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              <h4 class="text-sm font-bold text-slate-800 border-b pb-2 pt-2">3. Actividades de Financiación</h4>
              <table class="tabla-datos w-full text-xs">
                <thead>
                  <tr class="bg-slate-50">
                    <th class="text-left py-2 px-3">Concepto / Partida</th>
                    <th class="text-right py-2 px-3 w-44">Valor (COP)</th>
                    <th class="text-left py-2 px-3 w-48">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of f.actividadesFinanciacion; track p.concepto) {
                    <tr class="border-b">
                      <td class="py-1.5 px-3">{{ p.concepto }}</td>
                      <td class="text-right py-1.5 px-3 font-mono">\${{ p.valor | number:'1.0-0' }}</td>
                      <td class="py-1.5 px-3 text-slate-500">{{ p.nota }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot class="bg-slate-100 font-bold">
                  <tr>
                    <td class="py-2 px-3">FLUJO NETO DE ACTIVIDADES DE FINANCIACIÓN</td>
                    <td class="text-right py-2 px-3 font-mono text-purple-800">\${{ f.flujoNetoFinanciacion | number:'1.0-0' }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          }
        </div>
      }

      <!-- ─── NOTAS NIIF A LOS ESTADOS FINANCIEROS ───────────────────────── -->
      @if (reporteActivo() === 'notas') {
        <div data-testid="seccion-notas-niif" class="space-y-4">
          <div class="card p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div class="reportes-card-header">
              <div class="reportes-card-title-group">
                <span class="reportes-card-icon">📑</span>
                <div class="reportes-card-title-texts">
                  <h3 class="reportes-card-title" data-testid="title-notas-niif">Notas y Revelaciones a los Estados Financieros</h3>
                  <p class="reportes-card-subtitle">Pliego oficial NIIF para Pymes (Decreto 2420 de 2015) para Consejo Directivo y Revisoría Fiscal</p>
                </div>
              </div>
              <div class="reportes-info-badge text-indigo-800 bg-indigo-50/80 border border-indigo-200/70">
                <span>ℹ️</span>
                <span>Revelaciones cualitativas y cuantitativas obligatorias para aprobación de asamblea.</span>
              </div>
            </div>

            <div class="reportes-filter-row">
              <div class="reportes-filter-group">
                <label class="reportes-filter-label">Vigencia Fiscal *</label>
                <input
                  class="input-base input-sm w-year"
                  data-testid="input-notas-anio"
                  type="number"
                  [(ngModel)]="notasAnio"
                />
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn-primary btn-sm flex items-center gap-1.5"
                  (click)="generarNotas()"
                  [disabled]="cargando()"
                  data-testid="btn-generar-notas"
                >
                  🔍 Generar Notas NIIF
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm flex items-center gap-1.5"
                  (click)="descargarNotasPdf()"
                  data-testid="btn-exportar-notas-pdf"
                >
                  📄 Exportar PDF Oficial
                </button>
              </div>
            </div>
          </div>

          @if (cargando()) {
            <div class="card p-8 text-center text-slate-500">
              ⏳ Compilando Notas y Revelaciones NIIF...
            </div>
          } @else if (notas(); as n) {
            <div class="space-y-3" data-testid="lista-notas-niif">
              @for (nota of n.notas; track nota.numero) {
                <div class="card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div class="flex items-center justify-between border-b pb-2 mb-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
                        Nota {{ nota.numero }}
                      </span>
                      <h4 class="font-bold text-slate-800 text-sm m-0">{{ nota.titulo }}</h4>
                    </div>
                    <span class="text-xs text-slate-500 italic">{{ nota.normaReferencia }}</span>
                  </div>
                  <p class="text-xs text-slate-700 leading-relaxed m-0 whitespace-pre-line">{{ nota.contenido }}</p>

                  @if (nota.tablaDatos && nota.tablaDatos.filas.length > 0) {
                    <div class="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
                      <table class="tabla-datos w-full text-xs">
                        <thead class="bg-slate-50">
                          <tr>
                            @for (col of nota.tablaDatos.columnas; track col; let idx = $index) {
                              <th class="py-1.5 px-2" [class.text-left]="idx === 0" [class.text-right]="idx > 0">{{ col }}</th>
                            }
                          </tr>
                        </thead>
                        <tbody>
                          @for (fila of nota.tablaDatos.filas; track $index) {
                            <tr class="border-t hover:bg-slate-50/50">
                              @for (val of fila; track $index; let idx = $index) {
                                <td class="py-1.5 px-2" [class.text-left]="idx === 0" [class.text-right]="idx > 0" [class.font-mono]="idx > 0">
                                  {{ formatCeldaNota(val, idx) }}
                                </td>
                              }
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Template reutilizable para tablas jerárquicas de balance/PyG -->
      <ng-template #tablaBalance let-cuentas let-total="total">
        <table class="tabla-datos w-full text-xs mb-1">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-28 text-left py-1.5 px-2">Código</th>
              <th class="text-left py-1.5 px-2">Cuenta</th>
              <th class="w-32 text-right py-1.5 px-2">Saldo</th>
            </tr>
          </thead>
          <tbody>
            @for (c of cuentas; track c.codigo) {
              <tr class="border-b hover:bg-gray-50/50" [class.font-semibold]="c.nivel <= 2">
                <td class="font-mono py-1.5 px-2" [style.padding-left.px]="(c.nivel - 1) * 10">
                  {{ c.codigo }}
                </td>
                <td class="py-1.5 px-2" [style.padding-left.px]="(c.nivel - 1) * 10">
                  {{ c.nombre }}
                </td>
                <td class="text-right font-mono py-1.5 px-2">
                  {{ c.saldo | number:'1.2-2' }}
                </td>
              </tr>
            }
            @if (!cuentas || cuentas.length === 0) {
              <tr>
                <td colspan="3" class="text-center py-4 text-gray-400 italic">Sin movimientos</td>
              </tr>
            }
          </tbody>
          <tfoot class="border-t font-bold bg-gray-50">
            <tr>
              <td colspan="2" class="text-right py-2 px-2">TOTAL</td>
              <td class="text-right font-mono py-2 px-2 text-blue-700">
                {{ total | number:'1.2-2' }}
              </td>
            </tr>
          </tfoot>
        </table>
      </ng-template>
      </div>
    }
  `,
})
export class ContabilidadReportesComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);
  private readonly contabilidadHost = inject(ContabilidadComponent, { optional: true });
  readonly Math = Math;

  readonly cargando = signal<boolean>(false);
  readonly reporteActivo = signal<ReporteActivo>('graficas');
  readonly balance = signal<BalanceGeneral | null>(null);
  readonly pyg = signal<EstadoResultados | null>(null);
  readonly libroDiario = signal<LibroDiarioItem[]>([]);
  readonly libroMayor = signal<LibroMayorCuenta[]>([]);
  readonly auxiliarTercero = signal<AuxiliarTerceroReporte | null>(null);
  readonly flujo = signal<FlujoEfectivoModel | null>(null);
  readonly notas = signal<NotasNiifModel | null>(null);
  readonly terceros = signal<Tercero[]>([]);

  // ─── Dashboard Financiero Gerencial Signals ──────────────────────────────
  readonly dashboardGerencial = signal<any | null>(null);
  readonly dashboardAnio = signal<number>(new Date().getFullYear());
  readonly dashboardModo = signal<'MENSUAL' | 'TRIMESTRAL'>('MENSUAL');
  readonly mesDetalleSeleccionado = signal<any | null>(null);

  readonly reportes: { key: ReporteActivo; label: string; icono: string }[] = [
    { key: 'graficas', label: 'Dashboard Gerencial', icono: '📊' },
    { key: 'balance', label: 'Balance General', icono: '🏛' },
    { key: 'pyg', label: 'Estado Resultados', icono: '📈' },
    { key: 'diario', label: 'Libro Diario', icono: '📋' },
    { key: 'mayor', label: 'Libro Mayor', icono: '📒' },
    { key: 'auxiliar', label: 'Auxiliar Tercero', icono: '👤' },
    { key: 'flujo', label: 'Flujo de Efectivo NIC 7', icono: '💵' },
    { key: 'notas', label: 'Notas NIIF', icono: '📑' },
    { key: 'certificados', label: 'Certificados Tributarios', icono: '📜' },
    { key: 'exogena', label: 'Exógena DIAN', icono: '🏛' },
    { key: 'presupuesto', label: 'Control Presupuestal', icono: '📊' },
    { key: 'conciliacion', label: 'Conciliación Bancaria', icono: '🏦' },
  ];

  readonly maxIngresosGastos = computed(() => {
    const list = this.dashboardGerencial()?.resumenMensual || [];
    let max = 1000000;
    for (const m of list) {
      const g = Number(m.gastos || 0) + Number(m.costos || 0);
      const val = Math.max(Number(m.ingresos || 0), g, Number(m.excedenteNeto || 0));
      if (val > max) max = val;
    }
    return max;
  });

  readonly trimestresData = computed(() => {
    const list = this.dashboardGerencial()?.resumenMensual || [];
    const t = [
      { trimestre: 1, nombre: 'T1 (Ene-Mar)', ingresos: 0, gastos: 0, excedente: 0 },
      { trimestre: 2, nombre: 'T2 (Abr-Jun)', ingresos: 0, gastos: 0, excedente: 0 },
      { trimestre: 3, nombre: 'T3 (Jul-Sep)', ingresos: 0, gastos: 0, excedente: 0 },
      { trimestre: 4, nombre: 'T4 (Oct-Dic)', ingresos: 0, gastos: 0, excedente: 0 },
    ];
    for (const m of list) {
      const idx = Math.floor((m.mes - 1) / 3);
      if (t[idx]) {
        t[idx].ingresos += Number(m.ingresos || 0);
        t[idx].gastos += (Number(m.gastos || 0) + Number(m.costos || 0));
        t[idx].excedente += Number(m.excedenteNeto || 0);
      }
    }
    return t;
  });

  readonly maxTrimestres = computed(() => {
    const tList = this.trimestresData();
    let max = 1000000;
    for (const tri of tList) {
      const val = Math.max(tri.ingresos, tri.gastos, tri.excedente);
      if (val > max) max = val;
    }
    return max;
  });

  readonly maxFlujo = computed(() => {
    const list = this.dashboardGerencial()?.resumenMensual || [];
    let max = 1000000;
    for (const m of list) {
      const val = Math.max(Number(m.entradasEfectivo || 0), Number(m.salidasEfectivo || 0));
      if (val > max) max = val;
    }
    return max;
  });

  readonly certificado = signal<any | null>(null);
  readonly exogenaValidacion = signal<any | null>(null);
  readonly exogenaResultado = signal<any | null>(null);
  readonly presupuestoEjecucion = signal<any | null>(null);
  readonly conciliacionResultado = signal<any | null>(null);
  readonly conciliacionInforme = signal<any | null>(null);
  readonly extractoImportado = signal<any | null>(null);
  presupuestoAnio = new Date().getFullYear();
  presupuestoIdSeleccionado = 'pres-1';
  conciliacionFormato: 'XLSX' | 'CSV' | 'OFX' = 'XLSX';

  balanceFechaCorte = new Date().toISOString().split('T')[0];
  pygDesde = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  pygHasta = new Date().toISOString().split('T')[0];
  flujoDesde = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  flujoHasta = new Date().toISOString().split('T')[0];
  notasAnio = new Date().getFullYear();
  desdeFiltro = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  hastaFiltro = new Date().toISOString().split('T')[0];
  mayorCuenta = '';
  terceroFiltroId = '';
  auxiliarCuentaCodigo = '';
  certAnio = new Date().getFullYear();
  certEstudianteId = 'est-1';
  exogenaAnio = new Date().getFullYear();
  exogenaFormato = '1001';

  readonly totalDiarioDB = computed(() => {
    return Math.round(this.libroDiario().reduce((s, r) => s + (Number(r.debito) || 0), 0) * 100) / 100;
  });

  readonly totalDiarioCR = computed(() => {
    return Math.round(this.libroDiario().reduce((s, r) => s + (Number(r.credito) || 0), 0) * 100) / 100;
  });

  readonly faltanRequisitos = computed(() => {
    const status = this.svc.configStatus;
    if (status.loading()) return false;
    return status.hasPuc() === false || status.hasPeriodos() === false;
  });

  readonly requisitosFaltantes = computed<ConfigRequirement[]>(() => {
    const reqs: ConfigRequirement[] = [];
    const status = this.svc.configStatus;
    
    if (status.hasPuc() !== null) {
      reqs.push({
        id: 'puc',
        title: 'Plan de Cuentas (PUC)',
        description: status.hasPuc() ? 'Cuentas configuradas correctamente.' : 'No hay cuentas registradas en el Plan Único de Cuentas.',
        actionText: status.hasPuc() ? '' : 'Ir a Configurar PUC',
        actionTab: 'puc',
        completed: !!status.hasPuc()
      });
    }

    if (status.hasPeriodos() !== null) {
      reqs.push({
        id: 'periodos',
        title: 'Periodos Contables',
        description: status.hasPeriodos() ? 'Periodos configurados correctamente.' : 'Debes iniciar o crear al menos un periodo contable activo.',
        actionText: status.hasPeriodos() ? '' : 'Ir a Periodos',
        actionTab: 'periodos',
        completed: !!status.hasPeriodos()
      });
    }

    return reqs;
  });

  ngOnInit(): void {
    this.svc.verificarEstadoConfiguracion();
    this.cargarTerceros();
    if (this.reporteActivo() === 'graficas' && !this.dashboardGerencial()) {
      this.cargarDashboardGerencial();
    }
  }

  navegarA(tabId: string): void {
    if (this.contabilidadHost) {
      this.contabilidadHost.setTab(tabId as any);
    }
  }

  cargarDashboardGerencial(anio?: number): void {
    const targetAnio = anio || this.dashboardAnio();
    this.cargando.set(true);
    this.svc.getDashboardGerencial(targetAnio).subscribe({
      next: (data) => {
        this.dashboardGerencial.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.dashboardGerencial.set(null);
        this.cargando.set(false);
      },
    });
  }

  onDashboardAnioChange(nuevoAnio: number): void {
    this.dashboardAnio.set(nuevoAnio);
    this.cargarDashboardGerencial(nuevoAnio);
  }

  setDashboardModo(modo: 'MENSUAL' | 'TRIMESTRAL'): void {
    this.dashboardModo.set(modo);
  }

  seleccionarMesDetalle(item: any): void {
    if (this.mesDetalleSeleccionado()?.mes === item.mes) {
      this.mesDetalleSeleccionado.set(null);
    } else {
      this.mesDetalleSeleccionado.set(item);
    }
  }

  calcularPorcentajeBarra(valor: number, max: number): number {
    const v = Number(valor) || 0;
    const m = Number(max) || 1;
    if (v <= 0) return 3;
    const pct = Math.round((v / m) * 100);
    return Math.max(4, Math.min(100, pct));
  }

  exportarDashboardExcel(): void {
    this.svc.descargarReporteExcel('estado-resultados', {
      fechaInicio: `${this.dashboardAnio()}-01-01`,
      fechaFin: `${this.dashboardAnio()}-12-31`,
    });
  }

  cargarTerceros(): void {
    this.svc.getTerceros().subscribe({
      next: (t) => this.terceros.set(t || []),
      error: () => {},
    });
  }

  seleccionarReporte(key: ReporteActivo): void {
    this.reporteActivo.set(key);
    if (key === 'graficas' && !this.dashboardGerencial()) {
      this.cargarDashboardGerencial();
    }
  }

  generarBalance(): void {
    this.cargando.set(true);
    this.svc.getBalanceGeneral(this.balanceFechaCorte).subscribe({
      next: (data) => {
        this.balance.set(data);
        this.cargando.set(false);
      },
      error: () => {
        // En caso de error o sin datos, proveer objeto balance default con cuadra=true para no romper UI
        this.balance.set({
          fechaCorte: this.balanceFechaCorte,
          activos: [],
          pasivos: [],
          patrimonio: [],
          totalActivos: 0,
          totalPasivos: 0,
          totalPatrimonio: 0,
          cuadra: true,
        });
        this.cargando.set(false);
      },
    });
  }

  generarPyg(): void {
    this.cargando.set(true);
    this.svc.getEstadoResultados(this.pygDesde, this.pygHasta).subscribe({
      next: (data) => {
        this.pyg.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.pyg.set({
          desde: this.pygDesde,
          hasta: this.pygHasta,
          ingresos: [],
          gastos: [],
          totalIngresos: 0,
          totalGastos: 0,
          excedente: 0,
        });
        this.cargando.set(false);
      },
    });
  }

  generarDiario(): void {
    this.cargando.set(true);
    this.svc.getLibroDiario(this.desdeFiltro, this.hastaFiltro).subscribe({
      next: (data) => {
        this.libroDiario.set(Array.isArray(data) ? data : []);
        this.cargando.set(false);
      },
      error: () => {
        this.libroDiario.set([]);
        this.cargando.set(false);
      },
    });
  }

  generarMayor(): void {
    this.cargando.set(true);
    this.svc.getLibroMayor(this.desdeFiltro, this.hastaFiltro, this.mayorCuenta || undefined).subscribe({
      next: (data) => {
        this.libroMayor.set(Array.isArray(data) ? data : []);
        this.cargando.set(false);
      },
      error: () => {
        this.libroMayor.set([]);
        this.cargando.set(false);
      },
    });
  }

  generarAuxiliar(): void {
    this.cargando.set(true);
    this.svc
      .getAuxiliarTercero(
        this.desdeFiltro,
        this.hastaFiltro,
        this.terceroFiltroId || undefined,
        this.auxiliarCuentaCodigo || undefined,
      )
      .subscribe({
        next: (data: any) => {
          if (Array.isArray(data)) {
            const movs = data.map((r: any) => ({
              fecha: r.fecha,
              comprobante: `${r.tipo}-${String(r.consecutivo || 0).padStart(6, '0')}`,
              cuentaCodigo: r.codigoCuenta || r.codigo_cuenta,
              cuentaNombre: r.nombreCuenta || r.nombre_cuenta,
              concepto: r.concepto,
              debito: Number(r.debito || 0),
              credito: Number(r.credito || 0),
              saldoAcumulado: Number(r.saldoAcumulado || 0),
            }));
            const totDeb = movs.reduce((sum: number, m: any) => sum + m.debito, 0);
            const totCred = movs.reduce((sum: number, m: any) => sum + m.credito, 0);
            const primerTercero = data[0]?.tercero || 'Consolidado Terceros';
            const primerNit = data[0]?.nit || '';
            const finalSaldo = movs.length > 0 ? movs[movs.length - 1].saldoAcumulado : 0;

            this.auxiliarTercero.set({
              terceroId: this.terceroFiltroId || '',
              terceroNombre: primerTercero,
              numeroIdentificacion: primerNit,
              fechaInicio: this.desdeFiltro,
              fechaFin: this.hastaFiltro,
              movimientos: movs,
              totalDebito: totDeb,
              totalCredito: totCred,
              saldoFinal: finalSaldo,
            });
          } else if (data && Array.isArray(data.movimientos)) {
            this.auxiliarTercero.set(data);
          } else {
            this.auxiliarTercero.set({
              terceroId: '',
              terceroNombre: 'Sin movimientos',
              numeroIdentificacion: '',
              fechaInicio: this.desdeFiltro,
              fechaFin: this.hastaFiltro,
              movimientos: [],
              totalDebito: 0,
              totalCredito: 0,
              saldoFinal: 0,
            });
          }
          this.cargando.set(false);
        },
        error: () => {
          this.auxiliarTercero.set({
            terceroId: '',
            terceroNombre: 'Sin movimientos',
            numeroIdentificacion: '',
            fechaInicio: this.desdeFiltro,
            fechaFin: this.hastaFiltro,
            movimientos: [],
            totalDebito: 0,
            totalCredito: 0,
            saldoFinal: 0,
          });
          this.cargando.set(false);
        },
      });
  }

  exportarExcel(reporte: string): void {
    let fi = this.desdeFiltro;
    let ff = this.hastaFiltro;
    if (reporte === 'estado-resultados' || reporte === 'pyg') {
      fi = this.pygDesde;
      ff = this.pygHasta;
    }
    const params: Record<string, string> = {
      fechaCorte: this.balanceFechaCorte,
      fechaInicio: fi,
      fechaFin: ff,
      codigoCuenta: this.mayorCuenta || this.auxiliarCuentaCodigo,
      terceroId: this.terceroFiltroId,
    };
    this.svc.descargarReporteExcel(reporte, params);
  }

  exportarPdf(reporte: string): void {
    let fi = this.desdeFiltro;
    let ff = this.hastaFiltro;
    if (reporte === 'estado-resultados' || reporte === 'pyg') {
      fi = this.pygDesde;
      ff = this.pygHasta;
    }
    const params: Record<string, string> = {
      fechaCorte: this.balanceFechaCorte,
      fechaInicio: fi,
      fechaFin: ff,
      codigoCuenta: this.mayorCuenta || this.auxiliarCuentaCodigo,
      terceroId: this.terceroFiltroId,
    };
    this.svc.descargarReportePdf(reporte, params);
  }

  // ─── Certificados Tributarios Actions ─────────────────────────────────────
  generarCertificado(): void {
    this.cargando.set(true);
    this.svc.getCertificadoTributario(this.certEstudianteId, this.certAnio).subscribe({
      next: (data) => {
        this.certificado.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.certificado.set(null);
        this.cargando.set(false);
      },
    });
  }

  descargarCertificadoPdf(): void {
    this.svc.descargarCertificadoPdf(this.certEstudianteId, this.certAnio);
  }

  // ─── Medios Magnéticos Exógena Actions ────────────────────────────────────
  validarExogena(): void {
    this.cargando.set(true);
    this.svc.validarExogena(this.exogenaAnio).subscribe({
      next: (data) => {
        this.exogenaValidacion.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.exogenaValidacion.set(null);
        this.cargando.set(false);
      },
    });
  }

  consultarExogena(): void {
    this.cargando.set(true);
    this.svc.getExogenaFormato(this.exogenaFormato, this.exogenaAnio).subscribe({
      next: (data) => {
        this.exogenaResultado.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.exogenaResultado.set(null);
        this.cargando.set(false);
      },
    });
  }

  exportarExogenaExcel(): void {
    this.svc.descargarExogenaExcel(this.exogenaFormato, this.exogenaAnio);
  }

  exportarExogenaXml(): void {
    this.svc.descargarExogenaXml(this.exogenaFormato, this.exogenaAnio);
  }

  // ─── Control Presupuestal Actions ─────────────────────────────────────────
  consultarPresupuesto(): void {
    this.cargando.set(true);
    this.svc.getPresupuestoEjecucion(this.presupuestoIdSeleccionado).subscribe({
      next: (data) => {
        this.presupuestoEjecucion.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.presupuestoEjecucion.set(null);
        this.cargando.set(false);
      },
    });
  }

  // ─── Conciliación Bancaria Actions ────────────────────────────────────────
  importarExtracto(): void {
    this.cargando.set(true);
    const nombre = `extracto_banco_agosto.${this.conciliacionFormato.toLowerCase()}`;
    this.svc.importarExtractoBancario({ archivoNombre: nombre, formato: this.conciliacionFormato }).subscribe({
      next: (data) => {
        this.extractoImportado.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.extractoImportado.set(null);
        this.cargando.set(false);
      },
    });
  }

  autoMatch(): void {
    this.cargando.set(true);
    const extId = this.extractoImportado()?.extractoId || 'ext-001';
    this.svc.autoMatchConciliacion({ extractoId: extId, cuentaPucId: '111005' }).subscribe({
      next: (data) => {
        this.conciliacionResultado.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.conciliacionResultado.set(null);
        this.cargando.set(false);
      },
    });
  }

  generarInformeConciliacion(): void {
    this.cargando.set(true);
    const extId = this.extractoImportado()?.extractoId || 'ext-001';
    this.svc.getInformeConciliacion(extId).subscribe({
      next: (data) => {
        this.conciliacionInforme.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.conciliacionInforme.set(null);
        this.cargando.set(false);
      },
    });
  }

  // ─── Flujo de Efectivo NIC 7 ─────────────────────────────────────────────
  generarFlujo(): void {
    this.cargando.set(true);
    this.svc.getFlujoEfectivo(this.flujoDesde, this.flujoHasta).subscribe({
      next: (data) => {
        this.flujo.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.flujo.set(null);
        this.cargando.set(false);
      },
    });
  }

  descargarFlujoPdf(): void {
    const fi = this.flujoDesde || `${new Date().getFullYear()}-01-01`;
    const ff = this.flujoHasta || new Date().toISOString().split('T')[0];
    this.svc.descargarFlujoEfectivoPdf(fi, ff).subscribe({
      next: (blob) => this.descargarBlob(blob, `flujo_efectivo_${fi}_${ff}.pdf`),
      error: () => {},
    });
  }

  descargarFlujoExcel(): void {
    const fi = this.flujoDesde || `${new Date().getFullYear()}-01-01`;
    const ff = this.flujoHasta || new Date().toISOString().split('T')[0];
    this.svc.descargarFlujoEfectivoExcel(fi, ff).subscribe({
      next: (blob) => this.descargarBlob(blob, `flujo_efectivo_${fi}_${ff}.xlsx`),
      error: () => {},
    });
  }

  // ─── Notas NIIF ──────────────────────────────────────────────────────────
  generarNotas(): void {
    this.cargando.set(true);
    this.svc.getNotasNiif(this.notasAnio).subscribe({
      next: (data) => {
        this.notas.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.notas.set(null);
        this.cargando.set(false);
      },
    });
  }

  descargarNotasPdf(): void {
    const anio = this.notasAnio || new Date().getFullYear();
    this.svc.descargarNotasNiifPdf(anio).subscribe({
      next: (blob) => this.descargarBlob(blob, `notas_niif_${anio}.pdf`),
      error: () => {},
    });
  }

  private descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  formatCeldaNota(val: any, idx: number): string {
    if (idx > 0 && typeof val === 'number') {
      return '$' + val.toLocaleString('es-CO');
    }
    return String(val ?? '');
  }
}
