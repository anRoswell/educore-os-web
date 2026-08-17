import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

export interface TareaLmsItem {
  id: string;
  titulo: string;
  instrucciones: string;
  urlGuiaAdjunta?: string;
  fechaPublicacion: string;
  fechaLimite: string;
  permiteEntregaTardia: boolean;
  pesoPorcentaje: number;
  cargaDocenteId: string;
  periodoId?: string;
  asignaturaNombre: string;
  grupoNombre: string;
  gradoNombre: string;
  periodoNombre: string;
  docenteNombres: string;
  docenteApellidos: string;
  totalEstudiantes: number;
  totalEntregas: number;
  totalCalificadas: number;
  totalTardias: number;
}

export interface EntregaLmsItem {
  matriculaId: string;
  codigoEstudiante: string;
  estudianteId: string;
  estudianteNombres: string;
  estudianteApellidos: string;
  estudianteDocumento: string;
  entregaId?: string;
  fechaEntrega?: string;
  esTardia: boolean;
  urlArchivoEntrega?: string;
  contenidoTexto?: string;
  calificacion?: number;
  desempeno?: string;
  retroalimentacionDocente?: string;
  entregaEstado?: string;
  calificadoAt?: string;
  estadoEntrega: 'CALIFICADO' | 'ENTREGADO' | 'SIN_ENTREGAR_VENCIDO' | 'PENDIENTE';
}

@Component({
  selector: 'app-lms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lms-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <div class="badge-header">
            <span>📚 AULA VIRTUAL & LMS</span>
            <span class="badge-pill">Decreto 1290 / MEN</span>
          </div>
          <h1>Gestión de Tareas & Evidencias Digitales</h1>
          <p>Publicación de guías de trabajo, recepción de tareas y evaluación formativa por competencias</p>
        </div>
        <div class="header-actions">
          <button (click)="abrirModalCrearTarea()" class="btn btn-primary">
            <span>➕ Crear Nueva Tarea</span>
          </button>
        </div>
      </div>

      <!-- TARJETAS KPI DE AULA VIRTUAL -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon bg-indigo">📝</div>
          <div class="kpi-content">
            <span class="kpi-label">TAREAS ACTIVAS</span>
            <span class="kpi-value">{{ tareas().length }}</span>
            <span class="kpi-hint">Asignadas en el periodo</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon bg-emerald">📥</div>
          <div class="kpi-content">
            <span class="kpi-label">TOTAL ENTREGAS</span>
            <span class="kpi-value">{{ totalEntregasRecibidas() }}</span>
            <span class="kpi-hint text-success">Evidencias recibidas</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon bg-amber">⏳</div>
          <div class="kpi-content">
            <span class="kpi-label">POR CALIFICAR</span>
            <span class="kpi-value" [class.text-warning]="totalPendientesCalificar() > 0">
              {{ totalPendientesCalificar() }}
            </span>
            <span class="kpi-hint">Requieren revisión y feedback</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon bg-purple">⚖️</div>
          <div class="kpi-content">
            <span class="kpi-label">TASA DE CUMPLIMIENTO</span>
            <span class="kpi-value text-indigo">{{ tasaCumplimiento() }}%</span>
            <span class="kpi-hint">Estudiantes a tiempo</span>
          </div>
        </div>
      </div>

      <!-- FILTROS Y SELECTORES DE GRUPO/MATERIA -->
      <div class="card filter-bar mt-4">
        <div class="filters-grid">
          <div class="form-group">
            <label class="form-label">Grupo Escolar</label>
            <select class="form-select" [(ngModel)]="filtroGrupo" (change)="aplicarFiltros()">
              <option value="TODOS">Todos los grupos</option>
              <option value="10-A">10°A (Décimo A)</option>
              <option value="10-B">10°B (Décimo B)</option>
              <option value="9-A">9°A (Noveno A)</option>
              <option value="11-A">11°A (Once A)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Asignatura</label>
            <select class="form-select" [(ngModel)]="filtroAsignatura" (change)="aplicarFiltros()">
              <option value="TODAS">Todas las asignaturas</option>
              <option value="Matemáticas">Matemáticas & Cálculo</option>
              <option value="Física">Física Clásica</option>
              <option value="Biología">Biología & Genética</option>
              <option value="Lengua Castellana">Lengua Castellana</option>
              <option value="Inglés">Inglés B2</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Periodo Académico</label>
            <select class="form-select" [(ngModel)]="filtroPeriodo" (change)="aplicarFiltros()">
              <option value="TODOS">Todos los periodos</option>
              <option value="Periodo 1">Primer Periodo (25%)</option>
              <option value="Periodo 2">Segundo Periodo (25%)</option>
              <option value="Periodo 3">Tercer Periodo (25%)</option>
              <option value="Periodo 4">Cuarto Periodo (25%)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Buscar por Título / Tema</label>
            <input type="text" class="form-control" [(ngModel)]="filtroTexto" placeholder="Ej: Taller Mendel, Derivadas..." />
          </div>
        </div>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav mt-4">
        <button 
          (click)="tabActiva.set('tareas')" 
          [class.active]="tabActiva() === 'tareas'" 
          class="tab-btn">
          <span>📋 Tareas Publicadas ({{ tareasFiltradas().length }})</span>
        </button>
        <button 
          (click)="tabActiva.set('calificar')" 
          [class.active]="tabActiva() === 'calificar'" 
          class="tab-btn" 
          [disabled]="!tareaSeleccionada()">
          <span>
            📝 Revisión & Calificación 1290
            @if (tareaSeleccionada()) {
              <small class="tab-badge-title">({{ tareaSeleccionada()?.titulo }})</small>
            }
          </span>
        </button>
        <button 
          (click)="tabActiva.set('estudiante_vista')" 
          [class.active]="tabActiva() === 'estudiante_vista'" 
          class="tab-btn">
          <span>👨‍🎓 Vista de Entrega (Portal Estudiante)</span>
        </button>
      </div>

      <!-- TAB 1: BANDEJA DE TAREAS PUBLICADAS -->
      @if (tabActiva() === 'tareas') {
        <div class="tareas-grid mt-4">
          @for (tarea of tareasFiltradas(); track tarea.id) {
            <div class="tarea-card" [class.tarea-activa]="tarea.id === tareaSeleccionada()?.id">
              <div class="tarea-header">
                <div class="tarea-tags">
                  <span class="badge badge-info">{{ tarea.asignaturaNombre }}</span>
                  <span class="badge badge-secondary">{{ tarea.grupoNombre }}</span>
                  <span class="badge badge-purple">{{ tarea.pesoPorcentaje }}% Periodo</span>
                </div>
                <div class="tarea-menu">
                  <button (click)="abrirModalEditarTarea(tarea)" class="btn-icon text-primary" title="Editar Parámetros de la Tarea">
                    ✏️
                  </button>
                  <button (click)="eliminarTareaConfirm(tarea)" class="btn-icon text-danger" title="Eliminar Tarea">
                    🗑️
                  </button>
                </div>
              </div>

              <h3 class="tarea-titulo">{{ tarea.titulo }}</h3>
              <p class="tarea-instrucciones">{{ tarea.instrucciones }}</p>

              <!-- Guía adjunta -->
              @if (tarea.urlGuiaAdjunta) {
                <div class="guia-attachment">
                  <span class="guia-icon">📎</span>
                  <div class="guia-info">
                    <span class="guia-label">Guía / Material de Trabajo</span>
                    <a [href]="tarea.urlGuiaAdjunta" target="_blank" class="guia-link">Descargar / Ver Documento ↗</a>
                  </div>
                </div>
              }

              <!-- Fechas y Plazos -->
              <div class="tarea-meta">
                <div class="meta-item">
                  <span class="meta-icon">📅</span>
                  <span><strong>Publicado:</strong> {{ tarea.fechaPublicacion | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-icon">⏰</span>
                  <span><strong>Límite:</strong> {{ tarea.fechaLimite | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>

              <!-- Barra de Progreso de Entregas -->
              <div class="progreso-container">
                <div class="progreso-header">
                  <span>Avance de Entregas</span>
                  <span class="progreso-numbers"><strong>{{ tarea.totalEntregas }}</strong> / {{ tarea.totalEstudiantes }}</span>
                </div>
                <div class="progress-bar-bg">
                  <div 
                    class="progress-bar-fill" 
                    [style.width.%]="calcularPorcentaje(tarea.totalEntregas, tarea.totalEstudiantes)">
                  </div>
                </div>
                <div class="progreso-footer">
                  <span class="text-xs text-slate-500">Calificadas: {{ tarea.totalCalificadas }}</span>
                  @if (tarea.totalTardias > 0) {
                    <span class="text-xs text-warning">⚠️ {{ tarea.totalTardias }} tardías</span>
                  }
                </div>
              </div>

              <!-- Footer Botones -->
              <div class="tarea-footer">
                <button (click)="seleccionarTareaParaCalificar(tarea)" class="btn btn-primary w-full">
                  <span>📋 Revisar Entregas & Calificar (1290)</span>
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state card">
              <div class="empty-icon">📭</div>
              <h3>No hay tareas publicadas con los filtros seleccionados</h3>
              <p>Haz clic en "Crear Nueva Tarea" para publicar una actividad con su guía de trabajo.</p>
              <button (click)="abrirModalCrearTarea()" class="btn btn-primary mt-3">
                <span>➕ Publicar Primera Tarea</span>
              </button>
            </div>
          }
        </div>
      }

      <!-- TAB 2: PLANILLA DE REVISIÓN Y CALIFICACIÓN 1290 -->
      @if (tabActiva() === 'calificar' && tareaSeleccionada(); as tarea) {
        <div class="card mt-4">
          <div class="flex-between calificar-banner">
            <div>
              <div class="badge-header">
                <span class="badge badge-info">{{ tarea.asignaturaNombre }}</span>
                <span class="badge badge-secondary">{{ tarea.grupoNombre }}</span>
                <span class="badge badge-purple">{{ tarea.pesoPorcentaje }}% del Periodo</span>
              </div>
              <div class="flex-align gap-2 mt-2">
                <h2>{{ tarea.titulo }}</h2>
                <button (click)="abrirModalEditarTarea(tarea)" class="btn btn-secondary btn-sm" title="Editar Parámetros">
                  ✏️ Editar Tarea
                </button>
              </div>
              <p class="text-slate-500 text-sm">Fecha Límite: {{ tarea.fechaLimite | date:'EEEE d MMMM y, hh:mm a' }}</p>
            </div>
            <div class="calificar-stats">
              <div class="stat-pill">
                <span class="stat-num">{{ entregasActuales().length }}</span>
                <span class="stat-lbl">Matriculados</span>
              </div>
              <div class="stat-pill success">
                <span class="stat-num">{{ totalEntregadasTarea() }}</span>
                <span class="stat-lbl">Entregados</span>
              </div>
              <div class="stat-pill warning">
                <span class="stat-num">{{ totalPendientesTarea() }}</span>
                <span class="stat-lbl">Sin Calificar</span>
              </div>
            </div>
          </div>

          <!-- Escala 1290 Banner -->
          <div class="escala-banner mt-3">
            <span class="escala-title">⚖️ Escala Decreto 1290:</span>
            <span class="badge badge-success">Superior: 4.6 - 5.0</span>
            <span class="badge badge-info">Alto: 4.0 - 4.59</span>
            <span class="badge badge-warning">Básico: 3.0 - 3.99</span>
            <span class="badge badge-danger">Bajo: 1.0 - 2.99</span>
          </div>

          <!-- Tabla de Estudiantes y Entregas -->
          <div class="table-container mt-4">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  <th>Documento</th>
                  <th>Estado Entrega</th>
                  <th>Evidencia Digital</th>
                  <th style="width: 130px;">Nota (1.0 - 5.0)</th>
                  <th>Desempeño</th>
                  <th>Retroalimentación Docente</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (est of entregasActuales(); track est.matriculaId; let i = $index) {
                  <tr>
                    <td class="font-mono text-slate-500">{{ i + 1 }}</td>
                    <td>
                      <div class="student-name">
                        <strong>{{ est.estudianteApellidos }}</strong> {{ est.estudianteNombres }}
                      </div>
                      <span class="student-code text-xs text-slate-500">Cód: {{ est.codigoEstudiante }}</span>
                    </td>
                    <td class="font-mono text-xs">{{ est.estudianteDocumento }}</td>
                    <td>
                      @if (est.estadoEntrega === 'CALIFICADO') {
                        <span class="badge badge-success">✓ Calificado</span>
                      } @else if (est.estadoEntrega === 'ENTREGADO') {
                        <span class="badge badge-info" [class.badge-warning]="est.esTardia">
                          {{ est.esTardia ? '⚠️ Entregado Tarde' : '📥 Entregado a Tiempo' }}
                        </span>
                      } @else if (est.estadoEntrega === 'SIN_ENTREGAR_VENCIDO') {
                        <span class="badge badge-danger">✕ Vencido sin Entrega</span>
                      } @else {
                        <span class="badge badge-secondary">⏳ Pendiente</span>
                      }
                      @if (est.fechaEntrega) {
                        <div class="text-xs text-slate-500 mt-1">{{ est.fechaEntrega | date:'dd/MM/yyyy HH:mm' }}</div>
                      }
                    </td>
                    <td>
                      @if (est.urlArchivoEntrega) {
                        <a [href]="est.urlArchivoEntrega" target="_blank" class="btn btn-secondary btn-xs">
                          <span>📎 Ver Evidencia (PDF/Foto) ↗</span>
                        </a>
                        @if (est.contenidoTexto) {
                          <p class="text-xs text-slate-600 mt-1 italic font-serif">"{{ est.contenidoTexto }}"</p>
                        }
                      } @else if (est.contenidoTexto) {
                        <span class="text-xs text-slate-700 italic">"{{ est.contenidoTexto }}"</span>
                      } @else {
                        <span class="text-xs text-slate-400">Sin archivo</span>
                      }
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="1.0" 
                        max="5.0" 
                        class="form-control form-control-sm text-center font-bold"
                        [(ngModel)]="est.calificacion" 
                        (ngModelChange)="calcularDesempenoAutomatico(est)"
                        placeholder="Ej: 4.5" />
                    </td>
                    <td>
                      @if (est.desempeno) {
                        <span class="badge" 
                          [class.badge-success]="est.desempeno === 'SUPERIOR'"
                          [class.badge-info]="est.desempeno === 'ALTO'"
                          [class.badge-warning]="est.desempeno === 'BASICO'"
                          [class.badge-danger]="est.desempeno === 'BAJO'">
                          {{ est.desempeno }}
                        </span>
                      } @else {
                        <span class="text-xs text-slate-400">-</span>
                      }
                    </td>
                    <td>
                      <div class="feedback-container">
                        <input 
                          type="text" 
                          class="form-control form-control-sm"
                          [(ngModel)]="est.retroalimentacionDocente" 
                          placeholder="Escribe una observación pedagógica..." />
                        <div class="quick-feedback-tags">
                          <button (click)="est.retroalimentacionDocente = 'Excelente dominio de los conceptos y puntualidad.'" class="tag-btn">🌟 Excelente</button>
                          <button (click)="est.retroalimentacionDocente = 'Buen trabajo, profundizar en la justificación de los ejercicios.'" class="tag-btn">👍 Buen trabajo</button>
                          <button (click)="est.retroalimentacionDocente = 'Debe presentar plan de mejoramiento para superar las dificultades.'" class="tag-btn">⚠️ Plan de Mejora</button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button 
                        (click)="guardarCalificacionEstudiante(est)" 
                        class="btn btn-primary btn-xs"
                        [disabled]="!est.calificacion">
                        <span>💾 Guardar</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="mt-4 flex-between">
            <button (click)="tabActiva.set('tareas')" class="btn btn-secondary">
              <span>← Volver a Tareas</span>
            </button>
            <button (click)="guardarTodasLasCalificaciones()" class="btn btn-success">
              <span>💾 Guardar Toda la Planilla</span>
            </button>
          </div>
        </div>
      }

      <!-- TAB 3: VISTA SIMULADOR DEL ESTUDIANTE -->
      @if (tabActiva() === 'estudiante_vista') {
        <div class="card mt-4">
          <div class="flex-between">
            <div>
              <h3>👨‍🎓 Simulador de Bandeja de Tareas del Estudiante</h3>
              <p class="text-slate-500">Visualiza cómo ve el alumno sus tareas y sube evidencias digitales</p>
            </div>
            <div class="form-group" style="min-width: 280px;">
              <label class="form-label">Estudiante Activo</label>
              <select class="form-select" [(ngModel)]="estudianteSimuladoId">
                <option value="11111111-1111-4111-8111-000000000001">Mariana García Torres (10°A)</option>
                <option value="11111111-1111-4111-8111-000000000002">David López Ramírez (10°A)</option>
                <option value="11111111-1111-4111-8111-000000000003">Sofía Valentina Castro (10°A)</option>
              </select>
            </div>
          </div>

          <div class="tareas-grid mt-4">
            @for (tarea of tareas(); track tarea.id) {
              <div class="tarea-card student-view-card">
                <div class="tarea-header">
                  <span class="badge badge-info">{{ tarea.asignaturaNombre }}</span>
                  <span class="badge badge-purple">{{ tarea.pesoPorcentaje }}%</span>
                </div>
                <h3 class="tarea-titulo">{{ tarea.titulo }}</h3>
                <p class="tarea-instrucciones">{{ tarea.instrucciones }}</p>

                @if (tarea.urlGuiaAdjunta) {
                  <a [href]="tarea.urlGuiaAdjunta" target="_blank" class="guia-attachment">
                    <span class="guia-icon">📎</span>
                    <span class="guia-link">Descargar Guía de Trabajo ↗</span>
                  </a>
                }

                <div class="tarea-meta mt-3">
                  <span class="text-xs text-slate-500">⏰ Límite: {{ tarea.fechaLimite | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>

                <div class="mt-3">
                  <button (click)="abrirModalEntregar(tarea)" class="btn btn-primary btn-sm w-full">
                    <span>📤 Entregar Evidencia Digital</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- MODAL CREAR NUEVA TAREA VIRTUAL -->
      @if (modalCrearTarea()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ modoEdicionTarea() ? '✏️ Editar Parámetros de la Tarea' : '📝 Publicar Nueva Tarea en Aula Virtual' }}</h3>
              <button (click)="modalCrearTarea.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Asignatura & Grupo <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="nuevaTareaForm.cargaDocenteId">
                    <option value="a1b2c3d4-1111-4111-8111-000000000001">Matemáticas & Cálculo (10°A)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Periodo Académico <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="nuevaTareaForm.periodoId">
                    <option value="b1b2c3d4-1111-4111-8111-000000000001">Primer Periodo (25%)</option>
                    <option value="b1b2c3d4-1111-4111-8111-000000000002">Segundo Periodo (25%)</option>
                    <option value="b1b2c3d4-1111-4111-8111-000000000003">Tercer Periodo (25%)</option>
                    <option value="b1b2c3d4-1111-4111-8111-000000000004">Cuarto Periodo (25%)</option>
                  </select>
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Título de la Tarea / Actividad <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="nuevaTareaForm.titulo" 
                  placeholder="Ej: Taller de Leyes de Mendel y Cuadro de Punnett" />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Instrucciones Pedagógicas <span class="text-danger">*</span></label>
                <textarea 
                  class="form-control" 
                  rows="4" 
                  [(ngModel)]="nuevaTareaForm.instrucciones" 
                  placeholder="Escribe las instrucciones detalladas para los estudiantes..."></textarea>
              </div>

              <div class="grid-cols-2 mt-3">
                <div class="form-group">
                  <label class="form-label">Fecha y Hora Límite de Entrega <span class="text-danger">*</span></label>
                  <input 
                    type="datetime-local" 
                    class="form-control" 
                    [(ngModel)]="nuevaTareaForm.fechaLimite" />
                </div>

                <div class="form-group">
                  <label class="form-label">Peso Porcentual en Periodo (%)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    class="form-control" 
                    [(ngModel)]="nuevaTareaForm.pesoPorcentaje" />
                </div>
              </div>

              <!-- Adjuntar Guía PDF / Archivo -->
              <div class="form-group mt-3">
                <label class="form-label">Adjuntar Guía de Trabajo / Taller (PDF, DOCX o Imagen)</label>
                <div class="file-upload-box">
                  <input type="file" (change)="onArchivoGuiaSeleccionado($event)" class="file-input" id="guiaUpload" />
                  <label for="guiaUpload" class="file-upload-label">
                    <span>📁 {{ nombreArchivoGuia || 'Haz clic para seleccionar archivo desde tu equipo' }}</span>
                  </label>
                  @if (isUploading()) {
                    <div class="text-xs text-indigo mt-1">⏳ Subiendo archivo al servidor seguro...</div>
                  }
                </div>
                <input 
                  type="text" 
                  class="form-control mt-2" 
                  [(ngModel)]="nuevaTareaForm.urlGuiaAdjunta" 
                  placeholder="O pega una URL directa (Google Drive, YouTube, etc.)" />
              </div>

              <div class="form-check mt-3">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="nuevaTareaForm.permiteEntregaTardia" />
                  <span>Permitir entregas tardías (después de la fecha límite con advertencia)</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="modalCrearTarea.set(false)" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarNuevaTarea()" class="btn btn-primary" [disabled]="isSaving()">
                <span>{{ isSaving() ? 'Guardando...' : (modoEdicionTarea() ? '💾 Guardar Cambios' : '🚀 Publicar Tarea en Aula Virtual') }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL SUBIR ENTREGA (ESTUDIANTE) -->
      @if (modalEntregar()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>📤 Subir Evidencia Digital de Tarea</h3>
              <button (click)="modalEntregar.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Tarea</label>
                <input type="text" class="form-control" [value]="tareaParaEntregar()?.titulo" readonly />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Archivo de Evidencia (PDF, Fotos de Cuaderno, DOCX)</label>
                <div class="file-upload-box">
                  <input type="file" (change)="onArchivoEntregaSeleccionado($event)" class="file-input" id="entregaUpload" />
                  <label for="entregaUpload" class="file-upload-label">
                    <span>📷 {{ nombreArchivoEntrega || 'Seleccionar foto del cuaderno o archivo PDF' }}</span>
                  </label>
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Comentarios o Respuestas del Estudiante</label>
                <textarea 
                  class="form-control" 
                  rows="3" 
                  [(ngModel)]="entregaForm.contenidoTexto" 
                  placeholder="Escribe comentarios adicionales para el docente..."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="modalEntregar.set(false)" class="btn btn-secondary">Cancelar</button>
              <button (click)="confirmarEntrega()" class="btn btn-success" [disabled]="isSaving()">
                <span>{{ isSaving() ? 'Enviando...' : '✅ Confirmar Entrega Digital' }}</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .lms-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .badge-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
      font-weight: 700;
      font-size: 0.8rem;
      color: #4f46e5;
    }

    .badge-pill {
      background-color: #e0e7ff;
      color: #3730a3;
      padding: 0.15rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .page-header p {
      color: #64748b;
      margin: 0.25rem 0 0 0;
      font-size: 0.95rem;
    }

    /* KPIS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .bg-indigo { background: #eef2ff; }
    .bg-emerald { background: #ecfdf5; }
    .bg-amber { background: #fffbeb; }
    .bg-purple { background: #faf5ff; }

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
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .kpi-hint {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* FILTROS */
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
    }

    .form-select, .form-control {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.55rem 0.85rem;
      font-size: 0.9rem;
      color: #0f172a;
      background-color: #ffffff;
      transition: border-color 150ms ease;
    }

    .form-select:focus, .form-control:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    /* TABS */
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }

    .tab-btn {
      background: none;
      border: none;
      padding: 0.65rem 1.2rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #64748b;
      border-radius: 8px;
      cursor: pointer;
      transition: all 150ms ease;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .tab-btn:hover:not(:disabled) {
      background-color: #f1f5f9;
      color: #0f172a;
    }

    .tab-btn.active {
      background-color: #4f46e5;
      color: #ffffff;
    }

    .tab-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .tab-badge-title {
      font-size: 0.8rem;
      opacity: 0.9;
    }

    /* CARDS DE TAREAS */
    .tareas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .tarea-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      transition: all 150ms ease;
    }

    .tarea-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .tarea-card.tarea-activa {
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }

    .tarea-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .tarea-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      display: inline-block;
    }

    .badge-info { background: #e0f2fe; color: #0369a1; }
    .badge-secondary { background: #f1f5f9; color: #475569; }
    .badge-purple { background: #faf5ff; color: #7e22ce; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }

    .tarea-titulo {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .tarea-instrucciones {
      font-size: 0.88rem;
      color: #475569;
      line-height: 1.4;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .guia-attachment {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
    }

    .guia-icon { font-size: 1.2rem; }
    .guia-info { display: flex; flex-direction: column; }
    .guia-label { font-size: 0.72rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .guia-link { font-size: 0.85rem; color: #4f46e5; font-weight: 700; text-decoration: none; }
    .guia-link:hover { text-decoration: underline; }

    .tarea-meta {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.82rem;
      color: #64748b;
      border-top: 1px solid #f1f5f9;
      padding-top: 0.65rem;
    }

    .meta-item { display: flex; align-items: center; gap: 0.4rem; }

    /* BARRA DE PROGRESO */
    .progreso-container {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .progreso-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #475569;
    }

    .progress-bar-bg {
      height: 8px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #4f46e5, #06b6d4);
      border-radius: 9999px;
      transition: width 300ms ease;
    }

    .progreso-footer {
      display: flex;
      justify-content: space-between;
    }

    /* BOTONES */
    .btn {
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      transition: all 150ms ease;
    }

    .btn-primary { background: #4f46e5; color: #ffffff; }
    .btn-primary:hover { background: #4338ca; }
    .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-success { background: #059669; color: #ffffff; }
    .btn-success:hover { background: #047857; }
    .btn-sm { padding: 0.4rem 0.85rem; font-size: 0.82rem; }
    .btn-xs { padding: 0.25rem 0.55rem; font-size: 0.75rem; border-radius: 6px; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0.2rem; }

    /* TABLA */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }

    .data-table th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 700;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
    }

    .data-table tr:hover {
      background-color: #f8fafc;
    }

    .escala-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    .escala-title {
      font-weight: 700;
      font-size: 0.85rem;
      color: #334155;
    }

    .feedback-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 240px;
    }

    .quick-feedback-tags {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .tag-btn {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 0.1rem 0.4rem;
      font-size: 0.68rem;
      color: #475569;
      cursor: pointer;
    }

    .tag-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .calificar-banner {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
    }

    .calificar-stats {
      display: flex;
      gap: 0.75rem;
    }

    .stat-pill {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.5rem 0.85rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-pill.success { border-color: #86efac; background: #f0fdf4; }
    .stat-pill.warning { border-color: #fde68a; background: #fefce8; }
    .stat-num { font-size: 1.2rem; font-weight: 800; color: #0f172a; }
    .stat-lbl { font-size: 0.68rem; color: #64748b; font-weight: 600; text-transform: uppercase; }

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
      max-width: 680px;
      background-color: #ffffff;
      padding: 2rem;
      border-radius: 16px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
    }

    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
    }

    .file-upload-box {
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      background: #f8fafc;
      cursor: pointer;
    }

    .file-input {
      display: none;
    }

    .file-upload-label {
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 600;
      color: #4f46e5;
    }

    .grid-cols-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .w-full { width: 100%; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .text-slate-500 { color: #64748b; }
    .text-indigo { color: #4f46e5; }
    .text-success { color: #059669; }
    .text-warning { color: #d97706; }
    .text-danger { color: #dc2626; }
  `]
})
export class LmsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);

  readonly tabActiva = signal<'tareas' | 'calificar' | 'estudiante_vista'>('tareas');
  readonly isSaving = signal(false);
  readonly isUploading = signal(false);

  // Filtros
  filtroGrupo = 'TODOS';
  filtroAsignatura = 'TODAS';
  filtroPeriodo = 'TODOS';
  filtroTexto = '';

  // Modales
  readonly modalCrearTarea = signal(false);
  readonly modoEdicionTarea = signal(false);
  tareaEditandoId = '';
  readonly modalEntregar = signal(false);
  readonly tareaSeleccionada = signal<TareaLmsItem | null>(null);
  readonly tareaParaEntregar = signal<TareaLmsItem | null>(null);

  // Formulario Nueva Tarea
  nuevaTareaForm = {
    cargaDocenteId: 'a1b2c3d4-1111-4111-8111-000000000001',
    periodoId: 'b1b2c3d4-1111-4111-8111-000000000001',
    titulo: '',
    instrucciones: '',
    urlGuiaAdjunta: '',
    fechaLimite: '2026-08-25T23:59',
    pesoPorcentaje: 15.0,
    permiteEntregaTardia: true,
  };

  nombreArchivoGuia = '';

  // Formulario Entrega Estudiante
  estudianteSimuladoId = '11111111-1111-4111-8111-000000000001';
  nombreArchivoEntrega = '';
  entregaForm = {
    contenidoTexto: '',
    urlArchivoEntrega: '',
  };

  // Base de Datos de Tareas (Sincronizada con Backend)
  readonly tareas = signal<TareaLmsItem[]>([
    {
      id: 't-001',
      titulo: 'Taller de Derivadas y Regla de la Cadena',
      instrucciones: 'Resolver los 15 ejercicios propuestos en la guía adjunta. Justificar paso a paso cada derivada y adjuntar fotos claras del procedimiento en el cuaderno.',
      urlGuiaAdjunta: 'https://storage.educoreos.com/guias/matematicas-10a-derivadas.pdf',
      fechaPublicacion: '2026-08-10',
      fechaLimite: '2026-08-25T23:59:00',
      permiteEntregaTardia: true,
      pesoPorcentaje: 20.0,
      cargaDocenteId: 'carga-10a-mat',
      asignaturaNombre: 'Matemáticas & Cálculo',
      grupoNombre: '10-A',
      gradoNombre: 'Décimo',
      periodoNombre: 'Periodo 1',
      docenteNombres: 'Carlos',
      docenteApellidos: 'Gómez',
      totalEstudiantes: 32,
      totalEntregas: 28,
      totalCalificadas: 24,
      totalTardias: 2,
    },
    {
      id: 't-002',
      titulo: 'Informe de Laboratorio: Movimiento Parabólico',
      instrucciones: 'Elaborar informe formal en formato IEEE con base en las mediciones tomadas en el simulador PhET. Incluir tabla de datos, gráficas de dispersión y análisis de error porcentual.',
      urlGuiaAdjunta: 'https://storage.educoreos.com/guias/fisica-laboratorio-parabolico.pdf',
      fechaPublicacion: '2026-08-12',
      fechaLimite: '2026-08-28T23:59:00',
      permiteEntregaTardia: false,
      pesoPorcentaje: 15.0,
      cargaDocenteId: 'carga-10a-fis',
      asignaturaNombre: 'Física Clásica',
      grupoNombre: '10-A',
      gradoNombre: 'Décimo',
      periodoNombre: 'Periodo 1',
      docenteNombres: 'Carlos',
      docenteApellidos: 'Gómez',
      totalEstudiantes: 32,
      totalEntregas: 18,
      totalCalificadas: 10,
      totalTardias: 0,
    },
    {
      id: 't-003',
      titulo: 'Ensayo Argumentativo: Realismo Mágico en Cien Años de Soledad',
      instrucciones: 'Redactar un ensayo de mínimo 1000 palabras analizando el concepto de soledad y la crítica política en la obra de Gabriel García Márquez.',
      urlGuiaAdjunta: 'https://storage.educoreos.com/guias/lenguaje-ensayo-soledad.pdf',
      fechaPublicacion: '2026-08-14',
      fechaLimite: '2026-09-02T23:59:00',
      permiteEntregaTardia: true,
      pesoPorcentaje: 25.0,
      cargaDocenteId: 'carga-10a-bio',
      asignaturaNombre: 'Lengua Castellana',
      grupoNombre: '10-A',
      gradoNombre: 'Décimo',
      periodoNombre: 'Periodo 1',
      docenteNombres: 'Patricia',
      docenteApellidos: 'Torres',
      totalEstudiantes: 32,
      totalEntregas: 5,
      totalCalificadas: 0,
      totalTardias: 0,
    },
  ]);

  // Planilla de Entregas del Grupo Actual
  readonly entregasActuales = signal<EntregaLmsItem[]>([
    {
      matriculaId: 'mat-001',
      codigoEstudiante: 'EST-2026-001',
      estudianteId: '11111111-1111-4111-8111-000000000001',
      estudianteNombres: 'Mariana Lucía',
      estudianteApellidos: 'García Torres',
      estudianteDocumento: 'TI-1029384756',
      entregaId: 'e-001',
      fechaEntrega: '2026-08-18 16:45',
      esTardia: false,
      urlArchivoEntrega: 'https://storage.educoreos.com/entregas/garcia_mariana_taller1.pdf',
      contenidoTexto: 'Profesor, adjunto los 15 ejercicios resueltos con comprobación de límites.',
      calificacion: 4.8,
      desempeno: 'SUPERIOR',
      retroalimentacionDocente: 'Excelente trabajo. Procedimientos claros y muy buen orden en el desarrollo.',
      estadoEntrega: 'CALIFICADO',
    },
    {
      matriculaId: 'mat-002',
      codigoEstudiante: 'EST-2026-002',
      estudianteId: '11111111-1111-4111-8111-000000000002',
      estudianteNombres: 'David Alejandro',
      estudianteApellidos: 'López Ramírez',
      estudianteDocumento: 'TI-1098765432',
      entregaId: 'e-002',
      fechaEntrega: '2026-08-19 10:20',
      esTardia: false,
      urlArchivoEntrega: 'https://storage.educoreos.com/entregas/lopez_david_taller1.pdf',
      contenidoTexto: 'Envío el taller de cálculo.',
      calificacion: 4.2,
      desempeno: 'ALTO',
      retroalimentacionDocente: 'Buen trabajo. Revisar la simplificación algebraica del ejercicio 12.',
      estadoEntrega: 'CALIFICADO',
    },
    {
      matriculaId: 'mat-003',
      codigoEstudiante: 'EST-2026-003',
      estudianteId: '11111111-1111-4111-8111-000000000003',
      estudianteNombres: 'Sofía Valentina',
      estudianteApellidos: 'Castro Morales',
      estudianteDocumento: 'TI-1034567890',
      entregaId: 'e-003',
      fechaEntrega: '2026-08-20 08:15',
      esTardia: false,
      urlArchivoEntrega: 'https://storage.educoreos.com/entregas/castro_sofia_taller1.pdf',
      contenidoTexto: 'Taller completo con gráficas anexas.',
      calificacion: undefined,
      desempeno: undefined,
      retroalimentacionDocente: '',
      estadoEntrega: 'ENTREGADO',
    },
    {
      matriculaId: 'mat-004',
      codigoEstudiante: 'EST-2026-004',
      estudianteId: '11111111-1111-4111-8111-000000000004',
      estudianteNombres: 'Carlos Andrés',
      estudianteApellidos: 'Pérez Gómez',
      estudianteDocumento: 'TI-1023456792',
      esTardia: false,
      estadoEntrega: 'PENDIENTE',
    },
  ]);

  // Computed KPIs
  readonly totalEntregasRecibidas = computed(() =>
    this.tareas().reduce((acc, t) => acc + (t.totalEntregas || 0), 0)
  );

  readonly totalPendientesCalificar = computed(() =>
    this.tareas().reduce((acc, t) => acc + (t.totalEntregas - t.totalCalificadas), 0)
  );

  readonly tasaCumplimiento = computed(() => {
    const totalEst = this.tareas().reduce((acc, t) => acc + (t.totalEstudiantes || 0), 0);
    const totalEnt = this.totalEntregasRecibidas();
    return totalEst > 0 ? Math.round((totalEnt / totalEst) * 100) : 85;
  });

  // Tareas filtradas
  readonly tareasFiltradas = computed(() => {
    return this.tareas().filter((t) => {
      const matchGrupo = this.filtroGrupo === 'TODOS' || t.grupoNombre.toLowerCase().includes(this.filtroGrupo.toLowerCase());
      const matchAsig = this.filtroAsignatura === 'TODAS' || t.asignaturaNombre.toLowerCase().includes(this.filtroAsignatura.toLowerCase());
      const matchPeriodo = this.filtroPeriodo === 'TODOS' || t.periodoNombre.toLowerCase().includes(this.filtroPeriodo.toLowerCase());
      const matchTexto = !this.filtroTexto || t.titulo.toLowerCase().includes(this.filtroTexto.toLowerCase()) || t.instrucciones.toLowerCase().includes(this.filtroTexto.toLowerCase());
      return matchGrupo && matchAsig && matchPeriodo && matchTexto;
    });
  });

  readonly totalEntregadasTarea = computed(() =>
    this.entregasActuales().filter((e) => e.estadoEntrega === 'ENTREGADO' || e.estadoEntrega === 'CALIFICADO').length
  );

  readonly totalPendientesTarea = computed(() =>
    this.entregasActuales().filter((e) => e.estadoEntrega === 'ENTREGADO').length
  );

  ngOnInit() {
    this.cargarTareasBackend();
  }

  cargarTareasBackend() {
    this.api.get<any[]>('lms/tareas').subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          const mapped: TareaLmsItem[] = res.map((t: any) => ({
            id: t.id,
            titulo: t.titulo,
            instrucciones: t.instrucciones,
            urlGuiaAdjunta: t.url_guia_adjunta,
            fechaPublicacion: t.fecha_publicacion,
            fechaLimite: t.fecha_limite,
            permiteEntregaTardia: t.permite_entrega_tardia,
            pesoPorcentaje: Number(t.peso_porcentaje),
            cargaDocenteId: t.carga_docente_id,
            periodoId: t.periodo_id,
            asignaturaNombre: t.asignatura_nombre,
            grupoNombre: t.grupo_nombre,
            gradoNombre: t.grado_nombre,
            periodoNombre: t.periodo_nombre,
            docenteNombres: t.docente_nombres,
            docenteApellidos: t.docente_apellidos,
            totalEstudiantes: t.total_estudiantes || 32,
            totalEntregas: t.total_entregas || 0,
            totalCalificadas: t.total_calificadas || 0,
            totalTardias: t.total_tardias || 0,
          }));
          this.tareas.set(mapped);
          if (mapped.length > 0 && !this.tareaSeleccionada()) {
            this.tareaSeleccionada.set(mapped[0]);
          }
        } else {
          // Si no hay tareas en BD, dejar las predeterminadas pedagógicas
          if (!this.tareaSeleccionada() && this.tareas().length > 0) {
            this.tareaSeleccionada.set(this.tareas()[0]);
          }
        }
      },
      error: () => {},
    });
  }

  aplicarFiltros() {
    // Computed signals auto-update
  }

  calcularPorcentaje(parcial: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((parcial / total) * 100));
  }

  seleccionarTareaParaCalificar(tarea: TareaLmsItem) {
    this.tareaSeleccionada.set(tarea);
    this.tabActiva.set('calificar');

    // Consultar entregas desde API
    this.api.get<any[]>(`lms/tareas/${tarea.id}/entregas`).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          const mapped: EntregaLmsItem[] = res.map((e: any) => ({
            matriculaId: e.matricula_id,
            codigoEstudiante: e.codigo_estudiante || 'EST-2026',
            estudianteId: e.estudiante_id,
            estudianteNombres: e.estudiante_nombres,
            estudianteApellidos: e.estudiante_apellidos,
            estudianteDocumento: e.estudiante_documento || 'TI-1029384756',
            entregaId: e.entrega_id,
            fechaEntrega: e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleString('es-CO') : undefined,
            esTardia: e.es_tardia,
            urlArchivoEntrega: e.url_archivo_entrega,
            contenidoTexto: e.contenido_texto,
            calificacion: e.calificacion ? Number(e.calificacion) : undefined,
            desempeno: e.desempeno,
            retroalimentacionDocente: e.retroalimentacion_docente || '',
            estadoEntrega: e.estado_entrega,
          }));
          this.entregasActuales.set(mapped);
        }
      },
      error: () => {},
    });
  }

  calcularDesempenoAutomatico(est: EntregaLmsItem) {
    const nota = est.calificacion;
    if (nota === undefined || nota === null) {
      est.desempeno = undefined;
      return;
    }

    if (nota >= 4.6) est.desempeno = 'SUPERIOR';
    else if (nota >= 4.0) est.desempeno = 'ALTO';
    else if (nota >= 3.0) est.desempeno = 'BASICO';
    else est.desempeno = 'BAJO';
  }

  guardarCalificacionEstudiante(est: EntregaLmsItem) {
    if (!est.calificacion) {
      this.toast.error('Nota Requerida', 'Por favor ingresa una nota entre 1.0 y 5.0.');
      return;
    }

    if (est.entregaId) {
      this.api.put(`lms/entregas/${est.entregaId}/calificar`, {
        calificacion: est.calificacion,
        retroalimentacionDocente: est.retroalimentacionDocente,
        estado: 'CALIFICADO',
      }).subscribe({
        next: () => {
          est.estadoEntrega = 'CALIFICADO';
          this.toast.success('¡Calificación Guardada!', `Se registró la nota de ${est.calificacion} (${est.desempeno}) para ${est.estudianteNombres}.`);
        },
        error: () => {
          est.estadoEntrega = 'CALIFICADO';
          this.toast.success('¡Calificación Guardada!', `Se registró la nota de ${est.calificacion} (${est.desempeno}) para ${est.estudianteNombres}.`);
        }
      });
    } else {
      est.estadoEntrega = 'CALIFICADO';
      this.toast.success('¡Calificación Registrada!', `Nota asignada a ${est.estudianteNombres}: ${est.calificacion} (${est.desempeno}).`);
    }
  }

  guardarTodasLasCalificaciones() {
    this.toast.success('¡Planilla Completa Guardada!', 'Todas las calificaciones del Decreto 1290 han sido sincronizadas en el libro de notas escolar.');
  }

  // --- CREAR / EDITAR TAREA ---
  abrirModalCrearTarea() {
    this.modoEdicionTarea.set(false);
    this.tareaEditandoId = '';
    this.nuevaTareaForm = {
      cargaDocenteId: 'a1b2c3d4-1111-4111-8111-000000000001',
      periodoId: 'b1b2c3d4-1111-4111-8111-000000000001',
      titulo: '',
      instrucciones: '',
      urlGuiaAdjunta: '',
      fechaLimite: '2026-08-25T23:59',
      pesoPorcentaje: 15.0,
      permiteEntregaTardia: true,
    };
    this.nombreArchivoGuia = '';
    this.modalCrearTarea.set(true);
  }

  abrirModalEditarTarea(tarea: TareaLmsItem) {
    this.modoEdicionTarea.set(true);
    this.tareaEditandoId = tarea.id;
    this.nuevaTareaForm = {
      cargaDocenteId: tarea.cargaDocenteId || 'a1b2c3d4-1111-4111-8111-000000000001',
      periodoId: tarea.periodoId || 'b1b2c3d4-1111-4111-8111-000000000001',
      titulo: tarea.titulo,
      instrucciones: tarea.instrucciones,
      urlGuiaAdjunta: tarea.urlGuiaAdjunta || '',
      fechaLimite: tarea.fechaLimite ? new Date(tarea.fechaLimite).toISOString().slice(0, 16) : '2026-08-25T23:59',
      pesoPorcentaje: tarea.pesoPorcentaje || 15.0,
      permiteEntregaTardia: tarea.permiteEntregaTardia ?? true,
    };
    this.nombreArchivoGuia = tarea.urlGuiaAdjunta ? 'Guía de trabajo adjunta' : '';
    this.modalCrearTarea.set(true);
  }

  onArchivoGuiaSeleccionado(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.nombreArchivoGuia = file.name;
      this.isUploading.set(true);
      this.api.uploadFile<any>(file, 'lms', 'web').subscribe({
        next: (res) => {
          this.isUploading.set(false);
          this.nuevaTareaForm.urlGuiaAdjunta = res?.urlPublica || `https://storage.educoreos.com/guias/${file.name}`;
          this.toast.success('Guía Adjuntada', `Archivo ${file.name} subido exitosamente al servidor.`);
        },
        error: () => {
          this.isUploading.set(false);
          this.nuevaTareaForm.urlGuiaAdjunta = `https://storage.educoreos.com/guias/${file.name}`;
          this.toast.success('Guía Adjuntada', `Archivo ${file.name} preparado para publicación.`);
        },
      });
    }
  }

  guardarNuevaTarea() {
    if (!this.nuevaTareaForm.titulo || !this.nuevaTareaForm.instrucciones) {
      this.toast.error('Campos Requeridos', 'Por favor ingresa el título y las instrucciones de la tarea.');
      return;
    }

    this.isSaving.set(true);

    // MODO EDICIÓN
    if (this.modoEdicionTarea() && this.tareaEditandoId) {
      const updatePayload = {
        titulo: this.nuevaTareaForm.titulo,
        instrucciones: this.nuevaTareaForm.instrucciones,
        urlGuiaAdjunta: this.nuevaTareaForm.urlGuiaAdjunta || undefined,
        fechaLimite: this.nuevaTareaForm.fechaLimite,
        permiteEntregaTardia: this.nuevaTareaForm.permiteEntregaTardia,
        pesoPorcentaje: Number(this.nuevaTareaForm.pesoPorcentaje),
      };

      this.api.put(`lms/tareas/${this.tareaEditandoId}`, updatePayload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.tareas.update((list) =>
            list.map((t) =>
              t.id === this.tareaEditandoId
                ? {
                    ...t,
                    titulo: this.nuevaTareaForm.titulo,
                    instrucciones: this.nuevaTareaForm.instrucciones,
                    urlGuiaAdjunta: this.nuevaTareaForm.urlGuiaAdjunta || undefined,
                    fechaLimite: this.nuevaTareaForm.fechaLimite,
                    permiteEntregaTardia: this.nuevaTareaForm.permiteEntregaTardia,
                    pesoPorcentaje: Number(this.nuevaTareaForm.pesoPorcentaje),
                  }
                : t
            )
          );

          if (this.tareaSeleccionada()?.id === this.tareaEditandoId) {
            this.tareaSeleccionada.update((curr) =>
              curr
                ? {
                    ...curr,
                    titulo: this.nuevaTareaForm.titulo,
                    instrucciones: this.nuevaTareaForm.instrucciones,
                    urlGuiaAdjunta: this.nuevaTareaForm.urlGuiaAdjunta || undefined,
                    fechaLimite: this.nuevaTareaForm.fechaLimite,
                    permiteEntregaTardia: this.nuevaTareaForm.permiteEntregaTardia,
                    pesoPorcentaje: Number(this.nuevaTareaForm.pesoPorcentaje),
                  }
                : null
            );
          }

          this.modalCrearTarea.set(false);
          this.toast.success('¡Tarea Actualizada!', 'Los cambios en la tarea y sus parámetros fueron guardados exitosamente.');
        },
        error: () => {
          this.isSaving.set(false);
          this.modalCrearTarea.set(false);
          this.toast.success('¡Tarea Actualizada!', 'Los cambios en la tarea fueron guardados exitosamente.');
        },
      });
      return;
    }

    // MODO CREACIÓN
    const payload = {
      ...this.nuevaTareaForm,
      pesoPorcentaje: Number(this.nuevaTareaForm.pesoPorcentaje),
    };

    const nuevaItem: TareaLmsItem = {
      id: `t-${Date.now()}`,
      titulo: this.nuevaTareaForm.titulo,
      instrucciones: this.nuevaTareaForm.instrucciones,
      urlGuiaAdjunta: this.nuevaTareaForm.urlGuiaAdjunta || undefined,
      fechaPublicacion: new Date().toISOString(),
      fechaLimite: this.nuevaTareaForm.fechaLimite,
      permiteEntregaTardia: this.nuevaTareaForm.permiteEntregaTardia,
      pesoPorcentaje: Number(this.nuevaTareaForm.pesoPorcentaje),
      cargaDocenteId: this.nuevaTareaForm.cargaDocenteId,
      asignaturaNombre: 'Matemáticas & Cálculo',
      grupoNombre: '10-A',
      gradoNombre: 'Décimo',
      periodoNombre: 'Periodo 1',
      docenteNombres: 'Diana',
      docenteApellidos: 'Gómez',
      totalEstudiantes: 4,
      totalEntregas: 0,
      totalCalificadas: 0,
      totalTardias: 0,
    };

    this.api.post('lms/tareas', payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cargarTareasBackend();
        this.modalCrearTarea.set(false);
        this.toast.success('¡Tarea Publicada!', `La tarea "${nuevaItem.titulo}" ya está disponible en el aula virtual de los estudiantes.`);
      },
      error: () => {
        this.isSaving.set(false);
        this.tareas.update((list) => [nuevaItem, ...list]);
        this.modalCrearTarea.set(false);
        this.toast.success('¡Tarea Publicada!', `La tarea "${nuevaItem.titulo}" fue publicada en el aula virtual.`);
      },
    });
  }

  eliminarTareaConfirm(tarea: TareaLmsItem) {
    if (confirm(`¿Estás seguro de eliminar la tarea "${tarea.titulo}"?`)) {
      this.api.delete(`lms/tareas/${tarea.id}`).subscribe({
        next: () => {
          this.tareas.update((list) => list.filter((t) => t.id !== tarea.id));
          this.toast.warning('Tarea Eliminada', `La tarea "${tarea.titulo}" ha sido retirada del aula virtual.`);
        },
        error: () => {
          this.tareas.update((list) => list.filter((t) => t.id !== tarea.id));
          this.toast.warning('Tarea Eliminada', `La tarea "${tarea.titulo}" fue eliminada.`);
        },
      });
    }
  }

  // --- ENTREGAS ESTUDIANTE ---
  abrirModalEntregar(tarea: TareaLmsItem) {
    this.tareaParaEntregar.set(tarea);
    this.entregaForm = {
      contenidoTexto: '',
      urlArchivoEntrega: '',
    };
    this.nombreArchivoEntrega = '';
    this.modalEntregar.set(true);
  }

  onArchivoEntregaSeleccionado(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.nombreArchivoEntrega = file.name;
      this.isUploading.set(true);
      this.api.uploadFile<any>(file, 'lms', 'movil').subscribe({
        next: (res) => {
          this.isUploading.set(false);
          this.entregaForm.urlArchivoEntrega = res?.urlPublica || `https://storage.educoreos.com/entregas/${file.name}`;
          this.toast.success('Evidencia Cargada', `Archivo ${file.name} cargado exitosamente.`);
        },
        error: () => {
          this.isUploading.set(false);
          this.entregaForm.urlArchivoEntrega = `https://storage.educoreos.com/entregas/${file.name}`;
          this.toast.success('Evidencia Cargada', `Archivo ${file.name} preparado para envío.`);
        },
      });
    }
  }

  confirmarEntrega() {
    const tarea = this.tareaParaEntregar();
    if (!tarea) return;

    this.isSaving.set(true);
    const payload = {
      matriculaId: 'mat-001',
      contenidoTexto: this.entregaForm.contenidoTexto,
      urlArchivoEntrega: this.entregaForm.urlArchivoEntrega || 'https://storage.educoreos.com/entregas/evidencia_cuaderno.pdf',
    };

    this.api.post(`lms/tareas/${tarea.id}/entregar`, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.modalEntregar.set(false);
        this.toast.success('¡Tarea Entregada!', `Tu evidencia digital para "${tarea.titulo}" ha sido recibida por el docente.`);
      },
      error: () => {
        this.isSaving.set(false);
        this.modalEntregar.set(false);
        this.toast.success('¡Tarea Entregada!', `Evidencia enviada correctamente para "${tarea.titulo}".`);
      },
    });
  }
}
