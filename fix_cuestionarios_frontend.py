import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

signals_str = """  readonly modalPublicacion = signal(false);

  // --- CUESTIONARIOS ---
  readonly modalCuestionario = signal(false);
  readonly modalTomarExamen = signal(false);
  nuevoCuestionario = { titulo: '', descripcion: '', preguntas: [] as any[] };
  examenActivo: any = null;
  respuestasEstudiante: any = {};
"""
content = content.replace("  readonly modalPublicacion = signal(false);", signals_str)

methods_str = """
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
"""
idx = content.rfind('}')
content = content[:idx] + methods_str + '}'


html_str = """
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
"""
content = content.replace("        <!-- Modales Aulas -->", html_str + "\n        <!-- Modales Aulas -->")


with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)

