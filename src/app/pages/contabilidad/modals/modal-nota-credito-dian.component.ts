import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DianService } from '../services/dian.service';
import { DocumentoElectronicoModel } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-nota-credito-dian',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible() && documento()) {
      <div class="modal-backdrop" data-testid="modal-nc-dian-backdrop" (click)="cancelar()">
        <div class="modal-box w-[520px]" data-testid="modal-nc-dian" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b">
            <div>
              <h3 class="modal-title font-bold text-lg text-amber-600" data-testid="modal-nc-dian-title">
                🧾 Emitir Nota Crédito DIAN (Tipo 91)
              </h3>
              <p class="text-xs text-slate-500">Anulación o ajuste sobre Factura Electrónica</p>
            </div>
            <button type="button" class="btn-close text-slate-400 hover:text-slate-600" (click)="cancelar()" data-testid="btn-close-nc-dian">✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2.5" data-testid="alert-error-nc-dian">
                ⚠️ {{ errorMensaje() }}
              </div>
            }

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div><strong>Factura Afectada:</strong> {{ documento()!.prefijo }}-{{ documento()!.numero }}</div>
              <div><strong>Fecha de Emisión:</strong> {{ documento()!.fechaEmision }}</div>
              <div><strong>Valor Total Original:</strong> \${{ documento()!.total | number }} COP</div>
              <div class="text-slate-500 truncate" title="{{ documento()!.cufeCude }}">
                <strong>CUFE Referencia:</strong> {{ documento()!.cufeCude || 'SIN_CUFE' }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label text-xs font-semibold">Concepto / Motivo de la Nota Crédito *</label>
              <textarea
                class="input-base h-20 text-xs"
                data-testid="textarea-motivo-nc"
                [ngModel]="concepto()"
                (ngModelChange)="concepto.set($event)"
                placeholder="Ej: Anulación de pensión por retiro voluntario del estudiante..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label text-xs font-semibold">Valor a Acreditar (COP) *</label>
              <input
                type="number"
                class="input-base text-xs"
                data-testid="input-valor-nc"
                [ngModel]="valorTotal()"
                (ngModelChange)="valorTotal.set(+$event)"
              />
              <span class="text-xs text-slate-400 mt-1 block">Por defecto se acredita el valor total de la factura.</span>
            </div>
          </div>

          <div class="modal-actions flex justify-end gap-2 pt-4 border-t mt-4">
            <button
              type="button"
              class="btn-secondary"
              data-testid="btn-cancelar-nc-dian"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary"
              data-testid="btn-confirmar-nc-dian"
              [disabled]="enviando()"
              (click)="emitir()"
            >
              @if (enviando()) {
                Firmando y Transmitiendo...
              } @else {
                📤 Emitir Nota Crédito
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalNotaCreditoDianComponent {
  private readonly dianService = inject(DianService);

  readonly visible = input<boolean>(false);
  readonly documento = input<DocumentoElectronicoModel | null>(null);
  readonly cerrar = output<void>();
  readonly emitido = output<DocumentoElectronicoModel>();

  readonly concepto = signal('');
  readonly valorTotal = signal(0);
  readonly enviando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  constructor() {
    effect(() => {
      const doc = this.documento();
      if (doc) {
        this.valorTotal.set(Number(doc.total));
        this.concepto.set('');
        this.errorMensaje.set(null);
      }
    });
  }

  emitir(): void {
    if (!this.concepto().trim() || this.concepto().trim().length < 5) {
      this.errorMensaje.set('Debe ingresar un motivo detallado (mínimo 5 caracteres).');
      return;
    }

    if (this.valorTotal() <= 0) {
      this.errorMensaje.set('El valor a acreditar debe ser mayor a cero.');
      return;
    }

    this.enviando.set(true);
    this.errorMensaje.set(null);

    this.dianService
      .emitirNotaCredito({
        documentoReferenciadoId: this.documento()!.id,
        concepto: this.concepto().trim(),
        valorTotal: this.valorTotal(),
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
          this.errorMensaje.set(err.error?.message || err.message || 'Error emitiendo Nota Crédito');
        },
      });
  }

  cancelar(): void {
    this.cerrar.emit();
  }
}
