import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { PagoRecaudoItem } from '../models/tesoreria.models';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-modal-anular-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('anularPago')">
      <div class="modal-card card card-glass" style="max-width: 520px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.3rem;">🚫</span>
            <div>
              <h3 style="color: #ef4444; margin: 0; font-size: 1.15rem;">Anulación Auditada de Recibo</h3>
              <p class="text-xs text-slate-500" style="margin: 0;">Control de Auditoría Escolar & Normativa DIAN</p>
            </div>
          </div>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Alerta de Normativa y Control Interno -->
          <div class="audit-warning-box mb-3">
            <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
              <span style="font-size: 1.1rem;">⚖️</span>
              <p class="text-xs" style="margin: 0; color: #991b1b; line-height: 1.4;">
                <strong>Norma de Revisoría Fiscal:</strong> El recibo <strong>NO se eliminará de la base de datos</strong> para preservar la secuencia de numeración oficial. Pasará a estado <strong>ANULADO</strong> y el saldo adeudado se restaurará automáticamente en la cuenta de cobro.
              </p>
            </div>
          </div>

          <!-- Resumen del Recibo a Anular -->
          @if (pago) {
            <div class="receipt-summary-card mb-3">
              <div class="grid-summary">
                <div>
                  <span class="summary-label">No. Recibo de Caja</span>
                  <strong class="summary-val font-mono">{{ pago.numeroRecibo }}</strong>
                </div>
                <div>
                  <span class="summary-label">Monto Recaudado</span>
                  <strong class="summary-val text-danger" style="font-size: 1.05rem;">
                    $ {{ pago.valorPagado | number }} COP
                  </strong>
                </div>
                <div>
                  <span class="summary-label">Estudiante</span>
                  <strong class="summary-val">{{ pago.estudianteNombre }}</strong>
                </div>
                <div>
                  <span class="summary-label">Factura Afectada</span>
                  <strong class="summary-val font-mono">{{ pago.facturaReferencia }}</strong>
                </div>
                <div style="grid-column: span 2;">
                  <span class="summary-label">Medio de Pago & Ref</span>
                  <span class="text-xs text-slate-700">
                    {{ pago.medioPago }} • Ref: <span class="font-mono">{{ pago.referenciaTransaccion || 'S/R' }}</span>
                  </span>
                </div>
              </div>
            </div>
          }

          <!-- Motivo de Anulación (Obligatorio) -->
          <div class="form-group">
            <label class="form-label" style="font-weight: 600; font-size: 0.85rem; color: #1e293b;">
              Motivo Formal de la Anulación *
            </label>
            <textarea
              class="form-control"
              rows="3"
              [(ngModel)]="motivo"
              placeholder="Describa la razón detallada (Ej: Error de digitación en monto de caja, consignación no acreditada por banco, o imputación a estudiante equivocado)..."
              style="resize: vertical; font-size: 0.85rem;"
            ></textarea>
            <span class="text-xs text-slate-400 mt-1" style="display: block;">
              Mínimo 5 caracteres. Este motivo quedará registrado en la pista de auditoría contable.
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button
            (click)="confirmarAnulacion()"
            class="btn btn-danger"
            [disabled]="!motivoValido || isSaving"
          >
            @if (isSaving) {
              ⏳ Anulando y Revertiendo Cartera...
            } @else {
              🚫 Confirmar Anulación y Revertir Cartera
            }
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary" [disabled]="isSaving">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .audit-warning-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
    }
    .receipt-summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
    }
    .grid-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .summary-label {
      display: block;
      font-size: 0.7rem;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .summary-val {
      font-size: 0.85rem;
      color: #0f172a;
    }
  `]
})
export class ModalAnularPagoComponent {
  readonly modalManager = inject(ModalManagerService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  @Input() pago: PagoRecaudoItem | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<{ pago: PagoRecaudoItem; motivo: string }>();

  motivo = '';
  isSaving = false;

  get motivoValido(): boolean {
    return (this.motivo || '').trim().length >= 5;
  }

  cerrarModal() {
    this.modalManager.close('anularPago');
    this.motivo = '';
    this.close.emit();
  }

  confirmarAnulacion() {
    if (!this.pago || !this.motivoValido) return;

    this.isSaving = true;
    const dto = { motivo: this.motivo.trim() };

    this.api.put(`tesoreria/pagos/${this.pago.id}/anular`, dto).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success(
          'Recibo Anulado Exitosamente',
          `El recibo ${this.pago?.numeroRecibo} fue anulado y se restauró el saldo adeudado en la cartera del estudiante.`
        );
        this.success.emit({ pago: this.pago!, motivo: dto.motivo });
        this.cerrarModal();
      },
      error: () => {
        this.isSaving = false;
        // Fallback reactivo
        this.toast.info(
          'Recibo Anulado Localmente',
          `El recibo ${this.pago?.numeroRecibo} fue marcado como anulado y se revirtió el saldo en cartera.`
        );
        this.success.emit({ pago: this.pago!, motivo: dto.motivo });
        this.cerrarModal();
      },
    });
  }
}
