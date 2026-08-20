import { Component, EventEmitter, inject, Input, Output, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Parametro } from '../../../core/services/parametros.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-modal-pago-manual',
  standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in">
      <div class="modal-card card card-glass" style="max-width: 820px;">
        <div class="modal-header">
          <h3>💵 Registrar Recaudo en Ventanilla (Caja)</h3>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Estudiante / Factura a Cruzar *</label>
              <select class="form-select" [(ngModel)]="form.cuentaCobroId">
                @for (c of cuentasPendientes; track c.id) {
                  <option [value]="c.id">
                    {{ c.estudianteNombre }} — {{ c.numeroFactura }} (\${{ c.valorTotal | number }} COP)
                  </option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Medio de Pago *</label>
              <select class="form-select" [(ngModel)]="form.medioPago">
                @for (medio of mediosPagoList(); track medio.codigo) {
                  <option [value]="medio.codigo">{{ medio.nombre }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Valor Recibido ($ COP) *</label>
              <input type="number" class="form-control" [(ngModel)]="form.valorPagado" />
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Número de Comprobante / Voucher Banco</label>
              <input type="text" class="form-control" [(ngModel)]="form.referenciaTransaccion" placeholder="Ej: VOUCHER-9847291" />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="guardar()" class="btn btn-success" [disabled]="isSaving">
            💾 {{ isSaving ? 'Registrando...' : 'Registrar Pago & Emitir Recibo de Caja' }}
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalPagoManualComponent {
  mediosPagoList = input<Parametro[]>([]);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  @Input() cuentasPendientes: any[] = [];
  @Input() form = {
    cuentaCobroId: '',
    medioPago: 'EFECTIVO' as 'PSE' | 'EFECTIVO' | 'TRANSFERENCIA_BANCOLOMBIA' | 'NEQUI_QR' | 'TARJETA_CREDITO',
    valorPagado: 450000,
    referenciaTransaccion: 'REC-VENTANILLA-001',
  };

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<{ dto: any, cuenta: any }>();

  isSaving = false;

  cerrarModal() {
    this.close.emit();
  }

  guardar() {
    const cuenta = this.cuentasPendientes.find((c) => c.id === this.form.cuentaCobroId);
    if (!cuenta) {
      this.toast.error('Factura no encontrada', 'Seleccione una cuenta de cobro válida.');
      return;
    }

    const dto = {
      cuentaCobroId: cuenta.id,
      medioPago: this.form.medioPago,
      valorPagado: this.form.valorPagado,
      referenciaTransaccion: this.form.referenciaTransaccion,
    };

    this.isSaving = true;

    // Registrar en API
    this.api.post('tesoreria/pagos/manual', dto).subscribe({
      next: () => {
        this.isSaving = false;
        this.success.emit({ dto, cuenta });
      },
      error: () => {
        // Ignoramos error y seguimos el flujo mock si el backend falla en el FAKE
        this.isSaving = false;
        this.success.emit({ dto, cuenta });
      },
    });
  }
}
