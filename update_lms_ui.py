import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# 1. Add Edit Buttons
content = re.sub(
    r'(<button class="btn btn-sm text-danger" \(click\)="eliminarAula\(aula, \$event\)")', 
    r'<button class="btn btn-sm text-primary" (click)="editarAula(aula, $event)" title="Editar Aula" style="background: none; border: none; font-size: 1.2rem; padding: 0 5px;">✏️</button>\n                      \1', 
    content
)

content = re.sub(
    r'(<button class="btn btn-sm text-danger" \(click\)="eliminarPublicacion\(post\)")', 
    r'<button class="btn btn-sm text-primary" (click)="editarPublicacion(post)" title="Editar Post" style="background: none; border: none; font-size: 1.2rem; padding: 0 5px; margin-left: auto;">✏️</button>\n                        \1', 
    content
)

# 2. Add Confirm Modal Template
confirm_modal_html = """
        @if (showConfirmModal()) {
          <div class="modal-backdrop animate-fadeIn">
            <div class="glass-modal animate-scaleUp">
              <div class="modal-header">
                <div class="modal-icon-badge" style="background: #fee2e2; color: #ef4444;">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 1.1rem;">{{ confirmModalConfig().title }}</h3>
                </div>
              </div>
              <div class="modal-body">
                <p style="color: #64748b;">{{ confirmModalConfig().message }}</p>
              </div>
              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                <button class="btn btn-outline" (click)="showConfirmModal.set(false)">Cancelar</button>
                <button class="btn btn-danger" (click)="confirmModalConfig().onConfirm()">{{ confirmModalConfig().confirmText }}</button>
              </div>
            </div>
          </div>
        }
"""
content = re.sub(r'(</main>\s*</div>\s*</div>)', confirm_modal_html + r'\n\1', content)

# 3. Add Signals
signals = """  // Edit Mode & Confirm Modals
  editandoAulaId = signal<string | null>(null);
  editandoPublicacionId = signal<string | null>(null);
  showConfirmModal = signal(false);
  confirmModalConfig = signal({ title: '', message: '', confirmText: 'Confirmar', onConfirm: () => {} });
"""
content = re.sub(r'(  isSaving = signal\(false\);)', signals + r'\n\1', content)

# 4. Modify eliminar methods to use modal
content = re.sub(r'  eliminarAula\(aula: any, event: Event\) \{[\s\S]*?\}\n  \}', """  eliminarAula(aula: any, event: Event) {
    event.stopPropagation();
    this.confirmModalConfig.set({
      title: 'Eliminar Aula',
      message: '¿Está seguro de eliminar esta aula? Se perderán todas sus publicaciones y tareas de forma permanente.',
      confirmText: 'Sí, eliminar',
      onConfirm: () => {
        this.showConfirmModal.set(false);
        this.api.delete(`lms/aulas/${aula.id}`).subscribe(() => {
          this.aulas.update(list => list.filter((a: any) => a.id !== aula.id));
          if (this.aulaSeleccionada()?.id === aula.id) {
            this.aulaSeleccionada.set(null);
            this.publicaciones.set([]);
          }
          this.toast.success('Eliminada', 'Aula eliminada correctamente.');
        });
      }
    });
    this.showConfirmModal.set(true);
  }""", content)

content = re.sub(r'  eliminarPublicacion\(post: any\) \{[\s\S]*?\}\n  \}', """  eliminarPublicacion(post: any) {
    const aulaId = this.aulaSeleccionada()?.id;
    if (!aulaId) return;
    this.confirmModalConfig.set({
      title: 'Eliminar Publicación',
      message: '¿Estás seguro de eliminar esta publicación del muro? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      onConfirm: () => {
        this.showConfirmModal.set(false);
        this.api.delete(`lms/aulas/${aulaId}/publicaciones/${post.id}`).subscribe(() => {
          this.publicaciones.update(list => list.filter((p: any) => p.id !== post.id));
          this.toast.success('Eliminada', 'Publicación eliminada.');
        });
      }
    });
    this.showConfirmModal.set(true);
  }""", content)

# 5. Modify Edit and Save Methods
new_methods = """  editarAula(aula: any, event: Event) {
    event.stopPropagation();
    this.editandoAulaId.set(aula.id);
    this.nuevaAula = { ...aula };
    this.modalCrearAula.set(true);
  }

  editarPublicacion(post: any) {
    this.editandoPublicacionId.set(post.id);
    this.nuevaPublicacion = { ...post };
    this.modalPublicacion.set(true);
  }
"""
content = re.sub(r'(  abrirModalCrearAula\(\) \{)', new_methods + r'\n\1', content)

# Update abrir modals to clear edit state
content = re.sub(r'abrirModalCrearAula\(\) \{', """abrirModalCrearAula() {
    this.editandoAulaId.set(null);""", content)
content = re.sub(r'abrirModalPublicacion\(\) \{', """abrirModalPublicacion() {
    this.editandoPublicacionId.set(null);""", content)

# Update guardarAula
guardar_aula_new = """  guardarAula() {
    if (!this.nuevaAula.nombre || !this.nuevaAula.descripcion) {
      this.toast.warning('Campos incompletos', 'Llene nombre y descripción.');
      return;
    }
    this.isSaving.set(true);
    const dto = {
      ...this.nuevaAula,
      cargaDocenteId: '99999999-9999-9999-9999-999999999999' // mock
    };

    const idToEdit = this.editandoAulaId();
    if (idToEdit) {
      this.api.put<any>(`lms/aulas/${idToEdit}`, dto).subscribe({
        next: (res) => {
          this.aulas.update(list => list.map(a => a.id === idToEdit ? { ...a, ...res } : a));
          this.modalCrearAula.set(false);
          this.isSaving.set(false);
          this.toast.success('Aula actualizada', 'El aula se actualizó correctamente.');
        },
        error: () => this.isSaving.set(false)
      });
    } else {
      this.api.post<any>('lms/aulas', dto).subscribe({
        next: (res) => {
          this.aulas.update(list => [res, ...list]);
          this.modalCrearAula.set(false);
          this.isSaving.set(false);
          this.toast.success('Aula creada', 'El aula se ha creado correctamente.');
        },
        error: () => this.isSaving.set(false)
      });
    }
  }"""
content = re.sub(r'  guardarAula\(\) \{[\s\S]*?\n  \}', guardar_aula_new, content)

# Update crearPostBackend to handle PUT
crear_post_backend_new = """  private crearPostBackend(aulaId: string) {
    const idToEdit = this.editandoPublicacionId();
    if (idToEdit) {
      this.api.put<any>(`lms/aulas/${aulaId}/publicaciones/${idToEdit}`, this.nuevaPublicacion).subscribe({
        next: (res) => {
          this.publicaciones.update(list => list.map(p => p.id === idToEdit ? { ...p, ...res } : p));
          this.modalPublicacion.set(false);
          this.isSaving.set(false);
          this.toast.success('Post actualizado', 'Tu post se ha actualizado.');
        },
        error: () => this.isSaving.set(false)
      });
    } else {
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
  }"""
content = re.sub(r'  private crearPostBackend\(aulaId: string\) \{[\s\S]*?\n  \}', crear_post_backend_new, content)

# Modify the Modal Titles
content = content.replace("<h3>Crear Nueva Aula Virtual</h3>", "<h3>{{ editandoAulaId() ? 'Editar Aula Virtual' : 'Crear Nueva Aula Virtual' }}</h3>")
content = content.replace("<h3>Publicar en el Muro</h3>", "<h3>{{ editandoPublicacionId() ? 'Editar Publicación' : 'Publicar en el Muro' }}</h3>")
content = content.replace("<span>Publicar en Muro</span>", "<span>{{ editandoPublicacionId() ? 'Guardar Cambios' : 'Publicar en Muro' }}</span>")

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
