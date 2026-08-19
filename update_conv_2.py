import sys

with open('src/app/pages/convivencia/convivencia.component.ts', 'r') as f:
    content = f.read()

# 1. Add variable to track config
config_str = """  readonly modalNuevaActa = signal(false);
  readonly modalConfiguracion = signal(false);

  // Settings state
  colegioSettings = {
    id: '',
    notificacionesDisciplinariasAuto: false
  };

"""
content = content.replace("  readonly modalNuevaActa = signal(false);\n", config_str)

# 2. Add methods
methods_str = """
  // --- CONFIGURACIÓN ---
  abrirModalConfiguracion() {
    this.api.get<any>('tenants/current').subscribe({
      next: (col) => {
        this.colegioSettings.id = col.id;
        this.colegioSettings.notificacionesDisciplinariasAuto = col.notificacionesDisciplinariasAuto || false;
        this.modalManager.open('configuracionConvivencia');
        this.modalConfiguracion.set(true);
      }
    });
  }

  cerrarModalConfiguracion() {
    this.modalManager.close('configuracionConvivencia');
    this.modalConfiguracion.set(false);
  }

  guardarConfiguracion() {
    this.api.patch<any>(`tenants/${this.colegioSettings.id}`, { notificacionesDisciplinariasAuto: this.colegioSettings.notificacionesDisciplinariasAuto }).subscribe({
      next: () => {
        this.toast.success('Ajustes guardados', 'La configuración de notificaciones automáticas ha sido actualizada.');
        this.cerrarModalConfiguracion();
      },
      error: () => {
        this.toast.error('Error', 'No fue posible guardar la configuración.');
      }
    });
  }

  // --- ENVIO A DEMANDA ---
  reenviarNotificacion(casoId: string) {
    if (confirm('¿Deseas reenviar la notificación al acudiente? Se dejará registro de auditoría.')) {
      this.toast.info('Enviando...', 'Despachando correo al acudiente.');
      this.api.post<any>(`convivencia/faltas/${casoId}/notificar-acudiente`, { ejecutadoPor: this.authService.currentUser()?.id }).subscribe({
        next: (res) => {
          this.toast.success('Enviado', 'La notificación fue enviada exitosamente.');
        },
        error: () => {
          this.toast.error('Error', 'Fallo al enviar la notificación.');
        }
      });
    }
  }

"""
content = content.replace("  abrirModalNuevoCaso() {", methods_str + "  abrirModalNuevoCaso() {")


# 3. Add Config button next to other buttons
btn_html = """
          <button (click)="abrirModalConfiguracion()" class="btn btn-outline" title="Ajustes de Notificaciones Disciplinarias">
            ⚙️ Ajustes
          </button>
"""
content = content.replace("          <button (click)=\"abrirModalNuevaActa()\" class=\"btn btn-secondary\" title=\"Crear acta de sesión del Comité de Convivencia\">\n            📝 Nueva Sesión Comité\n          </button>", "          <button (click)=\"abrirModalNuevaActa()\" class=\"btn btn-secondary\" title=\"Crear acta de sesión del Comité de Convivencia\">\n            📝 Nueva Sesión Comité\n          </button>\n" + btn_html)

# 4. Add "Enviar a demanda" button in the table actions
reenviar_html = """                        @if (caso.tipo_falta === 'TIPO_II' || caso.tipo_falta === 'TIPO_III') {
                          <button (click)="reenviarNotificacion(caso.id)" class="btn-action" title="Reenviar Notificación a Acudiente" style="color: #6366f1;">
                            ✉️ Reenviar Notificación
                          </button>
                        }"""
content = content.replace("                        <button (click)=\"abrirModalDescargos(caso)\" class=\"btn-action btn-edit\" title=\"Radicar descargos y evidencias\">\n                          ✍️ Descargos\n                        </button>", "                        <button (click)=\"abrirModalDescargos(caso)\" class=\"btn-action btn-edit\" title=\"Radicar descargos y evidencias\">\n                          ✍️ Descargos\n                        </button>\n" + reenviar_html)


# 5. Add config modal HTML
modal_html = """
      <!-- ========================================== -->
      <!-- MODAL 6: CONFIGURACIÓN CONVIVENCIA         -->
      <!-- ========================================== -->
      @if (modalConfiguracion()) {
        <div class="modal-backdrop">
          <div class="modal-content animate-slide-up">
            <div class="modal-header">
              <h2>⚙️ Configuración de Convivencia</h2>
              <button class="close-btn" (click)="cerrarModalConfiguracion()">X</button>
            </div>
            <div class="modal-body">
              <div class="alert alert-info">
                Parametrice el comportamiento del módulo disciplinario para toda la institución.
              </div>

              <div class="form-group mb-4">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                  <input type="checkbox" [(ngModel)]="colegioSettings.notificacionesDisciplinariasAuto" style="width: 20px; height: 20px;">
                  <strong>Activar Notificaciones Automáticas</strong>
                </label>
                <small class="hint" style="display: block; margin-top: 5px; margin-left: 30px;">
                  Si está activo, el sistema enviará un email al acudiente automáticamente cada vez que un docente registre una falta TIPO II (Grave) o TIPO III (Gravísima).
                </small>
              </div>

            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="cerrarModalConfiguracion()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarConfiguracion()">
                💾 Guardar Ajustes
              </button>
            </div>
          </div>
        </div>
      }
"""
content = content.replace("      <!-- MODAL 5: INFORME MATRIZ OFICIAL SIUCE (MEN)        -->", "      <!-- MODAL 5: INFORME MATRIZ OFICIAL SIUCE (MEN)        -->\n" + modal_html)

with open('src/app/pages/convivencia/convivencia.component.ts', 'w') as f:
    f.write(content)
