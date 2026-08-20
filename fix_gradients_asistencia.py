import sys
import re

with open('src/app/pages/asistencia/asistencia.component.ts', 'r') as f:
    content = f.read()

# Replace the base .stat-card background
old_base = """    .stat-card {
      background: white;"""
new_base = """    .stat-card {
      background: linear-gradient(135deg, #ffffff 50%, rgba(99,102,241,0.06) 100%);"""
content = content.replace(old_base, new_base)

# Replace the specific success/warning/danger classes to include the gradient
old_success = ".stat-card.success { border-left-color: #10b981; }"
new_success = ".stat-card.success { border-left-color: #10b981; background: linear-gradient(135deg, #ffffff 50%, rgba(16,185,129,0.08) 100%); }"
content = content.replace(old_success, new_success)

old_warning = ".stat-card.warning { border-left-color: #f59e0b; }"
new_warning = ".stat-card.warning { border-left-color: #f59e0b; background: linear-gradient(135deg, #ffffff 50%, rgba(245,158,11,0.08) 100%); }"
content = content.replace(old_warning, new_warning)

old_danger = ".stat-card.danger { border-left-color: #ef4444; }"
new_danger = ".stat-card.danger { border-left-color: #ef4444; background: linear-gradient(135deg, #ffffff 50%, rgba(239,68,68,0.08) 100%); }"
content = content.replace(old_danger, new_danger)

with open('src/app/pages/asistencia/asistencia.component.ts', 'w') as f:
    f.write(content)
