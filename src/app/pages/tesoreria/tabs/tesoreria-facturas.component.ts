import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Parametro } from '../../../core/services/parametros.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CuentaCobroItem, EstadoCuenta } from '../models/tesoreria.models';

@Component({
  selector: 'app-tesoreria-facturas',
  standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tab-body animate-fade-in">
      <div class="filters-bar mb-4">
        <div class="search-input-group">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            class="form-control search-input" 
            placeholder="Buscar por estudiante, factura o documento..." 
            [ngModel]="filtroTexto()" (ngModelChange)="onFilterChange('texto', $event)"
            (ngModelChange)="onFilterChange('texto', $event)" />
        </div>

        <div class="filter-selects">
          <select class="form-select select-sm" [ngModel]="filtroEstado()" (ngModelChange)="onFilterChange('estado', $event)">
            <option value="TODOS">Todos los Estados</option>
            @for (estado of estadosCuentaList(); track estado.codigo) {
              <option [value]="estado.codigo">{{ estado.nombre }}</option>
            }
          </select>

          <select class="form-select select-sm" [ngModel]="filtroMes()" (ngModelChange)="onFilterChange('mes', $event)">
            <option value="TODOS">Todos los Meses</option>
            @for (mes of mesesList(); track mes.codigo) {
              <option [value]="mes.codigo">{{ mes.nombre }}</option>
            }
          </select>
        </div>
      </div>

      <div class="table-container mt-3">
        <table class="data-table">
          <thead>
            <tr>
              <th>Factura / Ref</th>
              <th>Estudiante</th>
              <th>Concepto</th>
              <th class="text-center">Mes Cobro</th>
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
                    <span class="text-xs text-slate-500" style="display: block; margin-top: 0.35rem;">Doc: {{ item.estudianteDocumento }}</span>
                  </div>
                </td>
                <td>{{ item.concepto }}</td>
                <td class="text-center"><span class="badge badge-info">{{ item.mes }}</span></td>
                <td><strong>\${{ item.valorTotal | number }} COP</strong></td>
                <td><span class="text-slate-500 text-xs">{{ item.fechaVencimiento }}</span></td>
                <td>
                  @if (item.estado === EstadoCuenta.AL_DIA) {
                    <span class="badge badge-success">PAGADO</span>
                  } @else if (item.estado === EstadoCuenta.POR_VENCER) {
                    <span class="badge badge-warning">POR VENCER</span>
                  } @else if (item.estado === EstadoCuenta.EN_MORA) {
                    <span class="badge badge-danger">EN MORA</span>
                  } @else {
                    <span class="badge badge-danger" style="background-color: #64748b;">ANULADO</span>
                  }
                </td>
                <td>
                  <div class="actions-group">
                    <button (click)="verFicha360.emit(item.estudianteId)" class="btn btn-secondary btn-sm" title="Ver Ficha Financiera 360° del Alumno">
                      🔍 Ficha
                    </button>
                    @if (item.estado !== EstadoCuenta.AL_DIA && item.estado !== EstadoCuenta.ANULADO) {
                      <button (click)="pagarWompi.emit(item)" class="btn btn-primary btn-sm" title="Pagar vía Pasarela Wompi / PSE / Nequi">
                        💳 PSE
                      </button>
                      <button (click)="pagarCaja.emit(item)" class="btn btn-success btn-sm" title="Registrar Recaudo en Ventanilla (Efectivo / Transferencia)">
                        💵 Caja
                      </button>
                      <button (click)="editarValor.emit(item)" class="btn btn-secondary btn-sm" title="Aplicar Descuento / Beca">
                        ✏️ Beca
                      </button>
                      <button (click)="anularFactura.emit(item)" class="btn btn-danger btn-sm" title="Anular Factura">
                        🗑️
                      </button>
                    } @else if (item.estado === EstadoCuenta.AL_DIA) {
                      <button (click)="verRecibo.emit(item)" class="btn btn-secondary btn-sm" title="Ver e Imprimir Recibo Oficial de Caja">
                        🧾 Recibo
                      </button>
                      <button (click)="descargarPazYSalvo.emit(item.estudianteId)" class="btn btn-outline btn-sm" title="Descargar Paz y Salvo PDF">
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
  `
})
export class TesoreriaFacturasComponent {
  readonly EstadoCuenta = EstadoCuenta;
  
  cuentasFiltradas = input<CuentaCobroItem[]>([]);
  estadosCuentaList = input<Parametro[]>([]);
  mesesList = input<Parametro[]>([]);
  filtroTexto = input('');
  filtroEstado = input('TODOS');
  filtroMes = input('TODOS');

  filtrar = output<{ texto: string, estado: string, mes: string }>();
  verFicha360 = output<string>();
  pagarWompi = output<CuentaCobroItem>();
  pagarCaja = output<CuentaCobroItem>();
  editarValor = output<CuentaCobroItem>();
  anularFactura = output<CuentaCobroItem>();
  verRecibo = output<CuentaCobroItem>();
  descargarPazYSalvo = output<string>();

  onFilterChange(type: 'texto'|'estado'|'mes', value: string) {
    this.filtrar.emit({
      texto: type === 'texto' ? value : this.filtroTexto(),
      estado: type === 'estado' ? value : this.filtroEstado(),
      mes: type === 'mes' ? value : this.filtroMes()
    });
  }
}
