import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagoRecaudoItem, MedioPago, EstadoPago } from '../models/tesoreria.models';

@Component({
  selector: 'app-tesoreria-recaudos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in">
      <div class="card-title-bar mb-4">
        <div>
          <h3>🧾 Historial General de Recibos de Caja & Ventanilla</h3>
          <p>Registro cronológico de todos los dineros ingresados a la institución bajo normativa DIAN y Revisoría Fiscal</p>
        </div>
        <button (click)="abrirModalPagoManual.emit()" class="btn btn-primary">
          <span>➕ Registrar Recaudo en Ventanilla (Caja)</span>
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
              <th>Estado Fiscal</th>
              <th>Referencia Transacción</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (pago of pagos; track pago.id) {
              <tr [class.opacity-60]="pago.estado === EstadoPago.ANULADO">
                <td><strong class="font-mono text-xs">{{ pago.numeroRecibo }}</strong></td>
                <td><span class="text-xs">{{ pago.fechaPago }}</span></td>
                <td><strong>{{ pago.estudianteNombre }}</strong></td>
                <td><code class="text-xs">{{ pago.facturaReferencia }}</code></td>
                <td>
                  <span class="badge" [class.badge-success]="pago.medioPago === MedioPago.PSE" [class.badge-info]="pago.medioPago !== MedioPago.PSE">
                    {{ getNombreMedioPago(pago.medioPago) }}
                  </span>
                </td>
                <td>
                  <strong [style.text-decoration]="pago.estado === EstadoPago.ANULADO ? 'line-through' : 'none'">
                    \${{ pago.valorPagado | number }} COP
                  </strong>
                </td>
                <td>
                  @if (pago.estado === EstadoPago.ANULADO) {
                    <span class="badge badge-danger" title="Recibo anulado - Cartera revertida">🚫 Anulado</span>
                  } @else {
                    <span class="badge badge-success">✓ Aprobado</span>
                  }
                </td>
                <td><span class="text-xs text-slate-500 font-mono">{{ pago.referenciaTransaccion }}</span></td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 0.35rem; justify-content: flex-end;">
                    <button (click)="imprimirReciboIndividual.emit(pago)" class="btn btn-secondary btn-xs" title="Visualizar e Imprimir Recibo Oficial">
                      🧾 Ver
                    </button>
                    @if (pago.estado !== EstadoPago.ANULADO) {
                      <button (click)="anularRecibo.emit(pago)" class="btn btn-outline btn-xs" style="color: #ef4444; border-color: #fca5a5;" title="Anulación Auditada bajo Normativa Contable">
                        🚫 Anular
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
  `
})
export class TesoreriaRecaudosComponent {
  @Input() mediosPagoList: any[] = [];
  readonly MedioPago = MedioPago;
  readonly EstadoPago = EstadoPago;

  @Input() pagos: PagoRecaudoItem[] = [];

  @Output() abrirModalPagoManual = new EventEmitter<void>();
  @Output() imprimirReciboIndividual = new EventEmitter<PagoRecaudoItem>();
  @Output() anularRecibo = new EventEmitter<PagoRecaudoItem>();

  getNombreMedioPago(codigo: string): string {
    const list = typeof this.mediosPagoList === 'function' ? (this.mediosPagoList as any)() : this.mediosPagoList;
    if (Array.isArray(list)) {
      const found = list.find((m: any) => m.codigo === codigo);
      if (found?.nombre) return found.nombre;
    }
    return codigo;
  }
}
