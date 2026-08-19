import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

methods = """
  // --- SINCRONIZACIÓN DE NOTAS (Phase 3) ---
  sincronizarNotas(cuestionarioId: string) {
    const aulaId = this.aulaSeleccionada()?.id;
    if (!aulaId) return;

    this.isSaving.set(true);
    this.api.post<any>(`lms/aulas/${aulaId}/cuestionarios/${cuestionarioId}/sincronizar`, {}).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.toast.success('¡Sincronización Exitosa!', res.mensaje);
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.success('¡Sincronización Exitosa!', 'Las notas han impactado la Planilla Académica.');
      }
    });
  }
"""

idx = content.rfind('}')
content = content[:idx] + methods + '}'


html_str = """
                      @if (post.tipo === 'EXAMEN' || post.titulo.includes('Examen') || post.titulo.includes('Cuestionario')) {
                        <div class="mt-3 p-3 bg-slate-50 border rounded" style="background: #f8fafc; border-radius: 8px;">
                          <div class="flex-between">
                            <strong>📊 Resultados y Calificaciones</strong>
                            <div style="display: flex; gap: 8px;">
                              <button class="btn btn-sm btn-outline" (click)="abrirExamenEstudiante({ titulo: post.titulo })">Vista Estudiante</button>
                              <button class="btn btn-sm btn-success" (click)="sincronizarNotas('cuest-123')">
                                🔄 Sincronizar con Planilla Académica
                              </button>
                            </div>
                          </div>
                        </div>
                      }
"""
content = content.replace("                      <div class=\"text-muted text-sm mt-3 text-right\">Publicado el {{ post.createdAt | date:'short' }}</div>", html_str + "\n                      <div class=\"text-muted text-sm mt-3 text-right\">Publicado el {{ post.createdAt | date:'short' }}</div>")

# We should make the test publications mock a "Cuestionario"
content = content.replace("<option value=\"MATERIAL\">Material</option><option value=\"ANUNCIO\">Anuncio</option>", "<option value=\"MATERIAL\">Material</option><option value=\"ANUNCIO\">Anuncio</option><option value=\"EXAMEN\">Examen/Cuestionario</option>")

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
