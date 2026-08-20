import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { CuentaCobroItem } from '../models/tesoreria.models';

@Component({
  selector: 'app-modal-checkout-wompi',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop animate-fade-in">
      <div class="modal-card card card-glass">
        <div class="wompi-header">
          <div class="wompi-brand">
            <span style="font-size: 1.5rem;">💳</span>
            <strong>Pasarela de Pagos Wompi Bancolombia</strong>
          </div>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="wompi-body mt-4">
          <div class="checkout-summary">
            <span class="text-slate-500 text-sm">Factura: {{ cuenta?.numeroFactura }}</span>
            <h3>\${{ cuenta?.valorTotal | number }} COP</h3>
            <p>Estudiante: <strong>{{ cuenta?.estudianteNombre }}</strong></p>
            <p>Concepto: {{ cuenta?.concepto }}</p>
          </div>

          <div class="payment-methods-grid mt-4">
            <div class="pm-option active">
              <span class="pm-icon">🏦</span>
              <strong>PSE (Débito a Cuentas de Ahorro)</strong>
            </div>
            <div class="pm-option">
              <span class="pm-icon">📱</span>
              <strong>Nequi / Daviplata QR</strong>
            </div>
            <div class="pm-option">
              <span class="pm-icon">💳</span>
              <strong>Tarjeta de Crédito Visa / Mastercard</strong>
            </div>
          </div>

          <div class="security-badge mt-4">
            <span>🔒 Transacción Segura con Firma Criptográfica SHA-256</span>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="confirmarPago()" class="btn btn-success" [disabled]="isProcessing">
            💳 {{ isProcessing ? 'Procesando...' : 'Procesar Pago PSE Wompi' }}
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalCheckoutWompiComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  @Input() cuenta: CuentaCobroItem | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  isProcessing = false;

  cerrarModal() {
    this.close.emit();
  }

  confirmarPago() {
    if (!this.cuenta) return;
    
    this.isProcessing = true;
    this.api.post<any>('tesoreria/pagos/manual', {
      cuentaCobroId: this.cuenta.id,
      medioPago: 'WOMPI_PSE',
      valorPagado: this.cuenta.valorTotal,
      referenciaTransaccion: `WOMPI-PSE-${Date.now().toString().slice(-6)}`,
    }).subscribe({
      next: () => {
        this.toast.success('¡Pago Procesado!', `El recaudo por $${this.cuenta!.valorTotal.toLocaleString()} COP ha sido registrado en la base de datos.`);
        this.isProcessing = false;
        this.success.emit();
      },
      error: (err) => {
        this.toast.error('Error al registrar pago', err?.error?.message || 'No fue posible registrar el pago.');
        this.isProcessing = false;
      }
    });
  }
}
