import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { PucCuenta } from '../models/contabilidad.models';

@Component({
  selector: 'app-contabilidad-puc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .puc-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .puc-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .puc-kpis-grid {
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
    <div class="tab-content" data-testid="tab-content-puc">
      <!-- Toolbar PUC: Buscador, Filtro por Clase y Acciones -->
      <div class="flex items-center justify-between mb-5 gap-3 flex-wrap" data-testid="puc-toolbar">
        <div class="flex gap-3 items-center flex-wrap" style="margin-bottom: 0.25rem;">
          <input
            class="form-control form-control-sm"
            style="width: 280px; min-width: 240px;"
            data-testid="input-search-puc"
            type="text"
            placeholder="🔍 Buscar por código o nombre..."
            [ngModel]="busqueda()"
            (ngModelChange)="busqueda.set($event)"
          />
          <select
            class="form-select form-select-sm"
            style="width: 220px; min-width: 200px;"
            data-testid="select-clase-puc"
            [ngModel]="filtroClase()"
            (ngModelChange)="filtroClase.set($event)"
          >
            <option value="">Todas las clases</option>
            <option value="1">1 — Activos</option>
            <option value="2">2 — Pasivos</option>
            <option value="3">3 — Patrimonio</option>
            <option value="4">4 — Ingresos</option>
            <option value="5">5 — Gastos</option>
            <option value="6">6 — Costos Producción</option>
            <option value="7">7 — Costos Ventas</option>
            <option value="8">8 — Cuentas de Orden DB</option>
            <option value="9">9 — Cuentas de Orden CR</option>
          </select>
        </div>
        <div class="flex gap-2 items-center" style="margin-bottom: 0.25rem;">
          <button
            type="button"
            class="btn-secondary btn-sm"
            data-testid="btn-expand-all"
            (click)="expandAll()"
          >
            Expandir Todo
          </button>
          <button
            type="button"
            class="btn-secondary btn-sm"
            data-testid="btn-collapse-all"
            (click)="collapseAll()"
          >
            Colapsar Todo
          </button>
          <button
            type="button"
            class="btn-primary btn-sm"
            data-testid="btn-nueva-cuenta"
            (click)="abrirModalNuevaCuenta()"
          >
            + Nueva Cuenta
          </button>
        </div>
      </div>

      <!-- Indicadores resumen estilo NIIF 15 -->
      <div class="puc-kpis-grid" data-testid="puc-kpis">
        <div class="kpi-widget-card" data-testid="kpi-total-cuentas">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title">Total Cuentas</span>
            <span class="text-sm">📊</span>
          </div>
          <div class="kpi-widget-value text-slate-800">
            {{ totalCuentas() }}
          </div>
          <div class="kpi-widget-footer">Catálogo contable institucional</div>
        </div>

        <div class="kpi-widget-card" style="border-color: #e0e7ff; background: linear-gradient(135deg, rgba(224, 231, 255, 0.25) 0%, #ffffff 100%);" data-testid="kpi-auxiliares">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #4338ca;">Cuentas Auxiliares</span>
            <span class="text-sm">📑</span>
          </div>
          <div class="kpi-widget-value" style="color: #4338ca;">
            {{ totalAuxiliares() }}
          </div>
          <div class="kpi-widget-footer" style="color: #6366f1;">Imputables en comprobantes</div>
        </div>

        <div class="kpi-widget-card" style="border-color: #d1fae5; background: linear-gradient(135deg, rgba(209, 250, 229, 0.25) 0%, #ffffff 100%);" data-testid="kpi-activas">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #047857;">Cuentas Activas</span>
            <span class="text-sm">✅</span>
          </div>
          <div class="kpi-widget-value" style="color: #047857;">
            {{ totalActivas() }}
          </div>
          <div class="kpi-widget-footer" style="color: #059669;">Disponibles para operación</div>
        </div>

        <div class="kpi-widget-card" style="border-color: #fef3c7; background: linear-gradient(135deg, rgba(254, 243, 199, 0.25) 0%, #ffffff 100%);" data-testid="kpi-inactivas">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #b45309;">Cuentas Inactivas</span>
            <span class="text-sm">⏸️</span>
          </div>
          <div class="kpi-widget-value" style="color: #b45309;">
            {{ totalInactivas() }}
          </div>
          <div class="kpi-widget-footer" style="color: #d97706;">Bloqueadas para nuevos registros</div>
        </div>
      </div>

      <!-- Estado cargando -->
      @if (cargando()) {
        <div class="flex justify-center py-10" data-testid="puc-loading-spinner">
          <div class="spinner"></div>
        </div>
      } @else {
        <!-- Árbol PUC -->
        <div class="tabla-base overflow-auto max-h-[600px]" data-testid="tabla-puc-container">
          <table class="tabla-datos w-full" data-testid="tabla-puc">
            <thead>
              <tr>
                <th class="w-44">Código</th>
                <th>Nombre</th>
                <th class="w-24 text-center">Naturaleza</th>
                <th class="w-20 text-center">Nivel</th>
                <th class="w-24 text-center">Tipo</th>
                <th class="w-20 text-center">Estado</th>
                <th class="w-24 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (cuenta of cuentasFiltradas(); track cuenta.id) {
                <tr
                  [class.font-semibold]="!cuenta.esAuxiliar"
                  [class.text-gray-500]="!cuenta.activo"
                  [attr.data-testid]="'row-puc-' + cuenta.codigo"
                >
                  <td>
                    <div class="flex items-center gap-1" [style.padding-left.px]="(cuenta.nivel - 1) * 16">
                      @if (cuenta.children && cuenta.children.length > 0) {
                        <button
                          type="button"
                          class="w-5 h-5 flex items-center justify-center text-xs font-mono text-gray-500 hover:text-indigo-600 rounded transition-colors"
                          [attr.data-testid]="'btn-expand-' + cuenta.codigo"
                          (click)="toggleExpand(cuenta.codigo)"
                          [title]="expandedCodes().has(cuenta.codigo) ? 'Colapsar subcuentas' : 'Expandir subcuentas'"
                        >
                          {{ expandedCodes().has(cuenta.codigo) ? '▼' : '▶' }}
                        </button>
                      } @else {
                        <span class="w-5 inline-block"></span>
                      }
                      <span class="font-mono text-sm">{{ cuenta.codigo }}</span>
                    </div>
                  </td>
                  <td>{{ cuenta.nombre }}</td>
                  <td class="text-center">
                    <span [class]="cuenta.naturaleza === 'DEBITO' ? 'badge-blue' : 'badge-purple'">
                      {{ cuenta.naturaleza }}
                    </span>
                  </td>
                  <td class="text-center text-sm">{{ cuenta.nivel }}</td>
                  <td class="text-center">
                    <span [class]="cuenta.esAuxiliar ? 'badge-green' : 'badge-gray'">
                      {{ cuenta.esAuxiliar ? 'Auxiliar' : 'Mayor' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span [class]="cuenta.activo ? 'badge-green' : 'badge-red'">
                      {{ cuenta.activo ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <button
                      type="button"
                      class="btn-icon"
                      [attr.data-testid]="'btn-toggle-' + cuenta.id"
                      [title]="cuenta.activo ? 'Inactivar cuenta' : 'Activar cuenta'"
                      (click)="toggleActivar(cuenta)"
                    >
                      {{ cuenta.activo ? '⊘' : '✓' }}
                    </button>
                  </td>
                </tr>
              }
              @if (cuentasFiltradas().length === 0) {
                <tr class="empty-row">
                  <td colspan="7" class="text-center py-8 text-gray-400">
                    No se encontraron cuentas con los filtros aplicados.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal nueva cuenta -->
      @if (modalNuevaCuenta()) {
        <div class="modal-backdrop" data-testid="modal-nueva-cuenta-backdrop" (click)="cerrarModal()">
          <div class="modal-box w-[480px]" data-testid="modal-nueva-cuenta" (click)="$event.stopPropagation()">
            <h3 class="modal-title font-bold text-lg text-gray-800" data-testid="modal-nueva-cuenta-title">
              Nueva Cuenta PUC
            </h3>
            <div class="modal-body space-y-3 pt-3">
              <div class="form-group">
                <label class="form-label text-xs font-semibold">Código *</label>
                <input
                  class="input-base font-mono"
                  data-testid="input-codigo-puc"
                  [(ngModel)]="formCuenta.codigo"
                  placeholder="ej: 11050501"
                />
              </div>
              <div class="form-group">
                <label class="form-label text-xs font-semibold">Nombre *</label>
                <input
                  class="input-base"
                  data-testid="input-nombre-puc"
                  [(ngModel)]="formCuenta.nombre"
                  placeholder="Nombre descriptivo"
                />
              </div>
              <div class="form-group">
                <label class="form-label text-xs font-semibold">Naturaleza *</label>
                <select
                  class="input-base"
                  data-testid="select-naturaleza-puc"
                  [(ngModel)]="formCuenta.naturaleza"
                >
                  <option value="DEBITO">DÉBITO</option>
                  <option value="CREDITO">CRÉDITO</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label text-xs font-semibold">Categoría NIIF</label>
                <input
                  class="input-base"
                  data-testid="input-categoria-niif-puc"
                  [(ngModel)]="formCuenta.categoriaNiif"
                  placeholder="ej: Sección 7 NIIF Pymes"
                />
              </div>
              <div class="flex gap-4 pt-1">
                <label class="flex items-center gap-2 cursor-pointer text-xs">
                  <input type="checkbox" [(ngModel)]="formCuenta.esAuxiliar" />
                  <span>Cuenta auxiliar</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-xs">
                  <input type="checkbox" [(ngModel)]="formCuenta.manejaTercero" />
                  <span>Maneja tercero</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-xs">
                  <input type="checkbox" [(ngModel)]="formCuenta.manejaCentroCosto" />
                  <span>Maneja C. Costo</span>
                </label>
              </div>
            </div>
            <div class="modal-actions flex justify-end gap-2 pt-4 border-t mt-4">
              <button
                type="button"
                class="btn-secondary"
                data-testid="btn-cancelar-nueva-cuenta"
                (click)="cerrarModal()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary"
                data-testid="btn-guardar-nueva-cuenta"
                [disabled]="!formCuenta.codigo || !formCuenta.nombre || guardando()"
                (click)="guardarNuevaCuenta()"
              >
                {{ guardando() ? 'Guardando...' : 'Crear Cuenta' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContabilidadPucComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly cargando = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);
  readonly modalNuevaCuenta = signal<boolean>(false);
  readonly cuentas = signal<PucCuenta[]>([]);
  readonly expandedCodes = signal<Set<string>>(new Set());
  readonly busqueda = signal<string>('');
  readonly filtroClase = signal<string>('');

  formCuenta: Partial<PucCuenta> & { naturaleza: 'DEBITO' | 'CREDITO' } = {
    codigo: '',
    nombre: '',
    naturaleza: 'DEBITO',
    esAuxiliar: true,
    manejaTercero: false,
    manejaCentroCosto: false,
    categoriaNiif: '',
  };

  readonly allFlatCuentas = computed(() => this.flattenArbol(this.cuentas()));

  readonly cuentasFiltradas = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    const clase = this.filtroClase();
    const all = this.allFlatCuentas();

    // 1. Si hay término de búsqueda por texto, mostramos directamente todas las coincidencias
    if (term) {
      let filtered = all.filter(
        (c) =>
          c.codigo.toLowerCase().includes(term) ||
          c.nombre.toLowerCase().includes(term),
      );
      if (clase) {
        filtered = filtered.filter((c) => c.codigo.startsWith(clase));
      }
      return filtered;
    }

    // 2. Si no hay búsqueda por texto, navegamos el árbol jerárquico respetando expandedCodes
    let roots = this.cuentas();
    if (clase) {
      roots = roots.filter((c) => c.codigo.startsWith(clase));
    }

    const expanded = this.expandedCodes();
    const result: PucCuenta[] = [];

    const traverse = (nodes: PucCuenta[]) => {
      for (const node of nodes) {
        result.push(node);
        if (node.children && node.children.length > 0 && expanded.has(node.codigo)) {
          traverse(node.children);
        }
      }
    };

    traverse(roots);
    return result;
  });

  readonly totalCuentas = computed(() => this.allFlatCuentas().length);
  readonly totalAuxiliares = computed(() => this.allFlatCuentas().filter((c) => c.esAuxiliar).length);
  readonly totalActivas = computed(() => this.allFlatCuentas().filter((c) => c.activo).length);
  readonly totalInactivas = computed(() => this.allFlatCuentas().filter((c) => !c.activo).length);

  ngOnInit(): void {
    this.cargarPuc();
  }

  cargarPuc(): void {
    this.cargando.set(true);
    this.svc.getPucTree().subscribe({
      next: (arbol) => {
        this.cuentas.set(arbol || []);
        // Desplegar todo inicialmente para visibilidad completa
        this.expandAll();
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  toggleExpand(codigo: string): void {
    const set = new Set(this.expandedCodes());
    if (set.has(codigo)) {
      set.delete(codigo);
    } else {
      set.add(codigo);
    }
    this.expandedCodes.set(set);
  }

  expandAll(): void {
    const allParents = new Set<string>();
    const collect = (nodes: PucCuenta[]) => {
      for (const n of nodes) {
        if (n.children && n.children.length > 0) {
          allParents.add(n.codigo);
          collect(n.children);
        }
      }
    };
    collect(this.cuentas());
    this.expandedCodes.set(allParents);
  }

  collapseAll(): void {
    this.expandedCodes.set(new Set());
  }

  abrirModalNuevaCuenta(): void {
    this.formCuenta = {
      codigo: '',
      nombre: '',
      naturaleza: 'DEBITO',
      esAuxiliar: true,
      manejaTercero: false,
      manejaCentroCosto: false,
      categoriaNiif: '',
    };
    this.modalNuevaCuenta.set(true);
  }

  cerrarModal(): void {
    this.modalNuevaCuenta.set(false);
  }

  guardarNuevaCuenta(): void {
    if (!this.formCuenta.codigo || !this.formCuenta.nombre) return;
    this.guardando.set(true);
    this.svc.crearCuentaPuc(this.formCuenta).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalNuevaCuenta.set(false);
        this.cargarPuc();
      },
      error: () => this.guardando.set(false),
    });
  }

  toggleActivar(cuenta: PucCuenta): void {
    this.svc.toggleCuentaPuc(cuenta.id, cuenta.activo).subscribe({
      next: () => this.cargarPuc(),
      error: () => {},
    });
  }

  private flattenArbol(arbol: PucCuenta[]): PucCuenta[] {
    const result: PucCuenta[] = [];
    const recurse = (cuentas: PucCuenta[]) => {
      for (const c of cuentas) {
        result.push(c);
        if (c.children?.length) recurse(c.children);
      }
    };
    recurse(arbol);
    return result;
  }
}
