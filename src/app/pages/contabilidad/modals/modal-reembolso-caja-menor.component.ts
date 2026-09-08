import { Component, inject, signal, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { CajaMenorModel, CajaMenorLegalizacionModel } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-reembolso-caja-menor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible() && caja()) {
      <div class="modal-backdrop" data-testid="modal-reembolso-backdrop" (click)="cerrar()">
        <div class="modal-box w-[600px]" data-testid="modal-reembolso" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-lg shadow-xs">
                🔄
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-reembolso-title">
                  Reembolso y Reposición de Caja Menor
                </h3>
                <span class="text-xs text-slate-400 block">Generación automática de egreso EGR y reposición de saldo</span>
              </div>
            </div>
            <button type="button" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors" (click)="cerrar()">✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2" data-testid="error-reembolso">
                {{ errorMensaje() }}
              </div>
            }

            <div class="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900 space-y-1">
              <div class="font-bold flex items-center gap-1">
                <span>⚠️</span> Generación de Comprobante de Egreso (EGR)
              </div>
              <p>
                Esta acción causará los gastos pendientes debitando las cuentas Clase 5 y acreditará la cuenta de Bancos
                (<strong>{{ caja()!.cuentaPucBancos || '111005' }}</strong>), restableciendo el saldo disponible de la caja menor al <strong>100% ($ {{ caja()!.montoAutorizado | number:'1.0-0' }})</strong>.
              </p>
            </div>

            <!-- Resumen Financiero del Reembolso -->
            <div class="grid grid-cols-3 gap-3">
              <div class="border rounded p-2.5 bg-slate-50 text-center">
                <span class="text-xs text-gray-500 block">Monto Autorizado</span>
                <span class="text-xs font-bold text-gray-700">$ {{ caja()!.montoAutorizado | number:'1.0-0' }}</span>
              </div>
              <div class="border rounded p-2.5 bg-slate-50 text-center">
                <span class="text-xs text-gray-500 block">Saldo Actual</span>
                <span class="text-xs font-bold text-amber-600">$ {{ caja()!.saldoDisponible | number:'1.0-0' }}</span>
              </div>
              <div class="border rounded p-2.5 bg-emerald-50 border-emerald-200 text-center">
                <span class="text-xs text-emerald-700 font-semibold block">Valor a Reembolsar</span>
                <span class="text-sm font-bold text-emerald-800" data-testid="label-total-reembolso">
                  $ {{ totalAReembolsar() | number:'1.0-0' }}
                </span>
              </div>
            </div>

            <!-- Lista de Recibos Pendientes -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-gray-700">
                  Recibos y Facturas a Legalizar ({{ gastosPendientes().length }})
                </span>
                <span class="text-xs text-gray-500">Partida Doble Estricta</span>
              </div>

              <div class="max-h-48 overflow-y-auto border rounded text-xs">
                <table class="w-full">
                  <thead class="bg-gray-100 text-gray-600 font-semibold border-b">
                    <tr>
                      <th class="p-2 text-left">Recibo</th>
                      <th class="p-2 text-left">Proveedor</th>
                      <th class="p-2 text-left">Cuenta PUC</th>
                      <th class="p-2 text-right">Valor Neto</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    @for (g of gastosPendientes(); track g.id) {
                      <tr class="hover:bg-gray-50">
                        <td class="p-2 font-mono text-gray-700">{{ g.numeroRecibo }}</td>
                        <td class="p-2 text-gray-800 truncate max-w-[160px]">{{ g.terceroNombre }}</td>
                        <td class="p-2 font-mono text-gray-600">{{ g.cuentaPucGasto }}</td>
                        <td class="p-2 text-right font-bold text-gray-800">$ {{ g.valorNeto | number:'1.0-0' }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="p-4 text-center text-gray-400">
                          No hay gastos pendientes en memoria para este fondo. Se reembolsará la diferencia del saldo.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              class="btn btn-secondary btn-sm font-medium"
              data-testid="btn-cancelar-reembolso"
              (click)="cerrar()"
              [disabled]="guardando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-success btn-sm flex items-center gap-2 font-semibold shadow-sm"
              data-testid="btn-confirmar-reembolso"
              (click)="emitirReembolso()"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <span class="animate-spin text-xs">⏳</span>
              }
              <span>Emitir Egreso EGR & Reposición</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalReembolsoCajaMenorComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly caja = input<CajaMenorModel | null>(null);
  readonly reembolsoCompletado = output<void>();
  readonly cerrarModal = output<void>();

  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly gastosPendientes = computed<CajaMenorLegalizacionModel[]>(() => {
    const c = this.caja();
    if (!c?.legalizaciones) return [];
    return c.legalizaciones.filter((l) => l.estado === 'PENDIENTE');
  });

  readonly totalAReembolsar = computed<number>(() => {
    const c = this.caja();
    if (!c) return 0;
    const pendientes = this.gastosPendientes();
    if (pendientes.length > 0) {
      return pendientes.reduce((sum, g) => sum + Number(g.valorNeto || 0), 0);
    }
    return Math.max(0, Number(c.montoAutorizado) - Number(c.saldoDisponible));
  });

  cerrar(): void {
    this.errorMensaje.set(null);
    this.cerrarModal.emit();
  }

  emitirReembolso(): void {
    const c = this.caja();
    if (!c) return;

    this.guardando.set(true);
    this.errorMensaje.set(null);

    this.contabilidadService.reembolsarCajaMenor(c.id).subscribe({
      next: () => {
        this.guardando.set(false);
        this.reembolsoCompletado.emit();
        this.cerrar();
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err.error?.message;
        this.errorMensaje.set(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al emitir reembolso de caja menor.');
      },
    });
  }
}
