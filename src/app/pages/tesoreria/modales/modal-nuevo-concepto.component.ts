import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';

@Component({
  selector: 'app-modal-nuevo-concepto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoConcepto')">
      <div class="modal-card card card-glass" style="max-width: 780px;">
        <div class="modal-header">
          <div>
            <h3>🏷️ Crear Concepto de Cobro / Tarifa</h3>
            <span class="modal-subtitle">Parametrización financiera de pensiones, matrículas y derechos</span>
          </div>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Nombre del Concepto *</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="form.nombre"
                placeholder="Ej: Pensión Mensual, Seguro Escolar, Salida Pedagógica"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Código Único *</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="form.codigo"
                placeholder="Ej: PENS-01, MAT-2026, SEG-EST"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Valor Sugerido ($ COP)</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.valorSugerido"
                min="0"
              />
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" [(ngModel)]="form.esRecurrenteMensual" style="width: 18px; height: 18px;" />
                <span>¿Es cobro recurrente mensual? (ej: Pensión mensual)</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="guardar()" class="btn btn-primary" [disabled]="isSaving">
            💾 {{ isSaving ? 'Guardando...' : 'Guardar Concepto' }}
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalNuevoConceptoComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly modalManager = inject(ModalManagerService);

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  form = {
    nombre: '',
    codigo: `CON-${Date.now().toString().slice(-4)}`,
    valorSugerido: 150000,
    esRecurrenteMensual: false,
  };
  
  isSaving = false;

  cerrarModal() {
    this.close.emit();
  }

  guardar() {
    if (!this.form.nombre || !this.form.codigo) {
      this.toast.error('Campos Requeridos', 'Por favor complete el nombre y código del concepto de cobro.');
      return;
    }

    this.isSaving = true;
    this.api.post<any>('tesoreria/conceptos', this.form).subscribe({
      next: (conceptoCreado) => {
        this.toast.success('¡Concepto Creado!', `El concepto '${conceptoCreado.nombre}' ha sido registrado en PostgreSQL.`);
        this.isSaving = false;
        this.success.emit(conceptoCreado);
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message || 'No se pudo crear el concepto.');
        this.isSaving = false;
      }
    });
  }
}
