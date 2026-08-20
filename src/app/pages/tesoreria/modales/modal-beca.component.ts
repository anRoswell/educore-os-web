import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-beca',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in">
      <div class="modal-card card card-glass" style="max-width: 500px;">
        <div class="modal-header">
          <h3>🎓 Asignación de Beca / Tarifa Especial</h3>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <p>Estudiante: <strong>{{ estudiante?.nombre }}</strong> (Grado {{ estudiante?.grado }})</p>
          
          <div class="form-group mt-3">
            <label class="form-label">Tipo de Beca / Beneficio *</label>
            <select class="form-select" [(ngModel)]="form.tipo" (ngModelChange)="actualizarPorcentaje($event)">
              <option value="NINGUNA">Sin Beca (Tarifa Plena 100%)</option>
              <option value="EXCELENCIA">Beca por Excelencia Académica (50% desc.)</option>
              <option value="HERMANOS">Beca Familiar / Hermanos (20% desc.)</option>
              <option value="DOCENTE">Hijo de Docente / Colaborador (30% desc.)</option>
              <option value="SOLIDARIA">Beca Solidaria / Alcaldía (100% desc.)</option>
              <option value="OTRA">Otra (Especificar % Manual)</option>
            </select>
          </div>

          <div class="form-group mt-3">
            <label class="form-label">Porcentaje de Descuento (%) *</label>
            <input type="number" min="0" max="100" class="form-control" [(ngModel)]="form.porcentaje" />
          </div>

          <div class="form-group mt-3">
            <label class="form-label">Resolución / Justificación de la Beca *</label>
            <textarea class="form-control" rows="2" [(ngModel)]="form.observaciones" placeholder="Ej: Aprobado mediante Resolución Rectoral N° 045 de Consejo Directivo."></textarea>
          </div>

          <div class="mt-3 p-3" style="background: #eef2ff; border-radius: 8px; font-size: 0.85rem;">
            <p style="margin: 0; color: #3730a3;">
              💡 Nueva pensión mensual resultante: 
              <strong>\${{ (450000 * (1 - (form.porcentaje / 100))) | number }} COP</strong> (Ahorro de \${{ (450000 * (form.porcentaje / 100)) | number }} COP/mes).
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="guardar()" class="btn btn-primary">
            💾 Guardar y Aplicar a Cuotas
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalBecaComponent {
  @Input() estudiante: any;
  @Input() form = {
    tipo: 'EXCELENCIA',
    porcentaje: 50,
    observaciones: 'Aprobado mediante resolución de Rectoría / Consejo Directivo',
  };

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  actualizarPorcentaje(tipo: string) {
    if (tipo === 'NINGUNA') this.form.porcentaje = 0;
    else if (tipo === 'EXCELENCIA') this.form.porcentaje = 50;
    else if (tipo === 'HERMANOS') this.form.porcentaje = 20;
    else if (tipo === 'DOCENTE') this.form.porcentaje = 30;
    else if (tipo === 'SOLIDARIA') this.form.porcentaje = 100;
  }

  cerrarModal() {
    this.close.emit();
  }

  guardar() {
    this.success.emit(this.form);
  }
}
