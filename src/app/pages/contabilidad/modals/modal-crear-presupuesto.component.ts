import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';

@Component({
  selector: 'app-modal-crear-presupuesto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-crear-presupuesto-backdrop" (click)="cerrarModal()">
        <div class="modal-box w-[540px]" data-testid="modal-crear-presupuesto" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg shadow-xs">
                📊
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-crear-presupuesto-title">
                  Nuevo Presupuesto Anual
                </h3>
                <span class="text-xs text-slate-400 block">Planificación financiera y control de gasto educativo</span>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cerrarModal()"
              data-testid="btn-close-modal-presupuesto"
            >✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5" data-testid="error-crear-presupuesto">
                {{ errorMensaje() }}
              </div>
            }

            <div class="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 leading-relaxed">
              ℹ️ Cada presupuesto anual define el techo de metas de ingreso y rubros de gasto para la vigencia fiscal del colegio, clasificado por centro de costo y auditado contra la partida doble en libros.
            </div>

            <!-- Vigencia Fiscal y Centro de Costo -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Vigencia Fiscal (Año) *</label>
                <input
                  type="number"
                  class="input-base w-full text-xs font-mono font-semibold text-slate-800"
                  data-testid="input-presupuesto-anio"
                  [ngModel]="anio()"
                  (ngModelChange)="anio.set($event)"
                  placeholder="2026"
                  min="2020"
                  max="2035"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Centro de Costo</label>
                <select
                  class="input-base w-full text-xs text-slate-800"
                  data-testid="select-presupuesto-centro-costo"
                  [ngModel]="centroCostoId()"
                  (ngModelChange)="centroCostoId.set($event)"
                >
                  <option value="">🏛️ Institucional / General</option>
                  <option value="CC-ADM">🏢 Administrativo y Servicios</option>
                  <option value="CC-PRI">🎒 Preescolar y Básica Primaria</option>
                  <option value="CC-BAC">🎓 Básica Secundaria y Media</option>
                  <option value="CC-TEC">🔬 Laboratorios y Tecnología</option>
                </select>
              </div>
            </div>

            <!-- Nombre del Presupuesto -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Nombre del Presupuesto *</label>
              <input
                type="text"
                class="input-base w-full text-xs"
                data-testid="input-presupuesto-nombre"
                [ngModel]="nombre()"
                (ngModelChange)="nombre.set($event)"
                placeholder="Ej. Presupuesto General de Operaciones 2026"
              />
            </div>

            <!-- Descripción -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Descripción / Justificación</label>
              <textarea
                class="input-base w-full text-xs h-20 resize-none"
                data-testid="textarea-presupuesto-descripcion"
                [ngModel]="descripcion()"
                (ngModelChange)="descripcion.set($event)"
                placeholder="Detalle o resolución de aprobación del Consejo Directivo..."
              ></textarea>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              class="btn-secondary btn-sm"
              data-testid="btn-cancelar-presupuesto"
              (click)="cerrarModal()"
              [disabled]="guardando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary btn-sm inline-flex items-center gap-1.5"
              data-testid="btn-guardar-presupuesto"
              (click)="guardar()"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Guardando...</span>
              } @else {
                <span>✓ Crear Presupuesto</span>
              }
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
export class ModalCrearPresupuestoComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly cerrar = output<void>();
  readonly guardado = output<any>();

  readonly anio = signal<number>(new Date().getFullYear());
  readonly nombre = signal<string>('');
  readonly centroCostoId = signal<string>('');
  readonly descripcion = signal<string>('');
  readonly guardando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  cerrarModal(): void {
    this.errorMensaje.set(null);
    this.cerrar.emit();
  }

  guardar(): void {
    const nom = this.nombre().trim();
    if (!nom) {
      this.errorMensaje.set('El nombre del presupuesto es obligatorio.');
      return;
    }

    const year = Number(this.anio());
    if (!year || year < 2000 || year > 2100) {
      this.errorMensaje.set('La vigencia fiscal (año) no es válida.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const payload: any = {
      anio: year,
      nombre: nom,
      descripcion: this.descripcion().trim() || undefined,
      centroCostoId: this.centroCostoId() ? this.centroCostoId() : undefined,
    };

    this.contabilidadService.crearPresupuesto(payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
        this.cerrarModal();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || err?.message || 'Error al registrar el presupuesto anual.');
      },
    });
  }
}
