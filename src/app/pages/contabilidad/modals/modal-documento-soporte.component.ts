import { Component, inject, signal, computed, input, output, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DianService } from '../services/dian.service';
import { ContabilidadService } from '../services/contabilidad.service';
import { DocumentoElectronicoModel, Tercero } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-documento-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-ds-dian-backdrop" (click)="cancelar()">
        <div class="modal-box w-[580px]" data-testid="modal-ds-dian" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg shadow-xs">
                📋
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-ds-dian-title">
                  Emitir Documento Soporte Electrónico (Tipo 05)
                </h3>
                <span class="text-xs text-slate-400 block">Adquisiciones y servicios prestados por no obligados a facturar (Res. 000167)</span>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cancelar()"
              data-testid="btn-close-ds-dian"
            >
              ✕
            </button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2.5" data-testid="alert-error-ds-dian">
                ⚠️ {{ errorMensaje() }}
              </div>
            }

            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-slate-700">Tercero / Proveedor (Persona Natural) *</label>
              <select
                class="input-base w-full text-xs"
                data-testid="select-tercero-ds"
                [ngModel]="terceroId()"
                (ngModelChange)="terceroId.set($event)"
              >
                <option value="">-- Seleccione el Tercero --</option>
                @for (t of terceros(); track t.id) {
                  <option [value]="t.id">
                    {{ t.nombreCompleto || t.primerNombre + ' ' + t.primerApellido }} (Doc: {{ t.numeroIdentificacion || t.id }})
                  </option>
                }
              </select>
            </div>

            <div class="form-group flex flex-col items-start gap-1">
              <label class="form-label text-xs font-semibold text-slate-700">Concepto del Bien o Servicio *</label>
              <textarea
                class="input-base w-full h-20 text-xs"
                data-testid="textarea-concepto-ds"
                [ngModel]="concepto()"
                (ngModelChange)="concepto.set($event)"
                placeholder="Ej: Honorarios profesionales por taller de robótica escolar..."
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-slate-700">Subtotal Bruto (COP) *</label>
                <input
                  type="number"
                  class="input-base w-full text-xs font-mono font-semibold"
                  data-testid="input-subtotal-ds"
                  [ngModel]="subtotal()"
                  (ngModelChange)="subtotal.set(+$event)"
                  placeholder="0"
                />
              </div>

              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-slate-700">Retenciones Aplicadas (COP)</label>
                <input
                  type="number"
                  class="input-base w-full text-xs font-mono font-semibold"
                  data-testid="input-retenciones-ds"
                  [ngModel]="retenciones()"
                  (ngModelChange)="retenciones.set(+$event)"
                  placeholder="0"
                />
              </div>
            </div>

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-sm">
              <span class="font-bold text-slate-700">Total a Pagar Neto:</span>
              <strong class="text-base text-indigo-700 font-mono" data-testid="total-neto-ds">
                \${{ totalNeto() | number }} COP
              </strong>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              class="btn btn-secondary btn-sm font-medium"
              data-testid="btn-cancelar-ds-dian"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm flex items-center gap-2 font-semibold shadow-sm"
              data-testid="btn-confirmar-ds-dian"
              [disabled]="enviando()"
              (click)="emitir()"
            >
              @if (enviando()) {
                <span class="animate-spin text-xs">⏳</span>
                <span>Generando y Transmitiendo...</span>
              } @else {
                <span>📤</span>
                <span>Emitir Documento Soporte</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalDocumentoSoporteComponent implements OnInit {
  private readonly dianService = inject(DianService);
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly cerrar = output<void>();
  readonly emitido = output<DocumentoElectronicoModel>();

  readonly terceros = signal<Tercero[]>([]);
  readonly terceroId = signal('');
  readonly concepto = signal('');
  readonly subtotal = signal(0);
  readonly retenciones = signal(0);

  readonly totalNeto = computed(() => {
    const s = this.subtotal();
    const r = this.retenciones();
    return Math.max(0, s - r);
  });

  readonly enviando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  constructor() {
    effect(
      () => {
        if (this.visible()) {
          this.cargarTerceros();
          this.errorMensaje.set(null);
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    this.cargarTerceros();
  }

  cargarTerceros(): void {
    this.contabilidadService.getTerceros().subscribe({
      next: (list) => this.terceros.set(list),
      error: () => {},
    });
  }

  emitir(): void {
    if (!this.terceroId()) {
      this.errorMensaje.set('Debe seleccionar el Tercero que suministra el bien o servicio.');
      return;
    }

    if (!this.concepto().trim() || this.concepto().trim().length < 5) {
      this.errorMensaje.set('Debe ingresar una descripción detallada (mínimo 5 caracteres).');
      return;
    }

    if (this.subtotal() <= 0) {
      this.errorMensaje.set('El subtotal bruto debe ser mayor a cero.');
      return;
    }

    this.enviando.set(true);
    this.errorMensaje.set(null);

    this.dianService
      .emitirDocumentoSoporte({
        terceroId: this.terceroId(),
        concepto: this.concepto().trim(),
        subtotal: this.subtotal(),
        retenciones: this.retenciones(),
        sendToDian: true,
      })
      .subscribe({
        next: (res) => {
          this.enviando.set(false);
          this.emitido.emit(res.documento);
          this.cerrar.emit();
        },
        error: (err) => {
          this.enviando.set(false);
          this.errorMensaje.set(err.error?.message || err.message || 'Error emitiendo Documento Soporte');
        },
      });
  }

  cancelar(): void {
    this.cerrar.emit();
  }
}
