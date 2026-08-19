import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# 1. Update HTML in modalCrearTarea
old_html = r"""                <input 
                  type="text" 
                  class="form-control mt-2" 
                  \[ngModel\]="nuevaTareaForm\.urlGuiaAdjunta" 
                  placeholder="O pega una URL directa \(Google Drive, YouTube, etc\.\)" />"""

new_html = r"""                <input 
                  type="text" 
                  class="form-control mt-2" 
                  [(ngModel)]="nuevaTareaForm.urlGuiaAdjunta" 
                  (ngModelChange)="onUrlChange($event)"
                  placeholder="O pega una URL directa (Google Drive, YouTube, etc.)" />
                @if (videoPreviewUrl()) {
                  <div class="mt-2 video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">
                    <iframe [src]="videoPreviewUrl()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe>
                  </div>
                }"""

content = re.sub(old_html, new_html, content)

# 2. Update abrirModalCrearTarea
old_crear = r"""    this.nombreArchivoGuia = '';
    this.modalCrearTarea.set(true);"""

new_crear = r"""    this.nombreArchivoGuia = '';
    this.videoPreviewUrl.set(null);
    this.modalCrearTarea.set(true);"""

content = content.replace(old_crear, new_crear)

# 3. Update abrirModalEditarTarea
old_editar = r"""    this.nombreArchivoGuia = tarea.urlGuiaAdjunta ? 'Guía de trabajo adjunta' : '';
    this.modalCrearTarea.set(true);"""

new_editar = r"""    this.nombreArchivoGuia = tarea.urlGuiaAdjunta ? 'Guía de trabajo adjunta' : '';
    this.onUrlChange(tarea.urlGuiaAdjunta || '');
    this.modalCrearTarea.set(true);"""

content = content.replace(old_editar, new_editar)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)

