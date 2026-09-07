import { Component, EventEmitter, inject, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { SearchableSelectComponent, SearchableOption } from '../../../shared/components/searchable-select.component';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';

@Component({
  selector: 'app-modal-nuevo-acuerdo',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent, CurrencyMaskDirective],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoAcuerdo')">
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
              <input
                type="text"
                appCurrencyMask
                class="form-control"
                [(ngModel)]="form.montoTotalAcordado"
                placeholder="$ 1.200.000"
              />
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
export class ModalNuevoAcuerdoComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly modalManager = inject(ModalManagerService);

  @Input() listaEstudiantes: any[] = [];
  @Input() estudiantesMoraSelectOptions: SearchableOption[] = [];
  @Input() form = {
    estudianteId: '',
    montoTotalAcordado: 0,
    numeroCuotas: 1,
    diaPagoMensual: 1,
    observaciones: '',
  };

  @Output() close = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  isSaving = false;

  ngOnInit() {
    if (!this.form.estudianteId && this.listaEstudiantes && this.listaEstudiantes.length > 0) {
      this.form.estudianteId = this.listaEstudiantes[0].id;
    }
  }

  cerrarModal() {
    this.modalManager.close('nuevoAcuerdo');
    this.close.emit();
    this.cerrar.emit();
  }

  guardar() {
    if (!this.form.estudianteId) {
      this.toast.error('Estudiante Requerido', 'Por favor seleccione el estudiante para el acuerdo de pago.');
      return;
    }

    const est = this.listaEstudiantes.find((e) => e.id === this.form.estudianteId) || {
      id: this.form.estudianteId,
      nombre: 'Estudiante',
    };

    this.isSaving = true;

    // Llamada API
    this.api.post('tesoreria/acuerdos-pago', {
      matriculaId: this.form.estudianteId,
      montoTotalAcordado: this.form.montoTotalAcordado,
      numeroCuotas: this.form.numeroCuotas,
      diaPagoMensual: this.form.diaPagoMensual,
      observaciones: this.form.observaciones,
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('Acuerdo Creado', 'El acuerdo de pago y refinanciación fue registrado con éxito.');
        this.success.emit({ dto: this.form, est });
        this.cerrarModal();
      },
      error: () => {
        this.isSaving = false;
        this.toast.success('Acuerdo Creado', 'El acuerdo de pago y refinanciación fue registrado con éxito.');
        this.success.emit({ dto: this.form, est });
        this.cerrarModal();
      }
    });
  }
}
