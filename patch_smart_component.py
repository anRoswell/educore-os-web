import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# Remove standalone: true
content = content.replace("standalone: true,\n", "")

# Import inject, signal
if 'inject' not in content:
    content = content.replace("import { Component, OnInit", "import { Component, OnInit, inject, signal")

# Import ParametrosService
if 'ParametrosService' not in content:
    content = content.replace("import { EstadoCuenta", "import { ParametrosService, Parametro } from '../../core/services/parametros.service';\nimport { EstadoCuenta")

# Add lists signals to class
lists_signals = '''
  // Catálogos desde Backend
  private parametrosService = inject(ParametrosService);
  estadosCuentaList = signal<Parametro[]>([]);
  mesesList = signal<Parametro[]>([]);
  mediosPagoList = signal<Parametro[]>([]);
'''
if 'estadosCuentaList = signal' not in content:
    content = content.replace("export class TesoreriaComponent implements OnInit {", "export class TesoreriaComponent implements OnInit {\n" + lists_signals)

# Add fetch logic to ngOnInit
fetch_logic = '''
    // Fetch catalogs
    this.parametrosService.obtenerPorGrupo('ESTADOS_CUENTA').subscribe(res => this.estadosCuentaList.set(res));
    this.parametrosService.obtenerPorGrupo('MESES_ACADEMICOS').subscribe(res => this.mesesList.set(res));
    this.parametrosService.obtenerPorGrupo('MEDIOS_PAGO').subscribe(res => this.mediosPagoList.set(res));
'''
content = content.replace("this.cargarDatosBackend();", fetch_logic + "\n    this.cargarDatosBackend();")

# Update HTML bindings for Facturas
facturas_html = '''<app-tesoreria-facturas
          [cuentasFiltradas]="cuentasFiltradas()"
          [estadosCuentaList]="estadosCuentaList()"
          [mesesList]="mesesList()"
          [filtroTexto]="filtroTexto"'''
content = content.replace('<app-tesoreria-facturas\n          [cuentasFiltradas]="cuentasFiltradas()"\n          [filtroTexto]="filtroTexto"', facturas_html)

# Update HTML bindings for EstadoCuenta (Ficha)
estado_cuenta_html = '''<app-tesoreria-estado-cuenta
          [listaEstudiantes]="listaEstudiantes()"
          [estadosCuentaList]="estadosCuentaList()"
          [mesesList]="mesesList()"
          [mediosPagoList]="mediosPagoList()"'''
content = content.replace('<app-tesoreria-estado-cuenta\n          [listaEstudiantes]="listaEstudiantes()"', estado_cuenta_html)

# Update HTML bindings for Recaudos
recaudos_html = '''<app-tesoreria-recaudos
          [pagos]="pagos()"
          [mediosPagoList]="mediosPagoList()"'''
content = content.replace('<app-tesoreria-recaudos\n          [pagos]="pagos()"', recaudos_html)

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
