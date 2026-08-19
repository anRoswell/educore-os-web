import sys

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# Add Delete methods
methods = """  eliminarAula(aula: any, event: Event) {
    event.stopPropagation();
    if (confirm('¿Está seguro de eliminar esta aula? Se perderán todas sus publicaciones.')) {
      this.api.delete(`lms/aulas/${aula.id}`).subscribe(() => {
        this.aulas.update(list => list.filter((a: any) => a.id !== aula.id));
        if (this.aulaSeleccionada()?.id === aula.id) {
          this.aulaSeleccionada.set(null);
          this.publicaciones.set([]);
        }
        this.toast.success('Eliminada', 'Aula eliminada correctamente.');
      });
    }
  }

  eliminarPublicacion(post: any) {
    const aulaId = this.aulaSeleccionada()?.id;
    if (!aulaId) return;
    if (confirm('¿Eliminar esta publicación del muro?')) {
      this.api.delete(`lms/aulas/${aulaId}/publicaciones/${post.id}`).subscribe(() => {
        this.publicaciones.update(list => list.filter((p: any) => p.id !== post.id));
        this.toast.success('Eliminada', 'Publicación eliminada.');
      });
    }
  }
"""

content = content.replace("  abrirModalCrearAula() {", methods + "\n  abrirModalCrearAula() {")

# Add Delete button to Aula Item
aula_old = """                  <div class="aula-header">
                    <span class="icon">🎒</span>
                  </div>
                  <h4>{{ aula.nombre }}</h4>
                  <p>{{ aula.descripcion || 'Sin descripción' }}</p>"""

aula_new = """                  <div class="aula-header" style="display: flex; justify-content: space-between;">
                    <span class="icon">🎒</span>
                    <button class="btn btn-sm btn-outline text-danger" (click)="eliminarAula(aula, $event)" title="Eliminar Aula" style="border: none;">🗑️</button>
                  </div>
                  <h4>{{ aula.nombre }}</h4>
                  <p>{{ aula.descripcion || 'Sin descripción' }}</p>"""
content = content.replace(aula_old, aula_new)


# Add Delete button to Post Item
post_old = """                        <div>
                          <strong>{{ post.creadoPor?.nombres }} {{ post.creadoPor?.apellidos }}</strong>
                          <span class="text-sm text-muted d-block">{{ post.createdAt | date:'medium' }}</span>
                        </div>
                      </div>"""
post_new = """                        <div>
                          <strong>{{ post.creadoPor?.nombres }} {{ post.creadoPor?.apellidos }}</strong>
                          <span class="text-sm text-muted d-block">{{ post.createdAt | date:'medium' }}</span>
                        </div>
                      </div>
                      <button class="btn btn-sm btn-outline text-danger" (click)="eliminarPublicacion(post)" style="border: none;" title="Eliminar Post">🗑️</button>"""
content = content.replace(post_old, post_new)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
