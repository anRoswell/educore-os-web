import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';
import { SearchableSelectComponent, SearchableOption } from '../../shared/components/searchable-select.component';

export interface PiarCaracterizacionItem {
  id: string;
  matricula_id: string;
  estudiante_id?: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  numero_documento: string;
  tipo_documento: string;
  grado_nombre?: string;
  grupo_nombre?: string;
  diagnostico_categoria: string;
  diagnostico_clinico: string;
  entidad_medica?: string;
  profesionales_apoyo?: string;
  medicacion_tratamientos?: string;
  estilo_aprendizaje: string;
  barreras_entorno: string;
  fortalezas_intereses: string;
  contexto_familiar?: string;
  fecha_elaboracion: string;
  fecha_revision?: string;
  estado: 'ACTIVO' | 'EN_SEGUIMIENTO' | 'CERRADO';
  total_ajustes_materia: number;
  tiene_acta_firmada: boolean;
  actaCompromiso?: any;
  ajustesCurriculares?: any[];
}

export interface PiarAjusteItem {
  id: string;
  caracterizacion_id: string;
  asignatura_id?: string;
  asignatura_nombre: string;
  docente_id?: string;
  docente_nombre?: string;
  periodo_academico: string;
  objetivos_adaptados: string;
  barreras_materia: string;
  ajustes_metodologicos: string;
  ajustes_evaluativos: string;
  ajustes_materiales?: string;
  dua_principio_representacion?: string;
  dua_principio_expresion?: string;
  dua_principio_implicacion?: string;
  estado_avance: 'EN_PROCESO' | 'ALCANZADO' | 'REQUIERE_AJUSTE';
  observaciones_seguimiento?: string;
}

export interface PiarActaItem {
  id: string;
  caracterizacion_id: string;
  fecha_acta: string;
  compromisos_familia: string;
  compromisos_colegio: string;
  acudiente_nombre: string;
  acudiente_documento?: string;
  acudiente_parentesco: string;
  orientador_nombre?: string;
  rector_nombre?: string;
  firmado: boolean;
  observaciones?: string;
}

@Component({
  selector: 'app-inclusion',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpBadgeComponent, SearchableSelectComponent],
  template: `
    <div class="inclusion-page animate-fade-in">
      <!-- HEADER PRINCIPAL -->
      <div class="page-header">
        <div>
          <div class="header-badge">
            <span>🧩 DECRETO 1421 DE 2017 & DUA</span>
            <span class="badge-tag">EDUCACIÓN INCLUSIVA MEN</span>
          </div>
          <h1>Inclusión Educativa & PIAR</h1>
          <p class="subtitle">
            Plan Individual de Ajustes Razonables (PIAR), caracterización psicopedagógica y Diseño Universal del Aprendizaje (DUA) para auditorías del MEN / SED.
          </p>
        </div>

        <div class="header-actions">
          <button (click)="abrirModalNuevaCaracterizacion()" class="btn btn-primary shadow-glow">
            <span>➕ Nueva Ficha PIAR (Anexo 1)</span>
          </button>
        </div>
      </div>

      <!-- TARJETAS DE INDICADORES / KPIS (DECRETO 1421) -->
      <div class="kpi-grid">
        <div class="kpi-card card">
          <div class="kpi-icon-badge color-indigo">
            <span>👥</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Estudiantes en Inclusión</span>
            <h3 class="kpi-value">{{ estadisticas().totalPiar }}</h3>
            <span class="kpi-hint">Expedientes PIAR activos</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-purple">
            <span>📋</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Ajustes Razonables (DUA)</span>
            <h3 class="kpi-value">{{ estadisticas().totalAjustes }}</h3>
            <span class="kpi-hint">Adaptaciones por asignatura</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-green">
            <span>✍️</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Actas de Compromiso</span>
            <h3 class="kpi-value">{{ estadisticas().actasFirmadas }}</h3>
            <span class="kpi-hint">Firmadas por familia y escuela</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-amber">
            <span>🛡️</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Cumplimiento Auditoría</span>
            <h3 class="kpi-value">{{ estadisticas().cumplimientoAuditoria }}%</h3>
            <span class="kpi-hint">Preparado para visitas SED</span>
          </div>
        </div>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'expedientes'"
          (click)="activeTab.set('expedientes')"
        >
          <span>📁 Expedientes & Fichas PIAR</span>
          <span class="tab-badge">{{ caracterizacionesList().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'ajustes-dua'"
          (click)="activeTab.set('ajustes-dua')"
        >
          <span>🧩 Ajustes Curriculares (Anexo 2)</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'actas'"
          (click)="activeTab.set('actas')"
        >
          <span>🤝 Actas de Acuerdo (Anexo 3)</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'auditoria'"
          (click)="activeTab.set('auditoria')"
        >
          <span>🏛️ Guía de Auditoría SED / MEN</span>
        </button>
      </div>

      <!-- ================================================= -->
      <!-- TAB 1: EXPEDIENTES & CARACTERIZACIONES PIAR      -->
      <!-- ================================================= -->
      @if (activeTab() === 'expedientes') {
        <div class="tab-content animate-fade-in">
          <!-- BARRA DE BÚSQUEDA Y FILTROS -->
          <div class="filters-card card">
            <div class="filters-grid">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input
                  type="text"
                  class="search-input"
                  placeholder="Buscar por nombre, apellido, documento o diagnóstico..."
                  [(ngModel)]="filtroTexto"
                  (input)="aplicarFiltros()"
                />
              </div>

              <div class="filter-group">
                <label>Categoría PIAR:</label>
                <select class="form-select" [(ngModel)]="filtroCategoria" (change)="cargarCaracterizaciones()">
                  <option value="TODOS">Todas las Categorías</option>
                  <option value="AUTISMO_TEA">Autismo / TEA</option>
                  <option value="TDAH">TDAH (Déficit de Atención / Hiperactividad)</option>
                  <option value="DISCAPACIDAD_INTELECTUAL">Discapacidad Intelectual / Cognitiva</option>
                  <option value="DISCAPACIDAD_VISUAL">Discapacidad Visual / Baja Visión</option>
                  <option value="DISCAPACIDAD_AUDITIVA">Discapacidad Auditiva / Hipoacusia</option>
                  <option value="DISCAPACIDAD_FISICA">Discapacidad Física / Motora</option>
                  <option value="SORDOCEGUERA">Sordoceguera</option>
                  <option value="TRASTORNO_APRENDIZAJE">Trastornos Específicos del Aprendizaje</option>
                  <option value="TALENTO_EXCEPCIONAL">Talentos / Capacidades Excepcionales</option>
                  <option value="OTRO">Otra Condición</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Estado:</label>
                <select class="form-select" [(ngModel)]="filtroEstado" (change)="cargarCaracterizaciones()">
                  <option value="TODOS">Todos los Estados</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="EN_SEGUIMIENTO">En Seguimiento</option>
                  <option value="CERRADO">Cerrado</option>
                </select>
              </div>
            </div>
          </div>

          <!-- TABLA DE EXPEDIENTES PIAR -->
          <div class="table-container card">
            @if (isLoading()) {
              <div class="empty-state">
                <div class="spinner"></div>
                <p>Consultando expedientes PIAR en base de datos...</p>
              </div>
            } @else if (caracterizacionesFiltradas().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">🧩</span>
                <h3>No se encontraron expedientes PIAR</h3>
                <p>No hay estudiantes registrados con los filtros seleccionados. Puede radicar un nuevo PIAR con el botón superior.</p>
                <button (click)="abrirModalNuevaCaracterizacion()" class="btn btn-primary mt-3">
                  Radicar Primer Plan PIAR
                </button>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Estudiante & Grado</th>
                    <th>Categoría & Diagnóstico</th>
                    <th>Canal / Estilo</th>
                    <th>Ajustes por Materia</th>
                    <th>Acta de Acuerdo</th>
                    <th>Estado</th>
                    <th style="text-align: right;">Acciones Oficiales</th>
                  </tr>
                </thead>
                <tbody>
                  @for (caract of caracterizacionesFiltradas(); track caract.id) {
                    <tr>
                      <td>
                        <div class="student-cell">
                          <div class="student-avatar">
                            {{ caract.primer_nombre?.charAt(0) }}{{ caract.primer_apellido?.charAt(0) }}
                          </div>
                          <div>
                            <span class="student-name">
                              {{ caract.primer_apellido }} {{ caract.segundo_apellido || '' }} {{ caract.primer_nombre }} {{ caract.segundo_nombre || '' }}
                            </span>
                            <span class="student-doc">
                              {{ caract.tipo_documento }} {{ caract.numero_documento }} • {{ caract.grado_nombre || '10°' }} ({{ caract.grupo_nombre || '10-A' }})
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div class="diag-cell">
                          <span class="category-chip" [ngClass]="getCategoriaBadgeClass(caract.diagnostico_categoria)">
                            {{ formatCategoria(caract.diagnostico_categoria) }}
                          </span>
                          <span class="diag-detail" [title]="caract.diagnostico_clinico">
                            {{ caract.diagnostico_clinico | slice:0:45 }}...
                          </span>
                        </div>
                      </td>

                      <td>
                        <span class="style-chip">
                          🎨 {{ caract.estilo_aprendizaje }}
                        </span>
                      </td>

                      <td>
                        <div class="ajustes-counter">
                          <span class="badge" [class.badge-success]="caract.total_ajustes_materia > 0" [class.badge-warning]="caract.total_ajustes_materia === 0">
                            {{ caract.total_ajustes_materia }} materias adaptadas
                          </span>
                        </div>
                      </td>

                      <td>
                        @if (caract.tiene_acta_firmada) {
                          <span class="status-chip chip-green">
                            ✓ Firmada Anexo 3
                          </span>
                        } @else {
                          <span class="status-chip chip-amber">
                            ⏳ Pendiente Firma
                          </span>
                        }
                      </td>

                      <td>
                        <span class="status-pill" [ngClass]="'status-' + caract.estado.toLowerCase()">
                          {{ caract.estado }}
                        </span>
                      </td>

                      <td style="text-align: right;">
                        <div class="actions-group">
                          <button
                            (click)="verExpediente360(caract)"
                            class="btn-icon"
                            title="Ver Expediente Integral 360°"
                          >
                            👁️
                          </button>

                          <button
                            (click)="abrirModalNuevoAjuste(caract)"
                            class="btn-icon"
                            title="Añadir Ajuste Curricular por Materia (Anexo 2)"
                          >
                            ➕📚
                          </button>

                          <button
                            (click)="abrirModalActa(caract)"
                            class="btn-icon"
                            title="Gestionar Acta de Compromisos (Anexo 3)"
                          >
                            ✍️
                          </button>

                          <button
                            (click)="descargarPdfPiar(caract.id)"
                            class="btn-icon btn-pdf"
                            title="Descargar Informe Oficial PIAR para Auditoría SED (PDF)"
                          >
                            📄 PDF
                          </button>
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
      <!-- TAB 2: AJUSTES CURRICULARES DUA (ANEXO 2)        -->
      <!-- ================================================= -->
      @if (activeTab() === 'ajustes-dua') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card">
            <div class="flex-between">
              <div>
                <h3>🧩 Matriz de Ajustes Razonables Curriculares & DUA</h3>
                <p class="text-sm">Flexibilizaciones metodológicas, evaluativas y de materiales por materia según el Diseño Universal del Aprendizaje.</p>
              </div>
              @if (caracterizacionSeleccionada()) {
                <button (click)="abrirModalNuevoAjuste(caracterizacionSeleccionada()!)" class="btn btn-primary">
                  ➕ Registrar Ajuste en Materia
                </button>
              }
            </div>

            <!-- Selector de Estudiante para ver sus Ajustes -->
            <div class="select-student-row mt-3">
              <label class="form-label">Estudiante en Seguimiento:</label>
              <select class="form-select" [ngModel]="caracterizacionSeleccionada()?.id" (ngModelChange)="seleccionarEstudianteParaAjustes($event)">
                @for (c of caracterizacionesList(); track c.id) {
                  <option [value]="c.id">
                    {{ c.primer_apellido }} {{ c.primer_nombre }} — {{ formatCategoria(c.diagnostico_categoria) }} ({{ c.grado_nombre }})
                  </option>
                }
              </select>
            </div>
          </div>

          @if (!caracterizacionSeleccionada()) {
            <div class="empty-state card mt-4">
              <span class="empty-icon">📚</span>
              <h3>Seleccione un estudiante</h3>
              <p>Escoja un estudiante para consultar o registrar sus ajustes razonables por asignatura.</p>
            </div>
          } @else if (ajustesActuales().length === 0) {
            <div class="empty-state card mt-4">
              <span class="empty-icon">📝</span>
              <h3>Sin Ajustes Registrados para este Estudiante</h3>
              <p>Este expediente no tiene materias adaptadas aún. Haga clic para añadir el primer ajuste curricular.</p>
              <button (click)="abrirModalNuevoAjuste(caracterizacionSeleccionada()!)" class="btn btn-primary mt-3">
                ➕ Registrar Primer Ajuste por Asignatura
              </button>
            </div>
          } @else {
            <div class="ajustes-grid mt-4">
              @for (aj of ajustesActuales(); track aj.id) {
                <div class="ajuste-card card">
                  <div class="ajuste-header">
                    <div>
                      <span class="periodo-tag">{{ aj.periodo_academico }}</span>
                      <h4>{{ aj.asignatura_nombre }}</h4>
                      <span class="docente-sub">Docente: {{ aj.docente_nombre || 'Asignado' }}</span>
                    </div>
                    <span class="avance-badge" [ngClass]="'avance-' + aj.estado_avance.toLowerCase()">
                      {{ aj.estado_avance }}
                    </span>
                  </div>

                  <div class="ajuste-body">
                    <div class="detail-block">
                      <span class="block-label">🎯 Objetivos & DBA Adaptados:</span>
                      <p>{{ aj.objetivos_adaptados }}</p>
                    </div>

                    <div class="detail-block">
                      <span class="block-label">🚧 Barreras Identificadas en el Aula:</span>
                      <p class="text-danger">{{ aj.barreras_materia }}</p>
                    </div>

                    <div class="detail-block">
                      <span class="block-label">💡 Ajustes Metodológicos:</span>
                      <p>{{ aj.ajustes_metodologicos }}</p>
                    </div>

                    <div class="detail-block">
                      <span class="block-label">📝 Flexibilización Evaluativa:</span>
                      <p class="text-primary-emphasis">{{ aj.ajustes_evaluativos }}</p>
                    </div>

                    @if (aj.dua_principio_representacion || aj.dua_principio_expresion || aj.dua_principio_implicacion) {
                      <div class="dua-pill-box">
                        <span class="dua-title">✨ PRINCIPIOS DUA APLICADOS:</span>
                        @if (aj.dua_principio_representacion) {
                          <div class="dua-item"><strong>Representación:</strong> {{ aj.dua_principio_representacion }}</div>
                        }
                        @if (aj.dua_principio_expresion) {
                          <div class="dua-item"><strong>Acción / Expresión:</strong> {{ aj.dua_principio_expresion }}</div>
                        }
                        @if (aj.dua_principio_implicacion) {
                          <div class="dua-item"><strong>Implicación / Motivación:</strong> {{ aj.dua_principio_implicacion }}</div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 3: ACTAS DE COMPROMISOS (ANEXO 3)            -->
      <!-- ================================================= -->
      @if (activeTab() === 'actas') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card">
            <h3>🤝 Actas de Acuerdo & Corresponsabilidad Familia-Escuela</h3>
            <p class="text-sm">Formalización de los compromisos adquiridos entre padres/acudientes, docentes y rectoría conforme al Decreto 1421 de 2017.</p>
          </div>

          <div class="table-container card mt-4">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Acudiente / Familia</th>
                  <th>Fecha del Acta</th>
                  <th>Compromisos Clave Familia</th>
                  <th>Compromisos Clave Colegio</th>
                  <th>Firma & Estado</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (caract of caracterizacionesList(); track caract.id) {
                  <tr>
                    <td>
                      <strong>{{ caract.primer_apellido }} {{ caract.primer_nombre }}</strong>
                      <div class="text-xs text-muted">{{ caract.grado_nombre }}</div>
                    </td>
                    <td>
                      {{ caract.actaCompromiso?.acudiente_nombre || caract.contexto_familiar || 'Acudiente Principal' }}
                    </td>
                    <td>
                      {{ caract.actaCompromiso?.fecha_acta || caract.fecha_elaboracion }}
                    </td>
                    <td>
                      <span class="text-sm">{{ (caract.actaCompromiso?.compromisos_familia || 'Acompañamiento en casa y terapias') | slice:0:60 }}...</span>
                    </td>
                    <td>
                      <span class="text-sm">{{ (caract.actaCompromiso?.compromisos_colegio || 'Garantía de ajustes razonables DUA') | slice:0:60 }}...</span>
                    </td>
                    <td>
                      @if (caract.tiene_acta_firmada || caract.actaCompromiso?.firmado) {
                        <span class="status-chip chip-green">✓ Firmada</span>
                      } @else {
                        <span class="status-chip chip-amber">⏳ Pendiente</span>
                      }
                    </td>
                    <td style="text-align: right;">
                      <button (click)="abrirModalActa(caract)" class="btn btn-secondary btn-sm">
                        ✍️ Editar Acta
                      </button>
                      <button (click)="descargarPdfPiar(caract.id)" class="btn btn-outline btn-sm ml-2">
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 4: GUÍA DE AUDITORÍA SED / MEN               -->
      <!-- ================================================= -->
      @if (activeTab() === 'auditoria') {
        <div class="tab-content animate-fade-in">
          <div class="audit-card card">
            <div class="audit-header">
              <div>
                <span class="audit-badge">🏛️ MARCO NORMATIVO MEN</span>
                <h2>Requisitos Obligatorios para Auditorías de Inclusión</h2>
                <p>Parámetros exigidos por la Secretaría de Educación (SED) en visitas de Inspección y Vigilancia bajo el Decreto 1421 de 2017 y Ley 1618 de 2013.</p>
              </div>
            </div>

            <div class="audit-checklist-grid">
              <div class="checklist-item">
                <div class="chk-icon">1</div>
                <div>
                  <h4>Anexo 1: Caracterización Psicopedagógica</h4>
                  <p>Documentación del diagnóstico clínico (CIE-10/DSM-5), historia médica, apoyos terapéuticos externos, estilos y barreras de aprendizaje.</p>
                </div>
              </div>

              <div class="checklist-item">
                <div class="chk-icon">2</div>
                <div>
                  <h4>Anexo 2: Ajustes Razonables Curriculares por Área</h4>
                  <p>Flexibilización de objetivos pedagógicos, adaptación de pruebas evaluativas (tiempo extra, reducción de ítems) y materiales accesibles.</p>
                </div>
              </div>

              <div class="checklist-item">
                <div class="chk-icon">3</div>
                <div>
                  <h4>Diseño Universal para el Aprendizaje (DUA)</h4>
                  <p>Evidencia de múltiples formas de representación (visual/auditiva), expresión (digital/maquetas) e implicación motivacional en el aula.</p>
                </div>
              </div>

              <div class="checklist-item">
                <div class="chk-icon">4</div>
                <div>
                  <h4>Anexo 3: Acta de Acuerdo con la Familia</h4>
                  <p>Pacto de corresponsabilidad firmado por los padres/acudientes, docente orientador y rectoría con revisiones periódicas mínimas semestrales.</p>
                </div>
              </div>

              <div class="checklist-item">
                <div class="chk-icon">5</div>
                <div>
                  <h4>Reporte y Vinculación en SIMAT</h4>
                  <p>Marcación del estudiante en la plataforma del MEN en su respectiva categoría de discapacidad o capacidad excepcional.</p>
                </div>
              </div>

              <div class="checklist-item">
                <div class="chk-icon">6</div>
                <div>
                  <h4>Generación de Expediente en PDF Oficial</h4>
                  <p>Impresión con membrete institucional, firmas y código de trazabilidad para anexar a la carpeta del archivo escolar.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 1: NUEVA CARACTERIZACIÓN PIAR (ANEXO 1)     -->
      <!-- ================================================= -->
      @if (modalNuevaCaracterizacion()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevaCaracterizacion')">
          <div class="modal-card card card-glass modal-wide">
            <div class="modal-header">
              <div>
                <span class="modal-subtitle">DECRETO 1421 DE 2017 — ANEXO 1</span>
                <h3>📋 Ficha de Caracterización Psicopedagógica PIAR</h3>
              </div>
              <button (click)="cerrarModalNuevaCaracterizacion()" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="modal-form-grid">
                <!-- Selector de Estudiante con Buscador en Tiempo Real -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Seleccionar Estudiante Matriculado *</label>
                  <app-searchable-select
                    [options]="estudiantesSelectOptions()"
                    [(ngModel)]="nuevaCaractForm.matriculaId"
                    placeholder="Buscar estudiante por apellido, nombre o documento..."
                    searchPlaceholder="Escriba nombre, apellido o identificación..."
                  ></app-searchable-select>
                </div>

                <!-- Categoría Diagnóstica -->
                <div class="form-group">
                  <div class="flex-between">
                    <label class="form-label">Categoría Diagnóstica (MEN) *</label>
                    <app-help-badge term="DECRETO_1421"></app-help-badge>
                  </div>
                  <select class="form-select" [(ngModel)]="nuevaCaractForm.diagnosticoCategoria">
                    <option value="AUTISMO_TEA">Autismo / TEA (Trastorno del Espectro Autista)</option>
                    <option value="TDAH">TDAH (Déficit de Atención con Hiperactividad)</option>
                    <option value="DISCAPACIDAD_INTELECTUAL">Discapacidad Intelectual / Cognitiva</option>
                    <option value="DISCAPACIDAD_VISUAL">Discapacidad Visual / Baja Visión</option>
                    <option value="DISCAPACIDAD_AUDITIVA">Discapacidad Auditiva / Hipoacusia</option>
                    <option value="DISCAPACIDAD_FISICA">Discapacidad Física / Motora</option>
                    <option value="SORDOCEGUERA">Sordoceguera</option>
                    <option value="TRASTORNO_APRENDIZAJE">Trastorno Específico del Aprendizaje (Dislexia/Discalculia)</option>
                    <option value="TALENTO_EXCEPCIONAL">Capacidades o Talentos Excepcionales</option>
                    <option value="OTRO">Otra Condición Médica / Psicosocial</option>
                  </select>
                </div>

                <!-- Estilo de Aprendizaje -->
                <div class="form-group">
                  <label class="form-label">Canal Preferencial de Aprendizaje *</label>
                  <select class="form-select" [(ngModel)]="nuevaCaractForm.estiloAprendizaje">
                    <option value="VISUAL">Visual (Gráficos, imágenes, esquemas, videos)</option>
                    <option value="AUDITIVO">Auditivo (Explicaciones orales, podcasts, repetición verbal)</option>
                    <option value="KINESTESICO">Kinestésico (Manipulativo, práctico, maquetas, movimiento)</option>
                    <option value="MIXTO">Mixto / Multisensorial</option>
                  </select>
                </div>

                <!-- Diagnóstico Clínico -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Diagnóstico Clínico / Concepto Médico Detallado (CIE-10 / DSM-5) *</label>
                  <textarea
                    class="form-control"
                    rows="2"
                    placeholder="Ej: Trastorno del Espectro Autista Grado 1 (F84.0) con procesamiento sensorial atípico y dificultades en lenguaje pragmático..."
                    [(ngModel)]="nuevaCaractForm.diagnosticoClinico"
                  ></textarea>
                </div>

                <!-- Entidad Médica & Profesionales Externos -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Entidad Médica / IPS Certificadora (EPS / Hospital / Centro de Neurodesarrollo) *</label>
                  <app-searchable-select
                    [options]="entidadesMedicasSelectOptions()"
                    [(ngModel)]="nuevaCaractForm.entidadMedica"
                    placeholder="Buscar EPS, IPS, Hospital o Centro de Neurodesarrollo..."
                    searchPlaceholder="Escriba el nombre de la entidad médica o EPS..."
                  ></app-searchable-select>
                </div>

                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Profesionales de Apoyo Externos</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej: Terapia Ocupacional (2x/sem), Fonoaudiología, Psicología"
                    [(ngModel)]="nuevaCaractForm.profesionalesApoyo"
                  />
                </div>

                <!-- Barreras Identificadas -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Barreras Identificadas para el Aprendizaje y la Participación *</label>
                  <textarea
                    class="form-control"
                    rows="2"
                    placeholder="Ej: Hipersensibilidad al ruido ambiental en aulas y pasillos; fatiga ante textos extensos sin fragmentar; ansiedad ante evaluaciones no avisadas..."
                    [(ngModel)]="nuevaCaractForm.barrerasEntorno"
                  ></textarea>
                </div>

                <!-- Fortalezas, Intereses y Motivadores -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Fortalezas, Intereses y Motivadores del Estudiante *</label>
                  <textarea
                    class="form-control"
                    rows="2"
                    placeholder="Ej: Excelente memoria espacial y visual; alto interés en tecnología, robótica y dibujo técnico; responde muy bien a refuerzos positivos..."
                    [(ngModel)]="nuevaCaractForm.fortalezasIntereses"
                  ></textarea>
                </div>

                <!-- Contexto Familiar -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Contexto Familiar y Red de Apoyo</label>
                  <textarea
                    class="form-control"
                    rows="2"
                    placeholder="Ej: Convivencia con madre y abuela; acompañamiento constante en el hogar; disposición para cumplir compromisos pedagógicos..."
                    [(ngModel)]="nuevaCaractForm.contextoFamiliar"
                  ></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="cerrarModalNuevaCaracterizacion()" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarNuevaCaracterizacion()" class="btn btn-primary shadow-glow" [disabled]="isSaving()">
                <span>{{ isSaving() ? 'Guardando...' : '💾 Guardar Ficha PIAR' }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 2: NUEVO AJUSTE RAZONABLE POR MATERIA (ANEXO 2) -->
      <!-- ================================================= -->
      @if (modalNuevoAjuste()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoAjuste')">
          <div class="modal-card card card-glass modal-wide">
            <div class="modal-header">
              <div>
                <span class="modal-subtitle">DECRETO 1421 DE 2017 — ANEXO 2</span>
                <h3>📚 Registrar Ajuste Curricular & DUA por Asignatura</h3>
              </div>
              <button (click)="cerrarModalNuevoAjuste()" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="modal-form-grid">
                <!-- Materia & Periodo -->
                <div class="form-group">
                  <label class="form-label">Asignatura / Área *</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej: Matemáticas & Geometría"
                    [(ngModel)]="nuevoAjusteForm.asignaturaNombre"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Periodo Académico *</label>
                  <select class="form-select" [(ngModel)]="nuevoAjusteForm.periodoAcademico">
                    <option value="Periodo 1">Primer Periodo</option>
                    <option value="Periodo 2">Segundo Periodo</option>
                    <option value="Periodo 3">Tercer Periodo</option>
                    <option value="Periodo 4">Cuarto Periodo</option>
                    <option value="Anual">Todo el Año Lectivo</option>
                  </select>
                </div>

                <!-- Docente -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Docente Responsable</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej: Lic. Carlos Gómez"
                    [(ngModel)]="nuevoAjusteForm.docenteNombre"
                  />
                </div>

                <!-- Objetivos Adaptados -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Objetivos / Metas de Aprendizaje Adaptadas (DBA) *</label>
                  <textarea
                    class="form-control"
                    rows="2"
                    placeholder="Ej: Comprender conceptos geométricos fundamentales utilizando modelos tridimensionales y software Geogebra..."
                    [(ngModel)]="nuevoAjusteForm.objetivosAdaptados"
                  ></textarea>
                </div>

                <!-- Barreras en la Materia -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Barreras Específicas en la Asignatura *</label>
                  <textarea
                    class="form-control"
                    rows="2"
                    placeholder="Ej: Complejidad en enunciados abstractos de problemas matemáticos; dificultad de concentración en exámenes largos..."
                    [(ngModel)]="nuevoAjusteForm.barrerasMateria"
                  ></textarea>
                </div>

                <!-- Ajustes Metodológicos -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Ajustes Metodológicos y Didácticos *</label>
                  <textarea
                    class="form-control"
                    rows="2"
                    placeholder="Ej: Fragmentación de explicaciones en secuencias paso a paso con esquemas visuales e infografías..."
                    [(ngModel)]="nuevoAjusteForm.ajustesMetodologicos"
                  ></textarea>
                </div>

                <!-- Ajustes Evaluativos -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Flexibilización y Ajustes Evaluativos *</label>
                  <textarea
                    class="form-control"
                    rows="2"
                    placeholder="Ej: Tiempo adicional (30 min) en evaluaciones escritas, reducción de número de ítems, pruebas orales complementarias..."
                    [(ngModel)]="nuevoAjusteForm.ajustesEvaluativos"
                  ></textarea>
                </div>

                <!-- DUA Principios -->
                <div class="form-group">
                  <label class="form-label">DUA 1: Representación (Información)</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej: Apoyos gráficos, glosario visual"
                    [(ngModel)]="nuevoAjusteForm.duaPrincipioRepresentacion"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">DUA 2: Expresión (Demostración)</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej: Entregas en video, maqueta o Canva"
                    [(ngModel)]="nuevoAjusteForm.duaPrincipioExpresion"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="cerrarModalNuevoAjuste()" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarNuevoAjuste()" class="btn btn-primary shadow-glow" [disabled]="isSaving()">
                <span>{{ isSaving() ? 'Guardando...' : '💾 Registrar Ajuste' }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 3: ACTA DE COMPROMISO (ANEXO 3)             -->
      <!-- ================================================= -->
      @if (modalNuevaActa()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevaActa')">
          <div class="modal-card card card-glass modal-wide">
            <div class="modal-header">
              <div>
                <span class="modal-subtitle">DECRETO 1421 DE 2017 — ANEXO 3</span>
                <h3>🤝 Acta de Acuerdo & Corresponsabilidad</h3>
              </div>
              <button (click)="cerrarModalActa()" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="modal-form-grid">
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Compromisos de la Familia / Acudientes en Casa *</label>
                  <textarea
                    class="form-control"
                    rows="3"
                    placeholder="1. Acompañar diariamente la revisión de agenda y tareas. 2. Asistir cumplidamente a sesiones terapéuticas externas. 3. Mantener comunicación constante con orientación escolar..."
                    [(ngModel)]="actaForm.compromisosFamilia"
                  ></textarea>
                </div>

                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Compromisos Pedagógicos de la Institución Educativa *</label>
                  <textarea
                    class="form-control"
                    rows="3"
                    placeholder="1. Aplicar los ajustes razonables del DUA en todas las asignaturas. 2. Brindar espacio de autorregulación emocional en orientación. 3. Emitir informes trimestrales de avance pedagógico..."
                    [(ngModel)]="actaForm.compromisosColegio"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Nombre del Acudiente que Firma *</label>
                  <input type="text" class="form-control" [(ngModel)]="actaForm.acudienteNombre" />
                </div>

                <div class="form-group">
                  <label class="form-label">Documento de Identidad del Acudiente</label>
                  <input type="text" class="form-control" placeholder="CC. 1023456789" [(ngModel)]="actaForm.acudienteDocumento" />
                </div>

                <div class="form-group">
                  <label class="form-label">Parentesco</label>
                  <input type="text" class="form-control" placeholder="Madre / Padre / Tutor Legal" [(ngModel)]="actaForm.acudienteParentesco" />
                </div>

                <div class="form-group">
                  <label class="form-label">Orientador(a) Escolar / Docente de Apoyo</label>
                  <input type="text" class="form-control" placeholder="Psic. Orientadora Escolar" [(ngModel)]="actaForm.orientadorNombre" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="cerrarModalActa()" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarActa()" class="btn btn-primary shadow-glow" [disabled]="isSaving()">
                <span>{{ isSaving() ? 'Guardando...' : '✍️ Formalizar y Firmar Acta' }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 4: EXPEDIENTE 360° INTEGRAL PIAR            -->
      <!-- ================================================= -->
      @if (modalExpediente360() && caracterizacionSeleccionada()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('expediente360')">
          <div class="modal-card card card-glass modal-wide" style="max-width: 950px;">
            <div class="modal-header">
              <div>
                <span class="modal-subtitle">EXPEDIENTE OFICIAL DE INCLUSIÓN</span>
                <h3>Expediente PIAR 360°: {{ caracterizacionSeleccionada()?.primer_nombre }} {{ caracterizacionSeleccionada()?.primer_apellido }}</h3>
              </div>
              <button (click)="modalExpediente360.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="expediente-360-grid">
                <!-- Ficha Principal -->
                <div class="card p-3 border-subtle">
                  <div class="flex-between">
                    <span class="category-chip" [ngClass]="getCategoriaBadgeClass(caracterizacionSeleccionada()?.diagnostico_categoria)">
                      {{ formatCategoria(caracterizacionSeleccionada()?.diagnostico_categoria) }}
                    </span>
                    <span class="badge badge-primary">Canal: {{ caracterizacionSeleccionada()?.estilo_aprendizaje }}</span>
                  </div>

                  <h4 class="mt-2">{{ caracterizacionSeleccionada()?.diagnostico_clinico }}</h4>
                  <p class="text-sm text-muted">IPS / Especialistas: {{ caracterizacionSeleccionada()?.entidad_medica || 'No registra' }} • {{ caracterizacionSeleccionada()?.profesionales_apoyo || 'Sin apoyos' }}</p>

                  <div class="mt-3">
                    <strong>🚧 Barreras:</strong>
                    <p class="text-sm">{{ caracterizacionSeleccionada()?.barreras_entorno }}</p>
                  </div>

                  <div class="mt-2">
                    <strong>🌟 Fortalezas & Intereses:</strong>
                    <p class="text-sm text-success-emphasis">{{ caracterizacionSeleccionada()?.fortalezas_intereses }}</p>
                  </div>
                </div>

                <!-- Lista de Ajustes por Materia -->
                <div class="card p-3 border-subtle">
                  <h4>📚 Ajustes Razonables Registrados ({{ ajustesActuales().length }})</h4>
                  @if (ajustesActuales().length === 0) {
                    <p class="text-sm text-muted mt-2">No hay ajustes registrados aún para este estudiante.</p>
                  } @else {
                    <div class="mini-ajustes-list mt-2">
                      @for (aj of ajustesActuales(); track aj.id) {
                        <div class="mini-ajuste-item">
                          <div class="flex-between">
                            <strong>{{ aj.asignatura_nombre }} ({{ aj.periodo_academico }})</strong>
                            <span class="badge-mini">{{ aj.estado_avance }}</span>
                          </div>
                          <p class="text-xs text-muted">{{ aj.ajustes_metodologicos | slice:0:70 }}...</p>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="descargarPdfPiar(caracterizacionSeleccionada()!.id)" class="btn btn-primary shadow-glow">
                📄 Descargar Informe Oficial PIAR en PDF
              </button>
              <button (click)="modalExpediente360.set(false)" class="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .inclusion-page {
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
      background: rgba(99, 102, 241, 0.12);
      color: #6366f1;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 0.5rem;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }

    .badge-tag {
      background: #4f46e5;
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

    /* KPI GRID */
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

    .color-indigo { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
    .color-purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
    .color-green  { background: rgba(16, 185, 129, 0.15); color: #10b981; }
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
      position: relative;
    }

    .tab-btn:hover {
      color: #4f46e5;
      background: rgba(99, 102, 241, 0.05);
    }

    .tab-btn.active {
      color: #4f46e5;
      background: #ffffff;
      border-bottom: 3px solid #4f46e5;
    }

    .tab-badge {
      background: #e2e8f0;
      color: #475569;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    .tab-btn.active .tab-badge {
      background: #4f46e5;
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
      font-size: 0.9rem;
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

    .filter-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      white-space: nowrap;
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

    .data-table tbody tr:hover {
      background: #f8fafc;
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
      background: #e0e7ff;
      color: #4338ca;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .student-name {
      display: block;
      font-weight: 700;
      color: #0f172a;
    }

    .student-doc {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
    }

    .diag-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .category-chip {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      max-width: fit-content;
    }

    .chip-tea { background: #dbeafe; color: #1d4ed8; }
    .chip-tdah { background: #fef3c7; color: #b45309; }
    .chip-intelectual { background: #fce7f3; color: #be185d; }
    .chip-sensorial { background: #e0e7ff; color: #4338ca; }
    .chip-talento { background: #d1fae5; color: #047857; }
    .chip-otro { background: #f1f5f9; color: #475569; }

    .diag-detail {
      font-size: 0.75rem;
      color: #64748b;
    }

    .style-chip {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }

    .status-chip {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }

    .chip-green { background: #d1fae5; color: #047857; }
    .chip-amber { background: #fef3c7; color: #b45309; }

    .status-pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }

    .status-activo { background: #dcfce7; color: #15803d; }
    .status-en_seguimiento { background: #e0e7ff; color: #4338ca; }
    .status-cerrado { background: #f1f5f9; color: #64748b; }

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
      border-color: #94a3b8;
    }

    .btn-pdf {
      background: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.25);
      color: #b91c1c;
      font-weight: 700;
    }

    .btn-pdf:hover {
      background: #ef4444;
      color: #ffffff;
    }

    /* AJUSTES CARDS */
    .ajustes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }

    .ajuste-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .ajuste-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }

    .periodo-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: #4f46e5;
      text-transform: uppercase;
    }

    .docente-sub {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
    }

    .avance-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }

    .avance-en_proceso { background: #fef3c7; color: #b45309; }
    .avance-alcanzado { background: #d1fae5; color: #047857; }
    .avance-requiere_ajuste { background: #fee2e2; color: #b91c1c; }

    .ajuste-body {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      font-size: 0.825rem;
    }

    .detail-block p {
      margin: 0.15rem 0 0 0;
      color: #334155;
      line-height: 1.35;
    }

    .block-label {
      font-weight: 700;
      color: #475569;
      font-size: 0.75rem;
    }

    .dua-pill-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 0.65rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .dua-title {
      font-size: 0.7rem;
      font-weight: 800;
      color: #6366f1;
    }

    .dua-item {
      font-size: 0.75rem;
      color: #475569;
    }

    /* AUDIT CHECKLIST */
    .audit-card {
      padding: 2rem;
    }

    .audit-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #4f46e5;
      background: #e0e7ff;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .audit-checklist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .checklist-item {
      display: flex;
      gap: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
    }

    .chk-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #4f46e5;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      flex-shrink: 0;
    }

    .checklist-item h4 {
      margin: 0 0 0.25rem 0;
      font-size: 0.95rem;
      color: #0f172a;
    }

    .checklist-item p {
      margin: 0;
      font-size: 0.8rem;
      color: #64748b;
      line-height: 1.4;
    }

    /* MODALES */
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
      color: #6366f1;
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

    .expediente-360-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .border-subtle {
      border: 1px solid #e2e8f0;
    }

    .mini-ajuste-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
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

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .shadow-glow {
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    }
  `]
})
export class InclusionComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);
  readonly modalManager = inject(ModalManagerService);

  activeTab = signal<'expedientes' | 'ajustes-dua' | 'actas' | 'auditoria'>('expedientes');
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  // Datos principales de la Base de Datos
  readonly caracterizacionesList = signal<PiarCaracterizacionItem[]>([]);
  readonly estadisticas = signal<any>({
    totalPiar: 0,
    totalAjustes: 0,
    actasFirmadas: 0,
    cumplimientoAuditoria: 100,
    porCategoria: [],
  });
  readonly estudiantesList = signal<any[]>([]);
  readonly entidadesMedicasList = signal<any[]>([]);

  // Selección activa
  readonly caracterizacionSeleccionada = signal<any | null>(null);

  // Modales
  readonly modalNuevaCaracterizacion = signal(false);
  readonly modalNuevoAjuste = signal(false);
  readonly modalNuevaActa = signal(false);
  readonly modalExpediente360 = signal(false);

  // Filtros
  filtroTexto = '';
  filtroCategoria = 'TODOS';
  filtroEstado = 'TODOS';

  // Formularios
  nuevaCaractForm = {
    matriculaId: '',
    diagnosticoCategoria: 'TDAH',
    diagnosticoClinico: '',
    entidadMedica: '',
    profesionalesApoyo: '',
    medicacionTratamientos: '',
    estiloAprendizaje: 'VISUAL',
    barrerasEntorno: '',
    fortalezasIntereses: '',
    contextoFamiliar: '',
  };

  nuevoAjusteForm = {
    asignaturaNombre: '',
    docenteNombre: '',
    periodoAcademico: 'Periodo 1',
    objetivosAdaptados: '',
    barrerasMateria: '',
    ajustesMetodologicos: '',
    ajustesEvaluativos: '',
    duaPrincipioRepresentacion: '',
    duaPrincipioExpresion: '',
    duaPrincipioImplicacion: '',
  };

  actaForm = {
    compromisosFamilia: '',
    compromisosColegio: '',
    acudienteNombre: '',
    acudienteDocumento: '',
    acudienteParentesco: 'Madre / Padre',
    orientadorNombre: '',
    rectorNombre: '',
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

  // Computed Select Options para Entidades Médicas y EPS/IPS
  readonly entidadesMedicasSelectOptions = computed<SearchableOption[]>(() => {
    return this.entidadesMedicasList().map((ent) => ({
      value: ent.nombre,
      label: ent.nombre,
      sublabel: `Tipo: ${ent.tipo} • Cobertura: ${ent.ciudad}`,
      badge: ent.tipo,
      badgeClass: ent.tipo === 'EPS' ? 'badge-primary' : ent.tipo.includes('IPS') ? 'badge-success' : 'badge-warning',
      avatarText: '🏥',
    }));
  });

  // Ajustes de la caracterización seleccionada
  readonly ajustesActuales = computed<PiarAjusteItem[]>(() => {
    return this.caracterizacionSeleccionada()?.ajustesCurriculares || [];
  });

  // Filtrado computado
  readonly caracterizacionesFiltradas = computed(() => {
    const query = (this.filtroTexto || '').trim().toLowerCase();
    return this.caracterizacionesList().filter((c) => {
      const matchText =
        !query ||
        `${c.primer_nombre} ${c.primer_apellido}`.toLowerCase().includes(query) ||
        (c.numero_documento || '').includes(query) ||
        (c.diagnostico_clinico || '').toLowerCase().includes(query);
      return matchText;
    });
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargarCaracterizaciones();
    this.cargarEstadisticas();
    this.cargarEstudiantesMatriculados();
    this.cargarEntidadesMedicas();
  }

  cargarEntidadesMedicas(): void {
    this.api.get<any[]>('inclusion/entidades-medicas').subscribe({
      next: (res) => {
        if (res && Array.isArray(res)) {
          this.entidadesMedicasList.set(res);
          if (res.length > 0 && !this.nuevaCaractForm.entidadMedica) {
            this.nuevaCaractForm.entidadMedica = res[0].nombre;
          }
        }
      },
      error: () => {
        this.entidadesMedicasList.set([]);
      },
    });
  }

  cargarCaracterizaciones(): void {
    this.isLoading.set(true);
    let url = 'inclusion/caracterizaciones';
    const params: string[] = [];
    if (this.filtroCategoria !== 'TODOS') params.push(`categoria=${this.filtroCategoria}`);
    if (this.filtroEstado !== 'TODOS') params.push(`estado=${this.filtroEstado}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    this.api.get<PiarCaracterizacionItem[]>(url).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.caracterizacionesList.set(res || []);
        if (res && res.length > 0 && !this.caracterizacionSeleccionada()) {
          this.seleccionarEstudianteParaAjustes(res[0].id);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.caracterizacionesList.set([]);
      },
    });
  }

  cargarEstadisticas(): void {
    this.api.get<any>('inclusion/estadisticas').subscribe({
      next: (res) => {
        if (res) this.estadisticas.set(res);
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
    // Señal computada caracterizacionesFiltradas reacciona automáticamente
  }

  seleccionarEstudianteParaAjustes(id: string): void {
    if (!id) return;
    this.api.get<any>(`inclusion/caracterizaciones/${id}`).subscribe({
      next: (res) => {
        this.caracterizacionSeleccionada.set(res);
      },
      error: () => {},
    });
  }

  // --- CRUD: NUEVA CARACTERIZACIÓN ---
  abrirModalNuevaCaracterizacion(): void {
    this.nuevaCaractForm = {
      matriculaId: '',
      diagnosticoCategoria: 'TDAH',
      diagnosticoClinico: '',
      entidadMedica: '',
      profesionalesApoyo: '',
      medicacionTratamientos: '',
      estiloAprendizaje: 'VISUAL',
      barrerasEntorno: '',
      fortalezasIntereses: '',
      contextoFamiliar: '',
    };
    this.modalManager.open('nuevaCaracterizacion');
    this.modalNuevaCaracterizacion.set(true);
  }

  cerrarModalNuevaCaracterizacion(): void {
    this.modalManager.close('nuevaCaracterizacion');
    this.modalNuevaCaracterizacion.set(false);
  }

  guardarNuevaCaracterizacion(): void {
    if (!this.nuevaCaractForm.matriculaId) {
      this.toast.warning('Estudiante Requerido', 'Por favor seleccione el estudiante matriculado.');
      return;
    }
    if (!this.nuevaCaractForm.diagnosticoClinico.trim()) {
      this.toast.warning('Diagnóstico Requerido', 'Debe detallar el diagnóstico o concepto clínico.');
      return;
    }
    if (!this.nuevaCaractForm.barrerasEntorno.trim()) {
      this.toast.warning('Barreras Requeridas', 'Debe describir las barreras identificadas.');
      return;
    }
    if (!this.nuevaCaractForm.fortalezasIntereses.trim()) {
      this.toast.warning('Fortalezas Requeridas', 'Debe describir las fortalezas e intereses del alumno.');
      return;
    }

    this.isSaving.set(true);
    this.api.post<any>('inclusion/caracterizaciones', this.nuevaCaractForm).subscribe({
      next: (creado) => {
        this.isSaving.set(false);
        this.cerrarModalNuevaCaracterizacion();
        this.toast.success('¡Ficha PIAR Radicada!', 'La caracterización psicopedagógica ha sido guardada exitosamente.');
        this.cargarDatos();
        if (creado?.id) {
          this.seleccionarEstudianteParaAjustes(creado.id);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error('Error al guardar PIAR', err?.error?.message || 'No fue posible radicar el expediente.');
      },
    });
  }

  // --- CRUD: AJUSTE POR MATERIA ---
  abrirModalNuevoAjuste(caract: any): void {
    this.caracterizacionSeleccionada.set(caract);
    this.nuevoAjusteForm = {
      asignaturaNombre: '',
      docenteNombre: '',
      periodoAcademico: 'Periodo 1',
      objetivosAdaptados: '',
      barrerasMateria: '',
      ajustesMetodologicos: '',
      ajustesEvaluativos: '',
      duaPrincipioRepresentacion: '',
      duaPrincipioExpresion: '',
      duaPrincipioImplicacion: '',
    };
    this.modalManager.open('nuevoAjuste');
    this.modalNuevoAjuste.set(true);
  }

  cerrarModalNuevoAjuste(): void {
    this.modalManager.close('nuevoAjuste');
    this.modalNuevoAjuste.set(false);
  }

  guardarNuevoAjuste(): void {
    const caractId = this.caracterizacionSeleccionada()?.id;
    if (!caractId) return;

    if (!this.nuevoAjusteForm.asignaturaNombre.trim()) {
      this.toast.warning('Materia Requerida', 'Indique el nombre de la asignatura.');
      return;
    }
    if (!this.nuevoAjusteForm.objetivosAdaptados.trim()) {
      this.toast.warning('Objetivos Requeridos', 'Detalle los objetivos o DBA adaptados.');
      return;
    }
    if (!this.nuevoAjusteForm.ajustesMetodologicos.trim()) {
      this.toast.warning('Metodología Requerida', 'Especifique los ajustes metodológicos.');
      return;
    }
    if (!this.nuevoAjusteForm.ajustesEvaluativos.trim()) {
      this.toast.warning('Evaluación Requerida', 'Especifique la flexibilización evaluativa.');
      return;
    }

    this.isSaving.set(true);
    this.api.post<any>(`inclusion/caracterizaciones/${caractId}/ajustes`, this.nuevoAjusteForm).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cerrarModalNuevoAjuste();
        this.toast.success('¡Ajuste Curricular Registrado!', 'Los ajustes razonables y principios DUA fueron agregados.');
        this.seleccionarEstudianteParaAjustes(caractId);
        this.cargarEstadisticas();
        this.cargarCaracterizaciones();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error('Error al registrar ajuste', err?.error?.message || 'No fue posible guardar el ajuste.');
      },
    });
  }

  // --- CRUD: ACTA DE COMPROMISOS ---
  abrirModalActa(caract: any): void {
    this.caracterizacionSeleccionada.set(caract);
    this.actaForm = {
      compromisosFamilia: caract.actaCompromiso?.compromisos_familia || '1. Acompañar diariamente la revisión de agenda. 2. Asistir a citas terapéuticas. 3. Notificar cambios en conducta.',
      compromisosColegio: caract.actaCompromiso?.compromisos_colegio || '1. Garantizar los ajustes razonables del DUA. 2. Flexibilización evaluativa en todas las áreas. 3. Seguimiento trimestral.',
      acudienteNombre: caract.actaCompromiso?.acudiente_nombre || caract.contexto_familiar || 'Acudiente Principal',
      acudienteDocumento: caract.actaCompromiso?.acudiente_documento || 'CC. 10000000',
      acudienteParentesco: caract.actaCompromiso?.acudiente_parentesco || 'Madre / Padre',
      orientadorNombre: caract.actaCompromiso?.orientador_nombre || 'Docente Orientador(a)',
      rectorNombre: caract.actaCompromiso?.rector_nombre || 'Rector(a) Institucional',
    };
    this.modalManager.open('nuevaActa');
    this.modalNuevaActa.set(true);
  }

  cerrarModalActa(): void {
    this.modalManager.close('nuevaActa');
    this.modalNuevaActa.set(false);
  }

  guardarActa(): void {
    const caractId = this.caracterizacionSeleccionada()?.id;
    if (!caractId) return;

    if (!this.actaForm.compromisosFamilia.trim() || !this.actaForm.compromisosColegio.trim()) {
      this.toast.warning('Compromisos Requeridos', 'Debe detallar los compromisos de la familia y de la institución.');
      return;
    }

    this.isSaving.set(true);
    this.api.post<any>(`inclusion/caracterizaciones/${caractId}/acta-compromiso`, this.actaForm).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cerrarModalActa();
        this.toast.success('¡Acta Formalizada!', 'El acta de compromisos y corresponsabilidad ha sido guardada y firmada.');
        this.cargarDatos();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error('Error al guardar acta', err?.error?.message || 'No fue posible guardar el acta.');
      },
    });
  }

  // --- VISOR 360° ---
  verExpediente360(caract: any): void {
    this.seleccionarEstudianteParaAjustes(caract.id);
    this.modalManager.open('expediente360');
    this.modalExpediente360.set(true);
  }

  // --- PDF OFICIAL PIAR ---
  descargarPdfPiar(caracterizacionId: string): void {
    const url = this.api.getPdfUrl(`piar/${caracterizacionId}`);
    window.open(url, '_blank');
    this.toast.info('Descargando Expediente PIAR', 'Generando documento oficial multianexo conforme al Decreto 1421 de 2017...');
  }

  // Helpers
  formatCategoria(cat: string): string {
    if (!cat) return 'PIAR';
    const labels: Record<string, string> = {
      AUTISMO_TEA: 'Autismo / TEA',
      TDAH: 'TDAH',
      DISCAPACIDAD_INTELECTUAL: 'Discapacidad Intelectual',
      DISCAPACIDAD_VISUAL: 'Discapacidad Visual',
      DISCAPACIDAD_AUDITIVA: 'Discapacidad Auditiva',
      DISCAPACIDAD_FISICA: 'Discapacidad Física',
      SORDOCEGUERA: 'Sordoceguera',
      TRASTORNO_APRENDIZAJE: 'Trastorno Aprendizaje',
      TALENTO_EXCEPCIONAL: 'Talento Excepcional',
      OTRO: 'Otra Condición',
    };
    return labels[cat] || cat.replace(/_/g, ' ');
  }

  getCategoriaBadgeClass(cat: string): string {
    if (cat === 'AUTISMO_TEA') return 'chip-tea';
    if (cat === 'TDAH') return 'chip-tdah';
    if (cat === 'DISCAPACIDAD_INTELECTUAL') return 'chip-intelectual';
    if (cat === 'DISCAPACIDAD_VISUAL' || cat === 'DISCAPACIDAD_AUDITIVA' || cat === 'SORDOCEGUERA') return 'chip-sensorial';
    if (cat === 'TALENTO_EXCEPCIONAL') return 'chip-talento';
    return 'chip-otro';
  }
}
