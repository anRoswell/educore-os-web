import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { CrearCajaMenorModel } from '../models/contabilidad.models';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';

@Component({
  selector: 'app-modal-crear-caja-menor',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-crear-caja-backdrop" (click)="cerrar()">
        <div class="modal-box w-[560px]" data-testid="modal-crear-caja" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg shadow-xs">
                💼
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-crear-caja-title">
                  Apertura de Fondo Fijo de Caja Menor
                </h3>
                <span class="text-xs text-slate-400 block">Fondo fijo institucional para compras y gastos menores</span>
              </div>
            </div>
            <button type="button" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors" (click)="cerrar()">✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2" data-testid="error-crear-caja">
                {{ errorMensaje() }}
              </div>
            }

            <div class="bg-blue-50 border border-blue-200 rounded p-2.5 text-xs text-blue-800">
              ℹ️ Los fondos fijos de caja menor permiten la administración y legalización de gastos urgentes menores (papelería, fotocopias, transporte, enfermería) con estricto control presupuestal y reembolso por partida doble.
            </div>

            <!-- Nombre de la caja -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Nombre del Fondo de Caja Menor *</label>
              <input
                type="text"
                class="input-base w-full text-xs"
                data-testid="input-caja-nombre"
                [ngModel]="nombre()"
                (ngModelChange)="nombre.set($event)"
                placeholder="Ej. Caja Menor Pagaduría y Secretaría General"
              />
            </div>

            <!-- Custodio / Responsable -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Custodio Responsable *</label>
                <input
                  type="text"
                  class="input-base w-full text-xs"
                  data-testid="input-caja-responsable-nombre"
                  [ngModel]="responsableNombre()"
                  (ngModelChange)="responsableNombre.set($event)"
                  placeholder="Ej. Lic. Esperanza Duarte"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Cargo Institucional</label>
                <input
                  type="text"
                  class="input-base w-full text-xs"
                  data-testid="input-caja-responsable-cargo"
                  [ngModel]="responsableCargo()"
                  (ngModelChange)="responsableCargo.set($event)"
                  placeholder="Ej. Pagadora / Secretaria General"
                />
              </div>
            </div>

            <!-- Monto y Umbral de Alerta -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Monto Autorizado (COP) *</label>
                <input
                  type="text"
                  appCurrencyMask
                  class="input-base w-full text-xs font-mono font-semibold text-slate-800"
                  data-testid="input-caja-monto"
                  [ngModel]="montoAutorizado()"
                  (ngModelChange)="onMontoChange($event)"
                  placeholder="$ 1.500.000"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Umbral Alerta Reembolso (%)</label>
                <input
                  type="number"
                  class="input-base w-full text-xs"
                  data-testid="input-caja-umbral"
                  [ngModel]="umbralAlerta()"
                  (ngModelChange)="umbralAlerta.set($event)"
                  placeholder="30"
                  min="5"
                  max="80"
                />
              </div>
            </div>

            <!-- Cuentas PUC -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Cuenta PUC Caja Menor</label>
                <input
                  type="text"
                  class="input-base w-full text-xs"
                  data-testid="input-caja-cuenta-puc"
                  [ngModel]="cuentaCaja()"
                  (ngModelChange)="cuentaCaja.set($event)"
                  placeholder="110505"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Cuenta PUC Bancos Reposición</label>
                <input
                  type="text"
                  class="input-base w-full text-xs"
                  data-testid="input-caja-cuenta-bancos"
                  [ngModel]="cuentaBancos()"
                  (ngModelChange)="cuentaBancos.set($event)"
                  placeholder="111005"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              class="btn btn-secondary btn-sm font-medium"
              data-testid="btn-cancelar-crear-caja"
              (click)="cerrar()"
              [disabled]="guardando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm flex items-center gap-2 font-semibold shadow-sm"
              data-testid="btn-confirmar-crear-caja"
              (click)="crear()"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <span class="animate-spin text-xs">⏳</span>
                <span>Aperturando...</span>
              } @else {
                <span>💼</span>
                <span>Abrir Fondo de Caja</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalCrearCajaMenorComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly cajaCreada = output<void>();
  readonly cerrarModal = output<void>();

  readonly nombre = signal('Caja Menor Secretaría y Pagaduría');
  readonly responsableNombre = signal('Lic. Esperanza Duarte');
  readonly responsableCargo = signal('Secretaria General y Pagadora');
  readonly montoAutorizado = signal(1500000);
  readonly umbralAlerta = signal(30);
  readonly cuentaCaja = signal('110505');
  readonly cuentaBancos = signal('111005');

  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  cerrar(): void {
    this.errorMensaje.set(null);
    this.cerrarModal.emit();
  }

  onMontoChange(val: any): void {
    const num = val !== null && val !== undefined ? Number(val) : 0;
    this.montoAutorizado.set(isNaN(num) ? 0 : num);
  }

  crear(): void {
    if (!this.nombre() || !this.responsableNombre()) {
      this.errorMensaje.set('Debe ingresar el nombre del fondo y el custodio responsable.');
      return;
    }

    if (!this.montoAutorizado() || this.montoAutorizado() <= 0) {
      this.errorMensaje.set('El monto autorizado debe ser mayor a cero.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const dto: CrearCajaMenorModel = {
      nombre: this.nombre(),
      responsableNombre: this.responsableNombre(),
      responsableCargo: this.responsableCargo() || undefined,
      montoAutorizado: Number(this.montoAutorizado()),
      umbralAlertaPorcentaje: Number(this.umbralAlerta() || 30),
      cuentaPucCaja: this.cuentaCaja() || '110505',
      cuentaPucBancos: this.cuentaBancos() || '111005',
    };

    this.contabilidadService.crearCajaMenor(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cajaCreada.emit();
        this.cerrar();
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err.error?.message;
        this.errorMensaje.set(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al aperturar el fondo de caja menor.');
      },
    });
  }
}
