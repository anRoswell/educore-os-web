import { Component, OnInit, inject, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { ConceptoMapping, PucCuenta } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-editar-mapeo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible() && mapping()) {
      <div class="modal-backdrop" data-testid="modal-editar-mapeo-backdrop" (click)="cancelar()">
        <div class="modal-box w-[580px]" data-testid="modal-editar-mapeo" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b">
            <h3 class="modal-title font-bold text-lg text-gray-800" data-testid="modal-editar-mapeo-title">
              Mapeo de Concepto Contable
            </h3>
            <span class="badge-mini badge-blue">{{ mapping()!.tipoConceptoCodigo }}</span>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2">
                {{ errorMensaje() }}
              </div>
            }

            <p class="text-xs text-gray-600">
              Configure las cuentas auxiliares del PUC que serán imputadas automáticamente por Tesorería
              al emitir o recaudar cobros asociados al concepto <strong>{{ mapping()!.tipoConceptoCodigo }}</strong>.
            </p>

            <!-- Cuenta Ingreso (Clase 4) -->
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Cuenta de Ingreso (Clase 4) *</label>
              <select
                class="input-base text-xs"
                data-testid="select-mapeo-ingreso"
                [ngModel]="cuentaIngresoId()"
                (ngModelChange)="cuentaIngresoId.set($event)"
              >
                <option value="">Seleccione cuenta de ingreso...</option>
                @for (c of cuentasIngreso(); track c.id) {
                  <option [value]="c.id">{{ c.codigo }} — {{ c.nombre }}</option>
                }
              </select>
            </div>

            <!-- Cuenta CxC (Clase 13) -->
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Cuenta de Cartera / CxC (Clase 13) *</label>
              <select
                class="input-base text-xs"
                data-testid="select-mapeo-cxc"
                [ngModel]="cuentaCxcId()"
                (ngModelChange)="cuentaCxcId.set($event)"
              >
                <option value="">Seleccione cuenta de cartera...</option>
                @for (c of cuentasCxc(); track c.id) {
                  <option [value]="c.id">{{ c.codigo }} — {{ c.nombre }}</option>
                }
              </select>
            </div>

            <!-- Cuenta Descuento / Beca (416095 / Clase 4) -->
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Cuenta de Descuentos y Becas</label>
              <select
                class="input-base text-xs"
                data-testid="select-mapeo-descuento"
                [ngModel]="cuentaDescuentoId()"
                (ngModelChange)="cuentaDescuentoId.set($event)"
              >
                <option value="">(Opcional) Seleccione cuenta descuento...</option>
                @for (c of cuentasDescuento(); track c.id) {
                  <option [value]="c.id">{{ c.codigo }} — {{ c.nombre }}</option>
                }
              </select>
            </div>

            <!-- Cuenta Caja / Bancos Default (Clase 11) -->
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Cuenta de Caja / Bancos Recaudo Default (Clase 11)</label>
              <select
                class="input-base text-xs"
                data-testid="select-mapeo-caja"
                [ngModel]="cuentaCajaBancoId()"
                (ngModelChange)="cuentaCajaBancoId.set($event)"
              >
                <option value="">(Opcional) Seleccione cuenta default recaudo...</option>
                @for (c of cuentasCaja(); track c.id) {
                  <option [value]="c.id">{{ c.codigo }} — {{ c.nombre }}</option>
                }
              </select>
            </div>

            <div class="pt-2">
              <label class="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  data-testid="checkbox-mapeo-activo"
                  [ngModel]="activo()"
                  (ngModelChange)="activo.set($event)"
                />
                <span class="font-medium text-gray-700">Mapeo Activo para Contabilización Automática</span>
              </label>
            </div>
          </div>

          <div class="modal-actions flex justify-end gap-2 pt-4 border-t mt-4">
            <button
              type="button"
              class="btn-secondary"
              data-testid="btn-cancelar-mapeo"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary"
              data-testid="btn-guardar-mapeo"
              [disabled]="!esValido() || guardando()"
              (click)="guardar()"
            >
              {{ guardando() ? 'Guardando...' : 'Guardar Mapeo' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalEditarMapeoComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly mapping = input<ConceptoMapping | null>(null);
  readonly closeModal = output<void>();
  readonly guardado = output<ConceptoMapping>();

  readonly cuentasAuxiliares = signal<PucCuenta[]>([]);
  readonly cuentaIngresoId = signal<string>('');
  readonly cuentaCxcId = signal<string>('');
  readonly cuentaDescuentoId = signal<string>('');
  readonly cuentaCajaBancoId = signal<string>('');
  readonly activo = signal<boolean>(true);
  readonly guardando = signal<boolean>(false);
  readonly errorMensaje = signal<string>('');

  readonly cuentasIngreso = computed(() =>
    this.cuentasAuxiliares().filter((c) => c.codigo.startsWith('4')),
  );

  readonly cuentasCxc = computed(() =>
    this.cuentasAuxiliares().filter((c) => c.codigo.startsWith('13')),
  );

  readonly cuentasDescuento = computed(() =>
    this.cuentasAuxiliares().filter((c) => c.codigo.startsWith('4')),
  );

  readonly cuentasCaja = computed(() =>
    this.cuentasAuxiliares().filter((c) => c.codigo.startsWith('11')),
  );

  readonly esValido = computed(
    () => this.cuentaIngresoId().length > 0 && this.cuentaCxcId().length > 0,
  );

  constructor() {
    effect(() => {
      const m = this.mapping();
      if (m) {
        this.cuentaIngresoId.set(m.cuentaIngresoId || m.cuentaIngresoPucId || '');
        this.cuentaCxcId.set(m.cuentaCxcId || '');
        this.cuentaDescuentoId.set(m.cuentaDescuentoId || '');
        this.cuentaCajaBancoId.set(m.cuentaCajaBancoDefaultId || m.cuentaAnticiposPucId || '');
        this.activo.set(m.activo !== false);
        this.errorMensaje.set('');
      }
    });
  }

  ngOnInit(): void {
    this.cargarCuentas();
  }

  cargarCuentas(): void {
    this.svc.getPucAuxiliares().subscribe({
      next: (data) => this.cuentasAuxiliares.set(data),
      error: () => {},
    });
  }

  guardar(): void {
    const m = this.mapping();
    if (!m || !this.esValido()) return;

    this.guardando.set(true);
    this.errorMensaje.set('');

    const payload: Partial<ConceptoMapping> = {
      id: m.id,
      tipoConceptoCodigo: m.tipoConceptoCodigo,
      cuentaIngresoId: this.cuentaIngresoId(),
      cuentaCxcId: this.cuentaCxcId(),
      cuentaDescuentoId: this.cuentaDescuentoId() || undefined,
      cuentaCajaBancoDefaultId: this.cuentaCajaBancoId() || undefined,
      activo: this.activo(),
    };

    this.svc.upsertConceptoMapping(payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
        this.closeModal.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        const detalle = err?.error?.message || err?.message || 'Error al guardar mapeo';
        this.errorMensaje.set(Array.isArray(detalle) ? detalle.join(', ') : detalle);
      },
    });
  }

  cancelar(): void {
    this.errorMensaje.set('');
    this.closeModal.emit();
  }
}
