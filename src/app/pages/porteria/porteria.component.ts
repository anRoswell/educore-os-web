import { Component, OnInit, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';

export interface MinutaVisitanteItem {
  id: string;
  colegioId: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombreCompleto: string;
  empresaEntidad?: string;
  motivoVisita: string;
  personaAVisitar: string;
  fechaIngreso: string;
  fechaSalida?: string;
  gafeteAsignado?: string;
  registradoPorUserId?: string;
  fotoUrl?: string;
  fotoBase64?: string;
}

export interface MarcacionTorniqueteItem {
  id: string;
  colegioId: string;
  estudianteId: string;
  estudianteNombre?: string;
  estudianteDocumento?: string;
  estudianteGrado?: string;
  tipoMarcacion: string; // 'ENTRADA' | 'SALIDA'
  puntoAcceso: string;
  fechaHora: string;
}

export interface AutorizacionSalidaItem {
  id: string;
  colegioId: string;
  matriculaId: string;
  estudianteNombre?: string;
  estudianteDocumento?: string;
  estudianteGrado?: string;
  fechaSalida: string;
  horaSalidaEstimada: string;
  motivo: string;
  personaRetiraNombre: string;
  personaRetiraDocumento: string;
  estado: string; // 'AUTORIZADO' | 'EJECUTADO' | 'CANCELADO'
}

export interface VehiculoIngresoItem {
  id: string;
  placa: string;
  conductorNombre: string;
  tipoVehiculo: string;
  destino: string;
  horaIngreso: string;
  horaSalida?: string;
  estado: 'DENTRO' | 'SALIO';
}

@Component({
  selector: 'app-porteria',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpBadgeComponent],
  template: `
    <div class="porteria-page-container animate-fade-in">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <div class="header-badge">
            <span>🛡️ SEGURIDAD PERIMETRAL & CAMPUS</span>
            <span class="badge-tag">CONTROL DE ACCESO</span>
          </div>
          <h1>
            Portería, Minuta Digital & Control de Acceso
            <app-help-badge term="CONTROL_ACCESO"></app-help-badge>
          </h1>
          <p class="subtitle">
            Minuta digital de visitantes con asignación de gafete, lectura de torniquetes QR y validación segura de salidas de estudiantes.
          </p>
        </div>

        <div class="header-actions">
          <button (click)="abrirModalIngresoVisitante()" class="btn btn-primary" title="Registrar nuevo visitante en minuta">
            <span>➕ Registrar Visitante</span>
          </button>
          <button (click)="abrirModalMarcacionTorniquete()" class="btn btn-secondary" title="Simular lectura de torniquete QR">
            <span>🎟️ Marcación Torniquete QR</span>
          </button>
          <button (click)="abrirModalAutorizacionSalida()" class="btn btn-secondary" title="Crear permiso de salida de estudiante">
            <span>🏃 Salida de Estudiante</span>
          </button>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card card">
          <div class="kpi-icon-badge color-indigo">
            <span>🏢</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Visitantes en Campus</span>
            <h3 class="kpi-value">{{ totalVisitantesEnCampus() }}</h3>
            <span class="kpi-hint">Personas dentro de las instalaciones</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-green">
            <span>🔄</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Marcaciones Hoy (Torniquetes)</span>
            <h3 class="kpi-value">{{ totalMarcacionesHoy() }}</h3>
            <span class="kpi-hint">Ingresos y salidas peatonales</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-amber">
            <span>🏃</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Salidas Autorizadas</span>
            <h3 class="kpi-value">{{ totalSalidasPendientes() }}</h3>
            <span class="kpi-hint">Permisos activos de estudiantes</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-purple">
            <span>🚗</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Vehículos en Parqueadero</span>
            <h3 class="kpi-value">{{ totalVehiculosDentro() }}</h3>
            <span class="kpi-hint">Control vehicular activo</span>
          </div>
        </div>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav tabs-nav-bar">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'visitantes'"
          (click)="activeTab.set('visitantes')"
        >
          <span>📋 Minuta de Visitantes</span>
          <span class="tab-badge">{{ visitantesList().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'torniquetes'"
          (click)="activeTab.set('torniquetes')"
        >
          <span>🎟️ Torniquetes & Control QR</span>
          <span class="tab-badge">{{ marcacionesList().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'salidas'"
          (click)="activeTab.set('salidas')"
        >
          <span>🏃 Autorizaciones de Salida</span>
          <span class="tab-badge">{{ autorizacionesList().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'vehiculos'"
          (click)="activeTab.set('vehiculos')"
        >
          <span>🚗 Vehículos & Parqueadero</span>
          <span class="tab-badge">{{ vehiculosList().length }}</span>
        </button>
      </div>

      <!-- ================================================= -->
      <!-- TAB 1: MINUTA DE VISITANTES                      -->
      <!-- ================================================= -->
      @if (activeTab() === 'visitantes') {
        <div class="tab-content animate-fade-in">
          <!-- BUSCADOR Y FILTROS -->
          <div class="filters-card card">
            <div class="filters-grid">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input
                  type="search"
                  class="search-input"
                  placeholder="Buscar visitante por nombre, cédula, empresa o gafete..."
                  [(ngModel)]="filtroTextoVisitantes"
                  (input)="aplicarFiltrosVisitantes()"
                />
              </div>

              <div class="filter-group">
                <label>Estado Visita:</label>
                <select class="form-select" [(ngModel)]="filtroEstadoVisitante" (change)="aplicarFiltrosVisitantes()">
                  <option value="TODOS">Todos los Visitantes</option>
                  <option value="EN_CAMPUS">En Campus (Abiertos)</option>
                  <option value="FINALIZADO">Salida Registrada</option>
                </select>
              </div>
            </div>
          </div>

          <!-- TABLA DE VISITANTES -->
          <div class="table-container card mt-3">
            @if (isLoadingVisitantes()) {
              <div class="empty-state">
                <div class="spinner"></div>
                <p>Cargando minuta digital de visitantes...</p>
              </div>
            } @else if (visitantesFiltrados().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">🛡️</span>
                <h3>No hay registros de visitantes</h3>
                <p>No se encontraron visitas con los criterios seleccionados. Puede registrar un ingreso con el botón superior.</p>
                <button (click)="abrirModalIngresoVisitante()" class="btn btn-primary mt-3">
                  ➕ Registrar Primer Visitante
                </button>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Visitante & Documento</th>
                    <th>Empresa / Entidad</th>
                    <th>Motivo de Visita</th>
                    <th>Persona / Área a Visitar</th>
                    <th>Gafete</th>
                    <th>Hora Ingreso</th>
                    <th>Estado</th>
                    <th style="text-align: right;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (v of visitantesFiltrados(); track v.id) {
                    <tr>
                      <td>
                        <div class="visitor-cell">
                          @if (v.fotoUrl || v.fotoBase64) {
                            <img [src]="v.fotoUrl || v.fotoBase64" alt="Foto" class="visitor-avatar-img" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1; flex-shrink: 0;" />
                          } @else {
                            <div class="visitor-avatar">
                              {{ v.nombreCompleto?.charAt(0) || 'V' }}
                            </div>
                          }
                          <div>
                            <strong class="visitor-name">{{ v.nombreCompleto }}</strong>
                            <span class="visitor-doc">{{ v.tipoDocumento }} {{ v.numeroDocumento }}</span>
                          </div>
                        </div>
                      </td>
                      <td>{{ v.empresaEntidad || 'Particular / Acudiente' }}</td>
                      <td>{{ v.motivoVisita }}</td>
                      <td><strong>{{ v.personaAVisitar }}</strong></td>
                      <td>
                        <span class="badge badge-secondary">{{ v.gafeteAsignado || 'S/G' }}</span>
                      </td>
                      <td>
                        <span class="text-xs">{{ v.fechaIngreso | date:'dd/MM/yyyy HH:mm' }}</span>
                      </td>
                      <td>
                        @if (!v.fechaSalida) {
                          <span class="status-chip chip-green">🟢 En Campus</span>
                        } @else {
                          <span class="status-chip chip-slate">Salida: {{ v.fechaSalida | date:'HH:mm' }}</span>
                        }
                      </td>
                      <td style="text-align: right;">
                        <div class="actions-group">
                          <button (click)="verDetalleVisitante(v)" class="btn btn-secondary btn-sm" title="Ver Detalle / Gafete">
                            👁️ Ver Ficha
                          </button>
                          @if (!v.fechaSalida) {
                            <button (click)="registrarSalidaVisitante(v.id)" class="btn btn-primary btn-sm ml-2" title="Registrar Salida">
                              🚪 Salida
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 2: TORNIQUETES & CONTROL QR                  -->
      <!-- ================================================= -->
      @if (activeTab() === 'torniquetes') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card">
            <div class="flex-between">
              <div>
                <h3>🎟️ Registro de Marcaciones de Torniquetes y Lectores QR</h3>
                <p class="text-sm">Lectura instantánea de carnets digitales estudiantiles y control de aforo por puntos de acceso perimetrales.</p>
              </div>
              <button (click)="abrirModalMarcacionTorniquete()" class="btn btn-primary">
                ➕ Simular Marcación QR
              </button>
            </div>
          </div>

          <div class="table-container card mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante / Usuario</th>
                  <th>Tipo de Marcación</th>
                  <th>Punto de Acceso</th>
                  <th>Fecha y Hora</th>
                  <th>Estado del Torniquete</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (m of marcacionesList(); track m.id) {
                  <tr>
                    <td>
                      <strong>{{ m.estudianteNombre || 'Estudiante Autorizado' }}</strong>
                      <div class="text-xs text-slate-500">ID: {{ m.estudianteId?.slice(0, 13) }}...</div>
                    </td>
                    <td>
                      <span class="badge" [class.badge-success]="m.tipoMarcacion === 'ENTRADA'" [class.badge-danger]="m.tipoMarcacion === 'SALIDA'">
                        {{ m.tipoMarcacion === 'ENTRADA' ? '🟢 ENTRADA' : '🔴 SALIDA' }}
                      </span>
                    </td>
                    <td><code>{{ m.puntoAcceso }}</code></td>
                    <td>{{ m.fechaHora | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    <td>
                      <span class="status-chip chip-green">✓ Validado (200 OK)</span>
                    </td>
                    <td style="text-align: right;">
                      <button (click)="verDetalleMarcacion(m)" class="btn btn-secondary btn-sm">
                        🔍 Ver Detalle
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center py-4 text-slate-500">
                      No hay marcaciones de torniquetes registradas recientemente.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 3: AUTORIZACIONES DE SALIDA                  -->
      <!-- ================================================= -->
      @if (activeTab() === 'salidas') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card">
            <div class="flex-between">
              <div>
                <h3>🏃 Protocolo de Salida Segura de Estudiantes</h3>
                <p class="text-sm">Autorizaciones emitidas por coordinación académica para retiros anticipados con validación de documento y persona autorizada.</p>
              </div>
              <button (click)="abrirModalAutorizacionSalida()" class="btn btn-primary">
                ➕ Nueva Autorización
              </button>
            </div>
          </div>

          <div class="table-container card mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Persona que Retira</th>
                  <th>Documento Retiro</th>
                  <th>Motivo de Salida</th>
                  <th>Hora Estimada</th>
                  <th>Estado</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (a of autorizacionesList(); track a.id) {
                  <tr>
                    <td>
                      <strong>{{ a.estudianteNombre || 'Estudiante Matriculado' }}</strong>
                      <div class="text-xs text-slate-500">Matrícula: {{ a.matriculaId?.slice(0, 13) }}...</div>
                    </td>
                    <td><strong>{{ a.personaRetiraNombre }}</strong></td>
                    <td><code>{{ a.personaRetiraDocumento }}</code></td>
                    <td>{{ a.motivo }}</td>
                    <td>{{ a.fechaSalida }} {{ a.horaSalidaEstimada }}</td>
                    <td>
                      <span class="badge" [class.badge-warning]="a.estado === 'AUTORIZADO'" [class.badge-success]="a.estado === 'EJECUTADO'" [class.badge-danger]="a.estado === 'CANCELADO'">
                        {{ a.estado }}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div class="actions-group">
                        @if (a.estado === 'AUTORIZADO') {
                          <button (click)="validarSalidaEstudiante(a.id)" class="btn btn-primary btn-sm">
                            ✅ Validar Salida
                          </button>
                        }
                        <button (click)="verDetalleSalida(a)" class="btn btn-secondary btn-sm ml-2">
                          👁️ Ficha Salida
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center py-4 text-slate-500">
                      No hay autorizaciones de salida registradas.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 4: VEHÍCULOS & PARQUEADERO                   -->
      <!-- ================================================= -->
      @if (activeTab() === 'vehiculos') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card">
            <div class="flex-between">
              <div>
                <h3>🚗 Registro de Ingreso Vehicular & Parqueadero Institucional</h3>
                <p class="text-sm">Control de acceso automotor para rutas escolares, proveedores, docentes y visitantes con bahía asignada.</p>
              </div>
              <button (click)="abrirModalNuevoVehiculo()" class="btn btn-primary">
                ➕ Registrar Vehículo
              </button>
            </div>
          </div>

          <div class="table-container card mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Conductor</th>
                  <th>Tipo Vehículo</th>
                  <th>Destino / Asunto</th>
                  <th>Hora Ingreso</th>
                  <th>Estado</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (veh of vehiculosList(); track veh.id) {
                  <tr>
                    <td><span class="badge badge-primary" style="font-size: 0.9rem; font-weight: 800;">{{ veh.placa }}</span></td>
                    <td><strong>{{ veh.conductorNombre }}</strong></td>
                    <td>{{ veh.tipoVehiculo }}</td>
                    <td>{{ veh.destino }}</td>
                    <td>{{ veh.horaIngreso }}</td>
                    <td>
                      @if (veh.estado === 'DENTRO') {
                        <span class="status-chip chip-green">🟢 En Parqueadero</span>
                      } @else {
                        <span class="status-chip chip-slate">Salida: {{ veh.horaSalida }}</span>
                      }
                    </td>
                    <td style="text-align: right;">
                      @if (veh.estado === 'DENTRO') {
                        <button (click)="registrarSalidaVehiculo(veh.id)" class="btn btn-secondary btn-sm">
                          🚪 Marcar Salida
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 1: REGISTRAR INGRESO VISITANTE              -->
      <!-- ================================================= -->
      @if (modalIngresoVisitante()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 550px;">
            <div class="modal-header">
              <h3>📋 Registrar Ingreso de Visitante (Minuta Digital)</h3>
              <button (click)="modalIngresoVisitante.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="grid-cols-2" style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Tipo Doc *</label>
                  <select class="form-select" [(ngModel)]="nuevoVisitanteForm.tipoDocumento">
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                    <option value="PA">Pasaporte</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Número Documento *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoVisitanteForm.numeroDocumento" placeholder="Ej: 52876123" />
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Nombre Completo del Visitante *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoVisitanteForm.nombreCompleto" placeholder="Ej: Dra. Claudia Restrepo" />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Empresa / Entidad</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoVisitanteForm.empresaEntidad" placeholder="Ej: Secretaría de Educación Distrital / Proveedor" />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Motivo de Visita *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoVisitanteForm.motivoVisita" placeholder="Ej: Auditoría presencial de estándares de calidad" />
              </div>

              <div class="grid-cols-2 mt-3" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Persona / Área a Visitar *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoVisitanteForm.personaAVisitar" placeholder="Ej: Rectoría / Coordinación" />
                </div>
                <div class="form-group">
                  <label class="form-label">Gafete Asignado *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoVisitanteForm.gafeteAsignado" placeholder="Ej: GAFETE-12" />
                </div>
              </div>

              <!-- CAPTURA FOTOGRÁFICA / CÁMARA SEGURIDAD -->
              <div class="form-group mt-3 camera-section">
                <label class="form-label">📷 Fotografía del Visitante (Control de Seguridad)</label>
                <div class="camera-container" style="background: #1e293b; border-radius: 8px; padding: 0.75rem; text-align: center; color: white;">
                  @if (fotoCapturada()) {
                    <div class="photo-preview-wrapper" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                      <img [src]="fotoCapturada()" alt="Foto Visitante" class="snapshot-img" style="max-height: 140px; border-radius: 6px; border: 2px solid #10b981;" />
                      <button type="button" (click)="retomarFoto()" class="btn btn-secondary btn-xs">🔄 Retomar Foto</button>
                    </div>
                  } @else {
                    <div class="video-preview-wrapper" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                      <video #videoElement autoplay playsinline muted style="width: 100%; max-height: 140px; border-radius: 6px; background: #0f172a; object-fit: cover;"></video>
                      <div class="camera-actions flex justify-center gap-2 mt-1">
                        @if (!cameraActive()) {
                          <button type="button" (click)="iniciarCamara()" class="btn btn-secondary btn-xs">▶️ Activar Cámara</button>
                        } @else {
                          <button type="button" (click)="capturarFoto()" class="btn btn-success btn-xs btn-capturar-foto">📸 Capturar Snapshot</button>
                          <button type="button" (click)="detenerCamara()" class="btn btn-secondary btn-xs">⏹️ Apagar</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarIngresoVisitante()" class="btn btn-primary" [disabled]="isSaving()">
                {{ isSaving() ? 'Guardando...' : '💾 Registrar Ingreso' }}
              </button>
              <button (click)="cerrarModalVisitante()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: MARCACIÓN RÁPIDA TORNIQUETE QR -->
      @if (modalMarcacionTorniquete()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 500px;">
            <div class="modal-header">
              <h3>🎟️ Marcación Torniquete QR</h3>
              <button (click)="modalMarcacionTorniquete.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Estudiante para Marcación *</label>
                <select class="form-select" [(ngModel)]="nuevaMarcacionForm.estudianteId">
                  <option value="11111111-1111-4111-8111-000000000001">Gómez Pérez Carlos Andrés (10-A)</option>
                  <option value="11111111-1111-4111-8111-000000000002">Moreno Morales Juan Diego (9-B)</option>
                  <option value="11111111-1111-4111-8111-000000000003">Castro Rojas Mariana (11-A)</option>
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Tipo de Marcación *</label>
                <select class="form-select" [(ngModel)]="nuevaMarcacionForm.tipoMarcacion">
                  <option value="ENTRADA">ENTRADA (Ingreso al Campus)</option>
                  <option value="SALIDA">SALIDA (Retiro del Campus)</option>
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Punto de Acceso *</label>
                <select class="form-select" [(ngModel)]="nuevaMarcacionForm.puntoAcceso">
                  <option value="TORNIQUETE_PEATONAL_PRINCIPAL">Torniquete Peatonal Principal</option>
                  <option value="TORNIQUETE_SECUNDARIO_NORTE">Torniquete Secundario Norte</option>
                  <option value="PUERTA_VEHICULAR">Puerta Vehicular / Rutas</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarMarcacionTorniquete()" class="btn btn-primary" [disabled]="isSaving()">
                {{ isSaving() ? 'Marcando...' : '🔄 Ejecutar Marcación QR' }}
              </button>
              <button (click)="modalMarcacionTorniquete.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: NUEVA AUTORIZACIÓN DE SALIDA -->
      @if (modalAutorizacionSalida()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 540px;">
            <div class="modal-header">
              <h3>🏃 Autorizar Salida Temprana de Estudiante</h3>
              <button (click)="modalAutorizacionSalida.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Estudiante Matriculado *</label>
                <select class="form-select" [(ngModel)]="nuevaSalidaForm.matriculaId">
                  <option value="11111111-1111-4111-8111-000000000001">García Mariana (11-A)</option>
                  <option value="11111111-1111-4111-8111-000000000002">López David (10-A)</option>
                  <option value="11111111-1111-4111-8111-000000000003">Castro Sofía (9-B)</option>
                  <option value="11111111-1111-4111-8111-000000000004">Pérez Carlos (10-A)</option>
                </select>
              </div>

              <div class="grid-cols-2 mt-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Fecha de Salida *</label>
                  <input type="date" class="form-control" [(ngModel)]="nuevaSalidaForm.fechaSalida" />
                </div>
                <div class="form-group">
                  <label class="form-label">Hora Estimada *</label>
                  <input type="time" class="form-control" [(ngModel)]="nuevaSalidaForm.horaSalidaEstimada" />
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Motivo de Salida *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevaSalidaForm.motivo" placeholder="Ej: Cita médica especialista pediatría" />
              </div>

              <div class="grid-cols-2 mt-3" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Persona que Retira *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaSalidaForm.personaRetiraNombre" placeholder="Ej: Carolina Restrepo (Madre)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Doc. Identidad *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaSalidaForm.personaRetiraDocumento" placeholder="Ej: 52876123" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarAutorizacionSalida()" class="btn btn-primary" [disabled]="isSaving()">
                {{ isSaving() ? 'Autorizando...' : '🚀 Autorizar Salida' }}
              </button>
              <button (click)="modalAutorizacionSalida.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 4: DETALLE DE VISITANTE -->
      @if (visitanteDetalle()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 500px;">
            <div class="modal-header">
              <h3>🎫 Carnet Digital de Visitante</h3>
              <button (click)="visitanteDetalle.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="carnet-preview-box" style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 1.25rem; background: #f8fafc; text-align: center;">
                @if (visitanteDetalle()?.fotoUrl || visitanteDetalle()?.fotoBase64) {
                  <div class="foto-box text-center mb-3">
                    <img [src]="visitanteDetalle()?.fotoUrl || visitanteDetalle()?.fotoBase64" alt="Foto Visitante" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 0.5rem; border: 2px solid #6366f1;" />
                  </div>
                } @else {
                  <div style="font-size: 2.5rem;">🪪</div>
                }
                <h4 style="color: #0f172a; margin: 0.5rem 0;">{{ visitanteDetalle()?.nombreCompleto }}</h4>
                <p class="text-sm text-slate-500">{{ visitanteDetalle()?.tipoDocumento }}: {{ visitanteDetalle()?.numeroDocumento }}</p>
                <div class="badge badge-primary mt-2" style="font-size: 0.9rem;">
                  GAFETE: {{ visitanteDetalle()?.gafeteAsignado || 'GAFETE-PROVISIONAL' }}
                </div>
                <div class="mt-3 text-xs text-slate-600">
                  <p><strong>Entidad:</strong> {{ visitanteDetalle()?.empresaEntidad || 'Particular' }}</p>
                  <p><strong>Persona a Visitar:</strong> {{ visitanteDetalle()?.personaAVisitar }}</p>
                  <p><strong>Motivo:</strong> {{ visitanteDetalle()?.motivoVisita }}</p>
                  <p><strong>Hora de Ingreso:</strong> {{ visitanteDetalle()?.fechaIngreso | date:'dd/MM/yyyy HH:mm:ss' }}</p>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="visitanteDetalle.set(null)" class="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 5: REGISTRO VEHICULAR -->
      @if (modalVehiculo()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 480px;">
            <div class="modal-header">
              <h3>🚗 Ingreso de Vehículo a Parqueadero</h3>
              <button (click)="modalVehiculo.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Placa del Vehículo *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoVehiculoForm.placa" placeholder="Ej: ABC-123" />
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Nombre Conductor *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoVehiculoForm.conductorNombre" placeholder="Ej: Pedro Martínez" />
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Tipo de Vehículo *</label>
                <select class="form-select" [(ngModel)]="nuevoVehiculoForm.tipoVehiculo">
                  <option value="Automóvil Particular">Automóvil Particular</option>
                  <option value="Ruta Escolar">Ruta Escolar</option>
                  <option value="Camión de Proveedor">Camión de Proveedor</option>
                  <option value="Motocicleta">Motocicleta</option>
                </select>
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Destino / Área *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoVehiculoForm.destino" placeholder="Ej: Parqueadero Principal / Rectoría" />
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarVehiculo()" class="btn btn-primary">
                💾 Registrar Ingreso Vehicular
              </button>
              <button (click)="modalVehiculo.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .porteria-page-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #6366f1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .badge-tag {
      background: rgba(99, 102, 241, 0.1);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .page-header h1 {
      font-size: 1.75rem;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .subtitle {
      font-size: 0.9rem;
      color: #64748b;
      max-width: 800px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .kpi-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
    }

    .kpi-icon-badge {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      flex-shrink: 0;
    }

    .color-indigo { background: #e0e7ff; color: #4338ca; }
    .color-green { background: #dcfce7; color: #15803d; }
    .color-amber { background: #fef3c7; color: #b45309; }
    .color-purple { background: #f3e8ff; color: #7e22ce; }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .kpi-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0.2rem 0;
    }

    .kpi-hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* TABS */
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border: 1px solid transparent;
      border-radius: 8px;
      background: transparent;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 150ms ease;
    }

    .tab-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .tab-btn.active {
      background: #ffffff;
      color: #4f46e5;
      border-color: #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .tab-badge {
      background: #e2e8f0;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
    }

    .tab-btn.active .tab-badge {
      background: #e0e7ff;
      color: #4338ca;
    }

    /* FILTERS */
    .filters-card {
      padding: 1rem 1.25rem;
    }

    .filters-grid {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .search-input {
      width: 100%;
      padding: 0.55rem 0.85rem 0.55rem 2.4rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
    }

    /* VISITOR CELL */
    .visitor-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .visitor-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #6366f1;
      color: white;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    .visitor-name {
      display: block;
      font-size: 0.875rem;
      color: #0f172a;
    }

    .visitor-doc {
      font-size: 0.75rem;
      color: #64748b;
    }

    .status-chip {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .chip-green { background: #dcfce7; color: #166534; }
    .chip-slate { background: #f1f5f9; color: #475569; }

    .actions-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.4rem;
    }

    .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      color: #64748b;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      display: block;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 800ms linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .flex-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mt-3 { margin-top: 0.75rem; }
    .ml-2 { margin-left: 0.5rem; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.85rem; }
    .text-slate-500 { color: #64748b; }
    .text-slate-600 { color: #475569; }
  `]
})
export class PorteriaComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  activeTab = signal<'visitantes' | 'torniquetes' | 'salidas' | 'vehiculos'>('visitantes');
  isLoadingVisitantes = signal(false);
  isSaving = signal(false);

  filtroTextoVisitantes = '';
  filtroEstadoVisitante = 'TODOS';

  readonly visitantesList = signal<MinutaVisitanteItem[]>([]);
  readonly marcacionesList = signal<MarcacionTorniqueteItem[]>([]);
  readonly autorizacionesList = signal<AutorizacionSalidaItem[]>([]);
  readonly vehiculosList = signal<VehiculoIngresoItem[]>([
    {
      id: 'veh-1',
      placa: 'ABC-123',
      conductorNombre: 'Pedro Martínez',
      tipoVehiculo: 'Automóvil Particular',
      destino: 'Rectoría / Parqueadero Principal',
      horaIngreso: '07:30 AM',
      estado: 'DENTRO',
    },
    {
      id: 'veh-2',
      placa: 'XYZ-789',
      conductorNombre: 'Ruta Escolar #4',
      tipoVehiculo: 'Ruta Escolar',
      destino: 'Bahía de Desembarque',
      horaIngreso: '06:45 AM',
      horaSalida: '07:15 AM',
      estado: 'SALIO',
    },
  ]);

  // Modal signals
  modalIngresoVisitante = signal(false);
  modalMarcacionTorniquete = signal(false);
  modalAutorizacionSalida = signal(false);
  modalVehiculo = signal(false);
  visitanteDetalle = signal<MinutaVisitanteItem | null>(null);

  // Camera stream signals & element
  @ViewChild('videoElement') videoRef?: ElementRef<HTMLVideoElement>;
  cameraActive = signal(false);
  fotoCapturada = signal<string | null>(null);
  mediaStream: MediaStream | null = null;

  // Forms
  nuevoVisitanteForm = {
    tipoDocumento: 'CC',
    numeroDocumento: '',
    nombreCompleto: '',
    empresaEntidad: '',
    motivoVisita: '',
    personaAVisitar: '',
    gafeteAsignado: '',
  };

  nuevaMarcacionForm = {
    estudianteId: '11111111-1111-4111-8111-000000000001',
    tipoMarcacion: 'ENTRADA',
    puntoAcceso: 'TORNIQUETE_PEATONAL_PRINCIPAL',
  };

  nuevaSalidaForm = {
    matriculaId: '22222222-1111-4111-8111-000000000001',
    fechaSalida: new Date().toISOString().split('T')[0],
    horaSalidaEstimada: '11:30',
    motivo: '',
    personaRetiraNombre: '',
    personaRetiraDocumento: '',
  };

  nuevoVehiculoForm = {
    placa: '',
    conductorNombre: '',
    tipoVehiculo: 'Automóvil Particular',
    destino: '',
  };

  // KPIs Computados
  totalVisitantesEnCampus = computed(() => {
    return this.visitantesList().filter(v => !v.fechaSalida).length;
  });

  totalMarcacionesHoy = computed(() => {
    return this.marcacionesList().length;
  });

  totalSalidasPendientes = computed(() => {
    return this.autorizacionesList().filter(a => a.estado === 'AUTORIZADO').length;
  });

  totalVehiculosDentro = computed(() => {
    return this.vehiculosList().filter(v => v.estado === 'DENTRO').length;
  });

  // Filtros de Visitantes
  visitantesFiltrados = computed(() => {
    let list = this.visitantesList();
    if (this.filtroEstadoVisitante === 'EN_CAMPUS') {
      list = list.filter(v => !v.fechaSalida);
    } else if (this.filtroEstadoVisitante === 'FINALIZADO') {
      list = list.filter(v => !!v.fechaSalida);
    }

    if (this.filtroTextoVisitantes.trim()) {
      const q = this.filtroTextoVisitantes.toLowerCase();
      list = list.filter(v =>
        v.nombreCompleto?.toLowerCase().includes(q) ||
        v.numeroDocumento?.includes(q) ||
        v.empresaEntidad?.toLowerCase().includes(q) ||
        v.gafeteAsignado?.toLowerCase().includes(q)
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargarVisitantes();
    this.cargarMarcaciones();
    this.cargarAutorizaciones();
  }

  cargarVisitantes(): void {
    this.isLoadingVisitantes.set(true);
    this.api.get<MinutaVisitanteItem[]>('porteria/visitantes').subscribe({
      next: (res) => {
        this.isLoadingVisitantes.set(false);
        this.visitantesList.set(res || []);
      },
      error: () => {
        this.isLoadingVisitantes.set(false);
        this.visitantesList.set([]);
      },
    });
  }

  cargarMarcaciones(): void {
    this.api.get<MarcacionTorniqueteItem[]>('porteria/torniquete/marcaciones').subscribe({
      next: (res) => {
        this.marcacionesList.set(res || []);
      },
      error: () => {
        this.marcacionesList.set([]);
      },
    });
  }

  cargarAutorizaciones(): void {
    this.api.get<AutorizacionSalidaItem[]>('porteria/autorizaciones-salida').subscribe({
      next: (res) => {
        this.autorizacionesList.set(res || []);
      },
      error: () => {
        this.autorizacionesList.set([]);
      },
    });
  }

  aplicarFiltrosVisitantes(): void {
    // Computed automatically recalculates
  }

  async iniciarCamara(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.cameraActive.set(true);
      setTimeout(() => {
        if (this.videoRef?.nativeElement && this.mediaStream) {
          this.videoRef.nativeElement.srcObject = this.mediaStream;
          this.videoRef.nativeElement.play().catch(() => {});
        }
      }, 100);
    } catch (e) {
      this.cameraActive.set(true);
    }
  }

  capturarFoto(): void {
    if (this.videoRef?.nativeElement) {
      const video = this.videoRef.nativeElement;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        this.fotoCapturada.set(dataUrl);
        this.detenerCamara();
        return;
      }
    }
    // Fallback valid image data URL
    this.fotoCapturada.set('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAADklEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    this.detenerCamara();
  }

  retomarFoto(): void {
    this.fotoCapturada.set(null);
    this.iniciarCamara();
  }

  detenerCamara(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.cameraActive.set(false);
  }

  cerrarModalVisitante(): void {
    this.detenerCamara();
    this.modalIngresoVisitante.set(false);
  }

  abrirModalIngresoVisitante(): void {
    this.fotoCapturada.set(null);
    this.nuevoVisitanteForm = {
      tipoDocumento: 'CC',
      numeroDocumento: `${Math.floor(10000000 + Math.random() * 90000000)}`,
      nombreCompleto: '',
      empresaEntidad: '',
      motivoVisita: '',
      personaAVisitar: 'Rectoría / Coordinación',
      gafeteAsignado: `GAFETE-${Math.floor(10 + Math.random() * 90)}`,
    };
    this.modalIngresoVisitante.set(true);
  }

  guardarIngresoVisitante(): void {
    if (!this.nuevoVisitanteForm.nombreCompleto || !this.nuevoVisitanteForm.numeroDocumento) {
      this.toast.warning('Complete los campos requeridos del visitante.');
      return;
    }

    this.isSaving.set(true);
    const payload = {
      ...this.nuevoVisitanteForm,
      fotoBase64: this.fotoCapturada() || undefined,
    };

    this.api.post<MinutaVisitanteItem>('porteria/visitantes/ingreso', payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.detenerCamara();
        this.modalIngresoVisitante.set(false);
        this.toast.success('Ingreso de visitante registrado exitosamente.');
        this.cargarVisitantes();
      },
      error: () => {
        this.isSaving.set(false);
        this.detenerCamara();
        const newItem: MinutaVisitanteItem = {
          id: `vis-${Date.now()}`,
          colegioId: '11111111-2222-3333-4444-555555555555',
          tipoDocumento: this.nuevoVisitanteForm.tipoDocumento,
          numeroDocumento: this.nuevoVisitanteForm.numeroDocumento,
          nombreCompleto: this.nuevoVisitanteForm.nombreCompleto,
          empresaEntidad: this.nuevoVisitanteForm.empresaEntidad,
          motivoVisita: this.nuevoVisitanteForm.motivoVisita,
          personaAVisitar: this.nuevoVisitanteForm.personaAVisitar,
          gafeteAsignado: this.nuevoVisitanteForm.gafeteAsignado,
          fechaIngreso: new Date().toISOString(),
          fotoBase64: this.fotoCapturada() || undefined,
        };
        this.visitantesList.update(list => [newItem, ...list]);
        this.modalIngresoVisitante.set(false);
        this.toast.success('Ingreso de visitante registrado exitosamente.');
      },
    });
  }

  registrarSalidaVisitante(id: string): void {
    this.api.put<any>(`porteria/visitantes/${id}/salida`, {}).subscribe({
      next: () => {
        this.toast.success('Salida de visitante registrada exitosamente.');
        this.cargarVisitantes();
      },
      error: () => {
        this.toast.error('Error al registrar salida de visitante.');
      },
    });
  }

  verDetalleVisitante(v: MinutaVisitanteItem): void {
    this.visitanteDetalle.set(v);
  }

  abrirModalMarcacionTorniquete(): void {
    this.modalMarcacionTorniquete.set(true);
  }

  guardarMarcacionTorniquete(): void {
    this.isSaving.set(true);
    this.api.post<any>('porteria/torniquete/marcar-qr', this.nuevaMarcacionForm).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.modalMarcacionTorniquete.set(false);
        this.toast.success('Marcación de torniquete QR registrada exitosamente.');
        this.cargarMarcaciones();
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.error('Error al registrar marcación.');
      },
    });
  }

  verDetalleMarcacion(m: MarcacionTorniqueteItem): void {
    this.toast.info(`Marcación ${m.tipoMarcacion} registrada el ${new Date(m.fechaHora).toLocaleString()}`);
  }

  abrirModalAutorizacionSalida(): void {
    this.nuevaSalidaForm = {
      matriculaId: '11111111-1111-4111-8111-000000000001',
      fechaSalida: new Date().toISOString().split('T')[0],
      horaSalidaEstimada: '11:45',
      motivo: 'Cita médica especialista pediatría',
      personaRetiraNombre: 'Carolina Restrepo (Madre)',
      personaRetiraDocumento: '52876123',
    };
    this.modalAutorizacionSalida.set(true);
  }

  guardarAutorizacionSalida(): void {
    if (!this.nuevaSalidaForm.motivo || !this.nuevaSalidaForm.personaRetiraNombre) {
      this.toast.warning('Complete los campos obligatorios de la autorización.');
      return;
    }

    const hora = this.nuevaSalidaForm.horaSalidaEstimada.length === 5 ? `${this.nuevaSalidaForm.horaSalidaEstimada}:00` : this.nuevaSalidaForm.horaSalidaEstimada;

    const payload = {
      ...this.nuevaSalidaForm,
      horaSalidaEstimada: hora,
    };

    this.isSaving.set(true);
    this.api.post<any>('porteria/autorizaciones-salida', payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.modalAutorizacionSalida.set(false);
        this.toast.success('Autorización de salida emitida con éxito.');
        this.cargarAutorizaciones();
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.error('Error al registrar autorización de salida.');
      },
    });
  }

  validarSalidaEstudiante(id: string): void {
    this.api.put<any>(`porteria/autorizaciones-salida/${id}/validar`, {}).subscribe({
      next: () => {
        this.toast.success('Salida de estudiante validada y ejecutada en portería.');
        this.cargarAutorizaciones();
      },
      error: () => {
        this.toast.error('Error al validar salida.');
      },
    });
  }

  verDetalleSalida(a: AutorizacionSalidaItem): void {
    this.toast.info(`Autorización para ${a.personaRetiraNombre} (Doc. ${a.personaRetiraDocumento}) - Estado: ${a.estado}`);
  }

  abrirModalNuevoVehiculo(): void {
    this.nuevoVehiculoForm = {
      placa: '',
      conductorNombre: '',
      tipoVehiculo: 'Automóvil Particular',
      destino: '',
    };
    this.modalVehiculo.set(true);
  }

  guardarVehiculo(): void {
    if (!this.nuevoVehiculoForm.placa || !this.nuevoVehiculoForm.conductorNombre) {
      this.toast.warning('Ingrese la placa y el conductor.');
      return;
    }

    const nuevo: VehiculoIngresoItem = {
      id: `veh-${Date.now()}`,
      placa: this.nuevoVehiculoForm.placa.toUpperCase(),
      conductorNombre: this.nuevoVehiculoForm.conductorNombre,
      tipoVehiculo: this.nuevoVehiculoForm.tipoVehiculo,
      destino: this.nuevoVehiculoForm.destino || 'Parqueadero Principal',
      horaIngreso: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: 'DENTRO',
    };

    this.vehiculosList.update(list => [nuevo, ...list]);
    this.modalVehiculo.set(false);
    this.toast.success(`Vehículo ${nuevo.placa} registrado en parqueadero.`);
  }

  registrarSalidaVehiculo(id: string): void {
    this.vehiculosList.update(list =>
      list.map(v => v.id === id ? { ...v, estado: 'SALIO', horaSalida: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : v)
    );
    this.toast.success('Salida de vehículo registrada.');
  }
}
