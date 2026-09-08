import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { Asiento, TipoComprobante, EstadoAsiento } from '../models/contabilidad.models';
import { ModalNuevoAsientoComponent } from '../modals/modal-nuevo-asiento.component';
import { ModalDetalleAsientoComponent } from '../modals/modal-detalle-asiento.component';
import { ModalAnularAsientoComponent } from '../modals/modal-anular-asiento.component';
import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';

@Component({
  selector: 'app-contabilidad-comprobantes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalNuevoAsientoComponent,
    ModalDetalleAsientoComponent,
    ModalAnularAsientoComponent,
    FlatpickrDirective,
  ],
  template: `
    <div class="tab-content" data-testid="tab-content-comprobantes">
      <!-- Filtros y Barra de Acciones -->
      <div class="flex items-end gap-3 mb-4 flex-wrap">
        <div class="form-group-inline">
          <label class="form-label-sm">Desde</label>
          <input
            class="input-base input-sm"
            data-testid="input-filtro-desde"
            type="text"
            appFlatpickr
            placeholder="dd/mm/aaaa"
            [ngModel]="filtroDesde()"
            (ngModelChange)="filtroDesde.set($event)"
          />
        </div>
        <div class="form-group-inline">
          <label class="form-label-sm">Hasta</label>
          <input
            class="input-base input-sm"
            data-testid="input-filtro-hasta"
            type="text"
            appFlatpickr
            [minDate]="filtroDesde()"
            placeholder="dd/mm/aaaa"
            [ngModel]="filtroHasta()"
            (ngModelChange)="filtroHasta.set($event)"
          />
        </div>
        <div class="form-group-inline">
          <label class="form-label-sm">Tipo</label>
          <select
            class="input-base input-sm"
            data-testid="select-filtro-tipo"
            [ngModel]="filtroTipo()"
            (ngModelChange)="filtroTipo.set($event)"
          >
            <option value="">Todos</option>
            <option value="CAU">CAU — Causación</option>
            <option value="ING">ING — Ingreso</option>
            <option value="EGR">EGR — Egreso</option>
            <option value="AJU">AJU — Ajuste</option>
            <option value="NOT">NOT — Nota</option>
            <option value="CIER">CIER — Cierre</option>
            <option value="APE">APE — Apertura</option>
          </select>
        </div>
        <div class="form-group-inline">
          <label class="form-label-sm">Estado</label>
          <select
            class="input-base input-sm"
            data-testid="select-filtro-estado"
            [ngModel]="filtroEstado()"
            (ngModelChange)="filtroEstado.set($event)"
          >
            <option value="">Todos</option>
            <option value="POSTED">POSTED (Asentado)</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="DRAFT">DRAFT (Borrador)</option>
            <option value="VOID">VOID (Anulado)</option>
            <option value="ANULADO">ANULADO</option>
          </select>
        </div>
        <button
          type="button"
          class="btn-secondary btn-sm"
          data-testid="btn-buscar-comprobantes"
          (click)="buscar()"
        >
          🔍 Buscar
        </button>
        <button
          type="button"
          class="btn-primary btn-sm ml-auto"
          data-testid="btn-nuevo-comprobante"
          (click)="abrirModalNuevo()"
        >
          + Nuevo Comprobante
        </button>
      </div>

      <!-- Tabla comprobantes -->
      @if (cargando()) {
        <div class="flex justify-center py-10" data-testid="comprobantes-loading-spinner">
          <div class="spinner"></div>
        </div>
      } @else {
        <div class="tabla-base overflow-auto max-h-[520px]" data-testid="tabla-comprobantes-container">
          <table class="tabla-datos w-full" data-testid="tabla-comprobantes">
            <thead>
              <tr>
                <th style="width: 100px; min-width: 90px;">Tipo</th>
                <th style="width: 160px; min-width: 150px;">Consecutivo</th>
                <th style="width: 130px; min-width: 120px;">Fecha</th>
                <th style="width: 220px; max-width: 240px;">Concepto</th>
                <th style="width: 140px; min-width: 130px;" class="text-right">Débito</th>
                <th style="width: 140px; min-width: 130px;" class="text-right">Crédito</th>
                <th style="width: 120px; min-width: 110px;" class="text-center">Estado</th>
                <th style="width: 130px; min-width: 120px;" class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (a of asientos(); track a.id) {
                <tr
                  [class.opacity-50]="a.estado === 'VOID' || a.estado === 'ANULADO'"
                  [attr.data-testid]="'row-asiento-' + a.id"
                >
                  <td class="whitespace-nowrap">
                    <span [class]="badgeTipoClass(a.tipoComprobante)">{{ a.tipoComprobante }}</span>
                  </td>
                  <td class="font-mono text-sm whitespace-nowrap">
                    {{ a.tipoComprobante }}-{{ a.consecutivo | number:'6.0-0' }}
                  </td>
                  <td class="text-sm font-mono whitespace-nowrap">{{ a.fechaContable }}</td>
                  <td
                    class="truncate max-w-[220px] text-xs text-gray-600 dark:text-gray-300 cursor-help"
                    style="max-width: 220px; width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                    [title]="a.concepto || a.fuenteModulo || 'Comprobante Contable'"
                    [attr.data-testid]="'concepto-asiento-' + a.id"
                  >
                    {{ a.concepto || a.fuenteModulo || 'Comprobante Contable' }}
                  </td>
                  <td class="text-right font-mono text-sm whitespace-nowrap font-medium">{{ a.totalDebito | number:'1.2-2' }}</td>
                  <td class="text-right font-mono text-sm whitespace-nowrap font-medium">{{ a.totalCredito | number:'1.2-2' }}</td>
                  <td class="text-center whitespace-nowrap">
                    <span [class]="badgeEstadoClass(a.estado)">{{ a.estado }}</span>
                  </td>
                  <td class="text-center whitespace-nowrap">
                    <div class="flex flex-row items-center justify-center gap-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        class="btn-icon"
                        title="Ver detalle"
                        [attr.data-testid]="'btn-ver-detalle-' + a.id"
                        (click)="verDetalle(a)"
                      >
                        👁
                      </button>
                      @if (a.estado !== 'VOID' && a.estado !== 'ANULADO') {
                        <button
                          type="button"
                          class="btn-icon text-red-500 hover:text-red-700"
                          title="Anular comprobante"
                          [attr.data-testid]="'btn-anular-' + a.id"
                          (click)="abrirModalAnular(a)"
                        >
                          ⊘
                        </button>
                      }
                      <button
                        type="button"
                        class="btn-icon text-gray-600 hover:text-gray-900"
                        title="Imprimir comprobante"
                        [attr.data-testid]="'btn-imprimir-' + a.id"
                        (click)="imprimirComprobante(a)"
                      >
                        🖨
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (asientos().length === 0) {
                <tr class="empty-row">
                  <td colspan="8" class="text-center py-8 text-gray-400">
                    No hay comprobantes en el rango seleccionado.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Totales de comprobantes -->
        <div class="flex justify-end gap-8 mt-3 text-sm font-semibold border-t pt-2" data-testid="totales-comprobantes">
          <span>Total Débitos: <strong class="font-mono">{{ totalDebitos() | number:'1.2-2' }}</strong></span>
          <span>Total Créditos: <strong class="font-mono">{{ totalCreditos() | number:'1.2-2' }}</strong></span>
          <span
            class="px-2 py-0.5 rounded font-bold"
            [class.text-green-600]="cuadraTotales()"
            [class.text-red-500]="!cuadraTotales()"
          >
            {{ cuadraTotales() ? '✓ Cuadra' : '✗ No Cuadra' }}
          </span>
        </div>
      }

      <!-- ─── MODALES REACTIVOS INDEPENDIENTES ─── -->
      <app-modal-nuevo-asiento
        [visible]="modalNuevoVisible()"
        (closeModal)="modalNuevoVisible.set(false)"
        (asientoCreado)="onAsientoCreado($event)"
      />

      <app-modal-detalle-asiento
        [visible]="modalDetalleVisible()"
        [asiento]="asientoSeleccionado()"
        (closeModal)="modalDetalleVisible.set(false)"
      />

      <app-modal-anular-asiento
        [visible]="modalAnularVisible()"
        [asiento]="asientoSeleccionado()"
        (closeModal)="modalAnularVisible.set(false)"
        (anulado)="onAsientoAnulado($event)"
      />
    </div>
  `,
})
export class ContabilidadComprobantesComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly cargando = signal<boolean>(false);
  readonly modalNuevoVisible = signal<boolean>(false);
  readonly modalDetalleVisible = signal<boolean>(false);
  readonly modalAnularVisible = signal<boolean>(false);
  readonly asientos = signal<Asiento[]>([]);
  readonly asientoSeleccionado = signal<Asiento | null>(null);

  readonly filtroDesde = signal<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
  );
  readonly filtroHasta = signal<string>(new Date().toISOString().split('T')[0]);
  readonly filtroTipo = signal<string>('');
  readonly filtroEstado = signal<string>('');

  readonly totalDebitos = computed(() => {
    const list = this.asientos();
    if (!Array.isArray(list)) return 0;
    return Math.round(list.reduce((sum, a) => sum + (Number(a.totalDebito) || 0), 0) * 100) / 100;
  });

  readonly totalCreditos = computed(() => {
    const list = this.asientos();
    if (!Array.isArray(list)) return 0;
    return Math.round(list.reduce((sum, a) => sum + (Number(a.totalCredito) || 0), 0) * 100) / 100;
  });

  readonly cuadraTotales = computed(() => {
    return Math.abs(this.totalDebitos() - this.totalCreditos()) < 0.01;
  });

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.cargando.set(true);
    this.svc
      .getComprobantes({
        fechaInicio: this.filtroDesde(),
        fechaFin: this.filtroHasta(),
        tipoComprobante: this.filtroTipo() || undefined,
        estado: this.filtroEstado() || undefined,
        limit: 100,
      })
      .subscribe({
        next: (res) => {
          const items = Array.isArray(res) ? res : res.data ?? [];
          this.asientos.set(items);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  verDetalle(a: Asiento): void {
    this.asientoSeleccionado.set(a);
    this.modalDetalleVisible.set(true);
  }

  abrirModalNuevo(): void {
    this.modalNuevoVisible.set(true);
  }

  abrirModalAnular(a: Asiento): void {
    this.asientoSeleccionado.set(a);
    this.modalAnularVisible.set(true);
  }

  imprimirComprobante(a: Asiento): void {
    this.svc.descargarReportePdf('comprobante', { id: a.id });
  }

  onAsientoCreado(_nuevo: Asiento): void {
    this.buscar();
  }

  onAsientoAnulado(_anulado: Asiento): void {
    this.buscar();
  }

  badgeTipoClass(tipo: TipoComprobante): string {
    const map: Record<string, string> = {
      CAU: 'badge-blue',
      ING: 'badge-green',
      EGR: 'badge-red',
      AJU: 'badge-yellow',
      NOT: 'badge-purple',
      CIER: 'badge-gray',
      CIE: 'badge-gray',
      APE: 'badge-orange',
      APR: 'badge-orange',
    };
    return map[tipo] ?? 'badge-gray';
  }

  badgeEstadoClass(estado: EstadoAsiento): string {
    if (estado === 'POSTED' || estado === 'ACTIVO') return 'badge-green';
    if (estado === 'DRAFT') return 'badge-yellow';
    return 'badge-red';
  }
}
