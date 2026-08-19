import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

old_html = """      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav mt-4">
        <button 
          (click)="tabActiva.set('tareas')" 
          [class.active]="tabActiva() === 'tareas'" 
          class="tab-btn">
          <span>📋 Tareas Publicadas ({{ tareasFiltradas().length }})</span>
        </button>
        <button 
          (click)="tabActiva.set('calificar')" 
          [class.active]="tabActiva() === 'calificar'" 
          class="tab-btn" 
          [disabled]="!tareaSeleccionada()">
          <span>📝 Vista de Calificación</span>
        </button>
        <button 
          (click)="tabActiva.set('estudiante_vista')" 
          [class.active]="tabActiva() === 'estudiante_vista'" 
          class="tab-btn">
          <span>👨‍🎓 Vista de Entrega (Portal Estudiante)</span>
        </button>
      </div>"""

new_html = """      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav mt-4" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0;">
        <div style="display: flex; gap: 0.5rem;">
          <button 
            (click)="tabActiva.set('tareas')" 
            [class.active]="tabActiva() === 'tareas'" 
            class="tab-btn">
            <span>📋 Tareas Publicadas ({{ tareasFiltradas().length }})</span>
          </button>
          <button 
            (click)="tabActiva.set('calificar')" 
            [class.active]="tabActiva() === 'calificar'" 
            class="tab-btn" 
            [disabled]="!tareaSeleccionada()">
            <span>📝 Vista de Calificación</span>
          </button>
          <button 
            (click)="tabActiva.set('estudiante_vista')" 
            [class.active]="tabActiva() === 'estudiante_vista'" 
            class="tab-btn">
            <span>👨‍🎓 Vista de Entrega (Portal Estudiante)</span>
          </button>
        </div>
        <button class="btn btn-primary" (click)="abrirModalCrearTarea()" style="padding: 0.5rem 1rem; border-radius: 8px;">
          <span>➕ Crear Nueva Tarea</span>
        </button>
      </div>"""

content = content.replace(old_html, new_html)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
