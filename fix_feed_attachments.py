import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

attach_html = """
                      @if (post.archivoAdjuntoUrl) {
                        <div class="mt-3 p-3 border rounded" style="background: #f8fafc; border-color: #e2e8f0; display: flex; align-items: center; justify-content: space-between; border-radius: 8px;">
                          <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">📄</span>
                            <div>
                              <strong style="color: #334155; display: block;">{{ post.archivoAdjuntoNombre || 'Documento Adjunto' }}</strong>
                              <span style="font-size: 0.8rem; color: #64748b;">Haga clic para descargar</span>
                            </div>
                          </div>
                          <a [href]="post.archivoAdjuntoUrl" target="_blank" class="btn btn-sm" style="background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.35rem 0.75rem; text-decoration: none; color: #4f46e5; font-weight: 600;">
                            ⬇️ Descargar
                          </a>
                        </div>
                      }
"""

# Insert it after the videoEmbedUrl block
content = re.sub(
    r'(<iframe \[src\]="getSafeUrl\(post\.videoEmbedUrl\)" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe>\s*</div>\s*\})',
    r'\1\n' + attach_html,
    content
)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
