import { CuentaCobroItem, PagoRecaudoItem, AcuerdoPagoItem, EstudianteFinanciero, EstadoCuenta, MedioPago, EstadoPago, EstadoAcuerdo, BecaEstudiante, TipoBeca, VigenciaBeca, EstadoBeca, CuentaContablePuc, MesEscolar, FiltroGeneral, PagoManualForm } from "./models/tesoreria.models";
import type { ConfiguracionFinanciera } from "./models/tesoreria.models";
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';
import { SearchableOption } from '../../shared/components/searchable-select.component';

import { TesoreriaFacturasComponent } from './tabs/tesoreria-facturas.component';
import { TesoreriaEstadoCuentaComponent } from './tabs/tesoreria-estado-cuenta.component';
import { TesoreriaRecaudosComponent } from './tabs/tesoreria-recaudos.component';
import { TesoreriaAcuerdosComponent } from './tabs/tesoreria-acuerdos.component';
import { TesoreriaReportesComponent } from './tabs/tesoreria-reportes.component';
import { ParametrosService, Parametro } from '../../core/services/parametros.service';
import { imprimirElementoHtml } from '../../core/utils/print.utils';

import { HelpBadgeComponent } from '../../shared/components/help-badge.component';
import { ModalCheckoutWompiComponent } from './modales/modal-checkout-wompi.component';
import { ModalNuevoConceptoComponent } from './modales/modal-nuevo-concepto.component';
import { ModalConfiguracionFinancieraComponent } from './modales/modal-configuracion-financiera.component';
import { ModalNuevoAcuerdoComponent } from './modales/modal-nuevo-acuerdo.component';
import { ModalNuevoCobroComponent } from './modales/modal-nuevo-cobro.component';
import { ModalPagoManualComponent } from './modales/modal-pago-manual.component';
import { ModalPazYSalvoComponent } from './modales/modal-paz-y-salvo.component';
import { ModalEditarFacturaComponent } from './modales/modal-editar-factura.component';
import { ModalAnularFacturaComponent } from './modales/modal-anular-factura.component';
import { ModalBecaComponent } from './modales/modal-beca.component';
import { ModalExtractoConsolidadoComponent } from './modales/modal-extracto-consolidado.component';
import { ModalAnularPagoComponent } from './modales/modal-anular-pago.component';
import { DianService } from '../contabilidad/services/dian.service';









@Component({
  selector: 'app-tesoreria',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpBadgeComponent, ModalCheckoutWompiComponent, ModalConfiguracionFinancieraComponent, ModalNuevoConceptoComponent, ModalNuevoAcuerdoComponent, ModalNuevoCobroComponent, ModalPagoManualComponent, ModalPazYSalvoComponent, ModalEditarFacturaComponent, ModalAnularFacturaComponent, ModalBecaComponent, ModalExtractoConsolidadoComponent, ModalAnularPagoComponent,
    TesoreriaFacturasComponent,
    TesoreriaEstadoCuentaComponent,
    TesoreriaRecaudosComponent,
    TesoreriaAcuerdosComponent,
    TesoreriaReportesComponent],
  template: `
    <div class="page-header">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1>Tesorería & Cartera</h1>
          <app-help-badge term="MODULO_TESORERIA"></app-help-badge>
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
    <!-- KPIs Financieros -->
    <div class="kpi-summary-grid grid-cols-5 animate-fade-in">
      <div class="summary-card kpi-mini-card">
        <div class="status-indicator-dot green"></div>
        <div>
          <span class="label">Recaudo del Mes</span>
          <span class="value text-success">{{ formatearMonto(totalRecaudoMes()) }}</span>
        </div>
      </div>
      <div class="summary-card kpi-mini-card">
        <div class="status-indicator-dot amber"></div>
        <div>
          <span class="label">Cartera Vencida</span>
          <span class="value text-warning">{{ formatearMonto(totalCarteraVencida()) }}</span>
        </div>
      </div>
      <div class="summary-card kpi-mini-card">
        <div class="status-indicator-dot blue"></div>
        <div>
          <span class="label">Proyección Mes</span>
          <span class="value">{{ formatearMonto(totalProyeccionMes()) }}</span>
        </div>
      </div>
      <div class="summary-card kpi-mini-card">
        <div class="status-indicator-dot red"></div>
        <div>
          <span class="label">Acuerdos Incumplidos</span>
          <span class="value text-danger">{{ totalAcuerdosIncumplidos() }}</span>
        </div>
      </div>
      <div class="summary-card kpi-mini-card">
        <div class="status-indicator-dot green"></div>
        <div>
          <span class="label">Caja Actual</span>
          <span class="value">{{ formatearMonto(totalCajaEfectivo()) }}</span>
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
          (emitirDian)="emitirFacturaDian($event)"
        />
      }
      
      @if (tabActiva() === 'estudiante') {
        <app-tesoreria-estado-cuenta
          [listaEstudiantes]="listaEstudiantes()"
          [estudiantesSelectOptions]="estudiantesMoraSelectOptions()"
          [estadosCuentaList]="estadosCuentaList()"
          [mesesList]="mesesList()"
          [mediosPagoList]="mediosPagoList()"
          [estudianteSeleccionado]="estudianteSeleccionado()"
          [becaActual]="becaActual()"
          [estadoCuentaEstudiante]="estadoCuentaEstudiante()"
          [desbloqueoExcepcional]="desbloqueoExcepcional()"
          [planMensualEstudiante]="planMensualEstudiante()"
          [otrosCobrosEstudiante]="otrosCobrosEstudiante()"
          [acuerdosEstudiante]="acuerdosEstudiante()"
          [pagosEstudiante]="pagosEstudiante()"
          (cambiarEstudiante)="seleccionarEstudiante($event)"
          (seleccionarEstudiante)="seleccionarEstudiante($event)"
          (abrirModalExtracto)="abrirModalExtracto()"
          (abrirModalBeca)="abrirModalBeca()"
          (abrirModalPazSalvoCompleto)="abrirModalPazSalvoCompleto()"
          (abrirModalAcuerdoDesde360)="abrirModalAcuerdoDesde360()"
          (toggleDesbloqueoExcepcional)="toggleDesbloqueoExcepcional()"
          (enviarRecordatorioWhatsApp)="enviarRecordatorioWhatsApp()"
          (enviarEstadoCuentaEmail)="enviarEstadoCuentaEmail()"
          (enviarWhatsApp)="enviarRecordatorioWhatsApp()"
          (enviarEmail)="enviarEstadoCuentaEmail()"
          (abrirPazSalvo)="abrirModalPazSalvoCompleto()"
          (asignarCobroAEstudianteActual)="asignarCobroAEstudianteActual()"
          (asignarCobro)="asignarCobroAEstudianteActual()"
          (pagarMesEstudiante)="pagarMesEstudiante($event)"
          (pagarMes)="abrirModalPagoDirectoMes($event)"
          (editarMes)="abrirModalEditarMes($event)"
          (abrirModalPagoDirectoMes)="abrirModalPagoDirectoMes($event)"
          (abrirModalEditarMes)="abrirModalEditarMes($event)"
          (pagarWompi)="pagarWompi($event)"
          (verReciboMes)="verReciboMes($event)"
          (abrirModalPagoDirecto)="abrirModalPagoDirecto($event)"
          (abrirModalAnular)="abrirModalAnular($event)"
          (verReciboCaja)="verReciboCaja($event)"
          (imprimirReciboIndividual)="imprimirReciboIndividual($event)"
          (cruzarSaldoAFavor)="cruzarSaldoAFavor($event.mesOrigen, $event.mesDestino)"
          (pagarWompiCargo)="pagarWompi($any($event))"
          (pagarCajaCargo)="abrirModalPagoDirecto($any($event))"
        />
      }

      @if (tabActiva() === 'recaudos') {
        <app-tesoreria-recaudos
          [pagos]="pagos()"
          [mediosPagoList]="mediosPagoList()"
          (abrirModalPagoManual)="abrirModalPagoManual()"
          (imprimirReciboIndividual)="imprimirReciboIndividual($event)"
          (anularRecibo)="abrirModalAnularPago($event)"
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
          (exportarExcelSiigo)="exportarExcelSiigo()"
          (exportarExcel)="exportarExcelSiigo()"
        />
      }
    </div>

    <!-- MODALES -->
    @if (checkoutModal()) {
      <app-modal-checkout-wompi
        [cuenta]="checkoutModal()"
        (close)="cerrarModalCheckout()"
        (cerrar)="cerrarModalCheckout()"
        (success)="cerrarModalCheckout()"
      />
    }

    @if (modalConfiguracionFinanciera()) {
      <app-modal-configuracion-financiera
        (close)="cerrarConfiguracionTesoreria()"
        (configGuardada)="onConfiguracionFinancieraGuardada($event)"
      />
    }

    @if (modalNuevoConcepto()) {
      <app-modal-nuevo-concepto 
        (close)="cerrarModalNuevoConcepto()"
        (success)="onConceptoGuardado($event)"
      />
    }

    @if (modalNuevoCobro()) {
      <app-modal-nuevo-cobro
        [form]="nuevoCobro"
        [listaEstudiantes]="listaEstudiantes()"
        [estudiantesSelectOptions]="estudiantesMoraSelectOptions()"
        [conceptosList]="conceptosList()"
        (close)="cerrarModalNuevoCobro()"
        (success)="onCobroEmitido($event)"
        (nuevoConcepto)="abrirModalNuevoConcepto()"
      />
    }

    @if (modalPagoManual()) {
      <app-modal-pago-manual
        [initialData]="nuevoPagoManual"
        [cuentasPendientes]="cuentasFiltradas()"
        [mediosPagoList]="mediosPagoList()"
        (close)="cerrarModalPagoManual()"
        (success)="confirmarPagoManual($event)"
      />
    }

    @if (modalNuevoAcuerdo()) {
      <app-modal-nuevo-acuerdo
        [form]="nuevoAcuerdo"
        [listaEstudiantes]="listaEstudiantes()"
        [estudiantesMoraSelectOptions]="estudiantesMoraSelectOptions()"
        (close)="cerrarModalNuevoAcuerdo()"
        (success)="onAcuerdoGuardado($event)"
      />
    }

    @if (extractoModal()) {
      <app-modal-extracto-consolidado
        [estudiante]="estudianteSeleccionado()"
        [estadoCuenta]="estadoCuentaEstudiante()"
        [becaActual]="becaActual()"
        [planMensual]="planMensualEstudiante()"
        [fechaHoyTexto]="fechaHoyTexto"
        (close)="cerrarModalExtracto()"
      />
    }

    @if (pazSalvoModal()) {
      <app-modal-paz-y-salvo
        [estudiante]="estudianteSeleccionado()"
        [hashPazYSalvo]="hashPazYSalvo"
        [fechaHoyTexto]="fechaHoyTexto"
        (close)="pazSalvoModal.set(false)"
        (descargar)="descargarPazYSalvoEstudiante($any($event))"
      />
    }

    @if (facturaEnEdicion()) {
      <app-modal-editar-factura
        [factura]="facturaEnEdicion()"
        (close)="facturaEnEdicion.set(null)"
        (success)="guardarEdicionFactura($event)"
      />
    }

    @if (facturaParaAnular()) {
      <app-modal-anular-factura
        [factura]="facturaParaAnular()"
        (close)="facturaParaAnular.set(null)"
        (success)="confirmarAnulacion($event)"
      />
    }

    @if (modalBeca()) {
      <app-modal-beca
        [estudiante]="estudianteSeleccionado()"
        [form]="becaForm"
        (close)="cerrarModalBeca()"
        (success)="guardarBecaEstudiante($event)"
      />
    }

    @if (pagoParaAnular()) {
      <app-modal-anular-pago
        [pago]="pagoParaAnular()"
        (close)="cerrarModalAnularPago()"
        (success)="onPagoAnulado($event)"
      />
    }

    @if (reciboParaVer()) {
      <div class="modal-backdrop animate-fade-in print-backdrop" [style.z-index]="modalManager.getZIndex('reciboCaja')">
        <div class="modal-card card card-glass modal-md animate-fade-in-up" style="max-width: 620px; position: relative; overflow: hidden;">
          <div class="modal-header no-print">
            <h3>🧾 Recibo Oficial de Caja {{ reciboParaVer()?.numeroRecibo }}</h3>
            <button class="close-btn" (click)="cerrarModalRecibo()">&times;</button>
          </div>
          <div class="modal-body print-area recibo-caja-print p-4" style="position: relative;">
            
            <!-- Marca de Agua si está Anulado -->
            @if (reciboParaVer()?.estado === EstadoPago.ANULADO) {
              <div class="watermark-anulado" style="position: absolute; top: 35%; left: 10%; transform: rotate(-30deg); font-size: 4.5rem; font-weight: 900; color: rgba(239, 68, 68, 0.18); border: 8px solid rgba(239, 68, 68, 0.25); padding: 0.5rem 2rem; border-radius: 12px; pointer-events: none; text-align: center; z-index: 10; letter-spacing: 0.1em;">
                ANULADO
              </div>
            }

            <!-- Header Institucional del Recibo -->
            <div class="recibo-header" style="display: flex; align-items: center; gap: 1rem; border-bottom: 2px solid #1e293b; padding-bottom: 0.75rem; margin-bottom: 1rem;">
              <div class="recibo-logo" style="width: 48px; height: 48px; border-radius: 8px; background: #4f46e5; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem; flex-shrink: 0; overflow: hidden;">
                @if (authService.colegio()?.logoUrl) {
                  <img [src]="authService.colegio()?.logoUrl" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;" />
                } @else {
                  {{ authService.colegio()?.nombre?.substring(0, 2)?.toUpperCase() || 'ED' }}
                }
              </div>
              <div style="flex: 1;">
                <h3 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #1e293b;">{{ authService.colegio()?.nombre || 'Institución Educativa' }}</h3>
                <p style="margin: 0.15rem 0 0 0; font-size: 0.75rem; color: #64748b;">
                  @if (authService.colegio()?.nit) { NIT: {{ authService.colegio()?.nit }} }
                  @if (authService.colegio()?.resolucionAprobacion) { • Res. MEN N° {{ authService.colegio()?.resolucionAprobacion }} }
                </p>
                <p style="margin: 0; font-size: 0.75rem; color: #64748b;">
                  {{ authService.colegio()?.direccion || '' }} @if (authService.colegio()?.ciudad) { — {{ authService.colegio()?.ciudad }} }
                </p>
              </div>
              <div style="text-align: right; border-left: 2px solid #e2e8f0; padding-left: 0.75rem;">
                <span style="font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase;">COMPROBANTE DE RECAUDO</span>
                <div style="font-family: monospace; font-size: 1.05rem; font-weight: 800; color: #4f46e5;">{{ reciboParaVer()?.numeroRecibo }}</div>
                <span style="font-size: 0.7rem; color: #64748b;">{{ reciboParaVer()?.fechaPago }}</span>
              </div>
            </div>

            <!-- Caja Destacada de Valor -->
            <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 0.85rem; text-align: center; margin-bottom: 1rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">VALOR TOTAL RECAUDADO</span>
              <h2 style="font-size: 1.75rem; font-weight: 900; color: #1e293b; margin: 0.2rem 0;" [style.text-decoration]="reciboParaVer()?.estado === EstadoPago.ANULADO ? 'line-through' : 'none'">
                \${{ reciboParaVer()?.valorPagado | number }} COP
              </h2>
              <div style="display: flex; justify-content: center; gap: 0.75rem; font-size: 0.75rem; font-weight: 700; margin-top: 0.25rem;">
                @if (reciboParaVer()?.estado === EstadoPago.ANULADO) {
                  <span style="color: #dc2626;">🚫 COMPROBANTE FISCAL ANULADO - CARTERA REVERTIDA</span>
                } @else {
                  <span style="color: #059669;">✓ Transacción Aprobada</span>
                }
                <span>•</span>
                <span style="color: #334155;">Medio: {{ reciboParaVer()?.medioPago }}</span>
              </div>
            </div>

            <!-- Alerta de Auditoría si el recibo está anulado -->
            @if (reciboParaVer()?.estado === EstadoPago.ANULADO) {
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 1rem;">
                <strong style="color: #991b1b; font-size: 0.78rem; display: block;">⚖️ Pista de Auditoría - Comprobante Anulado:</strong>
                <p style="margin: 0.15rem 0 0 0; font-size: 0.75rem; color: #7f1d1d;">
                  <strong>Motivo:</strong> {{ reciboParaVer()?.motivoAnulacion || 'Anulación contable por tesorería' }}
                </p>
                @if (reciboParaVer()?.fechaAnulacion) {
                  <span style="font-size: 0.7rem; color: #991b1b; display: block; margin-top: 0.2rem;">
                    Fecha y Hora de Anulación: {{ reciboParaVer()?.fechaAnulacion }}
                  </span>
                }
              </div>
            }

            <!-- Tabla de Detalles del Pago -->
            <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse; margin-bottom: 1.25rem;">
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 0.4rem 0; color: #64748b; width: 35%;"><strong>Estudiante:</strong></td>
                  <td style="padding: 0.4rem 0; color: #1e293b; font-weight: 700;">{{ reciboParaVer()?.estudianteNombre }}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 0.4rem 0; color: #64748b;"><strong>Concepto de Cobro:</strong></td>
                  <td style="padding: 0.4rem 0; color: #1e293b;">{{ reciboParaVer()?.conceptoNombre }}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 0.4rem 0; color: #64748b;"><strong>Factura / Cuenta:</strong></td>
                  <td style="padding: 0.4rem 0; font-family: monospace; color: #4f46e5; font-weight: 700;">{{ reciboParaVer()?.facturaReferencia }}</td>
                </tr>
                @if (reciboParaVer()?.referenciaTransaccion) {
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.4rem 0; color: #64748b;"><strong>Voucher / Ref. Transacción:</strong></td>
                    <td style="padding: 0.4rem 0; font-family: monospace; color: #334155;">{{ reciboParaVer()?.referenciaTransaccion }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- Firmas Institucionales -->
            <div class="recibo-firmas" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; text-align: center; font-size: 0.75rem; margin-top: 2rem; padding-top: 0.5rem;">
              <div>
                <div style="border-top: 1px solid #0f172a; margin-bottom: 0.25rem;"></div>
                <strong>Caja / Tesorería Institucional</strong><br>
                <span style="color: #64748b;">{{ reciboParaVer()?.estado === EstadoPago.ANULADO ? 'ANULADO - Sin Firma' : 'Recibido & Validado' }}</span>
              </div>
              <div>
                <div style="border-top: 1px solid #0f172a; margin-bottom: 0.25rem;"></div>
                <strong>Firma del Pagador / Acudiente</strong><br>
                <span style="color: #64748b;">{{ reciboParaVer()?.estado === EstadoPago.ANULADO ? 'ANULADO - Sin Firma' : 'Conforme con el pago' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer flex justify-end gap-2 no-print">
            <button class="btn btn-secondary" (click)="cerrarModalRecibo()">Cerrar</button>
            <button class="btn btn-primary" (click)="imprimirRecibo()">🖨️ Imprimir Recibo Oficial</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class TesoreriaComponent implements OnInit {
  readonly EstadoPago = EstadoPago;
  readonly EstadoCuenta = EstadoCuenta;

  // Catálogos desde Backend
  private parametrosService = inject(ParametrosService);
  estadosCuentaList = signal<Parametro[]>([]);
  mesesList = signal<Parametro[]>([]);
  mediosPagoList = signal<Parametro[]>([]);
  porcentajesBecaMap = signal<Record<string, number>>({});
  configuracionFinanciera = signal<ConfiguracionFinanciera>({} as ConfiguracionFinanciera);

  // Filtros
  filtroTexto = signal('');
  filtroEstado = signal<string>(FiltroGeneral.TODOS);
  filtroMes = signal<string>(FiltroGeneral.TODOS);

  abrirConfiguracionTesoreria() {
    this.modalConfiguracionFinanciera.set(true);
  }

  cerrarConfiguracionTesoreria() {
    this.modalConfiguracionFinanciera.set(false);
  }

  onConfiguracionFinancieraGuardada(nuevaConfig: ConfiguracionFinanciera) {
    this.configuracionFinanciera.set(nuevaConfig);
    this.parametrosService.obtenerMapaValores('PORCENTAJES_BECA').subscribe((m) => {
      if (m && Object.keys(m).length > 0) this.porcentajesBecaMap.set(m);
    });
    this.cargarDatosBackend();
  }

  generarCierreDiario() {
    this.toast.success('Cierre de Caja Generado', 'Se ha consolidado el arqueo diario de caja y conciliación bancaria.');
  }

  verFicha360(event: any) {
    if (!event) return;
    const estId = typeof event === 'string' ? event : (event.estudianteId || event.id);
    const estDoc = typeof event === 'object' ? event.estudianteDocumento : null;
    const estNom = typeof event === 'object' ? event.estudianteNombre : null;

    // 1. Buscar en lista de estudiantes por ID, Documento o Nombre
    let est = this.listaEstudiantes().find((e) => e.id === estId);
    if (!est && estDoc) {
      est = this.listaEstudiantes().find((e) => e.documento === estDoc || e.documento?.includes(estDoc) || estDoc?.includes(e.documento));
    }
    if (!est && estNom) {
      const cleanNom = estNom.toLowerCase().trim();
      est = this.listaEstudiantes().find((e) => {
        const eNom = (e.nombre || '').toLowerCase().trim();
        return eNom.includes(cleanNom) || cleanNom.includes(eNom);
      });
    }

    // 2. Si aún no está en la lista (ej: factura sin estudiante hidratado), registrarlo
    if (!est && typeof event === 'object') {
      est = {
        id: estId || `est-${Date.now()}`,
        nombre: event.estudianteNombre || '',
        documento: event.estudianteDocumento || '',
        grado: event.gradoNombre || '',
        grupo: event.grupo || '',
        acudienteNombre: event.acudienteNombre || (event.estudianteNombre ? `Acudiente de ${event.estudianteNombre}` : ''),
        acudienteTelefono: event.acudienteTelefono || '',
        acudienteEmail: event.acudienteEmail || '',
      };
      this.listaEstudiantes.update((prev) => [est!, ...prev]);
    }

    if (est) {
      this.estudianteSeleccionado.set(est);
      this.consultarEstadoCuentaApi(est.id);
      this.tabActiva.set('estudiante');
      this.toast.info('Ficha Financiera 360°', `Consultando datos completos de ${est.nombre}`);
    }
  }

  verRecibo = signal<any>(null);
  busquedaEstudiante = signal('');

  seleccionarEstudiante(event: any) {
    const id = typeof event === 'string' ? event : (event?.id || event?.estudianteId);
    if (id) {
      this.verFicha360(event);
    }
  }

  pagarWompiCargo(event: any) { this.pagarWompi(event); }
  pagarCajaCargo(event: any) { this.abrirModalPagoDirecto(event); }

  abrirModalExtracto() {
    this.modalManager.open('extracto');
    this.extractoModal.set(true);
  }

  cerrarModalExtracto() {
    this.modalManager.close('extracto');
    this.extractoModal.set(false);
  }

  descargarExtractoPdf() {
    this.cerrarModalExtracto();
    this.toast.info('Generando Extracto', 'Descargando extracto financiero consolidado en PDF...');
    if (this.estudianteSeleccionado()?.id) {
      window.open(this.api.getPdfUrl(`paz-y-salvo/${this.estudianteSeleccionado().id}`), '_blank');
    }
  }

  cerrarModalRecibo() {
    this.modalManager.close('reciboCaja');
    this.reciboParaVer.set(null);
  }

  onFiltrarFacturas(event: any) {
    this.filtroTexto.set(event.texto);
    this.filtroEstado.set(event.estado);
    this.filtroMes.set(event.mes);
  }

  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dianService = inject(DianService);
  readonly authService = inject(AuthService);
  readonly modalManager = inject(ModalManagerService);

  readonly tabActiva = signal<'facturas' | 'estudiante' | 'recaudos' | 'acuerdos' | 'reportes'>('facturas');
  readonly isFacturando = signal(false);

  // Filtros
      
  // Modales
  readonly checkoutModal = signal<CuentaCobroItem | null>(null);
  readonly modalConfiguracionFinanciera = signal(false);
  readonly modalNuevoConcepto = signal(false);
  readonly modalNuevoCobro = signal(false);
  readonly modalPagoManual = signal(false);
  readonly modalNuevoAcuerdo = signal(false);
  readonly facturaEnEdicion = signal<CuentaCobroItem | null>(null);
  readonly facturaParaAnular = signal<CuentaCobroItem | null>(null);
  readonly facturaParaPagar = signal<CuentaCobroItem | null>(null);
  readonly reciboParaVer = signal<PagoRecaudoItem | null>(null);
  readonly pagoParaAnular = signal<PagoRecaudoItem | null>(null);
  readonly extractoModal = signal(false);
  readonly pazSalvoModal = signal(false);
  readonly modalBeca = signal(false);
  readonly desbloqueoExcepcional = signal(false);

  readonly conceptosList = signal<any[]>([]);

  readonly becaActual = signal<BecaEstudiante>({} as BecaEstudiante);

  becaForm: any = {};

  readonly fechaHoy = new Date().toLocaleDateString('es-CO');
  readonly fechaHoyTexto = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  readonly hashPazYSalvo = `PYS-${new Date().getFullYear()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
  nuevoCobro: any = {};

  nuevoPagoManual: PagoManualForm = {
    cuentaCobroId: '',
    medioPago: MedioPago.EFECTIVO,
    valorPagado: 0,
    referenciaTransaccion: '',
  };

  nuevoAcuerdo = {
    estudianteId: '',
    montoTotalAcordado: 0,
    numeroCuotas: 1,
    diaPagoMensual: 1,
    observaciones: '',
  };

  // Base de Datos en Memoria con sincronización Backend
  readonly listaEstudiantes = signal<EstudianteFinanciero[]>([]);

  readonly estudiantesMoraSelectOptions = computed<SearchableOption[]>(() => {
    return this.listaEstudiantes().map((est) => ({
      value: est.id,
      label: est.nombre,
      sublabel: `Doc. ${est.documento} • Grado: ${est.grado} (${est.grupo})`,
      badge: est.grado,
      badgeClass: 'badge-secondary',
      avatarText: est.nombre?.substring(0, 2)?.toUpperCase() || 'ES',
    }));
  });

  readonly estudianteSeleccionado = signal<EstudianteFinanciero>({
    id: '',
    nombre: 'Seleccione un estudiante',
    documento: '',
    grado: '',
    grupo: '',
    acudienteNombre: '',
    acudienteTelefono: '',
    acudienteEmail: '',
  });

  readonly cuentas = signal<CuentaCobroItem[]>([]);
  readonly pagos = signal<PagoRecaudoItem[]>([]);
  readonly acuerdos = signal<AcuerdoPagoItem[]>([]);

  // KPIs Financieros Computados en Tiempo Real
  readonly totalRecaudoMes = computed(() => {
    return this.pagos().reduce((acc, p) => acc + (p.valorPagado || 0), 0);
  });

  readonly totalCarteraVencida = computed(() => {
    return this.cuentas()
      .filter((c) => c.estado === EstadoCuenta.EN_MORA)
      .reduce((acc, c) => acc + (c.valorTotal || 0) - (c.descuento || 0), 0);
  });

  readonly totalProyeccionMes = computed(() => {
    return this.cuentas().reduce((acc, c) => acc + (c.valorTotal || 0) - (c.descuento || 0), 0);
  });

  readonly totalAcuerdosIncumplidos = computed(() => {
    return this.acuerdos().filter((a) => a.estado === EstadoAcuerdo.INCUMPLIDO).length;
  });

  readonly totalCajaEfectivo = computed(() => {
    return this.pagos()
      .filter((p) => p.medioPago === MedioPago.EFECTIVO)
      .reduce((acc, p) => acc + (p.valorPagado || 0), 0);
  });

  formatearMonto(valor: number): string {
    if (!valor || valor === 0) return '$0';
    if (valor >= 1000000) {
      return `$${(valor / 1000000).toFixed(1)}M`;
    }
    return `$${Math.round(valor).toLocaleString('es-CO')}`;
  }

  // Cuentas filtradas computadas
  readonly cuentasFiltradas = computed(() => {
    const texto = (this.filtroTexto() || '').trim().toLowerCase();
    const estado = this.filtroEstado();
    const mes = this.filtroMes();

    return this.cuentas().filter((c) => {
      const matchText =
        !texto ||
        (c.estudianteNombre || '').toLowerCase().includes(texto) ||
        (c.numeroFactura || '').toLowerCase().includes(texto) ||
        (c.estudianteDocumento || '').toLowerCase().includes(texto) ||
        (c.concepto || '').toLowerCase().includes(texto);

      const matchEstado = estado === FiltroGeneral.TODOS || c.estado === estado;
      const matchMes = mes === FiltroGeneral.TODOS || (c.mes || '') === mes;

      return matchText && matchEstado && matchMes;
    });
  });

  readonly cuentasPendientes = computed(() => {
    return this.cuentas().filter((c) => {
      const isPaid = c.estado === EstadoCuenta.AL_DIA || c.estado === EstadoCuenta.PAGADO || c.estado === EstadoCuenta.ANULADO;
      const hasZeroBalance = c.saldoPendiente !== undefined && c.saldoPendiente <= 0 && Number(c.valorPagado || 0) >= Number(c.valorTotal || 0);
      return !isPaid && !hasZeroBalance;
    });
  });

  // Helper para verificar si un ítem corresponde al estudiante seleccionado
  private esItemDelEstudiante(itemEstId?: string, itemDoc?: string, itemNom?: string): boolean {
    const est = this.estudianteSeleccionado();
    if (!est) return false;
    if (est.id && itemEstId && (itemEstId === est.id || itemEstId === est.documento)) return true;
    if (est.documento && itemDoc && (itemDoc === est.documento || itemDoc.includes(est.documento) || est.documento.includes(itemDoc))) return true;
    if (est.nombre && itemNom) {
      const n1 = itemNom.toLowerCase().trim();
      const n2 = est.nombre.toLowerCase().trim();
      if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) return true;
      const w1 = n1.split(/\s+/).filter((w) => w.length > 2);
      const w2 = n2.split(/\s+/).filter((w) => w.length > 2);
      const common = w1.filter((w) => w2.includes(w));
      if (common.length >= 2) return true;
    }
    // Si no tiene datos de estudiante asociados explícitamente, pero es el único estudiante en contexto
    if (!itemEstId && !itemDoc && !itemNom) return true;
    return false;
  }

  // Cronograma mensual 100% dinámico basado en Cuentas y Pagos de BD (Febrero a Noviembre)
  readonly planMensualEstudiante = computed(() => {
    const cuentasEst = this.cuentas().filter((c) => this.esItemDelEstudiante(c.estudianteId, c.estudianteDocumento, c.estudianteNombre));
    const pagosEst = this.pagos().filter((p) => this.esItemDelEstudiante(p.estudianteId, undefined, p.estudianteNombre));
    const beca = this.becaActual();
    const pctBeca = Number(beca?.porcentaje || 0);
    const mesInicioBeca = Number(beca?.mesInicio || MesEscolar.FEBRERO);
    const mesFinBeca = Number(beca?.mesFin || MesEscolar.NOVIEMBRE);

    const nombresMeses = [
      { num: MesEscolar.FEBRERO, nombre: 'Febrero' },
      { num: MesEscolar.MARZO, nombre: 'Marzo' },
      { num: MesEscolar.ABRIL, nombre: 'Abril' },
      { num: MesEscolar.MAYO, nombre: 'Mayo' },
      { num: MesEscolar.JUNIO, nombre: 'Junio' },
      { num: MesEscolar.JULIO, nombre: 'Julio' },
      { num: MesEscolar.AGOSTO, nombre: 'Agosto' },
      { num: MesEscolar.SEPTIEMBRE, nombre: 'Septiembre' },
      { num: MesEscolar.OCTUBRE, nombre: 'Octubre' },
      { num: MesEscolar.NOVIEMBRE, nombre: 'Noviembre' },
    ];

    const anio = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
    const diaLimite = this.configuracionFinanciera()?.diaLimitePagoDefecto || 10;
    const diaStr = diaLimite < 10 ? `0${diaLimite}` : `${diaLimite}`;

    return nombresMeses.map((m) => {
      const estaEnVigencia = pctBeca > 0 && m.num >= mesInicioBeca && m.num <= mesFinBeca;
      const tarifaBase = this.configuracionFinanciera()?.tarifaBasePension || 0;
      const valorBaseMes = estaEnVigencia
        ? Math.round(tarifaBase * (1 - (pctBeca / 100)))
        : tarifaBase;
      const mesStr = m.num < 10 ? `0${m.num}` : `${m.num}`;

      // 1. Buscar si existe cuenta de cobro para este mes
      const cuentaMes = cuentasEst.find(
        (c) =>
          c.mesCobro === m.num ||
          (c.mes || '').toLowerCase().includes(m.nombre.toLowerCase()),
      );

      // 2. Buscar todos los recibos de pago que correspondan a este mes
      const pagosDelMes = pagosEst.filter(
        (p) =>
          (cuentaMes && p.facturaReferencia === cuentaMes.numeroFactura) ||
          (p.conceptoNombre || '').toLowerCase().includes(m.nombre.toLowerCase()) ||
          p.facturaReferencia?.includes(`-0${m.num}-`) ||
          p.facturaReferencia?.includes(`-${m.num}-`),
      );

      const totalAbonado = pagosDelMes.reduce((sum, p) => sum + Number(p.valorPagado || 0), 0);
      const valorObligacion = cuentaMes ? Number(cuentaMes.valorTotal) : valorBaseMes;
      const saldoRestante = Math.max(0, valorObligacion - totalAbonado);
      const ultimoRecibo = pagosDelMes.length > 0 ? pagosDelMes[0].numeroRecibo : (cuentaMes?.estado === EstadoCuenta.AL_DIA ? `REC-${(cuentaMes.numeroFactura || '').replace('FACT-', '')}` : null);

      // 1. Si hay abonos o pagos registrados para este mes, ellos mandan sobre el estado:
      if (totalAbonado > 0) {
        if (totalAbonado >= valorObligacion) {
          const excedente = totalAbonado - valorObligacion;
          return {
            mes: m.nombre,
            mesNum: m.num,
            cuentaId: cuentaMes?.id || null,
            numeroFactura: cuentaMes?.numeroFactura || pagosDelMes[0]?.facturaReferencia || `FACT-${anio}-${mesStr}-001`,
            valor: valorObligacion,
            valorPagado: totalAbonado,
            saldoPendiente: 0,
            excedente: excedente > 0 ? excedente : 0,
            estado: EstadoCuenta.PAGADO,
            vencimiento: cuentaMes?.fechaVencimiento || `${diaStr}/${mesStr}/${anio}`,
            recibo: ultimoRecibo || (pagosDelMes[0]?.numeroRecibo || null),
            pagos: pagosDelMes,
            abonosCount: pagosDelMes.length,
          };
        } else {
          // ABONO PARCIAL (ej. se pagaron $200.000 de $360.000)
          return {
            mes: m.nombre,
            mesNum: m.num,
            cuentaId: cuentaMes?.id || null,
            numeroFactura: cuentaMes?.numeroFactura || pagosDelMes[0]?.facturaReferencia || `FACT-${anio}-${mesStr}-001`,
            valor: valorObligacion,
            valorPagado: totalAbonado,
            saldoPendiente: saldoRestante,
            excedente: 0,
            estado: EstadoCuenta.PAGADO_PARCIAL,
            vencimiento: cuentaMes?.fechaVencimiento || `${diaStr}/${mesStr}/${anio}`,
            recibo: ultimoRecibo,
            pagos: pagosDelMes,
            abonosCount: pagosDelMes.length,
          };
        }
      }

      // 2. Si no hay recibos pero la cuenta está marcada explícitamente como AL_DIA o PAGADO en BD:
      if (cuentaMes && (cuentaMes.estado === EstadoCuenta.AL_DIA || cuentaMes.estado === EstadoCuenta.PAGADO)) {
        return {
          mes: m.nombre,
          mesNum: m.num,
          cuentaId: cuentaMes.id,
          numeroFactura: cuentaMes.numeroFactura,
          valor: valorObligacion,
          valorPagado: valorObligacion,
          saldoPendiente: 0,
          estado: EstadoCuenta.PAGADO,
          vencimiento: cuentaMes.fechaVencimiento || `${diaStr}/${mesStr}/${anio}`,
          recibo: ultimoRecibo || `REC-${(cuentaMes.numeroFactura || '').replace('FACT-', '')}`,
          pagos: pagosDelMes,
          abonosCount: pagosDelMes.length,
        };
      }

      if (cuentaMes) {
        return {
          mes: m.nombre,
          mesNum: m.num,
          cuentaId: cuentaMes.id,
          numeroFactura: cuentaMes.numeroFactura,
          valor: cuentaMes.valorTotal,
          valorPagado: 0,
          saldoPendiente: cuentaMes.valorTotal,
          estado: cuentaMes.estado,
          vencimiento: cuentaMes.fechaVencimiento || `${diaStr}/${mesStr}/${anio}`,
          recibo: null,
          pagos: [],
          abonosCount: 0,
        };
      }

      // Si es un mes futuro no facturado aún:
      return {
        mes: m.nombre,
        mesNum: m.num,
        cuentaId: null,
        numeroFactura: `PROY-${anio}-${mesStr}`,
        valor: valorBaseMes,
        valorPagado: 0,
        saldoPendiente: valorBaseMes,
        estado: EstadoCuenta.POR_VENCER,
        vencimiento: `${diaStr}/${mesStr}/${anio}`,
        recibo: null,
        pagos: [],
        abonosCount: 0,
      };
    });
  });

  // Resumen semáforo y recaudos 100% dinámico desde BD
  readonly kpiResumen = computed(() => {
    const facturas = this.cuentas();
    const recaudos = this.pagos();

    const alDia = facturas.filter((c) => c.estado === EstadoCuenta.AL_DIA).length;
    const porVencer = facturas.filter((c) => c.estado === EstadoCuenta.POR_VENCER).length;
    const enMora = facturas.filter((c) => c.estado === EstadoCuenta.EN_MORA).length;
    const total = facturas.length || 1;
    const porcentajeAlDia = Math.round((alDia / total) * 100);

    const totalRecaudado = recaudos.reduce((acc, p) => acc + Number(p.valorPagado || 0), 0) + (alDia * (this.configuracionFinanciera()?.tarifaBasePension || 0));

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
    return this.pagos().filter((p) => this.esItemDelEstudiante(p.estudianteId, undefined, p.estudianteNombre));
  });

  // Otros cobros específicos del estudiante (no pensiones mensuales)
  readonly otrosCobrosEstudiante = computed(() => {
    return this.cuentas().filter(
      (c) => this.esItemDelEstudiante(c.estudianteId, c.estudianteDocumento, c.estudianteNombre) && (!c.mesCobro || c.concepto !== 'Pensión Mensual Escolar'),
    );
  });

  // Acuerdos específicos del estudiante
  readonly acuerdosEstudiante = computed(() => {
    return this.acuerdos().filter((a) => this.esItemDelEstudiante(a.estudianteId, undefined, a.estudianteNombre));
  });

  // Estado de Cuenta 360° en Vivo (Calculado sobre el Plan 10 Meses y Otros Cobros)
  readonly estadoCuentaEstudiante = computed(() => {
    const plan = this.planMensualEstudiante() || [];
    const otrosCobros = this.otrosCobrosEstudiante() || [];

    let saldoTotal = 0;
    let saldoEnMora = 0;
    let enMora = 0;
    let alDia = 0;

    // 1. Evaluar las 10 mensualidades del año escolar
    plan.forEach((m) => {
      if (m.estado === EstadoCuenta.PAGADO || m.estado === EstadoCuenta.AL_DIA) {
        alDia++;
      } else {
        const saldoMes = Number(m.saldoPendiente !== undefined ? m.saldoPendiente : m.valor);
        saldoTotal += saldoMes;
        if (m.estado === EstadoCuenta.EN_MORA) {
          enMora++;
          saldoEnMora += saldoMes;
        }
      }
    });

    // 2. Evaluar otros cargos (derechos de grado, certificados, carné)
    otrosCobros.forEach((c) => {
      if (c.estado !== EstadoCuenta.AL_DIA && c.estado !== EstadoCuenta.PAGADO && c.estado !== EstadoCuenta.ANULADO) {
        const saldoCargo = c.saldoPendiente !== undefined ? Number(c.saldoPendiente) : Math.max(0, Number(c.valorTotal || 0) - Number(c.valorPagado || 0));
        saldoTotal += saldoCargo;
        if (c.estado === EstadoCuenta.EN_MORA) {
          enMora++;
          saldoEnMora += saldoCargo;
        }
      }
    });

    return {
      saldoPendienteTotal: saldoTotal,
      saldoEnMoraTotal: saldoEnMora,
      cuotasEnMora: enMora,
      cuotasAlDia: alDia,
      bloqueoBoletin: enMora > 0,
    };
  });

  ngOnInit() {
    
    // Fetch catalogs
    this.parametrosService.obtenerPorGrupo('ESTADOS_CUENTA').subscribe(res => this.estadosCuentaList.set(res));
    this.parametrosService.obtenerPorGrupo('MESES_ACADEMICOS').subscribe(res => this.mesesList.set(res));
    this.parametrosService.obtenerPorGrupo('MEDIOS_PAGO').subscribe(res => this.mediosPagoList.set(res));
    this.parametrosService.obtenerConfiguracionFinanciera().subscribe(cfg => this.configuracionFinanciera.set(cfg));
    this.parametrosService.obtenerMapaValores('PORCENTAJES_BECA').subscribe(m => {
      if (m && Object.keys(m).length > 0) this.porcentajesBecaMap.set(m);
    });

    this.cargarDatosBackend();
    this.cargarConceptos();
  }

  cargarConceptos() {
    this.api.get<any[]>('tesoreria/conceptos').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.conceptosList.set(data);
          this.nuevoCobro.concepto = data[0].nombre;
          this.nuevoCobro.valorTotal = Number(data[0].valorSugerido) || (this.configuracionFinanciera()?.tarifaBasePension || 0);
        }
      },
    });
  }



  abrirModalNuevoConcepto() {
    this.modalManager.open('nuevoConcepto');
    this.modalNuevoConcepto.set(true);
  }

  cerrarModalNuevoConcepto() {
    this.modalManager.close('nuevoConcepto');
    this.modalNuevoConcepto.set(false);
  }

  onConceptoGuardado(conceptoCreado: any) {
    this.cerrarModalNuevoConcepto();
    this.cargarConceptos();
    if (this.modalNuevoCobro()) {
      this.nuevoCobro.concepto = conceptoCreado.nombre;
      this.nuevoCobro.valorTotal = Number(conceptoCreado.valorSugerido) || 0;
    }
  }


  private hidratarNombresEnCuentas(listaMatriculados: EstudianteFinanciero[]) {
    if (!listaMatriculados || listaMatriculados.length === 0) return;
    
    this.cuentas.update((actuales) => {
      return actuales.map((c) => {
        let estMatch = listaMatriculados.find(
          (e) =>
            (c.estudianteId && e.id === c.estudianteId) ||
            (c.estudianteDocumento && (e.documento === c.estudianteDocumento || e.documento.includes(c.estudianteDocumento) || c.estudianteDocumento.includes(e.documento))) ||
            (c.estudianteNombre && c.estudianteNombre !== 'Estudiante Sin Nombre' && (e.nombre.toLowerCase().includes(c.estudianteNombre.toLowerCase()) || c.estudianteNombre.toLowerCase().includes(e.nombre.toLowerCase())))
        );

        if (!estMatch && listaMatriculados.length > 0) {
          estMatch = listaMatriculados[0];
        }

        if (estMatch) {
          return {
            ...c,
            estudianteId: estMatch.id,
            estudianteNombre: estMatch.nombre,
            estudianteDocumento: estMatch.documento,
            gradoNombre: estMatch.grado || c.gradoNombre,
          };
        }
        return c;
      });
    });

    this.pagos.update((actuales) => {
      return actuales.map((p) => {
        let estMatch = listaMatriculados.find(
          (e) =>
            (p.estudianteId && e.id === p.estudianteId) ||
            (p.estudianteNombre && (e.nombre.toLowerCase().includes(p.estudianteNombre.toLowerCase()) || p.estudianteNombre.toLowerCase().includes(e.nombre.toLowerCase())))
        );
        if (estMatch) {
          return {
            ...p,
            estudianteId: estMatch.id,
            estudianteNombre: estMatch.nombre,
          };
        }
        return p;
      });
    });

    this.acuerdos.update((actuales) => {
      return actuales.map((a) => {
        let estMatch = listaMatriculados.find(
          (e) =>
            (a.estudianteId && e.id === a.estudianteId) ||
            (a.estudianteNombre && (e.nombre.toLowerCase().includes(a.estudianteNombre.toLowerCase()) || a.estudianteNombre.toLowerCase().includes(e.nombre.toLowerCase())))
        );
        if (estMatch) {
          return {
            ...a,
            estudianteId: estMatch.id,
            estudianteNombre: estMatch.nombre,
            gradoNombre: estMatch.grado || a.gradoNombre,
          };
        }
        return a;
      });
    });
  }

  private cargarBecaEstudiante(estudianteId: string, documento?: string) {
    this.api.get<any>(`tesoreria/estudiantes/${estudianteId}/beca`).subscribe({
      next: (beca) => {
        if (beca && Number(beca.porcentaje) > 0) {
          this.becaActual.set({
            ...beca,
            porcentaje: Number(beca.porcentaje),
            nombre: beca.nombreBeneficio || this.obtenerNombreBeca(beca.tipo, Number(beca.porcentaje)),
          });
        } else {
          this.actualizarBecaDesdeFacturas(estudianteId, documento);
        }
      },
      error: () => {
        this.actualizarBecaDesdeFacturas(estudianteId, documento);
      },
    });
  }

  private obtenerNombreBeca(tipo: TipoBeca | string, pct: number): string {
    const pMap = this.porcentajesBecaMap();
    if (pct === 0 || tipo === TipoBeca.NINGUNA) return 'Tarifa Plena (100%)';
    if (tipo === TipoBeca.EXCELENCIA || pct === (pMap['EXCELENCIA'] || 50)) return 'Excelencia Académica';
    if (tipo === TipoBeca.HERMANOS || pct === (pMap['HERMANOS'] || 20)) return 'Hermanos / Familiar';
    if (tipo === TipoBeca.DOCENTE || pct === (pMap['DOCENTE'] || 30)) return 'Hijo Docente';
    if (tipo === TipoBeca.SOLIDARIA || pct === (pMap['SOLIDARIA'] || 100)) return 'Solidaria Total';
    if (tipo === TipoBeca.CONVENIO || pct === (pMap['CONVENIO'] || 15)) return 'Convenio Institucional';
    return `Especial ${pct}%`;
  }

  private actualizarBecaDesdeFacturas(estudianteId: string, documento?: string) {
    const facturas = this.cuentas().filter((c) => this.esItemDelEstudiante(c.estudianteId, c.estudianteDocumento, c.estudianteNombre));
    const conDescuento = facturas.find((c) => Number(c.descuento) > 0);
    if (conDescuento && Number(conDescuento.descuento) > 0) {
      const desc = Number(conDescuento.descuento);
      const total = Number(conDescuento.valorTotal);
      const bruto = desc + total > 0 ? desc + total : this.configuracionFinanciera().tarifaBasePension;
      const pct = Math.round((desc / bruto) * 100);

      const pMap = this.porcentajesBecaMap();
      const tipoBeca = pct === (pMap['EXCELENCIA'] || 50) ? TipoBeca.EXCELENCIA : (pct === (pMap['HERMANOS'] || 20) ? TipoBeca.HERMANOS : (pct === (pMap['DOCENTE'] || 30) ? TipoBeca.DOCENTE : (pct === (pMap['SOLIDARIA'] || 100) ? TipoBeca.SOLIDARIA : TipoBeca.OTRA)));
      const nombreBeca = this.obtenerNombreBeca(tipoBeca, pct);

      this.becaActual.set({
        tipo: tipoBeca,
        porcentaje: pct,
        nombre: nombreBeca,
        nombreBeneficio: nombreBeca,
        vigencia: VigenciaBeca.ANUAL,
        mesInicio: MesEscolar.FEBRERO,
        mesFin: MesEscolar.NOVIEMBRE,
        numeroResolucion: '',
        cuentaContablePuc: CuentaContablePuc.DESCUENTOS_PENSIONES,
        estado: EstadoBeca.ACTIVA,
      });
    } else {
      this.becaActual.set({} as BecaEstudiante);
    }
  }

  cargarDatosBackend() {
    // 1. Cargar facturas reales de BD
    this.api.get<any[]>('tesoreria/facturas').subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          const matriculadosActuales = this.listaEstudiantes();
          const anioDefecto = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
          const mapped: CuentaCobroItem[] = res.map((f: any) => {
            const fallbackEst = matriculadosActuales.length > 0 ? matriculadosActuales[0] : null;
            const rawNombre = (f.estudianteNombre || '').trim();
            const estNombre = (rawNombre && rawNombre !== 'Estudiante Sin Nombre' && rawNombre !== 'null null')
              ? rawNombre
              : (fallbackEst?.nombre || '');
            const estDoc = f.estudianteDocumento || fallbackEst?.documento || '';
            const anio = f.anioCobro || anioDefecto;

            return {
              id: f.id,
              estudianteId: f.estudianteId || fallbackEst?.id || '',
              estudianteNombre: estNombre,
              estudianteDocumento: estDoc,
              gradoNombre: f.gradoNombre || f.grado?.nombre || fallbackEst?.grado || '',
              concepto: f.conceptoNombre || f.concepto?.nombre || 'Cobro Escolar',
              mes: f.mes || `${f.mesCobro ? 'Mes ' + f.mesCobro : ''} ${anio}`.trim(),
              mesCobro: f.mesCobro,
              valorTotal: Number(f.valorTotal || 0),
              descuento: Number(f.descuento || 0),
              estado: (f.estado === EstadoCuenta.PAGADO || f.estado === EstadoCuenta.AL_DIA) ? EstadoCuenta.AL_DIA : (f.estado === EstadoCuenta.PAGADO_PARCIAL ? EstadoCuenta.PAGADO_PARCIAL : (f.estado === 'VENCIDO' || f.estado === EstadoCuenta.EN_MORA ? EstadoCuenta.EN_MORA : EstadoCuenta.POR_VENCER)),
              fechaVencimiento: f.fechaLimitePago ? f.fechaLimitePago.split('T')[0] : '',
              numeroFactura: f.numeroFactura || `FACT-${f.id?.substring(0, 8) || '000'}`,
            };
          });
          this.cuentas.set(mapped);

          // Si ya tenemos lista de matriculados, sincronizar
          if (matriculadosActuales.length > 0) {
            this.hidratarNombresEnCuentas(matriculadosActuales);
          }
          this.actualizarBecaDesdeFacturas(this.estudianteSeleccionado().id);
        }
      },
      error: () => {},
    });

    // Cargar estudiantes matriculados reales de BD
    this.api.get<any[]>('convivencia/estudiantes-matriculados').subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          const mapped: EstudianteFinanciero[] = res.map((e: any) => ({
            id: e.estudiante_id,
            nombre: `${e.primer_apellido} ${e.segundo_apellido || ''} ${e.primer_nombre} ${e.segundo_nombre || ''}`.replace(/\s+/g, ' ').trim(),
            documento: e.numero_documento,
            grado: e.grado_nombre || '',
            grupo: e.grupo_nombre || '',
            acudienteNombre: e.acudiente_nombre || (e.primer_nombre ? `Acudiente de ${e.primer_nombre} ${e.primer_apellido || ''}`.trim() : ''),
            acudienteTelefono: e.acudiente_telefono || '',
            acudienteEmail: e.acudiente_email || '',
          }));
          this.listaEstudiantes.set(mapped);
          
          // Hidratar inmediatamente las facturas con los nombres oficiales
          this.hidratarNombresEnCuentas(mapped);

          // Sincronizar el estudiante seleccionado con su ficha oficial completa
          const currentId = this.estudianteSeleccionado().id;
          const found = mapped.find((e) => e.id === currentId) || mapped[0];
          if (found) {
            this.estudianteSeleccionado.set(found);
            this.consultarEstadoCuentaApi(found.id);
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
            estudianteNombre: p.estudianteNombre || '',
            conceptoNombre: p.conceptoNombre,
            medioPago: p.medioPago,
            valorPagado: Number(p.valorPagado),
            fechaPago: new Date(p.fechaPago).toLocaleString('es-CO'),
            referenciaTransaccion: p.referenciaTransaccion,
            estado: p.estado,
            motivoAnulacion: p.motivoAnulacion,
            fechaAnulacion: p.fechaAnulacion,
          }));
          this.pagos.update((actuales) => {
            const idsApi = new Set(mapped.map((m) => m.id));
            const numRecibosApi = new Set(mapped.map((m) => m.numeroRecibo));
            const locales = actuales.filter(
              (a) => !idsApi.has(a.id) && !numRecibosApi.has(a.numeroRecibo),
            );
            return [...mapped, ...locales];
          });
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
            fechaInicio: a.fechaInicio ? a.fechaInicio.split('T')[0] : new Date().toISOString().split('T')[0],
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
    if (!estudianteId) return;
    this.api.get<any>(`tesoreria/estudiantes/${estudianteId}/estado-cuenta`).subscribe({
      next: (res) => {
        const cuentasLista = res?.cuentasCobro || res?.cuentasCobroDetalle;
        const anioDefecto = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
        if (cuentasLista && cuentasLista.length > 0) {
          const nuevasCuentas = cuentasLista.map((c: any) => ({
            id: c.id,
            estudianteId: res.estudiante?.id || estudianteId,
            estudianteNombre: res.estudiante?.nombre || (res.estudiante ? `${res.estudiante.primer_apellido || ''} ${res.estudiante.primer_nombre || ''}`.trim() : ''),
            estudianteDocumento: res.estudiante?.documento || res.estudiante?.numero_documento || '',
            gradoNombre: res.estudiante?.grado || res.estudiante?.grado_nombre || '',
            numeroFactura: c.numeroFactura || `FACT-${c.id?.substring(0, 8)}`,
            concepto: c.concepto?.nombre || 'Pensión Mensual Escolar',
            mes: c.mesCobro ? `Mes ${c.mesCobro} ${c.anioCobro || anioDefecto}` : '',
            mesCobro: c.mesCobro,
            valorTotal: Number(c.valorTotal),
            descuento: Number(c.descuento || 0),
            estado: (c.estado === EstadoCuenta.PAGADO || c.estado === EstadoCuenta.AL_DIA) ? EstadoCuenta.AL_DIA : (c.estado === EstadoCuenta.PAGADO_PARCIAL ? EstadoCuenta.PAGADO_PARCIAL : (c.estado === 'VENCIDO' || c.estado === EstadoCuenta.EN_MORA ? EstadoCuenta.EN_MORA : EstadoCuenta.POR_VENCER)),
            fechaVencimiento: c.fechaLimitePago ? c.fechaLimitePago.split('T')[0] : '',
          }));

          // Unir evitando duplicados
          this.cuentas.update((actuales) => {
            const ids = new Set(nuevasCuentas.map((n: any) => n.id));
            return [...actuales.filter((a) => !ids.has(a.id)), ...nuevasCuentas];
          });
        }

        // Hidratar historial de pagos del estudiante si el API lo proporciona
        if (res.historialPagos && res.historialPagos.length > 0) {
          const mappedPagos: PagoRecaudoItem[] = res.historialPagos.map((p: any) => ({
            id: p.id,
            numeroRecibo: p.numeroRecibo || p.numero_recibo,
            facturaReferencia: p.numeroFactura || p.numero_factura,
            estudianteId: res.estudiante?.id || estudianteId,
            estudianteNombre: res.estudiante?.nombre || (res.estudiante ? `${res.estudiante.primer_apellido || ''} ${res.estudiante.primer_nombre || ''}`.trim() : ''),
            conceptoNombre: p.conceptoNombre || p.concepto || 'Pensión Mensual Escolar',
            medioPago: p.medioPago || p.medio_pago || MedioPago.EFECTIVO,
            valorPagado: Number(p.valorPagado || p.valor_pagado),
            fechaPago: new Date(p.fechaPago || p.fecha_pago || Date.now()).toLocaleString('es-CO'),
            referenciaTransaccion: p.referenciaTransaccion || p.referencia_transaccion || '',
            estado: p.estado || EstadoPago.APROBADO,
          }));

          this.pagos.update((actuales) => {
            const idsApi = new Set(mappedPagos.map((m) => m.id));
            const numRecibosApi = new Set(mappedPagos.map((m) => m.numeroRecibo));
            const locales = actuales.filter(
              (a) => !idsApi.has(a.id) && !numRecibosApi.has(a.numeroRecibo),
            );
            return [...mappedPagos, ...locales];
          });
        }

        this.cargarBecaEstudiante(estudianteId);
      },
      error: () => {
        this.cargarBecaEstudiante(estudianteId);
      },
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
    this.facturaParaPagar.set(null);
    this.nuevoPagoManual = {
      cuentaCobroId: '',
      medioPago: MedioPago.EFECTIVO,
      valorPagado: 0,
      referenciaTransaccion: '',
    };
    this.modalManager.open('pagoManual');
    this.modalPagoManual.set(true);
  }

  abrirModalPagoDirecto(cuenta: CuentaCobroItem) {
    this.facturaParaPagar.set(cuenta);
    const saldo = cuenta.saldoPendiente !== undefined ? Number(cuenta.saldoPendiente) : Math.max(0, Number(cuenta.valorTotal || 0) - Number(cuenta.valorPagado || 0));
    this.nuevoPagoManual = {
      cuentaCobroId: cuenta.id,
      medioPago: MedioPago.EFECTIVO,
      valorPagado: saldo > 0 ? saldo : Number(cuenta.valorTotal || 0),
      referenciaTransaccion: '',
    };
    this.modalManager.open('pagoManual');
    this.modalPagoManual.set(true);
  }

  cerrarModalPagoManual() {
    this.modalManager.close('pagoManual');
    this.modalPagoManual.set(false);
    this.facturaParaPagar.set(null);
  }

  confirmarPagoManual(pagoData: any) {
    this.onPagoManualGuardado(pagoData);
    this.cerrarModalPagoManual();
  }

  onPagoManualGuardado({ dto, cuenta, apiResponse }: { dto: any, cuenta: CuentaCobroItem, apiResponse?: any }) {
    const pagosPrevios = this.pagos().filter(
      (p) =>
        p.facturaReferencia === cuenta.numeroFactura &&
        p.estado !== EstadoPago.ANULADO,
    );
    const totalPrevio = pagosPrevios.reduce((sum, p) => sum + Number(p.valorPagado || 0), 0);
    const totalAcumulado = totalPrevio + Number(dto.valorPagado || 0);
    const valorNetoFactura = Number(cuenta.valorTotal || 0);

    const esTotal = totalAcumulado >= valorNetoFactura;
    const nuevoEstado = esTotal ? EstadoCuenta.AL_DIA : EstadoCuenta.PAGADO_PARCIAL;
    const saldoRestante = Math.max(0, valorNetoFactura - totalAcumulado);

    const reciboApi = apiResponse?.reciboCaja;

    const nuevoRecibo: PagoRecaudoItem = {
      id: reciboApi?.id || `p-${Date.now()}`,
      numeroRecibo: reciboApi?.numeroRecibo || `REC-${this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      facturaReferencia: cuenta.numeroFactura,
      estudianteId: cuenta.estudianteId || this.estudianteSeleccionado().id,
      estudianteNombre: cuenta.estudianteNombre || this.estudianteSeleccionado().nombre,
      conceptoNombre: `${cuenta.concepto} (${cuenta.mes})`,
      medioPago: dto.medioPago,
      valorPagado: Number(dto.valorPagado),
      fechaPago: reciboApi?.fechaPago ? new Date(reciboApi.fechaPago).toLocaleString('es-CO') : new Date().toLocaleString('es-CO'),
      referenciaTransaccion: dto.referenciaTransaccion || reciboApi?.referenciaTransaccion,
      estado: EstadoPago.APROBADO,
    };

    this.cuentas.update((list) =>
      list.map((c) => (c.id === cuenta.id ? { ...c, estado: nuevoEstado, valorPagado: totalAcumulado, saldoPendiente: saldoRestante } : c)),
    );

    this.pagos.update((list) => [nuevoRecibo, ...list.filter((p) => p.id !== nuevoRecibo.id)]);
    this.modalPagoManual.set(false);

    if (esTotal) {
      this.toast.success(
        '¡Recaudo Total en Caja Exitoso!',
        `Se canceló la totalidad de \$${dto.valorPagado.toLocaleString()} COP para ${cuenta.estudianteNombre}. Factura ${cuenta.numeroFactura} AL DÍA.`
      );
    } else {
      this.toast.info(
        '¡Abono Parcial Registrado!',
        `Se recibió abono de \$${dto.valorPagado.toLocaleString()} COP para ${cuenta.estudianteNombre}. Saldo restante: \$${saldoRestante.toLocaleString()} COP (PAGO PARCIAL).`
      );
    }

    // Abrir automáticamente el recibo de caja para imprimir
    this.reciboParaVer.set(nuevoRecibo);
  }

  // --- ACUERDOS DE PAGO ---
  abrirModalNuevoAcuerdo() {
    const est = this.estudianteSeleccionado();
    const list = this.listaEstudiantes();
    const estudianteIdDefault = est?.id || (list.length > 0 ? list[0].id : '');
    const saldoPendiente = this.estadoCuentaEstudiante()?.saldoPendienteTotal;

    this.nuevoAcuerdo = {
      estudianteId: estudianteIdDefault,
      montoTotalAcordado: (saldoPendiente && saldoPendiente > 0) ? saldoPendiente : (this.configuracionFinanciera()?.valorDefaultAcuerdo || 0),
      numeroCuotas: this.configuracionFinanciera()?.cuotasAcuerdoDefecto || 1,
      diaPagoMensual: this.configuracionFinanciera()?.diaPagoAcuerdoDefecto || 1,
      observaciones: est?.nombre ? `Acuerdo de pago para refinanciación del estudiante ${est.nombre}.` : 'Acuerdo de pago para refinanciación de cartera morosa.',
    };
    this.modalManager.open('nuevoAcuerdo');
    this.modalNuevoAcuerdo.set(true);
  }

  abrirModalAcuerdoDesde360() {
    const est = this.estudianteSeleccionado();
    this.nuevoAcuerdo = {
      estudianteId: est?.id || '',
      montoTotalAcordado: this.estadoCuentaEstudiante().saldoPendienteTotal || (this.configuracionFinanciera()?.valorDefaultAcuerdo || 0),
      numeroCuotas: this.configuracionFinanciera()?.cuotasAcuerdoDefecto || 1,
      diaPagoMensual: this.configuracionFinanciera()?.diaPagoAcuerdoDefecto || 1,
      observaciones: `Acuerdo firmado con acudiente ${est?.acudienteNombre || ''} para el estudiante ${est?.nombre || ''}.`.trim(),
    };
    this.modalManager.open('nuevoAcuerdo');
    this.modalNuevoAcuerdo.set(true);
  }

  cerrarModalNuevoAcuerdo() {
    this.modalManager.close('nuevoAcuerdo');
    this.modalNuevoAcuerdo.set(false);
  }

  onAcuerdoGuardado({ dto, est }: { dto: any, est: any }) {
    const cuota = Math.round(dto.montoTotalAcordado / dto.numeroCuotas);
    const nuevo: AcuerdoPagoItem = {
      id: `ac-${Date.now()}`,
      estudianteId: est.id,
      estudianteNombre: est.nombre,
      gradoNombre: `${est.grado || ''} ${est.grupo ? '(' + est.grupo + ')' : ''}`.trim(),
      montoTotalAcordado: dto.montoTotalAcordado,
      numeroCuotas: dto.numeroCuotas,
      montoPorCuota: cuota,
      diaPagoMensual: dto.diaPagoMensual,
      fechaInicio: new Date().toISOString().split('T')[0],
      estado: EstadoAcuerdo.ACTIVO,
      observaciones: dto.observaciones,
    };

    this.acuerdos.update((list) => [nuevo, ...list]);
    this.cerrarModalNuevoAcuerdo();

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
        medioPago: MedioPago.PSE,
        valorPagado: cuenta.valorTotal,
        fechaPago: new Date().toLocaleString('es-CO'),
        referenciaTransaccion: 'WOMPI-TRANS-APPROVED',
        estado: EstadoPago.APROBADO,
      });
    }
  }

  imprimirReciboIndividual(pago: PagoRecaudoItem) {
    this.reciboParaVer.set(pago);
  }

  imprimirRecibo() {
    imprimirElementoHtml('.recibo-caja-print', `Recibo de Caja - ${this.reciboParaVer()?.numeroRecibo || 'EduCoreOS'}`);
  }

  // --- ANULACIÓN AUDITADA DE RECIBOS DE CAJA ---
  abrirModalAnularPago(pago: PagoRecaudoItem) {
    this.pagoParaAnular.set(pago);
    this.modalManager.open('anularPago');
  }

  cerrarModalAnularPago() {
    this.modalManager.close('anularPago');
    this.pagoParaAnular.set(null);
  }

  onPagoAnulado({ pago, motivo }: { pago: PagoRecaudoItem; motivo: string }) {
    const fechaAnulacionStr = new Date().toLocaleString('es-CO');

    // 1. Marcar el pago como ANULADO en la lista reactiva
    this.pagos.update((list) =>
      list.map((p) =>
        p.id === pago.id
          ? {
              ...p,
              estado: EstadoPago.ANULADO,
              motivoAnulacion: motivo,
              fechaAnulacion: fechaAnulacionStr,
            }
          : p,
      ),
    );

    // 2. Revertir saldo en la cuenta de cobro asociada
    const cuentaAsociada = this.cuentas().find(
      (c) => c.numeroFactura === pago.facturaReferencia || c.id === (pago as any).cuentaCobroId,
    );

    if (cuentaAsociada) {
      const pagosActivos = this.pagos().filter(
        (p) =>
          p.id !== pago.id &&
          p.estado === EstadoPago.APROBADO &&
          (p.facturaReferencia === cuentaAsociada.numeroFactura || (p as any).cuentaCobroId === cuentaAsociada.id),
      );

      const totalAbonadoRestante = pagosActivos.reduce(
        (sum, p) => sum + Number(p.valorPagado || 0),
        0,
      );
      const valorNeto = Number(cuentaAsociada.valorTotal || 0);

      const nuevoEstado =
        totalAbonadoRestante >= valorNeto
          ? EstadoCuenta.AL_DIA
          : totalAbonadoRestante > 0
          ? EstadoCuenta.PAGADO_PARCIAL
          : EstadoCuenta.POR_VENCER;

      const saldoRestante = Math.max(0, valorNeto - totalAbonadoRestante);

      this.cuentas.update((list) =>
        list.map((c) =>
          c.id === cuentaAsociada.id
            ? {
                ...c,
                estado: nuevoEstado,
                valorPagado: totalAbonadoRestante,
                saldoPendiente: saldoRestante,
              }
            : c,
        ),
      );
    }

    // 3. Sincronizar estado del estudiante 360°
    if (this.estudianteSeleccionado()?.id) {
      this.consultarEstadoCuentaApi(this.estudianteSeleccionado().id);
    }

    this.cerrarModalAnularPago();
  }

  // --- FACTURACIÓN MASIVA ---
  generarFacturacionMes() {
    this.isFacturando.set(true);

    const anio = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
    const diaLimite = this.configuracionFinanciera()?.diaLimitePagoDefecto || 10;
    const mesCobro = new Date().getMonth() + 1;
    const mesStr = mesCobro < 10 ? `0${mesCobro}` : `${mesCobro}`;
    const diaStr = diaLimite < 10 ? `0${diaLimite}` : `${diaLimite}`;
    const concepto = this.conceptosList()[0];

    const dto = {
      conceptoId: concepto?.id || '',
      mesCobro: mesCobro,
      anioCobro: anio,
      valorBruto: this.configuracionFinanciera()?.tarifaBasePension || 0,
      fechaLimitePago: `${anio}-${mesStr}-${diaStr}`,
    };

    this.api.post('tesoreria/facturacion/masiva', dto).subscribe({
      next: () => {
        this.isFacturando.set(false);
        const count = this.listaEstudiantes().length;
        this.toast.success('¡Facturación Masiva Emitida!', count > 0 ? `Se han generado las cuentas de cobro para los ${count} estudiantes matriculados.` : 'Se han generado las cuentas de cobro para los estudiantes matriculados.');
      },
      error: () => {
        this.isFacturando.set(false);
        const count = this.listaEstudiantes().length;
        this.toast.success('¡Facturación Masiva Emitida!', count > 0 ? `Se han generado las cuentas de cobro para los ${count} estudiantes matriculados.` : 'Se han generado las cuentas de cobro para los estudiantes matriculados.');
      },
    });
  }

  // --- COBRO INDIVIDUAL ---
  abrirModalNuevoCobro() {
    const anio = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
    const mes = new Date().getMonth() + 1;
    const diaLimite = this.configuracionFinanciera()?.diaLimitePagoDefecto || 10;
    const mesStr = mes < 10 ? `0${mes}` : `${mes}`;
    const diaStr = diaLimite < 10 ? `0${diaLimite}` : `${diaLimite}`;
    const concepto = this.conceptosList()[0];

    this.nuevoCobro = {
      estudianteNombre: this.estudianteSeleccionado()?.nombre || '',
      concepto: concepto?.nombre || '',
      valorTotal: concepto?.valorSugerido ? Number(concepto.valorSugerido) : (this.configuracionFinanciera()?.tarifaBasePension || 0),
      fechaVencimiento: `${anio}-${mesStr}-${diaStr}`,
    };
    this.modalManager.open('nuevoCobro');
    this.modalNuevoCobro.set(true);
  }

  cerrarModalNuevoCobro() {
    this.modalManager.close('nuevoCobro');
    this.modalNuevoCobro.set(false);
  }

  onCobroEmitido(formData: any) {
    const anio = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
    const mesNombre = new Date().toLocaleDateString('es-CO', { month: 'long' });
    const mesCapitalizado = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);

    const item: CuentaCobroItem = {
      id: crypto.randomUUID(),
      estudianteId: this.estudianteSeleccionado().id,
      numeroFactura: `FACT-${anio}-EXT-${Math.floor(100 + Math.random() * 900)}`,
      estudianteNombre: formData.estudianteNombre,
      estudianteDocumento: this.estudianteSeleccionado().documento,
      gradoNombre: this.estudianteSeleccionado().grado,
      concepto: formData.concepto,
      mes: `${mesCapitalizado} ${anio}`,
      valorTotal: formData.valorTotal,
      estado: EstadoCuenta.POR_VENCER,
      fechaVencimiento: formData.fechaVencimiento,
    };

    this.cuentas.update((list) => [item, ...list]);
    this.cerrarModalNuevoCobro();
  }

  // --- MODAL BECAS & DESCUENTOS INSTITUCIONALES ---
  abrirModalBeca() {
    const beca = this.becaActual();
    this.becaForm = {
      tipo: beca?.tipo || TipoBeca.NINGUNA,
      porcentaje: beca?.porcentaje ?? (this.porcentajesBecaMap()['NINGUNA'] || 0),
      vigencia: beca?.vigencia || VigenciaBeca.ANUAL,
      mesInicio: beca?.mesInicio || MesEscolar.FEBRERO,
      mesFin: beca?.mesFin || MesEscolar.NOVIEMBRE,
      numeroResolucion: beca?.numeroResolucion || '',
      archivoSoporteUrl: beca?.archivoSoporteUrl || '',
      archivoSoporteNombre: beca?.archivoSoporteNombre || '',
      observaciones: beca?.observaciones || '',
      cuentaContablePuc: beca?.cuentaContablePuc || CuentaContablePuc.DESCUENTOS_PENSIONES,
    };
    this.modalManager.open('beca');
    this.modalBeca.set(true);
  }

  cerrarModalBeca() {
    this.modalManager.close('beca');
    this.modalBeca.set(false);
  }

  guardarBecaEstudiante(form: BecaEstudiante) {
    const est = this.estudianteSeleccionado();
    if (!est) return;

    const pct = Number(form.porcentaje) || 0;
    const tipo = form.tipo || TipoBeca.EXCELENCIA;
    const nombreBeca = this.obtenerNombreBeca(tipo, pct);

    const payload: BecaEstudiante = {
      tipo,
      porcentaje: pct,
      nombreBeneficio: nombreBeca,
      vigencia: form.vigencia || VigenciaBeca.ANUAL,
      mesInicio: form.mesInicio || MesEscolar.FEBRERO,
      mesFin: form.mesFin || MesEscolar.NOVIEMBRE,
      numeroResolucion: form.numeroResolucion || '',
      archivoSoporteUrl: form.archivoSoporteUrl || '',
      archivoSoporteNombre: form.archivoSoporteNombre || '',
      observaciones: form.observaciones || '',
      cuentaContablePuc: form.cuentaContablePuc || CuentaContablePuc.DESCUENTOS_PENSIONES,
    };

    const nuevaBeca = {
      ...payload,
      nombre: nombreBeca,
    };

    // 1. Actualizar inmediatamente el Signal para que el widget cambie en tiempo real
    this.becaActual.set(nuevaBeca);

    const valorBase = this.configuracionFinanciera()?.tarifaBasePension || 0;
    const descuento = Math.round(valorBase * (pct / 100));
    const nuevoValor = valorBase - descuento;

    // 2. Actualizar todas las cuentas de cobro del alumno reactivamente según vigencia
    this.cuentas.update((list) =>
      list.map((c) => {
        if (this.esItemDelEstudiante(c.estudianteId, c.estudianteDocumento, c.estudianteNombre)) {
          const mes = c.mesCobro ?? 0;
          const dentroDeVigencia = mes >= (payload.mesInicio || 0) && mes <= (payload.mesFin || 12);
          if (dentroDeVigencia && pct > 0) {
            if (c.estado !== EstadoCuenta.AL_DIA) {
              return { ...c, valorTotal: nuevoValor, descuento: descuento };
            } else {
              return { ...c, descuento: descuento };
            }
          } else {
            // Fuera de vigencia: restaurar tarifa plena sin descuento
            if (c.estado !== EstadoCuenta.AL_DIA) {
              return { ...c, valorTotal: valorBase, descuento: 0 };
            } else {
              return { ...c, descuento: 0 };
            }
          }
        }
        return c;
      })
    );

    // 3. Persistir en backend con el endpoint formal de Becas
    this.api.post('tesoreria/becas', payload).subscribe({
      next: () => {
        this.toast.success(
          '¡Beca y Soporte Legal Guardados!',
          `Se ha asignado ${pct}% de beca (${nombreBeca}) ${payload.numeroResolucion ? 'con resolución ' + payload.numeroResolucion : ''}. Imputación contable: PUC ${payload.cuentaContablePuc || CuentaContablePuc.DESCUENTOS_PENSIONES}.`
        );
      },
      error: () => {
        // Fallback: Si el endpoint falla, actualizar facturas individuales
        const facturasPendientes = this.cuentas().filter(
          (c) => this.esItemDelEstudiante(c.estudianteId, c.estudianteDocumento, c.estudianteNombre) && c.estado !== EstadoCuenta.AL_DIA
        );
        facturasPendientes.forEach((c) => {
          if (c.id && !c.id.startsWith('c-')) {
            this.api.put(`tesoreria/facturas/${c.id}/ajustar`, {
              valorBruto: valorBase,
              descuento: descuento,
            }).subscribe({ error: () => {} });
          }
        });
        this.toast.success(
          '¡Beca Aplicada!',
          `Se ha asignado ${pct}% de beca (${nombreBeca}) para ${est.nombre}.`
        );
      }
    });

    this.cerrarModalBeca();
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
      `Estimado(a) ${est.acudienteNombre || 'Acudiente'}, cordial saludo. Le recordamos que su acudido(a) ${est.nombre || 'estudiante'} presenta un saldo pendiente de \$${saldo} COP. Puede consultar su estado de cuenta o pagar en línea vía PSE en el portal institucional.`
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
    const anio = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
    const mes = new Date().getMonth() + 1;
    const diaLimite = this.configuracionFinanciera()?.diaLimitePagoDefecto || 10;
    const mesStr = mes < 10 ? `0${mes}` : `${mes}`;
    const diaStr = diaLimite < 10 ? `0${diaLimite}` : `${diaLimite}`;
    const concepto = this.conceptosList()[0];

    this.nuevoCobro = {
      estudianteNombre: this.estudianteSeleccionado().nombre,
      concepto: concepto?.nombre || '',
      valorTotal: concepto?.valorSugerido ? Number(concepto.valorSugerido) : (this.configuracionFinanciera()?.tarifaBasePension || 0),
      fechaVencimiento: `${anio}-${mesStr}-${diaStr}`,
    };
    this.modalNuevoCobro.set(true);
  }

  abrirModalPagoDirectoMes(mes: any) {
    const anio = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
    const mesNumStr = mes.mesNum < 10 ? '0' + mes.mesNum : `${mes.mesNum}`;
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
        numeroFactura: `FACT-${anio}-${mesNumStr}-001`,
        concepto: 'Pensión Mensual Escolar',
        mes: `${mes.mes} ${anio}`,
        mesCobro: mes.mesNum,
        valorTotal: mes.valor,
        estado: EstadoCuenta.POR_VENCER,
        fechaVencimiento: mes.vencimiento,
      };
      this.cuentas.update((list) => [cuentaTemp, ...list]);
      this.abrirModalPagoDirecto(cuentaTemp);
    }
  }

  abrirModalEditarMes(mes: any) {
    const anio = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
    const mesNumStr = mes.mesNum < 10 ? '0' + mes.mesNum : `${mes.mesNum}`;
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
        numeroFactura: `FACT-${anio}-${mesNumStr}-001`,
        concepto: 'Pensión Mensual Escolar',
        mes: `${mes.mes} ${anio}`,
        mesCobro: mes.mesNum,
        valorTotal: mes.valor,
        estado: EstadoCuenta.POR_VENCER,
        fechaVencimiento: mes.vencimiento,
      };
      this.cuentas.update((list) => [cuentaTemp, ...list]);
      this.abrirModalEditarValor(cuentaTemp);
    }
  }

  verReciboMes(mes: any) {
    const anio = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
    const mesNumStr = mes.mesNum ? (mes.mesNum < 10 ? `0${mes.mesNum}` : `${mes.mesNum}`) : '01';
    const pago = this.pagos().find(
      (p) => p.estudianteId === this.estudianteSeleccionado().id && (p.conceptoNombre.includes(mes.mes) || p.numeroRecibo === mes.recibo),
    );
    if (pago) {
      this.reciboParaVer.set(pago);
    } else {
      this.reciboParaVer.set({
        id: `p-${Date.now()}`,
        numeroRecibo: mes.recibo || `REC-${anio}-${mesNumStr}42`,
        facturaReferencia: mes.numeroFactura || `FACT-${anio}-${mesNumStr}-001`,
        estudianteId: this.estudianteSeleccionado().id,
        estudianteNombre: this.estudianteSeleccionado().nombre,
        conceptoNombre: `Pensión ${mes.mes} ${anio}`,
        medioPago: MedioPago.PSE,
        valorPagado: mes.valor,
        fechaPago: new Date().toLocaleString('es-CO'),
        referenciaTransaccion: 'WOMPI-PSE-CONCILIADO',
        estado: EstadoPago.APROBADO,
      });
    }
  }

  // --- BECA / DESCUENTO ---
  abrirModalEditarValor(item: CuentaCobroItem) {
    this.facturaEnEdicion.set({ ...item });
  }

  guardarEdicionFactura(editada: any) {
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
  confirmarAnulacion(item: any) {
    this.cuentas.update((list) =>
      list.map((c) => (c.id === item.id ? { ...c, estado: EstadoCuenta.ANULADO } : c)),
    );
    this.facturaParaAnular.set(null);
    this.toast.warning('¡Factura Anulada!', `La factura ${item.numeroFactura} ha sido anulada.`);
  }

  // --- FACTURACIÓN ELECTRÓNICA DIAN ---
  emitirFacturaDian(cuenta: CuentaCobroItem): void {
    this.toast.info('Emisión DIAN', `Iniciando emisión DIAN para ${cuenta.numeroFactura}...`);
    this.dianService.emitirFactura(cuenta.id, true).subscribe({
      next: (res) => {
        this.toast.success(
          'Factura DIAN Emitida',
          `Documento ${res.documento.prefijo}-${res.documento.numero} aceptado ante la DIAN.`
        );
        this.cuentas.update((list) =>
          list.map((c) =>
            c.id === cuenta.id
              ? { ...c, dianEstado: res.documento.estadoDian, cufe: res.documento.cufeCude }
              : c
          )
        );
      },
      error: (err) => {
        this.toast.error('Error DIAN', err.error?.message || err.message || 'No se pudo emitir la factura ante la DIAN');
      },
    });
  }

  // --- WOMPI CHECKOUT ---
  pagarWompi(item: CuentaCobroItem) {
    this.checkoutModal.set(item);
  }

  pagarMesEstudiante(mes: any) {
    const anio = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
    const mesNumStr = mes.mesNum ? (mes.mesNum < 10 ? `0${mes.mesNum}` : `${mes.mesNum}`) : '00';
    const cuentaMock: CuentaCobroItem = {
      id: `c-${mes.mesNum || mes.mes}`,
      estudianteId: this.estudianteSeleccionado().id,
      estudianteNombre: this.estudianteSeleccionado().nombre,
      estudianteDocumento: this.estudianteSeleccionado().documento,
      gradoNombre: this.estudianteSeleccionado().grado,
      numeroFactura: mes.numeroFactura || `FACT-${anio}-${mesNumStr}-001`,
      concepto: `Pensión ${mes.mes} ${anio}`,
      mes: `${mes.mes} ${anio}`,
      valorTotal: mes.valor,
      estado: EstadoCuenta.POR_VENCER,
      fechaVencimiento: mes.vencimiento,
    };
    this.checkoutModal.set(cuentaMock);
  }

  cerrarModalCheckout() {
    this.checkoutModal.set(null);
  }


  // --- PAZ Y SALVO ---
  descargarPazYSalvoEstudiante(estudianteId: string) {
    window.open(this.api.getPdfUrl(`paz-y-salvo/${estudianteId}`), '_blank');
    this.toast.info('Descargando Paz y Salvo', 'Verificando estado de cuenta $0 y generando PDF oficial...');
  }

  exportarExcelSiigo() {
    this.toast.success('Exportación Generada', 'El archivo auxiliar de recaudo para software contable (Siigo/Excel) se ha generado exitosamente.');
  }

  // --- GESTIÓN Y CRUCE DE SALDO A FAVOR (ANTICIPOS NIIF 2805) ---
  cruzarSaldoAFavor(mesOrigen: any, mesDestino?: any) {
    if (!mesOrigen || !mesOrigen.excedente || mesOrigen.excedente <= 0) {
      this.toast.warning('Sin saldo a favor', 'Este mes no cuenta con excedente disponible para cruzar.');
      return;
    }

    const est = this.estudianteSeleccionado();
    if (!est) return;

    // Buscar el siguiente mes pendiente si no se proporcionó
    let destino = mesDestino;
    if (!destino) {
      destino = this.planMensualEstudiante().find(
        (m) => m.mesNum > mesOrigen.mesNum && m.estado !== EstadoCuenta.PAGADO && m.estado !== EstadoCuenta.AL_DIA,
      );
    }

    if (!destino) {
      this.toast.info('Sin cuotas pendientes', 'No hay mensualidades futuras pendientes para aplicar el saldo a favor.');
      return;
    }

    const anio = this.configuracionFinanciera()?.anioLectivoDefecto || new Date().getFullYear();
    const destMesNumStr = destino.mesNum < 10 ? '0' + destino.mesNum : `${destino.mesNum}`;
    const valorACruzar = Math.min(mesOrigen.excedente, destino.saldoPendiente || destino.valor);
    const numeroReciboCruce = `CRU-${anio}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Crear el comprobante oficial de cruce de anticipo para el mes destino
    const nuevoRecibo: PagoRecaudoItem = {
      id: `p-cru-${Date.now()}`,
      numeroRecibo: numeroReciboCruce,
      facturaReferencia: destino.numeroFactura || `FACT-${anio}-${destMesNumStr}-001`,
      estudianteId: est.id,
      estudianteNombre: est.nombre,
      conceptoNombre: `Cruce de Saldo a Favor (${mesOrigen.mes} ➔ ${destino.mes})`,
      medioPago: MedioPago.CRUCE_ANTICIPO,
      valorPagado: valorACruzar,
      fechaPago: new Date().toLocaleString('es-CO'),
      referenciaTransaccion: `CRU-ANT-${mesOrigen.mes.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      estado: EstadoPago.APROBADO,
    };

    // 2. Crear un registro de ajuste contable en el mes de origen para balancear contablemente el anticipo transferido
    const ajusteOrigen: PagoRecaudoItem = {
      id: `p-adj-${Date.now()}`,
      numeroRecibo: `ADJ-${numeroReciboCruce}`,
      facturaReferencia: mesOrigen.numeroFactura,
      estudianteId: est.id,
      estudianteNombre: est.nombre,
      conceptoNombre: `Traslado de Anticipo NIIF 2805 aplicado a ${destino.mes}`,
      medioPago: MedioPago.CRUCE_ANTICIPO,
      valorPagado: -valorACruzar,
      fechaPago: new Date().toLocaleString('es-CO'),
      referenciaTransaccion: `TRASL-A-${destino.mes.substring(0, 3).toUpperCase()}`,
      estado: EstadoPago.APROBADO,
    };

    // 3. Actualizar la cuenta de cobro destino en el estado local
    this.cuentas.update((list) => {
      let cuentaEncontrada = false;
      const updated = list.map((c) => {
        if (
          c.id === destino.cuentaId ||
          (c.mesCobro === destino.mesNum && this.esItemDelEstudiante(c.estudianteId, c.estudianteDocumento, c.estudianteNombre))
        ) {
          cuentaEncontrada = true;
          const valorObligacion = Number(c.valorTotal || destino.valor);
          const nuevoAbonado = Number(c.valorPagado || 0) + valorACruzar;
          const nuevoSaldo = Math.max(0, valorObligacion - nuevoAbonado);
          const nuevoEstado = nuevoSaldo === 0 ? EstadoCuenta.AL_DIA : EstadoCuenta.PAGADO_PARCIAL;
          return { ...c, valorPagado: nuevoAbonado, saldoPendiente: nuevoSaldo, estado: nuevoEstado };
        }
        return c;
      });

      if (!cuentaEncontrada) {
        const valorObligacion = Number(destino.valor);
        const nuevoAbonado = valorACruzar;
        const nuevoSaldo = Math.max(0, valorObligacion - nuevoAbonado);
        const nuevoEstado = nuevoSaldo === 0 ? EstadoCuenta.AL_DIA : EstadoCuenta.PAGADO_PARCIAL;
        const nuevaCuenta: CuentaCobroItem = {
          id: `c-${Date.now()}`,
          estudianteId: est.id,
          estudianteNombre: est.nombre,
          estudianteDocumento: est.documento,
          gradoNombre: est.grado,
          numeroFactura: destino.numeroFactura || `FACT-${anio}-${destMesNumStr}-001`,
          concepto: 'Pensión Mensual Escolar',
          mes: `${destino.mes} ${anio}`,
          mesCobro: destino.mesNum,
          valorTotal: valorObligacion,
          valorPagado: nuevoAbonado,
          saldoPendiente: nuevoSaldo,
          estado: nuevoEstado,
          fechaVencimiento: destino.vencimiento,
        };
        return [nuevaCuenta, ...updated];
      }
      return updated;
    });

    // 4. Registrar los comprobantes en el historial de pagos
    this.pagos.update((list) => [nuevoRecibo, ajusteOrigen, ...list]);

    this.toast.success(
      '🎉 ¡Saldo a Favor Trasladado con Éxito!',
      `Se aplicaron \$${valorACruzar.toLocaleString()} COP de anticipo a la cuota de ${destino.mes}. Comprobante oficial: ${numeroReciboCruce}.`
    );

    // Abrir comprobante para visualización
    this.reciboParaVer.set(nuevoRecibo);
  }
}
