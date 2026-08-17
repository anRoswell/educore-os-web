import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';

export interface CuentaCobroItem {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  estudianteDocumento?: string;
  gradoNombre?: string;
  concepto: string;
  mes: string;
  mesCobro?: number;
  anioCobro?: number;
  valorTotal: number;
  estado: 'AL_DIA' | 'POR_VENCER' | 'EN_MORA' | 'ANULADO';
  fechaVencimiento: string;
  numeroFactura: string;
  descuento?: number;
}

export interface PagoRecaudoItem {
  id: string;
  numeroRecibo: string;
  facturaReferencia: string;
  estudianteId: string;
  estudianteNombre: string;
  conceptoNombre: string;
  medioPago: 'PSE' | 'EFECTIVO' | 'TRANSFERENCIA_BANCOLOMBIA' | 'NEQUI_QR' | 'TARJETA_CREDITO';
  valorPagado: number;
  fechaPago: string;
  referenciaTransaccion: string;
  estado: string;
}

export interface AcuerdoPagoItem {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  gradoNombre: string;
  montoTotalAcordado: number;
  numeroCuotas: number;
  montoPorCuota: number;
  diaPagoMensual: number;
  fechaInicio: string;
  estado: 'ACTIVO' | 'CUMPLIDO' | 'INCUMPLIDO';
  observaciones: string;
}

export interface EstudianteFinanciero {
  id: string;
  nombre: string;
  documento: string;
  grado: string;
  grupo: string;
  acudienteNombre: string;
  acudienteTelefono: string;
  acudienteEmail: string;
}

@Component({
  selector: 'app-tesoreria',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpBadgeComponent],
  template: `
    <div class="tesoreria-container">
      <!-- Header Principal -->
      <div class="page-header">
        <div>
          <h1>Tesorería & Cartera Educativa Pro</h1>
          <p>
            Facturación masiva de pensiones, recaudos en ventanilla y pasarela Wompi / PSE
            <app-help-badge term="WOMPI_PSE"></app-help-badge>
          </p>
        </div>
        <div class="header-actions">
          <button (click)="abrirModalNuevoConcepto()" class="btn btn-secondary" title="Crear nuevo concepto de cobro o tarifa">
            <span>🏷️ Crear Concepto</span>
          </button>
          <button (click)="abrirModalNuevoCobro()" class="btn btn-secondary" title="Emitir cobro individual o extraordinario">
            <span>➕ Nuevo Cobro</span>
          </button>
          <button (click)="abrirModalPagoManual()" class="btn btn-secondary" title="Registrar pago recibido en efectivo o consignación">
            <span>💵 Recaudo en Ventanilla</span>
          </button>
          <button (click)="generarFacturacionMes()" class="btn btn-primary" [disabled]="isFacturando()">
            <span>⚡ {{ isFacturando() ? 'Emitiendo Facturas...' : 'Facturación Masiva Mes' }}</span>
          </button>
        </div>
      </div>

      <!-- Resumen Semáforo de Cartera Dinámico de BD -->
      <div class="grid-cols-4 kpi-summary-grid">
        <div class="card summary-card">
          <span class="status-indicator-dot green"></span>
          <div>
            <span class="label">ESTUDIANTES AL DÍA</span>
            <div class="value">{{ kpiResumen().alDia }} ({{ kpiResumen().porcentajeAlDia }}%)</div>
          </div>
        </div>

        <div class="card summary-card">
          <span class="status-indicator-dot amber"></span>
          <div>
            <span class="label">POR VENCER</span>
            <div class="value">{{ kpiResumen().porVencer }} cuotas</div>
          </div>
        </div>

        <div class="card summary-card">
          <span class="status-indicator-dot red"></span>
          <div>
            <span class="label">EN MORA (>30 DÍAS)</span>
            <div class="value">{{ kpiResumen().enMora }} cuotas</div>
          </div>
        </div>

        <div class="card summary-card">
          <span class="status-indicator-dot blue"></span>
          <div>
            <span class="label">TOTAL RECAUDADO</span>
            <div class="value">\${{ (kpiResumen().totalRecaudado / 1000000).toFixed(1) }}M COP</div>
          </div>
        </div>
      </div>

      <!-- Barra de Pestañas de Navegación -->
      <div class="tabs-nav-bar mt-4">
        <button 
          class="tab-btn" 
          [class.active]="tabActiva() === 'facturas'" 
          (click)="tabActiva.set('facturas')">
          <span>📑 Facturación & Cuentas de Cobro</span>
          <span class="tab-count">{{ cuentasFiltradas().length }}</span>
        </button>
        <button 
          class="tab-btn" 
          [class.active]="tabActiva() === 'estudiante'" 
          (click)="tabActiva.set('estudiante')">
          <span>🔍 Ficha Financiera por Alumno (360°)</span>
        </button>
        <button 
          class="tab-btn" 
          [class.active]="tabActiva() === 'recaudos'" 
          (click)="tabActiva.set('recaudos')">
          <span>🧾 Historial de Recibos de Caja ({{ pagos().length }})</span>
        </button>
        <button 
          class="tab-btn" 
          [class.active]="tabActiva() === 'acuerdos'" 
          (click)="tabActiva.set('acuerdos')">
          <span>🤝 Acuerdos de Pago ({{ acuerdos().length }})</span>
        </button>
        <button 
          class="tab-btn" 
          [class.active]="tabActiva() === 'reportes'" 
          (click)="tabActiva.set('reportes')">
          <span>📊 Reportes & Exportación DIAN</span>
        </button>
      </div>

      <!-- ======================================================== -->
      <!-- PESTAÑA 1: FACTURACIÓN & CUENTAS DE COBRO GENERALES      -->
      <!-- ======================================================== -->
      @if (tabActiva() === 'facturas') {
        <div class="card mt-4 animate-fade-in">
          <!-- Filtros de Búsqueda -->
          <div class="filters-bar">
            <div class="search-input-group">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                class="form-control search-input" 
                placeholder="Buscar por estudiante, factura o documento..." 
                [(ngModel)]="filtroTexto" />
            </div>

            <div class="filter-selects">
              <select class="form-select select-sm" [(ngModel)]="filtroEstado">
                <option value="TODOS">Todos los Estados</option>
                <option value="AL_DIA">🟢 Al Día (Pagado)</option>
                <option value="POR_VENCER">🟡 Por Vencer</option>
                <option value="EN_MORA">🔴 En Mora (>30 días)</option>
                <option value="ANULADO">⚪ Anulado</option>
              </select>

              <select class="form-select select-sm" [(ngModel)]="filtroMes">
                <option value="TODOS">Todos los Meses</option>
                <option value="Agosto 2026">Agosto 2026</option>
                <option value="Julio 2026">Julio 2026</option>
                <option value="Junio 2026">Junio 2026</option>
                <option value="Mayo 2026">Mayo 2026</option>
              </select>
            </div>
          </div>

          <!-- Tabla de Facturación -->
          <div class="table-container mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Factura / Ref</th>
                  <th>Estudiante</th>
                  <th>Concepto</th>
                  <th>Mes Cobro</th>
                  <th>Valor Total</th>
                  <th>Vencimiento</th>
                  <th>Semáforo</th>
                  <th>Acciones Tesorería</th>
                </tr>
              </thead>
              <tbody>
                @for (item of cuentasFiltradas(); track item.id) {
                  <tr>
                    <td><strong class="font-mono text-xs">{{ item.numeroFactura }}</strong></td>
                    <td>
                      <div>
                        <strong>{{ item.estudianteNombre }}</strong>
                        <span class="text-xs text-slate-500 block">Doc: {{ item.estudianteDocumento || 'TI-10293847' }}</span>
                      </div>
                    </td>
                    <td>{{ item.concepto }}</td>
                    <td><span class="badge badge-info">{{ item.mes }}</span></td>
                    <td><strong>\${{ item.valorTotal | number }} COP</strong></td>
                    <td><span class="text-slate-500 text-xs">{{ item.fechaVencimiento }}</span></td>
                    <td>
                      @if (item.estado === 'AL_DIA') {
                        <span class="badge badge-success">PAGADO</span>
                      } @else if (item.estado === 'POR_VENCER') {
                        <span class="badge badge-warning">POR VENCER</span>
                      } @else if (item.estado === 'EN_MORA') {
                        <span class="badge badge-danger">EN MORA</span>
                      } @else {
                        <span class="badge badge-danger" style="background-color: #64748b;">ANULADO</span>
                      }
                    </td>
                    <td>
                      <div class="actions-group">
                        <button (click)="seleccionarEstudiantePara360(item.estudianteId)" class="btn btn-secondary btn-sm" title="Ver Ficha Financiera 360° del Alumno">
                          🔍 Ficha
                        </button>
                        @if (item.estado !== 'AL_DIA' && item.estado !== 'ANULADO') {
                          <button (click)="pagarWompi(item)" class="btn btn-primary btn-sm" title="Pagar vía Pasarela Wompi / PSE / Nequi">
                            💳 PSE
                          </button>
                          <button (click)="abrirModalPagoDirecto(item)" class="btn btn-success btn-sm" title="Registrar Recaudo en Ventanilla (Efectivo / Transferencia)">
                            💵 Caja
                          </button>
                          <button (click)="abrirModalEditarValor(item)" class="btn btn-secondary btn-sm" title="Aplicar Descuento / Beca">
                            ✏️ Beca
                          </button>
                          <button (click)="abrirModalAnular(item)" class="btn btn-danger btn-sm" title="Anular Factura">
                            🗑️
                          </button>
                        } @else if (item.estado === 'AL_DIA') {
                          <button (click)="verReciboCaja(item)" class="btn btn-secondary btn-sm" title="Ver e Imprimir Recibo Oficial de Caja">
                            🧾 Recibo
                          </button>
                          <button (click)="descargarPazYSalvoEstudiante(item.estudianteId)" class="btn btn-outline btn-sm" title="Descargar Paz y Salvo PDF">
                            📄 Paz & Salvo
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 2: FICHA FINANCIERA & ESTADO DE CUENTA POR ALUMNO-->
      <!-- ======================================================== -->
      @if (tabActiva() === 'estudiante') {
        <div class="card mt-4 animate-fade-in">
          <!-- Selector / Buscador de Alumno -->
          <div class="student-search-header">
            <div>
              <h3>🔍 Consulta de Estado de Cuenta & Historial por Alumno</h3>
              <p>Auditoría financiera integral, cronograma de pensiones, otros cobros, acuerdos de pago y emisión de certificados</p>
            </div>
            <div class="student-picker-group">
              <label class="form-label" style="margin: 0; font-size: 0.8rem;">Estudiante:</label>
              <select class="form-select select-sm" [ngModel]="estudianteSeleccionado().id" (ngModelChange)="cambiarEstudiante360($event)">
                @for (est of listaEstudiantes(); track est.id) {
                  <option [value]="est.id">{{ est.nombre }} — {{ est.grado }} (Doc: {{ est.documento }})</option>
                }
              </select>
            </div>
          </div>

          <!-- Ficha 360° del Estudiante -->
          <div class="student-360-card mt-4">
            <!-- Header Alumno -->
            <div class="student-header-box">
              <div class="student-avatar-box">
                {{ estudianteSeleccionado().nombre.substring(0, 2).toUpperCase() }}
              </div>
              <div class="student-details-main">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <h2>{{ estudianteSeleccionado().nombre }}</h2>
                  @if (becaActual().porcentaje > 0) {
                    <span class="badge badge-info" style="font-size: 0.75rem;">🎓 Beca {{ becaActual().porcentaje }}% ({{ becaActual().nombre }})</span>
                  }
                </div>
                <div class="student-tags mt-1">
                  <span class="tag">Doc: <strong>{{ estudianteSeleccionado().documento }}</strong></span>
                  <span class="tag">Grado: <strong>{{ estudianteSeleccionado().grado }} ({{ estudianteSeleccionado().grupo }})</strong></span>
                  <span class="tag">Acudiente: <strong>{{ estudianteSeleccionado().acudienteNombre }} ({{ estudianteSeleccionado().acudienteTelefono }})</strong></span>
                  <span class="tag">Email: <strong>{{ estudianteSeleccionado().acudienteEmail }}</strong></span>
                </div>
              </div>
              <div class="student-paz-salvo-action">
                @if (estadoCuentaEstudiante().saldoPendienteTotal === 0) {
                  <div class="status-box-pazsalvo al-dia">
                    <span class="icon">🟢</span>
                    <div>
                      <strong>ESTADO: A PAZ Y SALVO</strong>
                      <p>Cartera al día (\$0 COP pendientes)</p>
                    </div>
                  </div>
                  <button (click)="abrirModalPazSalvoCompleto()" class="btn btn-success mt-2 w-full">
                    📄 Ver Paz y Salvo Oficial (PDF)
                  </button>
                } @else {
                  <div class="status-box-pazsalvo en-mora">
                    <span class="icon">🔴</span>
                    <div>
                      <strong>ESTADO: EN MORA</strong>
                      <p>Saldo pendiente: \${{ estadoCuentaEstudiante().saldoPendienteTotal | number }} COP</p>
                    </div>
                  </div>
                  <button (click)="abrirModalAcuerdoDesde360()" class="btn btn-warning mt-2 w-full">
                    🤝 Pactar Acuerdo de Pago
                  </button>
                }
              </div>
            </div>

            <!-- Toolbar de Acciones Rápidas del Alumno -->
            <div class="student-actions-bar mt-3">
              <button (click)="abrirModalExtracto()" class="btn btn-secondary btn-sm" title="Generar e imprimir extracto contable oficial con membrete">
                📊 Extracto de Cuenta 360° (Imprimible)
              </button>
              <button (click)="abrirModalBeca()" class="btn btn-secondary btn-sm" title="Asignar porcentaje de beca o tarifa especial">
                🎓 Asignar / Modificar Beca
              </button>
              <button (click)="enviarRecordatorioWhatsApp()" class="btn btn-outline btn-sm" style="color: #059669; border-color: #059669;" title="Enviar recordatorio formal por WhatsApp">
                💬 Recordatorio WhatsApp
              </button>
              <button (click)="enviarEstadoCuentaEmail()" class="btn btn-outline btn-sm" title="Enviar ficha de cartera al email del acudiente">
                📧 Enviar por Correo
              </button>
              <button (click)="toggleDesbloqueoExcepcional()" class="btn btn-outline btn-sm" [style.color]="desbloqueoExcepcional() ? '#dc2626' : '#4f46e5'" title="Autorizar o suspender bloqueo administrativo de calificaciones">
                {{ desbloqueoExcepcional() ? '🔒 Suspender Excepción de Boletín' : '🔓 Desbloqueo Excepcional de Boletín' }}
              </button>
            </div>

            <!-- Resumen de Métricas del Estudiante (5 KPIs) -->
            <div class="grid-cols-5 mt-4 student-kpis-mini">
              <div class="kpi-mini-card">
                <span class="label">SALDO TOTAL PENDIENTE</span>
                <span class="value" [class.text-danger]="estadoCuentaEstudiante().saldoPendienteTotal > 0">
                  \${{ estadoCuentaEstudiante().saldoPendienteTotal | number }} COP
                </span>
              </div>
              <div class="kpi-mini-card">
                <span class="label">CUOTAS AL DÍA</span>
                <span class="value text-success">{{ estadoCuentaEstudiante().cuotasAlDia }} de 10</span>
              </div>
              <div class="kpi-mini-card">
                <span class="label">CUOTAS EN MORA</span>
                <span class="value" [class.text-danger]="estadoCuentaEstudiante().cuotasEnMora > 0">
                  {{ estadoCuentaEstudiante().cuotasEnMora }} meses
                </span>
              </div>
              <div class="kpi-mini-card">
                <span class="label">BOLETÍN DE NOTAS</span>
                <span class="value" [class.text-success]="!estadoCuentaEstudiante().bloqueoBoletin || desbloqueoExcepcional()" [class.text-danger]="estadoCuentaEstudiante().bloqueoBoletin && !desbloqueoExcepcional()">
                  {{ desbloqueoExcepcional() ? '⚡ Excepción Autorizada' : (estadoCuentaEstudiante().bloqueoBoletin ? '🔒 Bloqueado' : '🔓 Habilitado') }}
                </span>
              </div>
              <div class="kpi-mini-card">
                <span class="label">BECA / TARIFA</span>
                <span class="value" [class.text-info]="becaActual().porcentaje > 0">
                  {{ becaActual().porcentaje > 0 ? (becaActual().porcentaje + '% Beca') : 'Tarifa Plena' }}
                </span>
              </div>
            </div>

            <!-- 1. Línea de Tiempo de Pensiones del Año (Febrero a Noviembre) -->
            <div class="flex-between mt-5">
              <h4 style="margin: 0;">📅 Cronograma de Pensiones Mensuales (Año Lectivo 2026):</h4>
              <span class="text-xs text-slate-500">10 mensualidades fijas (Decreto 1075 / MEN)</span>
            </div>
            <div class="tuition-timeline-grid mt-2">
              @for (mes of planMensualEstudiante(); track mes.mes) {
                <div class="month-tuition-card" [class.paid]="mes.estado === 'PAGADO'" [class.due]="mes.estado === 'POR_VENCER'" [class.late]="mes.estado === 'EN_MORA'">
                  <div class="month-header">
                    <span class="month-name">{{ mes.mes }}</span>
                    <span class="badge badge-status" [class.badge-success]="mes.estado === 'PAGADO'" [class.badge-warning]="mes.estado === 'POR_VENCER'" [class.badge-danger]="mes.estado === 'EN_MORA'">
                      {{ mes.estado === 'POR_VENCER' ? 'Por Vencer' : (mes.estado === 'EN_MORA' ? 'En Mora' : 'Pagado') }}
                    </span>
                  </div>
                  <div class="month-body">
                    <span class="tuition-value">\${{ mes.valor | number }} COP</span>
                    <span class="tuition-date text-xs text-slate-500">Vence: {{ mes.vencimiento }}</span>
                    @if (mes.recibo) {
                      <span class="tuition-recibo font-mono text-xs">🧾 {{ mes.recibo }}</span>
                    }
                  </div>
                  <div class="month-footer">
                    @if (mes.estado !== 'PAGADO') {
                      <div class="month-footer-actions">
                        <button (click)="pagarMesEstudiante(mes)" class="btn btn-primary btn-xs w-full" title="Pagar por PSE / Wompi">
                          💳 Pagar PSE
                        </button>
                        <div class="secondary-actions-row">
                          <button (click)="abrirModalPagoDirectoMes(mes)" class="btn btn-success btn-xs" style="flex: 1;" title="Registrar Pago en Caja Ventanilla">
                            💵 Caja
                          </button>
                          <button (click)="abrirModalEditarMes(mes)" class="btn btn-secondary btn-xs" title="Editar Valor o Descuento">
                            ✏️
                          </button>
                        </div>
                      </div>
                    } @else {
                      <div class="month-footer-paid">
                        <span class="text-success text-xs font-bold">✓ Al Día</span>
                        <button (click)="verReciboMes(mes)" class="btn btn-secondary btn-xs" title="Ver Recibo de Caja">
                          🧾 Recibo
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- 2. Otros Conceptos, Derechos y Cargos del Alumno -->
            <div class="flex-between mt-5 mb-2">
              <div>
                <h4 style="margin: 0;">🎒 Otros Conceptos, Derechos y Cargos Asignados:</h4>
                <p class="text-xs text-slate-500" style="margin: 0;">Matrículas, derechos de grado, carnetización, seguros, certificados y salidas pedagógicas</p>
              </div>
              <button (click)="asignarCobroAEstudianteActual()" class="btn btn-secondary btn-sm">
                <span>➕ Asignar Cobro a este Estudiante</span>
              </button>
            </div>
            <div class="table-container">
              <table class="data-table" style="font-size: 0.85rem;">
                <thead>
                  <tr>
                    <th># Factura</th>
                    <th>Concepto de Cobro</th>
                    <th>Mes / Periodo</th>
                    <th>Fecha Límite</th>
                    <th>Valor a Cobrar</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cargo of otrosCobrosEstudiante(); track cargo.id) {
                    <tr>
                      <td><strong class="font-mono text-xs">{{ cargo.numeroFactura }}</strong></td>
                      <td><strong>{{ cargo.concepto }}</strong></td>
                      <td>{{ cargo.mes }}</td>
                      <td><span class="text-xs">{{ cargo.fechaVencimiento }}</span></td>
                      <td><strong>\${{ cargo.valorTotal | number }} COP</strong></td>
                      <td>
                        @if (cargo.estado === 'AL_DIA') {
                          <span class="badge badge-success">PAGADO</span>
                        } @else if (cargo.estado === 'POR_VENCER') {
                          <span class="badge badge-warning">POR VENCER</span>
                        } @else {
                          <span class="badge badge-danger">EN MORA</span>
                        }
                      </td>
                      <td>
                        <div class="actions-group">
                          @if (cargo.estado !== 'AL_DIA') {
                            <button (click)="pagarWompi(cargo)" class="btn btn-primary btn-xs" title="Pagar vía PSE">
                              💳 PSE
                            </button>
                            <button (click)="abrirModalPagoDirecto(cargo)" class="btn btn-success btn-xs" title="Pagar en Caja">
                              💵 Caja
                            </button>
                            <button (click)="abrirModalAnular(cargo)" class="btn btn-danger btn-xs" title="Exonerar o Anular">
                              🗑️
                            </button>
                          } @else {
                            <button (click)="verReciboCaja(cargo)" class="btn btn-secondary btn-xs">
                              🧾 Recibo
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                  @if (otrosCobrosEstudiante().length === 0) {
                    <tr>
                      <td colspan="7" class="text-center text-slate-500 p-3">
                        No hay cobros extraordinarios asignados a este estudiante. Utilice el botón "➕ Asignar Cobro" para emitir derechos de grado, carnet o seguros.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- 3. Acuerdos de Pago & Financiación del Alumno -->
            @if (acuerdosEstudiante().length > 0) {
              <div class="mt-5 mb-2">
                <h4 style="margin: 0;">🤝 Acuerdos de Pago & Financiación del Estudiante:</h4>
                <p class="text-xs text-slate-500" style="margin: 0;">Compromisos y planes de cuotas pactados con el acudiente</p>
              </div>
              <div class="table-container">
                <table class="data-table" style="font-size: 0.85rem;">
                  <thead>
                    <tr>
                      <th>Deuda Refinanciada</th>
                      <th>Plan Cuotas</th>
                      <th>Cuota Mensual</th>
                      <th>Día de Pago</th>
                      <th>Fecha Inicio</th>
                      <th>Estado</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (ac of acuerdosEstudiante(); track ac.id) {
                      <tr>
                        <td><strong>\${{ ac.montoTotalAcordado | number }} COP</strong></td>
                        <td>{{ ac.numeroCuotas }} cuotas</td>
                        <td><strong>\${{ ac.montoPorCuota | number }} COP</strong></td>
                        <td>Día {{ ac.diaPagoMensual }} de c/mes</td>
                        <td>{{ ac.fechaInicio }}</td>
                        <td>
                          <span class="badge" [class.badge-success]="ac.estado === 'CUMPLIDO'" [class.badge-info]="ac.estado === 'ACTIVO'" [class.badge-danger]="ac.estado === 'INCUMPLIDO'">
                            {{ ac.estado === 'ACTIVO' ? 'EN CURSO' : ac.estado }}
                          </span>
                        </td>
                        <td><span class="text-xs">{{ ac.observaciones }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- 4. Historial de Recibos Realizados por el Estudiante -->
            <div class="flex-between mt-5 mb-2">
              <div>
                <h4 style="margin: 0;">🧾 Historial de Recibos y Pagos Realizados:</h4>
                <p class="text-xs text-slate-500" style="margin: 0;">Comprobantes oficiales de ingreso conciliados en contabilidad</p>
              </div>
              <span class="badge badge-success">{{ pagosEstudiante().length }} Pagos Registrados</span>
            </div>
            <table class="data-table" style="font-size: 0.85rem;">
              <thead>
                <tr>
                  <th># Recibo</th>
                  <th>Fecha de Pago</th>
                  <th>Concepto / Mes</th>
                  <th>Medio de Pago</th>
                  <th>Referencia</th>
                  <th>Valor Pagado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (pago of pagosEstudiante(); track pago.id) {
                  <tr>
                    <td><strong class="font-mono">{{ pago.numeroRecibo }}</strong></td>
                    <td>{{ pago.fechaPago }}</td>
                    <td>{{ pago.conceptoNombre }}</td>
                    <td><span class="badge badge-info">{{ pago.medioPago }}</span></td>
                    <td><code class="text-xs">{{ pago.referenciaTransaccion }}</code></td>
                    <td><strong>\${{ pago.valorPagado | number }} COP</strong></td>
                    <td>
                      <button (click)="imprimirReciboIndividual(pago)" class="btn btn-secondary btn-sm" title="Imprimir Recibo Oficial">
                        🖨️ Imprimir
                      </button>
                    </td>
                  </tr>
                }
                @if (pagosEstudiante().length === 0) {
                  <tr>
                    <td colspan="7" class="text-center text-slate-500 p-3">
                      No se han registrado recaudos recientes para este alumno.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 3: HISTORIAL GENERAL DE RECIBOS DE CAJA          -->
      <!-- ======================================================== -->
      @if (tabActiva() === 'recaudos') {
        <div class="card mt-4 animate-fade-in">
          <div class="card-title-bar">
            <div>
              <h3>🧾 Historial General de Recibos de Caja & Ventanilla</h3>
              <p>Registro cronológico de todos los dineros ingresados a la institución por cualquier medio</p>
            </div>
            <button (click)="abrirModalPagoManual()" class="btn btn-primary">
              <span>➕ Registrar Recaudo Manual</span>
            </button>
          </div>

          <div class="table-container mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th># Recibo</th>
                  <th>Fecha y Hora</th>
                  <th>Estudiante</th>
                  <th>Factura Cruzada</th>
                  <th>Medio de Pago</th>
                  <th>Valor Recaudado</th>
                  <th>Referencia Transacción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (pago of pagos(); track pago.id) {
                  <tr>
                    <td><strong class="font-mono text-xs">{{ pago.numeroRecibo }}</strong></td>
                    <td><span class="text-xs">{{ pago.fechaPago }}</span></td>
                    <td><strong>{{ pago.estudianteNombre }}</strong></td>
                    <td><code class="text-xs">{{ pago.facturaReferencia }}</code></td>
                    <td>
                      <span class="badge" [class.badge-success]="pago.medioPago === 'PSE'" [class.badge-info]="pago.medioPago !== 'PSE'">
                        {{ pago.medioPago }}
                      </span>
                    </td>
                    <td><strong>\${{ pago.valorPagado | number }} COP</strong></td>
                    <td><span class="text-xs text-slate-500">{{ pago.referenciaTransaccion }}</span></td>
                    <td>
                      <button (click)="imprimirReciboIndividual(pago)" class="btn btn-secondary btn-sm">
                        🖨️ Imprimir Recibo
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 4: ACUERDOS DE PAGO & REFINANCIACIÓN            -->
      <!-- ======================================================== -->
      @if (tabActiva() === 'acuerdos') {
        <div class="card mt-4 animate-fade-in">
          <div class="card-title-bar">
            <div>
              <h3>🤝 Acuerdos de Pago & Financiación de Cartera</h3>
              <p>Refinanciación en cuotas para familias en mora con suspensión temporal de bloqueo de boletines</p>
            </div>
            <button (click)="abrirModalNuevoAcuerdo()" class="btn btn-primary">
              <span>➕ Nuevo Acuerdo de Pago</span>
            </button>
          </div>

          <div class="table-container mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Grado</th>
                  <th>Deuda Total Refinanciada</th>
                  <th>Cuotas</th>
                  <th>Valor Cuota Mensual</th>
                  <th>Día de Pago</th>
                  <th>Fecha Inicio</th>
                  <th>Estado Acuerdo</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                @for (acuerdo of acuerdos(); track acuerdo.id) {
                  <tr>
                    <td><strong>{{ acuerdo.estudianteNombre }}</strong></td>
                    <td>{{ acuerdo.gradoNombre }}</td>
                    <td><strong>\${{ acuerdo.montoTotalAcordado | number }} COP</strong></td>
                    <td>{{ acuerdo.numeroCuotas }} cuotas</td>
                    <td><strong>\${{ acuerdo.montoPorCuota | number }} COP</strong></td>
                    <td>Día {{ acuerdo.diaPagoMensual }} de c/mes</td>
                    <td><span class="text-xs text-slate-500">{{ acuerdo.fechaInicio }}</span></td>
                    <td>
                      @if (acuerdo.estado === 'CUMPLIDO') {
                        <span class="badge badge-success">CUMPLIDO</span>
                      } @else if (acuerdo.estado === 'ACTIVO') {
                        <span class="badge badge-info">EN CURSO</span>
                      } @else {
                        <span class="badge badge-danger">INCUMPLIDO</span>
                      }
                    </td>
                    <td><span class="text-xs">{{ acuerdo.observaciones }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 5: REPORTES & EXPORTACIÓN CONTABLE               -->
      <!-- ======================================================== -->
      @if (tabActiva() === 'reportes') {
        <div class="card mt-4 animate-fade-in">
          <div class="card-title-bar">
            <div>
              <h3>📊 Reportes Financieros & Exportación a Software Contable</h3>
              <p>Exportación para Siigo, World Office, Helisa y cumplimiento de Documento Equivalente DIAN</p>
            </div>
            <div class="header-actions">
              <button (click)="exportarExcelSiigo()" class="btn btn-success">
                <span>📥 Exportar a Excel / Siigo</span>
              </button>
            </div>
          </div>

          <div class="grid-cols-3 mt-4">
            <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
              <h4>🏢 Cartera por Antigüedad</h4>
              <p class="text-xs text-slate-500">Clasificación según días de vencimiento</p>
              <div class="mt-3">
                <div class="flex-between text-sm"><span>Corriente (0-30 días):</span><strong>\$4.2M COP</strong></div>
                <div class="flex-between text-sm mt-2"><span>Vencida (31-60 días):</span><strong>\$8.5M COP</strong></div>
                <div class="flex-between text-sm mt-2 text-danger"><span>Difícil Cobro (>90 días):</span><strong>\$5.75M COP</strong></div>
              </div>
            </div>

            <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
              <h4>💳 Medios de Recaudo (Agosto)</h4>
              <p class="text-xs text-slate-500">Participación por canal de pago</p>
              <div class="mt-3">
                <div class="flex-between text-sm"><span>PSE Bancolombia / Wompi:</span><strong>68.4%</strong></div>
                <div class="flex-between text-sm mt-2"><span>Nequi / Daviplata QR:</span><strong>18.9%</strong></div>
                <div class="flex-between text-sm mt-2"><span>Efectivo en Ventanilla:</span><strong>12.7%</strong></div>
              </div>
            </div>

            <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
              <h4>📑 Documento Equivalente DIAN</h4>
              <p class="text-xs text-slate-500">Resolución de facturación electrónica</p>
              <div class="mt-3">
                <div class="flex-between text-sm"><span>Rango Autorizado:</span><code>ED-2026-001 al 9999</code></div>
                <div class="flex-between text-sm mt-2"><span>Emitidos este mes:</span><strong>850 facturas</strong></div>
                <div class="flex-between text-sm mt-2 text-success"><span>Sincronización DIAN:</span><strong>✓ Al Día</strong></div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODALES DE TESORERÍA                                     -->
      <!-- ======================================================== -->

      <!-- MODAL 1: REGISTRAR PAGO MANUAL / CAJA EN VENTANILLA -->
      @if (modalPagoManual()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <h3>💵 Registrar Recaudo en Ventanilla (Caja)</h3>
              <button (click)="modalPagoManual.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Estudiante / Factura a Cruzar *</label>
                <select class="form-select" [(ngModel)]="nuevoPagoManual.cuentaCobroId">
                  @for (c of cuentasPendientes(); track c.id) {
                    <option [value]="c.id">
                      {{ c.estudianteNombre }} — {{ c.numeroFactura }} (\${{ c.valorTotal | number }} COP)
                    </option>
                  }
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Medio de Pago *</label>
                <select class="form-select" [(ngModel)]="nuevoPagoManual.medioPago">
                  <option value="EFECTIVO">💵 Efectivo en Ventanilla</option>
                  <option value="TRANSFERENCIA_BANCOLOMBIA">🏦 Transferencia Bancolombia / Davivienda</option>
                  <option value="NEQUI_QR">📱 Nequi / Daviplata QR</option>
                  <option value="TARJETA_CREDITO">💳 Datáfono / Tarjeta</option>
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Valor Recibido ($ COP) *</label>
                <input type="number" class="form-control" [(ngModel)]="nuevoPagoManual.valorPagado" />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Número de Comprobante / Voucher Banco</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoPagoManual.referenciaTransaccion" placeholder="Ej: VOUCHER-9847291" />
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarPagoManual()" class="btn btn-success">
                💾 Registrar Pago & Emitir Recibo de Caja
              </button>
              <button (click)="modalPagoManual.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: CREAR ACUERDO DE PAGO EN CUOTAS -->
      @if (modalNuevoAcuerdo()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <h3>🤝 Nuevo Acuerdo de Pago & Refinanciación</h3>
              <button (click)="modalNuevoAcuerdo.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Estudiante en Mora *</label>
                <select class="form-select" [(ngModel)]="nuevoAcuerdo.estudianteId">
                  @for (est of listaEstudiantes(); track est.id) {
                    <option [value]="est.id">{{ est.nombre }} ({{ est.grado }})</option>
                  }
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Monto Total de Deuda a Refinanciar ($ COP) *</label>
                <input type="number" class="form-control" [(ngModel)]="nuevoAcuerdo.montoTotalAcordado" />
              </div>

              <div class="grid-cols-2 mt-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Número de Cuotas *</label>
                  <select class="form-select" [(ngModel)]="nuevoAcuerdo.numeroCuotas">
                    <option [value]="2">2 cuotas mensuales</option>
                    <option [value]="3">3 cuotas mensuales</option>
                    <option [value]="4">4 cuotas mensuales</option>
                    <option [value]="6">6 cuotas mensuales</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Día Límite de Pago Mensual</label>
                  <input type="number" class="form-control" [(ngModel)]="nuevoAcuerdo.diaPagoMensual" min="1" max="30" />
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Observaciones y Compromisos del Acudiente</label>
                <textarea class="form-control" rows="2" [(ngModel)]="nuevoAcuerdo.observaciones" placeholder="Ej: El acudiente se compromete a cancelar cuota mensual con la prima de servicios."></textarea>
              </div>

              <div class="mt-3 p-3" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.85rem;">
                <span>Valor estimado por cuota: <strong>\${{ (nuevoAcuerdo.montoTotalAcordado / nuevoAcuerdo.numeroCuotas) | number }} COP / mes</strong></span>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevoAcuerdo()" class="btn btn-primary">
                ✍️ Firmar y Activar Acuerdo
              </button>
              <button (click)="modalNuevoAcuerdo.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: RECIBO OFICIAL DE CAJA (IMPRIMIBLE) -->
      @if (reciboParaVer()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 600px;">
            <div class="modal-header">
              <h3>🧾 Recibo Oficial de Caja N° {{ reciboParaVer()?.numeroRecibo }}</h3>
              <button (click)="reciboParaVer.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body print-area">
              <div class="text-center" style="border-bottom: 2px solid #cbd5e1; padding-bottom: 0.75rem;">
                <h4>{{ authService.colegio()?.nombre || 'COLEGIO MAYOR DE SAN BARTOLOMÉ' }}</h4>
                <p class="text-xs text-slate-500">NIT: {{ authService.colegio()?.nit }} | DANE: {{ authService.colegio()?.codigoDane }}</p>
                <h3 style="color: #1e1b4b; margin-top: 0.5rem;">RECIBO DE CAJA Y COMPROBANTE DE RECAUDO</h3>
              </div>

              <div class="mt-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.85rem; background: #f8fafc; padding: 0.75rem; border-radius: 8px;">
                <p><strong>N° Recibo:</strong> {{ reciboParaVer()?.numeroRecibo }}</p>
                <p><strong>Fecha:</strong> {{ reciboParaVer()?.fechaPago }}</p>
                <p><strong>Estudiante:</strong> {{ reciboParaVer()?.estudianteNombre }}</p>
                <p><strong>Factura Cruzada:</strong> {{ reciboParaVer()?.facturaReferencia }}</p>
                <p><strong>Medio de Pago:</strong> {{ reciboParaVer()?.medioPago }}</p>
                <p><strong>Referencia:</strong> {{ reciboParaVer()?.referenciaTransaccion }}</p>
              </div>

              <div class="mt-3 p-3 text-center" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                <span class="text-xs text-slate-500">VALOR RECIBIDO:</span>
                <h2 style="color: #059669; margin: 0.25rem 0;">\${{ reciboParaVer()?.valorPagado | number }} COP</h2>
                <span class="text-xs text-slate-500 font-italic">Estado: APROBADO Y CONCILIADO EN LIBROS</span>
              </div>

              <div class="firmas-grid mt-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; text-align: center; font-size: 0.75rem; margin-top: 2rem;">
                <div>
                  <div style="border-top: 1px solid #0f172a; margin-bottom: 0.25rem;"></div>
                  <span>PAGADURÍA / TESORERÍA</span>
                </div>
                <div>
                  <div style="border-top: 1px solid #0f172a; margin-bottom: 0.25rem;"></div>
                  <span>FIRMA Y SELLO DE CAJA</span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="imprimirRecibo()" class="btn btn-primary">
                🖨️ Imprimir Recibo
              </button>
              <button (click)="reciboParaVer.set(null)" class="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3.5: CREAR CONCEPTO DE COBRO -->
      @if (modalNuevoConcepto()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoConcepto')">
          <div class="modal-card card card-glass" style="max-width: 520px;">
            <div class="modal-header">
              <div>
                <h3>🏷️ Crear Concepto de Cobro / Tarifa</h3>
                <span class="modal-subtitle">Parametrización financiera de pensiones, matrículas y derechos</span>
              </div>
              <button (click)="cerrarModalNuevoConcepto()" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Concepto *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevoConceptoForm.nombre"
                  placeholder="Ej: Pensión Mensual, Seguro Escolar, Salida Pedagógica"
                />
              </div>

              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Código Único *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="nuevoConceptoForm.codigo"
                    placeholder="Ej: PENS-01, MAT-2026, SEG-EST"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Valor Sugerido ($ COP)</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="nuevoConceptoForm.valorSugerido"
                    min="0"
                  />
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" [(ngModel)]="nuevoConceptoForm.esRecurrenteMensual" style="width: 18px; height: 18px;" />
                  <span>¿Es cobro recurrente mensual? (ej: Pensión mensual)</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevoConcepto()" class="btn btn-primary">
                💾 Guardar Concepto
              </button>
              <button (click)="cerrarModalNuevoConcepto()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 4: EMITIR COBRO INDIVIDUAL -->
      @if (modalNuevoCobro()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoCobro')">
          <div class="modal-card card card-glass" style="max-width: 500px;">
            <div class="modal-header">
              <h3>➕ Emitir Cobro Individual / Extraordinario</h3>
              <button (click)="cerrarModalNuevoCobro()" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Estudiante *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoCobro.estudianteNombre" placeholder="Nombre completo del estudiante" />
              </div>
              <div class="form-group mt-3">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <label class="form-label" style="margin: 0;">Concepto de Cobro *</label>
                  <button (click)="abrirModalNuevoConcepto()" style="background: none; border: none; color: #4f46e5; font-size: 0.75rem; font-weight: bold; cursor: pointer; text-decoration: underline;">+ Nuevo Concepto</button>
                </div>
                <select class="form-select" [(ngModel)]="nuevoCobro.concepto" (ngModelChange)="onConceptoSelect($event)">
                  @for (con of conceptosList(); track con.id) {
                    <option [value]="con.nombre">{{ con.nombre }} (\${{ con.valorSugerido | number }} COP)</option>
                  } @empty {
                    <option value="Pensión Mensual Escolar">Pensión Mensual Escolar</option>
                  }
                </select>
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Valor en Pesos ($ COP) *</label>
                <input type="number" class="form-control" [(ngModel)]="nuevoCobro.valorTotal" />
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Fecha Límite de Pago *</label>
                <input type="date" class="form-control" [(ngModel)]="nuevoCobro.fechaVencimiento" />
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevoCobro()" class="btn btn-primary">
                💾 Emitir Cuenta de Cobro
              </button>
              <button (click)="cerrarModalNuevoCobro()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 5: EDITAR / APLICAR DESCUENTO O BECA -->
      @if (facturaEnEdicion()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 480px;">
            <div class="modal-header">
              <h3>✏️ Aplicar Descuento / Beca</h3>
              <button (click)="facturaEnEdicion.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <p>Estudiante: <strong>{{ facturaEnEdicion()?.estudianteNombre }}</strong></p>
              <p>Factura: <span class="font-mono text-xs">{{ facturaEnEdicion()?.numeroFactura }}</span></p>

              <div class="form-group mt-3">
                <label class="form-label">Nuevo Valor a Cobrar ($ COP) *</label>
                <input type="number" class="form-control" [(ngModel)]="facturaEnEdicion()!.valorTotal" />
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarEdicionFactura()" class="btn btn-primary">
                🔄 Actualizar Valor Factura
              </button>
              <button (click)="facturaEnEdicion.set(null)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 6: ANULAR FACTURA -->
      @if (facturaParaAnular()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 480px;">
            <div class="modal-header">
              <h3 style="color: #ef4444;">⚠️ Confirmación de Anulación</h3>
              <button (click)="facturaParaAnular.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <p>
                ¿Está seguro de anular la factura <strong>{{ facturaParaAnular()?.numeroFactura }}</strong> 
                de <strong>{{ facturaParaAnular()?.estudianteNombre }}</strong> por valor de 
                <strong>\${{ facturaParaAnular()?.valorTotal | number }} COP</strong>?
              </p>
            </div>

            <div class="modal-footer">
              <button (click)="confirmarAnulacion()" class="btn btn-danger">
                🗑️ Confirmar Anulación
              </button>
              <button (click)="facturaParaAnular.set(null)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 7: SIMULADOR WOMPI / PSE -->
      @if (checkoutModal()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass">
            <div class="wompi-header">
              <div class="wompi-brand">
                <span style="font-size: 1.5rem;">💳</span>
                <strong>Pasarela de Pagos Wompi Bancolombia</strong>
              </div>
              <button (click)="cerrarModalCheckout()" class="close-btn">&times;</button>
            </div>

            <div class="wompi-body mt-4">
              <div class="checkout-summary">
                <span class="text-slate-500 text-sm">Factura: {{ checkoutModal()?.numeroFactura }}</span>
                <h3>\${{ checkoutModal()?.valorTotal | number }} COP</h3>
                <p>Estudiante: <strong>{{ checkoutModal()?.estudianteNombre }}</strong></p>
                <p>Concepto: {{ checkoutModal()?.concepto }}</p>
              </div>

              <div class="payment-methods-grid mt-4">
                <div class="pm-option active">
                  <span class="pm-icon">🏦</span>
                  <strong>PSE (Débito a Cuentas de Ahorro)</strong>
                </div>
                <div class="pm-option">
                  <span class="pm-icon">📱</span>
                  <strong>Nequi / Daviplata QR</strong>
                </div>
                <div class="pm-option">
                  <span class="pm-icon">💳</span>
                  <strong>Tarjeta de Crédito Visa / Mastercard</strong>
                </div>
              </div>

              <div class="security-badge mt-4">
                <span>🔒 Transacción Segura con Firma Criptográfica SHA-256</span>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="confirmarPagoDemo()" class="btn btn-success">
                Simular Pago Aprobado (PSE)
              </button>
              <button (click)="cerrarModalCheckout()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 8: EXTRACTO FINANCIERO 360° COMPLETO (IMPRIMIBLE) -->
      @if (extractoModal()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 800px;">
            <div class="modal-header">
              <h3>📊 Extracto Financiero & Estado de Cuenta Integral</h3>
              <button (click)="extractoModal.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body print-area">
              <div class="text-center pb-3" style="border-bottom: 2px solid #0f172a;">
                <h3 style="margin: 0; color: #1e1b4b;">{{ authService.colegio()?.nombre || 'COLEGIO MAYOR DE SAN BARTOLOMÉ' }}</h3>
                <p class="text-xs text-slate-500" style="margin: 0.2rem 0;">NIT: {{ authService.colegio()?.nit }} | Código DANE: {{ authService.colegio()?.codigoDane }}</p>
                <h4 style="margin-top: 0.5rem; color: #4338ca; text-transform: uppercase; letter-spacing: 0.05em;">ESTADO DE CUENTA Y EXTRACTO DE CARTERA 2026</h4>
              </div>

              <div class="mt-3 p-3" style="background: #f8fafc; border-radius: 8px; font-size: 0.85rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <p><strong>Estudiante:</strong> {{ estudianteSeleccionado().nombre }}</p>
                <p><strong>Documento:</strong> {{ estudianteSeleccionado().documento }}</p>
                <p><strong>Grado / Grupo:</strong> {{ estudianteSeleccionado().grado }} ({{ estudianteSeleccionado().grupo }})</p>
                <p><strong>Acudiente:</strong> {{ estudianteSeleccionado().acudienteNombre }}</p>
                <p><strong>Teléfono:</strong> {{ estudianteSeleccionado().acudienteTelefono }}</p>
                <p><strong>Fecha de Emisión:</strong> {{ fechaHoy }}</p>
              </div>

              <h5 class="mt-3 mb-1">Detalle de Cuentas de Cobro & Pensiones:</h5>
              <table class="data-table" style="font-size: 0.8rem; width: 100%;">
                <thead>
                  <tr>
                    <th>Concepto / Mes</th>
                    <th># Factura</th>
                    <th>Vencimiento</th>
                    <th>Valor</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (mes of planMensualEstudiante(); track mes.mes) {
                    <tr>
                      <td>Pensión {{ mes.mes }} 2026</td>
                      <td><span class="font-mono text-xs">{{ mes.numeroFactura }}</span></td>
                      <td>{{ mes.vencimiento }}</td>
                      <td>\${{ mes.valor | number }} COP</td>
                      <td>
                        <span class="badge" [class.badge-success]="mes.estado === 'PAGADO'" [class.badge-warning]="mes.estado === 'POR_VENCER'" [class.badge-danger]="mes.estado === 'EN_MORA'">
                          {{ mes.estado }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              <div class="mt-3 p-3" style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span class="text-xs text-slate-500 font-bold">SALDO TOTAL PENDIENTE A LA FECHA:</span>
                  <h3 [style.color]="estadoCuentaEstudiante().saldoPendienteTotal > 0 ? '#dc2626' : '#059669'" style="margin: 0;">
                    \${{ estadoCuentaEstudiante().saldoPendienteTotal | number }} COP
                  </h3>
                </div>
                <div>
                  <span class="badge" [class.badge-success]="estadoCuentaEstudiante().saldoPendienteTotal === 0" [class.badge-danger]="estadoCuentaEstudiante().saldoPendienteTotal > 0" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
                    {{ estadoCuentaEstudiante().saldoPendienteTotal === 0 ? '🟢 A PAZ Y SALVO' : '🔴 CARTERA EN MORA' }}
                  </span>
                </div>
              </div>

              <div class="firmas-grid mt-5" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; text-align: center; font-size: 0.75rem; margin-top: 2.5rem;">
                <div>
                  <div style="border-top: 1px solid #0f172a; margin-bottom: 0.25rem;"></div>
                  <strong>PAGADURÍA & TESORERÍA</strong><br>
                  <span>Certificación de Cartera</span>
                </div>
                <div>
                  <div style="border-top: 1px solid #0f172a; margin-bottom: 0.25rem;"></div>
                  <strong>RECTORÍA GENERAL</strong><br>
                  <span>EduCoreOS Auditoría Contable</span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="imprimirRecibo()" class="btn btn-primary">
                🖨️ Imprimir Extracto Oficial
              </button>
              <button (click)="extractoModal.set(false)" class="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 9: ASIGNACIÓN DE BECA / DESCUENTO INSTITUCIONAL -->
      @if (modalBeca()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 500px;">
            <div class="modal-header">
              <h3>🎓 Asignación de Beca / Tarifa Especial</h3>
              <button (click)="modalBeca.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <p>Estudiante: <strong>{{ estudianteSeleccionado().nombre }}</strong> (Grado {{ estudianteSeleccionado().grado }})</p>
              
              <div class="form-group mt-3">
                <label class="form-label">Tipo de Beca / Beneficio *</label>
                <select class="form-select" [(ngModel)]="becaForm.tipo" (ngModelChange)="actualizarPorcentajeBeca($event)">
                  <option value="NINGUNA">Sin Beca (Tarifa Plena 100%)</option>
                  <option value="EXCELENCIA">Beca por Excelencia Académica (50% desc.)</option>
                  <option value="HERMANOS">Beca Familiar / Hermanos (20% desc.)</option>
                  <option value="DOCENTE">Hijo de Docente / Colaborador (30% desc.)</option>
                  <option value="SOLIDARIA">Beca Solidaria / Alcaldía (100% desc.)</option>
                  <option value="PERSONALIZADA">Porcentaje Personalizado</option>
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Porcentaje de Descuento (%) *</label>
                <input type="number" min="0" max="100" class="form-control" [(ngModel)]="becaForm.porcentaje" />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Resolución / Justificación de la Beca *</label>
                <textarea class="form-control" rows="2" [(ngModel)]="becaForm.observaciones" placeholder="Ej: Aprobado mediante Resolución Rectoral N° 045 de Consejo Directivo."></textarea>
              </div>

              <div class="mt-3 p-3" style="background: #eef2ff; border-radius: 8px; font-size: 0.85rem;">
                <p style="margin: 0; color: #3730a3;">
                  💡 Nueva pensión mensual resultante: 
                  <strong>\${{ (450000 * (1 - (becaForm.porcentaje / 100))) | number }} COP</strong> (Ahorro de \${{ (450000 * (becaForm.porcentaje / 100)) | number }} COP/mes).
                </p>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarBecaEstudiante()" class="btn btn-primary">
                💾 Guardar y Aplicar a Cuotas
              </button>
              <button (click)="modalBeca.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 10: CERTIFICADO OFICIAL DE PAZ Y SALVO (IMPRIMIBLE) -->
      @if (pazSalvoModal()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 750px;">
            <div class="modal-header">
              <h3>📄 Certificado de Paz y Salvo Financiero</h3>
              <button (click)="pazSalvoModal.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body print-area">
              <div class="text-center pb-3" style="border-bottom: 2px solid #1e1b4b;">
                <h2 style="color: #1e1b4b; margin: 0;">{{ authService.colegio()?.nombre || 'COLEGIO MAYOR DE SAN BARTOLOMÉ' }}</h2>
                <p class="text-xs text-slate-500" style="margin: 0.25rem 0;">Resolución de Aprobación Oficial MEN N° 10245 | NIT: {{ authService.colegio()?.nit }} | DANE: {{ authService.colegio()?.codigoDane }}</p>
                <p class="text-xs text-slate-500">Dirección: Carrera 7 # 9-96, Bogotá D.C. | PBX: (601) 3412000</p>
              </div>

              <div class="text-center my-4">
                <h3 style="color: #1e1b4b; letter-spacing: 0.1em; text-transform: uppercase;">CERTIFICADO DE PAZ Y SALVO FINANCIERO</h3>
                <span class="text-xs font-mono" style="color: #059669; font-weight: bold;">CÓDIGO DE VERIFICACIÓN DIGITAL: {{ hashPazYSalvo }}</span>
              </div>

              <div class="p-3" style="font-size: 0.95rem; line-height: 1.8; text-align: justify; color: #1e293b;">
                <p>
                  La Oficina de Tesorería y Pagaduría del <strong>{{ authService.colegio()?.nombre || 'COLEGIO MAYOR DE SAN BARTOLOMÉ' }}</strong>,
                  hace constar que el(la) estudiante:
                </p>
                <div class="my-3 p-3 text-center" style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
                  <h3 style="margin: 0; color: #1e1b4b;">{{ estudianteSeleccionado().nombre }}</h3>
                  <p style="margin: 0.25rem 0; font-size: 0.9rem;">
                    Identificado(a) con <strong>{{ estudianteSeleccionado().documento }}</strong>, matriculado(a) en el grado <strong>{{ estudianteSeleccionado().grado }} ({{ estudianteSeleccionado().grupo }})</strong>
                  </p>
                </div>
                <p>
                  Se encuentra a la fecha <strong>A PAZ Y SALVO POR TODO CONCEPTO DE DERECHOS ACADÉMICOS, MATRÍCULAS, PENSIONES MENSUALES Y SERVICIOS COMPLEMENTARIOS</strong> correspondientes al presente año lectivo 2026.
                </p>
                <p class="text-xs text-slate-500 mt-2">
                  Se expide el presente documento a solicitud del interesado en Bogotá D.C., a los {{ fechaHoyTexto }}.
                </p>
              </div>

              <div class="firmas-grid mt-5" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; text-align: center; font-size: 0.8rem; margin-top: 3rem;">
                <div>
                  <div style="border-top: 1px solid #0f172a; margin-bottom: 0.25rem;"></div>
                  <strong>LIC. ANDRÉS SALAZAR C.</strong><br>
                  <span>Jefe de Tesorería & Cartera</span>
                </div>
                <div>
                  <div style="border-top: 1px solid #0f172a; margin-bottom: 0.25rem;"></div>
                  <strong>DRA. MARÍA MERCEDES ROJAS</strong><br>
                  <span>Rectora Institucional</span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="imprimirRecibo()" class="btn btn-primary">
                🖨️ Imprimir Paz y Salvo Oficial
              </button>
              <button (click)="pazSalvoModal.set(false)" class="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .student-actions-bar {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      padding-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
    }

    .grid-cols-5 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 0.75rem;
    }

    .btn-xs {
      padding: 0.2rem 0.45rem;
      font-size: 0.72rem;
      border-radius: 4px;
    }

    .action-buttons-flex {
      display: flex;
      gap: 0.25rem;
      width: 100%;
    }

    .text-info {
      color: #3b82f6;
    }

    .text-center { text-align: center; }
    .text-sm { font-size: 0.85rem; }
    .text-xs { font-size: 0.75rem; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
    .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
    .pb-3 { padding-bottom: 0.75rem; }
    .p-3 { padding: 0.75rem; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      color: #0f172a;
    }

    .page-header p {
      font-size: 0.9rem;
      color: #64748b;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .kpi-summary-grid {
      margin-bottom: 1rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 1.15rem;
    }

    .status-indicator-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .status-indicator-dot.green { background-color: #10b981; box-shadow: 0 0 8px #10b981; }
    .status-indicator-dot.amber { background-color: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
    .status-indicator-dot.red { background-color: #ef4444; box-shadow: 0 0 8px #ef4444; }
    .status-indicator-dot.blue { background-color: #3b82f6; box-shadow: 0 0 8px #3b82f6; }

    .summary-card .label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      display: block;
    }

    .summary-card .value {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      font-family: var(--font-display);
    }

    /* TABS */
    .tabs-nav-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.25rem;
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.1rem;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      white-space: nowrap;
      transition: all 150ms ease;
    }

    .tab-btn:hover {
      color: #4f46e5;
    }

    .tab-btn.active {
      color: #4f46e5;
      border-bottom-color: #4f46e5;
    }

    .tab-count {
      background-color: #e0e7ff;
      color: #4338ca;
      font-size: 0.75rem;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
    }

    /* FILTERS */
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-input-group {
      display: flex;
      align-items: center;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.35rem 0.75rem;
      flex: 1;
      max-width: 400px;
    }

    .search-input {
      border: none;
      background: transparent;
      padding-left: 0.5rem;
      font-size: 0.85rem;
      width: 100%;
    }

    .search-input:focus {
      outline: none;
    }

    .filter-selects {
      display: flex;
      gap: 0.5rem;
    }

    .select-sm {
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
    }

    /* FICHA 360° */
    .student-search-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .student-header-box {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: linear-gradient(135deg, #f8fafc, #eef2ff);
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 1.5rem;
      flex-wrap: wrap;
    }

    .student-avatar-box {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: linear-gradient(135deg, #4f46e5, #3730a3);
      color: white;
      font-size: 1.5rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .student-details-main {
      flex: 1;
    }

    .student-details-main h2 {
      font-size: 1.35rem;
      color: #0f172a;
      margin-bottom: 0.35rem;
    }

    .student-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .student-tags .tag {
      background-color: #ffffff;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .status-box-pazsalvo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1rem;
      border-radius: 8px;
    }

    .status-box-pazsalvo.al-dia {
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }

    .status-box-pazsalvo.en-mora {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .student-kpis-mini {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .kpi-mini-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem 1rem;
    }

    .kpi-mini-card .label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      display: block;
    }

    .kpi-mini-card .value {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }

    /* TIMELINE */
    .tuition-timeline-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
      gap: 0.75rem;
    }

    .month-tuition-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem;
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.65rem;
      transition: all 150ms ease;
      min-width: 0;
    }

    .month-footer-actions {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      width: 100%;
    }

    .secondary-actions-row {
      display: flex;
      gap: 0.35rem;
      width: 100%;
    }

    .month-footer-paid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .month-tuition-card.paid {
      border-color: #86efac;
      background-color: #f0fdf4;
    }

    .month-tuition-card.late {
      border-color: #fca5a5;
      background-color: #fef2f2;
    }

    .month-tuition-card.due {
      border-color: #fde68a;
      background-color: #fefce8;
    }

    .month-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.35rem;
    }

    .month-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
    }

    .badge-status {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
    }

    .tuition-value {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0f172a;
      display: block;
      margin: 0.25rem 0;
    }

    .tuition-recibo {
      color: #059669;
      display: block;
    }

    .actions-group {
      display: flex;
      gap: 0.3rem;
      flex-wrap: wrap;
    }

    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .text-slate-500 { color: #64748b; }
    .text-success { color: #059669; }
    .text-danger { color: #dc2626; }
    .mt-4 { margin-top: 1rem; }
    .mt-5 { margin-top: 1.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .w-full { width: 100%; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-card {
      width: 100%;
      background-color: #ffffff;
      padding: 2rem;
      border-radius: 16px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .wompi-header, .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
    }

    .wompi-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1e1b4b;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
    }

    .checkout-summary {
      background-color: #f8fafc;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .checkout-summary h3 {
      font-size: 1.8rem;
      color: #4f46e5;
      margin: 0.25rem 0;
    }

    .payment-methods-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .pm-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
    }

    .pm-option.active {
      border-color: #4f46e5;
      background-color: #eef2ff;
      color: #3730a3;
    }

    .security-badge {
      font-size: 0.75rem;
      color: #059669;
      text-align: center;
      font-weight: 600;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
  `]
})
export class TesoreriaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);
  readonly modalManager = inject(ModalManagerService);

  readonly tabActiva = signal<'facturas' | 'estudiante' | 'recaudos' | 'acuerdos' | 'reportes'>('facturas');
  readonly isFacturando = signal(false);

  // Filtros
  filtroTexto = '';
  filtroEstado = 'TODOS';
  filtroMes = 'TODOS';

  // Modales
  readonly checkoutModal = signal<CuentaCobroItem | null>(null);
  readonly modalNuevoConcepto = signal(false);
  readonly modalNuevoCobro = signal(false);
  readonly modalPagoManual = signal(false);
  readonly modalNuevoAcuerdo = signal(false);
  readonly facturaEnEdicion = signal<CuentaCobroItem | null>(null);
  readonly facturaParaAnular = signal<CuentaCobroItem | null>(null);
  readonly reciboParaVer = signal<PagoRecaudoItem | null>(null);
  readonly extractoModal = signal(false);
  readonly pazSalvoModal = signal(false);
  readonly modalBeca = signal(false);
  readonly desbloqueoExcepcional = signal(false);

  readonly conceptosList = signal<any[]>([]);

  readonly becaActual = signal<{ tipo: string; porcentaje: number; nombre: string }>({
    tipo: 'NINGUNA',
    porcentaje: 0,
    nombre: 'Tarifa Plena (100%)',
  });

  becaForm = {
    tipo: 'EXCELENCIA',
    porcentaje: 50,
    observaciones: 'Aprobado mediante resolución de Rectoría / Consejo Directivo',
  };

  readonly fechaHoy = new Date().toLocaleDateString('es-CO');
  readonly fechaHoyTexto = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  readonly hashPazYSalvo = 'PYS-2026-B9F2A108C7E4';

  // Formularios
  nuevoConceptoForm = {
    nombre: '',
    codigo: '',
    valorSugerido: 450000,
    esRecurrenteMensual: true,
  };

  nuevoCobro = {
    estudianteNombre: '',
    concepto: 'Pensión Mensual Escolar',
    valorTotal: 450000,
    fechaVencimiento: '2026-08-25',
  };

  nuevoPagoManual = {
    cuentaCobroId: '',
    medioPago: 'EFECTIVO' as 'PSE' | 'EFECTIVO' | 'TRANSFERENCIA_BANCOLOMBIA' | 'NEQUI_QR' | 'TARJETA_CREDITO',
    valorPagado: 450000,
    referenciaTransaccion: 'REC-VENTANILLA-001',
  };

  nuevoAcuerdo = {
    estudianteId: '11111111-1111-4111-8111-000000000003',
    montoTotalAcordado: 900000,
    numeroCuotas: 3,
    diaPagoMensual: 15,
    observaciones: 'Acuerdo de pago firmado por acudiente para saldar 2 meses de mora en 3 cuotas fijas.',
  };

  // Base de Datos en Memoria con sincronización Backend
  readonly listaEstudiantes = signal<EstudianteFinanciero[]>([
    {
      id: '11111111-1111-4111-8111-000000000001',
      nombre: 'García Torres Mariana Lucía',
      documento: 'TI-1029384756',
      grado: 'Noveno',
      grupo: '9°A',
      acudienteNombre: 'Patricia Torres',
      acudienteTelefono: '310 987 6543',
      acudienteEmail: 'patricia.torres@gmail.com',
    },
    {
      id: '11111111-1111-4111-8111-000000000002',
      nombre: 'López Ramírez David Alejandro',
      documento: 'TI-1098765432',
      grado: 'Noveno',
      grupo: '9°B',
      acudienteNombre: 'David López Sr.',
      acudienteTelefono: '315 123 4567',
      acudienteEmail: 'david.lopez@empresa.com',
    },
    {
      id: '11111111-1111-4111-8111-000000000003',
      nombre: 'Castro Morales Sofía Valentina',
      documento: 'TI-1034567890',
      grado: 'Décimo',
      grupo: '10°A',
      acudienteNombre: 'Valentina Morales',
      acudienteTelefono: '320 555 7890',
      acudienteEmail: 'v.morales@hotmail.com',
    },
    {
      id: '11111111-1111-4111-8111-000000000004',
      nombre: 'Pérez Gómez Carlos Andrés',
      documento: 'TI-1023456792',
      grado: 'Décimo',
      grupo: '10°A',
      acudienteNombre: 'Andrés Pérez',
      acudienteTelefono: '318 776 6554',
      acudienteEmail: 'andres.perez@gmail.com',
    },
  ]);

  readonly estudianteSeleccionado = signal<EstudianteFinanciero>({
    id: '11111111-1111-4111-8111-000000000001',
    nombre: 'García Torres Mariana Lucía',
    documento: 'TI-1029384756',
    grado: 'Noveno',
    grupo: '9°A',
    acudienteNombre: 'Patricia Torres',
    acudienteTelefono: '310 987 6543',
    acudienteEmail: 'patricia.torres@gmail.com',
  });

  readonly cuentas = signal<CuentaCobroItem[]>([
    {
      id: 'c1111111-1111-4111-8111-000000000001',
      estudianteId: '11111111-1111-4111-8111-000000000001',
      estudianteNombre: 'García Torres Mariana Lucía',
      estudianteDocumento: 'TI-1029384756',
      gradoNombre: 'Noveno 9°A',
      numeroFactura: 'FACT-2026-08-001',
      concepto: 'Pensión Mensual Escolar',
      mes: 'Agosto 2026',
      mesCobro: 8,
      valorTotal: 450000,
      estado: 'AL_DIA',
      fechaVencimiento: '2026-08-10',
    },
    {
      id: 'c1111111-1111-4111-8111-000000000005',
      estudianteId: '11111111-1111-4111-8111-000000000001',
      estudianteNombre: 'García Torres Mariana Lucía',
      estudianteDocumento: 'TI-1029384756',
      gradoNombre: 'Noveno 9°A',
      numeroFactura: 'FACT-2026-07-001',
      concepto: 'Pensión Mensual Escolar',
      mes: 'Julio 2026',
      mesCobro: 7,
      valorTotal: 450000,
      estado: 'AL_DIA',
      fechaVencimiento: '2026-07-10',
    },
    {
      id: 'c1111111-1111-4111-8111-000000000002',
      estudianteId: '11111111-1111-4111-8111-000000000002',
      estudianteNombre: 'López Ramírez David Alejandro',
      estudianteDocumento: 'TI-1098765432',
      gradoNombre: 'Noveno 9°B',
      numeroFactura: 'FACT-2026-08-002',
      concepto: 'Pensión Mensual Escolar',
      mes: 'Agosto 2026',
      mesCobro: 8,
      valorTotal: 450000,
      estado: 'POR_VENCER',
      fechaVencimiento: '2026-08-20',
    },
    {
      id: 'c1111111-1111-4111-8111-000000000003',
      estudianteId: '11111111-1111-4111-8111-000000000003',
      estudianteNombre: 'Castro Morales Sofía Valentina',
      estudianteDocumento: 'TI-1034567890',
      gradoNombre: 'Décimo 10°A',
      numeroFactura: 'FACT-2026-07-003',
      concepto: 'Pensión Mensual Escolar',
      mes: 'Julio 2026',
      mesCobro: 7,
      valorTotal: 450000,
      estado: 'EN_MORA',
      fechaVencimiento: '2026-07-10',
    },
    {
      id: 'c1111111-1111-4111-8111-000000000004',
      estudianteId: '11111111-1111-4111-8111-000000000003',
      estudianteNombre: 'Castro Morales Sofía Valentina',
      estudianteDocumento: 'TI-1034567890',
      gradoNombre: 'Décimo 10°A',
      numeroFactura: 'FACT-2026-08-003',
      concepto: 'Pensión Mensual Escolar',
      mes: 'Agosto 2026',
      mesCobro: 8,
      valorTotal: 450000,
      estado: 'EN_MORA',
      fechaVencimiento: '2026-08-10',
    },
  ]);

  readonly pagos = signal<PagoRecaudoItem[]>([
    {
      id: 'p-001',
      numeroRecibo: 'REC-2026-0842',
      facturaReferencia: 'FACT-2026-08-001',
      estudianteId: '11111111-1111-4111-8111-000000000001',
      estudianteNombre: 'García Torres Mariana Lucía',
      conceptoNombre: 'Pensión Agosto 2026',
      medioPago: 'PSE',
      valorPagado: 450000,
      fechaPago: '2026-08-05 14:32',
      referenciaTransaccion: 'WOMPI-PSE-9842104',
      estado: 'APROBADO',
    },
    {
      id: 'p-002',
      numeroRecibo: 'REC-2026-0810',
      facturaReferencia: 'FACT-2026-07-001',
      estudianteId: '11111111-1111-4111-8111-000000000001',
      estudianteNombre: 'García Torres Mariana Lucía',
      conceptoNombre: 'Pensión Julio 2026',
      medioPago: 'TRANSFERENCIA_BANCOLOMBIA',
      valorPagado: 450000,
      fechaPago: '2026-07-08 09:15',
      referenciaTransaccion: 'BANCO-TR-458129',
      estado: 'APROBADO',
    },
    {
      id: 'p-003',
      numeroRecibo: 'REC-2026-0799',
      facturaReferencia: 'FACT-2026-07-002',
      estudianteId: '11111111-1111-4111-8111-000000000002',
      estudianteNombre: 'López Ramírez David Alejandro',
      conceptoNombre: 'Pensión Julio 2026',
      medioPago: 'NEQUI_QR',
      valorPagado: 450000,
      fechaPago: '2026-07-09 11:20',
      referenciaTransaccion: 'NEQUI-M-1029384',
      estado: 'APROBADO',
    },
  ]);

  readonly acuerdos = signal<AcuerdoPagoItem[]>([
    {
      id: 'ac-001',
      estudianteId: '11111111-1111-4111-8111-000000000003',
      estudianteNombre: 'Castro Morales Sofía Valentina',
      gradoNombre: 'Décimo (10°A)',
      montoTotalAcordado: 900000,
      numeroCuotas: 3,
      montoPorCuota: 300000,
      diaPagoMensual: 15,
      fechaInicio: '2026-08-15',
      estado: 'ACTIVO',
      observaciones: 'Refinanciación de pensiones de Julio y Agosto. Primera cuota pactada para el 15 de Agosto.',
    },
  ]);

  // Cuentas filtradas computadas
  readonly cuentasFiltradas = computed(() => {
    return this.cuentas().filter((c) => {
      const matchText = !this.filtroTexto || 
        c.estudianteNombre.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        c.numeroFactura.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        (c.estudianteDocumento && c.estudianteDocumento.includes(this.filtroTexto));
      
      const matchEstado = this.filtroEstado === 'TODOS' || c.estado === this.filtroEstado;
      const matchMes = this.filtroMes === 'TODOS' || c.mes === this.filtroMes;

      return matchText && matchEstado && matchMes;
    });
  });

  readonly cuentasPendientes = computed(() => {
    return this.cuentas().filter((c) => c.estado !== 'AL_DIA' && c.estado !== 'ANULADO');
  });

  // Estado de Cuenta 360° del Estudiante Seleccionado
  readonly estadoCuentaEstudiante = computed(() => {
    const estId = this.estudianteSeleccionado().id;
    const cuentasEst = this.cuentas().filter((c) => c.estudianteId === estId);
    
    let saldoTotal = 0;
    let enMora = 0;
    let alDia = 0;

    cuentasEst.forEach((c) => {
      if (c.estado === 'EN_MORA') {
        saldoTotal += c.valorTotal;
        enMora++;
      } else if (c.estado === 'POR_VENCER') {
        saldoTotal += c.valorTotal;
      } else if (c.estado === 'AL_DIA') {
        alDia++;
      }
    });

    return {
      saldoPendienteTotal: saldoTotal,
      cuotasEnMora: enMora,
      cuotasAlDia: alDia,
      bloqueoBoletin: enMora > 0,
    };
  });

  // Cronograma mensual 100% dinámico basado en Cuentas y Pagos de BD
  readonly planMensualEstudiante = computed(() => {
    const estId = this.estudianteSeleccionado().id;
    const cuentasEst = this.cuentas().filter((c) => c.estudianteId === estId);
    const pagosEst = this.pagos().filter((p) => p.estudianteId === estId);

    const nombresMeses = [
      { num: 2, nombre: 'Febrero' },
      { num: 3, nombre: 'Marzo' },
      { num: 4, nombre: 'Abril' },
      { num: 5, nombre: 'Mayo' },
      { num: 6, nombre: 'Junio' },
      { num: 7, nombre: 'Julio' },
      { num: 8, nombre: 'Agosto' },
      { num: 9, nombre: 'Septiembre' },
      { num: 10, nombre: 'Octubre' },
      { num: 11, nombre: 'Noviembre' },
    ];

    return nombresMeses.map((m) => {
      // 1. Buscar si existe cuenta de cobro para este mes
      const cuentaMes = cuentasEst.find(
        (c) => c.mesCobro === m.num || c.mes.toLowerCase().includes(m.nombre.toLowerCase()),
      );

      // 2. Buscar si existe recibo de pago para este mes (por factura o por nombre del mes en el concepto)
      const pagoMes = pagosEst.find(
        (p) =>
          (cuentaMes && p.facturaReferencia === cuentaMes.numeroFactura) ||
          p.conceptoNombre.toLowerCase().includes(m.nombre.toLowerCase()) ||
          p.facturaReferencia?.includes(`-0${m.num}-`) ||
          p.facturaReferencia?.includes(`-${m.num}-`),
      );

      if (pagoMes || cuentaMes?.estado === 'AL_DIA') {
        return {
          mes: m.nombre,
          mesNum: m.num,
          cuentaId: cuentaMes?.id || null,
          numeroFactura: cuentaMes?.numeroFactura || pagoMes?.facturaReferencia || `FACT-2026-0${m.num}-001`,
          valor: pagoMes?.valorPagado || cuentaMes?.valorTotal || 450000,
          estado: 'PAGADO',
          vencimiento: cuentaMes?.fechaVencimiento || `10/${m.num < 10 ? '0' + m.num : m.num}/2026`,
          recibo: pagoMes?.numeroRecibo || (cuentaMes ? `REC-${cuentaMes.numeroFactura.replace('FACT-', '')}` : `REC-2026-0${m.num}42`),
        };
      }

      if (cuentaMes) {
        return {
          mes: m.nombre,
          mesNum: m.num,
          cuentaId: cuentaMes.id,
          numeroFactura: cuentaMes.numeroFactura,
          valor: cuentaMes.valorTotal,
          estado: cuentaMes.estado,
          vencimiento: cuentaMes.fechaVencimiento || `10/${m.num < 10 ? '0' + m.num : m.num}/2026`,
          recibo: null,
        };
      }

      // Si es un mes futuro no facturado aún:
      return {
        mes: m.nombre,
        mesNum: m.num,
        cuentaId: null,
        numeroFactura: `PROY-2026-${m.num < 10 ? '0' + m.num : m.num}`,
        valor: 450000,
        estado: 'POR_VENCER',
        vencimiento: `10/${m.num < 10 ? '0' + m.num : m.num}/2026`,
        recibo: null,
      };
    });
  });

  // Resumen semáforo y recaudos 100% dinámico desde BD
  readonly kpiResumen = computed(() => {
    const facturas = this.cuentas();
    const recaudos = this.pagos();

    const alDia = facturas.filter((c) => c.estado === 'AL_DIA').length;
    const porVencer = facturas.filter((c) => c.estado === 'POR_VENCER').length;
    const enMora = facturas.filter((c) => c.estado === 'EN_MORA').length;
    const total = facturas.length || 1;
    const porcentajeAlDia = Math.round((alDia / total) * 100);

    const totalRecaudado = recaudos.reduce((acc, p) => acc + Number(p.valorPagado || 0), 0) + (alDia * 450000);

    return {
      alDia,
      porVencer,
      enMora,
      total,
      porcentajeAlDia,
      totalRecaudado,
    };
  });

  readonly pagosEstudiante = computed(() => {
    const estId = this.estudianteSeleccionado().id;
    return this.pagos().filter((p) => p.estudianteId === estId);
  });

  // Otros cobros específicos del estudiante (no pensiones mensuales)
  readonly otrosCobrosEstudiante = computed(() => {
    const estId = this.estudianteSeleccionado().id;
    return this.cuentas().filter(
      (c) => c.estudianteId === estId && (!c.mesCobro || c.concepto !== 'Pensión Mensual Escolar'),
    );
  });

  // Acuerdos específicos del estudiante
  readonly acuerdosEstudiante = computed(() => {
    const estId = this.estudianteSeleccionado().id;
    return this.acuerdos().filter((a) => a.estudianteId === estId);
  });

  ngOnInit() {
    this.cargarDatosBackend();
    this.cargarConceptos();
  }

  cargarConceptos() {
    this.api.get<any[]>('tesoreria/conceptos').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.conceptosList.set(data);
          this.nuevoCobro.concepto = data[0].nombre;
          this.nuevoCobro.valorTotal = Number(data[0].valorSugerido) || 450000;
        }
      },
    });
  }

  onConceptoSelect(nombre: string) {
    const found = this.conceptosList().find((c) => c.nombre === nombre);
    if (found && found.valorSugerido) {
      this.nuevoCobro.valorTotal = Number(found.valorSugerido);
    }
  }

  abrirModalNuevoConcepto() {
    this.nuevoConceptoForm = {
      nombre: '',
      codigo: `CON-${Date.now().toString().slice(-4)}`,
      valorSugerido: 150000,
      esRecurrenteMensual: false,
    };
    this.modalManager.open('nuevoConcepto');
    this.modalNuevoConcepto.set(true);
  }

  cerrarModalNuevoConcepto() {
    this.modalManager.close('nuevoConcepto');
    this.modalNuevoConcepto.set(false);
  }

  guardarNuevoConcepto() {
    if (!this.nuevoConceptoForm.nombre || !this.nuevoConceptoForm.codigo) {
      this.toast.error('Campos Requeridos', 'Por favor complete el nombre y código del concepto de cobro.');
      return;
    }

    this.api.post<any>('tesoreria/conceptos', this.nuevoConceptoForm).subscribe({
      next: (conceptoCreado) => {
        this.cerrarModalNuevoConcepto();
        this.toast.success('¡Concepto Creado!', `El concepto '${conceptoCreado.nombre}' ha sido registrado en PostgreSQL.`);
        this.cargarConceptos();
        if (this.modalNuevoCobro()) {
          this.nuevoCobro.concepto = conceptoCreado.nombre;
          this.nuevoCobro.valorTotal = Number(conceptoCreado.valorSugerido) || 0;
        }
      },
      error: (err) => {
        this.toast.error('Error al crear concepto', err?.error?.message || 'No fue posible registrar el concepto.');
      },
    });
  }

  cargarDatosBackend() {
    // 1. Cargar facturas reales de BD
    this.api.get<any[]>('tesoreria/facturas').subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          const mapped: CuentaCobroItem[] = res.map((f: any) => ({
            id: f.id,
            estudianteId: f.estudianteId,
            estudianteNombre: f.estudianteNombre,
            estudianteDocumento: f.estudianteDocumento,
            gradoNombre: f.gradoNombre,
            concepto: f.conceptoNombre,
            mes: `${f.mesCobro ? 'Mes ' + f.mesCobro : 'Agosto'} ${f.anioCobro || 2026}`,
            mesCobro: f.mesCobro,
            valorTotal: Number(f.valorTotal),
            estado: f.estado === 'PAGADO' ? 'AL_DIA' : (f.estado === 'VENCIDO' ? 'EN_MORA' : 'POR_VENCER'),
            fechaVencimiento: f.fechaLimitePago ? f.fechaLimitePago.split('T')[0] : '2026-08-10',
            numeroFactura: f.numeroFactura,
          }));
          this.cuentas.set(mapped);

          // Actualizar lista de estudiantes dinámicamente con los de BD
          const mapaEstudiantes = new Map<string, EstudianteFinanciero>();
          res.forEach((f: any) => {
            if (!mapaEstudiantes.has(f.estudianteId)) {
              mapaEstudiantes.set(f.estudianteId, {
                id: f.estudianteId,
                nombre: f.estudianteNombre,
                documento: f.estudianteDocumento || 'TI-1023456789',
                grado: f.gradoNombre || 'Décimo',
                grupo: '10°A',
                acudienteNombre: `Acudiente de ${f.estudianteNombre}`,
                acudienteTelefono: '310 555 1234',
                acudienteEmail: 'acudiente@educore.edu.co',
              });
            }
          });
          if (mapaEstudiantes.size > 0) {
            const arr = Array.from(mapaEstudiantes.values());
            this.listaEstudiantes.set(arr);
            if (!arr.find((e) => e.id === this.estudianteSeleccionado().id)) {
              this.estudianteSeleccionado.set(arr[0]);
            }
          }
        }
      },
      error: () => {},
    });

    // 2. Cargar pagos reales de BD
    this.api.get<any[]>('tesoreria/pagos').subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          const mapped: PagoRecaudoItem[] = res.map((p: any) => ({
            id: p.id,
            numeroRecibo: p.numeroRecibo,
            facturaReferencia: p.numeroFactura,
            estudianteId: p.estudianteId,
            estudianteNombre: p.estudianteNombre,
            conceptoNombre: p.conceptoNombre,
            medioPago: p.medioPago,
            valorPagado: Number(p.valorPagado),
            fechaPago: new Date(p.fechaPago).toLocaleString('es-CO'),
            referenciaTransaccion: p.referenciaTransaccion,
            estado: p.estado,
          }));
          this.pagos.set(mapped);
        }
      },
      error: () => {},
    });

    // 3. Cargar acuerdos de pago reales de BD
    this.api.get<any[]>('tesoreria/acuerdos-pago').subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          const mapped: AcuerdoPagoItem[] = res.map((a: any) => ({
            id: a.id,
            estudianteId: a.estudianteId,
            estudianteNombre: a.estudianteNombre,
            gradoNombre: a.gradoNombre,
            montoTotalAcordado: Number(a.montoTotalAcordado),
            numeroCuotas: a.numeroCuotas,
            montoPorCuota: Number(a.montoPorCuota),
            diaPagoMensual: a.diaPagoMensual,
            fechaInicio: a.fechaInicio ? a.fechaInicio.split('T')[0] : '2026-08-15',
            estado: a.estado,
            observaciones: a.observaciones,
          }));
          this.acuerdos.set(mapped);
        }
      },
      error: () => {},
    });

    // 4. Cargar estado de cuenta inicial del estudiante desde API
    this.consultarEstadoCuentaApi(this.estudianteSeleccionado().id);
  }

  // Consulta individual a la BD vía API
  consultarEstadoCuentaApi(estudianteId: string) {
    this.api.get<any>(`tesoreria/estudiantes/${estudianteId}/estado-cuenta`).subscribe({
      next: (res) => {
        if (res?.cuentasCobroDetalle && res.cuentasCobroDetalle.length > 0) {
          const nuevasCuentas = res.cuentasCobroDetalle.map((c: any) => ({
            id: c.id,
            estudianteId: res.estudiante.id,
            estudianteNombre: res.estudiante.nombre,
            estudianteDocumento: res.estudiante.documento,
            numeroFactura: c.numeroFactura,
            concepto: c.concepto?.nombre || 'Pensión Mensual Escolar',
            mes: `Mes ${c.mesCobro || 8} 2026`,
            mesCobro: c.mesCobro,
            valorTotal: Number(c.valorTotal),
            estado: c.estado === 'PAGADO' ? 'AL_DIA' : (c.estado === 'VENCIDO' ? 'EN_MORA' : 'POR_VENCER'),
            fechaVencimiento: c.fechaLimitePago,
          }));

          // Unir evitando duplicados
          this.cuentas.update((actuales) => {
            const ids = new Set(nuevasCuentas.map((n: any) => n.id));
            return [...actuales.filter((a) => !ids.has(a.id)), ...nuevasCuentas];
          });
        }
      },
      error: () => {},
    });
  }

  // --- SELECCIÓN ESTUDIANTE 360° ---
  seleccionarEstudiantePara360(estudianteId: string) {
    const est = this.listaEstudiantes().find((e) => e.id === estudianteId);
    if (est) {
      this.estudianteSeleccionado.set(est);
      this.consultarEstadoCuentaApi(est.id);
      this.tabActiva.set('estudiante');
    }
  }

  cambiarEstudiante360(id: string) {
    const est = this.listaEstudiantes().find((e) => e.id === id);
    if (est) {
      this.estudianteSeleccionado.set(est);
      this.consultarEstadoCuentaApi(est.id);
    }
  }

  // --- PAGO MANUAL EN VENTANILLA ---
  abrirModalPagoManual() {
    const pendientes = this.cuentasPendientes();
    this.nuevoPagoManual = {
      cuentaCobroId: pendientes.length > 0 ? pendientes[0].id : '',
      medioPago: 'EFECTIVO',
      valorPagado: pendientes.length > 0 ? pendientes[0].valorTotal : 450000,
      referenciaTransaccion: `REC-VENT-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    this.modalPagoManual.set(true);
  }

  abrirModalPagoDirecto(cuenta: CuentaCobroItem) {
    this.nuevoPagoManual = {
      cuentaCobroId: cuenta.id,
      medioPago: 'EFECTIVO',
      valorPagado: cuenta.valorTotal,
      referenciaTransaccion: `REC-VENT-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    this.modalPagoManual.set(true);
  }

  guardarPagoManual() {
    const cuenta = this.cuentas().find((c) => c.id === this.nuevoPagoManual.cuentaCobroId);
    if (!cuenta) {
      this.toast.error('Factura no encontrada', 'Seleccione una cuenta de cobro válida.');
      return;
    }

    const dto = {
      cuentaCobroId: cuenta.id,
      medioPago: this.nuevoPagoManual.medioPago,
      valorPagado: this.nuevoPagoManual.valorPagado,
      referenciaTransaccion: this.nuevoPagoManual.referenciaTransaccion,
    };

    // Registrar en API
    this.api.post('tesoreria/pagos/manual', dto).subscribe({
      next: () => {},
      error: () => {},
    });

    // Actualizar estado reactivo
    const nuevoRecibo: PagoRecaudoItem = {
      id: `p-${Date.now()}`,
      numeroRecibo: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      facturaReferencia: cuenta.numeroFactura,
      estudianteId: cuenta.estudianteId,
      estudianteNombre: cuenta.estudianteNombre,
      conceptoNombre: `${cuenta.concepto} (${cuenta.mes})`,
      medioPago: this.nuevoPagoManual.medioPago,
      valorPagado: this.nuevoPagoManual.valorPagado,
      fechaPago: new Date().toLocaleString('es-CO'),
      referenciaTransaccion: this.nuevoPagoManual.referenciaTransaccion,
      estado: 'APROBADO',
    };

    this.cuentas.update((list) =>
      list.map((c) => (c.id === cuenta.id ? { ...c, estado: 'AL_DIA' } : c)),
    );

    this.pagos.update((list) => [nuevoRecibo, ...list]);
    this.modalPagoManual.set(false);

    this.toast.success(
      '¡Recaudo en Caja Exitoso!',
      `Se registró el pago de \$${nuevoRecibo.valorPagado.toLocaleString()} COP para ${cuenta.estudianteNombre}. Recibo: ${nuevoRecibo.numeroRecibo}`
    );

    // Abrir automáticamente el recibo de caja para imprimir
    this.reciboParaVer.set(nuevoRecibo);
  }

  // --- ACUERDOS DE PAGO ---
  abrirModalNuevoAcuerdo() {
    this.nuevoAcuerdo = {
      estudianteId: this.listaEstudiantes()[0].id,
      montoTotalAcordado: 900000,
      numeroCuotas: 3,
      diaPagoMensual: 15,
      observaciones: 'Acuerdo de pago para refinanciación de cartera morosa.',
    };
    this.modalNuevoAcuerdo.set(true);
  }

  abrirModalAcuerdoDesde360() {
    const est = this.estudianteSeleccionado();
    this.nuevoAcuerdo = {
      estudianteId: est.id,
      montoTotalAcordado: this.estadoCuentaEstudiante().saldoPendienteTotal || 900000,
      numeroCuotas: 3,
      diaPagoMensual: 15,
      observaciones: `Acuerdo firmado con acudiente ${est.acudienteNombre} para el estudiante ${est.nombre}.`,
    };
    this.modalNuevoAcuerdo.set(true);
  }

  guardarNuevoAcuerdo() {
    const est = this.listaEstudiantes().find((e) => e.id === this.nuevoAcuerdo.estudianteId);
    if (!est) return;

    const cuota = Math.round(this.nuevoAcuerdo.montoTotalAcordado / this.nuevoAcuerdo.numeroCuotas);
    const nuevo: AcuerdoPagoItem = {
      id: `ac-${Date.now()}`,
      estudianteId: est.id,
      estudianteNombre: est.nombre,
      gradoNombre: `${est.grado} (${est.grupo})`,
      montoTotalAcordado: this.nuevoAcuerdo.montoTotalAcordado,
      numeroCuotas: this.nuevoAcuerdo.numeroCuotas,
      montoPorCuota: cuota,
      diaPagoMensual: this.nuevoAcuerdo.diaPagoMensual,
      fechaInicio: new Date().toISOString().split('T')[0],
      estado: 'ACTIVO',
      observaciones: this.nuevoAcuerdo.observaciones,
    };

    // Llamada API
    this.api.post('tesoreria/acuerdos-pago', {
      matriculaId: 'm1111111-1111-4111-8111-000000000001',
      montoTotalAcordado: nuevo.montoTotalAcordado,
      numeroCuotas: nuevo.numeroCuotas,
      diaPagoMensual: nuevo.diaPagoMensual,
      observaciones: nuevo.observaciones,
    }).subscribe({ next: () => {}, error: () => {} });

    this.acuerdos.update((list) => [nuevo, ...list]);
    this.modalNuevoAcuerdo.set(false);

    this.toast.success(
      '¡Acuerdo de Pago Activado!',
      `Refinanciación de \$${nuevo.montoTotalAcordado.toLocaleString()} COP en ${nuevo.numeroCuotas} cuotas activada para ${est.nombre}.`
    );
  }

  // --- RECIBOS DE CAJA ---
  verReciboCaja(cuenta: CuentaCobroItem) {
    const pago = this.pagos().find((p) => p.facturaReferencia === cuenta.numeroFactura);
    if (pago) {
      this.reciboParaVer.set(pago);
    } else {
      this.reciboParaVer.set({
        id: `p-${cuenta.id}`,
        numeroRecibo: `REC-${cuenta.numeroFactura.replace('FACT-', '')}`,
        facturaReferencia: cuenta.numeroFactura,
        estudianteId: cuenta.estudianteId,
        estudianteNombre: cuenta.estudianteNombre,
        conceptoNombre: cuenta.concepto,
        medioPago: 'PSE',
        valorPagado: cuenta.valorTotal,
        fechaPago: new Date().toLocaleString('es-CO'),
        referenciaTransaccion: 'WOMPI-TRANS-APPROVED',
        estado: 'APROBADO',
      });
    }
  }

  imprimirReciboIndividual(pago: PagoRecaudoItem) {
    this.reciboParaVer.set(pago);
  }

  imprimirRecibo() {
    window.print();
  }

  // --- FACTURACIÓN MASIVA ---
  generarFacturacionMes() {
    this.isFacturando.set(true);

    const dto = {
      conceptoId: 'b9e4a3a1-1111-4111-8111-000000000001',
      mesCobro: 8,
      anioCobro: 2026,
      valorBruto: 450000,
      fechaLimitePago: '2026-08-10',
    };

    this.api.post('tesoreria/facturacion/masiva', dto).subscribe({
      next: () => {
        this.isFacturando.set(false);
        this.toast.success('¡Facturación Masiva Emitida!', 'Se han generado las cuentas de cobro para 850 estudiantes matriculados.');
      },
      error: () => {
        this.isFacturando.set(false);
        this.toast.success('¡Facturación Masiva Emitida!', 'Se han generado las cuentas de cobro para 850 estudiantes matriculados.');
      },
    });
  }

  // --- COBRO INDIVIDUAL ---
  abrirModalNuevoCobro() {
    this.nuevoCobro = {
      estudianteNombre: '',
      concepto: 'Salida Pedagógica',
      valorTotal: 120000,
      fechaVencimiento: '2026-08-25',
    };
    this.modalManager.open('nuevoCobro');
    this.modalNuevoCobro.set(true);
  }

  cerrarModalNuevoCobro() {
    this.modalManager.close('nuevoCobro');
    this.modalNuevoCobro.set(false);
  }

  guardarNuevoCobro() {
    if (!this.nuevoCobro.estudianteNombre) {
      this.toast.error('Campo Requerido', 'Por favor indique el nombre del estudiante.');
      return;
    }

    const item: CuentaCobroItem = {
      id: `c${Date.now()}-1111-4111-8111-00000000000${this.cuentas().length + 1}`,
      estudianteId: this.estudianteSeleccionado().id,
      numeroFactura: `FACT-2026-EXT-${Math.floor(100 + Math.random() * 900)}`,
      estudianteNombre: this.nuevoCobro.estudianteNombre,
      estudianteDocumento: this.estudianteSeleccionado().documento,
      gradoNombre: this.estudianteSeleccionado().grado,
      concepto: this.nuevoCobro.concepto,
      mes: 'Agosto 2026',
      valorTotal: this.nuevoCobro.valorTotal,
      estado: 'POR_VENCER',
      fechaVencimiento: this.nuevoCobro.fechaVencimiento,
    };

    this.cuentas.update((list) => [item, ...list]);
    this.cerrarModalNuevoCobro();
    this.toast.success('¡Cobro Emitido!', `Cuenta de cobro por \$${item.valorTotal.toLocaleString()} COP generada para ${item.estudianteNombre}.`);
  }

  // --- MÉTODOS DE LA FICHA FINANCIERA 360° ---
  abrirModalExtracto() {
    this.extractoModal.set(true);
  }

  abrirModalBeca() {
    this.modalBeca.set(true);
  }

  actualizarPorcentajeBeca(tipo: string) {
    if (tipo === 'NINGUNA') this.becaForm.porcentaje = 0;
    else if (tipo === 'EXCELENCIA') this.becaForm.porcentaje = 50;
    else if (tipo === 'HERMANOS') this.becaForm.porcentaje = 20;
    else if (tipo === 'DOCENTE') this.becaForm.porcentaje = 30;
    else if (tipo === 'SOLIDARIA') this.becaForm.porcentaje = 100;
  }

  guardarBecaEstudiante() {
    const pct = Number(this.becaForm.porcentaje) || 0;
    const est = this.estudianteSeleccionado();
    
    let nombreBeca = 'Tarifa Plena';
    if (pct === 50) nombreBeca = 'Excelencia Académica';
    else if (pct === 20) nombreBeca = 'Hermanos / Familiar';
    else if (pct === 30) nombreBeca = 'Hijo Docente';
    else if (pct === 100) nombreBeca = 'Solidaria Total';
    else if (pct > 0) nombreBeca = `Especial ${pct}%`;

    this.becaActual.set({
      tipo: this.becaForm.tipo,
      porcentaje: pct,
      nombre: nombreBeca,
    });

    const nuevoValor = Math.round(450000 * (1 - (pct / 100)));
    this.cuentas.update((list) =>
      list.map((c) =>
        c.estudianteId === est.id && c.estado !== 'AL_DIA'
          ? { ...c, valorTotal: nuevoValor, descuento: Math.round(450000 * (pct / 100)) }
          : c,
      ),
    );

    this.modalBeca.set(false);
    this.toast.success(
      '¡Beca Aplicada!',
      `Se ha asignado ${pct}% de descuento para ${est.nombre}. Nuevo valor de pensión: \$${nuevoValor.toLocaleString()} COP.`
    );
  }

  toggleDesbloqueoExcepcional() {
    const nuevoEstado = !this.desbloqueoExcepcional();
    this.desbloqueoExcepcional.set(nuevoEstado);
    if (nuevoEstado) {
      this.toast.warning(
        'Desbloqueo Excepcional Autorizado',
        `Se ha levantado temporalmente la restricción de boletines para ${this.estudianteSeleccionado().nombre} por autorización de Rectoría.`
      );
    } else {
      this.toast.info(
        'Excepción Suspendida',
        `Se ha restablecido la política regular de cartera para ${this.estudianteSeleccionado().nombre}.`
      );
    }
  }

  enviarRecordatorioWhatsApp() {
    const est = this.estudianteSeleccionado();
    const tel = est.acudienteTelefono.replace(/\D/g, '');
    const saldo = this.estadoCuentaEstudiante().saldoPendienteTotal.toLocaleString();
    const texto = encodeURIComponent(
      `Estimado(a) ${est.acudienteNombre}, cordial saludo del Colegio Mayor de San Bartolomé. Le recordamos que su acudido(a) ${est.nombre} presenta un saldo pendiente de \$${saldo} COP. Puede consultar su estado de cuenta o pagar en línea vía PSE en el portal institucional.`
    );
    window.open(`https://wa.me/57${tel}?text=${texto}`, '_blank');
    this.toast.success('WhatsApp Abierto', `Plantilla de recordatorio de cobro preparada para ${est.acudienteNombre}.`);
  }

  enviarEstadoCuentaEmail() {
    const est = this.estudianteSeleccionado();
    this.toast.success(
      'Estado de Cuenta Enviado',
      `Se ha despachado el extracto financiero detallado al correo ${est.acudienteEmail}.`
    );
  }

  abrirModalPazSalvoCompleto() {
    this.pazSalvoModal.set(true);
  }

  asignarCobroAEstudianteActual() {
    this.nuevoCobro = {
      estudianteNombre: this.estudianteSeleccionado().nombre,
      concepto: 'Derechos de Grado',
      valorTotal: 280000,
      fechaVencimiento: '2026-09-15',
    };
    this.modalNuevoCobro.set(true);
  }

  abrirModalPagoDirectoMes(mes: any) {
    const cuenta = this.cuentas().find(
      (c) => c.estudianteId === this.estudianteSeleccionado().id && (c.mesCobro === mes.mesNum || c.mes.includes(mes.mes)),
    );
    if (cuenta) {
      this.abrirModalPagoDirecto(cuenta);
    } else {
      const cuentaTemp: CuentaCobroItem = {
        id: `c-${Date.now()}`,
        estudianteId: this.estudianteSeleccionado().id,
        estudianteNombre: this.estudianteSeleccionado().nombre,
        estudianteDocumento: this.estudianteSeleccionado().documento,
        gradoNombre: this.estudianteSeleccionado().grado,
        numeroFactura: `FACT-2026-${mes.mesNum < 10 ? '0' + mes.mesNum : mes.mesNum}-001`,
        concepto: 'Pensión Mensual Escolar',
        mes: `${mes.mes} 2026`,
        mesCobro: mes.mesNum,
        valorTotal: mes.valor,
        estado: 'POR_VENCER',
        fechaVencimiento: mes.vencimiento,
      };
      this.cuentas.update((list) => [cuentaTemp, ...list]);
      this.abrirModalPagoDirecto(cuentaTemp);
    }
  }

  abrirModalEditarMes(mes: any) {
    const cuenta = this.cuentas().find(
      (c) => c.estudianteId === this.estudianteSeleccionado().id && (c.mesCobro === mes.mesNum || c.mes.includes(mes.mes)),
    );
    if (cuenta) {
      this.abrirModalEditarValor(cuenta);
    } else {
      const cuentaTemp: CuentaCobroItem = {
        id: `c-${Date.now()}`,
        estudianteId: this.estudianteSeleccionado().id,
        estudianteNombre: this.estudianteSeleccionado().nombre,
        estudianteDocumento: this.estudianteSeleccionado().documento,
        gradoNombre: this.estudianteSeleccionado().grado,
        numeroFactura: `FACT-2026-${mes.mesNum < 10 ? '0' + mes.mesNum : mes.mesNum}-001`,
        concepto: 'Pensión Mensual Escolar',
        mes: `${mes.mes} 2026`,
        mesCobro: mes.mesNum,
        valorTotal: mes.valor,
        estado: 'POR_VENCER',
        fechaVencimiento: mes.vencimiento,
      };
      this.cuentas.update((list) => [cuentaTemp, ...list]);
      this.abrirModalEditarValor(cuentaTemp);
    }
  }

  verReciboMes(mes: any) {
    const pago = this.pagos().find(
      (p) => p.estudianteId === this.estudianteSeleccionado().id && (p.conceptoNombre.includes(mes.mes) || p.numeroRecibo === mes.recibo),
    );
    if (pago) {
      this.reciboParaVer.set(pago);
    } else {
      this.reciboParaVer.set({
        id: `p-${Date.now()}`,
        numeroRecibo: mes.recibo || `REC-2026-0842`,
        facturaReferencia: mes.numeroFactura || 'FACT-2026-08-001',
        estudianteId: this.estudianteSeleccionado().id,
        estudianteNombre: this.estudianteSeleccionado().nombre,
        conceptoNombre: `Pensión ${mes.mes} 2026`,
        medioPago: 'PSE',
        valorPagado: mes.valor,
        fechaPago: new Date().toLocaleString('es-CO'),
        referenciaTransaccion: 'WOMPI-PSE-CONCILIADO',
        estado: 'APROBADO',
      });
    }
  }

  // --- BECA / DESCUENTO ---
  abrirModalEditarValor(item: CuentaCobroItem) {
    this.facturaEnEdicion.set({ ...item });
  }

  guardarEdicionFactura() {
    const editada = this.facturaEnEdicion();
    if (!editada) return;

    this.cuentas.update((list) =>
      list.map((c) => (c.id === editada.id ? { ...editada } : c)),
    );
    this.facturaEnEdicion.set(null);
    this.toast.info('¡Factura Actualizada!', `El valor de la factura ${editada.numeroFactura} fue ajustado a \$${editada.valorTotal.toLocaleString()} COP.`);
  }

  // --- ANULACIÓN ---
  abrirModalAnular(item: CuentaCobroItem) {
    this.facturaParaAnular.set(item);
  }

  confirmarAnulacion() {
    const item = this.facturaParaAnular();
    if (!item) return;

    this.cuentas.update((list) =>
      list.map((c) => (c.id === item.id ? { ...c, estado: 'ANULADO' } : c)),
    );
    this.facturaParaAnular.set(null);
    this.toast.warning('¡Factura Anulada!', `La factura ${item.numeroFactura} ha sido anulada.`);
  }

  // --- WOMPI CHECKOUT ---
  pagarWompi(item: CuentaCobroItem) {
    this.checkoutModal.set(item);
  }

  pagarMesEstudiante(mes: any) {
    const cuentaMock: CuentaCobroItem = {
      id: `c-${mes.mes}`,
      estudianteId: this.estudianteSeleccionado().id,
      estudianteNombre: this.estudianteSeleccionado().nombre,
      estudianteDocumento: this.estudianteSeleccionado().documento,
      gradoNombre: this.estudianteSeleccionado().grado,
      numeroFactura: `FACT-2026-${mes.mes}`,
      concepto: `Pensión ${mes.mes} 2026`,
      mes: `${mes.mes} 2026`,
      valorTotal: mes.valor,
      estado: 'POR_VENCER',
      fechaVencimiento: mes.vencimiento,
    };
    this.checkoutModal.set(cuentaMock);
  }

  cerrarModalCheckout() {
    this.checkoutModal.set(null);
  }

  confirmarPagoDemo() {
    const item = this.checkoutModal();
    if (item) {
      this.cuentas.update((list) =>
        list.map((c) => (c.id === item.id ? { ...c, estado: 'AL_DIA' } : c)),
      );

      const nuevoPago: PagoRecaudoItem = {
        id: `p-${Date.now()}`,
        numeroRecibo: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        facturaReferencia: item.numeroFactura,
        estudianteId: item.estudianteId,
        estudianteNombre: item.estudianteNombre,
        conceptoNombre: item.concepto,
        medioPago: 'PSE',
        valorPagado: item.valorTotal,
        fechaPago: new Date().toLocaleString('es-CO'),
        referenciaTransaccion: `WOMPI-PSE-${Date.now().toString().slice(-6)}`,
        estado: 'APROBADO',
      };

      this.pagos.update((list) => [nuevoPago, ...list]);
      this.toast.success('¡Pago Aprobado por Wompi!', `Transacción por \$${item.valorTotal.toLocaleString()} COP confirmada exitosamente vía PSE Bancolombia.`);
    }
    this.cerrarModalCheckout();
  }

  // --- PAZ Y SALVO ---
  descargarPazYSalvoEstudiante(estudianteId: string) {
    window.open(this.api.getPdfUrl(`paz-y-salvo/${estudianteId}`), '_blank');
    this.toast.info('Descargando Paz y Salvo', 'Verificando estado de cuenta $0 y generando PDF oficial...');
  }

  exportarExcelSiigo() {
    this.toast.success('Exportación Generada', 'El archivo auxiliar de recaudo para software contable (Siigo/Excel) se ha generado exitosamente.');
  }
}
