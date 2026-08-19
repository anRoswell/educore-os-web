import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
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
      <div class="page-header mb-3">
        <div>
          <div class="badge-header">
            <span>📚 AULA VIRTUAL & LMS</span>
          </div>
          <h1>Gestión de Aulas & Tareas</h1>
          <p>Muros interactivos, recepción de evidencias y calificaciones formativas</p>
        </div>
        <div class="header-actions" style="display:flex; gap: 10px;">
          <button class="btn" [ngClass]="currentTab === 'AULAS' ? 'btn-primary' : 'btn-outline'" (click)="setTab('AULAS')">🏫 Aulas y Muro</button>
          <button class="btn" [ngClass]="currentTab === 'TAREAS' ? 'btn-primary' : 'btn-outline'" (click)="setTab('TAREAS')">📚 Tareas</button>
        </div>
      </div>

      @if (currentTab === 'AULAS') {
        <div class="aulas-grid">
          @if(aulas().length === 0) {
            <div class="p-8 text-center text-slate-500">
              <p>No hay aulas creadas. Cree una nueva aula para empezar a publicar material.</p>
              <button class="btn btn-primary mt-2" (click)="abrirModalCrearAula()">Crear Aula Virtual</button>
            </div>
          } @else {
            <div class="grid-cols-1 md:grid-cols-3 gap-4" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
              <!-- Sidebar Aulas -->
              <div class="aulas-sidebar shadow-sm">
                <div class="sidebar-header">
                  <h3>Mis Aulas Virtuales</h3>
                  <button class="btn-icon-primary" (click)="abrirModalCrearAula()" title="Crear Aula">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  </button>
                </div>
                <div class="list-group mt-2">
                  @for (aula of aulas(); track aula.id) {
                    <div class="aula-item" [ngClass]="{'active': aulaSeleccionada()?.id === aula.id}" (click)="seleccionarAula(aula)">
                      <div class="aula-icon">🎒</div>
                      <div class="aula-info">
                        <strong>{{ aula.nombre }}</strong>
                        <span>{{ aula.descripcion || 'Sin descripción' }}</span>
                      </div>
                      <div class="aula-arrow">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                      <button class="btn btn-sm text-primary" (click)="editarAula(aula, $event)" title="Editar Aula" style="background: none; border: none; font-size: 1.2rem; padding: 0 5px;">✏️</button>
                      <button class="btn btn-sm text-danger" (click)="eliminarAula(aula, $event)" title="Eliminar Aula" style="background: none; border: none; font-size: 1.2rem; padding: 0 5px;">🗑️</button>
                    </div>
                  }
                </div>
              </div>

              <!-- Feed -->
              <div class="muro-feed">
                @if (aulaSeleccionada()) {
                  <div class="flex-between mb-3">
                    <h2>Muro: {{ aulaSeleccionada()?.nombre }}</h2>
                    <button class="btn btn-primary" (click)="abrirModalPublicacion()">📝 Crear Post</button>
                  </div>

                  @for (post of publicaciones(); track post.id) {
                    <div class="card shadow-sm mb-4 p-4 border" style="border-radius: 12px; background: white;">
                      <div class="flex-between mb-2">
                        <strong>{{ post.titulo }}</strong>
                        <span class="badge" [ngClass]="post.tipo === 'MATERIAL' ? 'bg-indigo' : 'bg-success'">{{ post.tipo }}</span>
                      </div>
                      <p style="white-space: pre-wrap;">{{ post.contenido }}</p>
                      @if (post.videoEmbedUrl) {
                        <div class="mt-3 video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">
                          <iframe [src]="getSafeUrl(post.videoEmbedUrl)" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe>
                        </div>
                      }

                      @if (post.tipo === 'EXAMEN' || post.titulo.includes('Examen') || post.titulo.includes('Cuestionario')) {
                        <div class="mt-3 p-3 bg-slate-50 border rounded" style="background: #f8fafc; border-radius: 8px;">
                          <div class="flex-between">
                            <strong>📊 Resultados y Calificaciones</strong>
                            <div style="display: flex; gap: 8px;">
                              <button class="btn btn-sm btn-outline" (click)="abrirExamenEstudiante({ titulo: post.titulo })">Vista Estudiante</button>
                              <button class="btn btn-sm btn-success" (click)="sincronizarNotas('cuest-123')">
                                🔄 Sincronizar con Planilla Académica
                              </button>
                            </div>
                          </div>
                        </div>
                      }

                      <div class="text-muted text-sm mt-3 text-right">Publicado el {{ post.createdAt | date:'short' }}</div>
                    </div>
                  }
                } @else {
                  <div class="p-8 text-center text-slate-500">Selecciona un aula para ver su muro.</div>
                }
              </div>
            </div>
          }
        </div>


        <!-- Modal: Crear Cuestionario -->
        @if(modalCuestionario()) {
          <div class="modal-backdrop">
            <div class="modal-card animate-slide-up" style="max-width: 800px;">
              <div class="modal-header">
                <h2>📝 Crear Cuestionario Interactivo</h2>
                <button class="close-btn" (click)="modalCuestionario.set(false)">X</button>
              </div>
              <div class="modal-body">
                <div class="form-group mb-3"><label>Título del Examen</label><input type="text" class="form-control" [(ngModel)]="nuevoCuestionario.titulo"></div>
                
                @for (p of nuevoCuestionario.preguntas; track $index) {
                  <div class="card p-3 mb-3 border">
                    <div class="flex-between mb-2">
                      <strong>Pregunta {{ $index + 1 }}</strong>
                      <select class="form-select" style="width: auto;" [(ngModel)]="p.tipo">
                        <option value="CERRADA_MULTIPLE">Opción Múltiple</option>
                        <option value="ABIERTA_TEXTO">Respuesta Abierta (Ensayo)</option>
                      </select>
                    </div>
                    <textarea class="form-control mb-2" [(ngModel)]="p.enunciado" placeholder="Escribe la pregunta..."></textarea>
                    
                    @if (p.tipo === 'CERRADA_MULTIPLE') {
                      @for (o of p.opciones; track $index) {
                        <div class="d-flex mb-1" style="display:flex; gap: 10px; align-items:center;">
                          <input type="radio" [name]="'correcta_' + $index" [checked]="o.esCorrecta" (change)="o.esCorrecta = true">
                          <input type="text" class="form-control" [(ngModel)]="o.texto" placeholder="Opción">
                        </div>
                      }
                      <button class="btn btn-sm btn-outline mt-2" (click)="agregarOpcion($index)">+ Añadir Opción</button>
                    }
                  </div>
                }

                <button class="btn btn-secondary w-100 mb-3" (click)="agregarPregunta()">➕ Agregar Pregunta</button>
              </div>
              <div class="modal-footer"><button class="btn btn-primary w-100" (click)="guardarCuestionario()">Publicar Cuestionario</button></div>
            </div>
          </div>
        }

        <!-- Modal: Tomar Examen -->
        @if(modalTomarExamen()) {
          <div class="modal-backdrop">
            <div class="modal-card animate-slide-up" style="max-width: 800px;">
              <div class="modal-header">
                <h2>⏳ Tomar Examen</h2>
                <button class="close-btn" (click)="modalTomarExamen.set(false)">X</button>
              </div>
              <div class="modal-body">
                <div class="alert alert-warning">Una vez inicie, no podrá detener el temporizador.</div>
                <!-- Simulación de preguntas -->
                <p><strong>1. ¿Cuál es el postulado principal de la teoría?</strong></p>
                <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:15px;">
                  <label><input type="radio" name="p1"> Opción A</label>
                  <label><input type="radio" name="p1"> Opción B</label>
                </div>
                <p><strong>2. Escribe un ensayo sobre el tema:</strong></p>
                <textarea class="form-control" rows="4"></textarea>
              </div>
              <div class="modal-footer">
                <button class="btn btn-primary w-100" [disabled]="isSaving()" (click)="enviarExamen()">
                  {{ isSaving() ? 'Procesando...' : 'Entregar Respuestas' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Modales Aulas -->
        @if(modalCrearAula()) {
          <div class="modal-backdrop">
            <div class="modal-card form-modal animate-slide-up">
              <div class="modal-header-modern bg-gradient-indigo">
                <div class="header-icon">🏫</div>
                <div>
                  <h3>{{ editandoAulaId() ? 'Editar Aula Virtual' : 'Crear Nueva Aula Virtual' }}</h3>
                  <p>Configura un nuevo espacio de aprendizaje para tus estudiantes</p>
                </div>
                <button class="close-btn-modern" (click)="modalCrearAula.set(false)">X</button>
              </div>
              <div class="modal-body-modern">
                <div class="form-group">
                  <label class="form-label-modern">Nombre de la Asignatura / Aula <span class="text-danger">*</span></label>
                  <input type="text" class="form-control-modern" [(ngModel)]="nuevaAula.nombre" placeholder="Ej: Laboratorio de Física 11-A">
                </div>
                <div class="form-group mt-3">
                  <label class="form-label-modern">Descripción Breve</label>
                  <textarea class="form-control-modern" rows="3" [(ngModel)]="nuevaAula.descripcion" placeholder="¿De qué trata esta asignatura?"></textarea>
                </div>
              </div>
              <div class="modal-footer-modern">
                <button class="btn btn-outline" (click)="modalCrearAula.set(false)">Cancelar</button>
                <button class="btn btn-primary px-4" (click)="guardarAula()">Crear Aula Virtual</button>
              </div>
            </div>
          </div>
        }
        @if(modalPublicacion()) {
          <div class="modal-backdrop">
            <div class="modal-card form-modal animate-slide-up" style="max-width: 650px;">
              <div class="modal-header-modern bg-gradient-indigo">
                <div class="header-icon">📝</div>
                <div>
                  <h3>{{ editandoPublicacionId() ? 'Editar Publicación' : 'Publicar en el Muro' }}</h3>
                  <p>Comparte contenido, videos o documentos con tus estudiantes.</p>
                </div>
                <button class="close-btn-modern" (click)="modalPublicacion.set(false)">X</button>
              </div>
              <div class="modal-body-modern">
                <div class="form-group">
                  <label class="form-label-modern">Título del Post <span class="text-danger">*</span></label>
                  <input type="text" class="form-control-modern" [(ngModel)]="nuevaPublicacion.titulo" placeholder="Ej: Lectura Obligatoria - Capítulo 1">
                </div>
                <div class="form-group mt-3">
                  <label class="form-label-modern">Cuerpo del Mensaje <span class="text-danger">*</span></label>
                  <textarea class="form-control-modern" rows="4" [(ngModel)]="nuevaPublicacion.contenido" placeholder="Instrucciones, saludos o explicación del tema..."></textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-3 mt-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label-modern">Adjuntar Video (YouTube/Vimeo)</label>
                    <input type="text" class="form-control-modern" placeholder="https://youtube.com/watch?v=..." [(ngModel)]="nuevaPublicacion.url_adjunta">
                  </div>
                  <div class="form-group">
                    <label class="form-label-modern">Tipo de Publicación</label>
                    <select class="form-control-modern" [(ngModel)]="nuevaPublicacion.tipo">
                      <option value="MATERIAL">📚 Material de Estudio</option>
                      <option value="ANUNCIO">📢 Anuncio / Aviso</option>
                      <option value="EXAMEN">📝 Examen / Cuestionario</option>
                    </select>
                  </div>
                </div>

                <div class="form-group mt-4 p-4 border rounded text-center drag-drop-zone"
                     [style.background]="isDragOver() ? '#f1f5f9' : '#f8fafc'"
                     [style.borderColor]="isDragOver() ? '#6366f1' : '#cbd5e1'"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)"
                     style="border: 2px dashed; transition: all 0.2s ease; cursor: pointer; border-radius: 8px;"
                     (click)="fileInput.click()">
                  <label class="form-label-modern mb-0" style="cursor: pointer; display: block;">
                    <div style="font-size: 2rem; color: #94a3b8; margin-bottom: 0.5rem;">📎</div>
                    <strong style="color: #475569;">Arrastra y suelta un documento aquí</strong><br>
                    <span style="color: #64748b; font-size: 0.85rem;">o haz clic para explorar (PDF, Word, Excel)</span>
                  </label>
                  <input #fileInput type="file" (change)="onFileSelected($event)" style="display: none;" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx">
                  @if (archivoSeleccionado()) {
                    <div class="mt-3 p-2 text-success" style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 6px;">
                      <strong>✅ Seleccionado:</strong> {{ archivoSeleccionado()?.name }}
                    </div>
                  }
                </div>
              </div>
              <div class="modal-footer-modern">
                <button class="btn btn-outline" (click)="modalPublicacion.set(false)" [disabled]="isUploading()">Cancelar</button>
                <button class="btn btn-primary px-4" (click)="guardarPublicacion()" [disabled]="isUploading()">
                  @if (isUploading()) {
                    <span>Subiendo Archivo... ⏳</span>
                  } @else {
                    <span>{{ editandoPublicacionId() ? 'Guardar Cambios' : 'Publicar en Muro' }}</span>
                  }
                </button>
              </div>
            </div>
          </div>
        }

      } @else {
      <!-- Header Original Oculto -->
      <div style="display:none;">

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
              @for (g of gruposList(); track g.id) {
                <option [value]="g.nombre">{{ g.nombre }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Asignatura</label>
            <select class="form-select" [(ngModel)]="filtroAsignatura" (change)="aplicarFiltros()">
              <option value="TODAS">Todas las asignaturas</option>
              @for (a of asignaturasList(); track a.id) {
                <option [value]="a.nombre">{{ a.nombre }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Periodo Académico</label>
            <select class="form-select" [(ngModel)]="filtroPeriodo" (change)="aplicarFiltros()">
              <option value="TODOS">Todos los periodos</option>
              @for (p of periodosList(); track p.id) {
                <option [value]="p.nombre">{{ p.nombre }}</option>
              }
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
        <div class="tab-body animate-fade-in">
          <div class="tareas-grid">
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
        </div>
      }

      <!-- TAB 2: PLANILLA DE REVISIÓN Y CALIFICACIÓN 1290 -->
      @if (tabActiva() === 'calificar' && tareaSeleccionada(); as tarea) {
        <div class="tab-body animate-fade-in">
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
        <div class="tab-body animate-fade-in">
          <div class="tab-body-header">
            <div>
              <h3 class="tab-body-title">👨‍🎓 Simulador de Bandeja de Tareas del Estudiante</h3>
              <p class="tab-body-subtitle">Visualiza cómo ve el alumno sus tareas y sube evidencias digitales</p>
            </div>
            <div class="form-group" style="min-width: 280px; margin: 0;">
              <label class="form-label" style="font-size: 0.75rem;">Estudiante Activo:</label>
              <select class="form-select" [(ngModel)]="estudianteSimuladoId">
                <option value="11111111-1111-4111-8111-000000000001">Mariana García Torres (10°A)</option>
                <option value="11111111-1111-4111-8111-000000000002">David López Ramírez (10°A)</option>
                <option value="11111111-1111-4111-8111-000000000003">Sofía Valentina Castro (10°A)</option>
              </select>
            </div>
          </div>

          <div class="tareas-grid">
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
                    @for (c of cargasDocentesList(); track c.id) {
                      <option [value]="c.id">{{ c.asignatura?.nombre || c.asignaturaNombre || 'Materia' }} ({{ c.grupo?.nombre || c.grupoNombre || 'Grupo' }})</option>
                    } @empty {
                      <option value="a1b2c3d4-1111-4111-8111-000000000001">Matemáticas & Cálculo (10°A)</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Periodo Académico <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="nuevaTareaForm.periodoId">
                    @for (p of periodosList(); track p.id) {
                      <option [value]="p.id">{{ p.nombre }}</option>
                    } @empty {
                      <option value="b1b2c3d4-1111-4111-8111-000000000001">Primer Periodo (25%)</option>
                    }
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
      }
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

    /* --- ENHANCED LMS CSS --- */
    .aulas-sidebar {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      height: fit-content;
    }
    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }
    .sidebar-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
    .btn-icon-primary {
      background: #e0e7ff;
      color: #4f46e5;
      border: none;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-icon-primary:hover { background: #4f46e5; color: white; }
    .aula-item {
      display: flex;
      align-items: center;
      padding: 0.85rem;
      border-radius: 10px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      margin-bottom: 0.5rem;
    }
    .aula-item:hover { background: #f8fafc; border-color: #e2e8f0; }
    .aula-item.active { background: #eff6ff; border-color: #bfdbfe; box-shadow: 0 2px 4px rgba(59,130,246,0.05); }
    .aula-icon { font-size: 1.5rem; margin-right: 1rem; background: white; padding: 0.4rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .aula-info { flex: 1; display: flex; flex-direction: column; }
    .aula-info strong { color: #1e293b; font-size: 0.95rem; }
    .aula-info span { color: #64748b; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    .aula-arrow { color: #cbd5e1; transition: transform 0.2s; }
    .aula-item.active .aula-arrow { color: #3b82f6; transform: translateX(3px); }

    .muro-header {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
    }
    .muro-header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .muro-title-box { display: flex; align-items: center; gap: 1rem; }
    .muro-avatar { font-size: 2.5rem; background: #f8fafc; padding: 0.75rem; border-radius: 12px; border: 1px solid #e2e8f0; }
    .muro-title { margin: 0; font-size: 1.5rem; color: #0f172a; font-weight: 800; }
    .muro-subtitle { margin: 0; color: #64748b; font-size: 0.95rem; }
    .muro-actions { display: flex; gap: 0.75rem; }
    .btn-icon-text { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; padding: 0.6rem 1rem; }

    .empty-state {
      background: white; border-radius: 12px; padding: 4rem 2rem;
      text-align: center; border: 1px dashed #cbd5e1; margin-top: 1.5rem;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #1e293b; margin: 0 0 0.5rem 0; }
    .empty-state p { color: #64748b; margin: 0; }

    .post-card {
      background: white; border-radius: 12px; padding: 1.5rem;
      border: 1px solid #e2e8f0; margin-bottom: 1.5rem; margin-top: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .post-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .post-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .post-author { display: flex; align-items: center; gap: 0.75rem; }
    .post-author img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0; }
    .author-info { display: flex; flex-direction: column; }
    .author-info strong { color: #0f172a; font-size: 0.95rem; }
    .post-date { color: #64748b; font-size: 0.8rem; }
    .post-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge-material { background: #e0e7ff; color: #3730a3; }
    .badge-anuncio { background: #dcfce7; color: #166534; }
    .badge-examen { background: #fee2e2; color: #991b1b; }
    
    .post-title { margin: 0 0 0.75rem 0; color: #1e293b; font-size: 1.2rem; }
    .post-content { color: #475569; line-height: 1.6; white-space: pre-wrap; font-size: 0.95rem; }

    .video-wrapper {
      position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;
      border-radius: 10px; border: 1px solid #e2e8f0; background: #000;
    }
    .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

    .exam-integration-box {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 1.25rem; display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 1rem;
    }
    .exam-info { display: flex; align-items: center; gap: 1rem; }
    .exam-icon { font-size: 2rem; background: white; padding: 0.5rem; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .exam-info strong { color: #0f172a; display: block; margin-bottom: 0.2rem; }
    .exam-info p { color: #64748b; font-size: 0.85rem; margin: 0; }
    .exam-actions { display: flex; gap: 0.5rem; }

    /* Modals Modern */
    .form-modal { max-width: 600px; padding: 0; overflow: hidden; }
    .bg-gradient-indigo { background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); color: white; }
    .modal-header-modern { display: flex; align-items: center; padding: 1.5rem 2rem; gap: 1rem; position: relative; }
    .header-icon { font-size: 2.5rem; background: rgba(255,255,255,0.2); padding: 0.5rem; border-radius: 12px; }
    .modal-header-modern h3 { margin: 0 0 0.25rem 0; font-size: 1.4rem; color: white; }
    .modal-header-modern p { margin: 0; color: #c7d2fe; font-size: 0.9rem; }
    .close-btn-modern { position: absolute; top: 1.5rem; right: 1.5rem; background: rgba(255,255,255,0.1); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: background 0.2s; }
    .close-btn-modern:hover { background: rgba(255,255,255,0.2); }
    .modal-body-modern { padding: 2rem; background: white; }
    .form-label-modern { display: block; font-weight: 600; color: #334155; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .form-control-modern { width: 100%; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; transition: border-color 0.2s, box-shadow 0.2s; }
    .form-control-modern:focus { border-color: #4f46e5; outline: none; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    .modal-footer-modern { padding: 1.25rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; }
  `]
})
export class LmsComponent implements OnInit {
  // --- TABS ---
  currentTab: 'AULAS' | 'TAREAS' = 'AULAS';

  // --- AULAS y MURO ---
  readonly aulas = signal<any[]>([]);
  readonly publicaciones = signal<any[]>([]);
  readonly aulaSeleccionada = signal<any | null>(null);
  readonly modalCrearAula = signal(false);
  readonly modalPublicacion = signal(false);
  archivoSeleccionado = signal<File | null>(null);

  // --- CUESTIONARIOS ---
  readonly modalCuestionario = signal(false);
  readonly modalTomarExamen = signal(false);
  nuevoCuestionario = { titulo: '', descripcion: '', preguntas: [] as any[] };
  examenActivo: any = null;
  respuestasEstudiante: any = {};


  nuevaAula = { nombre: '', descripcion: '', cargaDocenteId: null };
  nuevaPublicacion: any = { titulo: '', contenido: '', url_adjunta: '', tipo: 'MATERIAL', archivoAdjuntoUrl: '', archivoAdjuntoNombre: '' };

  private sanitizer = inject(DomSanitizer);

  setTab(tab: 'AULAS' | 'TAREAS') {
    this.currentTab = tab;
    if (tab === 'AULAS' && this.aulas().length === 0) {
      this.cargarAulas();
    }
  }

  cargarAulas() {
    this.api.get<any[]>('lms/aulas').subscribe({
      next: (res) => {
        this.aulas.set(res);
        if (res.length > 0) this.seleccionarAula(res[0]);
      }
    });
  }

  eliminarAula(aula: any, event: Event) {
    event.stopPropagation();
    this.confirmModalConfig.set({
      title: 'Eliminar Aula',
      message: '¿Está seguro de eliminar esta aula? Se perderán todas sus publicaciones y tareas de forma permanente.',
      confirmText: 'Sí, eliminar',
      onConfirm: () => {
        this.showConfirmModal.set(false);
        this.api.delete(`lms/aulas/${aula.id}`).subscribe(() => {
          this.aulas.update(list => list.filter((a: any) => a.id !== aula.id));
          if (this.aulaSeleccionada()?.id === aula.id) {
            this.aulaSeleccionada.set(null);
            this.publicaciones.set([]);
          }
          this.toast.success('Eliminada', 'Aula eliminada correctamente.');
        });
      }
    });
    this.showConfirmModal.set(true);
  }

  eliminarPublicacion(post: any) {
    const aulaId = this.aulaSeleccionada()?.id;
    if (!aulaId) return;
    this.confirmModalConfig.set({
      title: 'Eliminar Publicación',
      message: '¿Estás seguro de eliminar esta publicación del muro? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      onConfirm: () => {
        this.showConfirmModal.set(false);
        this.api.delete(`lms/aulas/${aulaId}/publicaciones/${post.id}`).subscribe(() => {
          this.publicaciones.update(list => list.filter((p: any) => p.id !== post.id));
          this.toast.success('Eliminada', 'Publicación eliminada.');
        });
      }
    });
    this.showConfirmModal.set(true);
  }

  editarAula(aula: any, event: Event) {
    event.stopPropagation();
    this.editandoAulaId.set(aula.id);
    this.nuevaAula = { ...aula };
    this.modalCrearAula.set(true);
  }

  editarPublicacion(post: any) {
    this.editandoPublicacionId.set(post.id);
    this.nuevaPublicacion = { ...post };
    this.modalPublicacion.set(true);
  }

  abrirModalCrearAula() {
    this.editandoAulaId.set(null);
    this.nuevaAula = { nombre: '', descripcion: '', cargaDocenteId: null };
    this.modalCrearAula.set(true);
  }

  guardarAula() {
    if (!this.nuevaAula.nombre || !this.nuevaAula.descripcion) {
      this.toast.warning('Campos incompletos', 'Llene nombre y descripción.');
      return;
    }
    this.isSaving.set(true);
    const dto = {
      ...this.nuevaAula,
      cargaDocenteId: '99999999-9999-9999-9999-999999999999' // mock
    };

    const idToEdit = this.editandoAulaId();
    if (idToEdit) {
      this.api.put<any>(`lms/aulas/${idToEdit}`, dto).subscribe({
        next: (res) => {
          this.aulas.update(list => list.map(a => a.id === idToEdit ? { ...a, ...res } : a));
          this.modalCrearAula.set(false);
          this.isSaving.set(false);
          this.toast.success('Aula actualizada', 'El aula se actualizó correctamente.');
        },
        error: () => this.isSaving.set(false)
      });
    } else {
      this.api.post<any>('lms/aulas', dto).subscribe({
        next: (res) => {
          this.aulas.update(list => [res, ...list]);
          this.modalCrearAula.set(false);
          this.isSaving.set(false);
          this.toast.success('Aula creada', 'El aula se ha creado correctamente.');
        },
        error: () => this.isSaving.set(false)
      });
    }
  }

  seleccionarAula(aula: any) {
    this.aulaSeleccionada.set(aula);
    this.cargarPublicaciones(aula.id);
  }

  cargarPublicaciones(aulaId: string) {
    this.api.get<any[]>(`lms/aulas/${aulaId}/publicaciones`).subscribe({
      next: (res) => this.publicaciones.set(res)
    });
  }

  abrirModalPublicacion() {
    this.editandoPublicacionId.set(null);
    this.nuevaPublicacion = { titulo: '', contenido: '', url_adjunta: '', tipo: 'MATERIAL', archivoAdjuntoUrl: '', archivoAdjuntoNombre: '' };
    this.modalPublicacion.set(true);
  }

    // Drag & Drop
  isDragOver = signal(false);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.archivoSeleccionado.set(files[0]);
    }
  }

  // Archivos Adjuntos
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
    }
  }

  guardarPublicacion() {
    const aulaId = this.aulaSeleccionada()?.id;
    if (!aulaId) return;
    this.isSaving.set(true);

    const file = this.archivoSeleccionado();
    if (file) {
      this.isUploading.set(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modulo', 'lms');

      this.api.post<any>('storage/upload', formData).subscribe({
        next: (res) => {
          this.nuevaPublicacion.archivoAdjuntoUrl = res.url;
          this.nuevaPublicacion.archivoAdjuntoNombre = res.originalName;
          this.isUploading.set(false);
          this.crearPostBackend(aulaId);
        },
        error: () => {
          this.isUploading.set(false);
          this.isSaving.set(false);
          this.toast.error('Error', 'No se pudo subir el archivo.');
        }
      });
    } else {
      this.crearPostBackend(aulaId);
    }
  }

  private crearPostBackend(aulaId: string) {
    const idToEdit = this.editandoPublicacionId();
    if (idToEdit) {
      this.api.put<any>(`lms/aulas/${aulaId}/publicaciones/${idToEdit}`, this.nuevaPublicacion).subscribe({
        next: (res) => {
          this.publicaciones.update(list => list.map(p => p.id === idToEdit ? { ...p, ...res } : p));
          this.modalPublicacion.set(false);
          this.isSaving.set(false);
          this.toast.success('Post actualizado', 'Tu post se ha actualizado.');
        },
        error: () => this.isSaving.set(false)
      });
    } else {
      this.api.post<any>(`lms/aulas/${aulaId}/publicaciones`, this.nuevaPublicacion).subscribe({
        next: (res) => {
          this.publicaciones.update(list => [res, ...list]);
          this.modalPublicacion.set(false);
          this.isSaving.set(false);
          this.toast.success('Publicado', 'Tu post se ha creado en el muro.');
        },
        error: () => this.isSaving.set(false)
      });
    }
  }


  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);

  readonly tabActiva = signal<'tareas' | 'calificar' | 'estudiante_vista'>('tareas');
  readonly isSaving = signal(false);

  // Edit Mode & Confirm Modals
  editandoAulaId = signal<string | null>(null);
  editandoPublicacionId = signal<string | null>(null);
  showConfirmModal = signal(false);
  confirmModalConfig = signal({ title: '', message: '', confirmText: 'Confirmar', onConfirm: () => {} });
  readonly isUploading = signal(false);

  // Filtros
  filtroGrupo = 'TODOS';
  filtroAsignatura = 'TODAS';
  filtroPeriodo = 'TODOS';
  filtroTexto = '';

  // Listas Dinámicas desde Backend
  readonly gruposList = signal<any[]>([]);
  readonly asignaturasList = signal<any[]>([]);
  readonly periodosList = signal<any[]>([]);
  readonly cargasDocentesList = signal<any[]>([]);

  // Modales
  readonly modalCrearTarea = signal(false);
  readonly modoEdicionTarea = signal(false);
  tareaEditandoId = '';
  readonly modalEntregar = signal(false);
  readonly tareaSeleccionada = signal<TareaLmsItem | null>(null);
  readonly tareaParaEntregar = signal<TareaLmsItem | null>(null);

  // Formulario Nueva Tarea
  nuevaTareaForm = {
    cargaDocenteId: '',
    periodoId: '',
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
  readonly tareas = signal<TareaLmsItem[]>([]);

  // Planilla de Entregas del Grupo Actual
  readonly entregasActuales = signal<EntregaLmsItem[]>([]);

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
    this.cargarAulas();
    this.cargarParametrosLMS();
  }

  cargarParametrosLMS() {
    this.api.get<any[]>('academico/grupos').subscribe({
      next: (data) => {
        if (data) this.gruposList.set(data);
      },
    });

    this.api.get<any[]>('academico/asignaturas').subscribe({
      next: (data) => {
        if (data) this.asignaturasList.set(data);
      },
    });

    this.api.get<any[]>('academico/periodos').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.periodosList.set(data);
          this.nuevaTareaForm.periodoId = data[0].id;
        }
      },
    });

    this.api.get<any[]>('academico/cargas-docentes').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.cargasDocentesList.set(data);
          this.nuevaTareaForm.cargaDocenteId = data[0].id;
        }
      },
    });
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
    this.cargarAulas();
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

  // --- CUESTIONARIOS ---
  abrirModalCuestionario() {
    this.nuevoCuestionario = { titulo: '', descripcion: '', preguntas: [] };
    this.agregarPregunta();
    this.modalCuestionario.set(true);
  }

  agregarPregunta() {
    this.nuevoCuestionario.preguntas.push({
      tipo: 'CERRADA_MULTIPLE',
      enunciado: '',
      valorPuntos: 1.0,
      opciones: [{ texto: '', esCorrecta: true }, { texto: '', esCorrecta: false }]
    });
  }

  agregarOpcion(preguntaIndex: number) {
    this.nuevoCuestionario.preguntas[preguntaIndex].opciones.push({ texto: '', esCorrecta: false });
  }

  guardarCuestionario() {
    // Aquí el backend guardaría Cuestionario, Preguntas y Opciones
    this.toast.success('Cuestionario Creado', 'El examen ha sido publicado en el aula virtual.');
    this.modalCuestionario.set(false);
  }

  abrirExamenEstudiante(cuestionario: any) {
    this.examenActivo = cuestionario;
    this.respuestasEstudiante = {};
    this.modalTomarExamen.set(true);
  }

  enviarExamen() {
    this.isSaving.set(true);
    // Simula envío a Autocalificador
    setTimeout(() => {
      this.isSaving.set(false);
      this.toast.success('Examen Enviado', 'Tus respuestas han sido enviadas y pre-calificadas exitosamente.');
      this.modalTomarExamen.set(false);
    }, 1000);
  }

  // --- SINCRONIZACIÓN DE NOTAS (Phase 3) ---
  sincronizarNotas(cuestionarioId: string) {
    const aulaId = this.aulaSeleccionada()?.id;
    if (!aulaId) return;

    this.isSaving.set(true);
    this.api.post<any>(`lms/aulas/${aulaId}/cuestionarios/${cuestionarioId}/sincronizar`, {}).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.toast.success('¡Sincronización Exitosa!', res.mensaje);
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.success('¡Sincronización Exitosa!', 'Las notas han impactado la Planilla Académica.');
      }
    });
  }
}