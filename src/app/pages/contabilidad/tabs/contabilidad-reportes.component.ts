import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import {
  BalanceGeneral,
  EstadoResultados,
  LibroDiarioItem,
  LibroMayorCuenta,
  AuxiliarTerceroReporte,
  Tercero,
} from '../models/contabilidad.models';

import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';

type ReporteActivo = 'balance' | 'pyg' | 'diario' | 'mayor' | 'auxiliar' | 'certificados' | 'exogena' | 'presupuesto' | 'conciliacion';

@Component({
  selector: 'app-contabilidad-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, FlatpickrDirective],
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
  `],
  template: `
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
                      @if (auxiliarTercero()!.movimientos.length === 0) {
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
  `,
})
export class ContabilidadReportesComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly cargando = signal<boolean>(false);
  readonly reporteActivo = signal<ReporteActivo>('balance');
  readonly balance = signal<BalanceGeneral | null>(null);
  readonly pyg = signal<EstadoResultados | null>(null);
  readonly libroDiario = signal<LibroDiarioItem[]>([]);
  readonly libroMayor = signal<LibroMayorCuenta[]>([]);
  readonly auxiliarTercero = signal<AuxiliarTerceroReporte | null>(null);
  readonly terceros = signal<Tercero[]>([]);

  readonly reportes: { key: ReporteActivo; label: string; icono: string }[] = [
    { key: 'balance', label: 'Balance General', icono: '🏛' },
    { key: 'pyg', label: 'Estado Resultados', icono: '📈' },
    { key: 'diario', label: 'Libro Diario', icono: '📋' },
    { key: 'mayor', label: 'Libro Mayor', icono: '📒' },
    { key: 'auxiliar', label: 'Auxiliar Tercero', icono: '👤' },
    { key: 'certificados', label: 'Certificados Tributarios', icono: '📜' },
    { key: 'exogena', label: 'Exógena DIAN', icono: '🏛' },
    { key: 'presupuesto', label: 'Control Presupuestal', icono: '📊' },
    { key: 'conciliacion', label: 'Conciliación Bancaria', icono: '🏦' },
  ];

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

  ngOnInit(): void {
    this.cargarTerceros();
  }

  cargarTerceros(): void {
    this.svc.getTerceros().subscribe({
      next: (t) => this.terceros.set(t || []),
      error: () => {},
    });
  }

  seleccionarReporte(key: ReporteActivo): void {
    this.reporteActivo.set(key);
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
        next: (data) => {
          this.auxiliarTercero.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.auxiliarTercero.set(null);
          this.cargando.set(false);
        },
      });
  }

  exportarExcel(reporte: string): void {
    const params: Record<string, string> = {
      fechaCorte: this.balanceFechaCorte,
      fechaInicio: this.reporteActivo() === 'pyg' ? this.pygDesde : this.desdeFiltro,
      fechaFin: this.reporteActivo() === 'pyg' ? this.pygHasta : this.hastaFiltro,
      codigoCuenta: this.mayorCuenta || this.auxiliarCuentaCodigo,
      terceroId: this.terceroFiltroId,
    };
    this.svc.descargarReporteExcel(reporte, params);
  }

  exportarPdf(reporte: string): void {
    const params: Record<string, string> = {
      fechaCorte: this.balanceFechaCorte,
      fechaInicio: this.reporteActivo() === 'pyg' ? this.pygDesde : this.desdeFiltro,
      fechaFin: this.reporteActivo() === 'pyg' ? this.pygHasta : this.hastaFiltro,
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

}
