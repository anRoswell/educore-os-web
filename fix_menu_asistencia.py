import sys

with open('src/app/layout/admin-layout.component.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if "border-color: rgba(79, 70, 229, 0.3);\">LMS</span>" in line:
        # After this line comes the closing </a>, which is the next line
        pass
    if "</a>" in line and "border-color: rgba(79, 70, 229, 0.3);\">LMS</span>" in lines[i-1]:
        # Insert Asistencia right after the </a> of LMS
        new_lines.append("""            <a routerLink="/asistencia" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">📅</span>
              <span class="nav-text">
                {{ authService.user()?.role === 'ESTUDIANTE' ? 'Mis Faltas & Excusas' : 'Asistencia & Excusas' }}
              </span>
            </a>\n""")

with open('src/app/layout/admin-layout.component.ts', 'w') as f:
    f.writelines(new_lines)
