import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagoRecaudoItem, MedioPago } from '../models/tesoreria.models';

@Component({
  selector: 'app-tesoreria-recaudos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tab-body animate-fade-in">
      <div class="card-title-bar mb-4">
        <div>
          <h3>🧾 Historial General de Recibos de Caja & Ventanilla</h3>
          <p>Registro cronológico de todos los dineros ingresados a la institución por cualquier medio</p>
        </div>
        <button (click)="abrirModalPagoManual.emit()" class="btn btn-primary">
          <span>➕ Registrar Recaudo Manual</span>
        </button>
      </div>

      <div class="table-container">
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
            @for (pago of pagos; track pago.id) {
              <tr>
                <td><strong class="font-mono text-xs">{{ pago.numeroRecibo }}</strong></td>
                <td><span class="text-xs">{{ pago.fechaPago }}</span></td>
                <td><strong>{{ pago.estudianteNombre }}</strong></td>
                <td><code class="text-xs">{{ pago.facturaReferencia }}</code></td>
                <td>
                  <span class="badge" [class.badge-success]="pago.medioPago === MedioPago.PSE" [class.badge-info]="pago.medioPago !== MedioPago.PSE">
                    {{ pago.medioPago }}
                  </span>
                </td>
                <td><strong>\${{ pago.valorPagado | number }} COP</strong></td>
                <td><span class="text-xs text-slate-500">{{ pago.referenciaTransaccion }}</span></td>
                <td>
                  <button (click)="imprimirReciboIndividual.emit(pago)" class="btn btn-secondary btn-sm">
                    🖨️ Imprimir Recibo
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TesoreriaRecaudosComponent {
  @Input() mediosPagoList: any[] = [];
  readonly MedioPago = MedioPago;

  @Input() pagos: PagoRecaudoItem[] = [];

  @Output() abrirModalPagoManual = new EventEmitter<void>();
  @Output() imprimirReciboIndividual = new EventEmitter<PagoRecaudoItem>();
}
