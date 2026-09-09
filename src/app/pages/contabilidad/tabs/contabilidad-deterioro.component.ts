import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';
import { ContabilidadService } from '../services/contabilidad.service';
import { MatrizDeterioroModel, TramoDeterioroModel, ResultadoAsientoDeterioroModel } from '../models/contabilidad.models';

@Component({
  selector: 'app-contabilidad-deterioro',
  standalone: true,
  imports: [CommonModule, FormsModule, FlatpickrDirective],
  styles: [`
    .deterioro-header-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .deterioro-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .deterioro-icon-wrap {
      font-size: 1.75rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .deterioro-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .deterioro-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .deterioro-title-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .deterioro-subtitle-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .deterioro-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .deterioro-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .deterioro-kpis-grid {
        grid-template-columns: 1fr;
      }
    }
    .kpi-card {
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
    .kpi-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
      border-color: #cbd5e1;
    }
    .kpi-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    .kpi-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin-top: 0.25rem;
    }
    .kpi-subtext {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }
    .matrix-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    .matrix-header {
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
    }
    .table-custom {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      text-align: left;
    }
    .table-custom th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .table-custom td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .table-custom tr:hover {
      background: #f8fafc;
    }
    .badge-risk {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 600;
    }
    .badge-risk-low {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .badge-risk-medium {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    .badge-risk-warning {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .badge-risk-high {
      background: #fff7ed;
      color: #9a3412;
      border: 1px solid #fed7aa;
    }
    .badge-risk-critical {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .badge-risk-loss {
      background: #450a0a;
      color: #ffffff;
      border: 1px solid #7f1d1d;
    }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(2px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 0.875rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 100%;
      max-width: 34rem;
      overflow: hidden;
      animation: modalFadeIn 0.15s ease-out;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
    }
    .modal-body {
      padding: 1.25rem;
    }
    .modal-footer {
      padding: 0.875rem 1.25rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `],
  template: `
    <div class="tab-content" data-testid="tab-content-deterioro">
      <!-- Header Banner -->
      <div class="deterioro-header-banner" data-testid="deterioro-header-banner">
        <div class="deterioro-header-main">
          <div class="deterioro-icon-wrap">📉</div>
          <div class="deterioro-texts-wrap">
            <div class="deterioro-title-row">
              <h2 class="deterioro-title-text" data-testid="deterioro-title">
                Deterioro de Cartera Morosa (NIIF 9 / Sección 11 NIIF Pymes)
              </h2>
              <span class="badge-mini" style="background: rgba(239, 68, 68, 0.1); color: #dc2626; border-color: rgba(239, 68, 68, 0.2);">
                Norma Técnica NIIF
              </span>
            </div>
            <p class="deterioro-subtitle-text" data-testid="deterioro-subtitle">
              Matriz de pérdida crediticia esperada sobre pensiones y matrículas escolares con corte por tramos de vencimiento.
            </p>
          </div>
        </div>

        <div class="flex items-end gap-2 flex-wrap">
          <div class="form-group-inline mb-0">
            <label class="form-label-sm">Fecha de Corte</label>
            <input
              type="text"
              appFlatpickr
              placeholder="dd/mm/aaaa"
              class="input-base input-sm font-semibold w-[150px]"
              data-testid="input-fecha-corte-deterioro"
              [ngModel]="fechaCorte()"
              (ngModelChange)="fechaCorte.set($event)"
            />
          </div>

          <div class="flex items-center gap-2 mb-0.5">
            <button
              type="button"
              class="btn-secondary btn-sm flex items-center gap-1.5"
              data-testid="btn-consultar-deterioro"
              [disabled]="cargando()"
              (click)="cargarMatriz()"
            >
              <span>🔄</span>
              <span>{{ cargando() ? 'Calculando...' : 'Recalcular Matriz' }}</span>
            </button>

            <button
              type="button"
              class="btn-primary btn-sm flex items-center gap-1.5"
              style="background: #dc2626; border-color: #b91c1c;"
              data-testid="btn-generar-asiento-deterioro"
              [disabled]="cargando() || !matriz()"
              (click)="abrirModalConfirmacion()"
            >
              <span>⚖️</span>
              <span>Contabilizar Ajuste (AJU)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Error Banner -->
      @if (errorMensaje()) {
        <div class="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between" data-testid="deterioro-error-banner">
          <span>{{ errorMensaje() }}</span>
          <button type="button" class="text-red-500 font-bold ml-2" (click)="errorMensaje.set(null)">✕</button>
        </div>
      }

      <!-- KPIs Grid -->
      <div class="deterioro-kpis-grid" data-testid="deterioro-kpis">
        <div class="kpi-card" data-testid="kpi-total-cartera">
          <span class="kpi-title">Cartera Total Evaluada</span>
          <div class="kpi-value">
            $ {{ (matriz()?.totalCartera || 0) | number:'1.0-0' }}
          </div>
          <span class="kpi-subtext">Pensiones y conceptos por cobrar</span>
        </div>

        <div class="kpi-card" data-testid="kpi-total-deterioro">
          <span class="kpi-title">Pérdida Crediticia Esperada</span>
          <div class="kpi-value text-red-600">
            $ {{ (matriz()?.totalDeterioroCalculado || 0) | number:'1.0-0' }}
          </div>
          <span class="kpi-subtext">Provisión acumulada requerida</span>
        </div>

        <div class="kpi-card" data-testid="kpi-tasa-deterioro">
          <span class="kpi-title">Tasa Global de Deterioro</span>
          <div class="kpi-value text-amber-600">
            {{ tasaGlobalDeterioro() | number:'1.2-2' }}%
          </div>
          <span class="kpi-subtext">Impacto sobre cartera global</span>
        </div>

        <div class="kpi-card" data-testid="kpi-cuentas-afectadas">
          <span class="kpi-title">Asiento Contable NIIF</span>
          <div class="text-xs font-bold text-slate-800 mt-2">
            DR: 519905 (Gasto Deterioro)
          </div>
          <div class="text-xs font-bold text-indigo-700 mt-1">
            CR: 139905 (Deterioro Cartera)
          </div>
        </div>
      </div>

      <!-- Matriz de Envejecimiento Table -->
      <div class="matrix-card" data-testid="matrix-deterioro-card">
        <div class="matrix-header">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-slate-800" data-testid="matrix-table-title">
              Matriz de Envejecimiento y Factores de Deterioro
            </span>
            <span class="text-xs text-slate-500">
              (Corte al {{ matriz()?.fechaCorte || fechaCorte() }})
            </span>
          </div>
          <span class="text-xs font-medium text-slate-500">
            6 Tramos Evaluados
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="table-custom" data-testid="table-deterioro">
            <thead>
              <tr>
                <th class="w-12 text-center">#</th>
                <th>Tramo de Vencimiento</th>
                <th class="text-right">Saldo Cartera ($)</th>
                <th class="text-right">% Pérdida NIIF</th>
                <th class="text-right">Valor Deterioro ($)</th>
                <th class="text-center">Nivel de Riesgo</th>
                <th class="text-center">Cuenta Crédito</th>
              </tr>
            </thead>
            <tbody>
              @for (tramo of matriz()?.tramos || []; track tramo.rango; let idx = $index) {
                <tr [attr.data-testid]="'row-tramo-' + idx">
                  <td class="text-center font-semibold text-slate-400">{{ idx + 1 }}</td>
                  <td class="font-semibold text-slate-800" [attr.data-testid]="'tramo-rango-' + idx">
                    {{ tramo.rango }}
                  </td>
                  <td class="text-right font-medium text-slate-700" [attr.data-testid]="'tramo-saldo-' + idx">
                    $ {{ tramo.saldo | number:'1.0-0' }}
                  </td>
                  <td class="text-right font-bold text-amber-700" [attr.data-testid]="'tramo-porcentaje-' + idx">
                    {{ tramo.porcentajeNIIF | number:'1.1-1' }}%
                  </td>
                  <td class="text-right font-bold text-red-600" [attr.data-testid]="'tramo-valor-' + idx">
                    $ {{ tramo.valorDeterioro | number:'1.0-0' }}
                  </td>
                  <td class="text-center">
                    <span [class]="getBadgeRiskClass(tramo.rango)" [attr.data-testid]="'tramo-risk-' + idx">
                      {{ getRiskLabel(tramo.rango) }}
                    </span>
                  </td>
                  <td class="text-center font-mono text-xs text-slate-600">
                    139905
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-8 text-slate-400">
                    No se han cargado tramos de deterioro. Haga clic en "Recalcular Matriz".
                  </td>
                </tr>
              }
            </tbody>
            @if (matriz()) {
              <tfoot>
                <tr class="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <td colspan="2" class="text-slate-800 uppercase text-xs py-3 px-4">
                    TOTALES CONSOLIDADOS
                  </td>
                  <td class="text-right text-slate-900 py-3 px-4" data-testid="footer-total-cartera">
                    $ {{ matriz()!.totalCartera | number:'1.0-0' }}
                  </td>
                  <td class="text-right text-amber-700 py-3 px-4">
                    {{ tasaGlobalDeterioro() | number:'1.2-2' }}%
                  </td>
                  <td class="text-right text-red-700 py-3 px-4" data-testid="footer-total-deterioro">
                    $ {{ matriz()!.totalDeterioroCalculado | number:'1.0-0' }}
                  </td>
                  <td colspan="2" class="text-center text-xs text-slate-500 py-3 px-4">
                    Partida Doble Cuadrada
                  </td>
                </tr>
              </tfoot>
            }
          </table>
        </div>
      </div>

      <!-- Modal de Confirmación de Asiento -->
      @if (mostrarModalConfirmacion()) {
        <div class="modal-overlay" data-testid="modal-confirmar-deterioro-overlay" (click)="cerrarModalConfirmacion()">
          <div class="modal-card" data-testid="modal-confirmar-deterioro" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="flex items-center gap-2">
                <span class="text-lg">⚖️</span>
                <h3 class="font-bold text-slate-800 text-sm" data-testid="modal-confirmar-title">
                  Confirmar Contabilización de Deterioro NIIF 9
                </h3>
              </div>
              <button type="button" class="text-slate-400 hover:text-slate-600 font-bold text-sm" (click)="cerrarModalConfirmacion()">✕</button>
            </div>

            <div class="modal-body space-y-3">
              <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs leading-relaxed">
                <strong>Atención:</strong> Se generará un comprobante de <strong>Ajuste Contable (AJU)</strong> afectando el estado de resultados del colegio y la provisión acumulada de cartera.
              </div>

              <div class="space-y-2 text-xs text-slate-700">
                <div class="flex justify-between border-b pb-1">
                  <span class="text-slate-500">Fecha de Corte:</span>
                  <span class="font-semibold">{{ fechaCorte() }}</span>
                </div>
                <div class="flex justify-between border-b pb-1">
                  <span class="text-slate-500">Tipo de Comprobante:</span>
                  <span class="font-semibold">AJU (Ajuste de Cierre Mensual)</span>
                </div>
                <div class="flex justify-between border-b pb-1">
                  <span class="text-slate-500">Débito (Gasto Deterioro):</span>
                  <span class="font-semibold font-mono text-slate-800">519905 - Deterioro Cartera Clientes</span>
                </div>
                <div class="flex justify-between border-b pb-1">
                  <span class="text-slate-500">Crédito (Provisión):</span>
                  <span class="font-semibold font-mono text-slate-800">139905 - Deterioro Acumulado Clientes</span>
                </div>
                <div class="flex justify-between border-b pb-1 text-sm font-bold text-red-600">
                  <span>Monto Total a Ajustar:</span>
                  <span>$ {{ (matriz()?.totalDeterioroCalculado || 0) | number:'1.0-0' }}</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Concepto / Justificación Contable:
                </label>
                <textarea
                  class="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                  rows="2"
                  data-testid="textarea-observacion-deterioro"
                  [ngModel]="observacionAsiento()"
                  (ngModelChange)="observacionAsiento.set($event)"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-cancelar-asiento-deterioro"
                [disabled]="generandoAsiento()"
                (click)="cerrarModalConfirmacion()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary btn-sm flex items-center gap-1.5"
                style="background: #dc2626; border-color: #b91c1c;"
                data-testid="btn-confirmar-asiento-deterioro"
                [disabled]="generandoAsiento()"
                (click)="ejecutarContabilizacion()"
              >
                <span>⚖️</span>
                <span>{{ generandoAsiento() ? 'Contabilizando...' : 'Confirmar y Contabilizar' }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Resultado Exitoso -->
      @if (resultadoAsiento()) {
        <div class="modal-overlay" data-testid="modal-resultado-deterioro-overlay" (click)="resultadoAsiento.set(null)">
          <div class="modal-card" data-testid="modal-resultado-deterioro" (click)="$event.stopPropagation()">
            <div class="modal-header bg-emerald-50 border-emerald-200">
              <div class="flex items-center gap-2">
                <span class="text-xl">✅</span>
                <h3 class="font-bold text-emerald-900 text-sm" data-testid="modal-resultado-title">
                  Ajuste Contable Generado Exitosamente
                </h3>
              </div>
              <button type="button" class="text-slate-400 hover:text-slate-600 font-bold text-sm" (click)="resultadoAsiento.set(null)">✕</button>
            </div>

            <div class="modal-body space-y-3">
              <div class="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
                El comprobante de ajuste por deterioro de cartera se registró con partida doble balanceada en la base de datos institucional.
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span class="text-slate-500 block">Comprobante No:</span>
                  <span class="font-bold text-slate-800 font-mono text-sm" data-testid="resultado-consecutivo">
                    {{ resultadoAsiento()!.tipoComprobante }}-{{ resultadoAsiento()!.consecutivo }}
                  </span>
                </div>
                <div class="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span class="text-slate-500 block">Estado:</span>
                  <span class="font-bold text-emerald-600" data-testid="resultado-estado">
                    {{ resultadoAsiento()!.estado }}
                  </span>
                </div>
                <div class="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span class="text-slate-500 block">Total Débito:</span>
                  <span class="font-bold text-slate-800" data-testid="resultado-debito">
                    $ {{ resultadoAsiento()!.totalDebito | number:'1.0-0' }}
                  </span>
                </div>
                <div class="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span class="text-slate-500 block">Total Crédito:</span>
                  <span class="font-bold text-slate-800" data-testid="resultado-credito">
                    $ {{ resultadoAsiento()!.totalCredito | number:'1.0-0' }}
                  </span>
                </div>
              </div>

              <div class="text-xs text-slate-600 border-t pt-2">
                <span class="text-slate-400 block mb-0.5">Concepto:</span>
                <p class="italic text-slate-700" data-testid="resultado-concepto">
                  {{ resultadoAsiento()!.concepto }}
                </p>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-primary btn-sm"
                data-testid="btn-cerrar-resultado-deterioro"
                (click)="resultadoAsiento.set(null)"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContabilidadDeterioroComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly fechaCorte = signal<string>(new Date().toISOString().split('T')[0]);
  readonly cargando = signal<boolean>(false);
  readonly generandoAsiento = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly matriz = signal<MatrizDeterioroModel | null>(null);

  readonly mostrarModalConfirmacion = signal<boolean>(false);
  readonly observacionAsiento = signal<string>('Ajuste por Deterioro de Cartera Morosa NIIF 9');
  readonly resultadoAsiento = signal<ResultadoAsientoDeterioroModel | null>(null);

  readonly tasaGlobalDeterioro = computed(() => {
    const m = this.matriz();
    if (!m || m.totalCartera <= 0) return 0;
    return (m.totalDeterioroCalculado / m.totalCartera) * 100;
  });

  ngOnInit(): void {
    this.cargarMatriz();
  }

  cargarMatriz(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.svc.getMatrizDeterioro(this.fechaCorte()).subscribe({
      next: (res) => {
        this.matriz.set(res);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener matriz de deterioro:', err);
        this.errorMensaje.set('No se pudo calcular la matriz de deterioro. Verifique la conexión con el servidor.');
        this.cargando.set(false);
      },
    });
  }

  abrirModalConfirmacion(): void {
    this.observacionAsiento.set(`Ajuste por Deterioro de Cartera Morosa NIIF 9 - Corte ${this.fechaCorte()}`);
    this.mostrarModalConfirmacion.set(true);
  }

  cerrarModalConfirmacion(): void {
    if (!this.generandoAsiento()) {
      this.mostrarModalConfirmacion.set(false);
    }
  }

  ejecutarContabilizacion(): void {
    this.generandoAsiento.set(true);
    this.errorMensaje.set(null);

    const dto = {
      fechaCorte: this.fechaCorte(),
      observacion: this.observacionAsiento(),
    };

    this.svc.generarAsientoDeterioro(dto).subscribe({
      next: (res) => {
        this.generandoAsiento.set(false);
        this.mostrarModalConfirmacion.set(false);
        this.resultadoAsiento.set(res);
      },
      error: (err) => {
        console.error('Error al contabilizar deterioro:', err);
        this.errorMensaje.set('Error al contabilizar el comprobante de ajuste de deterioro.');
        this.generandoAsiento.set(false);
      },
    });
  }

  getBadgeRiskClass(rango: string): string {
    switch (rango) {
      case '1-30 días':
        return 'badge-risk badge-risk-low';
      case '31-60 días':
        return 'badge-risk badge-risk-medium';
      case '61-90 días':
        return 'badge-risk badge-risk-warning';
      case '91-180 días':
        return 'badge-risk badge-risk-high';
      case '181-360 días':
        return 'badge-risk badge-risk-critical';
      default:
        return 'badge-risk badge-risk-loss';
    }
  }

  getRiskLabel(rango: string): string {
    switch (rango) {
      case '1-30 días':
        return 'Bajo (1%)';
      case '31-60 días':
        return 'Moderado (3%)';
      case '61-90 días':
        return 'Atención (7%)';
      case '91-180 días':
        return 'Alerta (15%)';
      case '181-360 días':
        return 'Alto (40%)';
      default:
        return 'Pérdida Total (100%)';
    }
  }
}
