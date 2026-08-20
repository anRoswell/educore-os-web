import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { SearchableSelectComponent, SearchableOption } from '../../../shared/components/searchable-select.component';

@Component({
  selector: 'app-modal-nuevo-acuerdo',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  template: `
    <div class="modal-backdrop animate-fade-in">
      <div class="modal-card card card-glass" style="max-width: 820px;">
        <div class="modal-header">
          <h3>🤝 Nuevo Acuerdo de Pago & Refinanciación</h3>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Estudiante en Mora *</label>
              <app-searchable-select
                [options]="estudiantesMoraSelectOptions"
                [(ngModel)]="form.estudianteId"
                placeholder="🔍 Buscar estudiante por nombre, grado o documento..."
                searchPlaceholder="Escriba para filtrar en tiempo real..."
              ></app-searchable-select>
            </div>

            <div class="form-group">
              <label class="form-label">Monto Total de Deuda a Refinanciar ($ COP) *</label>
              <input type="number" class="form-control" [(ngModel)]="form.montoTotalAcordado" />
            </div>

            <div class="form-group">
              <label class="form-label">Número de Cuotas *</label>
              <select class="form-select" [(ngModel)]="form.numeroCuotas">
                <option [value]="2">2 cuotas mensuales</option>
                <option [value]="3">3 cuotas mensuales</option>
                <option [value]="4">4 cuotas mensuales</option>
                <option [value]="6">6 cuotas mensuales</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Día de Pago Mensual (1-30) *</label>
              <input type="number" class="form-control" [(ngModel)]="form.diaPagoMensual" min="1" max="30" />
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Compromiso / Observaciones</label>
              <input type="text" class="form-control" [(ngModel)]="form.observaciones" placeholder="Ej: Acudiente abonará en quincenas" />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="guardar()" class="btn btn-primary" [disabled]="isSaving">
            💾 {{ isSaving ? 'Guardando...' : 'Firmar Acuerdo & Reestructurar Cartera' }}
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalNuevoAcuerdoComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  @Input() listaEstudiantes: any[] = [];
  @Input() estudiantesMoraSelectOptions: SearchableOption[] = [];
  @Input() form = {
    estudianteId: '',
    montoTotalAcordado: 900000,
    numeroCuotas: 3,
    diaPagoMensual: 15,
    observaciones: 'Acuerdo de pago para refinanciación de cartera morosa.',
  };

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  isSaving = false;

  cerrarModal() {
    this.close.emit();
  }

  guardar() {
    const est = this.listaEstudiantes.find((e) => e.id === this.form.estudianteId);
    if (!est) return;

    this.isSaving = true;

    // Llamada API
    this.api.post('tesoreria/acuerdos-pago', {
      matriculaId: 'm1111111-1111-4111-8111-000000000001', // mock de matricula
      montoTotalAcordado: this.form.montoTotalAcordado,
      numeroCuotas: this.form.numeroCuotas,
      diaPagoMensual: this.form.diaPagoMensual,
      observaciones: this.form.observaciones,
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.success.emit({ dto: this.form, est });
      },
      error: () => {
        // En frontend simulado
        this.isSaving = false;
        this.success.emit({ dto: this.form, est });
      }
    });
  }
}
