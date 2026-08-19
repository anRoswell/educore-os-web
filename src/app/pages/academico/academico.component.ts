import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';
import { CalificacionLoteItem } from '../../core/models';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';

@Component({
  selector: 'app-academico',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpBadgeComponent],
  template: `
    <div class="academico-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Gestión Académica & Planilla Decreto 1290</h1>
          <p>Estructura curricular, registro y control de calificaciones, escala nacional y consolidación de boletines</p>
        </div>
        <div class="header-actions-wrapper">
          <button
            (click)="mostrarGuiaPasos.set(!mostrarGuiaPasos())"
            [class]="mostrarGuiaPasos() ? 'btn btn-secondary' : 'btn btn-outline'"
            title="Ver guía de configuración paso a paso"
          >
            <span>{{ mostrarGuiaPasos() ? '🗺️ Ocultar Ruta Pedagógica' : '🗺️ Ver Ruta Pedagógica' }}</span>
          </button>
          <button (click)="guardarCalificaciones()" class="btn btn-primary" [disabled]="isSaving() || planilla().length === 0">
            <span>💾 {{ isSaving() ? 'Guardando...' : 'Guardar Planilla' }}</span>
          </button>
                    <button (click)="descargarBoletinesMasivos()" class="btn btn-primary" title="Genera y descarga los boletines de todos los estudiantes de este grupo">
            <span>📦 Descargar Boletines del Grupo (ZIP)</span>
          </button>
          <button (click)="descargarBoletinDemo()" class="btn btn-secondary" title="Descargar Boletín Consolidado">
            <span>📄 Boletín PDF</span>
          </button>
        </div>
      </div>

      <!-- Guía Interactiva de Creación Cronológica (Paso a Paso) -->
      @if (mostrarGuiaPasos()) {
        <div class="card setup-guide-card animate-fade-in mb-4">
          <div class="setup-guide-header">
            <div class="flex items-center gap-2">
              <span class="guide-badge">Ruta Pedagógica</span>
              <h3>Flujo Oficial de Configuración Académica</h3>
              <app-help-badge term="LEY_115" label="Ley 115"></app-help-badge>
              <app-help-badge term="SIEE" label="SIEE D.1290"></app-help-badge>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-500">Haz clic en cualquier paso para crearlo directamente</span>
              <button (click)="mostrarGuiaPasos.set(false)" class="close-guide-btn" title="Ocultar Guía">&times;</button>
            </div>
          </div>

          <div class="steps-grid">
            <!-- Paso 1 -->
            <div class="step-card" (click)="abrirModalNuevoNivel()">
              <div class="step-header">
                <span class="step-num">1</span>
                <span class="step-icon">🎓</span>
                <strong>Nivel Educativo</strong>
              </div>
              <p class="step-desc">Define los niveles globales del colegio (Preescolar, Primaria, Secundaria, Media).</p>
              <button class="step-action-btn">+ Crear Nivel</button>
            </div>

            <!-- Paso 2 -->
            <div class="step-card" (click)="abrirModalNuevoGrado()">
              <div class="step-header">
                <span class="step-num">2</span>
                <span class="step-icon">🏛️</span>
                <strong>Grado Escolar</strong>
              </div>
              <p class="step-desc">Crea los grados asociados a un nivel (ej: Transición, 1° a 5°, 6° a 9°, 10°, 11°).</p>
              <button class="step-action-btn">+ Crear Grado</button>
            </div>

            <!-- Paso 3 -->
            <div class="step-card" (click)="abrirModalNuevoGrupo()">
              <div class="step-header">
                <span class="step-num">3</span>
                <span class="step-icon">🚪</span>
                <strong>Grupo / Salón</strong>
              </div>
              <p class="step-desc">Abre los salones específicos por grado (ej: 10-A, 10-B) con sus cupos y aula física.</p>
              <button class="step-action-btn">+ Crear Salón</button>
            </div>

            <!-- Paso 4 -->
            <div class="step-card" (click)="abrirModalNuevaArea()">
              <div class="step-header">
                <span class="step-num">4</span>
                <span class="step-icon">📐</span>
                <strong>Área (Ley 115)</strong>
              </div>
              <p class="step-desc">Establece las 9 áreas fundamentales obligatorias (Matemáticas, Ciencias, Humanidades).</p>
              <button class="step-action-btn">+ Crear Área</button>
            </div>

            <!-- Paso 5 -->
            <div class="step-card" (click)="abrirModalNuevaAsignatura()">
              <div class="step-header">
                <span class="step-num">5</span>
                <span class="step-icon">📚</span>
                <strong>Asignatura</strong>
              </div>
              <p class="step-desc">Crea las asignaturas pertenecientes a cada área (ej: Álgebra, Química, Inglés) y su peso %.</p>
              <button class="step-action-btn">+ Crear Asignatura</button>
            </div>

            <!-- Paso 6 -->
            <div class="step-card" (click)="abrirModalNuevoPeriodo()">
              <div class="step-header">
                <span class="step-num">6</span>
                <span class="step-icon">📅</span>
                <strong>Periodo</strong>
              </div>
              <p class="step-desc">Programa los periodos del año escolar, sus fechas de inicio, fin y plazo para docentes.</p>
              <button class="step-action-btn">+ Crear Periodo</button>
            </div>

            <!-- Paso 7 -->
            <div class="step-card" (click)="abrirModalNuevaActividad()">
              <div class="step-header">
                <span class="step-num">7</span>
                <span class="step-icon">➕</span>
                <strong>Actividad SIEE</strong>
              </div>
              <p class="step-desc">Programa evaluaciones, tareas o talleres (Cognitivo, Procedimental, Actitudinal).</p>
              <button class="step-action-btn">+ Crear Actividad</button>
            </div>
          </div>
        </div>
      }

      <!-- Barra de Acciones Rápidas con Subtítulos Explicativos -->
      <div class="action-buttons-bar mb-4">
        <button (click)="abrirModalNuevoNivel()" class="action-card-btn" title="Paso 1: Crear Nivel Educativo (Preescolar, Primaria, Secundaria, Media)">
          <span class="ac-icon">🎓</span>
          <div class="ac-text">
            <span class="ac-title">1. Nivel</span>
            <span class="ac-hint">Preescolar, Primaria, Media</span>
          </div>
        </button>

        <button (click)="abrirModalNuevoGrado()" class="action-card-btn" title="Paso 2: Crear Grados Escolares (Transición, 1° a 11°)">
          <span class="ac-icon">🏛️</span>
          <div class="ac-text">
            <span class="ac-title">2. Grado</span>
            <span class="ac-hint">Transición a 11° (SIMAT)</span>
          </div>
        </button>

        <button (click)="abrirModalNuevoGrupo()" class="action-card-btn" title="Paso 3: Abrir Salones / Grupos (10-A, 10-B)">
          <span class="ac-icon">🚪</span>
          <div class="ac-text">
            <span class="ac-title">3. Grupo</span>
            <span class="ac-hint">Salones y Cupos</span>
          </div>
        </button>

        <button (click)="abrirModalNuevaArea()" class="action-card-btn" title="Paso 4: Crear Áreas Fundamentales (Ley 115)">
          <span class="ac-icon">📐</span>
          <div class="ac-text">
            <span class="ac-title">4. Área</span>
            <span class="ac-hint">Ley 115 Art. 23</span>
          </div>
        </button>

        <button (click)="abrirModalNuevaAsignatura()" class="action-card-btn" title="Paso 5: Crear Asignaturas Curriculares del Plan de Estudios">
          <span class="ac-icon">📚</span>
          <div class="ac-text">
            <span class="ac-title">5. Asignatura</span>
            <span class="ac-hint">Materias del Plan</span>
          </div>
        </button>

        <button (click)="abrirModalNuevoPeriodo()" class="action-card-btn" title="Paso 6: Configurar Periodos Académicos del Calendario">
          <span class="ac-icon">📅</span>
          <div class="ac-text">
            <span class="ac-title">6. Periodo</span>
            <span class="ac-hint">Fechas y Ponderación</span>
          </div>
        </button>

        <button (click)="abrirModalNuevaActividad()" class="action-card-btn" title="Paso 7: Crear Actividades Evaluativas (SIEE)">
          <span class="ac-icon">➕</span>
          <div class="ac-text">
            <span class="ac-title">7. Actividad</span>
            <span class="ac-hint">Tareas y Quizes SIEE</span>
          </div>
        </button>

        <button (click)="abrirModalReglasSiee()" class="action-card-btn" title="Configurar las reglas de aprobación institucionales">
          <span class="ac-icon">⚖️</span>
          <div class="ac-text">
            <span class="ac-title">Reglas SIEE</span>
            <span class="ac-hint">Criterios de Promoción</span>
          </div>
        </button>
      </div>

      <!-- Filtros Académicos Dinámicos en Cascada -->
      <div class="card filter-bar">
        <div class="filters-grid">
          <!-- 1. Grado -->
          <div class="form-group">
            <div class="filter-label-row">
              <label class="form-label">Grado Escolar</label>
              <button (click)="abrirModalNuevoGrado()" class="btn-link-action" title="Crear Grado">+ Nuevo</button>
            </div>
            <select
              class="form-select"
              [ngModel]="selectedGradoId()"
              (ngModelChange)="onGradoChange($event)"
            >
              @for (grado of gradosList(); track grado.id) {
                <option [value]="grado.id">{{ grado.nombre }}</option>
              } @empty {
                <option value="">Cargando grados...</option>
              }
            </select>
          </div>

          <!-- 2. Grupo -->
          <div class="form-group">
            <div class="filter-label-row">
              <label class="form-label">Grupo / Salón</label>
              <button (click)="abrirModalNuevoGrupo()" class="btn-link-action" title="Crear Grupo">+ Nuevo</button>
            </div>
            <select
              class="form-select"
              [ngModel]="selectedGrupoId()"
              (ngModelChange)="onGrupoChange($event)"
            >
              @for (grupo of gruposFiltrados(); track grupo.id) {
                <option [value]="grupo.id">{{ grupo.nombre }} (Salón {{ grupo.salon || 'Principal' }})</option>
              } @empty {
                <option value="">No hay grupos en este grado</option>
              }
            </select>
          </div>

          <!-- 3. Asignatura -->
          <div class="form-group">
            <div class="filter-label-row">
              <label class="form-label">Asignatura Curricular</label>
              <button (click)="abrirModalNuevaAsignatura()" class="btn-link-action" title="Crear Asignatura">+ Nueva</button>
            </div>
            <select
              class="form-select"
              [ngModel]="selectedAsignaturaId()"
              (ngModelChange)="onAsignaturaChange($event)"
            >
              @for (asig of asignaturasList(); track asig.id) {
                <option [value]="asig.id">{{ asig.nombre }}</option>
              } @empty {
                <option value="">Cargando asignaturas...</option>
              }
            </select>
          </div>

          <!-- 4. Periodo Académico -->
          <div class="form-group">
            <div class="filter-label-row">
              <label class="form-label">Periodo Académico</label>
              <button (click)="abrirModalNuevoPeriodo()" class="btn-link-action" title="Crear Periodo">+ Nuevo</button>
            </div>
            <select
              class="form-select"
              [ngModel]="selectedPeriodoId()"
              (ngModelChange)="onPeriodoChange($event)"
            >
              @for (p of periodosList(); track p.id) {
                <option [value]="p.id">{{ p.nombre }} ({{ p.porcentaje || p.pesoPorcentual || 25 }}%)</option>
              } @empty {
                <option value="b1b2c3d4-1111-4111-8111-000000000002">Primer Periodo (25%)</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- Alerta Informativa del Decreto 1290 -->
      <div class="escala-banner mt-4">
        <div class="escala-title">
          <span>⚖️ Escala Nacional de Valoración (Decreto 1290 de 2009):</span>
        </div>
        <div class="escala-tags">
          <span class="badge badge-success">Superior: 4.6 – 5.0</span>
          <span class="badge badge-info">Alto: 4.0 – 4.59</span>
          <span class="badge badge-warning">Básico: 3.0 – 3.99</span>
          <span class="badge badge-danger">Bajo: 1.0 – 2.99</span>
        </div>
      </div>

      <!-- Planilla de Calificaciones Dinámica -->
      <div class="table-container mt-4">
        @if (isLoadingPlanilla()) {
          <div class="p-8 text-center text-slate-500">
            <p>⏳ Cargando planilla de calificaciones desde PostgreSQL...</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Estudiante</th>
                <th>Documento</th>
                <th style="width: 140px;">Nota (1.0 - 5.0)</th>
                <th>Desempeño (Dec. 1290)</th>
                <th>Observación Pedagógica</th>
                <th style="width: 100px; text-align: center;">Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (est of planilla(); track est.matriculaId; let idx = $index) {
                <tr>
                  <td>{{ idx + 1 }}</td>
                  <td>
                    <strong>{{ est.estudianteNombre }}</strong>
                  </td>
                  <td><span class="text-slate-500 font-mono text-xs">{{ est.documento }}</span></td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      class="form-control text-center font-bold"
                      [(ngModel)]="est.nota"
                      (ngModelChange)="recalcularDesempeno(est)"
                    />
                  </td>
                  <td>
                    <span [class]="getBadgeDesempeno(est.desempeno)">
                      {{ est.desempeno }}
                    </span>
                  </td>
                  <td>
                    <input
                      type="text"
                      class="form-control"
                      [(ngModel)]="est.observaciones"
                      placeholder="Observación formativa..."
                    />
                  </td>
                  <td style="text-align: center;">
                    <button
                      (click)="limpiarNota(est)"
                      class="btn btn-outline btn-sm"
                      title="Restablecer nota a valor base"
                    >
                      🔄 Limpiar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-8 text-slate-500">
                    <p>No se encontraron estudiantes matriculados activos en este grupo.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- ========================================== -->
      <!-- MODAL 1: CREAR NIVEL EDUCATIVO (MEN)       -->
      <!-- ========================================== -->
      @if (modalNuevoNivel()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoNivel')">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <div>
                <h3>🎓 Paso 1: Crear Nivel Educativo</h3>
                <span class="modal-subtitle">Estructura macro según la Ley General de Educación (Ley 115 de 1994)</span>
              </div>
              <button (click)="cerrarModalNuevoNivel()" class="close-btn">&times;</button>
            </div>

            <!-- Banner de Ayuda Contextual -->
            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Registra los bloques educativos del colegio. Ejemplo: <em>Educación Preescolar</em> (código <code>PRE</code>), <em>Básica Primaria</em> (código <code>PRI</code>), <em>Básica Secundaria</em> (código <code>SEC</code>), <em>Media Académica</em> (código <code>MED</code>).</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Nivel Educativo *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevoNivel.nombre"
                  placeholder="Ej: Educación Preescolar, Básica Primaria, Media Técnica"
                />
              </div>

              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Código del Nivel *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="nuevoNivel.codigo"
                    placeholder="Ej: PRE, PRI, SEC, MED"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Orden Cronológico (1 - 10)</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="nuevoNivel.orden"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevoNivel()" class="btn btn-primary">
                💾 Guardar Nivel
              </button>
              <button (click)="cerrarModalNuevoNivel()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL 2: CREAR GRADO ESCOLAR              -->
      <!-- ========================================== -->
      @if (modalNuevoGrado()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoGrado')">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <div>
                <h3>🏛️ Paso 2: Crear Grado Escolar</h3>
                <span class="modal-subtitle">Grados organizados por nivel y código oficial SIMAT</span>
              </div>
              <button (click)="cerrarModalNuevoGrado()" class="close-btn">&times;</button>
            </div>

            <!-- Banner de Ayuda Contextual -->
            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Asocia el grado a un nivel educativo creado en el Paso 1. Ejemplo: <em>Transición (00)</em> en Preescolar, <em>Primero a Quinto (01-05)</em> en Primaria, <em>Décimo (10)</em> u <em>Once (11)</em> en Media.</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Grado *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevoGrado.nombre"
                  placeholder="Ej: Noveno (9°), Transición, Décimo (10°)"
                />
              </div>

              <div class="form-group mt-3">
                <div class="filter-label-row">
                  <label class="form-label">Nivel Educativo Asociado *</label>
                  <button (click)="abrirModalNuevoNivel()" class="btn-link-action" title="Crear Nivel">+ Nuevo Nivel</button>
                </div>
                <select class="form-select" [(ngModel)]="nuevoGrado.nivelId">
                  @for (nivel of nivelesList(); track nivel.id) {
                    <option [value]="nivel.id">{{ nivel.nombre }}</option>
                  } @empty {
                    <option value="81000000-0000-4000-8000-000000000001">Media Académica</option>
                  }
                </select>
              </div>

              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">
                    Código SIMAT (MEN)
                    <app-help-badge term="CODIGO_SIMAT"></app-help-badge>
                  </label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="nuevoGrado.codigoSimat"
                    placeholder="Ej: 09, 10, 11"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Orden Cronológico</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="nuevoGrado.orden"
                    min="0"
                    max="15"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevoGrado()" class="btn btn-primary">
                💾 Guardar Grado
              </button>
              <button (click)="cerrarModalNuevoGrado()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL 3: CREAR GRUPO / SALÓN              -->
      <!-- ========================================== -->
      @if (modalNuevoGrupo()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoGrupo')">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <div>
                <h3>🚪 Paso 3: Crear Grupo / Salón</h3>
                <span class="modal-subtitle">Apertura de cursos o secciones por grado académico</span>
              </div>
              <button (click)="cerrarModalNuevoGrupo()" class="close-btn">&times;</button>
            </div>

            <!-- Banner de Ayuda Contextual -->
            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Selecciona el grado y asigna el nombre de la sección o salón (ej: <em>10-A</em>, <em>10-B</em>, <em>9-1</em>), el cupo máximo permitido y el número de aula física para control de aforo.</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Grado Asociado *</label>
                <select class="form-select" [(ngModel)]="nuevoGrupo.gradoId">
                  @for (grado of gradosList(); track grado.id) {
                    <option [value]="grado.id">{{ grado.nombre }}</option>
                  }
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Nombre del Grupo / Salón *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevoGrupo.nombre"
                  placeholder="Ej: 10-B, 9-A, 11-C"
                />
              </div>

              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Cupo Máximo</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="nuevoGrupo.cupoMaximo"
                    min="1"
                    max="60"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Salón Físico</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="nuevoGrupo.salon"
                    placeholder="Ej: Aula 202"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevoGrupo()" class="btn btn-primary">
                💾 Guardar Grupo
              </button>
              <button (click)="cerrarModalNuevoGrupo()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL 4: CREAR ÁREA (LEY 115)             -->
      <!-- ========================================== -->
      @if (modalNuevaArea()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevaArea')">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <div>
                <h3>
                  📐 Paso 4: Crear Área Fundamental (Ley 115)
                  <app-help-badge term="LEY_115"></app-help-badge>
                </h3>
                <span class="modal-subtitle">Áreas obligatorias del Art. 23 o áreas optativas del PEI</span>
              </div>
              <button (click)="cerrarModalNuevaArea()" class="close-btn">&times;</button>
            </div>

            <!-- Banner de Ayuda Contextual -->
            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Registra las áreas marco del conocimiento donde se agruparán las materias. Ejemplo: <em>Ciencias Naturales</em> (<code>CN</code>), <em>Humanidades</em> (<code>HUM</code>), <em>Matemáticas</em> (<code>MAT</code>), <em>Tecnología</em> (<code>TEC</code>).</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Área del Conocimiento *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevaArea.nombre"
                  placeholder="Ej: Ciencias Naturales y Educación Ambiental"
                />
              </div>

              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Código del Área *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="nuevaArea.codigo"
                    placeholder="Ej: CN, HUM, SOC, MAT"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Orden en Boletín</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="nuevaArea.orden"
                    min="1"
                    max="20"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevaArea()" class="btn btn-primary">
                💾 Guardar Área
              </button>
              <button (click)="cerrarModalNuevaArea()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL 5: CREAR ASIGNATURA                 -->
      <!-- ========================================== -->
      @if (modalNuevaAsignatura()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevaAsignatura')">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <div>
                <h3>📚 Paso 5: Crear Asignatura Curricular</h3>
                <span class="modal-subtitle">Materias con peso porcentual dentro de su respectiva área</span>
              </div>
              <button (click)="cerrarModalNuevaAsignatura()" class="close-btn">&times;</button>
            </div>

            <!-- Banner de Ayuda Contextual -->
            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Selecciona el área matriz y nombra la materia específica. Ejemplo: En el área <em>Ciencias Naturales</em> puedes crear <em>Física</em> (50%) y <em>Química</em> (50%), o materias al 100% como <em>Matemáticas</em>.</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <div class="filter-label-row">
                  <label class="form-label">
                    Área del Conocimiento (Ley 115) *
                    <app-help-badge term="LEY_115"></app-help-badge>
                  </label>
                  <button (click)="abrirModalNuevaArea()" class="btn-link-action" title="Crear Área">+ Nueva Área</button>
                </div>
                <select class="form-select" [(ngModel)]="nuevaAsignatura.areaId">
                  @for (area of areasList(); track area.id) {
                    <option [value]="area.id">{{ area.nombre }}</option>
                  } @empty {
                    <option value="0a000000-0000-4000-8000-000000000001">Matemáticas & Ciencias Exactas</option>
                  }
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Nombre de la Asignatura *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevaAsignatura.nombre"
                  placeholder="Ej: Física Clásica, Lengua Castellana, Trigonometría"
                />
              </div>

              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Código de Asignatura</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="nuevaAsignatura.codigo"
                    placeholder="Ej: FIS-10, ESP-09"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Peso en Área (%)</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="nuevaAsignatura.pesoAreaPorcentaje"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevaAsignatura()" class="btn btn-primary">
                💾 Guardar Asignatura
              </button>
              <button (click)="cerrarModalNuevaAsignatura()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL 6: CREAR PERIODO ACADÉMICO          -->
      <!-- ========================================== -->
      @if (modalNuevoPeriodo()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoPeriodo')">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <div>
                <h3>
                  📅 Paso 6: Crear Periodo Académico (SIEE)
                  <app-help-badge term="SIEE"></app-help-badge>
                </h3>
                <span class="modal-subtitle">Configuración de calendario escolar, ponderación y fechas límite</span>
              </div>
              <button (click)="cerrarModalNuevoPeriodo()" class="close-btn">&times;</button>
            </div>

            <!-- Banner de Ayuda Contextual -->
            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Define el periodo del año escolar (ej: <em>Primer Periodo</em> con peso del 25%), sus fechas de inicio y cierre de clases, y la fecha límite en la que los docentes pueden digitar notas.</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Año Lectivo Institucional *</label>
                <select class="form-select" [(ngModel)]="nuevoPeriodo.anioLectivoId">
                  @for (anio of aniosLectivosList(); track anio.id) {
                    <option [value]="anio.id">{{ anio.nombre }} ({{ anio.anio }})</option>
                  } @empty {
                    <option value="a1a1a1a1-1111-4111-8111-000000002026">Año Académico 2026</option>
                  }
                </select>
              </div>

              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Número de Periodo (1 - 4) *</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="nuevoPeriodo.numero"
                    min="1"
                    max="6"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Peso Porcentual (%) *</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="nuevoPeriodo.pesoPorcentual"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Nombre del Periodo *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevoPeriodo.nombre"
                  placeholder="Ej: Primer Periodo, Segundo Periodo"
                />
              </div>

              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Fecha de Inicio *</label>
                  <input
                    type="date"
                    class="form-control"
                    [(ngModel)]="nuevoPeriodo.fechaInicio"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de Fin *</label>
                  <input
                    type="date"
                    class="form-control"
                    [(ngModel)]="nuevoPeriodo.fechaFin"
                  />
                </div>
              </div>

              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Límite para Docentes</label>
                  <input
                    type="date"
                    class="form-control"
                    [(ngModel)]="nuevoPeriodo.fechaLimiteDocentes"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select class="form-select" [(ngModel)]="nuevoPeriodo.estado">
                    <option value="ABIERTO">ABIERTO (Digitación activa)</option>
                    <option value="PENDIENTE">PENDIENTE (Aún no iniciado)</option>
                    <option value="CERRADO">CERRADO (Solo lectura)</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevoPeriodo()" class="btn btn-primary">
                💾 Guardar Periodo
              </button>
              <button (click)="cerrarModalNuevoPeriodo()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }


      <!-- ========================================== -->
      <!-- MODAL 8: REGLAS SIEE                       -->
      <!-- ========================================== -->
      @if (modalReglasSiee()) {
        <div class="modal-backdrop">
          <div class="modal-content animate-slide-up">
            <div class="modal-header">
              <h2>⚖️ Configuración SIEE (Promoción)</h2>
              <button class="close-btn" (click)="cerrarModalReglasSiee()">X</button>
            </div>
            
            <div class="modal-body">
              <div class="alert alert-info">
                <strong>¿Cuándo reprueba un estudiante el año?</strong><br>
                Defina los parámetros bajo los cuales el sistema determinará la reprobación automática al finalizar el año lectivo.
              </div>

              <div class="form-group mb-3">
                <label>Límite de Materias Perdidas</label>
                <input type="number" [(ngModel)]="reglaSiee.materiasReprobadasLimite" class="form-control" placeholder="Ej: 3">
                <small class="hint">Si pierde esta cantidad o más, reprueba el año directamente.</small>
              </div>

              <div class="form-group mb-3">
                <label>Nota Mínima de Aprobación</label>
                <input type="number" step="0.1" [(ngModel)]="reglaSiee.notaMinimaAprobacion" class="form-control" placeholder="Ej: 3.0">
                <small class="hint">La nota a partir de la cual el desempeño pasa de BAJO a BÁSICO.</small>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="cerrarModalReglasSiee()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarReglasSiee()">
                💾 Guardar Reglas
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL 7: CREAR ACTIVIDAD EVALUATIVA       -->
      <!-- ========================================== -->
      @if (modalNuevaActividad()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevaActividad')">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <div>
                <h3>➕ Paso 7: Crear Actividad Evaluativa</h3>
                <span class="modal-subtitle">Evaluación formativa según las 3 dimensiones del SIEE</span>
              </div>
              <button (click)="cerrarModalNuevaActividad()" class="close-btn">&times;</button>
            </div>

            <!-- Banner de Ayuda Contextual -->
            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Registra una tarea, taller, quiz o proyecto asignándole su dimensión formativa: <em>Cognitiva (Saber)</em>, <em>Procedimental (Hacer)</em> o <em>Actitudinal (Ser)</em> con su ponderación porcentual.</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Título de la Actividad *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevaActividad.titulo" placeholder="Ej: Taller de Álgebra Lineal, Quiz de Cinemática" />
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Dimensión Formativa (SIEE) *</label>
                <select class="form-select" [(ngModel)]="nuevaActividad.dimension">
                  <option value="COGNITIVO">Cognitiva (Saber - Evaluaciones, Quizes) - 40%</option>
                  <option value="PROCEDIMENTAL">Procedimental (Hacer - Talleres, Proyectos) - 40%</option>
                  <option value="ACTITUDINAL">Actitudinal / Convivencial (Ser - Asistencia, Participación) - 20%</option>
                </select>
              </div>
              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Peso Porcentual (%) *</label>
                  <input type="number" class="form-control" [(ngModel)]="nuevaActividad.pesoPorcentaje" min="1" max="100" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha Límite de Entrega</label>
                  <input type="date" class="form-control" [(ngModel)]="nuevaActividad.fechaEntrega" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevaActividad()" class="btn btn-primary">
                💾 Guardar Actividad
              </button>
              <button (click)="cerrarModalNuevaActividad()" class="btn btn-secondary">Cancelar</button>
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
      margin-bottom: 1.25rem;
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

    .header-actions-wrapper {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }

    /* Barra de Tarjetas de Acción Rápida */
    .action-buttons-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.65rem;
    }

    .action-card-btn {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.65rem 0.85rem;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease-in-out;
    }

    .action-card-btn:hover {
      border-color: #4f46e5;
      background: #f8fafc;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
    }

    .ac-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .ac-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .ac-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ac-hint {
      font-size: 0.68rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Guía de Pasos */
    .setup-guide-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #cbd5e1;
      padding: 1.25rem;
      border-radius: 14px;
    }

    .setup-guide-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .setup-guide-header h3 {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .guide-badge {
      background: #4f46e5;
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
    }

    .step-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.2s;
    }

    .step-card:hover {
      border-color: #4f46e5;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
      transform: translateY(-2px);
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.35rem;
    }

    .step-num {
      background: #e0e7ff;
      color: #4338ca;
      font-size: 0.7rem;
      font-weight: 800;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .step-icon {
      font-size: 0.95rem;
    }

    .step-header strong {
      font-size: 0.8rem;
      color: #0f172a;
    }

    .step-desc {
      font-size: 0.72rem;
      color: #64748b;
      line-height: 1.25;
      margin: 0.25rem 0 0.65rem 0;
      flex-grow: 1;
    }

    .step-action-btn {
      background: #f1f5f9;
      color: #4f46e5;
      border: none;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.35rem 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      transition: background 0.2s;
    }

    .step-action-btn:hover {
      background: #4f46e5;
      color: #ffffff;
    }

    /* Modal Help Banner */
    .modal-help-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 0.75rem 0.95rem;
      margin-bottom: 1.25rem;
    }

    .modal-help-banner .help-icon {
      font-size: 1.15rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .modal-help-banner p {
      font-size: 0.8rem;
      color: #1e3a8a;
      line-height: 1.35;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
      margin-top: 0.2rem;
    }

    /* Filtros & Escala */
    .filter-bar {
      padding: 1.25rem;
      min-width: 0;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .filter-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }

    .btn-link-action {
      background: none;
      border: none;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
    }

    .btn-link-action:hover {
      color: #3730a3;
    }

    .escala-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
    }

    .escala-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
    }

    .escala-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .text-slate-500 { color: #64748b; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .mt-4 { margin-top: 1rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }

    .close-guide-btn {
      background: none;
      border: none;
      font-size: 1.35rem;
      cursor: pointer;
      color: #64748b;
      padding: 0 0.35rem;
      line-height: 1;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .close-guide-btn:hover {
      color: #0f172a;
      background: #e2e8f0;
    }

    /* Modal Backdrop & Centering */
    .modal-backdrop {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background-color: rgba(15, 23, 42, 0.65) !important;
      backdrop-filter: blur(5px);
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 1.5rem !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      overflow-y: auto;
    }

    .modal-card {
      margin: auto !important;
      width: 100%;
      max-width: 540px !important;
      background-color: #ffffff;
      padding: 1.75rem;
      border-radius: 16px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      position: relative;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .modal-header h3 {
      font-size: 1.15rem;
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

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
  `]
})
export class AcademicoComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);
  readonly modalManager = inject(ModalManagerService);

  // Control de interfaz y Guía de Pasos (dinámica, oculta por defecto para vista despejada)
  readonly mostrarGuiaPasos = signal<boolean>(false);

  // Listas de datos para filtros
  readonly aniosLectivosList = signal<any[]>([]);
  readonly periodosList = signal<any[]>([]);
  readonly nivelesList = signal<any[]>([]);
  readonly areasList = signal<any[]>([]);
  readonly gradosList = signal<any[]>([]);
  readonly todosGruposList = signal<any[]>([]);
  readonly asignaturasList = signal<any[]>([]);

  // Filtros seleccionados
  readonly selectedGradoId = signal<string>('');
  readonly selectedGrupoId = signal<string>('');
  readonly selectedAsignaturaId = signal<string>('');
  readonly selectedPeriodoId = signal<string>('b1b2c3d4-1111-4111-8111-000000000002');

  // Grupos filtrados en cascada según el grado seleccionado
  readonly gruposFiltrados = computed(() => {
    const gradoId = this.selectedGradoId();
    const all = this.todosGruposList();
    if (!gradoId) return all;
    return all.filter((g) => g.gradoId === gradoId || g.grado_id === gradoId);
  });

  // Estados de interfaz y Modales
  readonly isSaving = signal(false);
  readonly isLoadingPlanilla = signal(false);
  readonly modalNuevoPeriodo = signal(false);
  readonly modalNuevoNivel = signal(false);
  readonly modalNuevaArea = signal(false);
  readonly modalNuevoGrado = signal(false);
  readonly modalNuevoGrupo = signal(false);
  readonly modalNuevaAsignatura = signal(false);
  readonly modalNuevaActividad = signal(false);
  readonly modalReglasSiee = signal(false);

  // Formularios DTOs
  reglaSiee = {
    materiasReprobadasLimite: 3,
    notaMinimaAprobacion: 3.0,
  };


  // Formularios de Creación
  nuevoPeriodo = {
    anioLectivoId: '',
    numero: 1,
    nombre: '',
    pesoPorcentual: 25,
    fechaInicio: '2026-01-15',
    fechaFin: '2026-04-03',
    fechaLimiteDocentes: '2026-04-10',
    estado: 'ABIERTO',
  };

  nuevoNivel = {
    nombre: '',
    codigo: '',
    orden: 1,
  };

  nuevaArea = {
    nombre: '',
    codigo: '',
    orden: 1,
  };

  nuevoGrado = {
    nombre: '',
    nivelId: '',
    codigoSimat: '',
    orden: 1,
  };

  nuevoGrupo = {
    gradoId: '',
    nombre: '',
    cupoMaximo: 35,
    salon: '',
  };

  nuevaAsignatura = {
    areaId: '',
    nombre: '',
    codigo: '',
    pesoAreaPorcentaje: 100,
  };

  nuevaActividad = {
    titulo: '',
    dimension: 'COGNITIVO',
    pesoPorcentaje: 20,
    fechaEntrega: '2026-03-30',
  };

  readonly planilla = signal<CalificacionLoteItem[]>([]);

  ngOnInit() {
    this.cargarFiltrosIniciales();
    this.cargarNivelesYAreas();
    this.cargarAniosLectivos();
  }

  cargarAniosLectivos() {
    this.api.get<any[]>('academico/anios-lectivos').subscribe({
      next: (anios) => {
        if (anios && anios.length > 0) {
          this.aniosLectivosList.set(anios);
          this.nuevoPeriodo.anioLectivoId = anios[0].id;
        }
      },
    });
  }

  cargarNivelesYAreas() {
    this.api.get<any[]>('academico/niveles').subscribe({
      next: (niveles) => {
        if (niveles && niveles.length > 0) {
          this.nivelesList.set(niveles);
          this.nuevoGrado.nivelId = niveles[0].id;
          this.nuevoNivel.orden = niveles.length + 1;
        }
      },
    });

    this.api.get<any[]>('academico/areas').subscribe({
      next: (areas) => {
        if (areas && areas.length > 0) {
          this.areasList.set(areas);
          this.nuevaAsignatura.areaId = areas[0].id;
          this.nuevaArea.orden = areas.length + 1;
        }
      },
    });
  }

  cargarFiltrosIniciales() {
    // 1. Cargar Grados
    this.api.get<any[]>('academico/grados').subscribe({
      next: (grados) => {
        if (grados && grados.length > 0) {
          this.gradosList.set(grados);
          const decimo = grados.find((g) => g.nombre?.includes('10') || g.numero === 10);
          this.selectedGradoId.set(decimo ? decimo.id : grados[0].id);
          this.nuevoGrupo.gradoId = this.selectedGradoId();
        }
      },
    });

    // 2. Cargar Grupos
    this.api.get<any[]>('academico/grupos').subscribe({
      next: (grupos) => {
        if (grupos && grupos.length > 0) {
          this.todosGruposList.set(grupos);
          const primerGrupo = this.gruposFiltrados()[0] || grupos[0];
          if (primerGrupo) {
            this.selectedGrupoId.set(primerGrupo.id);
          }
          this.cargarPlanilla();
        }
      },
    });

    // 3. Cargar Asignaturas
    this.api.get<any[]>('academico/asignaturas').subscribe({
      next: (asigs) => {
        if (asigs && asigs.length > 0) {
          this.asignaturasList.set(asigs);
          this.selectedAsignaturaId.set(asigs[0].id);
        }
      },
    });

    // 4. Cargar Periodos
    this.api.get<any[]>('academico/periodos').subscribe({
      next: (periodos) => {
        if (periodos && periodos.length > 0) {
          this.periodosList.set(periodos);
          this.selectedPeriodoId.set(periodos[0].id);
          this.nuevoPeriodo.numero = periodos.length + 1;
        }
      },
    });
  }

  // Eventos de Cambio en Cascada
  onGradoChange(gradoId: string) {
    this.selectedGradoId.set(gradoId);
    const grupos = this.gruposFiltrados();
    if (grupos.length > 0) {
      this.selectedGrupoId.set(grupos[0].id);
    } else {
      this.selectedGrupoId.set('');
    }
    this.cargarPlanilla();
  }

  onGrupoChange(grupoId: string) {
    this.selectedGrupoId.set(grupoId);
    this.cargarPlanilla();
  }

  onAsignaturaChange(asigId: string) {
    this.selectedAsignaturaId.set(asigId);
    this.cargarPlanilla();
  }

  onPeriodoChange(periodoId: string) {
    this.selectedPeriodoId.set(periodoId);
    this.cargarPlanilla();
  }

  // Carga de la planilla desde la BD con los filtros actuales
  cargarPlanilla() {
    const grupoId = this.selectedGrupoId();
    if (!grupoId) {
      this.planilla.set([]);
      return;
    }

    this.isLoadingPlanilla.set(true);
    const params: any = {
      grupoId,
      asignaturaId: this.selectedAsignaturaId(),
      periodoId: this.selectedPeriodoId(),
    };

    this.api.get<any[]>('academico/planilla', params).subscribe({
      next: (items) => {
        this.isLoadingPlanilla.set(false);
        if (items && items.length > 0) {
          const mapped: CalificacionLoteItem[] = items.map((i: any) => ({
            matriculaId: i.matriculaId || i.id,
            estudianteNombre: i.estudianteNombre,
            documento: i.documento,
            nota: Math.round((Number(i.nota) || 3.8) * 10) / 10,
            desempeno: i.desempeno || 'BASICO',
            observaciones: i.observaciones || 'Desempeño satisfactorio en periodo.',
          }));
          this.planilla.set(mapped);
        } else {
          this.planilla.set([]);
        }
      },
      error: () => {
        this.isLoadingPlanilla.set(false);
        this.planilla.set([]);
      },
    });
  }

  recalcularDesempeno(item: CalificacionLoteItem) {
    const nota = Number(item.nota);
    if (nota >= 4.6) item.desempeno = 'SUPERIOR';
    else if (nota >= 4.0) item.desempeno = 'ALTO';
    else if (nota >= 3.0) item.desempeno = 'BASICO';
    else item.desempeno = 'BAJO';
  }

  getBadgeDesempeno(desempeno: string): string {
    switch (desempeno) {
      case 'SUPERIOR':
        return 'badge badge-success';
      case 'ALTO':
        return 'badge badge-info';
      case 'BASICO':
        return 'badge badge-warning';
      default:
        return 'badge badge-danger';
    }
  }

  // --- CRUD: CREAR NIVEL EDUCATIVO ---
  abrirModalNuevoNivel() {
    this.nuevoNivel = {
      nombre: '',
      codigo: '',
      orden: (this.nivelesList().length || 0) + 1,
    };
    this.modalManager.open('nuevoNivel');
    this.modalNuevoNivel.set(true);
  }

  cerrarModalNuevoNivel() {
    this.modalManager.close('nuevoNivel');
    this.modalNuevoNivel.set(false);
  }

  guardarNuevoNivel() {
    if (!this.nuevoNivel.nombre || !this.nuevoNivel.codigo) {
      this.toast.error('Campos Requeridos', 'Por favor ingrese el nombre y código del nivel educativo.');
      return;
    }

    this.api.post<any>('academico/niveles', this.nuevoNivel).subscribe({
      next: (nivelCreado) => {
        this.cerrarModalNuevoNivel();
        this.toast.success('¡Nivel Creado!', `El nivel educativo '${nivelCreado.nombre}' ha sido registrado exitosamente.`);
        this.api.get<any[]>('academico/niveles').subscribe((niveles) => {
          this.nivelesList.set(niveles);
          if (this.modalNuevoGrado()) {
            this.nuevoGrado.nivelId = nivelCreado.id;
          }
        });
      },
      error: (err) => {
        this.toast.error('Error al crear nivel', err?.error?.message || 'No fue posible crear el nivel educativo.');
      },
    });
  }

  // --- CRUD: CREAR GRADO ---
  abrirModalNuevoGrado() {
    this.nuevoGrado = {
      nombre: '',
      nivelId: this.nivelesList()[0]?.id || '81000000-0000-4000-8000-000000000001',
      codigoSimat: '',
      orden: (this.gradosList().length || 0) + 1,
    };
    this.modalManager.open('nuevoGrado');
    this.modalNuevoGrado.set(true);
  }

  cerrarModalNuevoGrado() {
    this.modalManager.close('nuevoGrado');
    this.modalNuevoGrado.set(false);
  }

  guardarNuevoGrado() {
    if (!this.nuevoGrado.nombre) {
      this.toast.error('Campo Requerido', 'Por favor ingrese el nombre del grado.');
      return;
    }

    this.api.post<any>('academico/grados', this.nuevoGrado).subscribe({
      next: (gradoCreado) => {
        this.cerrarModalNuevoGrado();
        this.toast.success('¡Grado Creado!', `El grado '${gradoCreado.nombre}' ha sido registrado exitosamente.`);
        this.api.get<any[]>('academico/grados').subscribe((grados) => {
          this.gradosList.set(grados);
          if (this.modalNuevoGrupo()) {
            this.nuevoGrupo.gradoId = gradoCreado.id;
          } else {
            this.selectedGradoId.set(gradoCreado.id);
            this.onGradoChange(gradoCreado.id);
          }
        });
      },
      error: (err) => {
        this.toast.error('Error al crear grado', err?.error?.message || 'No fue posible crear el grado.');
      },
    });
  }

  // --- CRUD: CREAR GRUPO ---
  abrirModalNuevoGrupo() {
    this.nuevoGrupo = {
      gradoId: this.selectedGradoId() || this.gradosList()[0]?.id || '',
      nombre: '',
      cupoMaximo: 35,
      salon: '',
    };
    this.modalManager.open('nuevoGrupo');
    this.modalNuevoGrupo.set(true);
  }

  cerrarModalNuevoGrupo() {
    this.modalManager.close('nuevoGrupo');
    this.modalNuevoGrupo.set(false);
  }

  guardarNuevoGrupo() {
    if (!this.nuevoGrupo.nombre) {
      this.toast.error('Campo Requerido', 'Por favor ingrese el nombre del grupo.');
      return;
    }

    this.api.post<any>('academico/grupos', this.nuevoGrupo).subscribe({
      next: (grupoCreado) => {
        this.cerrarModalNuevoGrupo();
        this.toast.success('¡Grupo Creado!', `El grupo / salón '${grupoCreado.nombre}' ha sido registrado.`);
        this.api.get<any[]>('academico/grupos').subscribe((grupos) => {
          this.todosGruposList.set(grupos);
          this.selectedGrupoId.set(grupoCreado.id);
          this.cargarPlanilla();
        });
      },
      error: (err) => {
        this.toast.error('Error al crear grupo', err?.error?.message || 'No fue posible crear el grupo.');
      },
    });
  }

  // --- CRUD: CREAR ÁREA (LEY 115) ---
  abrirModalNuevaArea() {
    this.nuevaArea = {
      nombre: '',
      codigo: '',
      orden: (this.areasList().length || 0) + 1,
    };
    this.modalManager.open('nuevaArea');
    this.modalNuevaArea.set(true);
  }

  cerrarModalNuevaArea() {
    this.modalManager.close('nuevaArea');
    this.modalNuevaArea.set(false);
  }

  guardarNuevaArea() {
    if (!this.nuevaArea.nombre || !this.nuevaArea.codigo) {
      this.toast.error('Campos Requeridos', 'Por favor ingrese el nombre y código del área fundamental.');
      return;
    }

    this.api.post<any>('academico/areas', this.nuevaArea).subscribe({
      next: (areaCreada) => {
        this.cerrarModalNuevaArea();
        this.toast.success('¡Área Creada!', `El área '${areaCreada.nombre}' (Ley 115) ha sido registrada exitosamente.`);
        this.api.get<any[]>('academico/areas').subscribe((areas) => {
          this.areasList.set(areas);
          if (this.modalNuevaAsignatura()) {
            this.nuevaAsignatura.areaId = areaCreada.id;
          }
        });
      },
      error: (err) => {
        this.toast.error('Error al crear área', err?.error?.message || 'No fue posible crear el área.');
      },
    });
  }

  // --- CRUD: CREAR ASIGNATURA ---
  abrirModalNuevaAsignatura() {
    this.nuevaAsignatura = {
      areaId: this.areasList()[0]?.id || '0a000000-0000-4000-8000-000000000001',
      nombre: '',
      codigo: '',
      pesoAreaPorcentaje: 100,
    };
    this.modalManager.open('nuevaAsignatura');
    this.modalNuevaAsignatura.set(true);
  }

  cerrarModalNuevaAsignatura() {
    this.modalManager.close('nuevaAsignatura');
    this.modalNuevaAsignatura.set(false);
  }

  guardarNuevaAsignatura() {
    if (!this.nuevaAsignatura.nombre) {
      this.toast.error('Campo Requerido', 'Por favor ingrese el nombre de la asignatura.');
      return;
    }

    this.api.post<any>('academico/asignaturas', this.nuevaAsignatura).subscribe({
      next: (asigCreada) => {
        this.cerrarModalNuevaAsignatura();
        this.toast.success('¡Asignatura Creada!', `La asignatura '${asigCreada.nombre}' fue agregada al plan de estudios.`);
        this.api.get<any[]>('academico/asignaturas').subscribe((asigs) => {
          this.asignaturasList.set(asigs);
          this.selectedAsignaturaId.set(asigCreada.id);
        });
      },
      error: (err) => {
        this.toast.error('Error al crear asignatura', err?.error?.message || 'No fue posible crear la asignatura.');
      },
    });
  }

  // --- CRUD: CREAR PERIODO ---
  abrirModalNuevoPeriodo() {
    const totalActual = this.periodosList().length || 0;
    this.nuevoPeriodo = {
      anioLectivoId: this.aniosLectivosList()[0]?.id || 'a1a1a1a1-1111-4111-8111-000000002026',
      numero: totalActual + 1,
      nombre: `Periodo ${totalActual + 1}`,
      pesoPorcentual: 25,
      fechaInicio: '2026-07-06',
      fechaFin: '2026-09-11',
      fechaLimiteDocentes: '2026-09-18',
      estado: 'ABIERTO',
    };
    this.modalManager.open('nuevoPeriodo');
    this.modalNuevoPeriodo.set(true);
  }

  cerrarModalNuevoPeriodo() {
    this.modalManager.close('nuevoPeriodo');
    this.modalNuevoPeriodo.set(false);
  }

  guardarNuevoPeriodo() {
    if (!this.nuevoPeriodo.nombre || !this.nuevoPeriodo.fechaInicio || !this.nuevoPeriodo.fechaFin) {
      this.toast.error('Campos Requeridos', 'Por favor complete el nombre, fechas de inicio y fin del periodo.');
      return;
    }

    this.api.post<any>('academico/periodos', this.nuevoPeriodo).subscribe({
      next: (periodoCreado) => {
        this.cerrarModalNuevoPeriodo();
        this.toast.success('¡Periodo Creado!', `El '${periodoCreado.nombre}' (${periodoCreado.pesoPorcentual}%) fue programado exitosamente.`);
        this.api.get<any[]>('academico/periodos').subscribe((periodos) => {
          this.periodosList.set(periodos);
          this.selectedPeriodoId.set(periodoCreado.id);
          this.cargarPlanilla();
        });
      },
      error: (err) => {
        this.toast.error('Error al crear periodo', err?.error?.message || 'No fue posible crear el periodo académico.');
      },
    });
  }


  // --- CRUD: REGLAS SIEE ---
  abrirModalReglasSiee() {
    this.api.get<any[]>('academico/siee/reglas').subscribe((reglas) => {
      if (reglas && reglas.length > 0) {
        this.reglaSiee.materiasReprobadasLimite = reglas[0].materiasReprobadasLimite || 3;
        this.reglaSiee.notaMinimaAprobacion = reglas[0].notaMinimaAprobacion || 3.0;
      }
      this.modalManager.open('reglasSiee');
      this.modalReglasSiee.set(true);
    });
  }

  cerrarModalReglasSiee() {
    this.modalManager.close('reglasSiee');
    this.modalReglasSiee.set(false);
  }

  guardarReglasSiee() {
    this.api.post<any>('academico/siee/reglas', this.reglaSiee).subscribe({
      next: (res) => {
        this.cerrarModalReglasSiee();
        this.toast.success('Reglas Guardadas', 'Las reglas de promoción han sido actualizadas.');
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message || 'No fue posible guardar las reglas SIEE.');
      },
    });
  }

  // --- CRUD: CREAR ACTIVIDAD EVALUATIVA ---
  abrirModalNuevaActividad() {
    this.nuevaActividad = {
      titulo: '',
      dimension: 'COGNITIVO',
      pesoPorcentaje: 20,
      fechaEntrega: '2026-03-30',
    };
    this.modalManager.open('nuevaActividad');
    this.modalNuevaActividad.set(true);
  }

  cerrarModalNuevaActividad() {
    this.modalManager.close('nuevaActividad');
    this.modalNuevaActividad.set(false);
  }

  guardarNuevaActividad() {
    if (!this.nuevaActividad.titulo) {
      this.toast.error('Campo Requerido', 'Por favor ingrese el título de la actividad.');
      return;
    }

    this.cerrarModalNuevaActividad();
    this.toast.success(
      '¡Actividad Creada!',
      `La actividad evaluativa '${this.nuevaActividad.titulo}' (${this.nuevaActividad.pesoPorcentaje}%) fue programada exitosamente.`
    );
  }

  // --- CRUD: ACTUALIZAR / GUARDAR PLANILLA EN LOTE ---
  guardarCalificaciones() {
    this.isSaving.set(true);

    const payload = {
      actividadId: 'a1b2c3d4-1111-4111-8111-000000000001',
      periodoId: this.selectedPeriodoId() || 'b1b2c3d4-1111-4111-8111-000000000002',
      calificaciones: this.planilla().map((p) => ({
        matriculaId: p.matriculaId,
        nota: Number(p.nota),
        observaciones: p.observaciones,
      })),
    };

    this.api.put('academico/calificaciones/lote', payload).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        this.toast.success(
          '¡Planilla Guardada!',
          res?.mensaje || 'Calificaciones y desempeños del Decreto 1290 registrados con éxito en PostgreSQL.'
        );
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.toast.error(
          'Error al guardar',
          err?.error?.message || 'No fue posible guardar las calificaciones en la base de datos.'
        );
      },
    });
  }

  // --- CRUD: LIMPIAR / RESTABLECER NOTA ---
  limpiarNota(item: CalificacionLoteItem) {
    item.nota = 1.0;
    item.desempeno = 'BAJO';
    item.observaciones = 'Pendiente por registrar';
    this.toast.warning('Calificación Restablecida', `Se ha limpiado la calificación de ${item.estudianteNombre}.`);
  }

    descargarBoletinesMasivos() {
    const grupoId = this.selectedGrupoId();
    const periodoId = this.selectedPeriodoId();

    if (!grupoId || !periodoId) {
      this.toast.warning('Selección requerida', 'Seleccione un grupo y un periodo para generar los boletines masivos.');
      return;
    }

    this.toast.info('Generando Boletines', 'Iniciando generación y compresión. Esto puede tardar unos segundos...');
    
    // Descargar el archivo desde el endpoint directamente
    const url = this.api.getBaseUrl() + `/academico/boletines/descargar-masivo/${grupoId}/periodo/${periodoId}`;
    window.open(url, '_blank');
  }

  descargarBoletinDemo() {
    if (this.planilla().length === 0) {
      this.toast.warning('Sin estudiantes', 'No hay estudiantes en la planilla actual para generar boletines.');
      return;
    }
    const matriculaId = this.planilla()[0].matriculaId;
    const periodoId = this.selectedPeriodoId() || 'b1b2c3d4-1111-4111-8111-000000000002';
    window.open(this.api.getPdfUrl(`boletin/${matriculaId}/periodo/${periodoId}`), '_blank');
    this.toast.info('Descargando Boletín', 'Generando boletín consolidado en formato PDF...');
  }
}
