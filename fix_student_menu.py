import sys
import re

with open('src/app/layout/admin-layout.component.ts', 'r') as f:
    content = f.read()

# 1. Update Dashboard Name
old_dashboard = r"""              @if (authService.user()?.role === 'DOCENTE') {
                Dashboard Pedagógico
              } @else if (authService.user()?.role === 'TESORERO') {
                Dashboard Financiero
              } @else if (authService.user()?.role === 'COORDINADOR') {
                Dashboard Coordinación
              } @else {
                Dashboard Rectoría
              }"""

new_dashboard = r"""              @if (authService.user()?.role === 'DOCENTE') {
                Dashboard Pedagógico
              } @else if (authService.user()?.role === 'TESORERO') {
                Dashboard Financiero
              } @else if (authService.user()?.role === 'COORDINADOR') {
                Dashboard Coordinación
              } @else if (authService.user()?.role === 'ESTUDIANTE') {
                Mi Resumen Estudiantil
              } @else {
                Dashboard Rectoría
              }"""
content = re.sub(old_dashboard, new_dashboard, content)

# 2. Update LMS & Academico titles
old_academico = r"""{{ authService.user()?.role === 'DOCENTE' \? 'Mis Calificaciones \(1290\)' : 'Calificaciones \(Dec. 1290\)' }}"""
new_academico = r"""{{ authService.user()?.role === 'DOCENTE' ? 'Mis Calificaciones (1290)' : (authService.user()?.role === 'ESTUDIANTE' ? 'Mi Boletín de Notas' : 'Calificaciones (Dec. 1290)') }}"""
content = re.sub(old_academico, new_academico, content)

old_lms = r"""{{ authService.user()?.role === 'DOCENTE' \? 'Aula Virtual & Tareas' : 'Aula Virtual & Tareas LMS' }}"""
new_lms = r"""{{ authService.user()?.role === 'DOCENTE' ? 'Aula Virtual & Tareas' : (authService.user()?.role === 'ESTUDIANTE' ? 'Mis Clases & Muro' : 'Aula Virtual & Tareas LMS') }}"""
content = re.sub(old_lms, new_lms, content)

# 3. Update Convivencia
old_convivencia = r"""<span class="nav-text">Convivencia & Observador</span>"""
new_convivencia = r"""<span class="nav-text">{{ authService.user()?.role === 'ESTUDIANTE' ? 'Mi Observador' : 'Convivencia & Observador' }}</span>"""
content = re.sub(old_convivencia, new_convivencia, content)

# 4. Hide Tesoreria for ESTUDIANTE ? Wait, Tesoreria is already hidden for ESTUDIANTE because of:
# @if (authService.user()?.role === 'RECTOR' || authService.user()?.role === 'TESORERO' || authService.user()?.role === 'SUPER_ADMIN') {
# Yes, it's hidden! But students should probably see their bills. I will just leave it hidden for now.
# Wait, are there other things?
# "Matrículas & Ficha 360°" is hidden for DOCENTE:
# @if (authService.user()?.role !== 'DOCENTE') {
# Students shouldn't see it either.
content = content.replace("@if (authService.user()?.role !== 'DOCENTE') {", "@if (authService.user()?.role !== 'DOCENTE' && authService.user()?.role !== 'ESTUDIANTE') {")

# "INNOVACIÓN & COMUNIDAD" is hidden for TESORERO:
# @if (authService.user()?.role !== 'TESORERO') {
# Should students see EduCore AI?
# Yes, maybe "Tutor IA".
old_ai = r"""{{ authService.user()?.role === 'DOCENTE' \? 'EduCore AI Planeador' : 'EduCore AI & RAG PEI' }}"""
new_ai = r"""{{ authService.user()?.role === 'DOCENTE' ? 'EduCore AI Planeador' : (authService.user()?.role === 'ESTUDIANTE' ? 'Mi Tutor IA' : 'EduCore AI & RAG PEI') }}"""
content = re.sub(old_ai, new_ai, content)

# Should students see Inclusión & PIAR? No.
# Should students see Habeas Data? No.
# Should students see Gobierno Escolar? Yes, to vote!
# So I should wrap Inclusion and Habeas Data:
old_inclusion = r"""            <a routerLink="/inclusion" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🧩</span>
              <span class="nav-text">Inclusión & PIAR \(DUA\)</span>
              <span class="badge-mini" style="background: rgba\(168, 85, 247, 0\.2\); color: #c084fc; border-color: rgba\(168, 85, 247, 0\.3\);">1421</span>
            </a>
            <a routerLink="/habeas-data" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">⚖️</span>
              <span class="nav-text">Protección de Datos & SIC</span>
              <span class="badge-mini" style="background: rgba\(2, 132, 199, 0\.2\); color: #38bdf8; border-color: rgba\(2, 132, 199, 0\.3\);">1581</span>
            </a>"""

new_inclusion = r"""          @if (authService.user()?.role !== 'ESTUDIANTE') {
            <a routerLink="/inclusion" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🧩</span>
              <span class="nav-text">Inclusión & PIAR (DUA)</span>
              <span class="badge-mini" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border-color: rgba(168, 85, 247, 0.3);">1421</span>
            </a>
            <a routerLink="/habeas-data" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">⚖️</span>
              <span class="nav-text">Protección de Datos & SIC</span>
              <span class="badge-mini" style="background: rgba(2, 132, 199, 0.2); color: #38bdf8; border-color: rgba(2, 132, 199, 0.3);">1581</span>
            </a>
          }"""

content = re.sub(old_inclusion, new_inclusion, content)

with open('src/app/layout/admin-layout.component.ts', 'w') as f:
    f.write(content)

