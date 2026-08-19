import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

old_header = r'(<span class="badge" \[ngClass\]="post\.tipo === \'MATERIAL\' \? \'bg-indigo\' : \'bg-success\'">\{\{ post\.tipo \}\}</span>)'
new_header = r"""\1
                        <div style="display: inline-flex; gap: 0.5rem; margin-left: auto; padding-left: 1rem;">
                          <button class="btn btn-sm text-primary" (click)="editarPublicacion(post)" title="Editar Post" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">✏️</button>
                          <button class="btn btn-sm text-danger" (click)="eliminarPublicacion(post)" title="Eliminar Post" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">🗑️</button>
                        </div>"""

content = re.sub(old_header, new_header, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
