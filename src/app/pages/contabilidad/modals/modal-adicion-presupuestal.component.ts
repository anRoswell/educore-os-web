import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';

@Component({
  selector: 'app-modal-adicion-presupuestal',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-adicion-presupuestal-backdrop" (click)="cerrarModal()">
        <div class="modal-box w-[540px]" data-testid="modal-adicion-presupuestal" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 text-lg shadow-xs">
                ⚡
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-adicion-presupuestal-title">
                  Adición Presupuestal Extraordinaria
                </h3>
                <span class="text-xs text-slate-400 block">Modificación presupuestal aprobada por Consejo Directivo</span>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cerrarModal()"
              data-testid="btn-close-modal-adicion"
            >✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5" data-testid="error-adicion-presupuestal">
                {{ errorMensaje() }}
              </div>
            }

            <div class="bg-purple-50/70 border border-purple-100 rounded-lg p-3 text-xs text-purple-900 leading-relaxed">
              ℹ️ Una adición presupuestal incrementa el techo autorizado de gasto o la meta de recaudo para un rubro específico durante la vigencia en curso, manteniendo la trazabilidad del acto administrativo.
            </div>

            <!-- Rubro Seleccionado -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Rubro Destino de la Adición *</label>
              <select
                class="input-base w-full text-xs font-semibold text-slate-800"
                data-testid="select-adicion-rubro"
                [ngModel]="rubroCodigo()"
                (ngModelChange)="rubroCodigo.set($event)"
              >
                <option value="" disabled>-- Selecciona un rubro presupuestal --</option>
                @for (r of rubros(); track r.codigo) {
                  <option [value]="r.codigo">
                    {{ r.codigo }} — {{ r.nombre }} (Actual: $ {{ r.presupuestado | number:'1.2-2' }})
                  </option>
                }
              </select>
            </div>

            <!-- Monto Adición -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Monto de la Adición (COP) *</label>
              <input
                type="text"
                appCurrencyMask
                class="input-base w-full text-xs font-mono font-semibold text-purple-700"
                data-testid="input-adicion-monto"
                [ngModel]="montoAdicion()"
                (ngModelChange)="montoAdicion.set($event)"
                placeholder="$ 5.000.000"
              />
            </div>

            <!-- Justificación -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Justificación / Acuerdo de Consejo</label>
              <textarea
                class="input-base w-full text-xs h-20 resize-none"
                data-testid="textarea-adicion-justificacion"
                [ngModel]="justificacion()"
                (ngModelChange)="justificacion.set($event)"
                placeholder="Ej. Aprobado según Acuerdo No. 04 del Consejo Directivo del 15 de agosto..."
              ></textarea>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              class="btn-secondary btn-sm"
              data-testid="btn-cancelar-adicion"
              (click)="cerrarModal()"
              [disabled]="guardando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary btn-sm inline-flex items-center gap-1.5"
              data-testid="btn-guardar-adicion"
              (click)="guardar()"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Procesando...</span>
              } @else {
                <span>⚡ Registrar Adición</span>
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
export class ModalAdicionPresupuestalComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly presupuestoId = input<string>('');
  readonly rubros = input<any[]>([]);
  readonly rubroSeleccionadoCodigo = input<string>('');
  readonly cerrar = output<void>();
  readonly guardado = output<any>();

  readonly rubroCodigo = signal<string>('');
  readonly montoAdicion = signal<number | null>(null);
  readonly justificacion = signal<string>('');
  readonly guardando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  constructor() {
    effect(() => {
      const preselected = this.rubroSeleccionadoCodigo();
      if (preselected) {
        this.rubroCodigo.set(preselected);
      }
    });
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
      this.errorMensaje.set('Debes seleccionar el rubro destino de la adición.');
      return;
    }

    const valor = Number(this.montoAdicion());
    if (!valor || valor <= 0) {
      this.errorMensaje.set('El monto de la adición debe ser mayor a cero.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const payload: any = {
      rubroCodigo: cod,
      montoAdicion: valor,
      justificacion: this.justificacion().trim() || undefined,
    };

    this.contabilidadService.adicionPresupuestal(this.presupuestoId(), payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
        this.montoAdicion.set(null);
        this.justificacion.set('');
        this.cerrarModal();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || err?.message || 'Error al registrar la adición presupuestal.');
      },
    });
  }
}
