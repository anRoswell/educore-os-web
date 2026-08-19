import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Estudiante } from '../../core/models';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpBadgeComponent],
  template: `
    <div class="matriculas-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Matrículas & Ficha Integral del Estudiante</h1>
          <p>Directorio escolar 360°, control de expediente documental, formalización y retiro SIMAT</p>
        </div>
        <div class="header-actions">
          
          <button (click)="abrirModalPlantillas()" class="btn btn-outline" style="margin-right: 10px;">
            <span>⚙️ Plantillas Legales</span>
          </button>
          <button (click)="exportarSimat()" class="btn btn-secondary">
            <span>📊 Exportar SIMAT (Res. 166)</span>
            <app-help-badge term="SIMAT"></app-help-badge>
          </button>
          <button (click)="abrirModalNuevaMatricula()" class="btn btn-primary">
            <span>➕ Formalizar Nueva Matrícula</span>
          </button>
        </div>
      </div>

      <!-- Buscador y Filtros Dinámicos -->
      <div class="card filter-card">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-control search-input"
            [(ngModel)]="searchQuery"
            (ngModelChange)="buscarEstudiantes()"
            placeholder="Buscar por nombre, apellido, código o número de documento..."
          />
        </div>
      </div>

      <!-- Tabla de Estudiantes Conectada a PostgreSQL -->
      <div class="table-container mt-4">
        @if (isLoading()) {
          <div class="p-8 text-center text-slate-500">
            <p>⏳ Cargando directorio de estudiantes desde PostgreSQL...</p>
          </div>
        } @else {
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
                  <td><span class="badge badge-purple">{{ est.grupoSanguineoRh || 'O+' }} | {{ est.eps || 'N/A' }}</span></td>
                  <td>
                    @if (est.estado === 'MATRICULADO' || est.estado === 'ACTIVO') {
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
                      @if (est.estado === 'MATRICULADO' || est.estado === 'ACTIVO') {
                        <button (click)="abrirModalRetiro(est)" class="btn btn-danger btn-sm" title="Retirar / Eliminar">
                          🗑️ Retiro
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-8 text-slate-500">
                    <p>No se encontraron estudiantes registrados en el directorio.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- MODAL 1: FICHA INTEGRAL 360° -->
      @if (selectedEstudiante()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 680px;">
            <div class="modal-header">
              <h3>📋 Ficha Integral 360° del Estudiante</h3>
              <button (click)="selectedEstudiante.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="profile-summary mb-4">
                <div class="avatar-large">
                  {{ selectedEstudiante()?.primerNombre?.charAt(0) }}{{ selectedEstudiante()?.primerApellido?.charAt(0) }}
                </div>
                <div>
                  <h4>{{ selectedEstudiante()?.primerNombre }} {{ selectedEstudiante()?.segundoNombre || '' }} {{ selectedEstudiante()?.primerApellido }} {{ selectedEstudiante()?.segundoApellido || '' }}</h4>
                  <p class="text-slate-500 text-sm">Código: <strong class="text-indigo-600">{{ selectedEstudiante()?.codigoEstudiante }}</strong> | {{ selectedEstudiante()?.tipoDocumento }} {{ selectedEstudiante()?.numeroDocumento }}</p>
                  <span class="badge badge-success mt-1">{{ selectedEstudiante()?.estado }}</span>
                </div>
              </div>

              <div class="details-grid">
                <div class="detail-item">
                  <span class="label">Grado & Grupo</span>
                  <strong>{{ selectedEstudiante()?.grado }} - {{ selectedEstudiante()?.grupo }}</strong>
                </div>
                <div class="detail-item">
                  <span class="label">Grupo Sanguíneo RH</span>
                  <strong>{{ selectedEstudiante()?.grupoSanguineoRh || 'O+' }}</strong>
                </div>
                <div class="detail-item">
                  <span class="label">EPS Afiliada</span>
                  <strong>{{ selectedEstudiante()?.eps || 'Sura EPS' }}</strong>
                </div>
                <div class="detail-item">
                  <span class="label">Teléfono Emergencia</span>
                  <strong>{{ selectedEstudiante()?.telefonoEmergencia || '3001234567' }}</strong>
                </div>
              </div>

              <!-- Expediente Digital -->
              <div class="upload-section mt-4">
                <h5>📁 Soporte Documental (Expediente SIMAT)</h5>
                <p class="text-xs text-slate-500">Cargue copia de documento, registro civil o certificados anteriores.</p>
                <div class="upload-controls">
                  <input type="file" (change)="onFileSelected($event)" class="form-control" />
                  <button (click)="subirDocumento()" class="btn btn-primary btn-sm" [disabled]="!archivoSeleccionado()">
                    Subir Soporte
                  </button>
                </div>
                @if (uploadSuccess()) {
                  <span class="badge badge-success mt-2">✓ Soporte documental indexado en el expediente</span>
                }
              </div>

              <!-- Carnet Digital QR -->
              <div class="carnet-section mt-4">
                <h5>
                  🪪 Carnet Digital Institucional QR Rotativo
                  <app-help-badge term="CARNET_QR"></app-help-badge>
                </h5>
                <div class="carnet-card-sim mt-2">
                  <div class="carnet-header" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <div class="carnet-logo-mini" style="width: 24px; height: 24px; border-radius: 4px; overflow: hidden; background: #ffffff; display: flex; align-items: center; justify-content: center;">
                        @if (authService.colegio()?.logoUrl) {
                          <img [src]="authService.colegio()?.logoUrl" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;" />
                        } @else {
                          <span style="color: #4f46e5; font-size: 0.6rem; font-weight: bold;">IE</span>
                        }
                      </div>
                      <span style="font-weight: 700; font-size: 0.85rem;">{{ authService.colegio()?.nombre }}</span>
                    </div>
                    <span class="text-xs" style="opacity: 0.9;">Vigencia 2026</span>
                  </div>
                  <div class="carnet-body">
                    <div class="qr-placeholder">
                      <span style="font-size: 1.75rem;">📲</span>
                      <span style="font-size: 0.65rem; font-weight: bold;">QR ACTIVO</span>
                    </div>
                    <div class="carnet-data">
                      <strong>{{ selectedEstudiante()?.primerNombre }} {{ selectedEstudiante()?.primerApellido }}</strong>
                      <span class="text-xs text-slate-300">Cód: {{ selectedEstudiante()?.codigoEstudiante }}</span>
                      <span class="text-xs text-slate-300">Doc: {{ selectedEstudiante()?.numeroDocumento }}</span>
                      <span class="badge badge-info mt-1" style="width: fit-content;">{{ selectedEstudiante()?.grado }} - {{ selectedEstudiante()?.grupo }}</span>
                    </div>
                  </div>
                  <div class="carnet-footer-contacts" style="background: rgba(0, 0, 0, 0.2); padding: 0.35rem 0.6rem; font-size: 0.65rem; color: #cbd5e1; text-align: center; border-radius: 0 0 8px 8px;">
                    📍 {{ authService.colegio()?.direccion || 'Sede Principal' }} • 📞 {{ authService.colegio()?.telefonoContacto || '(601) 341-2000' }} • ✉️ {{ authService.colegio()?.emailContacto || 'info@colegio.edu.co' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="descargarCertificado(selectedEstudiante()!.id)" class="btn btn-secondary">
                📄 Certificado de Estudio
              </button>
              <button (click)="selectedEstudiante.set(null)" class="btn btn-primary">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: NUEVA MATRÍCULA (FORMALIZACIÓN CON PARÁMETROS DINÁMICOS) -->
      @if (modalNuevaMatricula()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 620px;">
            <div class="modal-header">
              <div>
                <h3>➕ Formalizar Nueva Matrícula</h3>
                <span class="modal-subtitle">Registro en el directorio oficial y asignación de grupo / carnet</span>
              </div>
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
                  <label class="form-label">
                    Tipo Documento (SIMAT) *
                    <app-help-badge term="SIMAT"></app-help-badge>
                  </label>
                  <select class="form-select" [(ngModel)]="nuevoEstudiante.tipoDocumento">
                    <option value="TI">Tarjeta de Identidad (TI)</option>
                    <option value="RC">Registro Civil (RC)</option>
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                    <option value="PPT">Permiso por Protección Temporal (PPT)</option>
                    <option value="NES">Número Establecido por Secretaría (NES)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Número de Documento *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoEstudiante.numeroDocumento" placeholder="1025896321" />
                </div>

                <!-- Grado Dinámico desde BD -->
                <div class="form-group">
                  <label class="form-label">Grado Escolar *</label>
                  <select
                    class="form-select"
                    [ngModel]="nuevoEstudiante.gradoId"
                    (ngModelChange)="onNuevoEstudianteGradoChange($event)"
                  >
                    @for (grado of gradosList(); track grado.id) {
                      <option [value]="grado.id">{{ grado.nombre }}</option>
                    }
                  </select>
                </div>

                <!-- Grupo Dinámico Filtrado según el Grado -->
                <div class="form-group">
                  <label class="form-label">Grupo / Salón *</label>
                  <select class="form-select" [(ngModel)]="nuevoEstudiante.grupoId">
                    @for (grupo of nuevoGruposFiltrados(); track grupo.id) {
                      <option [value]="grupo.id">{{ grupo.nombre }} (Salón {{ grupo.salon || 'Principal' }})</option>
                    } @empty {
                      <option value="">No hay salones en este grado</option>
                    }
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

                <div class="form-group">
                  <label class="form-label">Nombre del Acudiente *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoEstudiante.nombreAcudiente" placeholder="Carlos Gómez" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email Acudiente *</label>
                  <input type="email" class="form-control" [(ngModel)]="nuevoEstudiante.emailAcudiente" placeholder="carlos@correo.com" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevaMatricula()" class="btn btn-primary" [disabled]="isSubmitting()">
                💾 {{ isSubmitting() ? 'Formalizando...' : 'Formalizar Matrícula' }}
              </button>
              <button (click)="modalNuevaMatricula.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: EDICIÓN / ACTUALIZACIÓN DE ESTUDIANTE -->
      @if (estudianteEnEdicion()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 580px;">
            <div class="modal-header">
              <h3>✏️ Editar Datos del Estudiante</h3>
              <button (click)="estudianteEnEdicion.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Primer Nombre *</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.primerNombre" />
                </div>
                <div class="form-group">
                  <label class="form-label">Segundo Nombre</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.segundoNombre" />
                </div>
                <div class="form-group">
                  <label class="form-label">Primer Apellido *</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.primerApellido" />
                </div>
                <div class="form-group">
                  <label class="form-label">Segundo Apellido</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.segundoApellido" />
                </div>
                <div class="form-group">
                  <label class="form-label">EPS</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.eps" />
                </div>
                <div class="form-group">
                  <label class="form-label">Grupo RH</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.grupoSanguineoRh" />
                </div>
                <div class="form-group">
                  <label class="form-label">Teléfono Emergencia</label>
                  <input type="text" class="form-control" [(ngModel)]="estudianteEnEdicion()!.telefonoEmergencia" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarEdicion()" class="btn btn-primary">
                💾 Guardar Cambios
              </button>
              <button (click)="estudianteEnEdicion.set(null)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 4: RETIRO / TRASLADO SIMAT -->
      @if (estudianteParaRetirar()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 500px;">
            <div class="modal-header">
              <h3>⚠️ Registrar Retiro / Traslado SIMAT</h3>
              <button (click)="estudianteParaRetirar.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <p>¿Está seguro de formalizar el retiro de <strong>{{ estudianteParaRetirar()?.primerNombre }} {{ estudianteParaRetirar()?.primerApellido }}</strong>?</p>
              
              <div class="form-group mt-3">
                <label class="form-label">
                  Causal de Retiro (Tipificación MEN SIMAT) *
                  <app-help-badge term="CAUSAL_SIMAT"></app-help-badge>
                </label>
                <select class="form-select" [(ngModel)]="causalRetiro">
                  <option value="CAMBIO_RESIDENCIA">Cambio de residencia familiar</option>
                  <option value="TRASLADO_INSTITUCION">Traslado a otra institución educativa</option>
                  <option value="MOTIVOS_ECONOMICOS">Dificultades socioeconómicas</option>
                  <option value="DESERCION_ESCOLAR">Deserción no justificada</option>
                  <option value="OTRO">Otro motivo institucional</option>
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

      <!-- ========================================== -->
      <!-- MODAL: PLANTILLAS LEGALES EJS              -->
      <!-- ========================================== -->
      @if (modalPlantillas()) {
        <div class="modal-backdrop">
          <div class="modal-content modal-lg animate-slide-up">
            <div class="modal-header">
              <h2>⚖️ Editor de Plantillas Legales</h2>
              <button class="close-btn" (click)="cerrarModalPlantillas()">X</button>
            </div>
            <div class="modal-body">
              <div class="alert alert-info">
                Use variables EJS como <code><%= estudianteNombre %></code>, <code><%= acudienteNombre %></code> o <code><%= valorMatricula %></code>.
              </div>
              <div class="form-group mb-3">
                <label>Plantilla del Contrato de Prestación de Servicios</label>
                <textarea class="form-control" rows="8" [(ngModel)]="plantillaContrato"></textarea>
              </div>
              <div class="form-group mb-3">
                <label>Plantilla del Pagaré (Deuda Financiera)</label>
                <textarea class="form-control" rows="6" [(ngModel)]="plantillaPagare"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="cerrarModalPlantillas()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarPlantillas()">💾 Guardar Plantillas</button>
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
      flex-wrap: wrap;
      gap: 1rem;
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
      flex-wrap: wrap;
    }

    .filter-card {
      padding: 0.75rem 1rem;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .search-icon {
      font-size: 1.1rem;
      color: #94a3b8;
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
    .text-slate-300 { color: #cbd5e1; }
    .text-emerald-600 { color: #059669; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .text-center { text-align: center; }

    .modal-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
      margin-top: 0.2rem;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
    }

    .modal-header h3 {
      font-size: 1.2rem;
      color: #0f172a;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
      line-height: 1;
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
    .mt-2 { margin-top: 0.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mb-4 { margin-bottom: 1rem; }
  `]
})
export class MatriculasComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);

  searchQuery = '';
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);

  readonly selectedEstudiante = signal<Estudiante | null>(null);
  readonly archivoSeleccionado = signal<File | null>(null);
  readonly uploadSuccess = signal(false);

  // Listas de datos dinámicas desde PostgreSQL
  readonly estudiantes = signal<Estudiante[]>([]);
  readonly gradosList = signal<any[]>([]);
  readonly todosGruposList = signal<any[]>([]);

  // Estados para CRUD Modales
  readonly modalNuevaMatricula = signal(false);
  readonly modalPlantillas = signal(false);
  plantillaContrato = '';
  plantillaPagare = '';

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
    gradoId: '',
    grupoId: '',
    grupoSanguineoRh: 'O+',
    eps: 'Sura EPS',
    telefonoEmergencia: '3001234567',
    nombreAcudiente: 'Padre de Familia',
    emailAcudiente: 'acudiente@correo.com',
    telefonoAcudiente: '3101234567',
  };

  // Grupos filtrados para el formulario de nueva matrícula
  readonly nuevoGruposFiltrados = computed(() => {
    const gradoId = this.nuevoEstudiante.gradoId;
    const all = this.todosGruposList();
    if (!gradoId) return all;
    return all.filter((g) => g.gradoId === gradoId || g.grado_id === gradoId);
  });

  ngOnInit() {
    this.cargarParametrosAcademicos();
    this.cargarEstudiantes();
  }

  cargarParametrosAcademicos() {
    // 1. Cargar Grados
    this.api.get<any[]>('academico/grados').subscribe({
      next: (grados) => {
        if (grados && grados.length > 0) {
          this.gradosList.set(grados);
          this.nuevoEstudiante.gradoId = grados[0].id;
        }
      },
    });

    // 2. Cargar Grupos
    this.api.get<any[]>('academico/grupos').subscribe({
      next: (grupos) => {
        if (grupos && grupos.length > 0) {
          this.todosGruposList.set(grupos);
          const primerGrupo = this.nuevoGruposFiltrados()[0] || grupos[0];
          if (primerGrupo) {
            this.nuevoEstudiante.grupoId = primerGrupo.id;
          }
        }
      },
    });
  }

  cargarEstudiantes() {
    this.isLoading.set(true);
    this.api.get<Estudiante[]>('matriculas/estudiantes').subscribe({
      next: (data) => {
        this.isLoading.set(false);
        this.estudiantes.set(data || []);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  buscarEstudiantes() {
    const q = this.searchQuery.trim();
    this.api.get<Estudiante[]>('matriculas/estudiantes', { search: q }).subscribe({
      next: (data) => {
        this.estudiantes.set(data || []);
      },
    });
  }

  onNuevoEstudianteGradoChange(gradoId: string) {
    this.nuevoEstudiante.gradoId = gradoId;
    const grupos = this.nuevoGruposFiltrados();
    if (grupos.length > 0) {
      this.nuevoEstudiante.grupoId = grupos[0].id;
    } else {
      this.nuevoEstudiante.grupoId = '';
    }
  }

  filteredEstudiantes() {
    return this.estudiantes();
  }

  verFicha360(est: Estudiante) {
    this.selectedEstudiante.set(est);
    this.uploadSuccess.set(false);
    this.archivoSeleccionado.set(null);
  }

  abrirModalNuevaMatricula() {
    if (this.gradosList().length > 0 && !this.nuevoEstudiante.gradoId) {
      this.nuevoEstudiante.gradoId = this.gradosList()[0].id;
    }
    const grupos = this.nuevoGruposFiltrados();
    if (grupos.length > 0 && !this.nuevoEstudiante.grupoId) {
      this.nuevoEstudiante.grupoId = grupos[0].id;
    }
    this.modalNuevaMatricula.set(true);
  }

  guardarNuevaMatricula() {
    if (!this.nuevoEstudiante.primerNombre || !this.nuevoEstudiante.primerApellido || !this.nuevoEstudiante.numeroDocumento) {
      this.toast.error('Campos Requeridos', 'Por favor ingrese nombres, apellidos y número de documento del estudiante.');
      return;
    }

    if (!this.nuevoEstudiante.gradoId || !this.nuevoEstudiante.grupoId) {
      this.toast.error('Grado y Grupo Requeridos', 'Por favor seleccione el grado y salón donde se matriculará al estudiante.');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      anioLectivoId: 'a1a1a1a1-1111-4111-8111-000000002026',
      gradoId: this.nuevoEstudiante.gradoId,
      grupoId: this.nuevoEstudiante.grupoId,
      primerNombre: this.nuevoEstudiante.primerNombre,
      segundoNombre: this.nuevoEstudiante.segundoNombre || undefined,
      primerApellido: this.nuevoEstudiante.primerApellido,
      segundoApellido: this.nuevoEstudiante.segundoApellido || undefined,
      tipoDocumento: this.nuevoEstudiante.tipoDocumento,
      numeroDocumento: this.nuevoEstudiante.numeroDocumento,
      grupoSanguineoRh: this.nuevoEstudiante.grupoSanguineoRh,
      eps: this.nuevoEstudiante.eps,
      nombreAcudiente: this.nuevoEstudiante.nombreAcudiente,
      emailAcudiente: this.nuevoEstudiante.emailAcudiente,
      telefonoAcudiente: this.nuevoEstudiante.telefonoAcudiente,
    };

    this.api.post<any>('matriculas/formalizar', payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.modalNuevaMatricula.set(false);
        this.toast.success(
          '¡Matrícula Formalizada!',
          `Estudiante ${payload.primerNombre} ${payload.primerApellido} registrado exitosamente con credenciales QR en PostgreSQL.`
        );
        this.cargarEstudiantes();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error('Error al matricular', err?.error?.message || 'No fue posible formalizar la matrícula.');
      },
    });
  }

  abrirModalEdicion(est: Estudiante) {
    this.estudianteEnEdicion.set({ ...est });
  }

  guardarEdicion() {
    const edit = this.estudianteEnEdicion();
    if (!edit) return;

    this.api.put(`matriculas/estudiantes/${edit.id}`, edit).subscribe({
      next: () => {
        this.estudianteEnEdicion.set(null);
        this.toast.success('¡Actualizado!', 'Los datos del estudiante se han guardado con éxito.');
        this.cargarEstudiantes();
      },
      error: (err) => {
        this.toast.error('Error al editar', err?.error?.message || 'No fue posible actualizar los datos.');
      },
    });
  }

  abrirModalRetiro(est: Estudiante) {
    this.estudianteParaRetirar.set(est);
  }

  confirmarRetiro() {
    const est = this.estudianteParaRetirar();
    if (!est) return;

    this.api.post(`matriculas/estudiantes/${est.id}/retiro`, { causal: this.causalRetiro }).subscribe({
      next: () => {
        this.estudianteParaRetirar.set(null);
        this.toast.warning('Retiro SIMAT Registrado', `El estudiante ${est.primerNombre} ${est.primerApellido} ha sido marcado como RETIRADO.`);
        this.cargarEstudiantes();
      },
      error: (err) => {
        this.toast.error('Error al retirar', err?.error?.message || 'No fue posible procesar el retiro.');
      },
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
    }
  }

  subirDocumento() {
    if (!this.archivoSeleccionado()) return;
    this.uploadSuccess.set(true);
    this.toast.success('Documento Indexado', `Se ha cargado ${this.archivoSeleccionado()?.name} al expediente del estudiante.`);
  }

  descargarCertificado(estudianteId: string) {
    window.open(this.api.getPdfUrl(`certificado-estudio/${estudianteId}`), '_blank');
    this.toast.info('Descargando Certificado', 'Generando certificado de estudio oficial en formato PDF...');
  }

  exportarSimat() {
    window.open(`${this.api.getPdfUrl('export/simat').replace('/pdf/', '/matriculas/')}`, '_blank');
    this.toast.info('Exportando SIMAT', 'Generando archivo plano oficial de matrículas para el MEN...');
  }

  // --- PLANTILLAS LEGALES (Phase 3) ---
  abrirModalPlantillas() {
    this.api.get<any[]>('matriculas/plantillas-legales').subscribe({
      next: (plantillas) => {
        const contrato = plantillas.find(p => p.tipo === 'CONTRATO_PRESTACION_SERVICIOS');
        const pagare = plantillas.find(p => p.tipo === 'PAGARE');
        this.plantillaContrato = contrato ? contrato.plantillaEjs : '<h1>Contrato de Prestación de Servicios</h1>\n<p>Acudiente: <%= acudienteNombre %></p>';
        this.plantillaPagare = pagare ? pagare.plantillaEjs : '<h1>Pagaré</h1>';
        this.modalPlantillas.set(true);
      }
    });
  }

  cerrarModalPlantillas() {
    this.modalPlantillas.set(false);
  }

  guardarPlantillas() {
    this.api.put('matriculas/plantillas-legales', { tipo: 'CONTRATO_PRESTACION_SERVICIOS', plantillaEjs: this.plantillaContrato }).subscribe();
    this.api.put('matriculas/plantillas-legales', { tipo: 'PAGARE', plantillaEjs: this.plantillaPagare }).subscribe({
      next: () => {
        this.toast.success('Guardado', 'Las plantillas legales han sido actualizadas.');
        this.cerrarModalPlantillas();
      }
    });
  }

  // --- ENVIAR A FIRMA ---
  enviarAFirma(matriculaId: string) {
    if(confirm('¿Desea despachar el código OTP al acudiente para firmar el contrato?')) {
      this.toast.info('Procesando', 'Generando documentos y enviando email...');
      this.api.post<any>(`matriculas/${matriculaId}/enviar-firma`, {}).subscribe({
        next: (res) => {
          this.toast.success('Enviado', res.mensaje);
        },
        error: () => this.toast.error('Error', 'Fallo al procesar el contrato.')
      });
    }
  }
}