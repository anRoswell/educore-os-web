import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';

@Component({
  selector: 'app-modal-crear-rubro',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-crear-rubro-backdrop" (click)="cerrarModal()">
        <div class="modal-box w-[560px]" data-testid="modal-crear-rubro" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-lg shadow-xs">
                🏷️
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-crear-rubro-title">
                  Nuevo Rubro Presupuestal
                </h3>
                <span class="text-xs text-slate-400 block">
                  Asignar partida a: <strong>{{ presupuestoNombre() || 'Presupuesto Activo' }}</strong>
                </span>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cerrarModal()"
              data-testid="btn-close-modal-rubro"
            >✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5" data-testid="error-crear-rubro">
                {{ errorMensaje() }}
              </div>
            }

            <div class="bg-emerald-50/70 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-900 leading-relaxed">
              ℹ️ Los rubros definen las partidas contables específicas (ingreso o gasto) vinculadas al PUC que se auditarán contra los asientos reales causados y pagados durante el año escolar.
            </div>

            <!-- Código y Tipo -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Código Rubro *</label>
                <input
                  type="text"
                  class="input-base w-full text-xs font-mono font-semibold text-slate-800"
                  data-testid="input-rubro-codigo"
                  [ngModel]="codigo()"
                  (ngModelChange)="codigo.set($event)"
                  placeholder="Ej. RUB-ING-01"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Tipo de Partida *</label>
                <select
                  class="input-base w-full text-xs font-semibold"
                  [class.text-emerald-700]="tipo() === 'INGRESO'"
                  [class.text-amber-700]="tipo() === 'GASTO'"
                  data-testid="select-rubro-tipo"
                  [ngModel]="tipo()"
                  (ngModelChange)="tipo.set($event)"
                >
                  <option value="INGRESO">📈 INGRESO (Recaudo institucional)</option>
                  <option value="GASTO">📉 GASTO (Inversión / Costo)</option>
                </select>
              </div>
            </div>

            <!-- Nombre del Rubro -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Nombre del Rubro *</label>
              <input
                type="text"
                class="input-base w-full text-xs"
                data-testid="input-rubro-nombre"
                [ngModel]="nombre()"
                (ngModelChange)="nombre.set($event)"
                placeholder="Ej. Matrículas y Pensiones Bachillerato"
              />
            </div>

            <!-- Cuenta PUC y Monto Presupuestado -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Cuenta PUC Enlazada</label>
                <input
                  type="text"
                  class="input-base w-full text-xs font-mono"
                  data-testid="input-rubro-cuenta-puc"
                  [ngModel]="cuentaPucCodigo()"
                  (ngModelChange)="cuentaPucCodigo.set($event)"
                  placeholder="Ej. 416005 o 510506"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Monto Presupuestado (COP) *</label>
                <input
                  type="text"
                  appCurrencyMask
                  class="input-base w-full text-xs font-mono font-semibold text-slate-800"
                  data-testid="input-rubro-presupuestado"
                  [ngModel]="presupuestado()"
                  (ngModelChange)="presupuestado.set($event)"
                  placeholder="$ 50.000.000"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              class="btn-secondary btn-sm"
              data-testid="btn-cancelar-rubro"
              (click)="cerrarModal()"
              [disabled]="guardando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary btn-sm inline-flex items-center gap-1.5"
              data-testid="btn-guardar-rubro"
              (click)="guardar()"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Agregando...</span>
              } @else {
                <span>✓ Agregar Rubro</span>
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
export class ModalCrearRubroPresupuestalComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly presupuestoId = input<string>('');
  readonly presupuestoNombre = input<string>('');
  readonly cerrar = output<void>();
  readonly guardado = output<any>();

  readonly codigo = signal<string>('');
  readonly nombre = signal<string>('');
  readonly tipo = signal<'INGRESO' | 'GASTO'>('INGRESO');
  readonly cuentaPucCodigo = signal<string>('');
  readonly presupuestado = signal<number | null>(null);
  readonly guardando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  cerrarModal(): void {
    this.errorMensaje.set(null);
    this.cerrar.emit();
  }

  guardar(): void {
    if (!this.presupuestoId()) {
      this.errorMensaje.set('Debe haber un presupuesto activo seleccionado.');
      return;
    }

    const cod = this.codigo().trim();
    if (!cod) {
      this.errorMensaje.set('El código de rubro es obligatorio (ej. RUB-001).');
      return;
    }

    const nom = this.nombre().trim();
    if (!nom) {
      this.errorMensaje.set('El nombre del rubro es obligatorio.');
      return;
    }

    const valor = Number(this.presupuestado());
    if (!valor || valor <= 0) {
      this.errorMensaje.set('El monto presupuestado debe ser mayor a cero.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const payload: any = {
      codigo: cod,
      nombre: nom,
      tipo: this.tipo(),
      cuentaPucCodigo: this.cuentaPucCodigo().trim() || undefined,
      presupuestado: valor,
      comprometido: valor,
    };

    this.contabilidadService.agregarRubroPresupuesto(this.presupuestoId(), payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
        this.codigo.set('');
        this.nombre.set('');
        this.presupuestado.set(null);
        this.cerrarModal();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || err?.message || 'Error al agregar el rubro presupuestal.');
      },
    });
  }
}
