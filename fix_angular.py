import sys
content = open('src/app/pages/academico/academico.component.ts').read()

new_method = """  descargarBoletinesMasivos() {
    const grupoId = this.selectedGrupoId();
    const periodoId = this.selectedPeriodoId();

    if (!grupoId || !periodoId) {
      this.toast.warning('Selección requerida', 'Seleccione un grupo y un periodo para generar los boletines masivos.');
      return;
    }

    this.toast.info('Generando Boletines', 'Iniciando generación y compresión. Esto puede tardar unos segundos...');
    
    // Descargar el archivo desde el endpoint directamente
    const url = this.api.getBaseUrl() + `/academico/boletines/descargar-masivo/${grupoId}/periodo/${periodoId}`;
    window.open(url, '_blank');
  }
"""

content = content.replace("descargarBoletinDemo() {", new_method + "\n  descargarBoletinDemo() {")

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
