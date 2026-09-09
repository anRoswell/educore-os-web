import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { ConceptoMapping } from '../models/contabilidad.models';
import { ModalEditarMapeoComponent } from '../modals/modal-editar-mapeo.component';

@Component({
  selector: 'app-contabilidad-mapeo',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalEditarMapeoComponent],
  styles: [`
    .mapeo-header-banner {
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
    .mapeo-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .mapeo-icon-wrap {
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
    .mapeo-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .mapeo-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .mapeo-title-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .mapeo-subtitle-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .mapeo-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .mapeo-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .mapeo-kpis-grid {
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
  `],
  template: `
    <div class="tab-content" data-testid="tab-content-mapeo">
      <!-- Header Banner -->
      <div class="mapeo-header-banner" data-testid="mapeo-header-banner">
        <div class="mapeo-header-main">
          <div class="mapeo-icon-wrap">🔗</div>
          <div class="mapeo-texts-wrap">
            <div class="mapeo-title-row">
              <h2 class="mapeo-title-text" data-testid="mapeo-titulo">
                Mapeo de Conceptos a Cuentas PUC
              </h2>
              <span class="badge-mini" style="background: rgba(99, 102, 241, 0.15); color: #4f46e5; border-color: rgba(99, 102, 241, 0.25);">
                NIIF 15 / PUC Escolar
              </span>
            </div>
            <p class="mapeo-subtitle-text">
              Parametrización contable de conceptos de tesorería a cuentas PUC para automatización y causación en tiempo real.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 font-semibold"
            (click)="cargarMapeos()"
            data-testid="btn-recargar-mapeos"
          >
            <span>🔄</span>
            <span>Refrescar</span>
          </button>

          <button
            type="button"
            class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 font-semibold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 shadow-2xs"
            data-testid="btn-seed-mapeos"
            [disabled]="sembrando()"
            (click)="sembrarMapeos()"
          >
            <span>{{ sembrando() ? '⏳' : '⚡' }}</span>
            <span>{{ sembrando() ? 'Sembrando Mapeo...' : 'Sembrar Mapeo Base' }}</span>
          </button>
        </div>
      </div>

      <!-- KPIs Grid -->
      <div class="mapeo-kpis-grid" data-testid="mapeo-kpis-grid">
        <!-- KPI 1: Total Conceptos -->
        <div
          class="kpi-widget-card"
          style="border-color: #e0e7ff; background: linear-gradient(135deg, rgba(224, 231, 255, 0.35) 0%, #ffffff 100%);"
          data-testid="kpi-total-conceptos"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #4338ca;">Conceptos Mapeados</span>
            <span class="text-base">🔗</span>
          </div>
          <div class="kpi-widget-value stat-value" style="color: #4f46e5;">
            {{ mappings().length }}
          </div>
          <div class="kpi-widget-footer" style="color: #6366f1;">Tesorería y facturación escolar</div>
        </div>

        <!-- KPI 2: Cuentas de Ingreso -->
        <div
          class="kpi-widget-card"
          style="border-color: #dcfce7; background: linear-gradient(135deg, rgba(220, 252, 231, 0.35) 0%, #ffffff 100%);"
          data-testid="kpi-cuentas-ingreso"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #15803d;">Cuentas de Ingreso</span>
            <span class="text-base">💰</span>
          </div>
          <div class="kpi-widget-value stat-value" style="color: #16a34a;">
            {{ totalCuentasIngreso() }}
          </div>
          <div class="kpi-widget-footer" style="color: #22c55e;">Clase 41 (Pensiones y matrículas)</div>
        </div>

        <!-- KPI 3: Cuentas CxC -->
        <div
          class="kpi-widget-card"
          style="border-color: #dbeafe; background: linear-gradient(135deg, rgba(219, 234, 254, 0.35) 0%, #ffffff 100%);"
          data-testid="kpi-cuentas-cxc"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #1d4ed8;">Cuentas Cartera / CxC</span>
            <span class="text-base">📑</span>
          </div>
          <div class="kpi-widget-value stat-value" style="color: #1e40af;">
            {{ totalCuentasCxc() }}
          </div>
          <div class="kpi-widget-footer" style="color: #3b82f6;">Clase 1305 (Clientes y acudientes)</div>
        </div>

        <!-- KPI 4: Mapeos Activos -->
        <div
          class="kpi-widget-card"
          style="border-color: #d1fae5; background: linear-gradient(135deg, rgba(209, 250, 229, 0.35) 0%, #ffffff 100%);"
          data-testid="kpi-mapeos-activos"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #047857;">Mapeos Operativos</span>
            <span class="text-base">✅</span>
          </div>
          <div class="kpi-widget-value stat-value" style="color: #059669;">
            {{ totalMapeosActivos() }}
          </div>
          <div class="kpi-widget-footer" style="color: #10b981;">
            {{ totalMapeosActivos() === mappings().length ? '100% parametrización completa' : 'Revisar conceptos pendientes' }}
          </div>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="filters-bar" data-testid="mapeo-filters-bar">
        <div class="filters-left">
          <div class="form-group-inline mb-0">
            <label class="form-label-sm">Buscar Concepto o Cuenta</label>
            <input
              type="text"
              class="input-base input-sm"
              placeholder="🔍 Buscar por concepto, código o nombre de cuenta..."
              [ngModel]="busqueda()"
              (ngModelChange)="busqueda.set($event)"
              data-testid="input-buscar-mapeo"
              style="min-width: 300px;"
            />
          </div>

          <div class="form-group-inline mb-0">
            <label class="form-label-sm">Estado</label>
            <select
              class="input-base input-sm font-semibold"
              [ngModel]="filtroEstado()"
              (ngModelChange)="filtroEstado.set($event)"
              data-testid="select-filtro-estado-mapeo"
              style="min-width: 160px;"
            >
              <option value="">Todos los Estados</option>
              <option value="ACTIVO">Solo Activos</option>
              <option value="INACTIVO">Solo Inactivos</option>
            </select>
          </div>
        </div>

        <span class="text-xs text-slate-500 mb-1 font-medium" data-testid="label-total-mapeos-filtrados">
          Mostrando {{ mappingsFiltrados().length }} de {{ mappings().length }} mapeos
        </span>
      </div>

      <!-- Estado de carga -->
      @if (cargando()) {
        <div class="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 shadow-xs" data-testid="mapeo-loading-spinner">
          <div class="spinner mb-2"></div>
          <span class="text-xs text-slate-500 font-medium">Cargando parametrización contable...</span>
        </div>
      } @else {
        <!-- Tabla de Mapeos -->
        <div class="table-container tabla-base" data-testid="tabla-mapeo-container">
          <table class="custom-table tabla-datos w-full text-xs" data-testid="tabla-mapeo">
            <thead>
              <tr>
                <th class="w-48 text-left py-3 px-4">Concepto Escolar</th>
                <th class="text-left py-3 px-4">Cuenta Ingreso (Clase 4)</th>
                <th class="text-left py-3 px-4">Cuenta CxC (Clase 13)</th>
                <th class="text-left py-3 px-4">Cuenta Descuento / Beca</th>
                <th class="text-left py-3 px-4">Caja / Banco Default</th>
                <th class="w-28 text-center py-3 px-4">Estado</th>
                <th class="w-24 text-center py-3 px-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (m of mappingsFiltrados(); track m.id) {
                <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100" [attr.data-testid]="'row-mapeo-' + m.id">
                  <td class="font-bold text-slate-800 py-3 px-4">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {{ m.tipoConceptoCodigo }}
                      </span>
                      @if (m.conceptoNombre) {
                        <span class="text-slate-600 font-normal text-xs">({{ m.conceptoNombre }})</span>
                      }
                    </div>
                  </td>
                  <td class="font-mono py-3 px-4">
                    @if (m.cuentaIngreso) {
                      <span class="inline-flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50/70 border border-emerald-200 px-2 py-0.5 rounded">
                        <span>{{ m.cuentaIngreso.codigo }}</span>
                        <span class="font-sans font-normal text-slate-600">— {{ m.cuentaIngreso.nombre }}</span>
                      </span>
                    } @else if (m.cuentaIngresoCodigo) {
                      <span class="font-semibold text-emerald-700">{{ m.cuentaIngresoCodigo }}</span>
                    } @else {
                      <span class="text-slate-400 italic">No asignada</span>
                    }
                  </td>
                  <td class="font-mono py-3 px-4">
                    @if (m.cuentaCxc) {
                      <span class="inline-flex items-center gap-1.5 text-blue-800 font-semibold bg-blue-50/70 border border-blue-200 px-2 py-0.5 rounded">
                        <span>{{ m.cuentaCxc.codigo }}</span>
                        <span class="font-sans font-normal text-slate-600">— {{ m.cuentaCxc.nombre }}</span>
                      </span>
                    } @else {
                      <span class="text-slate-400 italic">No asignada</span>
                    }
                  </td>
                  <td class="font-mono py-3 px-4">
                    @if (m.cuentaDescuento) {
                      <span class="inline-flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-50/70 border border-amber-200 px-2 py-0.5 rounded">
                        <span>{{ m.cuentaDescuento.codigo }}</span>
                        <span class="font-sans font-normal text-slate-600">— {{ m.cuentaDescuento.nombre }}</span>
                      </span>
                    } @else {
                      <span class="text-slate-400">—</span>
                    }
                  </td>
                  <td class="font-mono py-3 px-4">
                    @if (m.cuentaCajaBancoDefault) {
                      <span class="inline-flex items-center gap-1.5 text-purple-800 font-semibold bg-purple-50/70 border border-purple-200 px-2 py-0.5 rounded">
                        <span>{{ m.cuentaCajaBancoDefault.codigo }}</span>
                        <span class="font-sans font-normal text-slate-600">— {{ m.cuentaCajaBancoDefault.nombre }}</span>
                      </span>
                    } @else if (m.cuentaAnticiposCodigo) {
                      <span class="font-semibold text-purple-700">{{ m.cuentaAnticiposCodigo }}</span>
                    } @else {
                      <span class="text-slate-400">—</span>
                    }
                  </td>
                  <td class="text-center py-3 px-4">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1"
                      [ngClass]="m.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'"
                    >
                      <span>{{ m.activo ? '●' : '○' }}</span>
                      <span>{{ m.activo ? 'Activo' : 'Inactivo' }}</span>
                    </span>
                  </td>
                  <td class="text-center py-3 px-4">
                    <button
                      type="button"
                      class="btn-secondary btn-xs inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 shadow-2xs transition-colors"
                      title="Editar parametrización contable del concepto"
                      [attr.data-testid]="'btn-editar-mapeo-' + m.id"
                      (click)="editarMapeo(m)"
                    >
                      <span>✏️</span>
                      <span>Editar</span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr class="empty-row">
                  <td colspan="7" class="text-center py-10 text-slate-400" data-testid="sin-mapeos-datos">
                    <div class="flex flex-col items-center justify-center gap-1">
                      <span class="text-2xl mb-1">🔗</span>
                      <span class="font-semibold text-slate-600">No se encontraron mapeos contables.</span>
                      <span class="text-xs text-slate-400">Haga clic en "Sembrar Mapeo Base" para generar la configuración predeterminada.</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal Editar Mapeo -->
      <app-modal-editar-mapeo
        [visible]="modalEditarVisible()"
        [mapping]="mappingSeleccionado()"
        (closeModal)="modalEditarVisible.set(false)"
        (guardado)="onMapeoGuardado($event)"
      />
    </div>
  `,
})
export class ContabilidadMapeoComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly cargando = signal<boolean>(false);
  readonly sembrando = signal<boolean>(false);
  readonly modalEditarVisible = signal<boolean>(false);
  readonly mappings = signal<ConceptoMapping[]>([]);
  readonly mappingSeleccionado = signal<ConceptoMapping | null>(null);

  readonly busqueda = signal<string>('');
  readonly filtroEstado = signal<string>('');

  readonly totalCuentasIngreso = computed(() => {
    return this.mappings().filter((m) => !!m.cuentaIngreso || !!m.cuentaIngresoCodigo || !!m.cuentaIngresoId).length;
  });

  readonly totalCuentasCxc = computed(() => {
    return this.mappings().filter((m) => !!m.cuentaCxc || !!m.cuentaCxcId).length;
  });

  readonly totalMapeosActivos = computed(() => {
    return this.mappings().filter((m) => m.activo !== false).length;
  });

  readonly mappingsFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const est = this.filtroEstado();

    return this.mappings().filter((m) => {
      // Filtro de estado
      if (est === 'ACTIVO' && m.activo === false) return false;
      if (est === 'INACTIVO' && m.activo !== false) return false;

      // Filtro de búsqueda
      if (!q) return true;

      const tipo = (m.tipoConceptoCodigo || '').toLowerCase();
      const nom = (m.conceptoNombre || '').toLowerCase();
      const ingNom = (m.cuentaIngreso?.nombre || '').toLowerCase();
      const ingCod = (m.cuentaIngreso?.codigo || m.cuentaIngresoCodigo || '').toLowerCase();
      const cxcNom = (m.cuentaCxc?.nombre || '').toLowerCase();
      const cxcCod = (m.cuentaCxc?.codigo || '').toLowerCase();

      return (
        tipo.includes(q) ||
        nom.includes(q) ||
        ingNom.includes(q) ||
        ingCod.includes(q) ||
        cxcNom.includes(q) ||
        cxcCod.includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.cargarMapeos();
  }

  cargarMapeos(): void {
    this.cargando.set(true);
    this.svc.getConceptoMappings().subscribe({
      next: (data) => {
        this.mappings.set(data || []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  editarMapeo(m: ConceptoMapping): void {
    this.mappingSeleccionado.set(m);
    this.modalEditarVisible.set(true);
  }

  sembrarMapeos(): void {
    this.sembrando.set(true);
    this.svc.seedConceptoMappings().subscribe({
      next: () => {
        this.sembrando.set(false);
        this.cargarMapeos();
      },
      error: () => this.sembrando.set(false),
    });
  }

  onMapeoGuardado(_actualizado: ConceptoMapping): void {
    this.cargarMapeos();
  }
}
