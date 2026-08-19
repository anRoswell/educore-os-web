import sys
content = open('src/app/pages/academico/academico.component.ts').read()

new_btn = """
        <button (click)="abrirModalReglasSiee()" class="action-card-btn" title="Configurar las reglas de aprobación institucionales">
          <span class="ac-icon">⚖️</span>
          <div class="ac-text">
            <span class="ac-title">Reglas SIEE</span>
            <span class="ac-hint">Criterios de Promoción</span>
          </div>
        </button>
      </div>
"""
content = content.replace("      </div>\n\n      <!-- Filtros Académicos Dinámicos en Cascada -->", new_btn + "\n      <!-- Filtros Académicos Dinámicos en Cascada -->")

# Insert modal HTML before the last modal or at the end of the modals
modal_html = """
      <!-- ========================================== -->
      <!-- MODAL 8: REGLAS SIEE                       -->
      <!-- ========================================== -->
      @if (modalReglasSiee()) {
        <div class="modal-backdrop">
          <div class="modal-content animate-slide-up">
            <div class="modal-header">
              <h2>⚖️ Configuración SIEE (Promoción)</h2>
              <button class="close-btn" (click)="cerrarModalReglasSiee()"><lucide-angular [img]="XIcon" size="20"></lucide-angular></button>
            </div>
            
            <div class="modal-body">
              <div class="alert alert-info">
                <strong>¿Cuándo reprueba un estudiante el año?</strong><br>
                Defina los parámetros bajo los cuales el sistema determinará la reprobación automática al finalizar el año lectivo.
              </div>

              <div class="form-group mb-3">
                <label>Límite de Materias Perdidas</label>
                <input type="number" [(ngModel)]="reglaSiee.materiasReprobadasLimite" class="form-control" placeholder="Ej: 3">
                <small class="hint">Si pierde esta cantidad o más, reprueba el año directamente.</small>
              </div>

              <div class="form-group mb-3">
                <label>Nota Mínima de Aprobación</label>
                <input type="number" step="0.1" [(ngModel)]="reglaSiee.notaMinimaAprobacion" class="form-control" placeholder="Ej: 3.0">
                <small class="hint">La nota a partir de la cual el desempeño pasa de BAJO a BÁSICO.</small>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="cerrarModalReglasSiee()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarReglasSiee()">
                <lucide-angular [img]="SaveIcon" size="18" class="mr-2"></lucide-angular> Guardar Reglas
              </button>
            </div>
          </div>
        </div>
      }
"""
content = content.replace("      <!-- ========================================== -->\n      <!-- MODAL 7: CREAR ACTIVIDAD EVALUATIVA       -->", modal_html + "\n      <!-- ========================================== -->\n      <!-- MODAL 7: CREAR ACTIVIDAD EVALUATIVA       -->")

vars_str = """  readonly modalNuevaActividad = signal(false);
  readonly modalReglasSiee = signal(false);

  // Formularios DTOs
  reglaSiee = {
    materiasReprobadasLimite: 3,
    notaMinimaAprobacion: 3.0,
  };
"""
content = content.replace("  readonly modalNuevaActividad = signal(false);", vars_str)

methods_str = """
  // --- CRUD: REGLAS SIEE ---
  abrirModalReglasSiee() {
    this.api.get<any[]>('academico/siee/reglas').subscribe((reglas) => {
      if (reglas && reglas.length > 0) {
        this.reglaSiee.materiasReprobadasLimite = reglas[0].materiasReprobadasLimite || 3;
        this.reglaSiee.notaMinimaAprobacion = reglas[0].notaMinimaAprobacion || 3.0;
      }
      this.modalManager.open('reglasSiee');
      this.modalReglasSiee.set(true);
    });
  }

  cerrarModalReglasSiee() {
    this.modalManager.close('reglasSiee');
    this.modalReglasSiee.set(false);
  }

  guardarReglasSiee() {
    this.api.post<any>('academico/siee/reglas', this.reglaSiee).subscribe({
      next: (res) => {
        this.cerrarModalReglasSiee();
        this.toast.success('Reglas Guardadas', 'Las reglas de promoción han sido actualizadas.');
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message || 'No fue posible guardar las reglas SIEE.');
      },
    });
  }
"""

content = content.replace("  // --- CRUD: CREAR ACTIVIDAD EVALUATIVA ---", methods_str + "\n  // --- CRUD: CREAR ACTIVIDAD EVALUATIVA ---")

if "SaveIcon = Save" not in content:
  content = content.replace("X,", "X, Save,")
  content = content.replace("XIcon = X;", "XIcon = X;\n  SaveIcon = Save;")

with open('src/app/pages/academico/academico.component.ts', 'w') as f:
  f.write(content)
