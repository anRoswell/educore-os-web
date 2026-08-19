import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# I already replaced it with mb-5 and margin-bottom: 2rem. Let's find that and maybe add an hr.
old_str = r'<div class="flex-between mb-5" style="margin-bottom: 2rem;">\s*<h2>Muro: \{\{ aulaSeleccionada\(\)\?\.nombre \}\}</h2>\s*<button class="btn btn-primary" \(click\)="abrirModalPublicacion\(\)">📝 Crear Post</button>\s*</div>'
new_str = r"""<div class="flex-between mb-4">
                    <h2 style="margin: 0; color: #1e293b;">Muro: {{ aulaSeleccionada()?.nombre }}</h2>
                    <button class="btn btn-primary" (click)="abrirModalPublicacion()">📝 Crear Post</button>
                  </div>
                  <hr style="border: 0; height: 1px; background: #e2e8f0; margin-bottom: 2rem;">"""

content = re.sub(old_str, new_str, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
