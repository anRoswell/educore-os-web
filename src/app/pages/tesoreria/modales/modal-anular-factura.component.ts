import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-anular-factura',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop animate-fade-in">
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
          <button (click)="confirmar()" class="btn btn-danger">
            🗑️ Confirmar Anulación
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalAnularFacturaComponent {
  @Input() factura: any;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any>();

  cerrarModal() {
    this.close.emit();
  }

  confirmar() {
    this.confirm.emit(this.factura);
  }
}
