import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

import re

# Insert delete button next to aula title
content = re.sub(r'(<div class="aula-header">.*?<span class="icon">🎒</span>\s*</div>)', r'<div class="aula-header" style="display: flex; justify-content: space-between;"><span class="icon">🎒</span><button class="btn btn-sm text-danger" (click)="eliminarAula(aula, $event)" title="Eliminar Aula" style="background: none; border: none; font-size: 1.2rem;">🗑️</button></div>', content, flags=re.DOTALL)

# Insert delete button next to post header
content = re.sub(r'(<div class="post-header mb-3" style=".*?">\s*<div class="user-info" style=".*?">\s*<div class="avatar".*?>.*?</div>\s*<div>\s*<strong>\{\{ post.creadoPor\?\.nombres \}\} \{\{ post.creadoPor\?\.apellidos \}\}</strong>\s*<span class="text-sm text-muted d-block">\{\{ post.createdAt \| date:\'medium\' \}\}</span>\s*</div>\s*</div>)', r'\1\n                      <button class="btn btn-sm text-danger" (click)="eliminarPublicacion(post)" title="Eliminar Post" style="background: none; border: none; font-size: 1.2rem;">🗑️</button>', content, flags=re.DOTALL)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
