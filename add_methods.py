import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

methods = """  // Archivos Adjuntos
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
    }
  }

  guardarPublicacion() {
    const aulaId = this.aulaSeleccionada()?.id;
    if (!aulaId) return;
    this.isSaving.set(true);

    const file = this.archivoSeleccionado();
    if (file) {
      this.isUploading.set(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modulo', 'lms');

      this.api.post<any>('storage/upload', formData).subscribe({
        next: (res) => {
          this.nuevaPublicacion.archivoAdjuntoUrl = res.url;
          this.nuevaPublicacion.archivoAdjuntoNombre = res.originalName;
          this.isUploading.set(false);
          this.crearPostBackend(aulaId);
        },
        error: () => {
          this.isUploading.set(false);
          this.isSaving.set(false);
          this.toast.error('Error', 'No se pudo subir el archivo.');
        }
      });
    } else {
      this.crearPostBackend(aulaId);
    }
  }

  private crearPostBackend(aulaId: string) {
    this.api.post<any>(`lms/aulas/${aulaId}/publicaciones`, this.nuevaPublicacion).subscribe({
      next: (res) => {
        this.publicaciones.update(list => [res, ...list]);
        this.modalPublicacion.set(false);
        this.isSaving.set(false);
        this.toast.success('Publicado', 'Tu post se ha creado en el muro.');
      },
      error: () => this.isSaving.set(false)
    });
  }
"""

import re
pattern = re.compile(r'guardarPublicacion\(\) \{.*?\n  \}', re.DOTALL)
content = pattern.sub(methods, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
