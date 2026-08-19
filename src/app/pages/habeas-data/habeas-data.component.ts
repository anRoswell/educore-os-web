import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';
import { SearchableSelectComponent, SearchableOption } from '../../shared/components/searchable-select.component';
import {
  InstitutionalResponseModalComponent,
  PredefinedTemplate,
  InstitutionalResponseData,
} from '../../shared/components/institutional-response-modal.component';
import {
  RevocationPromptModalComponent,
  RevocationData,
} from '../../shared/components/revocation-prompt-modal.component';
import { ModalSolicitudArcoComponent } from '../../shared/components/modal-solicitud-arco.component';

export interface ConsentimientoItem {
  id: string;
  matricula_id: string;
  estudiante_id?: string;
  politica_version?: string;
  acudiente_nombre: string;
  acudiente_documento: string;
  acudiente_parentesco: string;
  acudiente_email?: string;
  acudiente_telefono?: string;
  autoriza_datos_sensibles: boolean;
  autoriza_uso_imagen_fotografia?: boolean;
  autoriza_plataformas_virtuales?: boolean;
  autoriza_grabacion_clases?: boolean;
  autoriza_compartir_eps_seguros?: boolean;
  autoriza_fotos_videos?: boolean;
  autoriza_plataformas_terceros?: boolean;
  hash_integridad_sha256: string;
  canal_aceptacion?: string;
  fecha_aceptacion?: string;
  ip_registro?: string;
  created_at?: string;
  tipo_firma?: 'PRESENCIAL' | 'ELECTRONICA';
  estado: string;
  motivo_revocacion?: string;
  observaciones?: string;
  firma_digital_url?: string;
  historial_versiones?: any[];
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  numero_documento?: string;
  tipo_documento?: string;
  grado_nombre?: string;
  grupo_nombre?: string;
}

export interface SolicitudArcoItem {
  id: string;
  matricula_id: string;
  estudiante_id?: string;
  tipo_derecho: string;
  radicado?: string;
  radicado_numero?: string;
  solicitante_nombre: string;
  solicitante_documento: string;
  solicitante_parentesco?: string;
  solicitante_email?: string;
  solicitante_telefono?: string;
  descripcion_solicitud: string;
  fecha_radicacion?: string;
  fecha_solicitud?: string;
  fecha_limite_legal?: string;
  fecha_limite_respuesta?: string;
  estado: string;
  respuesta_institucional?: string;
  respuesta_oficial?: string;
  fecha_respuesta?: string;
  usuario_respuesta_id?: string;
  evidencias_urls?: string[];
  anexo_soporte_url?: string;
  primer_nombre?: string;
  primer_apellido?: string;
  numero_documento?: string;
  estudiante_nombre_completo?: string;
  estudiante_documento?: string;
}

@Component({
  selector: 'app-habeas-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SearchableSelectComponent,
    InstitutionalResponseModalComponent,
    RevocationPromptModalComponent,
    ModalSolicitudArcoComponent,
  ],
  template: `
    <div class="habeas-page animate-fade-in">
      <!-- HEADER PRINCIPAL -->
      <div class="page-header">
        <div>
          <div class="header-badge">
            <span>⚖️ LEY 1581 DE 2012 & RNBD SIC</span>
            <span class="badge-tag">PROTECCIÓN DE MENORES</span>
          </div>
          <h1>Protección de Datos & Habeas Data</h1>
          <p class="subtitle">
            Gestión de consentimientos informados digitales, autorizaciones de imagen y carnetización, trazabilidad criptográfica SHA-256 y Registro Nacional de Bases de Datos (SIC).
          </p>
        </div>

        <div class="header-actions">
          <button (click)="abrirModalNuevoConsentimiento()" class="btn btn-primary shadow-glow">
            <span>✍️ Registrar Consentimiento Digital</span>
          </button>
        </div>
      </div>

      <!-- KPIS INSTITUCIONALES RNBD (SIC) -->
      <div class="kpi-grid">
        <div class="kpi-card card">
          <div class="kpi-icon-badge color-sky">
            <span>📜</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Consentimientos Vigentes</span>
            <h3 class="kpi-value">{{ estadisticas().consentimientosFirmados }}</h3>
            <span class="kpi-hint">De {{ estadisticas().totalEstudiantes }} matriculados</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-green">
            <span>🛡️</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Cumplimiento RNBD</span>
            <h3 class="kpi-value">{{ estadisticas().porcentajeCumplimiento }}%</h3>
            <span class="kpi-hint">Cobertura ante la SIC</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-purple">
            <span>📸</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Autorización Imagen</span>
            <h3 class="kpi-value">{{ estadisticas().autorizaciones?.autorizan_imagen || 0 }}</h3>
            <span class="kpi-hint">Carnets & publicaciones</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-amber">
            <span>⚖️</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Solicitudes ARCO</span>
            <h3 class="kpi-value">{{ estadisticas().solicitudesArcoPendientes }}</h3>
            <span class="kpi-hint">Pendientes de trámite</span>
          </div>
        </div>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'consentimientos'"
          (click)="activeTab.set('consentimientos')"
        >
          <span>✍️ Consentimientos por Matrícula</span>
          <span class="tab-badge">{{ consentimientosList().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'rnbd-sic'"
          (click)="activeTab.set('rnbd-sic')"
        >
          <span>🏛️ RNBD & Auditoría SIC</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'derechos-arco'"
          (click)="activeTab.set('derechos-arco')"
        >
          <span>⚖️ Derechos ARCO</span>
          @if (solicitudesArcoList().length > 0) {
            <span class="tab-badge badge-warning">{{ solicitudesArcoList().length }}</span>
          }
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'politica'"
          (click)="activeTab.set('politica')"
        >
          <span>📋 Política Institucional (DPO)</span>
        </button>
      </div>

      <!-- ================================================= -->
      <!-- TAB 1: CONSENTIMIENTOS INFORMADOS POR MATRÍCULA  -->
      <!-- ================================================= -->
      @if (activeTab() === 'consentimientos') {
        <div class="tab-content animate-fade-in">
          <!-- BARRA DE BÚSQUEDA Y FILTROS -->
          <div class="filters-card card">
            <div class="filters-grid">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input
                  type="text"
                  class="search-input"
                  placeholder="Buscar por estudiante, documento, acudiente o código hash SHA-256..."
                  [(ngModel)]="filtroTexto"
                  (input)="aplicarFiltros()"
                />
              </div>

              <div class="filter-group">
                <label>Estado:</label>
                <select class="form-select" [(ngModel)]="filtroEstado" (change)="cargarConsentimientos()">
                  <option value="TODOS">Todos los Estados</option>
                  <option value="VIGENTE">Vigente</option>
                  <option value="REVOCADO">Revocado</option>
                  <option value="ACTUALIZADO">Actualizado</option>
                </select>
              </div>
            </div>
          </div>

          <!-- TABLA DE CONSENTIMIENTOS -->
          <div class="table-container card">
            @if (isLoading()) {
              <div class="empty-state">
                <div class="spinner"></div>
                <p>Consultando consentimientos informados en base de datos...</p>
              </div>
            } @else if (consentimientosFiltrados().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">⚖️</span>
                <h3>No hay consentimientos registrados</h3>
                <p>No se encontraron consentimientos con los criterios actuales. Puede radicar el primero con el botón superior.</p>
                <button (click)="abrirModalNuevoConsentimiento()" class="btn btn-primary mt-3">
                  Registrar Primer Consentimiento
                </button>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Estudiante & Grado</th>
                    <th>Acudiente / Representante</th>
                    <th>Permisos Granulares (Ley 1581)</th>
                    <th>Hash SHA-256 (SIC)</th>
                    <th>Fecha & Canal</th>
                    <th>Estado</th>
                    <th style="text-align: right;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of consentimientosFiltrados(); track c.id) {
                    <tr>
                      <td>
                        <div class="student-cell">
                          <div class="student-avatar">
                            {{ c.primer_nombre?.charAt(0) }}{{ c.primer_apellido?.charAt(0) }}
                          </div>
                          <div>
                            <span class="student-name">
                              {{ c.primer_apellido }} {{ c.segundo_apellido || '' }} {{ c.primer_nombre }} {{ c.segundo_nombre || '' }}
                            </span>
                            <span class="student-doc">
                              {{ c.tipo_documento }} {{ c.numero_documento }} • {{ c.grado_nombre }} ({{ c.grupo_nombre }})
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{{ c.acudiente_nombre }}</strong>
                        <div class="text-xs text-muted">{{ c.acudiente_documento }} • {{ c.acudiente_parentesco }}</div>
                      </td>

                      <td>
                        <div class="permissions-chips">
                          <span class="perm-chip" [class.active]="c.autoriza_datos_sensibles" title="Datos Sensibles para función pedagógica">
                            {{ c.autoriza_datos_sensibles ? '✓ Datos' : '✗ Datos' }}
                          </span>
                          <span class="perm-chip" [class.active]="c.autoriza_uso_imagen_fotografia" title="Fotos, Carnet y Publicaciones">
                            {{ c.autoriza_uso_imagen_fotografia ? '📸 Foto' : '✗ Foto' }}
                          </span>
                          <span class="perm-chip" [class.active]="c.autoriza_plataformas_virtuales" title="Plataformas LMS y TI">
                            {{ c.autoriza_plataformas_virtuales ? '💻 LMS' : '✗ LMS' }}
                          </span>
                          <span class="perm-chip" [class.active]="c.autoriza_grabacion_clases" title="Grabación de Clases">
                            {{ c.autoriza_grabacion_clases ? '📹 Video' : '✗ Video' }}
                          </span>
                          <span class="perm-chip" [class.active]="c.autoriza_compartir_eps_seguros" title="Póliza Estudiantil">
                            {{ c.autoriza_compartir_eps_seguros ? '🩺 Seguro' : '✗ Seguro' }}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div class="hash-box" (click)="copiarHash(c.hash_integridad_sha256)" title="Haga clic para copiar Hash SHA-256">
                          <code>{{ c.hash_integridad_sha256 | slice:0:12 }}...</code>
                          <span class="copy-icon">📋</span>
                        </div>
                      </td>

                      <td>
                        <span class="text-xs">{{ c.fecha_aceptacion | date:'shortDate' }}</span>
                        <div class="text-xs text-muted">{{ c.canal_aceptacion }}</div>
                      </td>

                      <td>
                        <span class="status-pill" [ngClass]="'status-' + c.estado.toLowerCase()">
                          {{ c.estado }}
                        </span>
                      </td>

                      <td style="text-align: right;">
                        <div class="actions-group">
                          <button
                            (click)="verDetalleConsentimiento(c)"
                            class="btn-icon"
                            title="Ver Certificado 360°"
                          >
                            👁️
                          </button>
                          <button
                            (click)="descargarPdfConsentimiento(c.id)"
                            class="btn-icon btn-pdf"
                            title="Descargar Certificado Oficial en PDF (SIC)"
                          >
                            📄 PDF
                          </button>
                          @if (c.estado === 'VIGENTE') {
                            <button
                              (click)="abrirModalRevocar(c)"
                              class="btn-icon text-danger"
                              title="Revocar o Limitar Consentimiento"
                            >
                              🚫
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
      <!-- TAB 2: RNBD & AUDITORÍA SIC                      -->
      <!-- ================================================= -->
      @if (activeTab() === 'rnbd-sic') {
        <div class="tab-content animate-fade-in">
          <div class="rnbd-grid">
            <!-- Tarjeta Informativa RNBD -->
            <div class="card p-4 border-subtle">
              <span class="audit-badge">🏛️ REGISTRO NACIONAL DE BASES DE DATOS — SIC</span>
              <h3 class="mt-2">Bases de Datos Institucionales Declaradas</h3>
              <p class="text-sm text-muted">
                Registro de inventario de bases de datos que contienen datos personales de menores de edad y familias, en cumplimiento de la Circular 002 de la SIC.
              </p>

              <div class="rnbd-bases-list mt-3">
                <div class="rnbd-base-item">
                  <div class="flex-between">
                    <strong>1. Base de Datos de Estudiantes y Matrículas</strong>
                    <span class="badge badge-success">RNBD Activo</span>
                  </div>
                  <p class="text-xs text-muted">Datos de identificación, datos sensibles de salud, dirección, teléfono y registro de notas.</p>
                </div>

                <div class="rnbd-base-item">
                  <div class="flex-between">
                    <strong>2. Base de Datos de Bienestar & Historias Psicopedagógicas</strong>
                    <span class="badge badge-success">RNBD Activo</span>
                  </div>
                  <p class="text-xs text-muted">Remisiones de orientación, conceptos clínicos y planes individuales de ajustes razonables (PIAR).</p>
                </div>

                <div class="rnbd-base-item">
                  <div class="flex-between">
                    <strong>3. Base de Datos de Padres y Acudientes</strong>
                    <span class="badge badge-success">RNBD Activo</span>
                  </div>
                  <p class="text-xs text-muted">Datos de contacto de acudientes legales, compromisos de corresponsabilidad y facturación.</p>
                </div>

                <div class="rnbd-base-item">
                  <div class="flex-between">
                    <strong>4. Base de Datos de Talento Humano y Docentes</strong>
                    <span class="badge badge-success">RNBD Activo</span>
                  </div>
                  <p class="text-xs text-muted">Hojas de vida, contratos laborales, afiliaciones al SGSSS y liquidación de nómina.</p>
                </div>
              </div>
            </div>

            <!-- Trazabilidad y Logs Inmutables -->
            <div class="card p-4 border-subtle">
              <h3>🔒 Trazabilidad y Logs de Auditoría (No Repudio)</h3>
              <p class="text-sm text-muted">Registro inmutable de accesos, consentimientos y eventos de seguridad sobre datos sensibles.</p>

              <div class="audit-logs-list mt-3">
                @if (estadisticas().ultimosLogsRnbd?.length === 0) {
                  <div class="empty-state p-3">
                    <p class="text-sm text-muted">No se registran eventos de auditoría recientes.</p>
                  </div>
                } @else {
                  @for (log of estadisticas().ultimosLogsRnbd; track log.id) {
                    <div class="audit-log-item">
                      <div class="flex-between">
                        <span class="log-action">{{ log.accion }}</span>
                        <span class="text-xs text-muted">{{ log.fecha_evento | date:'short' }}</span>
                      </div>
                      <p class="log-detail">{{ log.detalles }}</p>
                      <div class="log-footer">
                        <span>BD: {{ log.tipo_base_datos }}</span> • <span>IP: {{ log.ip_origen }}</span>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 3: DERECHOS ARCO                             -->
      <!-- ================================================= -->
      @if (activeTab() === 'derechos-arco') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card">
            <div class="flex-between">
              <div>
                <h3>⚖️ Gestión de Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)</h3>
                <p class="text-sm">Canal oficial para tramitar solicitudes de titulares y acudientes según la Ley 1581 de 2012 (Término legal: 15 días hábiles).</p>
              </div>
              <button (click)="abrirModalNuevaSolicitudArco()" class="btn btn-primary">
                ➕ Radicar Solicitud ARCO
              </button>
            </div>
          </div>

          <div class="table-container card mt-4">
            @if (solicitudesArcoList().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">⚖️</span>
                <h3>Sin Solicitudes ARCO Radicadas</h3>
                <p>No existen peticiones de rectificación o supresión de datos pendientes de trámite.</p>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Radicado</th>
                    <th>Solicitante / Acudiente</th>
                    <th>Tipo de Derecho</th>
                    <th>Descripción de la Petición</th>
                    <th>Límite de Respuesta</th>
                    <th>Estado</th>
                    <th style="text-align: right;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of solicitudesArcoList(); track s.id) {
                    <tr>
                      <td>
                        <strong>{{ s.radicado_numero }}</strong>
                        <div class="text-xs text-muted">{{ s.fecha_radicacion | date:'shortDate' }}</div>
                      </td>
                      <td>
                        <strong>{{ s.solicitante_nombre }}</strong>
                        <div class="text-xs text-muted">{{ s.solicitante_email }} • {{ s.solicitante_documento }}</div>
                      </td>
                      <td>
                        <span class="badge badge-primary">{{ s.tipo_derecho }}</span>
                      </td>
                      <td>
                        <span class="text-sm">{{ s.descripcion_solicitud | slice:0:70 }}...</span>
                      </td>
                      <td>
                        <span class="text-xs text-danger font-bold">{{ s.fecha_limite_respuesta || '15 días' }}</span>
                      </td>
                      <td>
                        <span class="status-pill" [ngClass]="'status-' + s.estado.toLowerCase()">
                          {{ s.estado }}
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <button (click)="abrirModalResponderArco(s)" class="btn btn-secondary btn-sm">
                          ✍️ Responder
                        </button>
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
      <!-- TAB 4: POLÍTICA INSTITUCIONAL (DPO)              -->
      <!-- ================================================= -->
      @if (activeTab() === 'politica') {
        <div class="tab-content animate-fade-in">
          <div class="card p-4 border-subtle">
            <div class="flex-between">
              <div>
                <span class="audit-badge">VIGENCIA: VERSIÓN {{ politicaVigente()?.version || '1.0' }}</span>
                <h2>{{ politicaVigente()?.titulo }}</h2>
                <p class="text-sm text-muted">Oficial de Privacidad: {{ politicaVigente()?.oficial_privacidad }} • Contacto DPO: {{ politicaVigente()?.email_contacto_dpo }}</p>
              </div>
            </div>

            <div class="policy-content-box mt-4">
              <p>{{ politicaVigente()?.contenidoHtml }}</p>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 1: NUEVO CONSENTIMIENTO INFORMADO DIGITAL   -->
      <!-- ================================================= -->
      @if (modalNuevoConsentimiento()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoConsentimiento')">
          <div class="modal-card card card-glass modal-wide">
            <div class="modal-header">
              <div>
                <span class="modal-subtitle">LEY 1581 DE 2012 — CONSENTIMIENTO INFORMADO</span>
                <h3>✍️ Radicar Consentimiento Digital de Acudiente</h3>
              </div>
              <button (click)="cerrarModalNuevoConsentimiento()" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="modal-form-grid">
                <!-- Selector de Estudiante Matriculado -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Seleccionar Estudiante Matriculado *</label>
                  <app-searchable-select
                    [options]="estudiantesSelectOptions()"
                    [(ngModel)]="nuevoConsentForm.matriculaId"
                    (selectionChange)="onEstudianteSeleccionado($event)"
                    placeholder="Buscar estudiante por apellido, nombre o documento..."
                    searchPlaceholder="Escriba el nombre del estudiante..."
                  ></app-searchable-select>
                </div>

                <!-- Datos del Acudiente -->
                <div class="form-group">
                  <label class="form-label">Nombre del Padre / Madre / Acudiente *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoConsentForm.acudienteNombre" />
                </div>

                <div class="form-group">
                  <label class="form-label">Documento de Identidad del Acudiente *</label>
                  <input type="text" class="form-control" placeholder="CC. 1023456789" [(ngModel)]="nuevoConsentForm.acudienteDocumento" />
                </div>

                <div class="form-group">
                  <label class="form-label">Parentesco *</label>
                  <input type="text" class="form-control" placeholder="Madre / Padre / Tutor Legal" [(ngModel)]="nuevoConsentForm.acudienteParentesco" />
                </div>

                <div class="form-group">
                  <label class="form-label">Correo Electrónico de Contacto</label>
                  <input type="email" class="form-control" placeholder="correo@acudiente.com" [(ngModel)]="nuevoConsentForm.acudienteEmail" />
                </div>

                <!-- AUTORIZACIONES GRANULARES CHECKBOXES -->
                <div class="form-group" style="grid-column: span 2;">
                  <h4 class="mt-2 mb-2">Cláusulas de Autorización Expresa (Ley 1581 / Dec. 1377):</h4>

                  <div class="checkbox-clause">
                    <input type="checkbox" id="authSensibles" [(ngModel)]="nuevoConsentForm.autorizaDatosSensibles" />
                    <label for="authSensibles">
                      <strong>1. Tratamiento de Datos Personales y Sensibles (Obligatorio para la Matrícula):</strong>
                      <span class="text-xs text-muted block">Autorizo el tratamiento de datos académicos, de salud escolar y convivenciales con fines estrictamente formativos.</span>
                    </label>
                  </div>

                  <div class="checkbox-clause">
                    <input type="checkbox" id="authImagen" [(ngModel)]="nuevoConsentForm.autorizaUsoImagenFotografia" />
                    <label for="authImagen">
                      <strong>2. Uso de Imagen, Fotografía y Carnetización:</strong>
                      <span class="text-xs text-muted block">Autorizo la captura y uso de fotografías para el carnet escolar, anuario y publicaciones en canales institucionales.</span>
                    </label>
                  </div>

                  <div class="checkbox-clause">
                    <input type="checkbox" id="authLMS" [(ngModel)]="nuevoConsentForm.autorizaPlataformasVirtuales" />
                    <label for="authLMS">
                      <strong>3. Uso de Plataformas Virtuales y Herramientas Digitales:</strong>
                      <span class="text-xs text-muted block">Autorizo la creación de cuentas en el Aula Virtual (LMS), Google Workspace y Microsoft 365.</span>
                    </label>
                  </div>

                  <div class="checkbox-clause">
                    <input type="checkbox" id="authGrabacion" [(ngModel)]="nuevoConsentForm.autorizaGrabacionClases" />
                    <label for="authGrabacion">
                      <strong>4. Grabación de Clases Pedagógicas & Videovigilancia:</strong>
                      <span class="text-xs text-muted block">Autorizo grabaciones de clases con fines de seguimiento pedagógico y cámaras de seguridad en el campus.</span>
                    </label>
                  </div>

                  <div class="checkbox-clause">
                    <input type="checkbox" id="authSeguro" [(ngModel)]="nuevoConsentForm.autorizaCompartirEpsSeguros" />
                    <label for="authSeguro">
                      <strong>5. Póliza Estudiantil de Accidentes y Asistencia en Salud:</strong>
                      <span class="text-xs text-muted block">Autorizo compartir datos básicos con la aseguradora escolar y centros de salud ante emergencias.</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="cerrarModalNuevoConsentimiento()" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarNuevoConsentimiento()" class="btn btn-primary shadow-glow" [disabled]="isSaving()">
                <span>{{ isSaving() ? 'Firmando y Generando Hash...' : '🔒 Firmar y Registrar Consentimiento' }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 2: CERTIFICADO 360° DE CONSENTIMIENTO       -->
      <!-- ================================================= -->
      @if (modalDetalle() && consentimientoSeleccionado()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('detalleConsentimiento')">
          <div class="modal-card card card-glass modal-wide" style="max-width: 850px;">
            <div class="modal-header">
              <div>
                <span class="modal-subtitle">EVIDENCIA CRIPTOGRÁFICA RNBD - SIC</span>
                <h3>Certificado de Consentimiento: {{ consentimientoSeleccionado()?.primer_nombre }} {{ consentimientoSeleccionado()?.primer_apellido }}</h3>
              </div>
              <button (click)="modalDetalle.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="card p-3 border-subtle mb-3">
                <div class="flex-between">
                  <span class="badge badge-success">ESTADO: {{ consentimientoSeleccionado()?.estado }}</span>
                  <span class="text-xs text-muted">Aceptado: {{ consentimientoSeleccionado()?.fecha_aceptacion | date:'medium' }}</span>
                </div>

                <div class="mt-3">
                  <strong>Acudiente Firmante:</strong> {{ consentimientoSeleccionado()?.acudiente_nombre }} ({{ consentimientoSeleccionado()?.acudiente_documento }})
                </div>

                <div class="mt-2 hash-box-large">
                  <strong>Hash SHA-256 de Inmutabilidad Legal:</strong>
                  <code>{{ consentimientoSeleccionado()?.hash_integridad_sha256 }}</code>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="descargarPdfConsentimiento(consentimientoSeleccionado()!.id)" class="btn btn-primary shadow-glow">
                📄 Descargar Certificado Oficial en PDF
              </button>
              <button (click)="modalDetalle.set(false)" class="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL REUTILIZABLE: RADICAR SOLICITUD ARCO        -->
      <!-- ================================================= -->
      <app-modal-solicitud-arco
        [isOpen]="modalNuevaSolicitudArco()"
        [estudiantesMatriculados]="estudiantesList()"
        (cancel)="cerrarModalNuevaSolicitudArco()"
        (saved)="onSolicitudArcoGuardada($event)"
      ></app-modal-solicitud-arco>


      <!-- MODAL GENÉRICO PROFESIONAL: RESPUESTA INSTITUCIONAL ARCO -->
      <app-institutional-response-modal
        modalId="responderArco"
        [isOpen]="modalResponderArcoOpen()"
        title="Emitir Respuesta Institucional a Solicitud ARCO"
        [subtitle]="'Radicado Oficial: ' + (solicitudArcoSeleccionada()?.radicado_numero || '')"
        badge="DERECHO ARCO (LEY 1581)"
        badgeIcon="⚖️"
        [headerTag]="solicitudArcoSeleccionada()?.tipo_derecho || 'RECTIFICACIÓN'"
        targetEntityLabel="Solicitante / Representante Legal"
        [targetEntityName]="(solicitudArcoSeleccionada()?.solicitante_nombre || '') + ' (Doc. ' + (solicitudArcoSeleccionada()?.solicitante_documento || '') + ')'"
        [targetEntitySub]="'Estudiante: ' + (solicitudArcoSeleccionada()?.primer_nombre || '') + ' ' + (solicitudArcoSeleccionada()?.primer_apellido || '') + ' • Petición: ' + (solicitudArcoSeleccionada()?.descripcion_solicitud || '')"
        [recipientEmail]="solicitudArcoSeleccionada()?.solicitante_email || ''"
        textLabel="Contenido Formal de la Respuesta / Acto Administrativo *"
        textPlaceholder="Redacte la respuesta institucional formal que será enviada al acudiente y registrada en el RNBD..."
        [responseText]="solicitudArcoSeleccionada()?.respuesta_institucional || ''"
        [templates]="plantillasArco"
        [states]="['RESPONDIDO', 'EN_TRAMITE', 'CERRADO', 'RECHAZADO']"
        selectedState="RESPONDIDO"
        [showNotifyEmail]="true"
        [notifyEmail]="true"
        [isSaving]="isSaving()"
        confirmButtonText="⚖️ Emitir Respuesta Institucional"
        (confirm)="confirmarRespuestaArco($event)"
        (cancel)="cerrarModalResponderArco()"
      ></app-institutional-response-modal>

      <!-- MODAL GENÉRICO PROFESIONAL: REVOCATORIA DE HABEAS DATA -->
      <app-revocation-prompt-modal
        modalId="revocarConsentimiento"
        [isOpen]="modalRevocarOpen()"
        [studentName]="(consentimientoSeleccionado()?.primer_nombre || '') + ' ' + (consentimientoSeleccionado()?.primer_apellido || '')"
        [studentDoc]="consentimientoSeleccionado()?.numero_documento || ''"
        [parentName]="consentimientoSeleccionado()?.acudiente_nombre || ''"
        [isSaving]="isSaving()"
        (confirm)="confirmarRevocacion($event)"
        (cancel)="cerrarModalRevocar()"
      ></app-revocation-prompt-modal>
    </div>
  `,
  styles: [`
    .habeas-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-bottom: 3rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(2, 132, 199, 0.12);
      color: #0284c7;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 0.5rem;
      border: 1px solid rgba(2, 132, 199, 0.25);
    }

    .badge-tag {
      background: #0284c7;
      color: #ffffff;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      font-size: 0.65rem;
      letter-spacing: 0.5px;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.95rem;
      max-width: 800px;
      margin-top: 0.25rem;
    }

    /* KPIS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      display: flex;
      align-items: center;
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
      font-size: 1.5rem;
    }

    .color-sky    { background: rgba(2, 132, 199, 0.15); color: #0284c7; }
    .color-green  { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .color-purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
    .color-amber  { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
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
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.25rem;
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: none;
      border: none;
      border-radius: 8px 8px 0 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #0284c7;
      background: rgba(2, 132, 199, 0.05);
    }

    .tab-btn.active {
      color: #0284c7;
      background: #ffffff;
      border-bottom: 3px solid #0284c7;
    }

    .tab-badge {
      background: #e2e8f0;
      color: #475569;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    .tab-btn.active .tab-badge {
      background: #0284c7;
      color: #ffffff;
    }

    /* FILTROS */
    .filters-card {
      padding: 1rem 1.25rem;
    }

    .filters-grid {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.85rem;
      color: #94a3b8;
    }

    .search-input {
      width: 100%;
      padding: 0.65rem 0.85rem 0.65rem 2.25rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      background: #f8fafc;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* TABLA */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    .data-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 0.9rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .student-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .student-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #e0f2fe;
      color: #0369a1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .permissions-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .perm-chip {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: #fee2e2;
      color: #b91c1c;
    }

    .perm-chip.active {
      background: #dcfce7;
      color: #15803d;
    }

    .hash-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.25rem 0.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      cursor: pointer;
    }

    .hash-box:hover {
      background: #e2e8f0;
    }

    .hash-box-large {
      background: #f0f9ff;
      border: 1px dashed #0284c7;
      border-radius: 8px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .status-pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }

    .status-vigente    { background: #dcfce7; color: #15803d; }
    .status-revocado   { background: #fee2e2; color: #b91c1c; }
    .status-actualizado{ background: #f1f5f9; color: #64748b; }
    .status-radicado   { background: #fef3c7; color: #b45309; }
    .status-respondido { background: #d1fae5; color: #047857; }

    .actions-group {
      display: flex;
      gap: 0.35rem;
      justify-content: flex-end;
    }

    .btn-icon {
      padding: 0.35rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f1f5f9;
    }

    .btn-pdf {
      background: rgba(2, 132, 199, 0.08);
      border-color: rgba(2, 132, 199, 0.25);
      color: #0284c7;
      font-weight: 700;
    }

    .btn-pdf:hover {
      background: #0284c7;
      color: #ffffff;
    }

    /* RNBD GRID */
    .rnbd-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .rnbd-base-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .audit-log-item {
      background: #f8fafc;
      border-left: 3px solid #0284c7;
      padding: 0.65rem 0.85rem;
      margin-bottom: 0.5rem;
      border-radius: 0 6px 6px 0;
    }

    .log-action {
      font-size: 0.75rem;
      font-weight: 800;
      color: #0284c7;
    }

    .log-detail {
      font-size: 0.8rem;
      color: #334155;
      margin: 0.2rem 0;
    }

    .log-footer {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    /* CHECKBOX CLAUSE */
    .checkbox-clause {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .checkbox-clause input[type="checkbox"] {
      margin-top: 0.2rem;
      width: 18px;
      height: 18px;
      accent-color: #0284c7;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-wide {
      width: 100%;
      max-width: 850px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-subtitle {
      font-size: 0.75rem;
      font-weight: 700;
      color: #0284c7;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #94a3b8;
    }

    .modal-body {
      padding: 1.25rem 0;
    }

    .modal-form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }

    .shadow-glow {
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
    }
  `]
})
export class HabeasDataComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);
  readonly modalManager = inject(ModalManagerService);

  activeTab = signal<'consentimientos' | 'rnbd-sic' | 'derechos-arco' | 'politica'>('consentimientos');
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  readonly consentimientosList = signal<ConsentimientoItem[]>([]);
  readonly solicitudesArcoList = signal<SolicitudArcoItem[]>([]);
  readonly estudiantesList = signal<any[]>([]);
  readonly estadisticas = signal<any>({
    totalEstudiantes: 0,
    consentimientosFirmados: 0,
    porcentajeCumplimiento: 100,
    solicitudesArcoPendientes: 0,
    autorizaciones: {},
    ultimosLogsRnbd: [],
  });
  readonly politicaVigente = signal<any>(null);

  readonly consentimientoSeleccionado = signal<ConsentimientoItem | null>(null);
  readonly solicitudArcoSeleccionada = signal<SolicitudArcoItem | null>(null);

  // Modales
  readonly modalNuevoConsentimiento = signal(false);
  readonly modalDetalle = signal(false);
  readonly modalNuevaSolicitudArco = signal(false);
  readonly modalResponderArcoOpen = signal(false);
  readonly modalRevocarOpen = signal(false);

  // Plantillas Institucionales ARCO Predefinidas
  readonly plantillasArco: PredefinedTemplate[] = [
    {
      label: 'Aprobación y Rectificación Exitosa',
      badge: '✅',
      text: 'En atención a su solicitud de radicado, le informamos que la institución educativa ha procedido satisfactoriamente con la actualización y rectificación de la información en el sistema escolar y base de datos institucional conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.',
    },
    {
      label: 'Oposición y Restricción de Imagen',
      badge: '🚫',
      text: 'Se ha registrado formalmente su oposición al uso de imagen y grabaciones pedagógicas para el estudiante. A partir de la fecha, su identidad permanecerá restringida en publicaciones institucionales, redes sociales y plataformas públicas.',
    },
    {
      label: 'Solicitud de Aclaración o Documento',
      badge: '📄',
      text: 'Para dar trámite formal a su solicitud, solicitamos allegar copia legible del documento de identidad del acudiente y registro civil de nacimiento del menor para validar legitimidad y parentesco ante la institución.',
    },
    {
      label: 'Certificación de Supresión / Cierre',
      badge: '🔒',
      text: 'Se certifica que la información solicitada ha sido procesada de conformidad con las disposiciones normativas vigentes y el régimen de protección de datos personales de menores de edad.',
    },
  ];

  // Filtros
  filtroTexto = '';
  filtroEstado = 'TODOS';

  // Formularios
  nuevoConsentForm = {
    matriculaId: '',
    acudienteNombre: '',
    acudienteDocumento: '',
    acudienteParentesco: 'Madre / Padre',
    acudienteEmail: '',
    acudienteTelefono: '',
    autorizaDatosSensibles: true,
    autorizaUsoImagenFotografia: true,
    autorizaPlataformasVirtuales: true,
    autorizaGrabacionClases: true,
    autorizaCompartirEpsSeguros: true,
  };

  solicitudArcoForm = {
    matriculaId: '',
    solicitanteNombre: '',
    solicitanteDocumento: '',
    solicitanteEmail: '',
    solicitanteTelefono: '',
    tipoDerecho: 'RECTIFICACION',
    descripcionSolicitud: '',
  };

  // Computed Select Options para Estudiantes
  readonly estudiantesSelectOptions = computed<SearchableOption[]>(() => {
    return this.estudiantesList().map((e) => ({
      value: e.matricula_id,
      label: `${e.primer_apellido} ${e.segundo_apellido || ''} ${e.primer_nombre} ${e.segundo_nombre || ''}`.trim(),
      sublabel: `Doc. ${e.numero_documento} • Grado: ${e.grado_nombre || '10°'} (${e.grupo_nombre || '10-A'})`,
      badge: e.grupo_nombre || '10-A',
      badgeClass: 'badge-primary',
      avatarText: `${e.primer_nombre?.charAt(0) || 'E'}${e.primer_apellido?.charAt(0) || 'S'}`.toUpperCase(),
    }));
  });

  // Filtrado computado
  readonly consentimientosFiltrados = computed(() => {
    const query = (this.filtroTexto || '').trim().toLowerCase();
    return this.consentimientosList().filter((c) => {
      const matchText =
        !query ||
        `${c.primer_nombre} ${c.primer_apellido}`.toLowerCase().includes(query) ||
        (c.numero_documento || '').includes(query) ||
        (c.acudiente_nombre || '').toLowerCase().includes(query) ||
        (c.acudiente_documento || '').includes(query) ||
        (c.hash_integridad_sha256 || '').toLowerCase().includes(query);
      return matchText;
    });
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargarConsentimientos();
    this.cargarEstadisticasRnbd();
    this.cargarPoliticaVigente();
    this.cargarSolicitudesArco();
    this.cargarEstudiantesMatriculados();
  }

  cargarConsentimientos(): void {
    this.isLoading.set(true);
    let url = 'habeas-data/consentimientos';
    const params: string[] = [];
    if (this.filtroEstado !== 'TODOS') params.push(`estado=${this.filtroEstado}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    this.api.get<ConsentimientoItem[]>(url).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.consentimientosList.set(res || []);
      },
      error: () => {
        this.isLoading.set(false);
        this.consentimientosList.set([]);
      },
    });
  }

  cargarEstadisticasRnbd(): void {
    this.api.get<any>('habeas-data/reporte-rnbd-sic').subscribe({
      next: (res) => {
        if (res) this.estadisticas.set(res);
      },
      error: () => {},
    });
  }

  cargarPoliticaVigente(): void {
    this.api.get<any>('habeas-data/politica-vigente').subscribe({
      next: (res) => {
        if (res) this.politicaVigente.set(res);
      },
      error: () => {},
    });
  }

  cargarSolicitudesArco(): void {
    this.api.get<SolicitudArcoItem[]>('habeas-data/solicitudes-arco').subscribe({
      next: (res) => {
        this.solicitudesArcoList.set(res || []);
      },
      error: () => {},
    });
  }

  cargarEstudiantesMatriculados(): void {
    this.api.get<any[]>('convivencia/estudiantes-matriculados').subscribe({
      next: (res) => {
        if (res && Array.isArray(res)) {
          this.estudiantesList.set(res);
        }
      },
      error: () => {
        this.estudiantesList.set([]);
      },
    });
  }

  aplicarFiltros(): void {
    // Señal computada reacciona automáticamente
  }

  onEstudianteSeleccionado(matriculaId: string): void {
    this.nuevoConsentForm.matriculaId = matriculaId;
    if (!matriculaId) {
      this.nuevoConsentForm.acudienteNombre = '';
      this.nuevoConsentForm.acudienteDocumento = '';
      this.nuevoConsentForm.acudienteEmail = '';
      this.nuevoConsentForm.acudienteTelefono = '';
      return;
    }
    const est = this.estudiantesList().find((e) => e.matricula_id === matriculaId);
    if (est) {
      this.nuevoConsentForm.acudienteNombre = est.acudiente_nombre || '';
      this.nuevoConsentForm.acudienteDocumento = est.acudiente_documento || '';
      this.nuevoConsentForm.acudienteEmail = est.acudiente_email || '';
      this.nuevoConsentForm.acudienteTelefono = est.acudiente_telefono || est.telefono_emergencia || '';
      this.nuevoConsentForm.acudienteParentesco = est.acudiente_parentesco || 'Madre / Padre';
    }
  }

  // --- CRUD: NUEVO CONSENTIMIENTO INFORMADO ---
  abrirModalNuevoConsentimiento(): void {
    this.nuevoConsentForm = {
      matriculaId: '',
      acudienteNombre: '',
      acudienteDocumento: '',
      acudienteParentesco: 'Madre / Padre',
      acudienteEmail: '',
      acudienteTelefono: '',
      autorizaDatosSensibles: true,
      autorizaUsoImagenFotografia: true,
      autorizaPlataformasVirtuales: true,
      autorizaGrabacionClases: true,
      autorizaCompartirEpsSeguros: true,
    };
    this.modalManager.open('nuevoConsentimiento');
    this.modalNuevoConsentimiento.set(true);
  }

  cerrarModalNuevoConsentimiento(): void {
    this.modalManager.close('nuevoConsentimiento');
    this.modalNuevoConsentimiento.set(false);
  }

  guardarNuevoConsentimiento(): void {
    if (!this.nuevoConsentForm.matriculaId) {
      this.toast.warning('Estudiante Requerido', 'Seleccione el estudiante matriculado.');
      return;
    }
    if (!this.nuevoConsentForm.acudienteNombre.trim() || !this.nuevoConsentForm.acudienteDocumento.trim()) {
      this.toast.warning('Datos de Acudiente Requeridos', 'Indique el nombre y documento del representante legal.');
      return;
    }

    this.isSaving.set(true);
    this.api.post<any>('habeas-data/consentimientos', this.nuevoConsentForm).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cerrarModalNuevoConsentimiento();
        this.toast.success('¡Consentimiento Digital Firmado!', 'Se ha generado el Hash SHA-256 inmutable y registrado en el RNBD de la SIC.');
        this.cargarDatos();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error('Error al registrar consentimiento', err?.error?.message || 'No fue posible guardar.');
      },
    });
  }

  // --- MODAL DETALLE / VISOR 360 ---
  verDetalleConsentimiento(c: ConsentimientoItem): void {
    this.consentimientoSeleccionado.set(c);
    this.modalManager.open('detalleConsentimiento');
    this.modalDetalle.set(true);
  }

  // --- PDF OFICIAL ---
  descargarPdfConsentimiento(consentimientoId: string): void {
    const url = this.api.getPdfUrl(`consentimiento-habeas-data/${consentimientoId}`);
    window.open(url, '_blank');
    this.toast.info('Descargando Certificado', 'Generando documento oficial de consentimiento y Habeas Data...');
  }

  // --- REVOCAR CONSENTIMIENTO (MODAL PROFESIONAL) ---
  abrirModalRevocar(c: ConsentimientoItem): void {
    this.consentimientoSeleccionado.set(c);
    this.modalManager.open('revocarConsentimiento');
    this.modalRevocarOpen.set(true);
  }

  cerrarModalRevocar(): void {
    this.modalManager.close('revocarConsentimiento');
    this.modalRevocarOpen.set(false);
  }

  confirmarRevocacion(data: RevocationData): void {
    const c = this.consentimientoSeleccionado();
    if (!c) return;

    this.isSaving.set(true);
    this.api.put<any>(`habeas-data/consentimientos/${c.id}/revocar`, {
      motivoRevocacion: data.reason,
      revocarUsoImagen: data.revocarUsoImagen,
      revocarGrabacionClases: data.revocarGrabacionClases,
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cerrarModalRevocar();
        this.toast.warning('Consentimiento Revocado', 'Se han actualizado las restricciones en el sistema.');
        this.cargarDatos();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error('Error al revocar', err?.error?.message);
      },
    });
  }

  // --- SOLICITUDES ARCO ---
  onEstudianteArcoSeleccionado(matriculaId: string): void {
    this.solicitudArcoForm.matriculaId = matriculaId;
    if (!matriculaId) {
      this.solicitudArcoForm.solicitanteNombre = '';
      this.solicitudArcoForm.solicitanteDocumento = '';
      this.solicitudArcoForm.solicitanteEmail = '';
      this.solicitudArcoForm.solicitanteTelefono = '';
      return;
    }
    const est = this.estudiantesList().find((e) => e.matricula_id === matriculaId);
    if (est) {
      this.solicitudArcoForm.solicitanteNombre = est.acudiente_nombre || '';
      this.solicitudArcoForm.solicitanteDocumento = est.acudiente_documento || '';
      this.solicitudArcoForm.solicitanteEmail = est.acudiente_email || '';
      this.solicitudArcoForm.solicitanteTelefono = est.acudiente_telefono || est.telefono_emergencia || '';
    }
  }

  abrirModalNuevaSolicitudArco(): void {
    this.modalManager.open('nuevaSolicitudArco');
    this.modalNuevaSolicitudArco.set(true);
  }

  cerrarModalNuevaSolicitudArco(): void {
    this.modalManager.close('nuevaSolicitudArco');
    this.modalNuevaSolicitudArco.set(false);
  }

  onSolicitudArcoGuardada(res: any): void {
    this.cargarSolicitudesArco();
    this.cargarEstadisticasRnbd();
  }

  // --- RESPUESTA INSTITUCIONAL ARCO (MODAL PROFESIONAL) ---
  abrirModalResponderArco(s: SolicitudArcoItem): void {
    this.solicitudArcoSeleccionada.set(s);
    this.modalManager.open('responderArco');
    this.modalResponderArcoOpen.set(true);
  }

  cerrarModalResponderArco(): void {
    this.modalManager.close('responderArco');
    this.modalResponderArcoOpen.set(false);
  }

  confirmarRespuestaArco(data: InstitutionalResponseData): void {
    const s = this.solicitudArcoSeleccionada();
    if (!s) return;

    this.isSaving.set(true);
    this.api.put<any>(`habeas-data/solicitudes-arco/${s.id}/responder`, {
      respuestaInstitucional: data.responseText,
      estado: data.state,
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cerrarModalResponderArco();
        this.toast.success('Respuesta Registrada', `La petición ${s.radicado_numero} ha sido respondida y notificada.`);
        this.cargarSolicitudesArco();
        this.cargarEstadisticasRnbd();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error('Error al responder', err?.error?.message);
      },
    });
  }

  copiarHash(hash: string): void {
    navigator.clipboard.writeText(hash);
    this.toast.info('Hash Copiado', 'Código criptográfico SHA-256 copiado al portapapeles.');
  }
}
