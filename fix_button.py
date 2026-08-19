import sys
content = open('src/app/pages/academico/academico.component.ts').read()

old_boton_html = '''          <button (click)="descargarBoletinesMasivos()" class="btn btn-secondary" title="Descargar ZIP Masivo" style="background: #e2e8f0; color: #0f172a;">
            <span>📦 Descargar ZIP (Masivo)</span>
          </button>'''

new_boton_html = '''          <button (click)="descargarBoletinesMasivos()" class="btn btn-primary" title="Genera y descarga los boletines de todos los estudiantes de este grupo">
            <span>📦 Descargar Boletines del Grupo (ZIP)</span>
          </button>'''

content = content.replace(old_boton_html, new_boton_html)

with open('src/app/pages/academico/academico.component.ts', 'w') as f:
  f.write(content)
