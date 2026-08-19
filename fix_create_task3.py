import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# Replace opening div
content = content.replace('<div class="tabs-nav mt-4">', '<div class="tabs-nav-wrapper mt-4" style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; margin-bottom: 1rem;">\n        <div class="tabs-nav" style="border-bottom: none; padding-bottom: 0;">')

# Find the exact closing div for tabs-nav
old_closing = r"""        </button>
      </div>

      <!-- TAB 1: BANDEJA DE TAREAS PUBLICADAS -->"""

new_closing = r"""        </button>
        </div>
        <button class="btn btn-primary" (click)="abrirModalCrearTarea()" style="padding: 0.5rem 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
          ➕ Crear Nueva Tarea
        </button>
      </div>

      <!-- TAB 1: BANDEJA DE TAREAS PUBLICADAS -->"""

content = re.sub(old_closing, new_closing, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
