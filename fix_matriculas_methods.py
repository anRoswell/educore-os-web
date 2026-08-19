import sys

with open('src/app/pages/matriculas/matriculas.component.ts', 'r') as f:
    content = f.read()

signals = """
  // Plantillas Legales
  readonly modalPlantillas = signal(false);
  plantillaContrato = '';
  plantillaPagare = '';
"""
content = content.replace("  readonly modalRetiro = signal(false);", "  readonly modalRetiro = signal(false);\n" + signals)

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

idx = content.rfind('}')
content = content[:idx] + methods + '}'

with open('src/app/pages/matriculas/matriculas.component.ts', 'w') as f:
    f.write(content)

