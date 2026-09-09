import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';
import { ContabilidadService } from '../services/contabilidad.service';
import {
  ActivoFijoModel,
  CrearActivoFijoModel,
  DepreciarMesModel,
  RegistrarDeterioroActivoModel,
  ResumenPatrimonialActivosModel,
  CategoriaActivoFijo,
} from '../models/contabilidad.models';

@Component({
  selector: 'app-contabilidad-activos-fijos',
  standalone: true,
  imports: [CommonModule, FormsModule, FlatpickrDirective],
  styles: [`
    .activos-header-banner {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #4f46e5;
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
    .activos-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .activos-icon-wrap {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.75rem;
      background: #eef2ff;
      border: 1px solid #e0e7ff;
      font-size: 1.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .activos-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .activos-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .activos-title-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .activos-subtitle-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .activos-actions-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .activos-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .activos-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .activos-kpis-grid {
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
    .table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow-x: auto;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .custom-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.8rem;
    }
    .custom-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .custom-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
    }
    .custom-table tr:hover td {
      background: #f8fafc;
    }
    .badge-estado {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .badge-activo { background: #dcfce7; color: #15803d; }
    .badge-depreciado { background: #e0e7ff; color: #4338ca; }
    .badge-desvalorizado { background: #fef3c7; color: #b45309; }
    .badge-baja { background: #fee2e2; color: #b91c1c; }

    /* Modal Overlay & Card */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 620px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalFadeIn 0.2s ease-out;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96); }
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
    .modal-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }
    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .modal-footer {
      padding: 0.875rem 1.25rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.625rem;
      background: #f8fafc;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.875rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #334155;
    }
    .form-control {
      padding: 0.45rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      color: #0f172a;
      outline: none;
      background: #ffffff;
    }
    .form-control:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }
    .btn-action-sm {
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
      border-radius: 0.375rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.15s;
    }
    .btn-primary-sm {
      background: #4f46e5;
      color: #ffffff;
      border: none;
    }
    .btn-primary-sm:hover {
      background: #4338ca;
    }
    .btn-secondary-sm {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .btn-secondary-sm:hover {
      background: #e2e8f0;
    }
    .btn-warning-sm {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fcd34d;
    }
    .btn-warning-sm:hover {
      background: #fde68a;
    }
    .btn-danger-sm {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .btn-danger-sm:hover {
      background: #fecaca;
    }
  `],
  template: `
    <!-- Banner Header -->
    <div class="activos-header-banner" data-testid="activos-header-banner">
      <div class="activos-header-main">
        <div class="activos-icon-wrap">🏛️</div>
        <div class="activos-texts-wrap">
          <div class="activos-title-row">
            <h2 class="activos-title-text" data-testid="title-activos-fijos">Activos Fijos & Desvalorización NIIF</h2>
            <span class="badge-mini" style="background: rgba(99, 102, 241, 0.15); color: #4f46e5;">NIC 16 / NIC 36</span>
          </div>
          <p class="activos-subtitle-text">
            Control patrimonial escolar, cálculo de depreciación mensual en línea recta y prueba de deterioro de valor.
          </p>
        </div>
      </div>

      <div class="activos-actions-bar">
        <button
          type="button"
          class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 font-semibold"
          (click)="cargarDatos()"
          data-testid="btn-recargar-activos"
        >
          <span>🔄</span>
          <span>Refrescar</span>
        </button>
        <button
          type="button"
          class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 font-semibold text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100 shadow-2xs"
          (click)="abrirModalDepreciar()"
          data-testid="btn-depreciar-mes"
        >
          <span>⚡</span>
          <span>Depreciación Mensual</span>
        </button>
        <button
          type="button"
          class="btn-primary btn-sm h-[38px] flex items-center gap-1.5 font-semibold shadow-sm"
          (click)="abrirModalCrear()"
          data-testid="btn-nuevo-activo"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Activo</span>
        </button>
      </div>
    </div>

    <!-- 4 Tarjetas KPI -->
    <div class="activos-kpis-grid" data-testid="activos-kpis-grid">
      <!-- KPI 1: Costo Histórico Total -->
      <div
        class="kpi-widget-card"
        style="border-color: #dbeafe; background: linear-gradient(135deg, rgba(219, 234, 254, 0.35) 0%, #ffffff 100%);"
        data-testid="kpi-costo-historico"
      >
        <div class="kpi-widget-header">
          <span class="kpi-widget-title" style="color: #1d4ed8;">Costo Histórico Total</span>
          <span class="text-base">🏛️</span>
        </div>
        <div class="kpi-widget-value" style="color: #1e40af;">
          \${{ (resumen()?.costoHistoricoTotal || 0) | number:'1.0-0' }}
        </div>
        <div class="kpi-widget-footer" style="color: #3b82f6;">Base bruta total de bienes escolares</div>
      </div>

      <!-- KPI 2: Depreciación Acumulada -->
      <div
        class="kpi-widget-card"
        style="border-color: #e0e7ff; background: linear-gradient(135deg, rgba(224, 231, 255, 0.35) 0%, #ffffff 100%);"
        data-testid="kpi-depreciacion-acumulada"
      >
        <div class="kpi-widget-header">
          <span class="kpi-widget-title" style="color: #4338ca;">Depreciación Acumulada</span>
          <span class="text-base">📉</span>
        </div>
        <div class="kpi-widget-value" style="color: #4f46e5;">
          -\${{ (resumen()?.depreciacionAcumuladaTotal || 0) | number:'1.0-0' }}
        </div>
        <div class="kpi-widget-footer" style="color: #6366f1;">Desgaste acumulado en línea recta</div>
      </div>

      <!-- KPI 3: Deterioro NIC 36 Acumulado -->
      <div
        class="kpi-widget-card"
        style="border-color: #fef3c7; background: linear-gradient(135deg, rgba(254, 243, 199, 0.35) 0%, #ffffff 100%);"
        data-testid="kpi-deterioro-acumulado"
      >
        <div class="kpi-widget-header">
          <span class="kpi-widget-title" style="color: #b45309;">Deterioro NIC 36 Acumulado</span>
          <span class="text-base">⚠️</span>
        </div>
        <div class="kpi-widget-value" style="color: #d97706;">
          -\${{ (resumen()?.deterioroAcumuladoTotal || 0) | number:'1.0-0' }}
        </div>
        <div class="kpi-widget-footer" style="color: #f59e0b;">Pérdidas por desvalorización</div>
      </div>

      <!-- KPI 4: Valor Neto en Libros -->
      <div
        class="kpi-widget-card"
        style="border-color: #dcfce7; background: linear-gradient(135deg, rgba(220, 252, 231, 0.35) 0%, #ffffff 100%);"
        data-testid="kpi-valor-neto-libros"
      >
        <div class="kpi-widget-header">
          <span class="kpi-widget-title" style="color: #15803d;">Valor Neto en Libros</span>
          <span class="text-base">💎</span>
        </div>
        <div class="kpi-widget-value" style="color: #16a34a;">
          \${{ (resumen()?.valorNetoEnLibros || 0) | number:'1.0-0' }}
        </div>
        <div class="kpi-widget-footer" style="color: #22c55e;">Patrimonio real ({{ resumen()?.totalActivos || 0 }} activos)</div>
      </div>
    </div>

    <!-- Filtros de búsqueda -->
    <div class="filters-bar" data-testid="activos-filters-bar">
      <div class="filters-left">
        <div class="form-group-inline mb-0">
          <label class="form-label-sm">Buscar Activo</label>
          <input
            type="text"
            class="input-base input-sm"
            placeholder="🔍 Buscar por placa, nombre o responsable..."
            [ngModel]="busqueda()"
            (ngModelChange)="busqueda.set($event)"
            data-testid="input-buscar-activo"
            style="min-width: 260px;"
          />
        </div>
        <div class="form-group-inline mb-0">
          <label class="form-label-sm">Categoría</label>
          <select
            class="input-base input-sm"
            [ngModel]="categoriaFiltro()"
            (ngModelChange)="categoriaFiltro.set($event)"
            data-testid="select-filtro-categoria"
            style="min-width: 200px;"
          >
            <option value="">Todas las Categorías</option>
            <option value="EQUIPO_COMPUTO">Equipos de Cómputo</option>
            <option value="MUEBLES_ENSERES">Muebles y Enseres Escolares</option>
            <option value="MAQUINARIA_EQUIPO">Laboratorios y Maquinaria</option>
            <option value="VEHICULO_TRANSPORTE">Vehículos y Rutas</option>
            <option value="EDIFICACIONES">Edificaciones y Aulas</option>
            <option value="TERRENO">Terrenos y Predios</option>
            <option value="SOFTWARE_INTANGIBLE">Software y Licencias</option>
            <option value="OTROS">Otros Activos</option>
          </select>
        </div>
      </div>

      <span class="text-xs text-slate-500 mb-1" data-testid="label-total-filtrados">
        Mostrando {{ activosFiltrados().length }} activos
      </span>
    </div>

    <!-- Tabla Principal de Activos Fijos -->
    <div class="table-container" data-testid="activos-table-container">
      <table class="custom-table" data-testid="activos-table">
        <thead>
          <tr>
            <th>Placa</th>
            <th>Nombre del Activo</th>
            <th>Categoría</th>
            <th>Fecha Compra</th>
            <th style="text-align: right;">Costo Adquisición</th>
            <th style="text-align: right;">Deprec. Acumulada</th>
            <th style="text-align: right;">Deterioro NIC 36</th>
            <th style="text-align: right;">Valor Neto</th>
            <th style="text-align: center;">Estado</th>
            <th style="text-align: center;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @if (loading()) {
            <tr>
              <td colspan="10" style="text-align: center; padding: 2rem;" data-testid="td-loading">
                ⏳ Cargando inventario de activos fijos...
              </td>
            </tr>
          } @else if (activosFiltrados().length === 0) {
            <tr>
              <td colspan="10" style="text-align: center; padding: 2.5rem; color: #64748b;" data-testid="td-empty">
                No se encontraron activos fijos registrados con los filtros seleccionados.
              </td>
            </tr>
          } @else {
            @for (item of activosFiltrados(); track item.id) {
              <tr [attr.data-testid]="'row-activo-' + item.placa">
                <td>
                  <strong class="font-mono text-indigo-700">{{ item.placa }}</strong>
                </td>
                <td>
                  <div class="font-semibold text-slate-800">{{ item.nombre }}</div>
                  <div class="text-xs text-slate-400">
                    {{ item.ubicacionFisica || 'Sede Principal' }} • Resp: {{ item.responsableNombre || 'Sin asignar' }}
                  </div>
                </td>
                <td>
                  <span class="text-xs text-slate-600 font-medium">{{ formatCategoria(item.categoria) }}</span>
                </td>
                <td>{{ item.fechaAdquisicion }}</td>
                <td style="text-align: right; font-weight: 600;">
                  \${{ item.costoAdquisicion | number:'1.0-0' }}
                </td>
                <td style="text-align: right; color: #4f46e5;">
                  \${{ item.depreciacionAcumulada | number:'1.0-0' }}
                </td>
                <td style="text-align: right; color: #d97706;">
                  \${{ item.deterioroAcumulado | number:'1.0-0' }}
                </td>
                <td style="text-align: right; font-weight: 700; color: #15803d;">
                  \${{ item.valorEnLibros | number:'1.0-0' }}
                </td>
                <td style="text-align: center;">
                  <span
                    class="badge-estado"
                    [ngClass]="{
                      'badge-activo': item.estado === 'ACTIVO',
                      'badge-depreciado': item.estado === 'TOTALMENTE_DEPRECIADO',
                      'badge-desvalorizado': item.estado === 'DESVALORIZADO',
                      'badge-baja': item.estado === 'DADO_DE_BAJA'
                    }"
                  >
                    {{ item.estado }}
                  </span>
                </td>
                <td style="text-align: center;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                    <button
                      type="button"
                      class="btn-action-sm btn-secondary-sm"
                      (click)="verFichaActivo(item)"
                      [attr.data-testid]="'btn-ficha-' + item.placa"
                      title="Ver Ficha e Historial"
                    >
                      👁️ Ficha
                    </button>
                    @if (item.estado !== 'DADO_DE_BAJA') {
                      <button
                        type="button"
                        class="btn-action-sm btn-warning-sm"
                        (click)="abrirModalDeterioro(item)"
                        [attr.data-testid]="'btn-deterioro-' + item.placa"
                        title="Prueba de Desvalorización NIC 36"
                      >
                        📉 NIC 36
                      </button>
                      <button
                        type="button"
                        class="btn-action-sm btn-danger-sm"
                        (click)="abrirModalBaja(item)"
                        [attr.data-testid]="'btn-baja-' + item.placa"
                        title="Dar de Baja Activo"
                      >
                        🗑️
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

    <!-- MODAL 1: Nuevo Activo Fijo -->
    @if (modalCrearAbierto()) {
      <div class="modal-overlay" data-testid="modal-nuevo-activo">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">
              <span>🏛️ Registrar Nuevo Activo Fijo Escolar</span>
            </h3>
            <button type="button" class="btn-action-sm btn-secondary-sm" (click)="cerrarModalCrear()" data-testid="btn-cerrar-x-crear">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Placa Física / Código *</label>
                <input
                  type="text"
                  class="form-control font-mono font-bold"
                  placeholder="Ej: ACT-2026-002"
                  [(ngModel)]="nuevoActivo.placa"
                  data-testid="input-activo-placa"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Categoría *</label>
                <select
                  class="form-control"
                  [(ngModel)]="nuevoActivo.categoria"
                  (change)="onCambioCategoriaNuevo()"
                  data-testid="select-activo-categoria"
                >
                  <option value="EQUIPO_COMPUTO">Equipo de Cómputo (36 m)</option>
                  <option value="MUEBLES_ENSERES">Muebles y Enseres (120 m)</option>
                  <option value="MAQUINARIA_EQUIPO">Maquinaria y Laboratorio (120 m)</option>
                  <option value="VEHICULO_TRANSPORTE">Vehículo / Ruta (60 m)</option>
                  <option value="EDIFICACIONES">Edificación Escolar (240 m)</option>
                  <option value="TERRENO">Terreno (Sin depreciación)</option>
                  <option value="SOFTWARE_INTANGIBLE">Software / Intangible (36 m)</option>
                  <option value="OTROS">Otros</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nombre / Descripción del Activo *</label>
              <input
                type="text"
                class="form-control"
                placeholder="Ej: Microscopio Binocular Laboratorio Biología"
                [(ngModel)]="nuevoActivo.nombre"
                data-testid="input-activo-nombre"
              />
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Fecha de Adquisición *</label>
                <input
                  type="text"
                  appFlatpickr
                  placeholder="dd/mm/aaaa"
                  class="form-control"
                  [(ngModel)]="nuevoActivo.fechaAdquisicion"
                  data-testid="input-activo-fecha"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Costo Adquisición (COP) *</label>
                <input
                  type="number"
                  class="form-control font-bold"
                  placeholder="0"
                  [(ngModel)]="nuevoActivo.costoAdquisicion"
                  data-testid="input-activo-costo"
                />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Valor Residual Estimado (COP)</label>
                <input
                  type="number"
                  class="form-control"
                  placeholder="0"
                  [(ngModel)]="nuevoActivo.valorResidual"
                  data-testid="input-activo-residual"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Vida Útil (Meses)</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="nuevoActivo.vidaUtilMeses"
                  data-testid="input-activo-vidautil"
                />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Ubicación Física</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej: Laboratorio de Ciencias Piso 2"
                  [(ngModel)]="nuevoActivo.ubicacionFisica"
                  data-testid="input-activo-ubicacion"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Responsable Asignado</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej: Lic. Roberto Gómez"
                  [(ngModel)]="nuevoActivo.responsableNombre"
                  data-testid="input-activo-responsable"
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn-action-sm btn-secondary-sm"
              (click)="cerrarModalCrear()"
              data-testid="btn-cancelar-crear"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-action-sm btn-primary-sm"
              (click)="guardarActivo()"
              [disabled]="!nuevoActivo.placa || !nuevoActivo.nombre || !nuevoActivo.costoAdquisicion"
              data-testid="btn-confirmar-crear"
            >
              💾 Guardar Activo
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 2: Ejecutar Depreciación Mensual Masiva -->
    @if (modalDepreciarAbierto()) {
      <div class="modal-overlay" data-testid="modal-depreciar-mes">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">
              <span>⚡ Depreciación Mensual Línea Recta (NIC 16)</span>
            </h3>
            <button type="button" class="btn-action-sm btn-secondary-sm" (click)="cerrarModalDepreciar()" data-testid="btn-cerrar-x-depreciar">✕</button>
          </div>
          <div class="modal-body">
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 0.75rem 1rem; border-radius: 0.375rem;">
              <p class="text-xs text-blue-900 m-0">
                Esta acción ejecutará el cálculo de cuota mensual para todos los activos activos escolares. Generará un comprobante de Nota de Contabilidad (<strong>NOT</strong>) debitando la cuenta de gasto <strong>5160xx</strong> y acreditando la cuenta de depreciación acumulada <strong>1592xx</strong>.
              </p>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Año Fiscal</label>
                <input
                  type="number"
                  class="form-control font-bold"
                  [(ngModel)]="depreciacionForm.periodoAnio"
                  data-testid="input-depreciar-anio"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Mes de Ejecución</label>
                <select
                  class="form-control font-bold"
                  [(ngModel)]="depreciacionForm.periodoMes"
                  data-testid="select-depreciar-mes"
                >
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn-action-sm btn-secondary-sm"
              (click)="cerrarModalDepreciar()"
              data-testid="btn-cancelar-depreciacion"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-action-sm btn-primary-sm"
              (click)="ejecutarDepreciacionMes()"
              data-testid="btn-confirmar-depreciacion"
            >
              ⚡ Ejecutar Depreciación y Contabilizar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 3: Prueba de Desvalorización / Deterioro NIC 36 -->
    @if (modalDeterioroAbierto()) {
      <div class="modal-overlay" data-testid="modal-deterioro">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">
              <span>📉 Prueba de Desvalorización / Deterioro (NIC 36)</span>
            </h3>
            <button type="button" class="btn-action-sm btn-secondary-sm" (click)="cerrarModalDeterioro()" data-testid="btn-cerrar-x-deterioro">✕</button>
          </div>
          <div class="modal-body">
            @if (activoSeleccionado(); as act) {
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 1rem;">
                <div class="text-xs text-slate-500 font-mono">{{ act.placa }}</div>
                <div class="font-bold text-slate-800">{{ act.nombre }}</div>
                <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-xs">
                  <span>Valor Actual en Libros:</span>
                  <strong class="text-indigo-700 text-sm">\${{ act.valorEnLibros | number:'1.0-0' }} COP</strong>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Fecha del Test / Peritaje *</label>
                  <input
                    type="text"
                    appFlatpickr
                    placeholder="dd/mm/aaaa"
                    class="form-control"
                    [(ngModel)]="deterioroForm.fechaTest"
                    data-testid="input-deterioro-fecha"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Importe Recuperable (COP) *</label>
                  <input
                    type="number"
                    class="form-control font-bold"
                    placeholder="Valor de mercado o en uso"
                    [(ngModel)]="deterioroForm.importeRecuperable"
                    data-testid="input-deterioro-recuperable"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Motivo / Dictamen Técnico de Desvalorización *</label>
                <textarea
                  rows="3"
                  class="form-control"
                  placeholder="Detallar causa física, obsolescencia tecnológica o daño según inspección..."
                  [(ngModel)]="deterioroForm.motivo"
                  data-testid="textarea-deterioro-motivo"
                ></textarea>
              </div>

              @if (deterioroForm.importeRecuperable > 0 && deterioroForm.importeRecuperable < act.valorEnLibros) {
                <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 0.5rem; padding: 0.75rem 1rem;" data-testid="banner-perdida-calculada">
                  <div class="text-xs text-red-600 font-semibold">Pérdida por Desvalorización a Reconocer:</div>
                  <div class="text-lg font-bold text-red-700">
                    \${{ (act.valorEnLibros - deterioroForm.importeRecuperable) | number:'1.0-0' }} COP
                  </div>
                  <div class="text-xs text-slate-500 mt-1">
                    Se generará comprobante NOT debitando cuenta 531305 (Pérdida Deterioro) y acreditando 159905 (Deterioro Acumulado).
                  </div>
                </div>
              }
            }
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn-action-sm btn-secondary-sm"
              (click)="cerrarModalDeterioro()"
              data-testid="btn-cancelar-deterioro"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-action-sm btn-warning-sm"
              (click)="ejecutarRegistroDeterioro()"
              [disabled]="!deterioroForm.importeRecuperable || !deterioroForm.motivo"
              data-testid="btn-confirmar-deterioro"
            >
              📉 Registrar Desvalorización NIC 36
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 4: Ficha e Historial del Activo -->
    @if (modalDetalleAbierto()) {
      <div class="modal-overlay" data-testid="modal-detalle-activo">
        <div class="modal-card" style="max-width: 720px;">
          <div class="modal-header">
            <h3 class="modal-title">
              <span>📋 Ficha Patrimonial e Historial NIIF</span>
            </h3>
            <button type="button" class="btn-action-sm btn-secondary-sm" (click)="cerrarModalDetalle()" data-testid="btn-cerrar-x-detalle">✕</button>
          </div>
          <div class="modal-body">
            @if (activoSeleccionado(); as act) {
              <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div><strong>Placa:</strong> {{ act.placa }}</div>
                <div><strong>Nombre:</strong> {{ act.nombre }}</div>
                <div><strong>Categoría:</strong> {{ formatCategoria(act.categoria) }}</div>
                <div><strong>Fecha Compra:</strong> {{ act.fechaAdquisicion }}</div>
                <div><strong>Costo Compra:</strong> \${{ act.costoAdquisicion | number:'1.0-0' }}</div>
                <div><strong>Valor Residual:</strong> \${{ act.valorResidual | number:'1.0-0' }}</div>
                <div><strong>Vida Útil:</strong> {{ act.vidaUtilMeses }} meses</div>
                <div><strong>Meses Depreciados:</strong> {{ act.mesesDepreciados }} meses</div>
                <div><strong>Depreciación Acum.:</strong> \${{ act.depreciacionAcumulada | number:'1.0-0' }}</div>
                <div><strong>Deterioro Acum.:</strong> \${{ act.deterioroAcumulado | number:'1.0-0' }}</div>
                <div class="col-span-2 text-sm pt-2 border-t border-slate-200 font-bold text-green-700">
                  Valor Neto en Libros Actual: \${{ act.valorEnLibros | number:'1.0-0' }} COP
                </div>
              </div>

              <!-- Historial de Cuotas -->
              <div>
                <h4 class="text-xs font-bold text-slate-700 mb-1">Historial de Cuotas de Depreciación</h4>
                <div style="max-height: 140px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 0.5rem;">
                  <table class="custom-table">
                    <thead>
                      <tr>
                        <th>Periodo</th>
                        <th style="text-align: right;">Cuota</th>
                        <th style="text-align: right;">Deprec. Acumulada</th>
                        <th style="text-align: right;">Valor en Libros</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (!act.depreciaciones || act.depreciaciones.length === 0) {
                        <tr>
                          <td colspan="4" class="text-center text-xs text-slate-400 py-2">Sin cuotas registradas aún.</td>
                        </tr>
                      } @else {
                        @for (d of act.depreciaciones; track d.id) {
                          <tr>
                            <td>{{ d.periodoMes }}/{{ d.periodoAnio }}</td>
                            <td style="text-align: right;">\${{ d.cuotaDepreciacion | number:'1.0-0' }}</td>
                            <td style="text-align: right;">\${{ d.depreciacionAcumuladaResultante | number:'1.0-0' }}</td>
                            <td style="text-align: right; font-weight: 600;">\${{ d.valorEnLibrosResultante | number:'1.0-0' }}</td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Historial de Deterioros -->
              <div>
                <h4 class="text-xs font-bold text-slate-700 mb-1">Historial de Pruebas de Desvalorización (NIC 36)</h4>
                <div style="max-height: 140px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 0.5rem;">
                  <table class="custom-table">
                    <thead>
                      <tr>
                        <th>Fecha Test</th>
                        <th style="text-align: right;">Importe Recup.</th>
                        <th style="text-align: right;">Pérdida Reconocida</th>
                        <th>Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (!act.deterioros || act.deterioros.length === 0) {
                        <tr>
                          <td colspan="4" class="text-center text-xs text-slate-400 py-2">Sin registros de deterioro.</td>
                        </tr>
                      } @else {
                        @for (det of act.deterioros; track det.id) {
                          <tr>
                            <td>{{ det.fechaTest }}</td>
                            <td style="text-align: right;">\${{ det.importeRecuperable | number:'1.0-0' }}</td>
                            <td style="text-align: right; color: #dc2626; font-weight: 600;">\${{ det.perdidaDeterioro | number:'1.0-0' }}</td>
                            <td class="text-xs text-slate-600">{{ det.motivo }}</td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn-action-sm btn-secondary-sm"
              (click)="cerrarModalDetalle()"
              data-testid="btn-cerrar-detalle"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 5: Confirmar Dar de Baja -->
    @if (modalBajaAbierto()) {
      <div class="modal-overlay" data-testid="modal-dar-de-baja">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">
              <span>🗑️ Dar de Baja Activo Fijo</span>
            </h3>
            <button type="button" class="btn-action-sm btn-secondary-sm" (click)="cerrarModalBaja()" data-testid="btn-cerrar-x-baja">✕</button>
          </div>
          <div class="modal-body">
            @if (activoSeleccionado(); as act) {
              <p class="text-xs text-slate-700 m-0">
                ¿Está seguro de dar de baja el activo <strong>{{ act.placa }} - {{ act.nombre }}</strong>?
                El estado cambiará a <code>DADO_DE_BAJA</code> y no computará en futuras depreciaciones.
              </p>
              <div class="form-group mt-2">
                <label class="form-label">Motivo de Baja *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej: Daño irreparable por inundación o venta autorizada..."
                  [(ngModel)]="bajaMotivo"
                  data-testid="input-baja-motivo"
                />
              </div>
            }
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn-action-sm btn-secondary-sm"
              (click)="cerrarModalBaja()"
              data-testid="btn-cancelar-baja"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-action-sm btn-danger-sm"
              (click)="confirmarBaja()"
              [disabled]="!bajaMotivo"
              data-testid="btn-confirmar-baja"
            >
              🗑️ Confirmar Baja
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 6: Resultado de Operación Contable -->
    @if (modalResultadoAbierto()) {
      <div class="modal-overlay" data-testid="modal-resultado-operacion">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">
              <span>✅ Operación Contable Exitosa</span>
            </h3>
            <button type="button" class="btn-action-sm btn-secondary-sm" (click)="cerrarModalResultado()" data-testid="btn-cerrar-x-resultado">✕</button>
          </div>
          <div class="modal-body">
            @if (resultadoInfo(); as res) {
              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 0.5rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                <div class="font-bold text-green-800 text-sm">{{ res.titulo }}</div>
                <div class="text-xs text-green-700">{{ res.detalle }}</div>
                @if (res.asientoId) {
                  <div class="text-xs font-mono text-indigo-700 bg-white p-2 rounded border border-indigo-200 mt-1">
                    Comprobante Contable NOT Asentado: <strong>{{ res.asientoId }}</strong>
                  </div>
                }
              </div>
            }
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn-action-sm btn-primary-sm"
              (click)="cerrarModalResultado()"
              data-testid="btn-cerrar-resultado"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ContabilidadActivosFijosComponent implements OnInit {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly loading = signal(false);
  readonly activos = signal<ActivoFijoModel[]>([]);
  readonly resumen = signal<ResumenPatrimonialActivosModel | null>(null);

  readonly categoriaFiltro = signal('');
  readonly busqueda = signal('');

  // Modales
  readonly modalCrearAbierto = signal(false);
  readonly modalDepreciarAbierto = signal(false);
  readonly modalDeterioroAbierto = signal(false);
  readonly modalDetalleAbierto = signal(false);
  readonly modalBajaAbierto = signal(false);
  readonly modalResultadoAbierto = signal(false);

  readonly activoSeleccionado = signal<ActivoFijoModel | null>(null);
  readonly resultadoInfo = signal<{ titulo: string; detalle: string; asientoId?: string } | null>(null);

  nuevoActivo: CrearActivoFijoModel = {
    placa: '',
    nombre: '',
    categoria: 'EQUIPO_COMPUTO',
    fechaAdquisicion: new Date().toISOString().split('T')[0],
    costoAdquisicion: 0,
    valorResidual: 0,
    vidaUtilMeses: 36,
    centroCostoCodigo: 'CC-TEC',
    ubicacionFisica: 'Sede Principal',
    responsableNombre: '',
  };

  depreciacionForm: DepreciarMesModel = {
    periodoAnio: new Date().getFullYear(),
    periodoMes: new Date().getMonth() + 1,
  };

  deterioroForm: RegistrarDeterioroActivoModel = {
    activoId: '',
    fechaTest: new Date().toISOString().split('T')[0],
    importeRecuperable: 0,
    motivo: '',
  };

  bajaMotivo = '';

  readonly activosFiltrados = computed(() => {
    const list = this.activos();
    const query = this.busqueda().toLowerCase().trim();
    const cat = this.categoriaFiltro();

    let res = list;
    if (cat) {
      res = res.filter((a) => a.categoria === cat);
    }
    if (query) {
      res = res.filter(
        (a) =>
          a.placa.toLowerCase().includes(query) ||
          a.nombre.toLowerCase().includes(query) ||
          (a.responsableNombre && a.responsableNombre.toLowerCase().includes(query)) ||
          (a.ubicacionFisica && a.ubicacionFisica.toLowerCase().includes(query)),
      );
    }
    return res;
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.contabilidadService.getResumenPatrimonialActivos().subscribe({
      next: (res) => this.resumen.set(res),
      error: (err) => console.error('Error cargando resumen patrimonial:', err),
    });

    this.contabilidadService.getActivosFijos(this.categoriaFiltro() || undefined).subscribe({
      next: (list) => {
        this.activos.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando activos fijos:', err);
        this.loading.set(false);
      },
    });
  }

  onCambioCategoria(): void {
    this.cargarDatos();
  }

  filtrar(): void {
    // computed activosFiltrados reacts to busqueda()
  }

  formatCategoria(cat: CategoriaActivoFijo): string {
    switch (cat) {
      case 'EQUIPO_COMPUTO': return 'Equipo Cómputo';
      case 'MUEBLES_ENSERES': return 'Muebles y Enseres';
      case 'MAQUINARIA_EQUIPO': return 'Maquinaria y Lab';
      case 'VEHICULO_TRANSPORTE': return 'Vehículos y Rutas';
      case 'EDIFICACIONES': return 'Edificaciones';
      case 'TERRENO': return 'Terrenos';
      case 'SOFTWARE_INTANGIBLE': return 'Software / Intangible';
      default: return cat;
    }
  }

  // --- MODAL CREAR ---
  abrirModalCrear(): void {
    this.nuevoActivo = {
      placa: `ACT-${new Date().getFullYear()}-${String(this.activos().length + 1).padStart(3, '0')}`,
      nombre: '',
      categoria: 'EQUIPO_COMPUTO',
      fechaAdquisicion: new Date().toISOString().split('T')[0],
      costoAdquisicion: 0,
      valorResidual: 0,
      vidaUtilMeses: 36,
      centroCostoCodigo: 'CC-TEC',
      ubicacionFisica: 'Sede Principal',
      responsableNombre: '',
    };
    this.modalCrearAbierto.set(true);
  }

  cerrarModalCrear(): void {
    this.modalCrearAbierto.set(false);
  }

  onCambioCategoriaNuevo(): void {
    switch (this.nuevoActivo.categoria) {
      case 'EQUIPO_COMPUTO':
        this.nuevoActivo.vidaUtilMeses = 36;
        this.nuevoActivo.centroCostoCodigo = 'CC-TEC';
        break;
      case 'VEHICULO_TRANSPORTE':
        this.nuevoActivo.vidaUtilMeses = 60;
        this.nuevoActivo.centroCostoCodigo = 'CC-TRA';
        break;
      case 'MUEBLES_ENSERES':
        this.nuevoActivo.vidaUtilMeses = 120;
        this.nuevoActivo.centroCostoCodigo = 'CC-ADM';
        break;
      case 'MAQUINARIA_EQUIPO':
        this.nuevoActivo.vidaUtilMeses = 120;
        this.nuevoActivo.centroCostoCodigo = 'CC-ACA';
        break;
      case 'EDIFICACIONES':
        this.nuevoActivo.vidaUtilMeses = 240;
        this.nuevoActivo.centroCostoCodigo = 'CC-PLA';
        break;
      case 'TERRENO':
        this.nuevoActivo.vidaUtilMeses = 0;
        break;
      default:
        this.nuevoActivo.vidaUtilMeses = 60;
    }
  }

  guardarActivo(): void {
    if (!this.nuevoActivo.placa || !this.nuevoActivo.nombre || !this.nuevoActivo.costoAdquisicion) return;

    this.contabilidadService.crearActivoFijo(this.nuevoActivo).subscribe({
      next: (created) => {
        this.cerrarModalCrear();
        this.cargarDatos();
        this.resultadoInfo.set({
          titulo: 'Activo Fijo Creado Exitosamente',
          detalle: `Se registró el activo ${created.placa} - ${created.nombre} con costo histórico de $${Number(created.costoAdquisicion).toLocaleString()} COP.`,
        });
        this.modalResultadoAbierto.set(true);
      },
      error: (err) => alert(err?.error?.message || 'Error registrando activo fijo'),
    });
  }

  // --- MODAL DEPRECIAR MES ---
  abrirModalDepreciar(): void {
    this.depreciacionForm = {
      periodoAnio: new Date().getFullYear(),
      periodoMes: new Date().getMonth() + 1,
    };
    this.modalDepreciarAbierto.set(true);
  }

  cerrarModalDepreciar(): void {
    this.modalDepreciarAbierto.set(false);
  }

  ejecutarDepreciacionMes(): void {
    const payload: DepreciarMesModel = {
      periodoAnio: Number(this.depreciacionForm.periodoAnio),
      periodoMes: Number(this.depreciacionForm.periodoMes),
    };

    this.contabilidadService.depreciarMesActivos(payload).subscribe({
      next: (res) => {
        this.cerrarModalDepreciar();
        this.cargarDatos();
        this.resultadoInfo.set({
          titulo: 'Depreciación Masiva Ejecutada',
          detalle: `Se procesaron ${res.totalActivosDepreciados} activos depreciables. Total depreciación del mes: $${Number(res.totalDepreciacionMes).toLocaleString()} COP.`,
          asientoId: res.asientoId,
        });
        this.modalResultadoAbierto.set(true);
      },
      error: (err) => alert(err?.error?.message || 'Error al ejecutar depreciación mensual'),
    });
  }

  // --- MODAL DETERIORO NIC 36 ---
  abrirModalDeterioro(activo: ActivoFijoModel): void {
    this.activoSeleccionado.set(activo);
    this.deterioroForm = {
      activoId: activo.id,
      fechaTest: new Date().toISOString().split('T')[0],
      importeRecuperable: Math.round(Number(activo.valorEnLibros) * 0.8),
      motivo: '',
    };
    this.modalDeterioroAbierto.set(true);
  }

  cerrarModalDeterioro(): void {
    this.modalDeterioroAbierto.set(false);
  }

  ejecutarRegistroDeterioro(): void {
    if (!this.deterioroForm.importeRecuperable || !this.deterioroForm.motivo) return;

    this.contabilidadService.registrarDeterioroActivo(this.deterioroForm).subscribe({
      next: (det) => {
        this.cerrarModalDeterioro();
        this.cargarDatos();
        this.resultadoInfo.set({
          titulo: 'Pérdida por Desvalorización NIC 36 Contabilizada',
          detalle: `Pérdida reconocida: $${Number(det.perdidaDeterioro).toLocaleString()} COP. Nuevo importe recuperable en libros: $${Number(det.importeRecuperable).toLocaleString()} COP.`,
          asientoId: det.asientoId,
        });
        this.modalResultadoAbierto.set(true);
      },
      error: (err) => alert(err?.error?.message || 'Error registrando deterioro NIC 36'),
    });
  }

  // --- MODAL DETALLE / HISTORIAL ---
  verFichaActivo(activo: ActivoFijoModel): void {
    this.contabilidadService.getActivoFijoPorId(activo.id).subscribe({
      next: (full) => {
        this.activoSeleccionado.set(full);
        this.modalDetalleAbierto.set(true);
      },
      error: () => {
        this.activoSeleccionado.set(activo);
        this.modalDetalleAbierto.set(true);
      },
    });
  }

  cerrarModalDetalle(): void {
    this.modalDetalleAbierto.set(false);
  }

  // --- MODAL BAJA ---
  abrirModalBaja(activo: ActivoFijoModel): void {
    this.activoSeleccionado.set(activo);
    this.bajaMotivo = '';
    this.modalBajaAbierto.set(true);
  }

  cerrarModalBaja(): void {
    this.modalBajaAbierto.set(false);
  }

  confirmarBaja(): void {
    const act = this.activoSeleccionado();
    if (!act || !this.bajaMotivo) return;

    this.contabilidadService.darDeBajaActivo(act.id, this.bajaMotivo).subscribe({
      next: () => {
        this.cerrarModalBaja();
        this.cargarDatos();
        this.resultadoInfo.set({
          titulo: 'Activo Dado de Baja',
          detalle: `El activo ${act.placa} ha sido retirado de servicio por motivo: "${this.bajaMotivo}".`,
        });
        this.modalResultadoAbierto.set(true);
      },
      error: (err) => alert(err?.error?.message || 'Error dando de baja el activo'),
    });
  }

  // --- MODAL RESULTADO ---
  cerrarModalResultado(): void {
    this.modalResultadoAbierto.set(false);
  }
}
