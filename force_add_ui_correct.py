import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

import re

# Add to aula list
content = re.sub(r'(<div class="aula-arrow">.*?</div>)', r'\1\n                      <button class="btn btn-sm text-danger" (click)="eliminarAula(aula, $event)" title="Eliminar Aula" style="background: none; border: none; font-size: 1.2rem; padding: 0 5px;">🗑️</button>', content, flags=re.DOTALL)

# Add to post header
content = re.sub(r'(<span class="badge" \[ngClass\]="getBadgeClass\(post.tipo\)">.*?</span>)', r'\1\n                        <button class="btn btn-sm text-danger" (click)="eliminarPublicacion(post)" title="Eliminar Post" style="background: none; border: none; font-size: 1.2rem; padding: 0 5px; margin-left: 10px;">🗑️</button>', content, flags=re.DOTALL)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
