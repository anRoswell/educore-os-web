import sys
content = open('src/app/pages/academico/academico.component.ts').read()

boton_html = """          <button (click)="descargarBoletinesMasivos()" class="btn btn-secondary" title="Descargar ZIP Masivo" style="background: #e2e8f0; color: #0f172a;">
            <span>📦 Descargar ZIP (Masivo)</span>
          </button>
"""
content = content.replace(
  '<button (click)="descargarBoletinDemo()" class="btn btn-secondary" title="Descargar Boletín Consolidado">',
  boton_html + '          <button (click)="descargarBoletinDemo()" class="btn btn-secondary" title="Descargar Boletín Consolidado">'
)

with open('src/app/pages/academico/academico.component.ts', 'w') as f:
  f.write(content)
