import { Component, inject, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContabilidadService } from '../services/contabilidad.service';

@Component({
  selector: 'app-modal-libro-modificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-libro-modificaciones-backdrop" (click)="cerrarModal()">
        <div class="modal-box w-[880px] max-w-[95vw]" data-testid="modal-libro-modificaciones" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-lg shadow-xs">
                📜
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-libro-modificaciones-title">
                  Libro de Modificaciones Presupuestales
                </h3>
                <span class="text-xs text-slate-400 block">
                  Trazabilidad de Acuerdos del Consejo Directivo (Decreto 1075 de 2015 & Decreto 111 de 1996)
                </span>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cerrarModal()"
              data-testid="btn-close-modal-libro"
            >✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (cargando()) {
              <div class="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <span class="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
                <span class="text-xs">Cargando libro de modificaciones del presupuesto...</span>
              </div>
            } @else {
              <!-- KPI Cards de Modificaciones -->
              <div class="grid grid-cols-4 gap-3">
                <div class="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                  <span class="text-[11px] font-semibold text-indigo-700 block uppercase tracking-wider">Total Acuerdos</span>
                  <span class="text-xl font-bold font-mono text-indigo-950 block mt-1" data-testid="kpi-modificaciones-total">
                    {{ modificaciones().length }}
                  </span>
                </div>

                <div class="bg-purple-50/50 border border-purple-100 rounded-xl p-3">
                  <span class="text-[11px] font-semibold text-purple-700 block uppercase tracking-wider">Total Adicionado</span>
                  <span class="text-base font-bold font-mono text-purple-950 block mt-1" data-testid="kpi-modificaciones-adiciones">
                    $ {{ totalAdicionado() | number:'1.2-2' }}
                  </span>
                </div>

                <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                  <span class="text-[11px] font-semibold text-blue-700 block uppercase tracking-wider">Total Trasladado</span>
                  <span class="text-base font-bold font-mono text-blue-950 block mt-1" data-testid="kpi-modificaciones-traslados">
                    $ {{ totalTrasladado() | number:'1.2-2' }}
                  </span>
                </div>

                <div class="bg-rose-50/50 border border-rose-100 rounded-xl p-3">
                  <span class="text-[11px] font-semibold text-rose-700 block uppercase tracking-wider">Total Reducido</span>
                  <span class="text-base font-bold font-mono text-rose-950 block mt-1" data-testid="kpi-modificaciones-reducciones">
                    $ {{ totalReducido() | number:'1.2-2' }}
                  </span>
                </div>
              </div>

              <!-- Tabla de Modificaciones -->
              <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div class="max-h-[380px] overflow-y-auto">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead class="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th class="py-2.5 px-3">Fecha / Acuerdo</th>
                        <th class="py-2.5 px-3">Tipo de Acto</th>
                        <th class="py-2.5 px-3 text-right">Monto</th>
                        <th class="py-2.5 px-3">Afectación de Rubros</th>
                        <th class="py-2.5 px-3">Justificación</th>
                        <th class="py-2.5 px-3">Aprobado Por</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @if (modificaciones().length === 0) {
                        <tr>
                          <td colspan="6" class="py-8 text-center text-slate-400">
                            No se han registrado modificaciones formales (adiciones, traslados o reducciones) en este presupuesto.
                          </td>
                        </tr>
                      } @else {
                        @for (m of modificaciones(); track m.id) {
                          <tr class="hover:bg-slate-50/70 transition-colors" data-testid="fila-modificacion">
                            <td class="py-2.5 px-3 font-mono">
                              <span class="font-semibold text-slate-800 block">{{ m.numeroAcuerdo || 'Acuerdo S/N' }}</span>
                              <span class="text-[11px] text-slate-400">{{ m.fechaAcuerdo | date:'dd/MM/yyyy' }}</span>
                            </td>
                            <td class="py-2.5 px-3">
                              @if (m.tipo === 'ADICION') {
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                  ⚡ ADICIÓN
                                </span>
                              } @else if (m.tipo === 'TRASLADO') {
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                  🔄 TRASLADO
                                </span>
                              } @else if (m.tipo === 'REDUCCION') {
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                  📉 REDUCCIÓN
                                </span>
                              }
                            </td>
                            <td class="py-2.5 px-3 text-right font-mono font-bold"
                              [ngClass]="{
                                'text-purple-700': m.tipo === 'ADICION',
                                'text-blue-700': m.tipo === 'TRASLADO',
                                'text-rose-700': m.tipo === 'REDUCCION'
                              }"
                            >
                              $ {{ (m.monto || 0) | number:'1.2-2' }}
                            </td>
                            <td class="py-2.5 px-3 text-slate-700">
                              @if (m.tipo === 'ADICION') {
                                <span>➕ Rubro: <strong>{{ m.rubroDestinoCodigo }}</strong></span>
                              } @else if (m.tipo === 'TRASLADO') {
                                <div>
                                  <span class="text-rose-600 block">➖ Cede: <strong>{{ m.rubroOrigenCodigo }}</strong></span>
                                  <span class="text-emerald-600 block">➕ Recibe: <strong>{{ m.rubroDestinoCodigo }}</strong></span>
                                </div>
                              } @else if (m.tipo === 'REDUCCION') {
                                <span class="text-rose-600">➖ Disminuye: <strong>{{ m.rubroOrigenCodigo || m.rubroDestinoCodigo }}</strong></span>
                              }
                            </td>
                            <td class="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" [title]="m.justificacion || ''">
                              {{ m.justificacion || 'Sin justificación detallada' }}
                            </td>
                            <td class="py-2.5 px-3 text-slate-500 font-medium">
                              {{ m.aprobadoPor || 'Consejo Directivo' }}
                            </td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>

          <div class="modal-footer flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              class="btn-secondary btn-sm"
              data-testid="btn-cerrar-libro"
              (click)="cerrarModal()"
            >
              Cerrar
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
      background-color: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .modal-box {
      background: #ffffff;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      padding: 1.5rem;
      border: 1px solid #f1f5f9;
      max-height: 90vh;
      overflow-y: auto;
    }
  `],
})
export class ModalLibroModificacionesComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly presupuesto = input<any>(null);
  readonly cerrar = output<void>();

  readonly modificaciones = signal<any[]>([]);
  readonly cargando = signal<boolean>(false);

  readonly totalAdicionado = computed(() => {
    return this.modificaciones()
      .filter((m) => m.tipo === 'ADICION')
      .reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  });

  readonly totalTrasladado = computed(() => {
    return this.modificaciones()
      .filter((m) => m.tipo === 'TRASLADO')
      .reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  });

  readonly totalReducido = computed(() => {
    return this.modificaciones()
      .filter((m) => m.tipo === 'REDUCCION')
      .reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  });

  constructor() {
    effect(() => {
      const isVisible = this.visible();
      const p = this.presupuesto();
      if (isVisible && p?.id) {
        this.cargarModificaciones(p.id);
      }
    });
  }

  cargarModificaciones(presupuestoId: string): void {
    this.cargando.set(true);
    this.contabilidadService.getModificacionesPresupuesto(presupuestoId).subscribe({
      next: (data) => {
        this.modificaciones.set(data || []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar modificaciones presupuestales:', err);
        this.modificaciones.set([]);
        this.cargando.set(false);
      },
    });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
