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
        <div class="modal-box w-[750px]" data-testid="modal-detalle-asiento" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b">
            <h3 class="modal-title font-bold text-lg text-gray-800" data-testid="modal-detalle-asiento-title">
              Comprobante {{ asiento()!.tipoComprobante }}-{{ asiento()!.consecutivo | number:'6.0-0' }}
            </h3>
            <span [class]="badgeEstadoClass(asiento()!.estado)" data-testid="badge-detalle-estado">
              {{ asiento()!.estado }}
            </span>
          </div>

          <div class="modal-body space-y-4 pt-3">
            <!-- Metadatos de cabecera -->
            <div class="grid grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded border">
              <div>
                <span class="text-gray-500 block">Fecha Contable:</span>
                <strong class="text-gray-800 text-sm font-mono">{{ asiento()!.fechaContable }}</strong>
              </div>
              <div>
                <span class="text-gray-500 block">Tipo:</span>
                <span [class]="badgeTipoClass(asiento()!.tipoComprobante)">{{ asiento()!.tipoComprobante }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Módulo Origen:</span>
                <span class="font-mono text-gray-700">{{ asiento()!.fuenteModulo || 'MANUAL' }}</span>
              </div>
              <div class="col-span-3">
                <span class="text-gray-500 block">Concepto:</span>
                <span class="text-gray-900 font-medium">{{ asiento()!.concepto || 'Sin descripción' }}</span>
              </div>
            </div>

            <!-- Banner de anulación si aplica -->
            @if (asiento()!.estado === 'VOID' || asiento()!.estado === 'ANULADO') {
              <div class="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700" data-testid="banner-asiento-anulado">
                <div class="font-bold mb-1">Comprobante Anulado</div>
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
            <div class="border rounded-md overflow-hidden">
              <table class="tabla-datos w-full text-xs" data-testid="tabla-lineas-detalle">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="w-28 text-left py-2 px-3">Cuenta</th>
                    <th class="w-36 text-left py-2 px-3">Tercero</th>
                    <th class="text-left py-2 px-3">Descripción</th>
                    <th class="w-28 text-right py-2 px-3">Débito</th>
                    <th class="w-28 text-right py-2 px-3">Crédito</th>
                  </tr>
                </thead>
                <tbody>
                  @for (l of asiento()!.lineas; track $index) {
                    <tr class="border-b hover:bg-gray-50/50">
                      <td class="font-mono py-2 px-3">
                        {{ l.cuenta?.codigo || l.cuentaCodigo || l.cuentaPucId || '—' }}
                      </td>
                      <td class="py-2 px-3 text-gray-600 truncate max-w-[140px]" [title]="l.tercero?.nombreCompleto || l.terceroNombre || ''">
                        {{ l.tercero?.nombreCompleto || l.terceroNombre || '—' }}
                      </td>
                      <td class="py-2 px-3 text-gray-700 truncate max-w-[200px]" [title]="l.descripcion || ''">
                        {{ l.descripcion || '—' }}
                      </td>
                      <td class="text-right font-mono py-2 px-3">
                        {{ l.debito | number:'1.2-2' }}
                      </td>
                      <td class="text-right font-mono py-2 px-3">
                        {{ l.credito | number:'1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot class="bg-gray-50 font-bold border-t">
                  <tr>
                    <td colspan="3" class="text-right py-2 px-3 text-gray-700">TOTALES:</td>
                    <td class="text-right font-mono py-2 px-3 text-blue-700">
                      {{ asiento()!.totalDebito | number:'1.2-2' }}
                    </td>
                    <td class="text-right font-mono py-2 px-3 text-blue-700">
                      {{ asiento()!.totalCredito | number:'1.2-2' }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="modal-actions flex justify-end gap-2 pt-4 border-t mt-4">
            <button
              type="button"
              class="btn-secondary"
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
