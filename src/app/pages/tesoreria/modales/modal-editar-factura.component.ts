import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';

@Component({
  selector: 'app-modal-editar-factura',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('editarFactura')">
      <div class="modal-card card card-glass" style="max-width: 520px;">
        <div class="modal-header">
          <h3>✏️ Editar / Ajustar Valor de Factura</h3>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <p>Ajuste el valor para el alumno <strong>{{ factura?.estudianteNombre }}</strong></p>
          <p>Factura: <span class="font-mono text-xs">{{ factura?.numeroFactura }}</span></p>

          <div class="form-group mt-3">
            <label class="form-label">Nuevo Valor a Cobrar ($ COP) *</label>
            <input
              type="text"
              appCurrencyMask
              class="form-control"
              [(ngModel)]="factura.valorTotal"
              placeholder="$ 450.000"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="guardarFactura()" class="btn btn-primary">
            🔄 Actualizar Valor Factura
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalEditarFacturaComponent {
  readonly modalManager = inject(ModalManagerService);

  @Input() factura: any;

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  cerrarModal() {
    this.modalManager.close('editarFactura');
    this.close.emit();
  }

  guardarFactura() {
    this.success.emit(this.factura);
    this.cerrarModal();
  }
}
