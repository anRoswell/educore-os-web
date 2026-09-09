import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DianService } from '../services/dian.service';
import { DocumentoElectronicoModel } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-nota-debito-dian',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible() && documento()) {
      <div class="modal-backdrop" data-testid="modal-nd-dian-backdrop" (click)="cancelar()">
        <div class="modal-box w-[520px]" data-testid="modal-nd-dian" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b">
            <div>
              <h3 class="modal-title font-bold text-lg text-purple-700" data-testid="modal-nd-dian-title">
                📈 Emitir Nota Débito DIAN (Tipo 92)
              </h3>
              <p class="text-xs text-slate-500">Recargo o incremento sobre Factura Electrónica</p>
            </div>
            <button type="button" class="btn-close text-slate-400 hover:text-slate-600" (click)="cancelar()" data-testid="btn-close-nd-dian">✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2.5" data-testid="alert-error-nd-dian">
                ⚠️ {{ errorMensaje() }}
              </div>
            }

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div><strong>Factura Afectada:</strong> {{ documento()!.prefijo }}-{{ documento()!.numero }}</div>
              <div><strong>Fecha de Emisión:</strong> {{ documento()!.fechaEmision }}</div>
              <div><strong>Valor Total Factura:</strong> \${{ documento()!.total | number }} COP</div>
              <div class="text-slate-500 truncate" title="{{ documento()!.cufeCude }}">
                <strong>CUFE Referencia:</strong> {{ documento()!.cufeCude || 'SIN_CUFE' }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label text-xs font-semibold">Concepto / Motivo de la Nota Débito *</label>
              <textarea
                class="input-base h-20 text-xs"
                data-testid="textarea-motivo-nd"
                [ngModel]="concepto()"
                (ngModelChange)="concepto.set($event)"
                placeholder="Ej: Cobro de intereses por mora o ajuste por mayor valor..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label text-xs font-semibold">Valor a Debitar (COP) *</label>
              <input
                type="number"
                class="input-base text-xs font-mono"
                data-testid="input-valor-nd"
                [ngModel]="valorTotal()"
                (ngModelChange)="valorTotal.set(+$event)"
              />
              <span class="text-xs text-slate-400 mt-1 block">Ingrese el valor exacto a adicionar a la cuenta.</span>
            </div>
          </div>

          <div class="modal-actions flex justify-end gap-2 pt-4 border-t mt-4">
            <button
              type="button"
              class="btn-secondary"
              data-testid="btn-cancelar-nd-dian"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary"
              data-testid="btn-confirmar-nd-dian"
              [disabled]="enviando()"
              (click)="emitir()"
            >
              @if (enviando()) {
                Firmando y Transmitiendo...
              } @else {
                📤 Emitir Nota Débito
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalNotaDebitoDianComponent {
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
    effect(
      () => {
        const doc = this.documento();
        if (doc) {
          this.valorTotal.set(0);
          this.concepto.set('');
          this.errorMensaje.set(null);
        }
      },
      { allowSignalWrites: true },
    );
  }

  emitir(): void {
    if (!this.concepto().trim() || this.concepto().trim().length < 5) {
      this.errorMensaje.set('Debe ingresar un motivo detallado (mínimo 5 caracteres).');
      return;
    }

    if (this.valorTotal() <= 0) {
      this.errorMensaje.set('El valor a debitar debe ser mayor a cero.');
      return;
    }

    this.enviando.set(true);
    this.errorMensaje.set(null);

    this.dianService
      .emitirNotaDebito({
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
          this.errorMensaje.set(err.error?.message || err.message || 'Error emitiendo Nota Débito');
        },
      });
  }

  cancelar(): void {
    this.cerrar.emit();
  }
}
