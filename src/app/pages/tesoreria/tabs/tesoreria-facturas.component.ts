import { Component, input, output, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Parametro } from '../../../core/services/parametros.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CuentaCobroItem, EstadoCuenta, FiltroGeneral } from '../models/tesoreria.models';

@Component({
  selector: 'app-tesoreria-facturas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in">
      <!-- Cabecera de Filtros Dividida en 3 Columnas -->
      <div class="filters-header-grid mb-4" style="display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 1rem; align-items: center; background: #ffffff; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <!-- Columna 1: Búsqueda de Estudiante / Factura / Documento -->
        <div class="filter-col">
          <label class="form-label" style="font-size: 0.78rem; font-weight: 700; color: #475569; margin-bottom: 0.3rem; display: block;">
            🔍 Búsqueda General:
          </label>
          <div class="search-input-group" style="width: 100%;">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              class="form-control search-input" 
              style="width: 100%; height: 38px; font-size: 0.85rem;"
              placeholder="Buscar por estudiante, documento o factura..." 
              [ngModel]="filtroTexto()" (ngModelChange)="onFilterChange('texto', $event)" />
          </div>
        </div>

        <!-- Columna 2: Filtro por Estado de Cartera -->
        <div class="filter-col">
          <label class="form-label" style="font-size: 0.78rem; font-weight: 700; color: #475569; margin-bottom: 0.3rem; display: block;">
            🟢 Estado Financiero:
          </label>
          <select 
            class="form-select" 
            style="width: 100%; height: 38px; font-size: 0.85rem;"
            [ngModel]="filtroEstado()" 
            (ngModelChange)="onFilterChange('estado', $event)">
            <option [value]="FiltroGeneral.TODOS">Todos los Estados</option>
            @for (estado of estadosCuentaList(); track estado.codigo) {
              <option [value]="estado.codigo">{{ estado.nombre }}</option>
            }
          </select>
        </div>

        <!-- Columna 3: Filtro por Mes Académico -->
        <div class="filter-col">
          <label class="form-label" style="font-size: 0.78rem; font-weight: 700; color: #475569; margin-bottom: 0.3rem; display: block;">
            📅 Mes Académico:
          </label>
          <select 
            class="form-select" 
            style="width: 100%; height: 38px; font-size: 0.85rem;"
            [ngModel]="filtroMes()" 
            (ngModelChange)="onFilterChange('mes', $event)">
            <option [value]="FiltroGeneral.TODOS">Todos los Meses</option>
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
              <th>Estado DIAN</th>
              <th>Acciones Tesorería</th>
            </tr>
          </thead>
          <tbody>
            @if (cuentasPaginadas().length === 0) {
              <tr>
                <td colspan="9" class="text-center p-4 text-slate-500">
                  <span>No se encontraron facturas con los filtros seleccionados.</span>
                </td>
              </tr>
            }
            @for (item of cuentasPaginadas(); track item.id) {
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
                  @if (item.dianEstado === 'ACEPTADO') {
                    <span class="badge badge-success" style="font-size: 0.65rem;" title="Validado por DIAN">🏛️ ACEPTADO</span>
                  } @else if (item.dianEstado === 'ENVIADO') {
                    <span class="badge badge-warning" style="font-size: 0.65rem;" title="Enviado a DIAN">🏛️ ENVIADO</span>
                  } @else if (item.dianEstado === 'RECHAZADO') {
                    <span class="badge badge-danger" style="font-size: 0.65rem;" title="Rechazado por DIAN">🏛️ RECHAZADO</span>
                  } @else {
                    <span class="badge" style="font-size: 0.65rem; background-color: #f1f5f9; color: #64748b;" title="Sin emitir a DIAN">SIN EMITIR</span>
                  }
                </td>
                <td>
                  <div class="actions-group">
                    <button (click)="verFicha360.emit(item)" class="btn btn-secondary btn-sm" title="Ver Ficha Financiera 360° del Alumno">
                      🔍 Ficha
                    </button>
                    <button
                      (click)="emitirDian.emit(item)"
                      class="btn btn-secondary btn-sm"
                      title="Emitir Factura Electrónica a DIAN"
                      [attr.data-testid]="'btn-emitir-dian-' + item.id"
                    >
                      🏛️ DIAN
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

      <!-- Barra de Paginación -->
      <div class="pagination-bar mt-3" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; padding: 0.75rem 0.5rem; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #64748b;">
        <div>
          Mostrando <strong>{{ indiceInicio() }}</strong> a <strong>{{ indiceFin() }}</strong> de <strong>{{ totalRegistros() }}</strong> facturas registradas
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button 
            (click)="irAPagina(1)" 
            class="btn btn-secondary btn-sm" 
            [disabled]="paginaActual() <= 1"
            title="Primera Página">
            ⏮️
          </button>
          <button 
            (click)="irAPagina(paginaActual() - 1)" 
            class="btn btn-secondary btn-sm" 
            [disabled]="paginaActual() <= 1"
            title="Página Anterior">
            ◀️ Anterior
          </button>

          <span style="font-weight: 700; color: #1e293b; padding: 0 0.5rem;">
            Página {{ paginaActual() }} de {{ totalPaginas() }}
          </span>

          <button 
            (click)="irAPagina(paginaActual() + 1)" 
            class="btn btn-secondary btn-sm" 
            [disabled]="paginaActual() >= totalPaginas()"
            title="Página Siguiente">
            Siguiente ▶️
          </button>
          <button 
            (click)="irAPagina(totalPaginas()) 
            "class="btn btn-secondary btn-sm" 
            [disabled]="paginaActual() >= totalPaginas()"
            title="Última Página">
            ⏭️
          </button>
        </div>
      </div>
    </div>
  `
})
export class TesoreriaFacturasComponent {
  readonly EstadoCuenta = EstadoCuenta;
  readonly FiltroGeneral = FiltroGeneral;
  
  cuentasFiltradas = input<CuentaCobroItem[]>([]);
  estadosCuentaList = input<Parametro[]>([]);
  mesesList = input<Parametro[]>([]);
  filtroTexto = input('');
  filtroEstado = input<string>(FiltroGeneral.TODOS);
  filtroMes = input<string>(FiltroGeneral.TODOS);

  filtrar = output<{ texto: string, estado: string, mes: string }>();
  verFicha360 = output<any>();
  pagarWompi = output<CuentaCobroItem>();
  pagarCaja = output<CuentaCobroItem>();
  editarValor = output<CuentaCobroItem>();
  anularFactura = output<CuentaCobroItem>();
  verRecibo = output<CuentaCobroItem>();
  descargarPazYSalvo = output<string>();
  emitirDian = output<CuentaCobroItem>();

  // Estado reactivo de paginación
  readonly paginaActual = signal(1);
  readonly registrosPorPagina = signal(10);

  readonly totalRegistros = computed(() => this.cuentasFiltradas().length);
  readonly totalPaginas = computed(() => Math.ceil(this.totalRegistros() / this.registrosPorPagina()) || 1);

  readonly cuentasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.registrosPorPagina();
    return this.cuentasFiltradas().slice(inicio, inicio + this.registrosPorPagina());
  });

  readonly indiceInicio = computed(() => (this.totalRegistros() === 0 ? 0 : (this.paginaActual() - 1) * this.registrosPorPagina() + 1));
  readonly indiceFin = computed(() => Math.min(this.paginaActual() * this.registrosPorPagina(), this.totalRegistros()));

  irAPagina(pag: number) {
    const max = this.totalPaginas();
    if (pag >= 1 && pag <= max) {
      this.paginaActual.set(pag);
    }
  }

  cambiarTamanoPagina(tamano: any) {
    const nuevoTam = Number(tamano) || 10;
    this.registrosPorPagina.set(nuevoTam);
    this.paginaActual.set(1);
  }

  onFilterChange(type: 'texto'|'estado'|'mes', value: string) {
    this.paginaActual.set(1);
    this.filtrar.emit({
      texto: type === 'texto' ? value : this.filtroTexto(),
      estado: type === 'estado' ? value : this.filtroEstado(),
      mes: type === 'mes' ? value : this.filtroMes()
    });
  }
}
