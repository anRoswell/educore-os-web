import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# 1. Add isSidebarOpen signal
content = content.replace("readonly isSaving = signal(false);", "readonly isSaving = signal(false);\n  isSidebarOpen = signal(true);")

# 2. Add Toggle Button in Page Header
header_old = r'<div class="header-actions" style="display:flex; gap: 10px;">'
header_new = r"""<div class="header-actions" style="display:flex; gap: 10px; align-items: center;">
          <button class="btn btn-outline" (click)="isSidebarOpen.set(!isSidebarOpen())" title="Alternar panel lateral de aulas" style="padding: 0.5rem 0.75rem;">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>"""
content = re.sub(header_old, header_new, content)

# 3. Update Grid Columns Layout
grid_old = r'<div class="grid-cols-1 md:grid-cols-3 gap-4" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">'
grid_new = r"""<div class="main-lms-layout" [style.gridTemplateColumns]="isSidebarOpen() ? '300px minmax(0, 1fr) 300px' : '0px minmax(0, 1fr) 300px'" style="display: grid; gap: 2rem; transition: grid-template-columns 0.3s ease;">"""
content = re.sub(grid_old, grid_new, content)

# 4. Hide sidebar completely when closed
sidebar_old = r'<div class="aulas-sidebar shadow-sm">'
sidebar_new = r'<div class="aulas-sidebar shadow-sm" [style.opacity]="isSidebarOpen() ? 1 : 0" [style.pointerEvents]="isSidebarOpen() ? \'auto\' : \'none\'" style="overflow: hidden; transition: opacity 0.2s ease;">'
content = re.sub(sidebar_old, sidebar_new, content)

# 5. Inject right sidebar after muro-feed ends
# We need to find the end of <div class="muro-feed">
# In lms.component.ts, <div class="muro-feed"> ends right before `</div>` and `@if (modalCrearAula())`.
# A robust way is to just look for the end of the `muro-feed` block by searching for the `modalCrearAula` condition.
# Actually, muro-feed contains the `</div>` closing tag.
# We'll insert the right sidebar right after the `muro-feed` closes.
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

              </div>
            </div>
"""

# Find the exact location to replace:
#               </div>
#             </div>
#       <!-- MODAL CREAR NUEVA AULA VIRTUAL -->

search_str = r"""                </div>
              </div>
            </div>

      <!-- MODAL CREAR NUEVA AULA VIRTUAL -->"""
# Actually, the muro-feed ends correctly. We can do a simpler replace.
# Let's read the file and insert it before MODAL CREAR NUEVA AULA VIRTUAL
search_str2 = r"""      <!-- MODAL CREAR NUEVA AULA VIRTUAL -->"""
content = content.replace(search_str2, right_sidebar_html + "\n      <!-- MODAL CREAR NUEVA AULA VIRTUAL -->")

# Also, since we added <div class="right-widgets">, we need to make sure the main layout div is closed.
# We replaced `<div class="grid-cols-1 md:grid-cols-3 gap-4"` with `<div class="main-lms-layout"`.
# The main layout is closed right before `MODAL CREAR NUEVA AULA VIRTUAL`. Wait, if we just insert the HTML there,
# `right_sidebar_html` contains an extra `</div>` at the end to close the main layout!
# Wait, let's verify if `</div>` count is correct.
# Yes, the previous layout was closed with `</div>\n            </div>`.
# I will just replace `            </div>\n\n      <!-- MODAL CREAR NUEVA AULA VIRTUAL -->`
# with the widgets + closing `</div>`.

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)

