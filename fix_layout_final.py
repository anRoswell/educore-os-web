import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# First, let's reverse the bad injection we did earlier (if it was injected somewhere else).
# Actually, the previous injection used `search_str2 = r"""      <!-- MODAL CREAR NUEVA AULA VIRTUAL -->"""` which failed! 
# So the right_sidebar_html was never injected! Let's confirm this by searching for 'Columna Derecha (Widgets)'
if 'Columna Derecha (Widgets)' in content:
    print("Already injected somewhere else. Please verify manually.")
    sys.exit(1)

right_sidebar_html = """
              <!-- Columna Derecha (Widgets) -->
              <div class="right-widgets" style="display: flex; flex-direction: column; gap: 1.5rem;">
                
                @if (aulaSeleccionada()) {
                  <div class="widget-card shadow-sm border" style="background: white; border-radius: 12px; padding: 1.5rem;">
                    <h3 style="font-size: 1.1rem; margin-top: 0; margin-bottom: 1rem; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem;">Próximas Tareas</h3>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                      <div class="task-mini-item" style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                          24
                        </div>
                        <div>
                          <strong style="display: block; font-size: 0.9rem; color: #334155;">Taller de Funciones</strong>
                          <span style="font-size: 0.75rem; color: #ef4444;">Vence hoy a las 23:59</span>
                        </div>
                      </div>
                      
                      <div class="task-mini-item" style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="background: #e0e7ff; color: #4f46e5; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                          28
                        </div>
                        <div>
                          <strong style="display: block; font-size: 0.9rem; color: #334155;">Evaluación Unidad 2</strong>
                          <span style="font-size: 0.75rem; color: #64748b;">Próximo viernes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="widget-card shadow-sm border" style="background: white; border-radius: 12px; padding: 1.5rem;">
                    <h3 style="font-size: 1.1rem; margin-top: 0; margin-bottom: 1rem; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem;">Estadísticas del Aula</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #64748b; font-size: 0.9rem;">Estudiantes Matriculados</span>
                        <strong style="color: #334155;">35</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #64748b; font-size: 0.9rem;">Total de Publicaciones</span>
                        <strong style="color: #334155;">{{ publicaciones().length }}</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #64748b; font-size: 0.9rem;">Tareas Pendientes</span>
                        <strong style="color: #eab308;">2</strong>
                      </div>
                    </div>
                  </div>
                } @else {
                  <div class="widget-card shadow-sm border" style="background: white; border-radius: 12px; padding: 1.5rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">👈</div>
                    <p style="color: #64748b; margin: 0; font-size: 0.95rem;">Selecciona un aula en el panel izquierdo para ver sus estadísticas y tareas pendientes.</p>
                  </div>
                }

              </div>"""

search_str = r"""                \} @else \{
                  <div class="p-8 text-center text-slate-500">Selecciona un aula para ver su muro\.</div>
                \}
              </div>"""
replace_str = """                } @else {
                  <div class="p-8 text-center text-slate-500">Selecciona un aula para ver su muro.</div>
                }
              </div>\n""" + right_sidebar_html

content = re.sub(search_str, replace_str, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)

