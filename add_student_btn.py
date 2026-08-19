import sys

with open('src/app/pages/login/login.component.ts', 'r') as f:
    content = f.read()

# Update signature in TS
content = content.replace("login(role: 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR') {", "login(role: 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR' | 'ESTUDIANTE') {")

# Modify grid to 3 columns? Or just leave it as is (it will wrap to 3 rows, or we can make it 1fr 1fr 1fr).
# The grid has grid-template-columns: 1fr 1fr;
# A 3rd column might be too cramped. Let's make it grid-template-columns: repeat(2, 1fr); for small, or just 1fr 1fr.
# We will just add the button.
old_btn = """              <button (click)="login('COORDINADOR')" class="role-btn coordinador">
                <span class="role-icon">📋</span>
                <div class="role-text">
                  <strong>Coordinación</strong>
                  <span>Convivencia & Horarios</span>
                </div>
              </button>
            </div>"""

new_btn = """              <button (click)="login('COORDINADOR')" class="role-btn coordinador">
                <span class="role-icon">📋</span>
                <div class="role-text">
                  <strong>Coordinación</strong>
                  <span>Convivencia & Horarios</span>
                </div>
              </button>

              <button (click)="login('ESTUDIANTE')" class="role-btn estudiante" style="grid-column: span 2; justify-content: center; background-color: #f8fafc; border-color: #94a3b8;">
                <span class="role-icon">👨‍🎓</span>
                <div class="role-text">
                  <strong>Estudiante / Acudiente</strong>
                  <span>Portal Académico & Muro</span>
                </div>
              </button>
            </div>"""

content = content.replace(old_btn, new_btn)

with open('src/app/pages/login/login.component.ts', 'w') as f:
    f.write(content)
