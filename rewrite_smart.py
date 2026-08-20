import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# 1. ADD IMPORTS FOR STANDALONE TABS
imports_to_add = '''
import { TesoreriaFacturasComponent } from './tabs/tesoreria-facturas.component';
import { TesoreriaEstadoCuentaComponent } from './tabs/tesoreria-estado-cuenta.component';
import { TesoreriaRecaudosComponent } from './tabs/tesoreria-recaudos.component';
import { TesoreriaAcuerdosComponent } from './tabs/tesoreria-acuerdos.component';
import { TesoreriaReportesComponent } from './tabs/tesoreria-reportes.component';
import { ParametrosService, Parametro } from '../../core/services/parametros.service';
'''

if 'TesoreriaFacturasComponent' not in content:
    content = content.replace("import { HelpBadgeComponent }", imports_to_add + "\nimport { HelpBadgeComponent }")

# Add them to imports array
imports_arr = '''    ModalBecaComponent,
    TesoreriaFacturasComponent,
    TesoreriaEstadoCuentaComponent,
    TesoreriaRecaudosComponent,
    TesoreriaAcuerdosComponent,
    TesoreriaReportesComponent'''
content = content.replace("ModalBecaComponent", imports_arr)

# 2. REPLACE TABS IN HTML
facturas_tab = '''      @if (tabActiva() === 'facturas') {
        <app-tesoreria-facturas
          [cuentasFiltradas]="cuentasFiltradas()"
          [estadosCuentaList]="estadosCuentaList()"
          [mesesList]="mesesList()"
          [filtroTexto]="filtroTexto"
          [filtroEstado]="filtroEstado"
          [filtroMes]="filtroMes"
          (filtrar)="onFiltrarFacturas($event)"
          (verFicha360)="verFicha360($event)"
          (pagarWompi)="pagarWompi($event)"
          (pagarCaja)="abrirModalPagoDirecto($event)"
          (editarValor)="abrirModalEditarValor($event)"
          (anularFactura)="abrirModalAnular($event)"
          (verRecibo)="verRecibo.set($event)"
          (descargarPazYSalvo)="descargarPazYSalvoEstudiante($event)"
        />
      }'''

estudiante_tab = '''      @if (tabActiva() === 'estudiante') {
        <app-tesoreria-estado-cuenta
          [listaEstudiantes]="listaEstudiantes()"
          [estadosCuentaList]="estadosCuentaList()"
          [mesesList]="mesesList()"
          [mediosPagoList]="mediosPagoList()"
          [estudianteSeleccionado]="estudianteSeleccionado"
          [busquedaEstudiante]="busquedaEstudiante"
          [estadoCuentaEstudiante]="estadoCuentaEstudiante()"
          [cuentas]="cuentas()"
          [pagos]="pagos()"
          [desbloqueoExcepcional]="desbloqueoExcepcional()"
          (seleccionarEstudiante)="seleccionarEstudiante($event)"
          (abrirModalExtracto)="abrirModalExtracto()"
          (abrirModalBeca)="abrirModalBeca()"
          (toggleDesbloqueo)="toggleDesbloqueoExcepcional()"
          (enviarWhatsApp)="enviarRecordatorioWhatsApp()"
          (enviarEmail)="enviarEstadoCuentaEmail()"
          (abrirPazSalvo)="abrirModalPazSalvoCompleto()"
          (asignarCobro)="asignarCobroAEstudianteActual()"
          (pagarMes)="abrirModalPagoDirectoMes($event)"
          (editarMes)="abrirModalEditarMes($event)"
          (pagarWompi)="pagarMesEstudiante($event)"
          (verReciboMes)="verReciboMes($event)"
          (pagarWompiCargo)="pagarWompi($event)"
          (pagarCajaCargo)="abrirModalPagoDirecto($event)"
        />
      }'''

recaudos_tab = '''      @if (tabActiva() === 'recaudos') {
        <app-tesoreria-recaudos
          [pagos]="pagos()"
          [mediosPagoList]="mediosPagoList()"
          (abrirModalPagoManual)="abrirModalPagoManual()"
          (imprimirReciboIndividual)="reciboParaVer.set($event)"
        />
      }'''

acuerdos_tab = '''      @if (tabActiva() === 'acuerdos') {
        <app-tesoreria-acuerdos
          [acuerdos]="acuerdos()"
          (abrirModalNuevoAcuerdo)="abrirModalNuevoAcuerdo()"
          (verFicha)="verFicha360($event)"
        />
      }'''

reportes_tab = '''      @if (tabActiva() === 'reportes') {
        <app-tesoreria-reportes
          (exportarExcel)="exportarExcelSiigo()"
        />
      }'''

content = re.sub(r'@if \(tabActiva\(\) === \'facturas\'\) \{[\s\S]*?\}', facturas_tab, content, count=1)
content = re.sub(r'@if \(tabActiva\(\) === \'estudiante\'\) \{[\s\S]*?\}', estudiante_tab, content, count=1)
content = re.sub(r'@if \(tabActiva\(\) === \'recaudos\'\) \{[\s\S]*?\}', recaudos_tab, content, count=1)
content = re.sub(r'@if \(tabActiva\(\) === \'acuerdos\'\) \{[\s\S]*?\}', acuerdos_tab, content, count=1)
content = re.sub(r'@if \(tabActiva\(\) === \'reportes\'\) \{[\s\S]*?\}', reportes_tab, content, count=1)

# 3. Add parameters signals and load them
lists_signals = '''
  // Catálogos desde Backend
  private parametrosService = inject(ParametrosService);
  estadosCuentaList = signal<Parametro[]>([]);
  mesesList = signal<Parametro[]>([]);
  mediosPagoList = signal<Parametro[]>([]);

  // Filtros
  filtroTexto = signal('');
  filtroEstado = signal('TODOS');
  filtroMes = signal('TODOS');

  onFiltrarFacturas(event: any) {
    this.filtroTexto.set(event.texto);
    this.filtroEstado.set(event.estado);
    this.filtroMes.set(event.mes);
  }
'''
if 'estadosCuentaList' not in content:
    content = content.replace("export class TesoreriaComponent implements OnInit {", "export class TesoreriaComponent implements OnInit {\n" + lists_signals)

fetch_logic = '''
    // Fetch catalogs
    this.parametrosService.obtenerPorGrupo('ESTADOS_CUENTA').subscribe(res => this.estadosCuentaList.set(res));
    this.parametrosService.obtenerPorGrupo('MESES_ACADEMICOS').subscribe(res => this.mesesList.set(res));
    this.parametrosService.obtenerPorGrupo('MEDIOS_PAGO').subscribe(res => this.mediosPagoList.set(res));
'''
content = content.replace("this.cargarDatosBackend();", fetch_logic + "\n    this.cargarDatosBackend();")

# 4. Defensive check
content = content.replace('consultarEstadoCuentaApi(estudianteId: string) {', 'consultarEstadoCuentaApi(estudianteId: string) {\n    if (!estudianteId) return;')

# 5. ModalPagoManual binding
content = content.replace('<app-modal-pago-manual', '<app-modal-pago-manual\n          [mediosPagoList]="mediosPagoList()"')

# 6. Remove styles block
content = re.sub(r'styles:\s*\[`[\s\S]*?`\]', 'styles: []', content)

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
