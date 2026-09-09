import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { PeriodoContable, EstadoPeriodo } from '../models/contabilidad.models';
import { ModalCerrarPeriodoComponent } from '../modals/modal-cerrar-periodo.component';
import { ModalCierreAnualComponent } from '../modals/modal-cierre-anual.component';

@Component({
  selector: 'app-contabilidad-periodos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCerrarPeriodoComponent, ModalCierreAnualComponent],
  styles: [`
    .periodos-header-banner {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #7c3aed;
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .periodos-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .periodos-icon-wrap {
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
    .periodos-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .periodos-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .periodos-title-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .periodos-subtitle-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .periodos-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .periodos-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .periodos-kpis-grid {
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
    .filters-bar {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .filters-left {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .periodo-month-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.1rem;
      height: 2.1rem;
      border-radius: 0.5rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      font-weight: 700;
      font-size: 0.75rem;
      color: #475569;
      font-family: var(--font-mono, monospace);
    }
    .action-btn-circle {
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.15s ease;
      border: 1px solid transparent;
      cursor: pointer;
    }
    .info-flow-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.15rem 1.25rem;
      margin-top: 1.25rem;
    }
  `],
  template: `
    <div class="tab-content" data-testid="tab-content-periodos">
      <!-- Header Banner Institucional NIIF -->
      <div class="periodos-header-banner" data-testid="periodos-header-banner">
        <div class="periodos-header-main">
          <div class="periodos-icon-wrap">
            📅
          </div>
          <div class="periodos-texts-wrap">
            <div class="periodos-title-row">
              <h2 class="periodos-title-text" data-testid="periodos-titulo">
                Periodos Contables Fiscales
              </h2>
              <span class="badge-mini" style="background: rgba(124, 58, 237, 0.12); color: #7c3aed; border-color: rgba(124, 58, 237, 0.25);">
                Decreto 2420 NIIF / Periodo 13
              </span>
            </div>
            <p class="periodos-subtitle-text">
              Administración, control de apertura, bloqueo preventivo y cierre mensual de libros contables institucionales.
            </p>
          </div>
        </div>

        <div class="flex items-end gap-2.5 flex-wrap">
          <div class="form-group-inline mb-0">
            <label class="form-label-sm">Año Fiscal</label>
            <select
              class="input-base input-sm w-select-year h-[38px] font-semibold"
              data-testid="select-anio-periodos"
              [ngModel]="anioSeleccionado()"
              (ngModelChange)="onAnioChange($event)"
            >
              @for (a of aniosDisponibles; track a) {
                <option [value]="a">{{ a }}</option>
              }
            </select>
          </div>

          <button
            type="button"
            class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 font-semibold"
            (click)="cargar()"
            data-testid="btn-recargar-periodos"
            title="Refrescar lista de periodos"
          >
            <span>🔄</span>
            <span>Refrescar</span>
          </button>

          <button
            type="button"
            class="btn-primary btn-sm h-[38px] flex items-center gap-1.5 font-semibold shadow-sm"
            data-testid="btn-abrir-periodo"
            (click)="abrirModalNuevoPeriodo()"
          >
            <svg class="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Abrir Nuevo Periodo</span>
          </button>

          <button
            type="button"
            class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 text-purple-800 bg-purple-50 border-purple-200 hover:bg-purple-100 font-semibold shadow-2xs"
            data-testid="btn-cierre-periodo13"
            (click)="modalCierreAnual.set(true)"
          >
            <span>🏛️</span>
            <span>Cierre Fiscal Periodo 13</span>
          </button>
        </div>
      </div>

      <!-- KPIs Grid -->
      <div class="periodos-kpis-grid" data-testid="periodos-kpis-grid">
        <!-- KPI 1: Total Periodos -->
        <div
          class="kpi-widget-card"
          style="border-color: #ede9fe; background: linear-gradient(135deg, rgba(237, 233, 254, 0.4) 0%, #ffffff 100%);"
          data-testid="kpi-total-periodos"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #6d28d9;">Periodos del Ejercicio</span>
            <span class="text-base">📅</span>
          </div>
          <div class="kpi-widget-value stat-value" style="color: #7c3aed;">
            {{ periodos().length }}
          </div>
          <div class="kpi-widget-footer" style="color: #8b5cf6;">Calendario fiscal {{ anioSeleccionado() }}</div>
        </div>

        <!-- KPI 2: Periodos Abiertos -->
        <div
          class="kpi-widget-card"
          style="border-color: #d1fae5; background: linear-gradient(135deg, rgba(209, 250, 229, 0.35) 0%, #ffffff 100%);"
          data-testid="kpi-periodos-abiertos"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #047857;">Periodos Abiertos</span>
            <span class="text-base">🟢</span>
          </div>
          <div class="kpi-widget-value stat-value" style="color: #059669;">
            {{ totalAbiertos() }}
          </div>
          <div class="kpi-widget-footer" style="color: #10b981;">Disponibles para asientos y causación</div>
        </div>

        <!-- KPI 3: Periodos Bloqueados -->
        <div
          class="kpi-widget-card"
          style="border-color: #fef3c7; background: linear-gradient(135deg, rgba(254, 243, 199, 0.35) 0%, #ffffff 100%);"
          data-testid="kpi-periodos-bloqueados"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #b45309;">Periodos Bloqueados</span>
            <span class="text-base">🔒</span>
          </div>
          <div class="kpi-widget-value stat-value" style="color: #d97706;">
            {{ totalBloqueados() }}
          </div>
          <div class="kpi-widget-footer" style="color: #f59e0b;">En auditoría / conciliación previa</div>
        </div>

        <!-- KPI 4: Periodos Cerrados -->
        <div
          class="kpi-widget-card"
          style="border-color: #e2e8f0; background: linear-gradient(135deg, rgba(241, 245, 249, 0.5) 0%, #ffffff 100%);"
          data-testid="kpi-periodos-cerrados"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #334155;">Periodos Cerrados</span>
            <span class="text-base">🏁</span>
          </div>
          <div class="kpi-widget-value stat-value" style="color: #1e293b;">
            {{ totalCerrados() }}
          </div>
          <div class="kpi-widget-footer" style="color: #64748b;">Libros mensuales definitivos</div>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="filters-bar" data-testid="periodos-filters-bar">
        <div class="filters-left">
          <div class="form-group-inline mb-0">
            <label class="form-label-sm">Buscar Mes</label>
            <input
              class="input-base input-sm"
              style="width: 240px; min-width: 200px;"
              data-testid="input-buscar-periodo"
              type="text"
              placeholder="🔍 Enero, Febrero, Marzo..."
              [ngModel]="busqueda()"
              (ngModelChange)="busqueda.set($event)"
            />
          </div>

          <div class="form-group-inline mb-0">
            <label class="form-label-sm">Estado</label>
            <select
              class="input-base input-sm"
              style="width: 170px; min-width: 150px;"
              data-testid="select-filtro-estado-periodo"
              [ngModel]="filtroEstado()"
              (ngModelChange)="filtroEstado.set($event)"
            >
              <option value="">Todos los estados</option>
              <option value="ABIERTO">🟢 Abierto</option>
              <option value="BLOQUEADO">🔒 Bloqueado</option>
              <option value="CERRADO">🏁 Cerrado</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500 font-medium">
            Mostrando <strong>{{ periodosFiltrados().length }}</strong> de <strong>{{ periodos().length }}</strong> periodos
          </span>
        </div>
      </div>

      @if (cargando()) {
        <div class="flex justify-center py-12" data-testid="periodos-loading-spinner">
          <div class="spinner"></div>
        </div>
      } @else {
        <div class="tabla-base overflow-auto" data-testid="tabla-periodos-container">
          <table class="tabla-datos w-full text-xs" data-testid="tabla-periodos">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200">
                <th class="w-20 py-3 px-3.5 text-left font-bold text-slate-600 uppercase text-[11px] tracking-wider">Año</th>
                <th class="py-3 px-3.5 text-left font-bold text-slate-600 uppercase text-[11px] tracking-wider">Mes Contable</th>
                <th class="text-center w-36 py-3 px-3.5 font-bold text-slate-600 uppercase text-[11px] tracking-wider">Estado</th>
                <th class="py-3 px-3.5 text-left font-bold text-slate-600 uppercase text-[11px] tracking-wider">Apertura</th>
                <th class="py-3 px-3.5 text-left font-bold text-slate-600 uppercase text-[11px] tracking-wider">Cierre</th>
                <th class="text-center w-36 py-3 px-3.5 font-bold text-slate-600 uppercase text-[11px] tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of periodosFiltrados(); track p.id) {
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors" [attr.data-testid]="'row-periodo-' + p.id">
                  <td class="font-bold py-3 px-3.5 text-slate-700 font-mono">{{ p.anio }}</td>
                  <td class="py-3 px-3.5">
                    <div class="flex items-center gap-2.5">
                      <span class="periodo-month-badge">{{ p.mes < 10 ? '0' + p.mes : p.mes }}</span>
                      <div>
                        <span class="font-semibold text-slate-800 block text-xs">{{ nombreMes(p.mes) }}</span>
                        <span class="text-[10px] text-slate-400">Periodo M{{ p.mes }} — Ejercicio {{ p.anio }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="text-center py-3 px-3.5">
                    @if (p.estado === 'ABIERTO') {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ABIERTO
                      </span>
                    } @else if (p.estado === 'BLOQUEADO') {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                        <span>🔒</span>
                        BLOQUEADO
                      </span>
                    } @else if (p.estado === 'CERRADO') {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                        <span>🏁</span>
                        CERRADO
                      </span>
                    } @else {
                      <span [class]="badgePeriodo(p.estado)">{{ p.estado }}</span>
                    }
                  </td>
                  <td class="text-xs py-3 px-3.5 text-slate-600 font-mono">
                    {{ p.fechaApertura ? (p.fechaApertura | date:'dd/MM/yyyy HH:mm') : '—' }}
                  </td>
                  <td class="text-xs py-3 px-3.5 text-slate-600 font-mono">
                    @if (p.fechaCierre) {
                      <span class="text-slate-700">{{ p.fechaCierre | date:'dd/MM/yyyy HH:mm' }}</span>
                    } @else {
                      <span class="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                        <span class="w-1 h-1 rounded-full bg-emerald-500"></span>
                        En Curso
                      </span>
                    }
                  </td>
                  <td class="text-center py-3 px-3.5 whitespace-nowrap">
                    <div class="flex flex-row gap-1.5 justify-center items-center whitespace-nowrap">
                      @if (p.estado === 'ABIERTO') {
                        <button
                          type="button"
                          class="action-btn-circle bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 shadow-2xs"
                          title="Bloquear periodo"
                          [attr.data-testid]="'btn-bloquear-periodo-' + p.id"
                          (click)="bloquear(p)"
                        >
                          🔒
                        </button>
                        <button
                          type="button"
                          class="action-btn-circle bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-800 shadow-2xs"
                          title="Cerrar periodo definitivamente"
                          [attr.data-testid]="'btn-cerrar-periodo-' + p.id"
                          (click)="abrirModalCierre(p)"
                        >
                          ⊘
                        </button>
                      }
                      @if (p.estado === 'BLOQUEADO') {
                        <button
                          type="button"
                          class="action-btn-circle bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 shadow-2xs"
                          title="Reabrir periodo"
                          [attr.data-testid]="'btn-reabrir-periodo-' + p.id"
                          (click)="reabrir(p)"
                        >
                          🔓
                        </button>
                        <button
                          type="button"
                          class="action-btn-circle bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-800 shadow-2xs"
                          title="Cerrar periodo definitivamente"
                          [attr.data-testid]="'btn-cerrar-periodo-' + p.id"
                          (click)="abrirModalCierre(p)"
                        >
                          ⊘
                        </button>
                      }
                      @if (p.estado === 'CERRADO') {
                        <button
                          type="button"
                          class="action-btn-circle bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800 shadow-2xs"
                          title="Reabrir periodo"
                          [attr.data-testid]="'btn-reabrir-periodo-' + p.id"
                          (click)="reabrir(p)"
                        >
                          🔓
                        </button>
                        <span class="text-slate-400 text-xs italic font-medium ml-1">Inmutable</span>
                      }
                    </div>
                  </td>
                </tr>
              }
              @if (periodosFiltrados().length === 0) {
                <tr class="empty-row">
                  <td colspan="6" class="text-center py-10 text-slate-400">
                    <div class="flex flex-col items-center gap-2">
                      <span class="text-2xl">📅</span>
                      <span class="font-medium text-slate-500">No se encontraron periodos contables para los criterios seleccionados.</span>
                      <span class="text-xs text-slate-400">Pruebe cambiando el año fiscal o abriendo un nuevo periodo.</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Tarjeta Informativa de Flujo Contable NIIF -->
        <div class="info-flow-card">
          <div class="flex items-center gap-2 mb-3.5">
            <span class="text-base">ℹ️</span>
            <h4 class="font-bold text-xs text-slate-800 uppercase tracking-wide">
              Ciclo de Vida de los Periodos Contables (Decreto 2420 NIIF)
            </h4>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-600 mt-2">
            <div class="p-4 sm:p-4.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
              <div>
                <span class="font-bold text-emerald-700 block mb-2 text-xs flex items-center gap-1.5">
                  <span>1. Abierto</span>
                  <span>(🟢)</span>
                </span>
                <p class="text-slate-600 leading-relaxed text-[11.5px] m-0">
                  Permite registrar comprobantes manuales, causaciones automáticas de tesorería y facturas DIAN.
                </p>
              </div>
            </div>
            <div class="p-4 sm:p-4.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
              <div>
                <span class="font-bold text-amber-700 block mb-2 text-xs flex items-center gap-1.5">
                  <span>2. Bloqueado</span>
                  <span>(🔒)</span>
                </span>
                <p class="text-slate-600 leading-relaxed text-[11.5px] m-0">
                  Impide nuevos registros temporales mientras se realiza la conciliación bancaria y validación de partidas.
                </p>
              </div>
            </div>
            <div class="p-4 sm:p-4.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
              <div>
                <span class="font-bold text-slate-700 block mb-2 text-xs flex items-center gap-1.5">
                  <span>3. Cerrado Definitivo</span>
                  <span>(🏁)</span>
                </span>
                <p class="text-slate-600 leading-relaxed text-[11.5px] m-0">
                  Sella el mes con inmutabilidad fiscal tras verificar balance de comprobación y cuadre de partida doble.
                </p>
              </div>
            </div>
            <div class="p-4 sm:p-4.5 rounded-xl bg-purple-50/40 border border-purple-200/80 shadow-2xs flex flex-col justify-between transition-all hover:border-purple-300">
              <div>
                <span class="font-bold text-purple-700 block mb-2 text-xs flex items-center gap-1.5">
                  <span>4. Periodo 13</span>
                  <span>(🏛️)</span>
                </span>
                <p class="text-purple-900/80 leading-relaxed text-[11.5px] m-0">
                  Efectúa la cancelación de cuentas de resultado (4, 5, 6 y 7) contra la cuenta 5905 y genera apertura APE.
                </p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modal: Abrir Nuevo Periodo -->
      @if (modalNuevo()) {
        <div class="modal-backdrop" data-testid="modal-abrir-periodo-backdrop" (click)="cerrarModales()">
          <div class="modal-box w-[480px] rounded-2xl shadow-xl border border-slate-100 p-6" data-testid="modal-abrir-periodo" (click)="$event.stopPropagation()">
            <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 text-lg shadow-xs">
                  📅
                </div>
                <div>
                  <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-abrir-periodo-title">
                    Abrir Nuevo Periodo Contable
                  </h3>
                  <span class="text-xs text-slate-400 block">Habilita el registro de transacciones contables para el mes</span>
                </div>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
                (click)="cerrarModales()"
              >
                ✕
              </button>
            </div>

            <div class="modal-body space-y-4 pt-4">
              <div class="grid grid-cols-2 gap-3">
                <div class="form-group flex flex-col items-start gap-1">
                  <label class="form-label text-xs font-semibold text-slate-700">Año Fiscal *</label>
                  <input
                    class="input-base w-full text-xs h-[38px] font-semibold"
                    data-testid="input-anio-periodo"
                    type="number"
                    [(ngModel)]="formNuevo.anio"
                    [min]="2020"
                    [max]="2099"
                  />
                </div>
                <div class="form-group flex flex-col items-start gap-1">
                  <label class="form-label text-xs font-semibold text-slate-700">Mes *</label>
                  <select
                    class="input-base w-full text-xs h-[38px] font-semibold"
                    data-testid="select-mes-periodo"
                    [(ngModel)]="formNuevo.mes"
                  >
                    @for (m of meses; track m.valor) {
                      <option [value]="m.valor">{{ m.valor }} — {{ m.nombre }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
                <span class="text-base flex-shrink-0">⚠️</span>
                <span>Asegúrese de que el periodo anterior esté correctamente cuadrado antes de habilitar registros masivos en el nuevo periodo.</span>
              </div>
            </div>

            <div class="modal-footer flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                class="btn-secondary btn-sm font-medium"
                data-testid="btn-cancelar-abrir-periodo"
                (click)="cerrarModales()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary btn-sm flex items-center gap-2 font-semibold shadow-sm"
                data-testid="btn-guardar-abrir-periodo"
                [disabled]="procesando()"
                (click)="guardarNuevoPeriodo()"
              >
                @if (procesando()) {
                  <span class="animate-spin text-xs">⏳</span>
                  <span>Abriendo...</span>
                } @else {
                  <span>📅</span>
                  <span>Abrir Periodo</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal: Cerrar Periodo Definitivamente -->
      <app-modal-cerrar-periodo
        [visible]="modalCierre()"
        [periodo]="periodoSeleccionado()"
        (closeModal)="modalCierre.set(false)"
        (cerrado)="onPeriodoCerrado($event)"
      />

      <!-- Modal: Cierre Anual Periodo 13 y Apertura Fiscal -->
      <app-modal-cierre-anual
        [visible]="modalCierreAnual()"
        [anio]="anioSeleccionado()"
        (closeModal)="modalCierreAnual.set(false)"
        (cierreCompletado)="onCierreAnualCompletado()"
      />
    </div>
  `,
})
export class ContabilidadPeriodosComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly cargando = signal<boolean>(false);
  readonly procesando = signal<boolean>(false);
  readonly modalNuevo = signal<boolean>(false);
  readonly modalCierre = signal<boolean>(false);
  readonly modalCierreAnual = signal<boolean>(false);
  readonly periodos = signal<PeriodoContable[]>([]);
  readonly periodoSeleccionado = signal<PeriodoContable | null>(null);
  readonly anioSeleccionado = signal<number>(new Date().getFullYear());

  readonly busqueda = signal<string>('');
  readonly filtroEstado = signal<string>('');

  readonly aniosDisponibles = [2024, 2025, 2026, 2027, 2099];

  formNuevo = { anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 };

  readonly meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' },
  ];

  // Computed KPIs
  readonly totalAbiertos = computed(() =>
    this.periodos().filter((p) => p.estado === 'ABIERTO').length
  );
  readonly totalBloqueados = computed(() =>
    this.periodos().filter((p) => p.estado === 'BLOQUEADO').length
  );
  readonly totalCerrados = computed(() =>
    this.periodos().filter((p) => p.estado === 'CERRADO').length
  );

  // Periodos filtrados manteniendo orden ascendente por mes
  readonly periodosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const est = this.filtroEstado();
    let lista = [...this.periodos()].sort((a, b) => a.mes - b.mes);

    if (q) {
      lista = lista.filter(
        (p) =>
          this.nombreMes(p.mes).toLowerCase().includes(q) ||
          p.mes.toString().includes(q) ||
          p.anio.toString().includes(q)
      );
    }

    if (est) {
      lista = lista.filter((p) => p.estado === est);
    }

    return lista;
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.getPeriodos(this.anioSeleccionado()).subscribe({
      next: (data) => {
        const sorted = (data || []).sort((a, b) => a.mes - b.mes);
        this.periodos.set(sorted);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  onAnioChange(anio: number): void {
    this.anioSeleccionado.set(Number(anio));
    this.cargar();
  }

  abrirModalNuevoPeriodo(): void {
    this.formNuevo = { anio: this.anioSeleccionado(), mes: new Date().getMonth() + 1 };
    this.modalNuevo.set(true);
  }

  guardarNuevoPeriodo(): void {
    this.procesando.set(true);
    this.svc.abrirPeriodo(this.formNuevo.anio, this.formNuevo.mes).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cerrarModales();
        this.cargar();
      },
      error: () => this.procesando.set(false),
    });
  }

  bloquear(p: PeriodoContable): void {
    this.svc.bloquearPeriodo(p.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    });
  }

  reabrir(p: PeriodoContable): void {
    this.svc.reabrirPeriodo(p.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    });
  }

  abrirModalCierre(p: PeriodoContable): void {
    this.periodoSeleccionado.set(p);
    this.modalCierre.set(true);
  }

  onPeriodoCerrado(_cerrado: PeriodoContable): void {
    this.cargar();
  }

  onCierreAnualCompletado(): void {
    this.cargar();
  }

  cerrarModales(): void {
    this.modalNuevo.set(false);
    this.modalCierre.set(false);
    this.periodoSeleccionado.set(null);
  }

  nombreMes(mes: number): string {
    return this.meses.find((m) => m.valor === mes)?.nombre ?? mes.toString();
  }

  badgePeriodo(estado: EstadoPeriodo): string {
    const map: Record<string, string> = {
      ABIERTO: 'badge-green',
      BLOQUEADO: 'badge-yellow',
      CERRADO: 'badge-red',
    };
    return map[estado] ?? 'badge-gray';
  }
}
