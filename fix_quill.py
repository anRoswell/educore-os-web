import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# 1. Add Import
content = content.replace("import { FormsModule } from '@angular/forms';", "import { FormsModule } from '@angular/forms';\nimport { QuillModule } from 'ngx-quill';")
content = content.replace("imports: [CommonModule, FormsModule],", "imports: [CommonModule, FormsModule, QuillModule],")

# 2. Add File Icon Logic
icon_logic = """
  getFileIcon(filename: string | undefined): string {
    if (!filename) return '📄';
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext!)) return '📘';
    if (['xls', 'xlsx'].includes(ext!)) return '📗';
    if (['ppt', 'pptx'].includes(ext!)) return '📙';
    return '📄';
  }"""
content = content.replace("  // Archivos Adjuntos", icon_logic + "\n\n  // Archivos Adjuntos")

# 3. Replace text area with Quill and update attachment icon in feed
textarea_old = r'<textarea class="form-control-modern" rows="4" \[\(ngModel\)\]="nuevaPublicacion.contenido" placeholder="Instrucciones, saludos o explicación del tema\.\.\."></textarea>'
textarea_new = r"""<quill-editor [(ngModel)]="nuevaPublicacion.contenido" 
                                  [styles]="{height: '200px'}" 
                                  placeholder="Instrucciones, saludos o explicación del tema...">
                    </quill-editor>"""
content = re.sub(textarea_old, textarea_new, content)

# 4. Feed content must use innerHTML to parse HTML from Quill
feed_p_old = r'<p style="white-space: pre-wrap;">\{\{ post.contenido \}\}</p>'
feed_p_new = r'<div class="post-content mb-3" [innerHTML]="post.contenido" style="color: #334155;"></div>'
content = re.sub(feed_p_old, feed_p_new, content)

# 5. Fix feed attachment icon
attach_icon_old = r'<span style="font-size: 1\.5rem;">📄</span>'
attach_icon_new = r'<span style="font-size: 1.8rem;">{{ getFileIcon(post.archivoAdjuntoNombre) }}</span>'
content = re.sub(attach_icon_old, attach_icon_new, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
