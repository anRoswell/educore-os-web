import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalManagerService } from '../../core/services/modal-manager.service';

export interface RevocationData {
  reason: string;
  revocarUsoImagen: boolean;
  revocarGrabacionClases: boolean;
  revocarPlataformas: boolean;
}

@Component({
  selector: 'app-revocation-prompt-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div
        class="modal-backdrop animate-fade-in"
        [style.z-index]="modalManager.getZIndex(modalId || 'revocationPrompt')"
        (click)="onCancel()"
      >
        <div class="modal-card card card-glass" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="category-badge badge-danger">
                <span>🚫</span> REVOCATORIA DE HABEAS DATA
              </span>
              <h3>Revocar o Limitar Autorizaciones</h3>
              <p class="modal-subtitle">Actualización de restricciones de tratamiento de datos personales de menores.</p>
            </div>
            <button (click)="onCancel()" class="close-btn">&times;</button>
          </div>

          <div class="modal-body">
            @if (studentName) {
              <div class="student-info-box">
                <strong>Estudiante:</strong> {{ studentName }} (Doc. {{ studentDoc }})
                <div class="text-xs text-muted">Acudiente: {{ parentName }}</div>
              </div>
            }

            <div class="form-group mt-2">
              <label class="form-label font-bold">Seleccionar Autorizaciones a Revocar *</label>
              <div class="revocation-checkboxes">
                <label class="check-item">
                  <input type="checkbox" [(ngModel)]="revocarUsoImagen" />
                  <div>
                    <strong>Revocar Uso de Imagen, Fotografía y Carnet</strong>
                    <span class="text-xs text-muted block">No se publicarán fotos en redes, anuario ni página web.</span>
                  </div>
                </label>

                <label class="check-item">
                  <input type="checkbox" [(ngModel)]="revocarGrabacionClases" />
                  <div>
                    <strong>Revocar Grabación de Clases Pedagógicas</strong>
                    <span class="text-xs text-muted block">Restricción para grabaciones de sesiones virtuales.</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="form-group mt-3">
              <label class="form-label font-bold">Motivo / Fundamento de la Revocatoria *</label>
              <textarea
                class="form-control"
                rows="3"
                placeholder="Indique la justificación formal del acudiente o el documento de soporte..."
                [(ngModel)]="reason"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onCancel()" [disabled]="isSaving">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-danger shadow-glow"
              (click)="onConfirm()"
              [disabled]="isSaving || !reason.trim()"
            >
              <span>{{ isSaving ? 'Revocando...' : '🚫 Confirmar Revocatoria' }}</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-card {
      width: 100%;
      max-width: 600px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      background: #fff1f2;
      border-radius: 16px 16px 0 0;
    }

    .category-badge.badge-danger {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 0.25rem;
    }

    .modal-header h3 {
      font-size: 1.15rem;
      color: #0f172a;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .student-info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
    }

    .revocation-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .check-item {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .check-item input[type="checkbox"] {
      margin-top: 0.2rem;
      width: 17px;
      height: 17px;
      accent-color: #dc2626;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
      border-radius: 0 0 16px 16px;
    }

    .btn-danger {
      background: #dc2626;
      color: #ffffff;
      border: none;
      font-weight: 600;
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }
  `],
})
export class RevocationPromptModalComponent {
  readonly modalManager = inject(ModalManagerService);

  @Input() modalId: string = 'revocationPrompt';
  @Input() isOpen: boolean = false;
  @Input() studentName: string = '';
  @Input() studentDoc: string = '';
  @Input() parentName: string = '';

  @Input() reason: string = 'El acudiente solicita no publicar fotos del menor en redes sociales ni página web pública.';
  @Input() revocarUsoImagen: boolean = true;
  @Input() revocarGrabacionClases: boolean = true;
  @Input() revocarPlataformas: boolean = false;
  @Input() isSaving: boolean = false;

  @Output() confirm = new EventEmitter<RevocationData>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    if (!this.reason.trim()) return;
    this.confirm.emit({
      reason: this.reason,
      revocarUsoImagen: this.revocarUsoImagen,
      revocarGrabacionClases: this.revocarGrabacionClases,
      revocarPlataformas: this.revocarPlataformas,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
