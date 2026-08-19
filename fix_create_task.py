import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

old_str = r"""      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav mt-4">
        <button 
          (click)="tabActiva.set('tareas')" 
          \[class.active\]="tabActiva\(\) === 'tareas'" 
          class="tab-btn">
          <span>📚 Bandeja de Tareas</span>
        </button>
        <button 
          \(click\)="tabActiva.set\('estudiante_vista'\)" 
          \[class.active\]="tabActiva\(\) === 'estudiante_vista'" 
          class="tab-btn">
          <span>👨‍🎓 Vista de Entrega \(Portal Estudiante\)</span>
        </button>
      </div>"""

new_str = r"""      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav mt-4" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; gap: 0.5rem;">
          <button 
            (click)="tabActiva.set('tareas')" 
            [class.active]="tabActiva() === 'tareas'" 
            class="tab-btn">
            <span>📚 Bandeja de Tareas</span>
          </button>
          <button 
            (click)="tabActiva.set('estudiante_vista')" 
            [class.active]="tabActiva() === 'estudiante_vista'" 
            class="tab-btn">
            <span>👨‍🎓 Vista de Entrega (Portal Estudiante)</span>
          </button>
        </div>
        <button class="btn btn-primary" (click)="abrirModalCrearTarea()" style="padding: 0.5rem 1rem; border-radius: 8px;">
          <span>📝 Crear Nueva Tarea</span>
        </button>
      </div>"""

content = re.sub(old_str, new_str, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
