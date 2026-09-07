import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContabilidadService } from '../services/contabilidad.service';
import { ConceptoMapping } from '../models/contabilidad.models';
import { ModalEditarMapeoComponent } from '../modals/modal-editar-mapeo.component';

@Component({
  selector: 'app-contabilidad-mapeo',
  standalone: true,
  imports: [CommonModule, ModalEditarMapeoComponent],
  template: `
    <div class="tab-content" data-testid="tab-content-mapeo">
      <!-- Cabecera y acciones -->
      <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 class="font-semibold text-gray-800 text-base" data-testid="mapeo-titulo">
            Mapeo de Conceptos a Cuentas PUC
          </h3>
          <p class="text-xs text-gray-500">
            Parametrización contable de conceptos de tesorería a cuentas PUC para automatización en tiempo real.
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-secondary btn-sm"
            data-testid="btn-seed-mapeos"
            [disabled]="sembrando()"
            (click)="sembrarMapeos()"
          >
            {{ sembrando() ? 'Sembrando...' : '🔄 Sembrar Mapeo Base' }}
          </button>
        </div>
      </div>

      <!-- Estado de carga -->
      @if (cargando()) {
        <div class="flex justify-center py-10" data-testid="mapeo-loading-spinner">
          <div class="spinner"></div>
        </div>
      } @else {
        <!-- Tabla de Mapeos -->
        <div class="tabla-base overflow-auto" data-testid="tabla-mapeo-container">
          <table class="tabla-datos w-full text-xs" data-testid="tabla-mapeo">
            <thead>
              <tr>
                <th class="w-44 text-left py-2 px-3">Concepto Escolar</th>
                <th class="text-left py-2 px-3">Cuenta Ingreso (Clase 4)</th>
                <th class="text-left py-2 px-3">Cuenta CxC (Clase 13)</th>
                <th class="text-left py-2 px-3">Cuenta Descuento / Beca</th>
                <th class="text-left py-2 px-3">Cuenta Caja/Banco Default</th>
                <th class="w-24 text-center py-2 px-3">Estado</th>
                <th class="w-24 text-center py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (m of mappings(); track m.id) {
                <tr class="border-b hover:bg-gray-50/50" [attr.data-testid]="'row-mapeo-' + m.id">
                  <td class="font-bold text-gray-800 py-2 px-3">
                    <div class="flex items-center gap-1.5">
                      <span class="badge-mini badge-blue font-mono">{{ m.tipoConceptoCodigo }}</span>
                      @if (m.conceptoNombre) {
                        <span class="text-gray-600 font-normal">({{ m.conceptoNombre }})</span>
                      }
                    </div>
                  </td>
                  <td class="font-mono py-2 px-3">
                    @if (m.cuentaIngreso) {
                      <span>{{ m.cuentaIngreso.codigo }} — {{ m.cuentaIngreso.nombre }}</span>
                    } @else if (m.cuentaIngresoCodigo) {
                      <span>{{ m.cuentaIngresoCodigo }}</span>
                    } @else {
                      <span class="text-gray-400 italic">No asignada</span>
                    }
                  </td>
                  <td class="font-mono py-2 px-3">
                    @if (m.cuentaCxc) {
                      <span>{{ m.cuentaCxc.codigo }} — {{ m.cuentaCxc.nombre }}</span>
                    } @else {
                      <span class="text-gray-400 italic">No asignada</span>
                    }
                  </td>
                  <td class="font-mono py-2 px-3">
                    @if (m.cuentaDescuento) {
                      <span>{{ m.cuentaDescuento.codigo }} — {{ m.cuentaDescuento.nombre }}</span>
                    } @else {
                      <span class="text-gray-400">—</span>
                    }
                  </td>
                  <td class="font-mono py-2 px-3">
                    @if (m.cuentaCajaBancoDefault) {
                      <span>{{ m.cuentaCajaBancoDefault.codigo }} — {{ m.cuentaCajaBancoDefault.nombre }}</span>
                    } @else if (m.cuentaAnticiposCodigo) {
                      <span>{{ m.cuentaAnticiposCodigo }}</span>
                    } @else {
                      <span class="text-gray-400">—</span>
                    }
                  </td>
                  <td class="text-center py-2 px-3">
                    <span [class]="m.activo ? 'badge-green' : 'badge-gray'">
                      {{ m.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="text-center py-2 px-3">
                    <button
                      type="button"
                      class="btn-icon text-blue-600 hover:text-blue-800"
                      title="Editar mapeo"
                      [attr.data-testid]="'btn-editar-mapeo-' + m.id"
                      (click)="editarMapeo(m)"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              }
              @if (mappings().length === 0) {
                <tr class="empty-row">
                  <td colspan="7" class="text-center py-8 text-gray-400">
                    No se han configurado mapeos de conceptos contables.
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
