import { Component, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';
import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';

@Component({
  selector: 'app-modal-traslado-presupuestal',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective, FlatpickrDirective],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-traslado-presupuestal-backdrop" (click)="cerrarModal()">
        <div class="modal-box w-[580px]" data-testid="modal-traslado-presupuestal" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-lg shadow-xs">
                🔄
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-traslado-presupuestal-title">
                  Traslado Presupuestal
                </h3>
                <span class="text-xs text-slate-400 block">Créditos y Contracréditos autorizados por el Consejo Directivo</span>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cerrarModal()"
              data-testid="btn-close-modal-traslado"
            >✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5" data-testid="error-traslado-presupuestal">
                {{ errorMensaje() }}
              </div>
            }

            <div class="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 leading-relaxed">
              ⚖️ <strong>Decreto 111 de 1996 & Decreto 1075 de 2015:</strong> El traslado presupuestal disminuye la apropiación del rubro cedente (<strong>contracrédito</strong>) e incrementa el rubro receptor (<strong>crédito</strong>). El presupuesto total institucional se mantiene matemáticamente inalterado.
            </div>

            <!-- Rubro Origen (Cede recursos) -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">
                Rubro Origen (Contracrédito / Cede Apropiación) *
              </label>
              <select
                class="input-base w-full text-xs font-semibold text-slate-800"
                data-testid="select-traslado-origen"
                [ngModel]="rubroOrigenCodigo()"
                (ngModelChange)="rubroOrigenCodigo.set($event)"
              >
                <option value="" disabled>-- Selecciona el rubro de donde sale el dinero --</option>
                @for (r of rubros(); track r.codigo) {
                  <option [value]="r.codigo">
                    {{ r.codigo }} — {{ r.nombre }} (Disponible: $ {{ calcularDisponible(r) | number:'1.2-2' }})
                  </option>
                }
              </select>
              @if (rubroOrigenSeleccionado()) {
                <div class="text-[11px] text-slate-500 mt-0.5">
                  Saldo Disponible para trasladar: <strong class="text-blue-700 font-mono">$ {{ calcularDisponible(rubroOrigenSeleccionado()) | number:'1.2-2' }}</strong>
                </div>
              }
            </div>

            <!-- Rubro Destino (Recibe recursos) -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">
                Rubro Destino (Crédito / Recibe Aumento) *
              </label>
              <select
                class="input-base w-full text-xs font-semibold text-slate-800"
                data-testid="select-traslado-destino"
                [ngModel]="rubroDestinoCodigo()"
                (ngModelChange)="rubroDestinoCodigo.set($event)"
              >
                <option value="" disabled>-- Selecciona el rubro beneficiario --</option>
                @for (r of rubros(); track r.codigo) {
                  @if (r.codigo !== rubroOrigenCodigo()) {
                    <option [value]="r.codigo">
                      {{ r.codigo }} — {{ r.nombre }} (Apropiación Actual: $ {{ r.presupuestado | number:'1.2-2' }})
                    </option>
                  }
                }
              </select>
            </div>

            <!-- Monto del Traslado -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Monto del Traslado (COP) *</label>
              <input
                type="text"
                appCurrencyMask
                class="input-base w-full text-xs font-mono font-bold text-blue-700"
                data-testid="input-traslado-monto"
                [ngModel]="monto()"
                (ngModelChange)="monto.set($event)"
                placeholder="$ 2.500.000"
              />
            </div>

            <!-- Acuerdo y Fecha del Consejo Directivo -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">N° Acuerdo Consejo Directivo *</label>
                <input
                  type="text"
                  class="input-base w-full text-xs font-semibold text-slate-800"
                  data-testid="input-traslado-numero-acuerdo"
                  [ngModel]="numeroAcuerdo()"
                  (ngModelChange)="numeroAcuerdo.set($event)"
                  placeholder="Ej. Acuerdo No. 004-CD"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Fecha del Acuerdo *</label>
                <input
                  type="text"
                  appFlatpickr
                  class="input-base w-full text-xs font-mono"
                  data-testid="input-traslado-fecha-acuerdo"
                  placeholder="dd/mm/aaaa"
                  [ngModel]="fechaAcuerdo()"
                  (ngModelChange)="fechaAcuerdo.set($event)"
                />
              </div>
            </div>

            <!-- Justificación Técnica / Administrativa -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Justificación Técnica del Traslado *</label>
              <textarea
                class="input-base w-full text-xs h-20 resize-none"
                data-testid="textarea-traslado-justificacion"
                [ngModel]="justificacion()"
                (ngModelChange)="justificacion.set($event)"
                placeholder="Explicación del requerimiento urgente o necesidad imprevista avalada por el Consejo Directivo..."
              ></textarea>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              class="btn-secondary btn-sm"
              data-testid="btn-cancelar-traslado"
              (click)="cerrarModal()"
              [disabled]="guardando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary btn-sm inline-flex items-center gap-1.5 !bg-blue-600 hover:!bg-blue-700 !border-blue-600"
              data-testid="btn-guardar-traslado"
              (click)="guardar()"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Efectuando Traslado...</span>
              } @else {
                <span>🔄 Aplicar Traslado Presupuestal</span>
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
export class ModalTrasladoPresupuestalComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly presupuestoId = input<string>('');
  readonly rubros = input<any[]>([]);
  readonly cerrar = output<void>();
  readonly guardado = output<any>();

  readonly rubroOrigenCodigo = signal<string>('');
  readonly rubroDestinoCodigo = signal<string>('');
  readonly monto = signal<number | null>(null);
  readonly numeroAcuerdo = signal<string>('');
  readonly fechaAcuerdo = signal<string>(new Date().toISOString().split('T')[0]);
  readonly justificacion = signal<string>('');
  readonly guardando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly rubroOrigenSeleccionado = computed(() => {
    const cod = this.rubroOrigenCodigo();
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

    const orig = this.rubroOrigenCodigo().trim();
    const dest = this.rubroDestinoCodigo().trim();

    if (!orig) {
      this.errorMensaje.set('Debes seleccionar el rubro origen (contracrédito).');
      return;
    }

    if (!dest) {
      this.errorMensaje.set('Debes seleccionar el rubro destino (crédito).');
      return;
    }

    if (orig === dest) {
      this.errorMensaje.set('El rubro origen y destino no pueden ser el mismo.');
      return;
    }

    const valor = Number(this.monto());
    if (!valor || valor <= 0) {
      this.errorMensaje.set('El monto a trasladar debe ser mayor a cero.');
      return;
    }

    const origRubro = this.rubroOrigenSeleccionado();
    if (origRubro && valor > this.calcularDisponible(origRubro)) {
      this.errorMensaje.set(`El monto supera el saldo disponible ($ ${this.calcularDisponible(origRubro).toLocaleString()}) del rubro origen.`);
      return;
    }

    const numAcuerdo = this.numeroAcuerdo().trim();
    if (!numAcuerdo) {
      this.errorMensaje.set('El número de acuerdo del Consejo Directivo es obligatorio.');
      return;
    }

    const just = this.justificacion().trim();
    if (!just) {
      this.errorMensaje.set('La justificación técnica del traslado es obligatoria.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const payload = {
      rubroOrigenCodigo: orig,
      rubroDestinoCodigo: dest,
      monto: valor,
      numeroAcuerdo: numAcuerdo,
      fechaAcuerdo: this.fechaAcuerdo().trim() || new Date().toISOString().split('T')[0],
      justificacion: just,
      aprobadoPor: 'Consejo Directivo',
    };

    this.contabilidadService.trasladoPresupuestal(this.presupuestoId(), payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
        this.rubroOrigenCodigo.set('');
        this.rubroDestinoCodigo.set('');
        this.monto.set(null);
        this.justificacion.set('');
        this.cerrarModal();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || err?.message || 'Error al ejecutar el traslado presupuestal.');
      },
    });
  }
}
