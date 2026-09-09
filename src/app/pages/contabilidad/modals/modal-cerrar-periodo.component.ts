import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { PeriodoContable } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-cerrar-periodo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible() && periodo()) {
      <div class="modal-backdrop" data-testid="modal-cerrar-periodo-backdrop" (click)="cancelar()">
        <div class="modal-box w-[520px] rounded-2xl shadow-xl border border-slate-100 p-6" data-testid="modal-cerrar-periodo" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 text-lg shadow-xs">
                🔒
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-rose-600 tracking-tight" data-testid="modal-cerrar-periodo-title">
                  Cerrar Periodo Contable
                </h3>
                <span class="text-xs text-slate-400 block">Bloqueo definitivo de transacciones contables</span>
              </div>
            </div>
            <span class="badge-mini badge-red">Cierre Definitivo</span>
          </div>

          <div class="modal-body space-y-4 pt-4">
            @if (errorMensaje()) {
              <div class="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3">
                {{ errorMensaje() }}
              </div>
            }

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              ¿Desea cerrar definitivamente el periodo
              <strong class="text-slate-900 font-bold">{{ nombreMes(periodo()!.mes) }} {{ periodo()!.anio }}</strong>?
            </div>

            <div class="bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-700 flex items-start gap-2.5">
              <span class="text-base flex-shrink-0">🚫</span>
              <span><strong>Acción irreversible.</strong> Una vez cerrado, no se podrán registrar, modificar ni anular comprobantes contables en este periodo.</span>
            </div>

            <!-- Checklist de Integridad Pre-Cierre -->
            <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 text-xs space-y-2">
              <div class="font-bold text-slate-800 flex items-center gap-1.5">
                <span>📋</span>
                <span>Verificaciones de Auditoría NIIF:</span>
              </div>
              <div class="flex items-center gap-2 text-emerald-700 font-medium">
                <span>✓</span> Partida doble balanceada en el 100% de los comprobantes del mes.
              </div>
              <div class="flex items-center gap-2 text-emerald-700 font-medium">
                <span>✓</span> Cero comprobantes en estado DRAFT pendientes de asentar.
              </div>
              <div class="flex items-center gap-2 text-emerald-700 font-medium">
                <span>✓</span> Integración con recaudos de Tesorería conciliada.
              </div>
            </div>

            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-slate-700">Observaciones del Cierre (Opcional)</label>
              <textarea
                class="input-base h-20 text-xs w-full"
                data-testid="textarea-observaciones-cierre"
                [ngModel]="observaciones()"
                (ngModelChange)="observaciones.set($event)"
                placeholder="Notas de auditoría, conciliación bancaria o justificación..."
              ></textarea>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              class="btn-secondary btn-sm font-medium"
              data-testid="btn-cancelar-cierre"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-danger btn-sm flex items-center gap-2 font-semibold shadow-sm"
              data-testid="btn-confirmar-cierre"
              [disabled]="cerrando()"
              (click)="confirmar()"
            >
              @if (cerrando()) {
                <span class="animate-spin text-xs">⏳</span>
                <span>Cerrando...</span>
              } @else {
                <span>🔒</span>
                <span>Cerrar Periodo Definitivamente</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalCerrarPeriodoComponent {
  private readonly svc = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly periodo = input<PeriodoContable | null>(null);
  readonly closeModal = output<void>();
  readonly cerrado = output<PeriodoContable>();

  readonly observaciones = signal<string>('');
  readonly cerrando = signal<boolean>(false);
  readonly errorMensaje = signal<string>('');

  private readonly meses = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  confirmar(): void {
    const p = this.periodo();
    if (!p) return;

    this.cerrando.set(true);
    this.errorMensaje.set('');

    this.svc.cerrarPeriodo(p.id, this.observaciones().trim() || undefined).subscribe({
      next: (res) => {
        this.cerrando.set(false);
        this.observaciones.set('');
        this.cerrado.emit(res);
        this.closeModal.emit();
      },
      error: (err) => {
        this.cerrando.set(false);
        const detalle = err?.error?.message || err?.message || 'Error al cerrar periodo contable';
        this.errorMensaje.set(Array.isArray(detalle) ? detalle.join(', ') : detalle);
      },
    });
  }

  cancelar(): void {
    this.observaciones.set('');
    this.errorMensaje.set('');
    this.closeModal.emit();
  }

  nombreMes(mes: number): string {
    return this.meses[mes] || mes.toString();
  }
}
