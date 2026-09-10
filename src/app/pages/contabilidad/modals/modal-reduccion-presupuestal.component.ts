import { Component, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';
import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';

@Component({
  selector: 'app-modal-reduccion-presupuestal',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective, FlatpickrDirective],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-reduccion-presupuestal-backdrop" (click)="cerrarModal()">
        <div class="modal-box w-[540px]" data-testid="modal-reduccion-presupuestal" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-lg shadow-xs">
                📉
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-reduccion-presupuestal-title">
                  Reducción Presupuestal
                </h3>
                <span class="text-xs text-slate-400 block">Disminución de apropiaciones aprobada por el Consejo Directivo</span>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cerrarModal()"
              data-testid="btn-close-modal-reduccion"
            >✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5" data-testid="error-reduccion-presupuestal">
                {{ errorMensaje() }}
              </div>
            }

            <div class="bg-rose-50/70 border border-rose-100 rounded-lg p-3 text-xs text-rose-900 leading-relaxed">
              ⚠️ <strong>Decreto 1075 de 2015:</strong> La reducción disminuye la apropiación del rubro y reduce el presupuesto total de la institución educativa. Se emplea formalmente ante insuficiencia sobrevenida de ingresos o rescisión de compromisos.
            </div>

            <!-- Rubro Seleccionado -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Rubro a Reducir *</label>
              <select
                class="input-base w-full text-xs font-semibold text-slate-800"
                data-testid="select-reduccion-rubro"
                [ngModel]="rubroCodigo()"
                (ngModelChange)="rubroCodigo.set($event)"
              >
                <option value="" disabled>-- Selecciona el rubro a reducir --</option>
                @for (r of rubros(); track r.codigo) {
                  <option [value]="r.codigo">
                    {{ r.codigo }} — {{ r.nombre }} (Apropiación: $ {{ r.presupuestado | number:'1.2-2' }})
                  </option>
                }
              </select>
              @if (rubroSeleccionado()) {
                <div class="text-[11px] text-slate-500 mt-0.5">
                  Saldo sin comprometer: <strong class="text-rose-700 font-mono">$ {{ calcularDisponible(rubroSeleccionado()) | number:'1.2-2' }}</strong>
                </div>
              }
            </div>

            <!-- Monto de Reducción -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Monto de la Reducción (COP) *</label>
              <input
                type="text"
                appCurrencyMask
                class="input-base w-full text-xs font-mono font-bold text-rose-700"
                data-testid="input-reduccion-monto"
                [ngModel]="monto()"
                (ngModelChange)="monto.set($event)"
                placeholder="$ 1.000.000"
              />
            </div>

            <!-- N° Acuerdo y Fecha -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">N° Acuerdo Consejo Directivo *</label>
                <input
                  type="text"
                  class="input-base w-full text-xs font-semibold text-slate-800"
                  data-testid="input-reduccion-numero-acuerdo"
                  [ngModel]="numeroAcuerdo()"
                  (ngModelChange)="numeroAcuerdo.set($event)"
                  placeholder="Ej. Acuerdo No. 005-CD"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Fecha del Acuerdo *</label>
                <input
                  type="text"
                  appFlatpickr
                  class="input-base w-full text-xs font-mono"
                  data-testid="input-reduccion-fecha-acuerdo"
                  placeholder="dd/mm/aaaa"
                  [ngModel]="fechaAcuerdo()"
                  (ngModelChange)="fechaAcuerdo.set($event)"
                />
              </div>
            </div>

            <!-- Justificación -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Justificación de la Reducción *</label>
              <textarea
                class="input-base w-full text-xs h-20 resize-none"
                data-testid="textarea-reduccion-justificacion"
                [ngModel]="justificacion()"
                (ngModelChange)="justificacion.set($event)"
                placeholder="Motivo de la reducción (ej. Menor recaudo en matrículas o ajuste de partida)..."
              ></textarea>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              class="btn-secondary btn-sm"
              data-testid="btn-cancelar-reduccion"
              (click)="cerrarModal()"
              [disabled]="guardando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary btn-sm inline-flex items-center gap-1.5 !bg-rose-600 hover:!bg-rose-700 !border-rose-600"
              data-testid="btn-guardar-reduccion"
              (click)="guardar()"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Aplicando Reducción...</span>
              } @else {
                <span>📉 Registrar Reducción</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
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
})
export class ModalReduccionPresupuestalComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly presupuestoId = input<string>('');
  readonly rubros = input<any[]>([]);
  readonly cerrar = output<void>();
  readonly guardado = output<any>();

  readonly rubroCodigo = signal<string>('');
  readonly monto = signal<number | null>(null);
  readonly numeroAcuerdo = signal<string>('');
  readonly fechaAcuerdo = signal<string>(new Date().toISOString().split('T')[0]);
  readonly justificacion = signal<string>('');
  readonly guardando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly rubroSeleccionado = computed(() => {
    const cod = this.rubroCodigo();
    return this.rubros().find((r) => r.codigo === cod) || null;
  });

  calcularDisponible(rubro: any): number {
    if (!rubro) return 0;
    const base = Number(rubro.presupuestado) || 0;
    const adic = Number(rubro.adiciones) || 0;
    const comp = Number(rubro.comprometido) || 0;
    return Math.max(0, base + adic - comp);
  }

  cerrarModal(): void {
    this.errorMensaje.set(null);
    this.cerrar.emit();
  }

  guardar(): void {
    if (!this.presupuestoId()) {
      this.errorMensaje.set('Debe haber un presupuesto seleccionado.');
      return;
    }

    const cod = this.rubroCodigo().trim();
    if (!cod) {
      this.errorMensaje.set('Debes seleccionar el rubro a reducir.');
      return;
    }

    const valor = Number(this.monto());
    if (!valor || valor <= 0) {
      this.errorMensaje.set('El monto de reducción debe ser mayor a cero.');
      return;
    }

    const rub = this.rubroSeleccionado();
    if (rub && valor > this.calcularDisponible(rub)) {
      this.errorMensaje.set(`El monto a reducir supera el saldo disponible ($ ${this.calcularDisponible(rub).toLocaleString()}) del rubro.`);
      return;
    }

    const numAcuerdo = this.numeroAcuerdo().trim();
    if (!numAcuerdo) {
      this.errorMensaje.set('El número de acuerdo del Consejo Directivo es obligatorio.');
      return;
    }

    const just = this.justificacion().trim();
    if (!just) {
      this.errorMensaje.set('La justificación de la reducción presupuestal es obligatoria.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const payload = {
      rubroCodigo: cod,
      monto: valor,
      numeroAcuerdo: numAcuerdo,
      fechaAcuerdo: this.fechaAcuerdo().trim() || new Date().toISOString().split('T')[0],
      justificacion: just,
      aprobadoPor: 'Consejo Directivo',
    };

    this.contabilidadService.reduccionPresupuestal(this.presupuestoId(), payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
        this.rubroCodigo.set('');
        this.monto.set(null);
        this.justificacion.set('');
        this.cerrarModal();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || err?.message || 'Error al procesar la reducción presupuestal.');
      },
    });
  }
}
