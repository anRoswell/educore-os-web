import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CuentaCobroItem, AcuerdoPagoItem, PagoRecaudoItem, EstadoCuenta, EstadoAcuerdo } from '../models/tesoreria.models';

@Component({
  selector: 'app-tesoreria-estado-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tesoreria-estado-cuenta.component.html'
})
export class TesoreriaEstadoCuentaComponent {
  @Input() estadosCuentaList: any[] = [];
  @Input() mesesList: any[] = [];
  @Input() mediosPagoList: any[] = [];
  readonly EstadoCuenta = EstadoCuenta;
  readonly EstadoAcuerdo = EstadoAcuerdo;

  @Input() listaEstudiantes: any[] = [];
  @Input() estudianteSeleccionado: any = null;
  @Input() becaActual: any = { porcentaje: 0, nombre: '' };
  @Input() estadoCuentaEstudiante: any = { saldoPendienteTotal: 0, cuotasAlDia: 0, cuotasEnMora: 0, bloqueoBoletin: false };
  @Input() desbloqueoExcepcional = false;
  @Input() planMensualEstudiante: any[] = [];
  @Input() otrosCobrosEstudiante: CuentaCobroItem[] = [];
  @Input() acuerdosEstudiante: AcuerdoPagoItem[] = [];
  @Input() pagosEstudiante: PagoRecaudoItem[] = [];

  @Output() cambiarEstudiante = new EventEmitter<string>();
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
}
