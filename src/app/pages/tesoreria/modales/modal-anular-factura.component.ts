import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalManagerService } from '../../../core/services/modal-manager.service';

@Component({
  selector: 'app-modal-anular-factura',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('anularFactura')">
      <div class="modal-card card card-glass" style="max-width: 480px;">
        <div class="modal-header">
          <h3 style="color: #ef4444;">⚠️ Confirmación de Anulación</h3>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <p>
            ¿Está seguro de anular la factura <strong>{{ factura?.numeroFactura }}</strong> 
            de <strong>{{ factura?.estudianteNombre }}</strong> por valor de 
            <strong>\${{ factura?.valorTotal | number }} COP</strong>?
          </p>
        </div>

        <div class="modal-footer">
          <button (click)="confirmarAnulacion()" class="btn btn-danger">
            🗑️ Confirmar Anulación
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalAnularFacturaComponent {
  readonly modalManager = inject(ModalManagerService);

  @Input() factura: any;

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  cerrarModal() {
    this.modalManager.close('anularFactura');
    this.close.emit();
  }

  confirmarAnulacion() {
    this.success.emit(this.factura);
    this.cerrarModal();
  }
}
