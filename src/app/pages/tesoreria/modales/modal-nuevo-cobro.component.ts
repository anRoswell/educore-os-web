import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { SearchableSelectComponent, SearchableOption } from '../../../shared/components/searchable-select.component';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';

@Component({
  selector: 'app-modal-nuevo-cobro',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent, CurrencyMaskDirective],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoCobro')">
      <div class="modal-card card card-glass" style="max-width: 820px;">
        <div class="modal-header">
          <h3>➕ Emitir Cobro Individual / Extraordinario</h3>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Estudiante *</label>
              @if (opcionesEstudiantes.length > 0) {
                <app-searchable-select
                  [options]="opcionesEstudiantes"
                  [ngModel]="selectedEstudianteId"
                  (ngModelChange)="onEstudianteSelect($event)"
                  placeholder="🔍 Buscar estudiante por nombre, grado o documento..."
                  searchPlaceholder="Escriba para filtrar en tiempo real..."
                ></app-searchable-select>
              } @else {
                <input type="text" class="form-control" [(ngModel)]="form.estudianteNombre" placeholder="Nombre completo del estudiante" />
              }
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
              <input
                type="text"
                appCurrencyMask
                class="form-control"
                [(ngModel)]="form.valorTotal"
                placeholder="$ 450.000"
              />
            </div>

            <div class="form-group" style="grid-column: span 2;">
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

  @Input() listaEstudiantes: any[] = [];
  @Input() estudiantesSelectOptions: SearchableOption[] = [];
  @Input() conceptosList: any[] = [];
  @Input() form: any = {
    estudianteNombre: '',
    estudianteId: '',
    concepto: '',
    valorTotal: 0,
    fechaVencimiento: '',
  };

  selectedEstudianteId = '';

  get opcionesEstudiantes(): SearchableOption[] {
    if (this.estudiantesSelectOptions && this.estudiantesSelectOptions.length > 0) {
      return this.estudiantesSelectOptions;
    }
    return (this.listaEstudiantes || []).map((est) => ({
      value: est.id,
      label: est.nombre,
      sublabel: `Doc. ${est.documento || 'S/D'} • Grado: ${est.grado || ''} (${est.grupo || 'A'})`,
      badge: est.grado || 'Matriculado',
      badgeClass: 'badge-secondary',
      avatarText: est.nombre?.substring(0, 2)?.toUpperCase() || 'ES',
    }));
  }

  @Output() close = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();
  @Output() nuevoConcepto = new EventEmitter<void>();

  isSaving = false;

  onEstudianteSelect(id: string) {
    this.selectedEstudianteId = id;
    this.form.estudianteId = id;
    const found = (this.listaEstudiantes || []).find((e) => e.id === id);
    if (found) {
      this.form.estudianteNombre = found.nombre;
    }
  }

  onConceptoSelect(nombre: string) {
    const found = this.conceptosList.find((c) => c.nombre === nombre);
    if (found && found.valorSugerido) {
      this.form.valorTotal = Number(found.valorSugerido);
    }
  }

  cerrarModal() {
    this.modalManager.close('nuevoCobro');
    this.close.emit();
    this.cerrar.emit();
  }

  guardar() {
    if (!this.form.estudianteNombre && !this.selectedEstudianteId) {
      this.toast.error('Campo Requerido', 'Por favor seleccione o indique el nombre del estudiante.');
      return;
    }

    this.isSaving = true;
    setTimeout(() => {
      this.toast.success('Cobro Emitido', `Se ha generado la cuenta de cobro para ${this.form.estudianteNombre} exitosamente.`);
      this.isSaving = false;
      this.success.emit(this.form);
      this.cerrarModal();
    }, 400);
  }
}
