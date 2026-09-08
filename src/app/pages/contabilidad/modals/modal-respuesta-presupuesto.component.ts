import { Component, input, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TipoRespuestaPresupuesto =
  | 'PRESUPUESTO'
  | 'RUBRO'
  | 'ADICION'
  | 'INFO'
  | 'TRASLADO'
  | 'REDUCCION'
  | 'APROBACION'
  | 'EDICION';

export interface RespuestaPresupuestoData {
  tipo: TipoRespuestaPresupuesto;
  titulo: string;
  subtitulo?: string;
  detalles: { etiqueta: string; valor: string }[];
  mensaje: string;
}

@Component({
  selector: 'app-modal-respuesta-presupuesto',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible() && data()) {
      <div
        class="modal-backdrop"
        data-testid="modal-respuesta-presupuesto-backdrop"
        (click)="cerrarModal()"
      >
        <div
          class="modal-box w-[480px]"
          data-testid="modal-respuesta-presupuesto"
          (click)="$event.stopPropagation()"
        >
          <!-- Header con Ícono y Título -->
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xl shadow-xs">
                @if (data()?.tipo === 'APROBACION') {
                  🏛️
                } @else if (data()?.tipo === 'TRASLADO') {
                  🔄
                } @else if (data()?.tipo === 'REDUCCION') {
                  📉
                } @else if (data()?.tipo === 'EDICION') {
                  ✏️
                } @else if (data()?.tipo === 'ADICION') {
                  ⚡
                } @else {
                  ✅
                }
              </div>
              <div>
                <h3 class="modal-title font-bold text-base text-slate-800 tracking-tight" data-testid="modal-respuesta-title">
                  {{ data()?.titulo }}
                </h3>
                @if (data()?.subtitulo) {
                  <span class="text-xs text-slate-500 block">{{ data()?.subtitulo }}</span>
                }
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cerrarModal()"
              data-testid="btn-close-modal-respuesta"
            >✕</button>
          </div>

          <!-- Body con Detalles y Mensaje -->
          <div class="modal-body space-y-4 pt-3">
            <div class="bg-emerald-50/70 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-900 leading-relaxed flex items-start gap-2">
              <span class="text-emerald-600 font-bold">ℹ️</span>
              <span data-testid="modal-respuesta-mensaje">{{ data()?.mensaje }}</span>
            </div>

            <!-- Tabla de Detalles -->
            @if (data()?.detalles && data()!.detalles.length > 0) {
              <div class="bg-slate-50 border border-slate-200/80 rounded-lg overflow-hidden divide-y divide-slate-200/60 text-xs">
                @for (d of data()!.detalles; track d.etiqueta) {
                  <div class="flex items-center justify-between px-3 py-2">
                    <span class="font-medium text-slate-500">{{ d.etiqueta }}</span>
                    <span class="font-bold text-slate-800 text-right">{{ d.valor }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Footer con Botón de Continuar -->
          <div class="modal-footer flex items-center justify-end pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              class="btn-primary btn-sm inline-flex items-center gap-1.5 px-4"
              data-testid="btn-entendido-respuesta"
              (click)="cerrarModal()"
            >
              <span>✓</span>
              <span>Entendido / Continuar</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 1rem;
    }
    .modal-box {
      background-color: #ffffff !important;
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      z-index: 100000;
    }
  `],
})
export class ModalRespuestaPresupuestoComponent {
  readonly visible = input<boolean>(false);
  readonly data = input<RespuestaPresupuestoData | null>(null);
  readonly cerrar = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) {
      this.cerrarModal();
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
