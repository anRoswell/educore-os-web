import { Component, Input, Output, EventEmitter, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';
import { SearchableSelectComponent, SearchableOption } from './searchable-select.component';

export enum TipoDerechoArcoUi {
  RECTIFICACION = 'RECTIFICACION',
  ACCESO = 'ACCESO',
  CANCELACION = 'CANCELACION',
  OPOSICION = 'OPOSICION',
  REVOCATORIA_IMAGEN = 'REVOCATORIA_IMAGEN',
}

export interface SolicitudArcoPayload {
  matriculaId: string;
  estudianteId?: string;
  solicitanteNombre: string;
  solicitanteDocumento: string;
  solicitanteEmail: string;
  solicitanteTelefono?: string;
  tipoDerecho: TipoDerechoArcoUi | string;
  descripcionSolicitud: string;
}

@Component({
  selector: 'app-modal-solicitud-arco',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  template: `
    @if (isOpen) {
      <div
        class="modal-backdrop animate-fade-in"
        [style.z-index]="modalManager.getZIndex(modalId || 'modalSolicitudArco')"
        (click)="cerrar()"
      >
        <div class="modal-card card card-glass modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="modal-subtitle">LEY 1581 DE 2012 — DERECHOS ARCO</span>
              <h3>⚖️ Radicar Solicitud Oficial de Derechos ARCO</h3>
            </div>
            <button (click)="cerrar()" class="close-btn" [disabled]="isSaving()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="modal-form-grid">
              <!-- Selector de Estudiante Matriculado con Buscador Inteligente -->
              <div class="form-group col-span-2">
                <label class="form-label">Seleccionar Estudiante Matriculado *</label>
                <app-searchable-select
                  [options]="estudiantesOptions()"
                  [(ngModel)]="form.matriculaId"
                  (selectionChange)="onEstudianteSeleccionado($event)"
                  placeholder="Buscar estudiante por apellido, nombre o documento..."
                  searchPlaceholder="Escriba el nombre o documento del estudiante..."
                ></app-searchable-select>
              </div>

              <div class="form-group">
                <label class="form-label">Nombre del Solicitante / Acudiente *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="form.solicitanteNombre"
                  placeholder="Nombre completo del representante legal"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Documento de Identidad *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="form.solicitanteDocumento"
                  placeholder="Cédula de ciudadanía o extranjería"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Correo Electrónico de Notificación *</label>
                <input
                  type="email"
                  class="form-control"
                  [(ngModel)]="form.solicitanteEmail"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Teléfono de Contacto</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="form.solicitanteTelefono"
                  placeholder="310 000 0000"
                />
              </div>

              <div class="form-group col-span-2">
                <label class="form-label">Tipo de Derecho ARCO *</label>
                <select class="form-select" [(ngModel)]="form.tipoDerecho">
                  <option [value]="TipoDerechoArcoUi.RECTIFICACION">
                    Rectificación / Actualización de Datos
                  </option>
                  <option [value]="TipoDerechoArcoUi.ACCESO">
                    Acceso / Consulta de Información
                  </option>
                  <option [value]="TipoDerechoArcoUi.CANCELACION">
                    Cancelación / Supresión de Datos
                  </option>
                  <option [value]="TipoDerechoArcoUi.OPOSICION">
                    Oposición al Tratamiento
                  </option>
                  <option [value]="TipoDerechoArcoUi.REVOCATORIA_IMAGEN">
                    Revocatoria de Uso de Imagen / Fotos
                  </option>
                </select>
              </div>

              <div class="form-group col-span-2">
                <label class="form-label">Descripción y Fundamento de la Solicitud *</label>
                <textarea
                  class="form-control"
                  rows="3"
                  [(ngModel)]="form.descripcionSolicitud"
                  placeholder="Explique detalladamente la rectificación, revocatoria o consulta requerida..."
                ></textarea>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button (click)="cerrar()" class="btn btn-secondary" [disabled]="isSaving()">
              Cancelar
            </button>
            <button
              (click)="guardar()"
              class="btn btn-primary shadow-glow"
              [disabled]="isSaving() || !form.solicitanteNombre.trim() || !form.descripcionSolicitud.trim()"
            >
              <span>{{ isSaving() ? 'Radicando...' : '⚖️ Radicar Petición ARCO' }}</span>
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
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      padding: 1.5rem 1.75rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-subtitle {
      font-size: 0.72rem;
      font-weight: 700;
      color: #6366f1;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
      display: block;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    .close-btn {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #64748b;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .close-btn:hover:not(:disabled) {
      background: #fee2e2;
      border-color: #fecaca;
      color: #ef4444;
    }

    .modal-body {
      padding: 1.75rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .col-span-2 {
      grid-column: span 2;
    }

    @media (max-width: 640px) {
      .modal-form-grid {
        grid-template-columns: 1fr;
      }
      .col-span-2 {
        grid-column: span 1;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-label {
      font-size: 0.825rem;
      font-weight: 600;
      color: #334155;
    }

    .form-control,
    .form-select {
      width: 100%;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0.625rem;
      padding: 0.65rem 0.9rem;
      color: #0f172a;
      font-size: 0.875rem;
      outline: none;
      box-sizing: border-box;
      transition: all 0.15s ease;
    }

    .form-control:focus,
    .form-select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .modal-footer {
      padding: 1.25rem 1.75rem;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 0.625rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e2e8f0;
      color: #0f172a;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
      transform: translateY(-1px);
    }

    @keyframes scaleUp {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `],
})
export class ModalSolicitudArcoComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  modalManager = inject(ModalManagerService);

  readonly TipoDerechoArcoUi = TipoDerechoArcoUi;

  @Input() isOpen = false;
  @Input() modalId = 'modalSolicitudArco';
  @Input() estudiantesMatriculados: any[] = [];
  @Input() iniciarEnDocumental = false;
  @Input() flujoIdDocumental?: string;

  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  isSaving = signal<boolean>(false);
  internalEstudiantesList = signal<any[]>([]);

  form: SolicitudArcoPayload = {
    matriculaId: '',
    solicitanteNombre: '',
    solicitanteDocumento: '',
    solicitanteEmail: '',
    solicitanteTelefono: '',
    tipoDerecho: TipoDerechoArcoUi.RECTIFICACION,
    descripcionSolicitud: '',
  };

  readonly estudiantesOptions = computed<SearchableOption[]>(() => {
    const list = this.estudiantesMatriculados.length > 0 ? this.estudiantesMatriculados : this.internalEstudiantesList();
    return list.map((e) => ({
      value: e.matricula_id,
      label: `${e.primer_apellido} ${e.segundo_apellido || ''} ${e.primer_nombre} ${e.segundo_nombre || ''}`.trim(),
      sublabel: `Doc. ${e.numero_documento} • Grado: ${e.grado_nombre || '10°'} (${e.grupo_nombre || '10-A'})`,
      badge: e.grupo_nombre || '10-A',
      badgeClass: 'badge-primary',
      avatarText: `${e.primer_nombre?.charAt(0) || 'E'}${e.primer_apellido?.charAt(0) || 'S'}`.toUpperCase(),
    }));
  });

  ngOnInit(): void {
    if (!this.estudiantesMatriculados || this.estudiantesMatriculados.length === 0) {
      this.cargarEstudiantesMatriculados();
    }
  }

  cargarEstudiantesMatriculados(): void {
    this.api.get<any[]>('convivencia/estudiantes-matriculados').subscribe({
      next: (res) => {
        if (res && Array.isArray(res)) {
          this.internalEstudiantesList.set(res);
        }
      },
      error: () => this.internalEstudiantesList.set([]),
    });
  }

  onEstudianteSeleccionado(matriculaId: string): void {
    const list = this.estudiantesMatriculados.length > 0 ? this.estudiantesMatriculados : this.internalEstudiantesList();
    const est = list.find((e) => e.matricula_id === matriculaId);
    if (est) {
      this.form.estudianteId = est.estudiante_id || est.id;
      this.form.solicitanteNombre = est.acudiente_nombre || '';
      this.form.solicitanteDocumento = est.acudiente_documento || '';
      this.form.solicitanteEmail = est.acudiente_email || '';
      this.form.solicitanteTelefono = est.acudiente_telefono || est.telefono_emergencia || '';
    }
  }

  cerrar(): void {
    this.modalManager.close(this.modalId);
    this.cancel.emit();
  }

  guardar(): void {
    if (!this.form.solicitanteNombre.trim() || !this.form.descripcionSolicitud.trim()) {
      this.toast.warning('Campos Requeridos', 'Por favor complete el nombre del solicitante y la descripción.');
      return;
    }

    this.isSaving.set(true);

    this.api.post<any>('habeas-data/solicitudes-arco', this.form).subscribe({
      next: (res) => {
        // Si fue invocado desde el módulo Documental y tenemos flujoIdDocumental, vinculamos o iniciamos la instancia BPM
        if (this.iniciarEnDocumental && this.flujoIdDocumental) {
          const bpmDto = {
            flujoId: this.flujoIdDocumental,
            datosFormulario: {
              ...this.form,
              radicado_numero: res.radicadoNumero,
            },
          };
          this.api.post<any>('documental/instancias/iniciar', bpmDto).subscribe({
            next: (bpmRes) => {
              this.isSaving.set(false);
              this.toast.success(
                '¡Trámite ARCO Radicado!',
                `Radicado N° ${res.radicadoNumero} e Instancia BPM ${bpmRes.consecutivoRadicado} generada.`
              );
              this.saved.emit({ arco: res, bpm: bpmRes });
              this.cerrar();
            },
            error: () => {
              this.isSaving.set(false);
              this.toast.success(
                '¡Solicitud ARCO Radicada!',
                `Radicado N° ${res.radicadoNumero}. Término legal: 15 días hábiles.`
              );
              this.saved.emit({ arco: res });
              this.cerrar();
            },
          });
        } else {
          this.isSaving.set(false);
          this.toast.success(
            '¡Solicitud ARCO Radicada!',
            `Radicado N° ${res.radicadoNumero}. Término legal: 15 días hábiles.`
          );
          this.saved.emit({ arco: res });
          this.cerrar();
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error('Error al radicar', err?.error?.message || 'No se pudo registrar la solicitud ARCO.');
      },
    });
  }
}
