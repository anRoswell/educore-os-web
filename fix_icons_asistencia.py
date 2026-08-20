import sys

with open('src/app/pages/asistencia/asistencia.component.ts', 'r') as f:
    content = f.read()

old_css_base = "    .stat-icon { font-size: 2rem; }"
new_css_base = """    .stat-icon { 
      font-size: 1.6rem; 
      width: 52px; 
      height: 52px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border-radius: 14px; 
      background: rgba(99, 102, 241, 0.12); /* Default indigo wrapper */
    }"""
content = content.replace(old_css_base, new_css_base)

old_success = ".stat-card.success .stat-info p { color: #10b981; }"
new_success = ".stat-card.success .stat-info p { color: #10b981; }\n    .stat-card.success .stat-icon { background: rgba(16, 185, 129, 0.12); }"
content = content.replace(old_success, new_success)

old_warning = ".stat-card.warning .stat-info p { color: #f59e0b; }"
new_warning = ".stat-card.warning .stat-info p { color: #f59e0b; }\n    .stat-card.warning .stat-icon { background: rgba(245, 158, 11, 0.12); }"
content = content.replace(old_warning, new_warning)

old_danger = ".stat-card.danger .stat-info p { color: #ef4444; }"
new_danger = ".stat-card.danger .stat-info p { color: #ef4444; }\n    .stat-card.danger .stat-icon { background: rgba(239, 68, 68, 0.12); }"
content = content.replace(old_danger, new_danger)

with open('src/app/pages/asistencia/asistencia.component.ts', 'w') as f:
    f.write(content)
