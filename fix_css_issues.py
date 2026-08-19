import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# Fix Attachment overflow
old_attach = r'<div style="display: flex; align-items: center; gap: 0\.75rem;">\s*<span style="font-size: 1\.8rem;">\{\{ getFileIcon\(post\.archivoAdjuntoNombre\) \}\}</span>\s*<div>\s*<strong style="color: #334155; display: block;">\{\{ post\.archivoAdjuntoNombre \|\| \'Documento Adjunto\' \}\}</strong>\s*<span style="font-size: 0\.8rem; color: #64748b;">Haga clic para descargar</span>\s*</div>\s*</div>\s*<a \[href\]="post\.archivoAdjuntoUrl"'

new_attach = r"""<div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1; padding-right: 1rem;">
                            <span style="font-size: 1.8rem; flex-shrink: 0;">{{ getFileIcon(post.archivoAdjuntoNombre) }}</span>
                            <div style="min-width: 0; overflow: hidden; width: 100%;">
                              <strong style="color: #334155; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">{{ post.archivoAdjuntoNombre || 'Documento Adjunto' }}</strong>
                              <span style="font-size: 0.8rem; color: #64748b;">Haga clic para descargar</span>
                            </div>
                          </div>
                          <a [href]="post.archivoAdjuntoUrl" target="_blank" class="btn btn-sm" style="flex-shrink: 0; background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.35rem 0.75rem; text-decoration: none; color: #4f46e5; font-weight: 600;">
                            ⬇️ Descargar
                          </a>
                        </div>"""
# the closing div is matched in the string after <a ... it's not matched in old_attach, wait! 
# I will just match up to the <a ...

content = re.sub(
    r'<div style="display: flex; align-items: center; gap: 0\.75rem;">\s*<span style="font-size: 1\.8rem;">\{\{ getFileIcon\(post\.archivoAdjuntoNombre\) \}\}</span>\s*<div>\s*<strong style="color: #334155; display: block;">\{\{ post\.archivoAdjuntoNombre \|\| \'Documento Adjunto\' \}\}</strong>\s*<span style="font-size: 0\.8rem; color: #64748b;">Haga clic para descargar</span>\s*</div>\s*</div>\s*<a \[href\]="post\.archivoAdjuntoUrl" target="_blank" class="btn btn-sm"',
    r"""<div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1; padding-right: 1rem;">
                            <span style="font-size: 1.8rem; flex-shrink: 0;">{{ getFileIcon(post.archivoAdjuntoNombre) }}</span>
                            <div style="min-width: 0; overflow: hidden; width: 100%;">
                              <strong style="color: #334155; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">{{ post.archivoAdjuntoNombre || 'Documento Adjunto' }}</strong>
                              <span style="font-size: 0.8rem; color: #64748b;">Haga clic para descargar</span>
                            </div>
                          </div>
                          <a [href]="post.archivoAdjuntoUrl" target="_blank" class="btn btn-sm" style="flex-shrink: 0; background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.35rem 0.75rem; text-decoration: none; color: #4f46e5; font-weight: 600;" """,
    content
)


# Fix Sidebar Paddings & Text Overflow
content = content.replace("padding: 1.25rem;", "padding: 1rem; /* Modificado */")
content = content.replace("padding: 0.85rem;", "padding: 0.6rem 0.4rem; /* Modificado */")
content = content.replace("flex: 1; display: flex; flex-direction: column;", "flex: 1; display: flex; flex-direction: column; overflow: hidden;")
content = content.replace("max-width: 180px;", "max-width: 100%;")
content = content.replace("color: #1e293b; font-size: 0.95rem;", "color: #1e293b; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;")

# Increase grid column for sidebar to 320px
content = content.replace("isSidebarOpen() ? '300px", "isSidebarOpen() ? '320px")


with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
