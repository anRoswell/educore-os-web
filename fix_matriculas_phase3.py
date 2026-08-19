import sys

with open('src/app/pages/matriculas/matriculas.component.ts', 'r') as f:
    content = f.read()

# 1. Add Plantillas button
btn_html = """
          <button (click)="abrirModalPlantillas()" class="btn btn-outline" style="margin-right: 10px;">
            <span>⚙️ Plantillas Legales</span>
          </button>
"""
content = content.replace("<button (click)=\"exportarSimat()\" class=\"btn btn-secondary\">", btn_html + "          <button (click)=\"exportarSimat()\" class=\"btn btn-secondary\">")

# 2. Add Enviar a Firma Button in the table actions
# Find the table rows where it has actions
action_html = """
                  @if (est.estado === 'PREMATRICULA' || est.estado === 'RENOVACION' || est.estado === 'PENDIENTE') {
                    <button class="btn-icon" title="Enviar Contrato a Firma" (click)="enviarAFirma(est.id)">
                      ✉️
                    </button>
                  }
"""
content = content.replace("                  <button class=\"btn-icon text-danger\" title=\"Registrar Retiro / Novedad SIMAT\" (click)=\"abrirModalRetiro(est)\">", action_html + "                  <button class=\"btn-icon text-danger\" title=\"Registrar Retiro / Novedad SIMAT\" (click)=\"abrirModalRetiro(est)\">")


# 3. Add Modal variables and properties
signals = """
  // Plantillas Legales
  readonly modalPlantillas = signal(false);
  plantillaContrato = '';
  plantillaPagare = '';
"""
content = content.replace("  readonly modalRetiro = signal(false);", "  readonly modalRetiro = signal(false);\n" + signals)


# 4. Add Methods for Plantillas and Enviar a Firma
methods = """
  // --- PLANTILLAS LEGALES (Phase 3) ---
  abrirModalPlantillas() {
    this.api.get<any[]>('matriculas/plantillas-legales').subscribe({
      next: (plantillas) => {
        const contrato = plantillas.find(p => p.tipo === 'CONTRATO_PRESTACION_SERVICIOS');
        const pagare = plantillas.find(p => p.tipo === 'PAGARE');
        this.plantillaContrato = contrato ? contrato.plantillaEjs : '<h1>Contrato de Prestación de Servicios</h1>\\n<p>Acudiente: <%= acudienteNombre %></p>';
        this.plantillaPagare = pagare ? pagare.plantillaEjs : '<h1>Pagaré</h1>';
        this.modalPlantillas.set(true);
      }
    });
  }

  cerrarModalPlantillas() {
    this.modalPlantillas.set(false);
  }

  guardarPlantillas() {
    this.api.put('matriculas/plantillas-legales', { tipo: 'CONTRATO_PRESTACION_SERVICIOS', plantillaEjs: this.plantillaContrato }).subscribe();
    this.api.put('matriculas/plantillas-legales', { tipo: 'PAGARE', plantillaEjs: this.plantillaPagare }).subscribe({
      next: () => {
        this.toast.success('Guardado', 'Las plantillas legales han sido actualizadas.');
        this.cerrarModalPlantillas();
      }
    });
  }

  // --- ENVIAR A FIRMA ---
  enviarAFirma(matriculaId: string) {
    if(confirm('¿Desea despachar el código OTP al acudiente para firmar el contrato?')) {
      this.toast.info('Procesando', 'Generando documentos y enviando email...');
      this.api.post<any>(`matriculas/${matriculaId}/enviar-firma`, {}).subscribe({
        next: (res) => {
          this.toast.success('Enviado', res.mensaje);
        },
        error: () => this.toast.error('Error', 'Fallo al procesar el contrato.')
      });
    }
  }

"""
content = content.replace("  // ==========================================", methods + "\n  // ==========================================")

# 5. Add Modal HTML
modal_html = """
      <!-- ========================================== -->
      <!-- MODAL: PLANTILLAS LEGALES EJS              -->
      <!-- ========================================== -->
      @if (modalPlantillas()) {
        <div class="modal-backdrop">
          <div class="modal-content modal-lg animate-slide-up">
            <div class="modal-header">
              <h2>⚖️ Editor de Plantillas Legales</h2>
              <button class="close-btn" (click)="cerrarModalPlantillas()">X</button>
            </div>
            <div class="modal-body">
              <div class="alert alert-info">
                Use variables EJS como <code><%= estudianteNombre %></code>, <code><%= acudienteNombre %></code> o <code><%= valorMatricula %></code>.
              </div>
              <div class="form-group mb-3">
                <label>Plantilla del Contrato de Prestación de Servicios</label>
                <textarea class="form-control" rows="8" [(ngModel)]="plantillaContrato"></textarea>
              </div>
              <div class="form-group mb-3">
                <label>Plantilla del Pagaré (Deuda Financiera)</label>
                <textarea class="form-control" rows="6" [(ngModel)]="plantillaPagare"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="cerrarModalPlantillas()">Cancelar</button>
              <button class="btn btn-primary" (click)="guardarPlantillas()">💾 Guardar Plantillas</button>
            </div>
          </div>
        </div>
      }
"""
content = content.replace("    </div>\n  `,\n  styles:", modal_html + "    </div>\n  `,\n  styles:")


with open('src/app/pages/matriculas/matriculas.component.ts', 'w') as f:
    f.write(content)

