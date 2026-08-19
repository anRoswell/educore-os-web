import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

old_html = """                <input 
                  type="text" 
                  class="form-control mt-2" 
                  [(ngModel)]="nuevaTareaForm.urlGuiaAdjunta" 
                  placeholder="O pega una URL directa (Google Drive, YouTube, etc.)" />"""

new_html = """                <input 
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

content = content.replace(old_html, new_html)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
