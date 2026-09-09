import { Component, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { Asiento } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-anular-asiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible() && asiento()) {
      <div class="modal-backdrop" data-testid="modal-anular-asiento-backdrop" (click)="cancelar()">
        <div class="modal-box w-[500px] rounded-2xl shadow-xl border border-slate-100 p-6" data-testid="modal-anular-asiento" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 text-lg shadow-xs">
                ⚠️
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-rose-600 tracking-tight" data-testid="modal-anular-asiento-title">
                  Anular Comprobante
                </h3>
                <span class="text-xs text-slate-400 block">Reversión auditada de movimientos contables</span>
              </div>
            </div>
            <span class="badge-mini badge-red">Acción Auditada</span>
          </div>

          <div class="modal-body space-y-4 pt-4">
            @if (errorMensaje()) {
              <div class="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3" data-testid="alert-error-anulacion">
                {{ errorMensaje() }}
              </div>
            }

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              ¿Está seguro que desea anular el comprobante
              <strong class="text-slate-900 font-bold">{{ asiento()!.tipoComprobante }}-{{ asiento()!.consecutivo | number:'6.0-0' }}</strong>?
            </div>

            <div class="bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-700 flex items-start gap-2.5">
              <span class="text-base flex-shrink-0">⚠️</span>
              <span class="leading-relaxed"><strong>Advertencia:</strong> Esta acción marcará el comprobante como
              <code>VOID</code> y generará automáticamente un asiento de reverso (tipo NOT)
              manteniendo la pista de auditoría. No puede deshacerse.</span>
            </div>

            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-slate-700">Motivo de Anulación * (mínimo 5 caracteres)</label>
              <textarea
                class="input-base h-24 text-xs w-full"
                data-testid="textarea-motivo-anulacion"
                [ngModel]="motivo()"
                (ngModelChange)="motivo.set($event)"
                placeholder="Describa detalladamente el motivo de la anulación..."
              ></textarea>
            </div>
          </div>

          <div class="modal-actions flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              class="btn-secondary btn-sm font-medium"
              data-testid="btn-cancelar-anulacion"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-danger btn-sm font-semibold shadow-sm"
              data-testid="btn-confirmar-anulacion"
              [disabled]="!motivoValido() || procesando()"
              (click)="confirmar()"
            >
              {{ procesando() ? 'Anulando...' : 'Confirmar Anulación' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalAnularAsientoComponent {
  private readonly svc = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly asiento = input<Asiento | null>(null);
  readonly closeModal = output<void>();
  readonly anulado = output<Asiento>();

  readonly motivo = signal<string>('');
  readonly procesando = signal<boolean>(false);
  readonly errorMensaje = signal<string>('');

  readonly motivoValido = computed(() => this.motivo().trim().length >= 5);

  confirmar(): void {
    const a = this.asiento();
    if (!a || !this.motivoValido()) return;

    this.procesando.set(true);
    this.errorMensaje.set('');

    this.svc.anularAsiento(a.id, this.motivo().trim()).subscribe({
      next: (anuladoRes) => {
        this.procesando.set(false);
        this.motivo.set('');
        this.anulado.emit(anuladoRes);
        this.closeModal.emit();
      },
      error: (err) => {
        this.procesando.set(false);
        const detalle = err?.error?.message || err?.message || 'Error al anular comprobante';
        this.errorMensaje.set(Array.isArray(detalle) ? detalle.join(', ') : detalle);
      },
    });
  }

  cancelar(): void {
    this.motivo.set('');
    this.errorMensaje.set('');
    this.closeModal.emit();
  }
}
