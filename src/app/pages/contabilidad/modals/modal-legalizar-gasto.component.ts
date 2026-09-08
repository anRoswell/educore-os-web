import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { CajaMenorModel, RegistrarGastoCajaMenorModel } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-legalizar-gasto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible() && caja()) {
      <div class="modal-backdrop" data-testid="modal-legalizar-gasto-backdrop" (click)="cerrar()">
        <div class="modal-box w-[580px]" data-testid="modal-legalizar-gasto" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-lg shadow-xs">
                🧾
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-legalizar-gasto-title">
                  Legalizar Gasto Menor
                </h3>
                <span class="text-xs text-slate-400 block">Imputación contable y soporte de egreso menor</span>
              </div>
            </div>
            <button type="button" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors" (click)="cerrar()">✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2" data-testid="error-legalizar-gasto">
                {{ errorMensaje() }}
              </div>
            }

            <!-- Saldo actual del fondo -->
            <div class="bg-slate-50 border border-slate-200 rounded p-3 flex items-center justify-between">
              <div>
                <span class="text-xs text-gray-500 block">Fondo Destino:</span>
                <span class="text-xs font-bold text-gray-800">{{ caja()!.nombre }}</span>
              </div>
              <div class="text-right">
                <span class="text-xs text-gray-500 block">Saldo Disponible:</span>
                <span class="text-sm font-bold text-emerald-600" data-testid="label-saldo-disponible-modal">
                  $ {{ caja()!.saldoDisponible | number:'1.0-0' }}
                </span>
              </div>
            </div>

            <!-- Fila 1: Fecha y Número de Recibo -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Fecha del Gasto / Recibo *</label>
                <input
                  type="date"
                  class="input-base w-full text-xs"
                  data-testid="input-gasto-fecha"
                  [ngModel]="fechaGasto()"
                  (ngModelChange)="fechaGasto.set($event)"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Número de Recibo / Factura *</label>
                <input
                  type="text"
                  class="input-base w-full text-xs"
                  data-testid="input-gasto-recibo"
                  [ngModel]="numeroRecibo()"
                  (ngModelChange)="numeroRecibo.set($event)"
                  placeholder="Ej. REC-00845 / FAC-102"
                />
              </div>
            </div>

            <!-- Fila 2: Proveedor (Nombre y NIT) -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Nombre o Razón del Tercero *</label>
                <input
                  type="text"
                  class="input-base w-full text-xs"
                  data-testid="input-gasto-tercero-nombre"
                  [ngModel]="terceroNombre()"
                  (ngModelChange)="terceroNombre.set($event)"
                  placeholder="Ej. Papelería y Suministros La Enseñanza"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">NIT o Cédula del Tercero *</label>
                <input
                  type="text"
                  class="input-base w-full text-xs"
                  data-testid="input-gasto-tercero-nit"
                  [ngModel]="terceroNit()"
                  (ngModelChange)="terceroNit.set($event)"
                  placeholder="Ej. 900.567.890-1"
                />
              </div>
            </div>

            <!-- Fila 3: Concepto del Gasto -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Concepto del Gasto Menor *</label>
              <input
                type="text"
                class="input-base w-full text-xs"
                data-testid="input-gasto-concepto"
                [ngModel]="concepto()"
                (ngModelChange)="concepto.set($event)"
                placeholder="Ej. Resmas de papel, marcadores y tóner de emergencia"
              />
            </div>

            <!-- Fila 4: Cuenta PUC Gasto con amplio espacio -->
            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-gray-700">Cuenta PUC Gasto (Imputación Contable)</label>
              <input
                type="text"
                class="input-base w-full text-xs font-mono"
                data-testid="input-gasto-cuenta-puc"
                [ngModel]="cuentaGasto()"
                (ngModelChange)="cuentaGasto.set($event)"
                placeholder="519530 — Papelería, Fotocopias y Útiles de Oficina"
              />
            </div>

            <!-- Fila 4: Valores Bruto, Retención y Neto -->
            <div class="grid grid-cols-3 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Valor Bruto (COP) *</label>
                <input
                  type="number"
                  class="input-base w-full text-xs font-semibold"
                  data-testid="input-gasto-valor-bruto"
                  [ngModel]="valorBruto()"
                  (ngModelChange)="actualizarBruto($event)"
                  min="1"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-gray-700">Retención (Opcional)</label>
                <input
                  type="number"
                  class="input-base w-full text-xs"
                  data-testid="input-gasto-retencion"
                  [ngModel]="valorRetencion()"
                  (ngModelChange)="actualizarRetencion($event)"
                  min="0"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-emerald-800">Total Neto a Descontar *</label>
                <input
                  type="number"
                  class="input-base w-full text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-300"
                  data-testid="input-gasto-valor-neto"
                  [ngModel]="valorNeto()"
                  readonly
                />
              </div>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              class="btn btn-secondary btn-sm font-medium"
              data-testid="btn-cancelar-gasto"
              (click)="cerrar()"
              [disabled]="guardando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm flex items-center gap-2 font-semibold shadow-sm"
              data-testid="btn-confirmar-gasto"
              (click)="guardar()"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <span class="animate-spin text-xs">⏳</span>
              }
              <span>Legalizar y Descontar Saldo</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalLegalizarGastoComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly caja = input<CajaMenorModel | null>(null);
  readonly gastoRegistrado = output<void>();
  readonly cerrarModal = output<void>();

  readonly fechaGasto = signal(new Date().toISOString().split('T')[0]);
  readonly numeroRecibo = signal('REC-00125');
  readonly terceroNombre = signal('Papelería y Suministros La Enseñanza');
  readonly terceroNit = signal('900.567.890-1');
  readonly concepto = signal('Resmas de papel para secretaría y actas');
  readonly cuentaGasto = signal('519530');
  readonly valorBruto = signal(85000);
  readonly valorRetencion = signal(0);
  readonly valorNeto = signal(85000);

  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  actualizarBruto(val: any): void {
    const b = Number(val) || 0;
    this.valorBruto.set(b);
    this.valorNeto.set(Math.max(0, b - this.valorRetencion()));
  }

  actualizarRetencion(val: any): void {
    const r = Number(val) || 0;
    this.valorRetencion.set(r);
    this.valorNeto.set(Math.max(0, this.valorBruto() - r));
  }

  cerrar(): void {
    this.errorMensaje.set(null);
    this.cerrarModal.emit();
  }

  guardar(): void {
    const c = this.caja();
    if (!c) return;

    if (!this.numeroRecibo() || !this.terceroNombre() || !this.concepto()) {
      this.errorMensaje.set('Debe diligenciar los datos del recibo, tercero y concepto.');
      return;
    }

    const neto = this.valorNeto();
    if (neto <= 0) {
      this.errorMensaje.set('El valor neto debe ser mayor a cero.');
      return;
    }

    if (neto > c.saldoDisponible) {
      this.errorMensaje.set(`El valor supera el saldo disponible actual ($ ${c.saldoDisponible.toLocaleString('es-CO')}).`);
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const dto: RegistrarGastoCajaMenorModel = {
      cajaMenorId: c.id,
      fechaGasto: this.fechaGasto(),
      numeroRecibo: this.numeroRecibo(),
      terceroNombre: this.terceroNombre(),
      terceroNit: this.terceroNit(),
      concepto: this.concepto(),
      cuentaPucGasto: this.cuentaGasto() || '519530',
      valorBruto: Number(this.valorBruto()),
      valorRetencion: Number(this.valorRetencion() || 0),
      valorNeto: neto,
    };

    this.contabilidadService.registrarGastoCajaMenor(c.id, dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.gastoRegistrado.emit();
        this.cerrar();
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err.error?.message;
        this.errorMensaje.set(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al legalizar el gasto menor.');
      },
    });
  }
}
