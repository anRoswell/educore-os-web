import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

tabs_html = """
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
              <!-- Sidebar -->
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

        <!-- Modales Aulas -->
        @if(modalCrearAula()) {
          <div class="modal-backdrop">
            <div class="modal-content animate-slide-up">
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
        }
        @if(modalPublicacion()) {
          <div class="modal-backdrop">
            <div class="modal-content animate-slide-up">
              <div class="modal-header">
                <h2>Publicar en Muro</h2>
                <button class="close-btn" (click)="modalPublicacion.set(false)">X</button>
              </div>
              <div class="modal-body">
                <div class="form-group mb-3"><label>Título</label><input type="text" class="form-control" [(ngModel)]="nuevaPublicacion.titulo"></div>
                <div class="form-group mb-3"><label>Contenido</label><textarea class="form-control" rows="4" [(ngModel)]="nuevaPublicacion.contenido"></textarea></div>
                <div class="form-group mb-3"><label>Enlace Video</label><input type="text" class="form-control" [(ngModel)]="nuevaPublicacion.url_adjunta" placeholder="https://youtube.com..."></div>
                <div class="form-group mb-3">
                  <label>Tipo</label>
                  <select class="form-control" [(ngModel)]="nuevaPublicacion.tipo">
                    <option value="MATERIAL">Material</option><option value="ANUNCIO">Anuncio</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer"><button class="btn btn-primary w-100" (click)="guardarPublicacion()">Publicar</button></div>
            </div>
          </div>
        }

      } @else {
"""

content = content.replace("      <!-- HEADER -->\n      <div class=\"page-header\">\n        <div>\n          <div class=\"badge-header\">\n            <span>📚 AULA VIRTUAL & LMS</span>\n            <span class=\"badge-pill\">Decreto 1290 / MEN</span>\n          </div>\n          <h1>Gestión de Tareas & Evidencias Digitales</h1>\n          <p>Publicación de guías de trabajo, recepción de tareas y evaluación formativa por competencias</p>\n        </div>\n        <div class=\"header-actions\">\n          <button (click)=\"abrirModalCrearTarea()\" class=\"btn btn-primary\">\n            <span>➕ Crear Nueva Tarea</span>\n          </button>\n        </div>\n      </div>", tabs_html + "      <!-- Header Original Oculto -->\n      <div style=\"display:none;\">")
content = content.replace("  `,\n  styles:", "      }\n  `,\n  styles:")


signals_and_methods = """  // --- TABS ---
  currentTab: 'AULAS' | 'TAREAS' = 'AULAS';

  // --- AULAS y MURO ---
  readonly aulas = signal<any[]>([]);
  readonly publicaciones = signal<any[]>([]);
  readonly aulaSeleccionada = signal<any | null>(null);
  readonly modalCrearAula = signal(false);
  readonly modalPublicacion = signal(false);

  nuevaAula = { nombre: '', descripcion: '', cargaDocenteId: 'ca-001' };
  nuevaPublicacion = { titulo: '', contenido: '', url_adjunta: '', tipo: 'MATERIAL' };

  private sanitizer = inject(import('@angular/platform-browser').DomSanitizer);

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

  abrirModalCrearAula() {
    this.nuevaAula = { nombre: '', descripcion: '', cargaDocenteId: 'ca-001' };
    this.modalCrearAula.set(true);
  }

  guardarAula() {
    this.api.post<any>('lms/aulas', this.nuevaAula).subscribe({
      next: (res) => {
        this.aulas.update(list => [...list, res]);
        this.modalCrearAula.set(false);
        this.toast.success('Aula Creada', 'El aula virtual ha sido creada exitosamente.');
      }
    });
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
    this.nuevaPublicacion = { titulo: '', contenido: '', url_adjunta: '', tipo: 'MATERIAL' };
    this.modalPublicacion.set(true);
  }

  guardarPublicacion() {
    const aulaId = this.aulaSeleccionada()?.id;
    if (!aulaId) return;

    this.api.post<any>(`lms/aulas/${aulaId}/publicaciones`, this.nuevaPublicacion).subscribe({
      next: (res) => {
        this.publicaciones.update(list => [res, ...list]);
        this.modalPublicacion.set(false);
        this.toast.success('Publicado', 'Post publicado en el muro del aula.');
      }
    });
  }

  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
"""

content = content.replace("export class LmsComponent implements OnInit {\n", "export class LmsComponent implements OnInit {\n" + signals_and_methods)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
