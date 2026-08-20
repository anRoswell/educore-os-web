import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# 1. ADD IMPORTS
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


# 2. REPLACE THE ENTIRE TEMPLATE
new_template = '''template: `
    <div class="page-header">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1>Tesorería & Cartera</h1>
          <app-help-badge helpKey="MODULO_TESORERIA"></app-help-badge>
        </div>
        <p>Gestión de recaudo, control de morosidad, facturación electrónica y acuerdos de pago.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" (click)="abrirConfiguracionTesoreria()">
          <span>⚙️ Configuración</span>
        </button>
        <button class="btn btn-primary" (click)="generarCierreDiario()">
          <span>🔒 Cierre de Caja Diario</span>
        </button>
      </div>
    </div>

    <!-- KPIs Financieros -->
    <div class="kpi-summary-grid grid-cols-5 animate-fade-in">
      <div class="summary-card kpi-mini-card">
        <div class="status-indicator-dot green"></div>
        <div>
          <span class="label">Recaudo del Mes</span>
          <span class="value text-success">\$85.4M</span>
        </div>
      </div>
      <div class="summary-card kpi-mini-card">
        <div class="status-indicator-dot amber"></div>
        <div>
          <span class="label">Cartera Vencida</span>
          <span class="value text-warning">\$12.3M</span>
        </div>
      </div>
      <div class="summary-card kpi-mini-card">
        <div class="status-indicator-dot blue"></div>
        <div>
          <span class="label">Proyección Mes</span>
          <span class="value">\$115.0M</span>
        </div>
      </div>
      <div class="summary-card kpi-mini-card">
        <div class="status-indicator-dot red"></div>
        <div>
          <span class="label">Acuerdos Incumplidos</span>
          <span class="value text-danger">4</span>
        </div>
      </div>
      <div class="summary-card kpi-mini-card">
        <div class="status-indicator-dot green"></div>
        <div>
          <span class="label">Caja Actual</span>
          <span class="value">\$1.2M</span>
        </div>
      </div>
    </div>

    <!-- TABS NAVEGACIÓN -->
    <div class="tabs-container">
      <div class="tabs-nav-bar mt-4">
        <button 
          class="tab-btn" 
          [class.active]="tabActiva() === 'facturas'" 
          (click)="tabActiva.set('facturas')">
          🧾 Facturación y Cuentas de Cobro
          <span class="tab-count">{{ cuentasFiltradas().length }}</span>
        </button>
        <button 
          class="tab-btn" 
          [class.active]="tabActiva() === 'estudiante'" 
          (click)="tabActiva.set('estudiante')">
          👤 Ficha Financiera Estudiante
        </button>
        <button 
          class="tab-btn" 
          [class.active]="tabActiva() === 'recaudos'" 
          (click)="tabActiva.set('recaudos')">
          💵 Recaudos y Pagos
        </button>
        <button 
          class="tab-btn" 
          [class.active]="tabActiva() === 'acuerdos'" 
          (click)="tabActiva.set('acuerdos')">
          🤝 Acuerdos de Pago
        </button>
        <button 
          class="tab-btn" 
          [class.active]="tabActiva() === 'reportes'" 
          (click)="tabActiva.set('reportes')">
          📊 Reportes Contables
        </button>
      </div>
    </div>

    <div class="tab-content">
      @if (tabActiva() === 'facturas') {
        <app-tesoreria-facturas
          [cuentasFiltradas]="cuentasFiltradas()"
          [estadosCuentaList]="estadosCuentaList()"
          [mesesList]="mesesList()"
          [filtroTexto]="filtroTexto()"
          [filtroEstado]="filtroEstado()"
          [filtroMes]="filtroMes()"
          (filtrar)="onFiltrarFacturas($event)"
          (verFicha360)="verFicha360($event)"
          (pagarWompi)="pagarWompi($event)"
          (pagarCaja)="abrirModalPagoDirecto($event)"
          (editarValor)="abrirModalEditarValor($event)"
          (anularFactura)="abrirModalAnular($event)"
          (verRecibo)="verRecibo.set($event)"
          (descargarPazYSalvo)="descargarPazYSalvoEstudiante($event)"
        />
      }
      
      @if (tabActiva() === 'estudiante') {
        <app-tesoreria-estado-cuenta
          [listaEstudiantes]="listaEstudiantes()"
          [estadosCuentaList]="estadosCuentaList()"
          [mesesList]="mesesList()"
          [mediosPagoList]="mediosPagoList()"
          [estudianteSeleccionado]="estudianteSeleccionado()"
          [busquedaEstudiante]="busquedaEstudiante()"
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
      }

      @if (tabActiva() === 'recaudos') {
        <app-tesoreria-recaudos
          [pagos]="pagos()"
          [mediosPagoList]="mediosPagoList()"
          (abrirModalPagoManual)="abrirModalPagoManual()"
          (imprimirReciboIndividual)="reciboParaVer.set($event)"
        />
      }

      @if (tabActiva() === 'acuerdos') {
        <app-tesoreria-acuerdos
          [acuerdos]="acuerdos()"
          (abrirModalNuevoAcuerdo)="abrirModalNuevoAcuerdo()"
          (verFicha)="verFicha360($event)"
        />
      }

      @if (tabActiva() === 'reportes') {
        <app-tesoreria-reportes
          (exportarExcel)="exportarExcelSiigo()"
        />
      }
    </div>

    <!-- MODALES -->
    @if (checkoutModal()) {
      <app-modal-checkout-wompi
        [cuenta]="checkoutModal()"
        (cerrar)="cerrarModalCheckout()"
      />
    }

    @if (modalNuevoConcepto()) {
      <app-modal-nuevo-concepto (cerrar)="modalNuevoConcepto.set(false)" />
    }

    @if (modalNuevoCobro()) {
      <app-modal-nuevo-cobro
        [nuevoCobro]="nuevoCobro"
        (cerrar)="modalNuevoCobro.set(false)"
      />
    }

    @if (modalPagoManual()) {
      <app-modal-pago-manual
        [facturaParaPagar]="facturaParaPagar()"
        [mediosPagoList]="mediosPagoList()"
        (cerrar)="cerrarModalPagoManual()"
        (pagoRegistrado)="confirmarPagoManual($event)"
      />
    }

    @if (modalNuevoAcuerdo()) {
      <app-modal-nuevo-acuerdo
        (cerrar)="modalNuevoAcuerdo.set(false)"
      />
    }

    @if (extractoModal()) {
      <div class="modal-backdrop z-top">
        <div class="modal-card modal-sm animate-fade-in-up">
          <div class="modal-header">
            <h3>Generar Extracto Consolidado</h3>
            <button class="close-btn" (click)="extractoModal.set(false)">&times;</button>
          </div>
          <p class="text-sm text-slate-600 mb-4">Se generará un documento PDF con los movimientos de cartera seleccionados.</p>
          <div class="flex justify-end gap-2 mt-4">
            <button class="btn btn-outline" (click)="extractoModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="extractoModal.set(false)">📄 Descargar PDF</button>
          </div>
        </div>
      </div>
    }

    @if (pazSalvoModal()) {
      <app-modal-paz-y-salvo
        [estudiante]="estudianteSeleccionado()"
        [saldoTotal]="estadoCuentaEstudiante().saldoPendienteTotal"
        (cerrar)="pazSalvoModal.set(false)"
        (descargar)="descargarPazYSalvoEstudiante($event)"
      />
    }

    @if (facturaEnEdicion()) {
      <app-modal-editar-factura
        [factura]="facturaEnEdicion()"
        (cerrar)="facturaEnEdicion.set(null)"
        (guardar)="guardarEdicionFactura($event)"
      />
    }

    @if (facturaParaAnular()) {
      <app-modal-anular-factura
        [factura]="facturaParaAnular()"
        (cerrar)="facturaParaAnular.set(null)"
        (confirmar)="confirmarAnulacion($event)"
      />
    }

    @if (modalBeca()) {
      <app-modal-beca
        [estudiante]="estudianteSeleccionado()"
        [becaActual]="becaActual()"
        (cerrar)="modalBeca.set(false)"
        (guardar)="guardarBecaEstudiante($event)"
      />
    }

    @if (reciboParaVer()) {
      <div class="modal-backdrop z-top">
        <div class="modal-card modal-md animate-fade-in-up">
          <div class="modal-header">
            <h3>Recibo de Caja {{ reciboParaVer()?.numeroRecibo }}</h3>
            <button class="close-btn" (click)="reciboParaVer.set(null)">&times;</button>
          </div>
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center mb-4">
            <p class="text-sm text-slate-500 mb-1">Valor Pagado</p>
            <h2 class="text-2xl font-bold text-slate-800">\${{ reciboParaVer()?.valorPagado | number }} COP</h2>
            <p class="text-xs text-success font-bold mt-2">Transacción Aprobada - {{ reciboParaVer()?.medioPago }}</p>
          </div>
          <div class="flex justify-end gap-2">
            <button class="btn btn-outline" (click)="reciboParaVer.set(null)">Cerrar</button>
            <button class="btn btn-primary">🖨️ Imprimir Copia</button>
          </div>
        </div>
      </div>
    }
  `'''

content = re.sub(r'template:\s*`[\s\S]*?`,\n\s*styles:\s*\[', new_template + ',\n  styles: [', content)


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

# 5. Remove styles block safely
content = re.sub(r'styles:\s*\[`[\s\S]*?`\]', 'styles: []', content)


# Remove inline models because they were moved to tesoreria.models.ts
interfaces_to_remove = r'(export interface CuentaCobroItem[\s\S]*?\}|export interface PagoRecaudoItem[\s\S]*?\}|export interface AcuerdoPagoItem[\s\S]*?\}|export interface EstudianteFinanciero[\s\S]*?\})'
content = re.sub(interfaces_to_remove, '', content)

# Add imports for models
content = content.replace("import { Parametro } from '../../core/services/parametros.service';", "import { Parametro } from '../../core/services/parametros.service';\nimport { CuentaCobroItem, PagoRecaudoItem, AcuerdoPagoItem, EstudianteFinanciero, EstadoCuenta, MedioPago, EstadoPago, EstadoAcuerdo } from './models/tesoreria.models';")

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
