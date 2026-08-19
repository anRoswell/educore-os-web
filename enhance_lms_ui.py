import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# Enhance HTML
html_old_sidebar = """              <!-- Sidebar -->
              <div class="aulas-sidebar">
                <div class="flex-between mb-3">
                  <h3>Mis Aulas</h3>
                  <button class="btn-icon" (click)="abrirModalCrearAula()">➕</button>
                </div>
                <div class="list-group">
                  @for (aula of aulas(); track aula.id) {
                    <div class="list-group-item" [ngClass]="{'active': aulaSeleccionada()?.id === aula.id}" (click)="seleccionarAula(aula)" style="cursor:pointer; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0.5rem;">
                      <strong>{{ aula.nombre }}</strong>
                      <div class="text-muted text-sm">{{ aula.descripcion }}</div>
                    </div>
                  }
                </div>
              </div>"""

html_new_sidebar = """              <!-- Sidebar Aulas -->
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
                    </div>
                  }
                </div>
              </div>"""
content = content.replace(html_old_sidebar, html_new_sidebar)

html_old_feed = """              <!-- Feed -->
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
              </div>"""

html_new_feed = """              <!-- Main Feed -->
              <div class="muro-feed">
                @if (aulaSeleccionada()) {
                  <div class="muro-header mb-4 shadow-sm">
                    <div class="muro-header-content">
                      <div class="muro-title-box">
                        <div class="muro-avatar">🏫</div>
                        <div>
                          <h2 class="muro-title">{{ aulaSeleccionada()?.nombre }}</h2>
                          <p class="muro-subtitle">{{ aulaSeleccionada()?.descripcion || 'Espacio interactivo de aprendizaje' }}</p>
                        </div>
                      </div>
                      <div class="muro-actions">
                        <button class="btn btn-primary btn-icon-text" (click)="abrirModalPublicacion()">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                          <span>Crear Publicación</span>
                        </button>
                        <button class="btn btn-outline btn-icon-text" (click)="abrirModalCuestionario()">
                          <span>📝 Examen / Quiz</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  @if (publicaciones().length === 0) {
                    <div class="empty-state shadow-sm">
                      <div class="empty-icon">📭</div>
                      <h3>No hay publicaciones aún</h3>
                      <p>Comparte material de estudio, videos o anuncios con tus estudiantes.</p>
                      <button class="btn btn-primary mt-3" (click)="abrirModalPublicacion()">Escribir primer post</button>
                    </div>
                  }

                  <div class="posts-timeline">
                    @for (post of publicaciones(); track post.id) {
                      <div class="post-card shadow-sm animate-fade-in">
                        <div class="post-header">
                          <div class="post-author">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Profesor">
                            <div class="author-info">
                              <strong>{{ post.creadoPor?.nombres || 'Carlos' }} {{ post.creadoPor?.apellidos || 'Mendoza' }}</strong>
                              <span class="post-date">{{ post.createdAt | date:'medium' }}</span>
                            </div>
                          </div>
                          <span class="post-badge" [ngClass]="'badge-' + post.tipo.toLowerCase()">{{ post.tipo === 'MATERIAL' ? '📚 Material' : (post.tipo === 'ANUNCIO' ? '📢 Anuncio' : '📝 Cuestionario') }}</span>
                        </div>
                        
                        <h3 class="post-title">{{ post.titulo }}</h3>
                        <p class="post-content">{{ post.contenido }}</p>

                        @if (post.videoEmbedUrl) {
                          <div class="video-wrapper mt-3">
                            <iframe [src]="getSafeUrl(post.videoEmbedUrl)" frameborder="0" allowfullscreen></iframe>
                          </div>
                        }

                        @if (post.tipo === 'EXAMEN' || post.titulo.includes('Examen') || post.titulo.includes('Cuestionario')) {
                          <div class="exam-integration-box mt-4">
                            <div class="exam-info">
                              <span class="exam-icon">📊</span>
                              <div>
                                <strong>Centro de Calificaciones Activo</strong>
                                <p>Este post contiene una evaluación enlazada a la planilla oficial.</p>
                              </div>
                            </div>
                            <div class="exam-actions">
                              <button class="btn btn-sm btn-outline" (click)="abrirExamenEstudiante({ titulo: post.titulo })">Vista Previa Estudiante</button>
                              <button class="btn btn-sm btn-success" (click)="sincronizarNotas('cuest-123')">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                <span>Sincronizar a Planilla Académica</span>
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state shadow-sm">
                    <div class="empty-icon">👈</div>
                    <h3>Bienvenido al Muro Interactivo</h3>
                    <p>Selecciona un aula en el menú lateral para ver su actividad.</p>
                  </div>
                }
              </div>"""
content = content.replace(html_old_feed, html_new_feed)

html_modal_aula_old = """        <!-- Modales Aulas -->
        @if(modalCrearAula()) {
          <div class="modal-backdrop">
            <div class="modal-card">
              <div class="modal-header">
                <h2>Crear Nueva Aula Virtual</h2>
                <button class="close-btn" (click)="modalCrearAula.set(false)">X</button>
              </div>
              <div class="modal-body">
                <div class="form-group mb-3"><label>Nombre</label><input type="text" class="form-control" [(ngModel)]="nuevaAula.nombre"></div>
                <div class="form-group mb-3"><label>Descripción</label><textarea class="form-control" [(ngModel)]="nuevaAula.descripcion"></textarea></div>
              </div>
              <div class="modal-footer"><button class="btn btn-primary w-100" (click)="guardarAula()">Guardar Aula</button></div>
            </div>
          </div>
        }"""
html_modal_aula_new = """        <!-- Modales Aulas -->
        @if(modalCrearAula()) {
          <div class="modal-backdrop">
            <div class="modal-card form-modal animate-slide-up">
              <div class="modal-header-modern bg-gradient-indigo">
                <div class="header-icon">🏫</div>
                <div>
                  <h3>Crear Nueva Aula Virtual</h3>
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
        }"""
content = content.replace(html_modal_aula_old, html_modal_aula_new)

# Insert new CSS rules at the end of styles array
new_css = """
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
  `]"""
content = content.replace("  `]\n})", new_css + "\n})")

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
