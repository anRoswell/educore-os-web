import sys

with open('src/app/pages/asistencia/asistencia.component.ts', 'r') as f:
    content = f.read()

# Add mt-4 to tab-body
content = content.replace('<div class="tab-body animate-fade-in">', '<div class="tab-body animate-fade-in mt-4">')

with open('src/app/pages/asistencia/asistencia.component.ts', 'w') as f:
    f.write(content)
