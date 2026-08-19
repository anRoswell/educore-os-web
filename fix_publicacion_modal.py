import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# Update the state to hold the file
content = content.replace("nuevaPublicacion = { tipo: 'MATERIAL', titulo: '', contenido: '', url_adjunta: '' };", "nuevaPublicacion = { tipo: 'MATERIAL', titulo: '', contenido: '', url_adjunta: '', archivoAdjuntoUrl: '', archivoAdjuntoNombre: '' };")
content = content.replace("this.nuevaPublicacion = { tipo: 'MATERIAL', titulo: '', contenido: '', url_adjunta: '' };", "this.nuevaPublicacion = { tipo: 'MATERIAL', titulo: '', contenido: '', url_adjunta: '', archivoAdjuntoUrl: '', archivoAdjuntoNombre: '' };\n    this.archivoSeleccionado.set(null);")
content = content.replace("modalPublicacion = signal(false);", "modalPublicacion = signal(false);\n  archivoSeleccionado = signal<File | null>(null);\n  isUploading = signal(false);")

# Add file handler methods
methods = """  // Archivos Adjuntos
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
"""

# Replace the old guardarPublicacion
content = content.replace("""  guardarPublicacion() {
    const aulaId = this.aulaSeleccionada()?.id;
    if (!aulaId) return;
    this.api.post<any>(`lms/aulas/${aulaId}/publicaciones`, this.nuevaPublicacion).subscribe({
      next: (res) => {
        this.publicaciones.update(list => [res, ...list]);
        this.modalPublicacion.set(false);
        this.toast.success('Publicado', 'Tu post ha sido publicado en el muro.');
      }
    });
  }""", methods)


# Update Modal HTML
html_modal_old = """        @if(modalPublicacion()) {
          <div class="modal-backdrop">
            <div class="modal-card">
              <div class="modal-header">
                <h2>Publicar en Muro</h2>
                <button class="close-btn" (click)="modalPublicacion.set(false)">X</button>
              </div>
              <div class="modal-body">
                <div class="form-group mb-3"><label>Título</label><input type="text" class="form-control" [(ngModel)]="nuevaPublicacion.titulo"></div>
                <div class="form-group mb-3"><label>Contenido</label><textarea class="form-control" [(ngModel)]="nuevaPublicacion.contenido"></textarea></div>
                <div class="form-group mb-3"><label>Enlace Video</label><input type="text" class="form-control" placeholder="https://youtube.com..." [(ngModel)]="nuevaPublicacion.url_adjunta"></div>
                <div class="form-group mb-3"><label>Tipo</label>
                  <select class="form-select" [(ngModel)]="nuevaPublicacion.tipo">
                    <option value="MATERIAL">Material</option><option value="ANUNCIO">Anuncio</option><option value="EXAMEN">Examen/Cuestionario</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer"><button class="btn btn-primary" (click)="guardarPublicacion()">Publicar</button></div>
            </div>
          </div>
        }"""

html_modal_new = """        @if(modalPublicacion()) {
          <div class="modal-backdrop">
            <div class="modal-card form-modal animate-slide-up" style="max-width: 650px;">
              <div class="modal-header-modern bg-gradient-indigo">
                <div class="header-icon">📝</div>
                <div>
                  <h3>Publicar en el Muro</h3>
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

                <div class="form-group mt-4 p-3 border rounded" style="background: #f8fafc; border: 1px dashed #cbd5e1;">
                  <label class="form-label-modern mb-1">📎 Adjuntar Documento (PDF, Word, Excel)</label>
                  <input type="file" class="form-control-modern" (change)="onFileSelected($event)" style="border: none; background: white; padding: 0.5rem;" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx">
                  @if (archivoSeleccionado()) {
                    <div class="text-sm mt-2 text-success">
                      <strong>Seleccionado:</strong> {{ archivoSeleccionado()?.name }}
                    </div>
                  }
                </div>
              </div>
              <div class="modal-footer-modern">
                <button class="btn btn-outline" (click)="modalPublicacion.set(false)" [disabled]="isSaving()">Cancelar</button>
                <button class="btn btn-primary px-4" (click)="guardarPublicacion()" [disabled]="isSaving()">
                  @if (isUploading()) {
                    <span>Subiendo Archivo... ⏳</span>
                  } @else {
                    <span>Publicar en Muro</span>
                  }
                </button>
              </div>
            </div>
          </div>
        }"""
content = content.replace(html_modal_old, html_modal_new)


# Also add the attachment to the feed!
html_attachment_feed = """                        @if (post.videoEmbedUrl) {
                          <div class="video-wrapper mt-3">
                            <iframe [src]="getSafeUrl(post.videoEmbedUrl)" frameborder="0" allowfullscreen></iframe>
                          </div>
                        }

                        @if (post.archivoAdjuntoUrl) {
                          <div class="attachment-box mt-3 p-3 rounded flex-between" style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                              <span style="font-size: 1.5rem;">📎</span>
                              <div style="display: flex; flex-direction: column;">
                                <strong style="color: #0f172a; font-size: 0.95rem;">{{ post.archivoAdjuntoNombre }}</strong>
                                <span style="color: #64748b; font-size: 0.8rem;">Documento Adjunto</span>
                              </div>
                            </div>
                            <a [href]="'http://localhost:3000' + post.archivoAdjuntoUrl" target="_blank" class="btn btn-sm btn-outline">Descargar</a>
                          </div>
                        }"""
content = content.replace("""                        @if (post.videoEmbedUrl) {
                          <div class="video-wrapper mt-3">
                            <iframe [src]="getSafeUrl(post.videoEmbedUrl)" frameborder="0" allowfullscreen></iframe>
                          </div>
                        }""", html_attachment_feed)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
