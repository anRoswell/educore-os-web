import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchableSelectComponent, SearchableOption } from '../../../shared/components/searchable-select.component';
import { CuentaCobroItem, AcuerdoPagoItem, PagoRecaudoItem, EstadoCuenta, EstadoAcuerdo, EstadoPago } from '../models/tesoreria.models';

@Component({
  selector: 'app-tesoreria-estado-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './tesoreria-estado-cuenta.component.html'
})
export class TesoreriaEstadoCuentaComponent {
  @Input() estadosCuentaList: any[] = [];
  @Input() mesesList: any[] = [];
  @Input() mediosPagoList: any[] = [];
  readonly EstadoCuenta = EstadoCuenta;
  readonly EstadoAcuerdo = EstadoAcuerdo;
  readonly EstadoPago = EstadoPago;

  @Input() listaEstudiantes: any[] = [];
  @Input() estudiantesSelectOptions: SearchableOption[] = [];
  @Input() estudianteSeleccionado: any = null;
  @Input() becaActual: any = { porcentaje: 0, nombre: '' };
  @Input() estadoCuentaEstudiante: any = { saldoPendienteTotal: 0, cuotasAlDia: 0, cuotasEnMora: 0, bloqueoBoletin: false };
  @Input() desbloqueoExcepcional = false;
  @Input() planMensualEstudiante: any[] = [];
  @Input() otrosCobrosEstudiante: CuentaCobroItem[] = [];
  @Input() acuerdosEstudiante: AcuerdoPagoItem[] = [];
  @Input() pagosEstudiante: PagoRecaudoItem[] = [];

  get opcionesEstudiantes(): SearchableOption[] {
    if (this.estudiantesSelectOptions && this.estudiantesSelectOptions.length > 0) {
      return this.estudiantesSelectOptions;
    }
    return (this.listaEstudiantes || []).map((est) => ({
      value: est.id,
      label: est.nombre,
      sublabel: `Doc. ${est.documento || 'S/D'} • Grado: ${est.grado || ''} (${est.grupo || 'A'})`,
      badge: est.grado || 'Matriculado',
      badgeClass: 'badge-secondary',
      avatarText: est.nombre?.substring(0, 2)?.toUpperCase() || 'ES',
    }));
  }

  @Output() cambiarEstudiante = new EventEmitter<string>();
  @Output() seleccionarEstudiante = new EventEmitter<string>();
  @Output() abrirModalPazSalvoCompleto = new EventEmitter<void>();
  @Output() abrirModalAcuerdoDesde360 = new EventEmitter<void>();
  @Output() abrirModalExtracto = new EventEmitter<void>();
  @Output() abrirModalBeca = new EventEmitter<void>();
  @Output() enviarRecordatorioWhatsApp = new EventEmitter<void>();
  @Output() enviarEstadoCuentaEmail = new EventEmitter<void>();
  @Output() toggleDesbloqueoExcepcional = new EventEmitter<void>();

  @Output() pagarMesEstudiante = new EventEmitter<any>();
  @Output() pagarWompi = new EventEmitter<CuentaCobroItem>();
  @Output() abrirModalPagoDirectoMes = new EventEmitter<any>();
  @Output() abrirModalEditarMes = new EventEmitter<any>();
  @Output() verReciboMes = new EventEmitter<any>();

  @Output() asignarCobroAEstudianteActual = new EventEmitter<void>();
  @Output() abrirModalPagoDirecto = new EventEmitter<CuentaCobroItem>();
  @Output() abrirModalAnular = new EventEmitter<CuentaCobroItem>();
  @Output() verReciboCaja = new EventEmitter<CuentaCobroItem>();

  @Output() imprimirReciboIndividual = new EventEmitter<PagoRecaudoItem>();
  @Output() cruzarSaldoAFavor = new EventEmitter<{ mesOrigen: any, mesDestino?: any }>();

  getSiguienteMesPendiente(mesActual: any): any {
    return (this.planMensualEstudiante || []).find(
      (m) => m.mesNum > mesActual.mesNum && m.estado !== EstadoCuenta.PAGADO && m.estado !== EstadoCuenta.AL_DIA
    );
  }

  get totalSaldoAFavor(): number {
    return (this.planMensualEstudiante || []).reduce((sum, m) => sum + Number(m.excedente || 0), 0);
  }
}
