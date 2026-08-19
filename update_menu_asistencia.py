import sys
import re

with open('src/app/layout/admin-layout.component.ts', 'r') as f:
    content = f.read()

# I will add the Asistencia link just below the GESTIÓN ACADÉMICA section.
# Specifically, between Academico and LMS, or after LMS.
# Let's put it after LMS.

old_menu = r"""            <a routerLink="/lms" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">📚</span>
              <span class="nav-text">
                {{ authService.user()?.role === 'DOCENTE' \? 'Aula Virtual & Tareas' : \(authService.user\(\)\?\.role === 'ESTUDIANTE' \? 'Mis Clases & Muro' : 'Aula Virtual & Tareas LMS'\) }}
              </span>
              <span class="badge-mini" style="background: rgba\(79, 70, 229, 0.2\); color: #818cf8; border-color: rgba\(79, 70, 229, 0.3\);">LMS</span>
            </a>"""

new_menu = r"""            <a routerLink="/lms" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">📚</span>
              <span class="nav-text">
                {{ authService.user()?.role === 'DOCENTE' ? 'Aula Virtual & Tareas' : (authService.user()?.role === 'ESTUDIANTE' ? 'Mis Clases & Muro' : 'Aula Virtual & Tareas LMS') }}
              </span>
              <span class="badge-mini" style="background: rgba(79, 70, 229, 0.2); color: #818cf8; border-color: rgba(79, 70, 229, 0.3);">LMS</span>
            </a>
            <a routerLink="/asistencia" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">📅</span>
              <span class="nav-text">
                {{ authService.user()?.role === 'ESTUDIANTE' ? 'Mis Faltas & Excusas' : 'Asistencia & Excusas' }}
              </span>
            </a>"""

content = re.sub(old_menu, new_menu, content)

with open('src/app/layout/admin-layout.component.ts', 'w') as f:
    f.write(content)

