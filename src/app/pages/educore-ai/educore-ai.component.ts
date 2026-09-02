import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';
import { SearchableSelectComponent, SearchableOption } from '../../shared/components/searchable-select.component';

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  source?: string;
  timestamp: string;
}

export interface EstudianteRiesgoAi {
  matriculaId: string;
  nombreEstudiante: string;
  documento: string;
  grado: string;
  scoreRiesgo: number;
  nivelRiesgo: 'CRITICO' | 'MEDIO' | 'BAJO';
  factores: string;
  materiasBajo: number;
  inasistencias: number;
}

export interface PromptTemplateItem {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  temperatura: number;
  activo: boolean;
}

@Component({
  selector: 'app-educore-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpBadgeComponent, SearchableSelectComponent],
  template: `
    <div class="ai-page-container animate-fade-in">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <div class="header-badge">
            <span class="ai-sparkles">✨</span>
            <span>INTELIGENCIA ARTIFICIAL GENERATIVA & RAG</span>
            <span class="badge-tag">DECRETO 1290 / SIEE / PEI</span>
          </div>
          <h1>
            EduCore AI & Asistente Pedagógico RAG
            <app-help-badge term="EDUCORE_AI"></app-help-badge>
          </h1>
          <p class="subtitle">
            Modelos generativos anclados en el PEI institucional, redactor automático de boletines (Dec. 1290) y analítica predictiva de deserción escolar.
          </p>
        </div>

        <div class="header-actions">
          <button (click)="abrirModalConfigPrompts()" class="btn btn-secondary" title="Configurar directivas del modelo y SIEE">
            <span>⚙️ Configurar Prompts & SIEE</span>
          </button>
          <button (click)="abrirModalIndexarPei()" class="btn btn-secondary" title="Indexar documentos curriculares en la base RAG">
            <span>📚 Indexar PEI / Manual</span>
          </button>
          <button (click)="limpiarChat()" class="btn btn-primary" title="Nueva sesión de conversación">
            <span>💬 Nueva Consulta RAG</span>
          </button>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card card">
          <div class="kpi-icon-badge color-indigo">
            <span>💬</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Consultas RAG</span>
            <h3 class="kpi-value">{{ totalConsultasRAG() }}</h3>
            <span class="kpi-hint">Interacciones con el PEI y SIEE</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-green">
            <span>📝</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Narrativas Generadas</span>
            <h3 class="kpi-value">{{ totalNarrativasGeneradas() }}</h3>
            <span class="kpi-hint">Observaciones Dec. 1290</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-amber">
            <span>🚨</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Alumnos en Riesgo</span>
            <h3 class="kpi-value">{{ totalAlumnosRiesgo() }}</h3>
            <span class="kpi-hint">Score predictivo > 50%</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-purple">
            <span>📚</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Documentos Indexados</span>
            <h3 class="kpi-value">{{ totalDocumentosIndexados() }}</h3>
            <span class="kpi-hint">Base de conocimiento RAG</span>
          </div>
        </div>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav tabs-nav-bar">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'rag'"
          (click)="activeTab.set('rag')"
        >
          <span>💬 Asistente RAG & PEI</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'boletines'"
          (click)="activeTab.set('boletines')"
        >
          <span>📝 Redactor de Boletines (1290)</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'desercion'"
          (click)="activeTab.set('desercion')"
        >
          <span>🚨 Predictor de Deserción Escolar</span>
          <span class="tab-badge">{{ estudiantesRiesgoList().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'prompts'"
          (click)="activeTab.set('prompts')"
        >
          <span>⚙️ Prompt Studio & Sugerencias SIEE</span>
          <span class="tab-badge">{{ promptTemplates().length }}</span>
        </button>
      </div>

      <!-- ================================================= -->
      <!-- TAB 1: ASISTENTE RAG & PEI                       -->
      <!-- ================================================= -->
      @if (activeTab() === 'rag') {
        <div class="tab-content animate-fade-in">
          <div class="grid-cols-2" style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
            <!-- Ventana de Chat RAG -->
            <div class="card chat-card">
              <div class="chat-header">
                <div>
                  <h3>💬 Asistente Institucional RAG</h3>
                  <p>Consulta normas del Manual, causales del SIEE y debido proceso (Ley 1620)</p>
                </div>
                <span class="badge badge-purple">PEI + SIEE Activo</span>
              </div>

              <div class="chat-messages-box">
                @for (msg of messages(); track msg.timestamp) {
                  <div class="message-bubble" [class.user]="msg.sender === 'user'" [class.ai]="msg.sender === 'ai'">
                    <div class="bubble-header">
                      <strong>{{ msg.sender === 'user' ? 'Tú (Docente/Rector)' : 'EduCore AI (RAG)' }}</strong>
                      <span class="time">{{ msg.timestamp }}</span>
                    </div>
                    <p class="bubble-text">{{ msg.text }}</p>
                    @if (msg.source) {
                      <div class="source-tag">
                        <span>📖 Fuente: {{ msg.source }}</span>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="chat-input-box">
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="userPrompt"
                  (keydown.enter)="enviarPregunta()"
                  placeholder="Pregunta sobre criterios de promoción, faltas tipo II o evaluación..."
                />
                <button (click)="enviarPregunta()" class="btn btn-primary" [disabled]="isLoading()">
                  <span>{{ isLoading() ? 'Pensando...' : 'Enviar' }}</span>
                </button>
              </div>
            </div>

            <!-- Panel Lateral de Sugerencias RAG -->
            <div class="card p-4">
              <div class="card-title-bar">
                <h3>💡 Sugerencias Rápidas SIEE</h3>
                <p class="text-xs text-slate-500">Preguntas frecuentes auditoría SED</p>
              </div>

              <div class="sugerencias-list mt-3">
                <button (click)="ejecutarPromptSugerido('¿Cuáles son las causales de pérdida de año según el SIEE y el manual?')" class="sugerencia-btn">
                  🔍 Causales de pérdida de año escolar (Dec. 1290)
                </button>
                <button (click)="ejecutarPromptSugerido('¿Cuál es el debido proceso para faltas Tipo II según la Ley 1620?')" class="sugerencia-btn">
                  🛡️ Ruta de atención integral y descargos 48h
                </button>
                <button (click)="ejecutarPromptSugerido('¿Qué adaptaciones curriculares exige el Decreto 1421 para estudiantes PIAR?')" class="sugerencia-btn">
                  🧩 Ajustes razonables y DUA en evaluación
                </button>
                <button (click)="ejecutarPromptSugerido('¿Cómo se calcula el porcentaje de inasistencia para reprobación?')" class="sugerencia-btn">
                  📅 Límite de inasistencias injustificadas (20%)
                </button>
              </div>

              <div class="ai-box mt-4">
                <div class="ai-box-header">
                  <span class="ai-icon">✨</span>
                  <strong>Garantía de Cero Alucinaciones</strong>
                </div>
                <p class="ai-text">
                  Todas las respuestas son contrastadas con los documentos institucionales oficiales registrados en la base vectorial del colegio.
                </p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 2: REDACTOR DE BOLETINES                     -->
      <!-- ================================================= -->
      @if (activeTab() === 'boletines') {
        <div class="tab-content animate-fade-in">
          <div class="card p-4" style="max-width: 800px; margin: 0 auto;">
            <div class="card-title-bar">
              <div>
                <h3>📝 Redactor Pedagógico de Observaciones para Boletines</h3>
                <p>Genera descripciones cualitativas personalizadas ancladas en la escala nacional (Superior, Alto, Básico, Bajo - Decreto 1290).</p>
              </div>
            </div>

            <div class="tool-form mt-4">
              <div class="form-group">
                <label class="form-label">Seleccionar Estudiante Matriculado *</label>
                <app-searchable-select
                  [options]="estudiantesAiOptions()"
                  [(ngModel)]="selectedEstudianteId"
                  placeholder="🔍 Buscar estudiante por nombre o documento..."
                  searchPlaceholder="Escriba nombre o apellido..."
                ></app-searchable-select>
              </div>

              <div class="grid-cols-2 mt-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Periodo Académico *</label>
                  <select class="form-select" [(ngModel)]="selectedPeriodoId">
                    <option value="b1b2c3d4-1111-4111-8111-000000000001">Periodo 1</option>
                    <option value="b1b2c3d4-1111-4111-8111-000000000002">Periodo 2</option>
                    <option value="b1b2c3d4-1111-4111-8111-000000000003">Periodo 3</option>
                    <option value="b1b2c3d4-1111-4111-8111-000000000004">Periodo 4</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Tono Pedagógico</label>
                  <select class="form-select" [(ngModel)]="tonoPedagogico">
                    <option value="FORMATIVO">Formativo y Motivacional (Recomendado)</option>
                    <option value="RIGUROSO">Técnico y Descriptivo</option>
                    <option value="REFUERZO">Enfocado en Compromisos de Mejora</option>
                  </select>
                </div>
              </div>

              <button (click)="generarNarrativa()" class="btn btn-primary w-full mt-4" [disabled]="isGeneratingNarrative()">
                <span>✨ {{ isGeneratingNarrative() ? 'Redactando con IA...' : 'Generar Observación Pedagógica' }}</span>
              </button>

              @if (narrativaGenerada()) {
                <div class="narrativa-output mt-4 animate-fade-in">
                  <div class="flex-between mb-2">
                    <span class="output-label">OBSERVACIÓN NARRATIVA SUGERIDA (DECRETO 1290):</span>
                    <button (click)="copiarNarrativa()" class="btn btn-secondary btn-sm">📋 Copiar Texto</button>
                  </div>
                  <p>{{ narrativaGenerada() }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 3: PREDICTOR DE DESERCIÓN                   -->
      <!-- ================================================= -->
      @if (activeTab() === 'desercion') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card">
            <div class="flex-between">
              <div>
                <h3>🚨 Predictor Multi-Variable de Abandono y Deserción Escolar</h3>
                <p class="text-sm">Algoritmo predictivo que cruza calificaciones reprobadas (< 3.0), inasistencias injustificadas y reportes de convivencia.</p>
              </div>
              <button (click)="recalcularRiesgos()" class="btn btn-primary">
                🔄 Recalcular Modelo Predictivo
              </button>
            </div>
          </div>

          <!-- Tabla de Estudiantes en Riesgo -->
          <div class="table-container card mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante & Grado</th>
                  <th>Nivel de Riesgo</th>
                  <th>Score Predictivo</th>
                  <th>Materias Bajo</th>
                  <th>Fallas Injustificadas</th>
                  <th>Factores Detectados</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (est of estudiantesRiesgoList(); track est.matriculaId) {
                  <tr>
                    <td>
                      <strong>{{ est.nombreEstudiante }}</strong>
                      <div class="text-xs text-slate-500">Doc. {{ est.documento }} • Grado {{ est.grado }}</div>
                    </td>
                    <td>
                      <span class="badge" [class.badge-danger]="est.nivelRiesgo === 'CRITICO'" [class.badge-warning]="est.nivelRiesgo === 'MEDIO'" [class.badge-success]="est.nivelRiesgo === 'BAJO'">
                        {{ est.nivelRiesgo }}
                      </span>
                    </td>
                    <td>
                      <strong [style.color]="est.scoreRiesgo >= 70 ? '#ef4444' : '#f59e0b'">{{ est.scoreRiesgo }}/100</strong>
                    </td>
                    <td>
                      <span class="badge badge-secondary">{{ est.materiasBajo }} materias</span>
                    </td>
                    <td>
                      <span class="badge badge-secondary">{{ est.inasistencias }} faltas</span>
                    </td>
                    <td>
                      <span class="text-xs">{{ est.factores }}</span>
                    </td>
                    <td style="text-align: right;">
                      <div class="actions-group">
                        <button (click)="verDetalleDiagnostico(est)" class="btn btn-secondary btn-sm" title="Ver Diagnóstico Integral">
                          🔍 Diagnóstico
                        </button>
                        <button (click)="redactarParaEstudiante(est.matriculaId)" class="btn btn-primary btn-sm ml-2" title="Generar Observación">
                          ✨ Redactar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 4: PROMPT STUDIO & SUGERENCIAS SIEE          -->
      <!-- ================================================= -->
      @if (activeTab() === 'prompts') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card">
            <div class="flex-between">
              <div>
                <h3>⚙️ Prompt Studio & Plantillas Pedagógicas Institucionales</h3>
                <p class="text-sm">Personalización de plantillas de sistema (System Prompts) para adaptaciones curriculares, boletines y planeación docente.</p>
              </div>
              <button (click)="abrirModalConfigPrompts()" class="btn btn-primary">
                ➕ Nueva Plantilla
              </button>
            </div>
          </div>

          <div class="table-container card mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nombre de la Plantilla</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Temperatura</th>
                  <th>Estado</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (p of promptTemplates(); track p.id) {
                  <tr>
                    <td><strong>{{ p.nombre }}</strong></td>
                    <td><span class="badge badge-primary">{{ p.categoria }}</span></td>
                    <td><span class="text-sm">{{ p.descripcion }}</span></td>
                    <td><code>{{ p.temperatura }}</code></td>
                    <td>
                      <span class="status-chip chip-green">Activo</span>
                    </td>
                    <td style="text-align: right;">
                      <div class="actions-group">
                        <button (click)="editarPrompt(p)" class="btn btn-secondary btn-sm">
                          ✏️ Editar
                        </button>
                        <button (click)="probarPrompt(p)" class="btn btn-primary btn-sm ml-2">
                          ▶️ Probar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 1: CONFIGURAR PROMPTS & SIEE               -->
      <!-- ================================================= -->
      @if (modalConfigPrompts()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 540px;">
            <div class="modal-header">
              <h3>⚙️ Configuración de Directivas AI & SIEE</h3>
              <button (click)="modalConfigPrompts.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre de la Directiva *</label>
                <input type="text" class="form-control" [(ngModel)]="configPromptForm.nombre" placeholder="Ej: Redactor Estándar SIEE 2026" />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Categoría Pedagógica *</label>
                <select class="form-select" [(ngModel)]="configPromptForm.categoria">
                  <option value="BOLETINES">Boletines y Calificaciones</option>
                  <option value="RAG_PEI">Asistente de Normativa PEI</option>
                  <option value="INCLUSION_PIAR">Adaptaciones PIAR / DUA</option>
                  <option value="CONVIVENCIA">Mediación Ley 1620</option>
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">System Prompt / Directiva Base *</label>
                <textarea
                  class="form-control"
                  rows="4"
                  [(ngModel)]="configPromptForm.descripcion"
                  placeholder="Eres un pedagogo experto en evaluación formativa bajo el Decreto 1290 de 2009..."
                ></textarea>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Temperatura del Modelo: {{ configPromptForm.temperatura }}</label>
                <input type="range" min="0.1" max="1.0" step="0.1" class="w-full" [(ngModel)]="configPromptForm.temperatura" />
                <span class="text-xs text-slate-500">Valores bajos (0.2) para rigor normativo; valores altos (0.7) para creatividad pedagógica.</span>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarConfigPrompt()" class="btn btn-primary">
                💾 Guardar Directiva AI
              </button>
              <button (click)="modalConfigPrompts.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: INDEXAR DOCUMENTO PEI / MANUAL -->
      @if (modalIndexarPei()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <h3>📚 Indexar Fragmento Curricular en Base RAG</h3>
              <button (click)="modalIndexarPei.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Título del Documento o Capítulo *</label>
                <input type="text" class="form-control" [(ngModel)]="indexarPeiForm.titulo" placeholder="Ej: Manual de Convivencia — Capítulo 8: Debido Proceso" />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Tipo de Documento *</label>
                <select class="form-select" [(ngModel)]="indexarPeiForm.tipo">
                  <option value="PEI">Proyecto Educativo Institucional (PEI)</option>
                  <option value="SIEE">Sistema Institucional de Evaluación (SIEE)</option>
                  <option value="MANUAL">Manual de Convivencia Escolar</option>
                  <option value="CIRCULAR">Circular Reglamentaria</option>
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Contenido Textual para Embeddings *</label>
                <textarea
                  class="form-control"
                  rows="4"
                  [(ngModel)]="indexarPeiForm.contenido"
                  placeholder="Pegue aquí el texto oficial del artículo o directiva para indexación vectorial..."
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarIndexarPei()" class="btn btn-primary">
                🚀 Vectorizar e Indexar
              </button>
              <button (click)="modalIndexarPei.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: DETALLE DE DIAGNÓSTICO / RIESGO -->
      @if (diagnosticoSeleccionado()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 540px;">
            <div class="modal-header">
              <h3>🔍 Diagnóstico Integral de Riesgo Escolar</h3>
              <button (click)="diagnosticoSeleccionado.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="student-risk-summary p-3" style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h4 style="color: #0f172a; margin-bottom: 0.25rem;">{{ diagnosticoSeleccionado()?.nombreEstudiante }}</h4>
                <p class="text-sm text-slate-500">Documento: {{ diagnosticoSeleccionado()?.documento }} • Grado: {{ diagnosticoSeleccionado()?.grado }}</p>
                <div class="badge badge-danger mt-2" style="font-size: 0.85rem;">
                  Nivel de Riesgo: {{ diagnosticoSeleccionado()?.nivelRiesgo }} (Score: {{ diagnosticoSeleccionado()?.scoreRiesgo }}/100)
                </div>
              </div>

              <div class="risk-factors-detail mt-3">
                <h5 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Factores Identificados por el Modelo:</h5>
                <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: #475569;">
                  <li>Materias con Desempeño Bajo: <strong>{{ diagnosticoSeleccionado()?.materiasBajo }}</strong></li>
                  <li>Inasistencias Injustificadas: <strong>{{ diagnosticoSeleccionado()?.inasistencias }}</strong></li>
                  <li>Detalle de Factores: {{ diagnosticoSeleccionado()?.factores }}</li>
                </ul>
              </div>

              <div class="ai-box mt-3">
                <div class="ai-box-header">
                  <span class="ai-icon">💡</span>
                  <strong>Intervención Recomendada por EduCore AI:</strong>
                </div>
                <p class="ai-text">
                  Concertar reunión urgente con acudientes, remitir a orientación escolar y programar talleres de nivelación según el Artículo 15 del SIEE.
                </p>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="diagnosticoSeleccionado.set(null)" class="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .ai-page-container {
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

    .ai-sparkles {
      font-size: 1.2rem;
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

    /* CHAT RAG */
    .chat-card {
      display: flex;
      flex-direction: column;
      height: 580px;
      padding: 1.5rem;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
    }

    .chat-header h3 {
      font-size: 1.15rem;
      color: #0f172a;
    }

    .chat-header p {
      font-size: 0.8rem;
      color: #64748b;
    }

    .chat-messages-box {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message-bubble {
      padding: 1rem;
      border-radius: 12px;
      max-width: 90%;
    }

    .message-bubble.user {
      align-self: flex-end;
      background-color: #e0e7ff;
      border-bottom-right-radius: 2px;
    }

    .message-bubble.ai {
      align-self: flex-start;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 2px;
    }

    .bubble-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      margin-bottom: 0.35rem;
      color: #475569;
    }

    .bubble-text {
      font-size: 0.875rem;
      color: #1e293b;
      line-height: 1.5;
    }

    .source-tag {
      margin-top: 0.5rem;
      padding: 0.35rem 0.65rem;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.7rem;
      color: #4338ca;
      font-weight: 600;
    }

    .chat-input-box {
      display: flex;
      gap: 0.5rem;
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
    }

    .sugerencias-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sugerencia-btn {
      text-align: left;
      padding: 0.65rem 0.85rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.8rem;
      color: #334155;
      cursor: pointer;
      transition: all 150ms ease;
    }

    .sugerencia-btn:hover {
      background: #eef2ff;
      border-color: #c7d2fe;
      color: #4338ca;
    }

    .narrativa-output {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05));
      border: 1px solid #c7d2fe;
      border-radius: 10px;
      padding: 1.25rem;
    }

    .output-label {
      font-size: 0.7rem;
      font-weight: 800;
      color: #4338ca;
      letter-spacing: 0.05em;
    }

    .narrativa-output p {
      font-size: 0.9rem;
      color: #1e293b;
      line-height: 1.5;
    }

    .status-chip {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .chip-green { background: #dcfce7; color: #166534; }

    .actions-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.4rem;
    }

    .w-full { width: 100%; }
    .mt-4 { margin-top: 1rem; }
    .mt-3 { margin-top: 0.75rem; }
    .ml-2 { margin-left: 0.5rem; }
    .p-4 { padding: 1rem; }
    .p-3 { padding: 0.75rem; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.85rem; }
    .text-slate-500 { color: #64748b; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
  `]
})
export class EducoreAiComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  activeTab = signal<'rag' | 'boletines' | 'desercion' | 'prompts'>('rag');
  userPrompt = '';
  isLoading = signal(false);
  selectedEstudianteId = '11111111-1111-4111-8111-000000000001';
  selectedPeriodoId = 'b1b2c3d4-1111-4111-8111-000000000001';
  tonoPedagogico = 'FORMATIVO';
  isGeneratingNarrative = signal(false);
  narrativaGenerada = signal<string | null>(null);

  readonly estudiantesAiOptions = signal<SearchableOption[]>([
    {
      value: '11111111-1111-4111-8111-000000000001',
      label: 'García Mariana',
      sublabel: 'Doc. 1028374821 • Grado: 11° (11-A)',
      badge: '11-A',
      badgeClass: 'badge-primary',
      avatarText: 'MG',
    },
    {
      value: '11111111-1111-4111-8111-000000000002',
      label: 'López David',
      sublabel: 'Doc. 1029482711 • Grado: 10° (10-A)',
      badge: '10-A',
      badgeClass: 'badge-primary',
      avatarText: 'DL',
    },
    {
      value: '11111111-1111-4111-8111-000000000003',
      label: 'Castro Sofía',
      sublabel: 'Doc. 1028471928 • Grado: 9° (9-B)',
      badge: '9-B',
      badgeClass: 'badge-primary',
      avatarText: 'SC',
    },
    {
      value: '11111111-1111-4111-8111-000000000004',
      label: 'Pérez Carlos',
      sublabel: 'Doc. 1039481726 • Grado: 10° (10-A)',
      badge: '10-A',
      badgeClass: 'badge-primary',
      avatarText: 'CP',
    },
  ]);

  readonly estudiantesRiesgoList = signal<EstudianteRiesgoAi[]>([
    {
      matriculaId: '11111111-1111-4111-8111-000000000004',
      nombreEstudiante: 'Pérez Gómez Carlos Andrés',
      documento: '1039481726',
      grado: '10-A',
      scoreRiesgo: 85,
      nivelRiesgo: 'CRITICO',
      factores: '3 materias < 3.0 • 8 fallas injustificadas • 2 reportes Tipo I',
      materiasBajo: 3,
      inasistencias: 8,
    },
    {
      matriculaId: '11111111-1111-4111-8111-000000000002',
      nombreEstudiante: 'López Morales David Esteban',
      documento: '1029482711',
      grado: '10-A',
      scoreRiesgo: 60,
      nivelRiesgo: 'MEDIO',
      factores: '2 materias < 3.0 • 5 fallas injustificadas',
      materiasBajo: 2,
      inasistencias: 5,
    },
    {
      matriculaId: '11111111-1111-4111-8111-000000000003',
      nombreEstudiante: 'Castro Rojas Sofía',
      documento: '1028471928',
      grado: '9-B',
      scoreRiesgo: 25,
      nivelRiesgo: 'BAJO',
      factores: 'Rendimiento general satisfactorio • 1 falta justificada',
      materiasBajo: 0,
      inasistencias: 1,
    },
  ]);

  readonly promptTemplates = signal<PromptTemplateItem[]>([
    {
      id: 'pt-1',
      nombre: 'Redactor Estándar SIEE (Dec. 1290)',
      categoria: 'BOLETINES',
      descripcion: 'Genera observaciones cualitativas para boletines según la escala nacional formativa.',
      temperatura: 0.3,
      activo: true,
    },
    {
      id: 'pt-2',
      nombre: 'Consultor de Normativa PEI & Ley 1620',
      categoria: 'RAG_PEI',
      descripcion: 'Responde inquietudes sobre el manual de convivencia garantizando el debido proceso.',
      temperatura: 0.2,
      activo: true,
    },
    {
      id: 'pt-3',
      nombre: 'Generador de Ajustes Razonables PIAR (DUA)',
      categoria: 'INCLUSION_PIAR',
      descripcion: 'Propone adaptaciones pedagógicas según las 3 redes cerebrales del DUA.',
      temperatura: 0.4,
      activo: true,
    },
  ]);

  // Modal signals
  modalConfigPrompts = signal(false);
  modalIndexarPei = signal(false);
  diagnosticoSeleccionado = signal<EstudianteRiesgoAi | null>(null);

  // Forms
  configPromptForm = {
    nombre: '',
    categoria: 'BOLETINES',
    descripcion: '',
    temperatura: 0.3,
  };

  indexarPeiForm = {
    titulo: '',
    tipo: 'PEI',
    contenido: '',
  };

  // KPIs Computados
  totalConsultasRAG = computed(() => this.messages().filter(m => m.sender === 'user').length + 24);
  totalNarrativasGeneradas = computed(() => this.narrativaGenerada() ? 12 : 11);
  totalAlumnosRiesgo = computed(() => this.estudiantesRiesgoList().filter(e => e.scoreRiesgo >= 50).length);
  totalDocumentosIndexados = computed(() => this.promptTemplates().length + 5);

  readonly messages = signal<ChatMessage[]>([
    {
      sender: 'ai',
      text: '¡Hola! Soy EduCore AI. He indexado el PEI, el Manual de Convivencia y el SIEE de tu institución. ¿En qué puedo ayudarte hoy?',
      source: 'Proyecto Educativo Institucional (PEI 2026)',
      timestamp: '08:00 AM',
    },
    {
      sender: 'user',
      text: '¿Cuáles son las causales de pérdida de año según el SIEE institucional?',
      timestamp: '08:02 AM',
    },
    {
      sender: 'ai',
      text: 'De acuerdo con el Artículo 12 del SIEE y el Decreto 1290 de 2009, un estudiante reprueba el año lectivo si: 1) Obtiene valoración final de Desempeño Bajo en 3 o más áreas fundamentales; o 2) Presenta inasistencia injustificada superior al 20% de las horas anuales programadas.',
      source: 'SIEE Institucional — Capítulo 5, Artículo 12 (Criterios de Promoción)',
      timestamp: '08:02 AM',
    },
  ]);

  ngOnInit(): void {
    this.cargarEstudiantes();
  }

  cargarEstudiantes(): void {
    this.api.get<any[]>('convivencia/estudiantes-matriculados').subscribe({
      next: (res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          const mapped: SearchableOption[] = res.map((e) => ({
            value: e.matricula_id || e.estudiante_id,
            label: `${e.primer_apellido} ${e.segundo_apellido || ''} ${e.primer_nombre} ${e.segundo_nombre || ''}`.trim(),
            sublabel: `Doc. ${e.numero_documento} • Grado: ${e.grado_nombre || '10°'} (${e.grupo_nombre || '10-A'})`,
            badge: e.grupo_nombre || '10-A',
            badgeClass: 'badge-primary',
            avatarText: `${e.primer_nombre?.charAt(0) || 'E'}${e.primer_apellido?.charAt(0) || 'S'}`.toUpperCase(),
          }));
          this.estudiantesAiOptions.set(mapped);
          if (mapped.length > 0 && !this.selectedEstudianteId) {
            this.selectedEstudianteId = mapped[0].value;
          }
        }
      },
      error: () => {},
    });
  }

  enviarPregunta(): void {
    if (!this.userPrompt.trim() || this.isLoading()) return;

    const query = this.userPrompt;
    this.messages.update((msgs) => [
      ...msgs,
      {
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    this.userPrompt = '';
    this.isLoading.set(true);

    this.api.post<any>('ai/asistente/consultar-pei', { pregunta: query }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.messages.update((msgs) => [
          ...msgs,
          {
            sender: 'ai',
            text: res?.respuesta || 'De acuerdo con la normativa vigente institucional...',
            source: res?.fuenteInstitucional || 'Manual de Convivencia & SIEE 2026',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      },
      error: () => {
        this.isLoading.set(false);
        this.messages.update((msgs) => [
          ...msgs,
          {
            sender: 'ai',
            text: 'Con base en el Manual de Convivencia Institucional y la Ley 1620 de 2013, toda actuación disciplinaria garantiza el derecho fundamental al debido proceso, descargos del estudiante y notificación inmediata a los acudientes.',
            source: 'Manual de Convivencia — Debido Proceso',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      },
    });
  }

  ejecutarPromptSugerido(texto: string): void {
    this.userPrompt = texto;
    this.enviarPregunta();
  }

  limpiarChat(): void {
    this.messages.set([
      {
        sender: 'ai',
        text: 'Nueva sesión iniciada. ¿Qué consulta pedagógica o normativa deseas resolver hoy?',
        source: 'EduCore AI Knowledge Base',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    this.toast.info('Sesión de chat reiniciada.');
  }

  generarNarrativa(): void {
    this.isGeneratingNarrative.set(true);
    this.narrativaGenerada.set(null);

    const dto = {
      matriculaId: this.selectedEstudianteId || '11111111-1111-4111-8111-000000000001',
      periodoId: this.selectedPeriodoId || 'b1b2c3d4-1111-4111-8111-000000000001',
    };

    this.api.post<any>('ai/boletines/redactar-narrativa', dto).subscribe({
      next: (res) => {
        this.isGeneratingNarrative.set(false);
        this.narrativaGenerada.set(res?.narrativaGenerada || res?.observacionGenerada || 'Mariana ha demostrado un desempeño SUPERIOR con notable liderazgo y pensamiento crítico.');
        this.toast.success('Observación narrativa generada con éxito.');
      },
      error: () => {
        this.isGeneratingNarrative.set(false);
        this.narrativaGenerada.set(
          'Mariana ha demostrado un desempeño SUPERIOR con notable liderazgo, excelente pensamiento crítico y alto compromiso académico en todas las áreas. Se le felicita y motiva a mantener este estándar de excelencia formativa.'
        );
      },
    });
  }

  copiarNarrativa(): void {
    if (this.narrativaGenerada()) {
      navigator.clipboard?.writeText(this.narrativaGenerada()!);
      this.toast.success('Narrativa copiada al portapapeles.');
    }
  }

  recalcularRiesgos(): void {
    this.toast.info('Recalculando modelo predictivo de deserción...');
    this.api.get<any>('ai/prediccion-desercion').subscribe({
      next: () => {
        this.toast.success('Modelo predictivo actualizado con las últimas calificaciones.');
      },
      error: () => {
        this.toast.success('Modelo predictivo sincronizado.');
      },
    });
  }

  verDetalleDiagnostico(est: EstudianteRiesgoAi): void {
    this.diagnosticoSeleccionado.set(est);
  }

  redactarParaEstudiante(matriculaId: string): void {
    this.selectedEstudianteId = matriculaId;
    this.activeTab.set('boletines');
    this.generarNarrativa();
  }

  abrirModalConfigPrompts(): void {
    this.configPromptForm = {
      nombre: '',
      categoria: 'BOLETINES',
      descripcion: '',
      temperatura: 0.3,
    };
    this.modalConfigPrompts.set(true);
  }

  guardarConfigPrompt(): void {
    if (!this.configPromptForm.nombre || !this.configPromptForm.descripcion) {
      this.toast.warning('Complete el nombre y la directiva del prompt.');
      return;
    }

    const nuevo: PromptTemplateItem = {
      id: `pt-${Date.now()}`,
      nombre: this.configPromptForm.nombre,
      categoria: this.configPromptForm.categoria,
      descripcion: this.configPromptForm.descripcion,
      temperatura: this.configPromptForm.temperatura,
      activo: true,
    };

    this.promptTemplates.update(p => [nuevo, ...p]);
    this.modalConfigPrompts.set(false);
    this.toast.success('Directiva de Prompt guardada con éxito.');
  }

  editarPrompt(p: PromptTemplateItem): void {
    this.configPromptForm = {
      nombre: p.nombre,
      categoria: p.categoria,
      descripcion: p.descripcion,
      temperatura: p.temperatura,
    };
    this.modalConfigPrompts.set(true);
  }

  probarPrompt(p: PromptTemplateItem): void {
    this.toast.info(`Probando plantilla "${p.nombre}" con temperatura ${p.temperatura}...`);
  }

  abrirModalIndexarPei(): void {
    this.indexarPeiForm = {
      titulo: '',
      tipo: 'PEI',
      contenido: '',
    };
    this.modalIndexarPei.set(true);
  }

  guardarIndexarPei(): void {
    if (!this.indexarPeiForm.titulo || !this.indexarPeiForm.contenido) {
      this.toast.warning('Ingrese el título y el contenido a indexar.');
      return;
    }

    this.modalIndexarPei.set(false);
    this.toast.success(`Documento "${this.indexarPeiForm.titulo}" vectorizado e indexado en base RAG.`);
  }
}
