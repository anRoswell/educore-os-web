import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-editar-factura',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in">
      <div class="modal-card card card-glass" style="max-width: 480px;">
        <div class="modal-header">
          <h3>✏️ Aplicar Descuento / Beca</h3>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <p>Estudiante: <strong>{{ factura?.estudianteNombre }}</strong></p>
          <p>Factura: <span class="font-mono text-xs">{{ factura?.numeroFactura }}</span></p>

          <div class="form-group mt-3">
            <label class="form-label">Nuevo Valor a Cobrar ($ COP) *</label>
            <input type="number" class="form-control" [(ngModel)]="factura.valorTotal" />
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="guardar()" class="btn btn-primary">
            🔄 Actualizar Valor Factura
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalEditarFacturaComponent {
  @Input() factura: any;

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  cerrarModal() {
    this.close.emit();
  }

  guardar() {
    this.success.emit(this.factura);
  }
}
