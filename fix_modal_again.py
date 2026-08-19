import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

import re

# Use regex to find the modalPublicacion block and replace it entirely
pattern = re.compile(r'@if\(modalPublicacion\(\)\)\s*\{\s*<div class="modal-backdrop">.*?</div>\s*</div>\s*\}', re.DOTALL)

html_modal_new = """@if(modalPublicacion()) {
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
                <button class="btn btn-outline" (click)="modalPublicacion.set(false)" [disabled]="isUploading()">Cancelar</button>
                <button class="btn btn-primary px-4" (click)="guardarPublicacion()" [disabled]="isUploading()">
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

content = pattern.sub(html_modal_new, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
