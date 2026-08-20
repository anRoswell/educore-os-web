import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';

@Component({
  selector: 'app-modal-nuevo-cobro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoCobro')">
      <div class="modal-card card card-glass" style="max-width: 820px;">
        <div class="modal-header">
          <h3>➕ Emitir Cobro Individual / Extraordinario</h3>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-form-grid">
            <div class="form-group">
              <label class="form-label">Estudiante *</label>
              <input type="text" class="form-control" [(ngModel)]="form.estudianteNombre" placeholder="Nombre completo del estudiante" />
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <label class="form-label" style="margin: 0;">Concepto de Cobro *</label>
                <button (click)="nuevoConcepto.emit()" style="background: none; border: none; color: #4f46e5; font-size: 0.75rem; font-weight: bold; cursor: pointer; text-decoration: underline;">+ Nuevo Concepto</button>
              </div>
              <select class="form-select" [(ngModel)]="form.concepto" (ngModelChange)="onConceptoSelect($event)">
                @for (con of conceptosList; track con.id) {
                  <option [value]="con.nombre">{{ con.nombre }} (\${{ con.valorSugerido | number }} COP)</option>
                } @empty {
                  <option value="Pensión Mensual Escolar">Pensión Mensual Escolar</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Valor en Pesos ($ COP) *</label>
              <input type="number" class="form-control" [(ngModel)]="form.valorTotal" />
            </div>

            <div class="form-group">
              <label class="form-label">Fecha Límite de Pago *</label>
              <input type="date" class="form-control" [(ngModel)]="form.fechaVencimiento" />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="guardar()" class="btn btn-primary" [disabled]="isSaving">
            💾 {{ isSaving ? 'Emitiendo...' : 'Emitir Cuenta de Cobro' }}
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalNuevoCobroComponent {
  private readonly toast = inject(ToastService);
  readonly modalManager = inject(ModalManagerService);

  @Input() conceptosList: any[] = [];
  @Input() form = {
    estudianteNombre: '',
    concepto: 'Pensión Mensual Escolar',
    valorTotal: 450000,
    fechaVencimiento: '2026-08-25',
  };

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();
  @Output() nuevoConcepto = new EventEmitter<void>();

  isSaving = false;

  onConceptoSelect(nombre: string) {
    const found = this.conceptosList.find((c) => c.nombre === nombre);
    if (found && found.valorSugerido) {
      this.form.valorTotal = Number(found.valorSugerido);
    }
  }

  cerrarModal() {
    this.close.emit();
  }

  guardar() {
    if (!this.form.estudianteNombre) {
      this.toast.error('Campo Requerido', 'Por favor indique el nombre del estudiante.');
      return;
    }

    this.isSaving = true;
    // Mock simulation for saving...
    setTimeout(() => {
      this.toast.success('Cobro Emitido', `Se ha generado la cuenta de cobro para ${this.form.estudianteNombre} exitosamente.`);
      this.isSaving = false;
      this.success.emit(this.form);
    }, 800);
  }
}
