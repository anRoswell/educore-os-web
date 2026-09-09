import { Component, OnInit, inject, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { ConceptoMapping, PucCuenta } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-editar-mapeo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .modal-box {
      background: #ffffff;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      padding: 1.5rem;
      border: 1px solid #f1f5f9;
      max-height: 90vh;
      overflow-y: auto;
    }
  `],
  template: `
    @if (visible() && mapping()) {
      <div class="modal-backdrop" data-testid="modal-editar-mapeo-backdrop" (click)="cancelar()">
        <div class="modal-box w-[580px]" data-testid="modal-editar-mapeo" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg shadow-xs">
                🔄
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-editar-mapeo-title">
                  Mapeo de Concepto Contable
                </h3>
                <span class="text-xs text-slate-400 block">Vinculación automática Tesorería → PUC NIIF</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {{ mapping()!.tipoConceptoCodigo }}
              </span>
              <button
                type="button"
                class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
                (click)="cancelar()"
                data-testid="btn-close-modal-mapeo"
              >✕</button>
            </div>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5" data-testid="error-editar-mapeo">
                {{ errorMensaje() }}
              </div>
            }

            <div class="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 leading-relaxed">
              ℹ️ Configure las cuentas auxiliares del PUC que serán imputadas automáticamente por Tesorería
              al emitir o recaudar cobros asociados al concepto <strong>{{ mapping()!.tipoConceptoCodigo }}</strong>.
            </div>

            <!-- Cuenta Ingreso (Clase 4) -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Cuenta de Ingreso (Clase 4) *</label>
              <select
                class="input-base w-full text-xs font-semibold"
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
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Cuenta de Cartera / CxC (Clase 13) *</label>
              <select
                class="input-base w-full text-xs font-semibold"
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
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Cuenta de Descuentos y Becas</label>
              <select
                class="input-base w-full text-xs"
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
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Cuenta de Caja / Bancos Recaudo Default (Clase 11)</label>
              <select
                class="input-base w-full text-xs"
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
              <label class="flex items-center gap-2 cursor-pointer text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  class="rounded text-indigo-600 focus:ring-indigo-500"
                  data-testid="checkbox-mapeo-activo"
                  [ngModel]="activo()"
                  (ngModelChange)="activo.set($event)"
                />
                <span class="font-semibold text-slate-700">Mapeo Activo para Contabilización Automática</span>
              </label>
            </div>
          </div>

          <div class="modal-actions flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              class="btn-secondary btn-sm"
              data-testid="btn-cancelar-mapeo"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary btn-sm inline-flex items-center gap-1.5 font-semibold shadow-sm"
              data-testid="btn-guardar-mapeo"
              [disabled]="!esValido() || guardando()"
              (click)="guardar()"
            >
              @if (guardando()) {
                <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Guardando...</span>
              } @else {
                <span>✓ Guardar Mapeo</span>
              }
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
