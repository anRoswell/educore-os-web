import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcuerdoPagoItem, EstadoAcuerdo } from '../models/tesoreria.models';

@Component({
  selector: 'app-tesoreria-acuerdos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tab-body animate-fade-in">
      <div class="card-title-bar mb-4">
        <div>
          <h3>🤝 Acuerdos de Pago & Financiación de Cartera</h3>
          <p>Refinanciación en cuotas para familias en mora con suspensión temporal de bloqueo de boletines</p>
        </div>
        <button (click)="abrirModalNuevoAcuerdo.emit()" class="btn btn-primary">
          <span>➕ Nuevo Acuerdo de Pago</span>
        </button>
      </div>

      <div class="table-container">
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
            @for (acuerdo of acuerdos; track acuerdo.id) {
              <tr>
                <td><strong>{{ acuerdo.estudianteNombre }}</strong></td>
                <td>{{ acuerdo.gradoNombre }}</td>
                <td><strong>\${{ acuerdo.montoTotalAcordado | number }} COP</strong></td>
                <td>{{ acuerdo.numeroCuotas }} cuotas</td>
                <td><strong>\${{ acuerdo.montoPorCuota | number }} COP</strong></td>
                <td>Día {{ acuerdo.diaPagoMensual }} de c/mes</td>
                <td><span class="text-xs text-slate-500">{{ acuerdo.fechaInicio }}</span></td>
                <td>
                  @if (acuerdo.estado === EstadoAcuerdo.CUMPLIDO) {
                    <span class="badge badge-success">CUMPLIDO</span>
                  } @else if (acuerdo.estado === EstadoAcuerdo.ACTIVO) {
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
  `
})
export class TesoreriaAcuerdosComponent {
  readonly EstadoAcuerdo = EstadoAcuerdo;

  @Input() acuerdos: AcuerdoPagoItem[] = [];

  @Output() abrirModalNuevoAcuerdo = new EventEmitter<void>();
}
