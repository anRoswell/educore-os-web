import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalManagerService } from '../../core/services/modal-manager.service';

export interface PredefinedTemplate {
  label: string;
  badge?: string;
  text: string;
}

export interface InstitutionalResponseData {
  responseText: string;
  state: string;
  notifyEmail: boolean;
  notes?: string;
}

@Component({
  selector: 'app-institutional-response-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div
        class="modal-backdrop animate-fade-in"
        [style.z-index]="modalManager.getZIndex(modalId || 'institutionalResponse')"
        (click)="onCancel()"
      >
        <div class="modal-card card card-glass modal-wide" (click)="$event.stopPropagation()">
          <!-- HEADER -->
          <div class="modal-header">
            <div class="header-content">
              <div class="badge-row">
                <span class="category-badge" [ngClass]="badgeClass">
                  <span>{{ badgeIcon }}</span> {{ badge }}
                </span>
                @if (headerTag) {
                  <span class="tag-badge">{{ headerTag }}</span>
                }
              </div>
              <h3>{{ title }}</h3>
              <p class="modal-subtitle">{{ subtitle }}</p>
            </div>
            <button (click)="onCancel()" class="close-btn" title="Cerrar modal">&times;</button>
          </div>

          <!-- BODY -->
          <div class="modal-body">
            <!-- TARJETA DE CONTEXTO / INFORMACIÓN DEL SOLICITANTE -->
            @if (targetEntityName) {
              <div class="context-card">
                <div class="context-icon">👤</div>
                <div class="context-info">
                  <span class="context-label">{{ targetEntityLabel || 'Interesado / Solicitante' }}</span>
                  <h4 class="context-name">{{ targetEntityName }}</h4>
                  @if (targetEntitySub) {
                    <p class="context-sub">{{ targetEntitySub }}</p>
                  }
                  @if (recipientEmail) {
                    <span class="email-chip">✉️ Notificación a: {{ recipientEmail }}</span>
                  }
                </div>
              </div>
            }

            <!-- PLANTILLAS RÁPIDAS DE RESPUESTA INSTITUCIONAL -->
            @if (templates && templates.length > 0) {
              <div class="templates-section">
                <span class="section-hint-label">⚡ Plantillas Institucionales Predefinidas:</span>
                <div class="templates-chips">
                  @for (t of templates; track t.label) {
                    <button
                      type="button"
                      class="template-pill"
                      (click)="aplicarPlantilla(t)"
                      title="Haga clic para insertar este texto en la respuesta"
                    >
                      <span>{{ t.badge || '📝' }}</span> {{ t.label }}
                    </button>
                  }
                </div>
              </div>
            }

            <!-- CAMPO DE RESPUESTA PRINCIPAL -->
            <div class="form-group mt-3">
              <div class="flex-between">
                <label class="form-label font-bold">{{ textLabel }}</label>
                <span class="char-counter" [class.text-warning]="responseText.length > 500">
                  {{ responseText.length }} caracteres
                </span>
              </div>
              <textarea
                class="form-control response-textarea"
                rows="6"
                [placeholder]="textPlaceholder"
                [(ngModel)]="responseText"
              ></textarea>
            </div>

            <!-- FILA DE ESTADO Y NOTIFICACIONES -->
            <div class="meta-form-row mt-3">
              @if (states && states.length > 0) {
                <div class="form-group-half">
                  <label class="form-label font-bold">Estado Final del Trámite *</label>
                  <select class="form-select" [(ngModel)]="selectedState">
                    @for (st of states; track st) {
                      <option [value]="st">{{ formatState(st) }}</option>
                    }
                  </select>
                </div>
              }

              @if (showNotifyEmail) {
                <div class="notify-toggle-box">
                  <label class="toggle-label" for="notifyCheck">
                    <input type="checkbox" id="notifyCheck" [(ngModel)]="notifyEmail" />
                    <div>
                      <strong>Enviar Notificación Formal por Correo</strong>
                      <span class="text-xs text-muted block">Se enviará copia digital del acto administrativo firmado al acudiente.</span>
                    </div>
                  </label>
                </div>
              }
            </div>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onCancel()" [disabled]="isSaving">
              Cancelar
            </button>
            <button
              type="button"
              class="btn shadow-glow"
              [ngClass]="confirmButtonClass || 'btn-primary'"
              (click)="onConfirm()"
              [disabled]="isSaving || !responseText.trim()"
            >
              <span>{{ isSaving ? 'Guardando y Emitiendo...' : confirmButtonText }}</span>
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

    .modal-wide {
      width: 100%;
      max-width: 720px;
      max-height: 92vh;
      overflow-y: auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
      border-radius: 16px 16px 0 0;
    }

    .header-content h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0.35rem 0 0.15rem 0;
    }

    .badge-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .category-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      background: rgba(2, 132, 199, 0.12);
      color: #0284c7;
      border: 1px solid rgba(2, 132, 199, 0.25);
    }

    .tag-badge {
      font-size: 0.7rem;
      font-weight: 600;
      background: #e2e8f0;
      color: #475569;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }

    .modal-subtitle {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
      padding: 0.25rem;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #0f172a;
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .context-card {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
    }

    .context-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #e0f2fe;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .context-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .context-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0.1rem 0;
    }

    .context-sub {
      font-size: 0.8rem;
      color: #475569;
      margin: 0 0 0.4rem 0;
    }

    .email-chip {
      display: inline-block;
      font-size: 0.75rem;
      color: #0369a1;
      background: #e0f2fe;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .templates-section {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .section-hint-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
    }

    .templates-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .template-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      padding: 0.3rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s;
    }

    .template-pill:hover {
      background: #e0f2fe;
      border-color: #7dd3fc;
      color: #0369a1;
    }

    .response-textarea {
      width: 100%;
      font-size: 0.875rem;
      line-height: 1.5;
      padding: 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-family: inherit;
      resize: vertical;
      min-height: 140px;
    }

    .response-textarea:focus {
      outline: none;
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }

    .char-counter {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .meta-form-row {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .form-group-half {
      flex: 1;
      min-width: 200px;
    }

    .notify-toggle-box {
      flex: 1.5;
      min-width: 260px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
    }

    .toggle-label {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      cursor: pointer;
      font-size: 0.85rem;
    }

    .toggle-label input[type="checkbox"] {
      margin-top: 0.2rem;
      width: 17px;
      height: 17px;
      accent-color: #0284c7;
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

    .shadow-glow {
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
    }
  `],
})
export class InstitutionalResponseModalComponent {
  readonly modalManager = inject(ModalManagerService);

  @Input() modalId: string = 'institutionalResponse';
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Emitir Respuesta Institucional Oficial';
  @Input() subtitle: string = 'Acto administrativo formal de notificación y cierre de solicitud.';
  @Input() badge: string = 'RESPUESTA OFICIAL';
  @Input() badgeIcon: string = '⚖️';
  @Input() badgeClass: string = '';
  @Input() headerTag?: string;

  @Input() targetEntityLabel?: string = 'Solicitante / Acudiente';
  @Input() targetEntityName?: string;
  @Input() targetEntitySub?: string;
  @Input() recipientEmail?: string;

  @Input() textLabel: string = 'Contenido Formal de la Respuesta / Concepto Institucional *';
  @Input() textPlaceholder: string = 'Redacte la respuesta oficial del colegio dirigida al solicitante...';
  @Input() responseText: string = '';

  @Input() templates: PredefinedTemplate[] = [];
  @Input() states: string[] = ['RESPONDIDO', 'EN_TRAMITE', 'CERRADO'];
  @Input() selectedState: string = 'RESPONDIDO';

  @Input() showNotifyEmail: boolean = true;
  @Input() notifyEmail: boolean = true;

  @Input() isSaving: boolean = false;
  @Input() confirmButtonText: string = '⚖️ Emitir Respuesta Institucional';
  @Input() confirmButtonClass: string = 'btn-primary';

  @Output() confirm = new EventEmitter<InstitutionalResponseData>();
  @Output() cancel = new EventEmitter<void>();

  aplicarPlantilla(t: PredefinedTemplate): void {
    this.responseText = t.text;
  }

  formatState(st: string): string {
    switch (st) {
      case 'RESPONDIDO':
        return '✅ RESPONDIDO (Cierre formal con notificación)';
      case 'EN_TRAMITE':
        return '⚙️ EN TRÁMITE (Requiere mayor análisis)';
      case 'CERRADO':
        return '🔒 CERRADO (Trámite concluido)';
      case 'RECHAZADO':
        return '❌ RECHAZADO (No procedente según ley)';
      default:
        return st;
    }
  }

  onConfirm(): void {
    if (!this.responseText.trim()) return;
    this.confirm.emit({
      responseText: this.responseText,
      state: this.selectedState,
      notifyEmail: this.notifyEmail,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
