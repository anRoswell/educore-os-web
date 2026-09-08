import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';

@Component({
  selector: 'app-modal-aprobar-presupuesto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-aprobar-presupuesto-backdrop" (click)="cerrarModal()">
        <div class="modal-box w-[540px]" data-testid="modal-aprobar-presupuesto" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-lg shadow-xs">
                🏛️
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-aprobar-presupuesto-title">
                  Aprobación por Consejo Directivo
                </h3>
                <span class="text-xs text-slate-400 block">Formalización de Acuerdo y Adopción Presupuestal (Decreto 1075 de 2015)</span>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cerrarModal()"
              data-testid="btn-close-modal-aprobar-presupuesto"
            >✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5" data-testid="error-aprobar-presupuesto">
                {{ errorMensaje() }}
              </div>
            }

            <div class="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 leading-relaxed">
              ⚠️ <strong>Efecto Jurídico Vinculante:</strong> Al aprobar este presupuesto, adquiere fuerza legal obligatoria para la vigencia fiscal <strong>{{ presupuesto()?.anio }}</strong>. A partir de este momento, <em>NO se permitirá la edición directa</em>; cualquier ajuste deberá tramitarse mediante acto formal de modificación presupuestal (Adición, Traslado o Reducción).
            </div>

            <!-- Resumen del Presupuesto a Aprobar -->
            <div class="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs space-y-1">
              <div class="flex justify-between">
                <span class="text-slate-500">Presupuesto:</span>
                <span class="font-semibold text-slate-800">{{ presupuesto()?.nombre }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Vigencia Fiscal:</span>
                <span class="font-semibold font-mono text-slate-800">{{ presupuesto()?.anio }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Total Programado:</span>
                <span class="font-bold font-mono text-emerald-700">$ {{ (presupuesto()?.totalPresupuestado || 0) | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Número de Acuerdo del Consejo Directivo -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Número de Acuerdo del Consejo Directivo *</label>
              <input
                type="text"
                class="input-base w-full text-xs font-semibold text-slate-800"
                data-testid="input-aprobar-numero-acuerdo"
                [ngModel]="numeroAcuerdo()"
                (ngModelChange)="numeroAcuerdo.set($event)"
                placeholder="Ej. Acuerdo No. 001 de 2026"
              />
            </div>

            <!-- Fecha del Acuerdo / Acta de Sesión -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Fecha del Acuerdo / Acta *</label>
                <input
                  type="date"
                  class="input-base w-full text-xs font-mono"
                  data-testid="input-aprobar-fecha-acuerdo"
                  [ngModel]="fechaAcuerdo()"
                  (ngModelChange)="fechaAcuerdo.set($event)"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Aprobado Por (Órgano / Cargo) *</label>
                <input
                  type="text"
                  class="input-base w-full text-xs"
                  data-testid="input-aprobar-por"
                  [ngModel]="aprobadoPor()"
                  (ngModelChange)="aprobadoPor.set($event)"
                  placeholder="Consejo Directivo - Rectoría"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              class="btn-secondary btn-sm"
              data-testid="btn-cancelar-aprobar-presupuesto"
              (click)="cerrarModal()"
              [disabled]="guardando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary btn-sm inline-flex items-center gap-1.5 !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
              data-testid="btn-confirmar-aprobar-presupuesto"
              (click)="guardar()"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Formalizando Acuerdo...</span>
              } @else {
                <span>🏛️ Aprobar Formalmente</span>
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
export class ModalAprobarPresupuestoComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly presupuesto = input<any>(null);
  readonly cerrar = output<void>();
  readonly aprobado = output<any>();

  readonly numeroAcuerdo = signal<string>('');
  readonly fechaAcuerdo = signal<string>(new Date().toISOString().split('T')[0]);
  readonly aprobadoPor = signal<string>('Consejo Directivo - Rectoría');
  readonly guardando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  constructor() {
    effect(() => {
      const p = this.presupuesto();
      if (p) {
        this.numeroAcuerdo.set(p.numeroAcuerdo || `Acuerdo No. ${String(new Date().getMonth() + 1).padStart(2, '0')} de ${p.anio}`);
        this.fechaAcuerdo.set(p.fechaAcuerdo ? String(p.fechaAcuerdo).split('T')[0] : new Date().toISOString().split('T')[0]);
        this.aprobadoPor.set(p.aprobadoPor || 'Consejo Directivo - Rectoría');
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
      this.errorMensaje.set('No se ha seleccionado ningún presupuesto para aprobar.');
      return;
    }

    const numAcuerdo = this.numeroAcuerdo().trim();
    if (!numAcuerdo) {
      this.errorMensaje.set('El número de acuerdo del Consejo Directivo es obligatorio.');
      return;
    }

    const fecha = this.fechaAcuerdo().trim();
    if (!fecha) {
      this.errorMensaje.set('La fecha del acuerdo del Consejo Directivo es obligatoria.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const payload = {
      numeroAcuerdo: numAcuerdo,
      fechaAcuerdo: fecha,
      aprobadoPor: this.aprobadoPor().trim() || 'Consejo Directivo',
    };

    this.contabilidadService.aprobarPresupuesto(p.id, payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.aprobado.emit(res);
        this.cerrarModal();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || err?.message || 'Error al aprobar formalmente el presupuesto.');
      },
    });
  }
}
