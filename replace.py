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
    const url = this.api.apiUrl + \`/academico/boletines/descargar-masivo/\${grupoId}/periodo/\${periodoId}\`;
    window.open(url, '_blank');
  }
"""

content = content.replace("descargarBoletinDemo() {", new_method + "\n  descargarBoletinDemo() {")

# Agregamos el botón en el template
boton_html = """
          <button
            class="header-btn secondary"
            (click)="descargarBoletinesMasivos()"
            title="Descargar ZIP masivo con todos los boletines del grupo seleccionado"
          >
            <lucide-angular [img]="FileArchiveIcon" size="18"></lucide-angular>
            Descargar Masivo (ZIP)
          </button>
"""
content = content.replace("<!-- Botones Demo / Flujo Final -->", "<!-- Botones Demo / Flujo Final -->" + boton_html)

# Add FileArchive to imports
if "FileArchive" not in content:
  content = content.replace("Download,", "Download, FileArchive,")
  content = content.replace("DownloadIcon = Download;", "DownloadIcon = Download;\n  FileArchiveIcon = FileArchive;")

with open('src/app/pages/academico/academico.component.ts', 'w') as f:
  f.write(content)
