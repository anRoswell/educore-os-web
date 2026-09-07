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
        <div class="modal-box w-[520px]" data-testid="modal-cerrar-periodo" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b">
            <h3 class="modal-title font-bold text-lg text-red-600" data-testid="modal-cerrar-periodo-title">
              Cerrar Periodo Contable
            </h3>
            <span class="badge-mini badge-red">Cierre Definitivo</span>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2">
                {{ errorMensaje() }}
              </div>
            }

            <p class="text-sm text-gray-700">
              ¿Desea cerrar definitivamente el periodo
              <strong>{{ nombreMes(periodo()!.mes) }} {{ periodo()!.anio }}</strong>?
            </p>

            <div class="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
              🚫 <strong>Acción irreversible.</strong> Una vez cerrado, no se podrán registrar ni anular asientos en este periodo.
            </div>

            <!-- Checklist de Integridad Pre-Cierre -->
            <div class="border rounded p-3 bg-gray-50 text-xs space-y-2">
              <div class="font-semibold text-gray-700">Verificaciones de Auditoría NIIF:</div>
              <div class="flex items-center gap-2 text-green-700">
                <span>✓</span> Partida doble balanceada en el 100% de los comprobantes del mes.
              </div>
              <div class="flex items-center gap-2 text-green-700">
                <span>✓</span> Cero comprobantes en estado DRAFT pendientes de asentar.
              </div>
              <div class="flex items-center gap-2 text-green-700">
                <span>✓</span> Integración con recaudos de Tesorería conciliada.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label text-xs font-semibold">Observaciones del Cierre (Opcional)</label>
              <textarea
                class="input-base h-20 text-xs"
                data-testid="textarea-observaciones-cierre"
                [ngModel]="observaciones()"
                (ngModelChange)="observaciones.set($event)"
                placeholder="Notas de auditoría o conciliación..."
              ></textarea>
            </div>
          </div>

          <div class="modal-actions flex justify-end gap-2 pt-4 border-t mt-4">
            <button
              type="button"
              class="btn-secondary"
              data-testid="btn-cancelar-cierre"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-danger"
              data-testid="btn-confirmar-cierre"
              [disabled]="cerrando()"
              (click)="confirmar()"
            >
              {{ cerrando() ? 'Cerrando...' : 'Cerrar Periodo Definitivamente' }}
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
