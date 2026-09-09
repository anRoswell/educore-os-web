import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Asiento, TipoComprobante, EstadoAsiento } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-detalle-asiento',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible() && asiento()) {
      <div class="modal-backdrop" data-testid="modal-detalle-asiento-backdrop" (click)="cerrar()">
        <div class="modal-box w-[750px] rounded-2xl shadow-xl border border-slate-100 p-6" data-testid="modal-detalle-asiento" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-lg shadow-xs">
                📑
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-detalle-asiento-title">
                  Comprobante {{ asiento()!.tipoComprobante }}-{{ asiento()!.consecutivo | number:'6.0-0' }}
                </h3>
                <span class="text-xs text-slate-400 block">Detalle de movimientos y partida doble</span>
              </div>
            </div>
            <span [class]="badgeEstadoClass(asiento()!.estado)" data-testid="badge-detalle-estado">
              {{ asiento()!.estado }}
            </span>
          </div>

          <div class="modal-body space-y-4 pt-4">
            <!-- Metadatos de cabecera -->
            <div class="grid grid-cols-3 gap-3.5 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div>
                <span class="text-slate-500 block mb-0.5">Fecha Contable:</span>
                <strong class="text-slate-800 text-sm font-mono">{{ asiento()!.fechaContable }}</strong>
              </div>
              <div>
                <span class="text-slate-500 block mb-0.5">Tipo:</span>
                <span [class]="badgeTipoClass(asiento()!.tipoComprobante)">{{ asiento()!.tipoComprobante }}</span>
              </div>
              <div>
                <span class="text-slate-500 block mb-0.5">Módulo Origen:</span>
                <span class="font-mono text-slate-700 font-semibold">{{ asiento()!.fuenteModulo || 'MANUAL' }}</span>
              </div>
              <div class="col-span-3 border-t border-slate-200/60 pt-2 mt-1">
                <span class="text-slate-500 block mb-0.5">Concepto:</span>
                <span class="text-slate-900 font-medium leading-relaxed">{{ asiento()!.concepto || 'Sin descripción' }}</span>
              </div>
            </div>

            <!-- Banner de anulación si aplica -->
            @if (asiento()!.estado === 'VOID' || asiento()!.estado === 'ANULADO') {
              <div class="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-700 space-y-1" data-testid="banner-asiento-anulado">
                <div class="font-bold mb-1 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Comprobante Anulado</span>
                </div>
                @if (asiento()!.motivoAnulacion) {
                  <div><strong>Motivo:</strong> {{ asiento()!.motivoAnulacion }}</div>
                }
                @if (asiento()!.usuarioAnulador) {
                  <div><strong>Anulado por:</strong> {{ asiento()!.usuarioAnulador?.nombreCompleto }}</div>
                }
                @if (asiento()!.voidedAt) {
                  <div><strong>Fecha anulación:</strong> {{ asiento()!.voidedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                }
              </div>
            }

            <!-- Tabla de líneas -->
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table class="tabla-datos w-full text-xs" data-testid="tabla-lineas-detalle">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="w-28 text-left py-2.5 px-3.5 font-bold text-slate-600 uppercase text-[11px]">Cuenta</th>
                    <th class="w-36 text-left py-2.5 px-3.5 font-bold text-slate-600 uppercase text-[11px]">Tercero</th>
                    <th class="text-left py-2.5 px-3.5 font-bold text-slate-600 uppercase text-[11px]">Descripción</th>
                    <th class="w-28 text-right py-2.5 px-3.5 font-bold text-slate-600 uppercase text-[11px]">Débito</th>
                    <th class="w-28 text-right py-2.5 px-3.5 font-bold text-slate-600 uppercase text-[11px]">Crédito</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (l of asiento()!.lineas; track $index) {
                    <tr class="hover:bg-slate-50/70 transition-colors">
                      <td class="font-mono font-semibold py-2.5 px-3.5 text-slate-800">
                        {{ l.cuenta?.codigo || l.cuentaCodigo || l.cuentaPucId || '—' }}
                      </td>
                      <td class="py-2.5 px-3.5 text-slate-600 truncate max-w-[140px]" [title]="l.tercero?.nombreCompleto || l.terceroNombre || ''">
                        {{ l.tercero?.nombreCompleto || l.terceroNombre || '—' }}
                      </td>
                      <td class="py-2.5 px-3.5 text-slate-700 truncate max-w-[200px]" [title]="l.descripcion || ''">
                        {{ l.descripcion || '—' }}
                      </td>
                      <td class="text-right font-mono py-2.5 px-3.5 font-semibold text-slate-800">
                        {{ l.debito | number:'1.2-2' }}
                      </td>
                      <td class="text-right font-mono py-2.5 px-3.5 font-semibold text-slate-800">
                        {{ l.credito | number:'1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot class="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colspan="3" class="text-right py-2.5 px-3.5 text-slate-700">TOTALES:</td>
                    <td class="text-right font-mono py-2.5 px-3.5 text-blue-700 font-bold">
                      {{ asiento()!.totalDebito | number:'1.2-2' }}
                    </td>
                    <td class="text-right font-mono py-2.5 px-3.5 text-blue-700 font-bold">
                      {{ asiento()!.totalCredito | number:'1.2-2' }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="modal-actions flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              class="btn-secondary btn-sm font-medium"
              data-testid="btn-cerrar-detalle"
              (click)="cerrar()"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalDetalleAsientoComponent {
  readonly visible = input<boolean>(false);
  readonly asiento = input<Asiento | null>(null);
  readonly closeModal = output<void>();

  cerrar(): void {
    this.closeModal.emit();
  }

  badgeTipoClass(tipo: TipoComprobante): string {
    const map: Record<string, string> = {
      CAU: 'badge-blue',
      ING: 'badge-green',
      EGR: 'badge-red',
      AJU: 'badge-yellow',
      NOT: 'badge-purple',
      CIER: 'badge-gray',
      CIE: 'badge-gray',
      APE: 'badge-orange',
      APR: 'badge-orange',
    };
    return map[tipo] ?? 'badge-gray';
  }

  badgeEstadoClass(estado: EstadoAsiento): string {
    if (estado === 'POSTED' || estado === 'ACTIVO') return 'badge-green';
    if (estado === 'DRAFT') return 'badge-yellow';
    return 'badge-red';
  }
}
