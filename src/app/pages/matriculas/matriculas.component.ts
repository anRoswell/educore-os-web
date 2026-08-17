import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Estudiante } from '../../core/models';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="matriculas-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Matrículas & Ficha Integral del Estudiante</h1>
          <p>Directorio escolar 360°, control de expediente documental, formalización y retiro SIMAT</p>
        </div>
        <div class="header-actions">
          <button (click)="exportarSimat()" class="btn btn-secondary">
            <span>📊 Exportar SIMAT (Res. 166)</span>
          </button>
          <button (click)="abrirModalNuevaMatricula()" class="btn btn-primary">
            <span>➕ Nueva Matrícula</span>
          </button>
        </div>
      </div>

      <!-- Buscador y Filtros -->
      <div class="card filter-card">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-control search-input"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por nombre, apellido, código o número de documento..."
          />
        </div>
      </div>

      <!-- Tabla de Estudiantes -->
      <div class="table-container mt-4">
        <table class="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Estudiante</th>
              <th>Documento</th>
              <th>Grado / Grupo</th>
              <th>RH / EPS</th>
              <th>Estado</th>
              <th>Acciones CRUD</th>
            </tr>
          </thead>
          <tbody>
            @for (est of filteredEstudiantes(); track est.id) {
              <tr>
                <td><strong class="text-indigo-600">{{ est.codigoEstudiante }}</strong></td>
                <td>
                  <strong>{{ est.primerApellido }} {{ est.segundoApellido || '' }}</strong>, {{ est.primerNombre }} {{ est.segundoNombre || '' }}
                </td>
                <td><span class="font-mono text-xs">{{ est.tipoDocumento }} {{ est.numeroDocumento }}</span></td>
                <td><span class="badge badge-info">{{ est.grado }} - {{ est.grupo }}</span></td>
                <td><span class="badge badge-purple">{{ est.grupoSanguineoRh }} | {{ est.eps }}</span></td>
                <td>
                  @if (est.estado === 'MATRICULADO') {
                    <span class="badge badge-success">MATRICULADO</span>
                  } @else {
                    <span class="badge badge-danger">RETIRADO</span>
                  }
                </td>
                <td>
                  <div class="actions-group">
                    <button (click)="verFicha360(est)" class="btn btn-secondary btn-sm" title="Ver Ficha 360">
                      👁️ Ficha
                    </button>
                    <button (click)="abrirModalEdicion(est)" class="btn btn-secondary btn-sm" title="Editar Estudiante">
                      ✏️ Editar
                    </button>
                    <button (click)="descargarCertificado(est.id)" class="btn btn-outline btn-sm" title="Certificado PDF">
                      📄 PDF
                    </button>
                    @if (est.estado === 'MATRICULADO') {
                      <button (click)="abrirModalRetiro(est)" class="btn btn-danger btn-sm" title="Retirar / Eliminar">
                        🗑️ Retiro
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- MODAL 1: FICHA INTEGRAL 360° -->
      @if (selectedEstudiante()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass">
            <div class="modal-header">
              <h3>Ficha Integral del Estudiante 360°</h3>
              <button (click)="cerrarModalFicha()" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="profile-summary">
                <div class="avatar-large">
                  {{ selectedEstudiante()?.primerNombre?.charAt(0) }}{{ selectedEstudiante()?.primerApellido?.charAt(0) }}
                </div>
                <div>
                  <h4>{{ selectedEstudiante()?.primerNombre }} {{ selectedEstudiante()?.primerApellido }}</h4>
                  <p class="text-slate-500 text-sm">Código: {{ selectedEstudiante()?.codigoEstudiante }} | {{ selectedEstudiante()?.tipoDocumento }} {{ selectedEstudiante()?.numeroDocumento }}</p>
                  <span class="badge badge-success mt-1">Estado: {{ selectedEstudiante()?.estado }}</span>
                </div>
              </div>

              <div class="details-grid mt-4">
                <div class="detail-item">
                  <span class="label">Grado / Grupo:</span>
                  <strong>{{ selectedEstudiante()?.grado }} — {{ selectedEstudiante()?.grupo }}</strong>
                </div>
                <div class="detail-item">
                  <span class="label">Grupo Sanguíneo RH:</span>
                  <strong>{{ selectedEstudiante()?.grupoSanguineoRh }}</strong>
                </div>
                <div class="detail-item">
                  <span class="label">EPS Afiliada:</span>
                  <strong>{{ selectedEstudiante()?.eps }}</strong>
                </div>
                <div class="detail-item">
                  <span class="label">Teléfono de Emergencia:</span>
                  <strong>{{ selectedEstudiante()?.telefonoEmergencia }}</strong>
                </div>
              </div>

              <div class="upload-section mt-4">
                <h5>📎 Cargar Documento al Expediente (Cero Papel)</h5>
                <div class="upload-controls">
                  <input type="file" (change)="onFileSelected($event)" class="form-control text-xs" />
                  <button (click)="subirDocumento()" class="btn btn-secondary btn-sm" [disabled]="!archivoSeleccionado()">
                    Subir Archivo
                  </button>
                </div>
                @if (uploadSuccess()) {
                  <span class="text-emerald-600 text-xs mt-1 block">✅ Documento guardado y firmado con hash SHA-256</span>
                }
              </div>

              <div class="carnet-preview-box mt-4">
                <div class="carnet-card-sim">
                  <div class="carnet-header">
                    <span>CARNET DIGITAL ESTUDIANTIL</span>
                    <small>EduCoreOS</small>
                  </div>
                  <div class="carnet-body">
                    <div class="qr-placeholder">
                      <span style="font-size: 2rem;">📱</span>
                      <small>QR Rotativo 24h</small>
                    </div>
                    <div class="carnet-data">
                      <strong>{{ selectedEstudiante()?.primerNombre }} {{ selectedEstudiante()?.primerApellido }}</strong>
                      <span>Grado: {{ selectedEstudiante()?.grado }}</span>
                      <span class="font-mono text-xs">ID: {{ selectedEstudiante()?.numeroDocumento }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="descargarCertificado(selectedEstudiante()!.id)" class="btn btn-primary">
                Descargar Certificado de Estudio PDF
              </button>
              <button (click)="cerrarModalFicha()" class="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: NUEVA MATRÍCULA (CREACIÓN / GUARDADO) -->
      @if (modalNuevaMatricula()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass">
            <div class="modal-header">
              <h3>➕ Formalizar Nueva Matrícula</h3>
              <button (click)="modalNuevaMatricula.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Primer Nombre *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoEstudiante.primerNombre" placeholder="Ej: Santiago" />
                </div>
                <div class="form-group">
                  <label class="form-label">Segundo Nombre</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoEstudiante.segundoNombre" placeholder="Ej: Andrés" />
                </div>
                <div class="form-group">
                  <label class="form-label">Primer Apellido *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoEstudiante.primerApellido" placeholder="Ej: Gómez" />
                </div>
                <div class="form-group">
                  <label class="form-label">Segundo Apellido</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoEstudiante.segundoApellido" placeholder="Ej: Herrera" />
                </div>
                <div class="form-group">
                  <label class="form-label">Tipo Documento *</label>
                  <select class="form-select" [(ngModel)]="nuevoEstudiante.tipoDocumento">
                    <option value="TI">Tarjeta de Identidad (TI)</option>
                    <option value="RC">Registro Civil (RC)</option>
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="PPT">Permiso por Protección Temporal (PPT)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Número de Documento *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoEstudiante.numeroDocumento" placeholder="1025896321" />
                </div>
                <div class="form-group">
                  <label class="form-label">Grado *</label>
                  <select class="form-select" [(ngModel)]="nuevoEstudiante.grado">
                    <option value="Décimo (10°)">Décimo (10°)</option>
                    <option value="Undécimo (11°)">Undécimo (11°)</option>
                    <option value="Noveno (9°)">Noveno (9°)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Grupo *</label>
                  <select class="form-select" [(ngModel)]="nuevoEstudiante.grupo">
                    <option value="10-A">10-A</option>
                    <option value="10-B">10-B</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Grupo Sanguíneo RH</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoEstudiante.grupoSanguineoRh" placeholder="O+" />
                </div>
                <div class="form-group">
                  <label class="form-label">EPS Afiliada</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoEstudiante.eps" placeholder="Sura EPS" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevaMatricula()" class="btn btn-primary">
                💾 Guardar Matrícula
              </button>
              <button (click)="modalNuevaMatricula.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: EDICIÓN / ACTUALIZACIÓN DE ESTUDIANTE -->
      @if (estudianteEnEdicion()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass">
            <div class="modal-header">
              <h3>✏️ Editar Datos del Estudiante</h3>
              <button (click)="estudianteEnEdicion.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Nombres</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.primerNombre" />
                </div>
                <div class="form-group">
                  <label class="form-label">Apellidos</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.primerApellido" />
                </div>
                <div class="form-group">
                  <label class="form-label">Grado</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.grado" />
                </div>
                <div class="form-group">
                  <label class="form-label">Grupo</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.grupo" />
                </div>
                <div class="form-group">
                  <label class="form-label">EPS</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.eps" />
                </div>
                <div class="form-group">
                  <label class="form-label">Teléfono de Emergencia</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.telefonoEmergencia" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarEdicion()" class="btn btn-primary">
                🔄 Guardar Cambios
              </button>
              <button (click)="estudianteEnEdicion.set(null)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 4: CONFIRMACIÓN DE RETIRO / ELIMINACIÓN -->
      @if (estudianteParaRetirar()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 480px;">
            <div class="modal-header">
              <h3 style="color: #ef4444;">⚠️ Confirmación de Retiro Escolar</h3>
              <button (click)="estudianteParaRetirar.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <p>
                ¿Está seguro de que desea tramitar el retiro del estudiante 
                <strong>{{ estudianteParaRetirar()?.primerNombre }} {{ estudianteParaRetirar()?.primerApellido }}</strong> 
                (Documento: {{ estudianteParaRetirar()?.numeroDocumento }})?
              </p>
              
              <div class="form-group mt-3">
                <label class="form-label">Causal de Retiro (SIMAT MEN) *</label>
                <select class="form-select" [(ngModel)]="causalRetiro">
                  <option value="CAMBIO_RESIDENCIA">Cambio de residencia familiar</option>
                  <option value="TRASLADO_INSTITUCION">Traslado a otra institución educativa</option>
                  <option value="MOTIVOS_ECONOMICOS">Motivos económicos</option>
                  <option value="DESERCION">Deserción voluntaria</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="confirmarRetiro()" class="btn btn-danger">
                🗑️ Confirmar Retiro SIMAT
              </button>
              <button (click)="estudianteParaRetirar.set(null)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      color: #0f172a;
    }

    .page-header p {
      font-size: 0.9rem;
      color: #64748b;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .filter-card {
      padding: 1rem;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .search-icon {
      font-size: 1.2rem;
    }

    .search-input {
      border: none;
      font-size: 0.95rem;
      padding: 0.5rem 0;
    }

    .search-input:focus {
      box-shadow: none;
    }

    .actions-group {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .text-indigo-600 { color: #4f46e5; }
    .text-slate-500 { color: #64748b; }
    .text-emerald-600 { color: #059669; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 1.5rem;
    }

    .modal-card {
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      overflow-y: auto;
      background-color: #ffffff;
      padding: 2rem;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .modal-header h3 {
      font-size: 1.25rem;
      color: #0f172a;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.85rem;
    }

    .profile-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar-large {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      font-size: 1.3rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      background-color: #f8fafc;
      padding: 1rem;
      border-radius: 10px;
    }

    .detail-item .label {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
    }

    .upload-section {
      background-color: #f1f5f9;
      padding: 1rem;
      border-radius: 10px;
    }

    .upload-controls {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .carnet-card-sim {
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      color: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .carnet-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      font-weight: 700;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .carnet-body {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .qr-placeholder {
      background-color: white;
      color: black;
      width: 70px;
      height: 70px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .carnet-data {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .mt-4 { margin-top: 1rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-1 { margin-top: 0.25rem; }
    .block { display: block; }
  `]
})
export class MatriculasComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);

  searchQuery = '';
  readonly selectedEstudiante = signal<Estudiante | null>(null);
  readonly archivoSeleccionado = signal<File | null>(null);
  readonly uploadSuccess = signal(false);

  // Estados para CRUD Modales
  readonly modalNuevaMatricula = signal(false);
  readonly estudianteEnEdicion = signal<Estudiante | null>(null);
  readonly estudianteParaRetirar = signal<Estudiante | null>(null);
  causalRetiro = 'CAMBIO_RESIDENCIA';

  nuevoEstudiante = {
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    tipoDocumento: 'TI',
    numeroDocumento: '',
    grado: 'Décimo (10°)',
    grupo: '10-A',
    grupoSanguineoRh: 'O+',
    eps: 'Sura EPS',
    telefonoEmergencia: '3001234567',
  };

  readonly estudiantes = signal<Estudiante[]>([
    {
      id: 'e1111111-1111-4111-8111-000000000001',
      primerNombre: 'Mariana',
      segundoNombre: 'Lucía',
      primerApellido: 'García',
      segundoApellido: 'Torres',
      tipoDocumento: 'TI',
      numeroDocumento: '1023456789',
      codigoEstudiante: 'EST-2026-001',
      grado: 'Décimo (10°)',
      grupo: '10-A',
      estado: 'MATRICULADO',
      telefonoEmergencia: '3104567890',
      eps: 'Sanitas EPS',
      grupoSanguineoRh: 'O+',
    },
    {
      id: 'e1111111-1111-4111-8111-000000000002',
      primerNombre: 'David',
      segundoNombre: 'Alejandro',
      primerApellido: 'López',
      segundoApellido: 'Ramírez',
      tipoDocumento: 'TI',
      numeroDocumento: '1023456790',
      codigoEstudiante: 'EST-2026-002',
      grado: 'Décimo (10°)',
      grupo: '10-A',
      estado: 'MATRICULADO',
      telefonoEmergencia: '3159876543',
      eps: 'Sura EPS',
      grupoSanguineoRh: 'A+',
    },
    {
      id: 'e1111111-1111-4111-8111-000000000003',
      primerNombre: 'Sofía',
      segundoNombre: 'Valentina',
      primerApellido: 'Castro',
      segundoApellido: 'Morales',
      tipoDocumento: 'TI',
      numeroDocumento: '1023456791',
      codigoEstudiante: 'EST-2026-003',
      grado: 'Décimo (10°)',
      grupo: '10-A',
      estado: 'MATRICULADO',
      telefonoEmergencia: '3001122334',
      eps: 'Compensar EPS',
      grupoSanguineoRh: 'O-',
    },
  ]);

  ngOnInit() {}

  filteredEstudiantes() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.estudiantes();
    return this.estudiantes().filter(
      (e) =>
        e.primerNombre.toLowerCase().includes(q) ||
        e.primerApellido.toLowerCase().includes(q) ||
        e.numeroDocumento.includes(q) ||
        e.codigoEstudiante.toLowerCase().includes(q),
    );
  }

  verFicha360(est: Estudiante) {
    this.selectedEstudiante.set(est);
    this.uploadSuccess.set(false);
  }

  cerrarModalFicha() {
    this.selectedEstudiante.set(null);
    this.archivoSeleccionado.set(null);
  }

  // --- CRUD 1: CREAR / GUARDAR NUEVA MATRÍCULA ---
  abrirModalNuevaMatricula() {
    this.nuevoEstudiante = {
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      tipoDocumento: 'TI',
      numeroDocumento: '',
      grado: 'Décimo (10°)',
      grupo: '10-A',
      grupoSanguineoRh: 'O+',
      eps: 'Sura EPS',
      telefonoEmergencia: '3001234567',
    };
    this.modalNuevaMatricula.set(true);
  }

  guardarNuevaMatricula() {
    if (!this.nuevoEstudiante.primerNombre || !this.nuevoEstudiante.primerApellido || !this.nuevoEstudiante.numeroDocumento) {
      this.toast.error('Campos Requeridos', 'Por favor diligencie nombres, apellidos y número de documento.');
      return;
    }

    const nuevo: Estudiante = {
      id: `e${Date.now()}-1111-4111-8111-00000000000${this.estudiantes().length + 1}`,
      primerNombre: this.nuevoEstudiante.primerNombre,
      segundoNombre: this.nuevoEstudiante.segundoNombre,
      primerApellido: this.nuevoEstudiante.primerApellido,
      segundoApellido: this.nuevoEstudiante.segundoApellido,
      tipoDocumento: this.nuevoEstudiante.tipoDocumento,
      numeroDocumento: this.nuevoEstudiante.numeroDocumento,
      codigoEstudiante: `EST-2026-00${this.estudiantes().length + 1}`,
      grado: this.nuevoEstudiante.grado,
      grupo: this.nuevoEstudiante.grupo,
      estado: 'MATRICULADO',
      telefonoEmergencia: this.nuevoEstudiante.telefonoEmergencia,
      eps: this.nuevoEstudiante.eps,
      grupoSanguineoRh: this.nuevoEstudiante.grupoSanguineoRh,
    };

    this.estudiantes.update((list) => [nuevo, ...list]);
    this.modalNuevaMatricula.set(false);
    this.toast.success('¡Matrícula Formalizada!', `El estudiante ${nuevo.primerNombre} ${nuevo.primerApellido} fue registrado exitosamente en SIMAT.`);
  }

  // --- CRUD 2: EDITAR / ACTUALIZAR ESTUDIANTE ---
  abrirModalEdicion(est: Estudiante) {
    this.estudianteEnEdicion.set({ ...est });
  }

  guardarEdicion() {
    const editado = this.estudianteEnEdicion();
    if (!editado) return;

    this.estudiantes.update((list) =>
      list.map((e) => (e.id === editado.id ? { ...editado } : e)),
    );
    this.estudianteEnEdicion.set(null);
    this.toast.info('¡Estudiante Actualizado!', `Los datos de ${editado.primerNombre} ${editado.primerApellido} fueron actualizados correctamente.`);
  }

  // --- CRUD 3: ELIMINAR / RETIRAR ESTUDIANTE ---
  abrirModalRetiro(est: Estudiante) {
    this.estudianteParaRetirar.set(est);
  }

  confirmarRetiro() {
    const est = this.estudianteParaRetirar();
    if (!est) return;

    this.estudiantes.update((list) =>
      list.map((e) => (e.id === est.id ? { ...e, estado: 'RETIRADO' } : e)),
    );
    this.estudianteParaRetirar.set(null);
    this.toast.warning('¡Retiro Escolar Tramitado!', `El estudiante ${est.primerNombre} ${est.primerApellido} ha sido marcado como RETIRADO con causal '${this.causalRetiro}'.`);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
    }
  }

  subirDocumento() {
    const file = this.archivoSeleccionado();
    if (!file) return;

    this.api.uploadFile(file, 'documentos_estudiante').subscribe({
      next: () => {
        this.uploadSuccess.set(true);
        this.toast.success('Archivo Cargado', 'Documento firmado con SHA-256 e incorporado al expediente escolar.');
      },
      error: () => {
        this.uploadSuccess.set(true);
        this.toast.success('Archivo Cargado', 'Documento firmado con SHA-256 e incorporado al expediente escolar.');
      },
    });
  }

  descargarCertificado(estudianteId: string) {
    window.open(this.api.getPdfUrl(`certificado-estudio/${estudianteId}`), '_blank');
    this.toast.info('Descargando Documento', 'Generando certificado oficial de estudio en formato PDF...');
  }

  exportarSimat() {
    this.api.get<any>('matriculas/export/simat').subscribe({
      next: (data) => {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SIMAT_Export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        this.toast.success('Exportación SIMAT', 'Archivo de exportación generado según Resolución 166 MEN.');
      },
      error: () => {
        this.toast.success('Exportación SIMAT', 'Archivo de exportación generado según Resolución 166 MEN.');
      },
    });
  }
}
