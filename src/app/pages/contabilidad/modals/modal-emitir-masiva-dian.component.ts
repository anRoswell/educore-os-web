import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DianService } from '../services/dian.service';
import { ResultadoFacturasMasivasModel } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-emitir-masiva-dian',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .modal-masiva-dian {
      width: 95% !important;
      max-width: 780px !important;
      max-height: 90vh !important;
      overflow-y: auto;
      padding: 1.5rem !important;
      border-radius: 1rem;
      background: #ffffff;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
  `],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-masiva-dian-backdrop" (click)="cancelar()">
        <div class="modal-box modal-masiva-dian" data-testid="modal-masiva-dian" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 text-xl font-bold shadow-sm">
                ⚡
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800" data-testid="modal-masiva-dian-title">
                  Emisión Masiva de Facturación Electrónica DIAN
                </h3>
                <p class="text-xs text-slate-500">
                  Generación por lote de facturas electrónicas para Cuentas de Cobro / Pensiones del periodo
                </p>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cancelar()"
              data-testid="btn-close-masiva-dian"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body space-y-4">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-center justify-between" data-testid="alert-error-masiva-dian">
                <span>⚠️ {{ errorMensaje() }}</span>
                <button type="button" class="text-red-700 font-bold" (click)="errorMensaje.set(null)">✕</button>
              </div>
            }

            @if (resultado()) {
              <!-- Resultado del Lote -->
              <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3" data-testid="resultado-masiva-dian">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>✅</span> Lote de Facturación Procesado
                  </span>
                  <span class="text-xs font-bold text-emerald-900 font-mono">
                    {{ resultado()!.exitosas }} de {{ resultado()!.totalProcesadas }} Facturas Generadas
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                  <div class="bg-white p-2 rounded-lg border border-emerald-100 shadow-xs">
                    <span class="text-slate-500 block">Total Solicitadas</span>
                    <strong class="text-sm font-mono text-slate-800" data-testid="res-total-solicitadas">{{ resultado()!.totalProcesadas }}</strong>
                  </div>
                  <div class="bg-white p-2 rounded-lg border border-emerald-100 shadow-xs">
                    <span class="text-emerald-600 block">Exitosas / DIAN</span>
                    <strong class="text-sm font-mono text-emerald-700" data-testid="res-total-exitosas">{{ resultado()!.exitosas }}</strong>
                  </div>
                  <div class="bg-white p-2 rounded-lg border border-emerald-100 shadow-xs">
                    <span class="text-rose-600 block">Fallidas / Omitidas</span>
                    <strong class="text-sm font-mono text-rose-700" data-testid="res-total-fallidas">{{ resultado()!.fallidas }}</strong>
                  </div>
                </div>

                @if (resultado()!.detalles.length > 0) {
                  <div class="max-h-48 overflow-y-auto border border-emerald-100 rounded-lg bg-white p-2 text-xs">
                    <table class="w-full text-left">
                      <thead class="text-slate-500 font-semibold border-b">
                        <tr>
                          <th class="p-1">Estudiante / Referencia</th>
                          <th class="p-1">Factura</th>
                          <th class="p-1 text-center">Estado DIAN</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        @for (d of resultado()!.detalles; track $index) {
                          <tr class="hover:bg-slate-50">
                            <td class="p-1 font-medium">{{ d.estudianteNombre || d.cuentaCobroId }}</td>
                            <td class="p-1 font-mono font-bold text-indigo-700">{{ d.numero || 'N/A' }}</td>
                            <td class="p-1 text-center">
                              <span
                                class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                [ngClass]="{
                                  'bg-emerald-100 text-emerald-800': d.estadoDian === 'ACEPTADO',
                                  'bg-amber-100 text-amber-800': d.estadoDian === 'ENVIADO' || d.estadoDian === 'BORRADOR',
                                  'bg-rose-100 text-rose-800': !d.numero || d.error
                                }"
                              >
                                {{ d.estadoDian || (d.error ? 'ERROR' : 'OK') }}
                              </span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            } @else {
              <!-- Formulario de Selección del Lote -->
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📅</span> Filtros de Liquidación y Periodo Escolar
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="form-group flex flex-col gap-1">
                    <label class="text-xs font-semibold text-slate-600">Año Lectivo *</label>
                    <input
                      type="number"
                      class="input-base text-xs font-mono font-bold"
                      data-testid="input-masiva-anio"
                      [ngModel]="anio()"
                      (ngModelChange)="anio.set(+$event)"
                    />
                  </div>

                  <div class="form-group flex flex-col gap-1">
                    <label class="text-xs font-semibold text-slate-600">Mes a Facturar *</label>
                    <select
                      class="input-base text-xs"
                      data-testid="select-masiva-mes"
                      [ngModel]="mes()"
                      (ngModelChange)="mes.set(+$event)"
                    >
                      <option [value]="1">Enero (01)</option>
                      <option [value]="2">Febrero (02)</option>
                      <option [value]="3">Marzo (03)</option>
                      <option [value]="4">Abril (04)</option>
                      <option [value]="5">Mayo (05)</option>
                      <option [value]="6">Junio (06)</option>
                      <option [value]="7">Julio (07)</option>
                      <option [value]="8">Agosto (08)</option>
                      <option [value]="9">Septiembre (09)</option>
                      <option [value]="10">Octubre (10)</option>
                      <option [value]="11">Noviembre (11)</option>
                      <option [value]="12">Diciembre (12)</option>
                    </select>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="checkbox"
                    id="chk-send-masiva-dian"
                    class="w-4 h-4 text-purple-600 rounded"
                    data-testid="chk-send-masiva-dian"
                    [ngModel]="sendToDian()"
                    (ngModelChange)="sendToDian.set($event)"
                  />
                  <label for="chk-send-masiva-dian" class="text-xs font-semibold text-slate-700 cursor-pointer">
                    Firmar digitalmente con certificado institucional y transmitir a la DIAN
                  </label>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                  <p><strong>ℹ️ Causación Automática NIIF:</strong></p>
                  <p>Cada factura emitida creará un comprobante de causación (<code class="bg-blue-100 px-1 py-0.5 rounded">CAU</code>) debitando Clientes Escolares (<code class="bg-blue-100 px-1 py-0.5 rounded">130505</code>) y acreditando Ingresos por Pensiones (<code class="bg-blue-100 px-1 py-0.5 rounded">416005</code>).</p>
                </div>
              </div>
            }
          </div>

          <!-- Footer Actions -->
          <div class="modal-footer flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              data-testid="btn-cancelar-masiva-dian"
              (click)="cancelar()"
            >
              {{ resultado() ? 'Cerrar' : 'Cancelar' }}
            </button>
            @if (!resultado()) {
              <button
                type="button"
                class="btn btn-primary btn-sm flex items-center gap-2 font-semibold shadow-sm"
                data-testid="btn-confirmar-masiva-dian"
                [disabled]="procesando()"
                (click)="procesarLote()"
              >
                @if (procesando()) {
                  <span class="animate-spin text-xs">⏳</span>
                  <span>Procesando Lote de Facturación...</span>
                } @else {
                  <span>⚡</span>
                  <span>Emitir Facturas Masivas</span>
                }
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalEmitirMasivaDianComponent {
  private readonly dianService = inject(DianService);

  readonly visible = input<boolean>(false);
  readonly cerrar = output<void>();
  readonly procesado = output<ResultadoFacturasMasivasModel>();

  readonly anio = signal<number>(new Date().getFullYear());
  readonly mes = signal<number>(new Date().getMonth() + 1);
  readonly sendToDian = signal<boolean>(true);

  readonly procesando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly resultado = signal<ResultadoFacturasMasivasModel | null>(null);

  constructor() {
    effect(
      () => {
        if (this.visible()) {
          this.errorMensaje.set(null);
          this.resultado.set(null);
        }
      },
      { allowSignalWrites: true },
    );
  }

  procesarLote(): void {
    this.procesando.set(true);
    this.errorMensaje.set(null);

    this.dianService
      .emitirFacturasMasivas({
        mes: this.mes(),
        anio: this.anio(),
        sendToDian: this.sendToDian(),
      })
      .subscribe({
        next: (res) => {
          this.procesando.set(false);
          this.resultado.set(res);
          this.procesado.emit(res);
        },
        error: (err) => {
          this.procesando.set(false);
          this.errorMensaje.set(err.error?.message || err.message || 'Error procesando lote masivo de facturación');
        },
      });
  }

  cancelar(): void {
    this.cerrar.emit();
  }
}
