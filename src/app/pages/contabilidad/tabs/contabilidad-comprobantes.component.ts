import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { Asiento, TipoComprobante, EstadoAsiento } from '../models/contabilidad.models';
import { ModalNuevoAsientoComponent } from '../modals/modal-nuevo-asiento.component';
import { ModalDetalleAsientoComponent } from '../modals/modal-detalle-asiento.component';
import { ModalAnularAsientoComponent } from '../modals/modal-anular-asiento.component';
import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';

@Component({
  selector: 'app-contabilidad-comprobantes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalNuevoAsientoComponent,
    ModalDetalleAsientoComponent,
    ModalAnularAsientoComponent,
    FlatpickrDirective,
  ],
  styles: [`
    .comprobantes-header-banner {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #2563eb;
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .comprobantes-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .comprobantes-icon-wrap {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.75rem;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      font-size: 1.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .comprobantes-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .comprobantes-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .comprobantes-title-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .comprobantes-subtitle-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .comprobantes-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .comprobantes-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .comprobantes-kpis-grid {
        grid-template-columns: 1fr;
      }
    }
    .kpi-widget-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
    }
    .kpi-widget-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
      transform: translateY(-1px);
    }
    .kpi-widget-card.border-blue-500 {
      border-color: #bfdbfe;
      background: linear-gradient(135deg, rgba(219, 234, 254, 0.35) 0%, #ffffff 100%);
    }
    .kpi-widget-card.border-green-500 {
      border-color: #bbf7d0;
      background: linear-gradient(135deg, rgba(220, 252, 231, 0.35) 0%, #ffffff 100%);
    }
    .kpi-widget-card.border-indigo-500 {
      border-color: #c7d2fe;
      background: linear-gradient(135deg, rgba(224, 231, 255, 0.35) 0%, #ffffff 100%);
    }
    .kpi-widget-card.border-purple-500 {
      border-color: #e9d5ff;
      background: linear-gradient(135deg, rgba(243, 232, 255, 0.35) 0%, #ffffff 100%);
    }
    .kpi-widget-card.border-red-500 {
      border-color: #fecaca;
      background: linear-gradient(135deg, rgba(254, 226, 226, 0.35) 0%, #ffffff 100%);
    }
    .kpi-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }
    .kpi-widget-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    .kpi-widget-icon-box {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
    }
    .kpi-widget-value {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: var(--font-mono);
      line-height: 1.2;
    }
    .kpi-widget-footer {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.35rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .filter-box-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.875rem;
      padding: 1rem 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      margin-bottom: 1.25rem;
    }
    .filter-box-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.875rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .filter-box-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }
    .filter-form-row {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .filter-input-group {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .filter-input-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
      margin-bottom: 1px;
    }
    .table-container-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.875rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    .badge-tipo-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.025em;
    }
    .badge-tipo-cau {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .badge-tipo-ing {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .badge-tipo-egr {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .badge-tipo-aju {
      background: #fefce8;
      color: #a16207;
      border: 1px solid #fde047;
    }
    .badge-tipo-not {
      background: #faf5ff;
      color: #7e22ce;
      border: 1px solid #e9d5ff;
    }
    .badge-tipo-cier {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .badge-tipo-ape {
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fed7aa;
    }
    .badge-estado-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 700;
    }
    .badge-estado-activo {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .badge-estado-draft {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .badge-estado-void {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .action-btn-circle {
      width: 1.875rem;
      height: 1.875rem;
      border-radius: 0.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #475569;
      font-size: 0.8125rem;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .action-btn-circle:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #0f172a;
      transform: scale(1.05);
    }
    .action-btn-circle.action-anular:hover {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }
    .action-btn-circle.action-imprimir:hover {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #2563eb;
    }
  `],
  template: `
    <div class="tab-content" data-testid="tab-content-comprobantes">
      <!-- 1. Header Banner Institucional NIIF -->
      <div class="comprobantes-header-banner">
        <div class="comprobantes-header-main">
          <div class="comprobantes-icon-wrap">📑</div>
          <div class="comprobantes-texts-wrap">
            <div class="comprobantes-title-row">
              <h3 class="comprobantes-title-text">Libro de Comprobantes y Asientos Contables</h3>
              <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <span>🏛️</span>
                <span>Decreto 2420 NIIF</span>
              </span>
            </div>
            <p class="comprobantes-subtitle-text">
              Registro cronológico de causaciones, tesorería, notas y ajustes contables con verificación estricta de partida doble
            </p>
          </div>
        </div>
        <div class="hidden sm:flex items-center gap-2">
          <div class="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 flex items-center gap-1.5 shadow-2xs">
            <span>⚖️</span>
            <span><strong>Regla de Partida Doble:</strong> Toda transacción garantiza Débito = Crédito</span>
          </div>
        </div>
      </div>

      <!-- 2. Widgets de Métricas y KPIs Estandarizados -->
      <div class="comprobantes-kpis-grid" data-testid="kpis-comprobantes-grid">
        <!-- Widget 1: Total Comprobantes -->
        <div class="kpi-widget-card border-blue-500">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title">Total Comprobantes</span>
            <div class="kpi-widget-icon-box bg-blue-100 text-blue-700">📑</div>
          </div>
          <div class="kpi-widget-value text-blue-700" data-testid="kpi-total-comprobantes">
            {{ totalAsientos() }}
          </div>
          <div class="kpi-widget-footer">
            <span>{{ conteoActivos() }} Asentados</span>
            <span class="text-slate-400">·</span>
            <span class="text-amber-600">{{ conteoBorradores() }} Borradores</span>
            <span class="text-slate-400">·</span>
            <span class="text-rose-600">{{ conteoAnulados() }} Anulados</span>
          </div>
        </div>

        <!-- Widget 2: Total Débitos -->
        <div class="kpi-widget-card border-green-500">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title">Total Débitos</span>
            <div class="kpi-widget-icon-box bg-emerald-100 text-emerald-700">🟢</div>
          </div>
          <div class="kpi-widget-value text-emerald-700" data-testid="kpi-total-debitos">
            $ {{ totalDebitos() | number:'1.2-2' }}
          </div>
          <div class="kpi-widget-footer">
            <span>Sumatoria cargos en el rango</span>
            <span class="text-emerald-700 font-bold">Cargos</span>
          </div>
        </div>

        <!-- Widget 3: Total Créditos -->
        <div class="kpi-widget-card border-indigo-500">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title">Total Créditos</span>
            <div class="kpi-widget-icon-box bg-indigo-100 text-indigo-700">🔵</div>
          </div>
          <div class="kpi-widget-value text-indigo-700" data-testid="kpi-total-creditos">
            $ {{ totalCreditos() | number:'1.2-2' }}
          </div>
          <div class="kpi-widget-footer">
            <span>Sumatoria abonos en el rango</span>
            <span class="text-indigo-700 font-bold">Abonos</span>
          </div>
        </div>

        <!-- Widget 4: Balance de Partida Doble -->
        <div
          class="kpi-widget-card"
          [class.border-green-500]="cuadraTotales()"
          [class.border-red-500]="!cuadraTotales()"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title">Balance de Partida Doble</span>
            <div
              class="kpi-widget-icon-box"
              [class.bg-emerald-100]="cuadraTotales()"
              [class.text-emerald-700]="cuadraTotales()"
              [class.bg-rose-100]="!cuadraTotales()"
              [class.text-rose-700]="!cuadraTotales()"
            >
              {{ cuadraTotales() ? '⚖️' : '⚠️' }}
            </div>
          </div>
          <div
            class="kpi-widget-value"
            [class.text-emerald-700]="cuadraTotales()"
            [class.text-rose-700]="!cuadraTotales()"
            data-testid="kpi-estado-cuadre"
          >
            {{ cuadraTotales() ? 'Balanceado' : 'Descuadrado' }}
          </div>
          <div class="kpi-widget-footer">
            <span>Diferencia: $ {{ diferencia() | number:'1.2-2' }}</span>
            <span
              class="font-bold px-1.5 py-0.5 rounded text-[10px]"
              [class.bg-emerald-100]="cuadraTotales()"
              [class.text-emerald-800]="cuadraTotales()"
              [class.bg-rose-100]="!cuadraTotales()"
              [class.text-rose-800]="!cuadraTotales()"
            >
              {{ cuadraTotales() ? '✓ OK' : '✗ Descuadre' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 3. Caja de Filtros y Barra de Acciones -->
      <div class="filter-box-card">
        <div class="filter-box-header">
          <h4 class="filter-box-title">
            <span>🔍</span>
            <span>Filtros de Búsqueda y Rango Cronológico</span>
          </h4>
          <span class="text-xs text-slate-500 font-medium">
            Mostrando <strong>{{ asientos().length }}</strong> asientos contables
          </span>
        </div>

        <div class="filter-form-row">
          <div class="filter-input-group">
            <label class="filter-input-label">📅 Fecha Desde</label>
            <input
              class="input-base input-sm w-[135px] font-mono"
              data-testid="input-filtro-desde"
              type="text"
              appFlatpickr
              placeholder="dd/mm/aaaa"
              [ngModel]="filtroDesde()"
              (ngModelChange)="filtroDesde.set($event)"
            />
          </div>

          <div class="filter-input-group">
            <label class="filter-input-label">📅 Fecha Hasta</label>
            <input
              class="input-base input-sm w-[135px] font-mono"
              data-testid="input-filtro-hasta"
              type="text"
              appFlatpickr
              [minDate]="filtroDesde()"
              placeholder="dd/mm/aaaa"
              [ngModel]="filtroHasta()"
              (ngModelChange)="filtroHasta.set($event)"
            />
          </div>

          <div class="filter-input-group">
            <label class="filter-input-label">🏷️ Tipo de Comprobante</label>
            <select
              class="input-base input-sm w-[210px]"
              data-testid="select-filtro-tipo"
              [ngModel]="filtroTipo()"
              (ngModelChange)="filtroTipo.set($event)"
            >
              <option value="">📂 Todos los Tipos</option>
              <option value="CAU">🧾 CAU — Causación</option>
              <option value="ING">💵 ING — Ingreso / Recaudo</option>
              <option value="EGR">💸 EGR — Egreso / Pago</option>
              <option value="AJU">⚙️ AJU — Ajuste Contable</option>
              <option value="NOT">📝 NOT — Nota Contable</option>
              <option value="CIER">🏁 CIER — Cierre Fiscal</option>
              <option value="APE">🏛️ APE — Apertura Inicial</option>
            </select>
          </div>

          <div class="filter-input-group">
            <label class="filter-input-label">🚦 Estado</label>
            <select
              class="input-base input-sm w-[190px]"
              data-testid="select-filtro-estado"
              [ngModel]="filtroEstado()"
              (ngModelChange)="filtroEstado.set($event)"
            >
              <option value="">🌐 Todos los Estados</option>
              <option value="POSTED">🟢 POSTED (Asentado)</option>
              <option value="ACTIVO">✅ ACTIVO</option>
              <option value="DRAFT">🟡 DRAFT (Borrador)</option>
              <option value="VOID">🔴 VOID (Anulado)</option>
              <option value="ANULADO">⛔ ANULADO</option>
            </select>
          </div>

          <button
            type="button"
            class="btn-secondary btn-sm inline-flex items-center gap-1.5 font-semibold"
            data-testid="btn-buscar-comprobantes"
            (click)="buscar()"
            [disabled]="cargando()"
          >
            <span>🔍</span>
            <span>Buscar</span>
          </button>

          <button
            type="button"
            class="btn-primary btn-sm ml-auto inline-flex items-center gap-1.5 font-semibold shadow-xs"
            data-testid="btn-nuevo-comprobante"
            (click)="abrirModalNuevo()"
          >
            <span>+</span>
            <span>Nuevo Comprobante</span>
          </button>
        </div>
      </div>

      <!-- 4. Tabla de Comprobantes con Diseño Modernizado -->
      @if (cargando()) {
        <div class="table-container-card p-12 flex flex-col items-center justify-center text-slate-500" data-testid="comprobantes-loading-spinner">
          <div class="spinner mb-3"></div>
          <span class="text-xs font-semibold">Cargando comprobantes contables...</span>
        </div>
      } @else {
        <div class="table-container-card" data-testid="tabla-comprobantes-container">
          <div class="overflow-x-auto max-h-[540px]">
            <table class="tabla-datos w-full text-xs" data-testid="tabla-comprobantes">
              <thead class="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr>
                  <th class="py-2.5 px-3 text-left font-bold text-slate-700 w-[110px]">🏷️ Tipo</th>
                  <th class="py-2.5 px-3 text-left font-bold text-slate-700 w-[170px]">🔢 Consecutivo</th>
                  <th class="py-2.5 px-3 text-left font-bold text-slate-700 w-[120px]">📅 Fecha</th>
                  <th class="py-2.5 px-3 text-left font-bold text-slate-700 min-w-[200px]">📝 Concepto / Módulo</th>
                  <th class="py-2.5 px-3 text-right font-bold text-slate-700 w-[140px]">📈 Débito</th>
                  <th class="py-2.5 px-3 text-right font-bold text-slate-700 w-[140px]">📉 Crédito</th>
                  <th class="py-2.5 px-3 text-center font-bold text-slate-700 w-[120px]">🚦 Estado</th>
                  <th class="py-2.5 px-3 text-center font-bold text-slate-700 w-[120px]">⚡ Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (a of asientos(); track a.id) {
                  <tr
                    class="hover:bg-slate-50/80 transition-colors"
                    [class.opacity-50]="a.estado === 'VOID' || a.estado === 'ANULADO'"
                    [class.bg-rose-50/20]="a.estado === 'VOID' || a.estado === 'ANULADO'"
                    [attr.data-testid]="'row-asiento-' + a.id"
                  >
                    <td class="py-2 px-3 whitespace-nowrap">
                      <span [class]="badgeTipoClass(a.tipoComprobante)">
                        {{ a.tipoComprobante }}
                      </span>
                    </td>
                    <td class="py-2 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      <span class="text-blue-600">{{ a.tipoComprobante }}</span>-{{ a.consecutivo | number:'6.0-0' }}
                    </td>
                    <td class="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {{ a.fechaContable }}
                    </td>
                    <td
                      class="py-2 px-3 truncate max-w-[240px] text-slate-700 cursor-help"
                      style="max-width: 240px; width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                      [title]="a.concepto || a.fuenteModulo || 'Comprobante Contable'"
                      [attr.data-testid]="'concepto-asiento-' + a.id"
                    >
                      <span class="font-medium">{{ a.concepto || a.fuenteModulo || 'Comprobante Contable' }}</span>
                    </td>
                    <td class="py-2 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                      $ {{ a.totalDebito | number:'1.2-2' }}
                    </td>
                    <td class="py-2 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                      $ {{ a.totalCredito | number:'1.2-2' }}
                    </td>
                    <td class="py-2 px-3 text-center whitespace-nowrap">
                      <span [class]="badgeEstadoClass(a.estado)">
                        {{ a.estado }}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-center whitespace-nowrap">
                      <div class="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          class="action-btn-circle"
                          title="Ver detalle del asiento"
                          [attr.data-testid]="'btn-ver-detalle-' + a.id"
                          (click)="verDetalle(a)"
                        >
                          👁
                        </button>
                        @if (a.estado !== 'VOID' && a.estado !== 'ANULADO') {
                          <button
                            type="button"
                            class="action-btn-circle action-anular"
                            title="Anular comprobante"
                            [attr.data-testid]="'btn-anular-' + a.id"
                            (click)="abrirModalAnular(a)"
                          >
                            ⊘
                          </button>
                        }
                        <button
                          type="button"
                          class="action-btn-circle action-imprimir"
                          title="Imprimir comprobante oficial (PDF)"
                          [attr.data-testid]="'btn-imprimir-' + a.id"
                          (click)="imprimirComprobante(a)"
                        >
                          🖨
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (asientos().length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-12 text-slate-400">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <span class="text-3xl">📭</span>
                        <span class="font-medium text-slate-600">No se encontraron comprobantes en el rango seleccionado.</span>
                        <span class="text-xs text-slate-400">Modifica las fechas o tipos en la barra de filtros superior.</span>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- 5. Barra de Totales y Resumen Inferior -->
          <div
            class="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs"
            data-testid="totales-comprobantes"
          >
            <div class="flex items-center gap-3 text-slate-600">
              <span>Registros: <strong class="font-mono text-slate-800">{{ asientos().length }}</strong></span>
              <span class="text-slate-300">|</span>
              <span>Rango: <strong class="font-mono text-slate-800">{{ filtroDesde() }}</strong> a <strong class="font-mono text-slate-800">{{ filtroHasta() }}</strong></span>
            </div>

            <div class="flex items-center gap-6 font-semibold">
              <div class="flex items-center gap-2">
                <span class="text-slate-500">Total Débitos:</span>
                <strong class="font-mono text-slate-900 text-sm">$ {{ totalDebitos() | number:'1.2-2' }}</strong>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-slate-500">Total Créditos:</span>
                <strong class="font-mono text-slate-900 text-sm">$ {{ totalCreditos() | number:'1.2-2' }}</strong>
              </div>

              <span
                class="px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 shadow-2xs"
                [class.bg-emerald-100]="cuadraTotales()"
                [class.text-emerald-800]="cuadraTotales()"
                [class.border]="true"
                [class.border-emerald-200]="cuadraTotales()"
                [class.bg-rose-100]="!cuadraTotales()"
                [class.text-rose-800]="!cuadraTotales()"
                [class.border-rose-200]="!cuadraTotales()"
              >
                <span>{{ cuadraTotales() ? '✓' : '✗' }}</span>
                <span>{{ cuadraTotales() ? 'Cuadra' : 'No Cuadra' }}</span>
              </span>
            </div>
          </div>
        </div>
      }

      <!-- ─── MODALES REACTIVOS INDEPENDIENTES ─── -->
      <app-modal-nuevo-asiento
        [visible]="modalNuevoVisible()"
        (closeModal)="modalNuevoVisible.set(false)"
        (asientoCreado)="onAsientoCreado($event)"
      />

      <app-modal-detalle-asiento
        [visible]="modalDetalleVisible()"
        [asiento]="asientoSeleccionado()"
        (closeModal)="modalDetalleVisible.set(false)"
      />

      <app-modal-anular-asiento
        [visible]="modalAnularVisible()"
        [asiento]="asientoSeleccionado()"
        (closeModal)="modalAnularVisible.set(false)"
        (anulado)="onAsientoAnulado($event)"
      />
    </div>
  `,
})
export class ContabilidadComprobantesComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly cargando = signal<boolean>(false);
  readonly modalNuevoVisible = signal<boolean>(false);
  readonly modalDetalleVisible = signal<boolean>(false);
  readonly modalAnularVisible = signal<boolean>(false);
  readonly asientos = signal<Asiento[]>([]);
  readonly asientoSeleccionado = signal<Asiento | null>(null);

  readonly filtroDesde = signal<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
  );
  readonly filtroHasta = signal<string>(new Date().toISOString().split('T')[0]);
  readonly filtroTipo = signal<string>('');
  readonly filtroEstado = signal<string>('');

  readonly totalAsientos = computed(() => this.asientos().length);

  readonly conteoActivos = computed(() => {
    return this.asientos().filter((a) => a.estado === 'POSTED' || a.estado === 'ACTIVO').length;
  });

  readonly conteoBorradores = computed(() => {
    return this.asientos().filter((a) => a.estado === 'DRAFT').length;
  });

  readonly conteoAnulados = computed(() => {
    return this.asientos().filter((a) => a.estado === 'VOID' || a.estado === 'ANULADO').length;
  });

  readonly totalDebitos = computed(() => {
    const list = this.asientos();
    if (!Array.isArray(list)) return 0;
    return Math.round(list.reduce((sum, a) => sum + (Number(a.totalDebito) || 0), 0) * 100) / 100;
  });

  readonly totalCreditos = computed(() => {
    const list = this.asientos();
    if (!Array.isArray(list)) return 0;
    return Math.round(list.reduce((sum, a) => sum + (Number(a.totalCredito) || 0), 0) * 100) / 100;
  });

  readonly diferencia = computed(() => {
    return Math.round(Math.abs(this.totalDebitos() - this.totalCreditos()) * 100) / 100;
  });

  readonly cuadraTotales = computed(() => {
    return this.diferencia() < 0.01;
  });

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.cargando.set(true);
    this.svc
      .getComprobantes({
        fechaInicio: this.filtroDesde(),
        fechaFin: this.filtroHasta(),
        tipoComprobante: this.filtroTipo() || undefined,
        estado: this.filtroEstado() || undefined,
        limit: 100,
      })
      .subscribe({
        next: (res) => {
          const items = Array.isArray(res) ? res : res.data ?? [];
          this.asientos.set(items);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  verDetalle(a: Asiento): void {
    this.asientoSeleccionado.set(a);
    this.modalDetalleVisible.set(true);
  }

  abrirModalNuevo(): void {
    this.modalNuevoVisible.set(true);
  }

  abrirModalAnular(a: Asiento): void {
    this.asientoSeleccionado.set(a);
    this.modalAnularVisible.set(true);
  }

  imprimirComprobante(a: Asiento): void {
    this.svc.descargarReportePdf('comprobante', { id: a.id });
  }

  onAsientoCreado(_nuevo: Asiento): void {
    this.buscar();
  }

  onAsientoAnulado(_anulado: Asiento): void {
    this.buscar();
  }

  badgeTipoClass(tipo: TipoComprobante): string {
    const map: Record<string, string> = {
      CAU: 'badge-tipo-pill badge-tipo-cau',
      ING: 'badge-tipo-pill badge-tipo-ing',
      EGR: 'badge-tipo-pill badge-tipo-egr',
      AJU: 'badge-tipo-pill badge-tipo-aju',
      NOT: 'badge-tipo-pill badge-tipo-not',
      CIER: 'badge-tipo-pill badge-tipo-cier',
      CIE: 'badge-tipo-pill badge-tipo-cier',
      APE: 'badge-tipo-pill badge-tipo-ape',
      APR: 'badge-tipo-pill badge-tipo-ape',
    };
    return map[tipo] ?? 'badge-tipo-pill badge-tipo-cier';
  }

  badgeEstadoClass(estado: EstadoAsiento): string {
    if (estado === 'POSTED' || estado === 'ACTIVO') return 'badge-estado-pill badge-estado-activo';
    if (estado === 'DRAFT') return 'badge-estado-pill badge-estado-draft';
    return 'badge-estado-pill badge-estado-void';
  }
}

