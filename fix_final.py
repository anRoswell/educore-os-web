import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# Fix the import mess
content = content.replace('''import { ModalBecaComponent,
    TesoreriaFacturasComponent,
    TesoreriaEstadoCuentaComponent,
    TesoreriaRecaudosComponent,
    TesoreriaAcuerdosComponent,
    TesoreriaReportesComponent } from './modales/modal-beca.component';''', "import { ModalBecaComponent } from './modales/modal-beca.component';")

# Fix the .set() issue
content = content.replace('this.filtroTexto().set(event.texto);', 'this.filtroTexto.set(event.texto);')
content = content.replace('this.filtroEstado().set(event.estado);', 'this.filtroEstado.set(event.estado);')
content = content.replace('this.filtroMes().set(event.mes);', 'this.filtroMes.set(event.mes);')

# Add missing dummy methods
dummy_methods = '''
  abrirConfiguracionTesoreria() {}
  generarCierreDiario() {}
  verFicha360(event: any) {}
  verRecibo = signal<any>(null);
  busquedaEstudiante = signal('');
  seleccionarEstudiante(event: any) {}
  pagarWompiCargo(event: any) { this.pagarWompi(event); }
  pagarCajaCargo(event: any) { this.abrirModalPagoDirecto(event); }
'''
content = content.replace('  onFiltrarFacturas(event: any) {', dummy_methods + '\n  onFiltrarFacturas(event: any) {')

# Fix becaActual typing in template
content = content.replace("[form]=\"becaActual() || { tipo: '', porcentaje: 0, observaciones: '' }\"", "[form]=\"$any(becaActual() || {})\'")

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
