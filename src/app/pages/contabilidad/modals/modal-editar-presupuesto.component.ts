import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';

@Component({
  selector: 'app-modal-editar-presupuesto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-editar-presupuesto-backdrop" (click)="cerrarModal()">
        <div class="modal-box w-[540px]" data-testid="modal-editar-presupuesto" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-lg shadow-xs">
                ✏️
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-editar-presupuesto-title">
                  Editar Formulación de Presupuesto
                </h3>
                <span class="text-xs text-slate-400 block">Etapa de formulación previa a la adopción formal (Decreto 1075 de 2015)</span>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cerrarModal()"
              data-testid="btn-close-modal-editar-presupuesto"
            >✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5" data-testid="error-editar-presupuesto">
                {{ errorMensaje() }}
              </div>
            }

            <div class="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 leading-relaxed">
              ℹ️ Según la normativa colombiana de Fondos de Servicios Educativos (FSE), los datos generales del presupuesto pueden actualizarse libremente mientras esté en estado <strong>BORRADOR</strong>.
            </div>

            <!-- Vigencia Fiscal (Solo lectura) y Centro de Costo -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Vigencia Fiscal (Año)</label>
                <input
                  type="number"
                  class="input-base w-full text-xs font-mono font-semibold text-slate-500 bg-slate-50 cursor-not-allowed"
                  [value]="presupuesto()?.anio"
                  readonly
                  disabled
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Centro de Costo</label>
                <select
                  class="input-base w-full text-xs text-slate-800"
                  data-testid="select-editar-presupuesto-centro-costo"
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
                data-testid="input-editar-presupuesto-nombre"
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
                data-testid="textarea-editar-presupuesto-descripcion"
                [ngModel]="descripcion()"
                (ngModelChange)="descripcion.set($event)"
                placeholder="Detalle o notas de formulación del proyecto de presupuesto..."
              ></textarea>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              class="btn-secondary btn-sm"
              data-testid="btn-cancelar-editar-presupuesto"
              (click)="cerrarModal()"
              [disabled]="guardando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary btn-sm inline-flex items-center gap-1.5"
              data-testid="btn-guardar-editar-presupuesto"
              (click)="guardar()"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Guardando...</span>
              } @else {
                <span>✓ Guardar Cambios</span>
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
export class ModalEditarPresupuestoComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly presupuesto = input<any>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<any>();

  readonly nombre = signal<string>('');
  readonly centroCostoId = signal<string>('');
  readonly descripcion = signal<string>('');
  readonly guardando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  constructor() {
    effect(() => {
      const p = this.presupuesto();
      if (p) {
        this.nombre.set(p.nombre || '');
        this.centroCostoId.set(p.centroCostoId || '');
        this.descripcion.set(p.descripcion || '');
      }
    });
  }

  cerrarModal(): void {
    this.errorMensaje.set(null);
    this.cerrar.emit();
  }

  guardar(): void {
    const p = this.presupuesto();
    if (!p?.id) {
      this.errorMensaje.set('No se ha seleccionado ningún presupuesto para editar.');
      return;
    }

    const nom = this.nombre().trim();
    if (!nom) {
      this.errorMensaje.set('El nombre del presupuesto es obligatorio.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const payload = {
      nombre: nom,
      descripcion: this.descripcion().trim() || undefined,
      centroCostoId: this.centroCostoId() || undefined,
    };

    this.contabilidadService.actualizarPresupuesto(p.id, payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
        this.cerrarModal();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || err?.message || 'Error al actualizar el presupuesto.');
      },
    });
  }
}
