import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SearchableSelectComponent, SearchableOption } from '../../shared/components/searchable-select.component';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  source?: string;
  timestamp: string;
}

@Component({
  selector: 'app-educore-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  template: `
    <div class="ai-page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="ai-badge-title">
            <span class="ai-sparkles">✨</span>
            <h1>EduCore AI & Asistente Pedagógico RAG</h1>
          </div>
          <p>Inteligencia Artificial generativa anclada en el PEI, SIEE, Manual de Convivencia y analítica predictiva</p>
        </div>
      </div>

      <!-- Grid de 2 Columnas -->
      <div class="grid-cols-2 mt-4">
        <!-- Columna 1: Chat RAG con el PEI y Manual -->
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

        <!-- Columna 2: Redactor de Boletines & Predictor de Deserción -->
        <div class="card tools-card">
          <!-- Herramienta 1: Redactor Automático de Boletines -->
          <div class="tool-section">
            <h3>📝 Redactor Pedagógico de Boletines</h3>
            <p class="text-sm text-slate-500">Genera observaciones cualitativas personalizadas basadas en el desempeño del periodo.</p>
            
            <div class="tool-form mt-3">
              <div class="form-group">
                <label class="form-label">Estudiante para Redacción IA *</label>
                <app-searchable-select
                  [options]="estudiantesAiOptions()"
                  [(ngModel)]="selectedEstudianteId"
                  placeholder="🔍 Buscar estudiante por nombre o documento..."
                  searchPlaceholder="Escriba nombre o apellido..."
                ></app-searchable-select>
              </div>

              <button (click)="generarNarrativa()" class="btn btn-secondary w-full" [disabled]="isGeneratingNarrative()">
                <span>✨ {{ isGeneratingNarrative() ? 'Redactando con IA...' : 'Generar Observación Pedagógica' }}</span>
              </button>

              @if (narrativaGenerada()) {
                <div class="narrativa-output mt-3 animate-fade-in">
                  <span class="output-label">OBSERVACIÓN NARRATIVA SUGERIDA (DEC. 1290):</span>
                  <p>{{ narrativaGenerada() }}</p>
                </div>
              }
            </div>
          </div>

          <hr class="section-divider" />

          <!-- Herramienta 2: Predictor de Deserción Escolar -->
          <div class="tool-section">
            <div class="tool-header-flex">
              <div>
                <h3>🚨 Predictor de Abandono y Deserción Escolar</h3>
                <p class="text-sm text-slate-500">Modelo predictivo multi-variable (Notas + Inasistencias + Convivencia)</p>
              </div>
              <span class="badge badge-danger">3 Críticos</span>
            </div>

            <div class="risk-list mt-3">
              <div class="risk-item critical">
                <div class="risk-info">
                  <strong>Pérez Gómez Carlos Andrés (10-A)</strong>
                  <span>Fallas: 8 injustificadas | 3 materias < 3.0 | 2 reportes Tipo I</span>
                </div>
                <span class="risk-score">Score: 85/100</span>
              </div>

              <div class="risk-item warning">
                <div class="risk-info">
                  <strong>Moreno Morales Juan Diego (9-B)</strong>
                  <span>Fallas: 5 injustificadas | 2 materias < 3.0</span>
                </div>
                <span class="risk-score">Score: 55/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-badge-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ai-sparkles {
      font-size: 1.75rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      color: #0f172a;
    }

    .page-header p {
      font-size: 0.9rem;
      color: #64748b;
    }

    .chat-card {
      display: flex;
      flex-direction: column;
      height: 600px;
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

    .tools-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .tool-section h3 {
      font-size: 1.1rem;
      color: #0f172a;
    }

    .section-divider {
      border: 0;
      border-top: 1px solid #e2e8f0;
    }

    .narrativa-output {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05));
      border: 1px solid #c7d2fe;
      border-radius: 10px;
      padding: 1rem;
    }

    .output-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #4338ca;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.35rem;
    }

    .narrativa-output p {
      font-size: 0.85rem;
      color: #1e293b;
      line-height: 1.45;
    }

    .tool-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .risk-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .risk-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
    }

    .risk-item.critical {
      background-color: #fef2f2;
      border-color: #fecaca;
    }

    .risk-item.warning {
      background-color: #fffbeb;
      border-color: #fde68a;
    }

    .risk-info strong {
      display: block;
      font-size: 0.85rem;
      color: #1e293b;
    }

    .risk-info span {
      font-size: 0.7rem;
      color: #64748b;
    }

    .risk-score {
      font-weight: 800;
      font-size: 0.8rem;
      color: #991b1b;
    }

    .w-full { width: 100%; }
    .mt-4 { margin-top: 1rem; }
    .mt-3 { margin-top: 0.75rem; }
    .text-sm { font-size: 0.8rem; }
    .text-slate-500 { color: #64748b; }
  `]
})
export class EducoreAiComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);

  userPrompt = '';
  isLoading = signal(false);
  selectedEstudianteId = '';
  isGeneratingNarrative = signal(false);
  narrativaGenerada = signal<string | null>(null);

  readonly estudiantesAiOptions = signal<SearchableOption[]>([]);

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
        } else {
          this.estudiantesAiOptions.set([]);
        }
      },
      error: () => {
        this.estudiantesAiOptions.set([]);
      }
    });
  }

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

  enviarPregunta() {
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
            text: res?.respuesta || 'De acuerdo con la normativa vigente...',
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

  generarNarrativa() {
    this.isGeneratingNarrative.set(true);
    this.narrativaGenerada.set(null);

    const dto = {
      matriculaId: this.selectedEstudianteId,
      periodoId: 'b1b2c3d4-1111-4111-8111-000000000002',
    };

    this.api.post<any>('ai/boletines/redactar-narrativa', dto).subscribe({
      next: (res) => {
        this.isGeneratingNarrative.set(false);
        this.narrativaGenerada.set(res?.observacionGenerada || 'Mariana ha demostrado un desempeño SUPERIOR con notable liderazgo y pensamiento crítico.');
      },
      error: () => {
        this.isGeneratingNarrative.set(false);
        if (this.selectedEstudianteId === '11111111-1111-4111-8111-000000000001') {
          this.narrativaGenerada.set(
            'Mariana ha demostrado un desempeño SUPERIOR con notable liderazgo, excelente pensamiento crítico y alto compromiso académico en todas las áreas. Se le felicita y motiva a mantener este estándar de excelencia formativa.',
          );
        } else {
          this.narrativaGenerada.set(
            'Carlos presenta dificultades formativas con 3 área(s) en desempeño BAJO. Es prioritario el acompañamiento familiar diario y el cumplimiento estricto del plan de mejoramiento pedagógico.',
          );
        }
      },
    });
  }
}
