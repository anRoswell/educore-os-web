import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DianService } from '../services/dian.service';
import { DocumentoElectronicoModel } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-detalle-factura-dian',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .modal-detalle-dian {
      width: 95% !important;
      max-width: 800px !important;
      max-height: 90vh !important;
      overflow-y: auto;
      padding: 1.5rem !important;
      border-radius: 1rem;
      background: #ffffff;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
  `],
  template: `
    @if (visible() && documento()) {
      <div class="modal-backdrop" data-testid="modal-detalle-factura-backdrop" (click)="cancelar()">
        <div class="modal-box modal-detalle-dian" data-testid="modal-detalle-factura" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 text-xl font-bold shadow-sm">
                📑
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="modal-title font-bold text-lg text-slate-800" data-testid="modal-detalle-title">
                    {{ documento()!.prefijo }}-{{ documento()!.numero }}
                  </h3>
                  <span
                    class="px-2 py-0.5 rounded-full text-[11px] font-bold"
                    [ngClass]="{
                      'bg-emerald-100 text-emerald-800': documento()!.estadoDian === 'ACEPTADO',
                      'bg-amber-100 text-amber-800': documento()!.estadoDian === 'ENVIADO' || documento()!.estadoDian === 'FIRMADO' || documento()!.estadoDian === 'BORRADOR',
                      'bg-rose-100 text-rose-800': documento()!.estadoDian === 'RECHAZADO'
                    }"
                    data-testid="badge-detalle-estado"
                  >
                    {{ documento()!.estadoDian }}
                  </span>
                </div>
                <p class="text-xs text-slate-500">
                  Tipo: <strong>{{ documento()!.tipoDocumento }}</strong> | Fecha: {{ documento()!.fechaEmision }} {{ documento()!.horaEmision }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cancelar()"
              data-testid="btn-close-detalle-factura"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body space-y-4">
            <!-- Feedback alerts -->
            @if (mensajeExito()) {
              <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center justify-between" data-testid="alert-detalle-success">
                <span>✅ {{ mensajeExito() }}</span>
                <button type="button" class="text-emerald-700 font-bold" (click)="mensajeExito.set(null)">✕</button>
              </div>
            }
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3 flex items-center justify-between" data-testid="alert-detalle-error">
                <span>⚠️ {{ errorMensaje() }}</span>
                <button type="button" class="text-red-700 font-bold" (click)="errorMensaje.set(null)">✕</button>
              </div>
            }

            <!-- 1. Technical Info & DIAN Response -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <h4 class="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <span>🏛️</span> Validación y Trazabilidad DIAN
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span class="block text-slate-400 text-[10px] uppercase font-bold">CUFE / CUDE:</span>
                  <div class="font-mono text-[11px] bg-white p-1.5 rounded border border-slate-200 text-slate-800 break-all select-all" data-testid="detalle-cufe">
                    {{ documento()!.cufeCude || 'Sin CUFE generado' }}
                  </div>
                </div>
                <div>
                  <span class="block text-slate-400 text-[10px] uppercase font-bold">Track ID DIAN:</span>
                  <div class="font-mono text-[11px] bg-white p-1.5 rounded border border-slate-200 text-slate-800 break-all" data-testid="detalle-track-id">
                    {{ documento()!.trackIdDian || 'N/A' }}
                  </div>
                </div>
              </div>

              <div class="pt-1">
                <span class="block text-slate-400 text-[10px] uppercase font-bold">Respuesta Oficial DIAN:</span>
                <div class="bg-white p-2 rounded border border-slate-200 text-slate-700 font-medium" data-testid="detalle-respuesta-dian">
                  {{ documento()!.mensajeRespuestaDian || 'Documento en proceso o sin respuesta de la DIAN' }}
                </div>
              </div>
            </div>

            <!-- 2. Adquiriente / Tercero & Desglose Financiero -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Tercero / Cliente -->
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <h4 class="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <span>👤</span> Datos del Adquiriente
                </h4>
                @if (documento()!.tercero) {
                  <div><strong>Nombre / Razón Social:</strong> {{ documento()!.tercero?.nombreCompleto || documento()!.tercero?.razonSocial }}</div>
                  <div><strong>Identificación:</strong> {{ documento()!.tercero?.tipoIdentificacion || 'CC' }} {{ documento()!.tercero?.numeroIdentificacion }}</div>
                  <div><strong>Email:</strong> {{ documento()!.tercero?.email || 'No registrado' }}</div>
                  <div><strong>Teléfono:</strong> {{ documento()!.tercero?.telefono || 'No registrado' }}</div>
                } @else if (documento()!.cuentaCobro) {
                  <div><strong>Estudiante:</strong> {{ documento()!.cuentaCobro.estudianteNombre }}</div>
                  <div><strong>Cuenta de Cobro Ref:</strong> {{ documento()!.cuentaCobro.numeroFactura || documento()!.cuentaCobro.id }}</div>
                } @else {
                  <div class="text-slate-400 italic">Información de tercero no disponible</div>
                }
              </div>

              <!-- Totales Financieros -->
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <h4 class="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <span>💰</span> Liquidación Económica
                </h4>
                <div class="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span class="font-mono font-semibold" data-testid="detalle-subtotal">\${{ documento()!.subtotal | number:'1.0-0' }} COP</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Descuentos:</span>
                  <span class="font-mono font-semibold text-amber-700" data-testid="detalle-descuentos">-\${{ documento()!.descuentos | number:'1.0-0' }} COP</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>IVA:</span>
                  <span class="font-mono font-semibold" data-testid="detalle-iva">\${{ documento()!.iva | number:'1.0-0' }} COP</span>
                </div>
                <div class="border-t border-slate-200 pt-1.5 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total Facturado:</span>
                  <span class="text-base text-indigo-700 font-mono" data-testid="detalle-total">
                    \${{ documento()!.total | number:'1.0-0' }} COP
                  </span>
                </div>
              </div>
            </div>

            <!-- 3. Formulario de Envío por Email (Acordeón o Panel) -->
            @if (mostrandoEmailForm()) {
              <div class="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-3 text-xs" data-testid="panel-email-factura">
                <h4 class="font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>✉️</span> Despacho por Email con Adjunto XML + PDF Oficial
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="form-group flex flex-col gap-1">
                    <label class="font-semibold text-indigo-800">Email Destinatario *</label>
                    <input
                      type="email"
                      class="input-base text-xs bg-white"
                      data-testid="input-email-destino"
                      placeholder="padredefamilia@ejemplo.com"
                      [ngModel]="emailDestino()"
                      (ngModelChange)="emailDestino.set($event)"
                    />
                  </div>

                  <div class="form-group flex flex-col gap-1">
                    <label class="font-semibold text-indigo-800">Asunto del Correo</label>
                    <input
                      type="text"
                      class="input-base text-xs bg-white"
                      data-testid="input-email-asunto"
                      [ngModel]="emailAsunto()"
                      (ngModelChange)="emailAsunto.set($event)"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    class="btn btn-secondary btn-xs"
                    data-testid="btn-cancelar-email"
                    (click)="mostrandoEmailForm.set(false)"
                  >
                    Ocultar
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-xs flex items-center gap-1 font-semibold"
                    data-testid="btn-confirmar-enviar-email"
                    [disabled]="enviandoEmail()"
                    (click)="enviarEmail()"
                  >
                    @if (enviandoEmail()) {
                      <span>⏳ Enviando...</span>
                    } @else {
                      <span>📤 Enviar Factura por Correo</span>
                    }
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Actions Bar -->
          <div class="modal-footer flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn btn-secondary btn-sm flex items-center gap-1.5"
                data-testid="btn-detalle-descargar-xml"
                (click)="descargarXml()"
              >
                <span>📥</span>
                <span>Descargar XML</span>
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm flex items-center gap-1.5"
                data-testid="btn-detalle-descargar-pdf"
                (click)="descargarPdf()"
              >
                <span>📄</span>
                <span>Descargar PDF</span>
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm flex items-center gap-1.5"
                data-testid="btn-detalle-toggle-email"
                (click)="mostrandoEmailForm.set(!mostrandoEmailForm())"
              >
                <span>✉️</span>
                <span>Enviar por Email</span>
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn btn-outline btn-sm flex items-center gap-1.5"
                data-testid="btn-detalle-reconsultar"
                [disabled]="reconsultando()"
                (click)="reconsultar()"
              >
                @if (reconsultando()) {
                  <span>⏳ Reconsultando...</span>
                } @else {
                  <span>🔄 Reconsultar DIAN</span>
                }
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                data-testid="btn-cerrar-detalle-factura"
                (click)="cancelar()"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalDetalleFacturaDianComponent {
  private readonly dianService = inject(DianService);

  readonly visible = input<boolean>(false);
  readonly documento = input<DocumentoElectronicoModel | null>(null);
  readonly cerrar = output<void>();
  readonly actualizado = output<DocumentoElectronicoModel>();

  readonly mostrandoEmailForm = signal<boolean>(false);
  readonly emailDestino = signal<string>('');
  readonly emailAsunto = signal<string>('');
  readonly enviandoEmail = signal<boolean>(false);
  readonly reconsultando = signal<boolean>(false);
  readonly mensajeExito = signal<string | null>(null);
  readonly errorMensaje = signal<string | null>(null);

  constructor() {
    effect(
      () => {
        const doc = this.documento();
        if (doc) {
          this.emailDestino.set(doc.tercero?.email || '');
          this.emailAsunto.set(`Factura Electrónica ${doc.prefijo}-${doc.numero}`);
          this.mostrandoEmailForm.set(false);
          this.mensajeExito.set(null);
          this.errorMensaje.set(null);
        }
      },
      { allowSignalWrites: true },
    );
  }

  descargarXml(): void {
    const doc = this.documento();
    if (!doc) return;
    this.dianService.descargarXml(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.prefijo}_${doc.numero}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMensaje.set(`No se pudo descargar el XML de la factura ${doc.prefijo}-${doc.numero}`);
      },
    });
  }

  descargarPdf(): void {
    const doc = this.documento();
    if (!doc) return;
    this.dianService.descargarPdf(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.prefijo}_${doc.numero}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMensaje.set(`No se pudo descargar el PDF de la factura ${doc.prefijo}-${doc.numero}`);
      },
    });
  }

  enviarEmail(): void {
    const doc = this.documento();
    if (!doc) return;

    if (!this.emailDestino().trim()) {
      this.errorMensaje.set('Debe ingresar una dirección de correo electrónico válida.');
      return;
    }

    this.enviandoEmail.set(true);
    this.errorMensaje.set(null);

    this.dianService
      .enviarFacturaEmail(doc.id, {
        emailDestino: this.emailDestino().trim(),
        asunto: this.emailAsunto().trim(),
      })
      .subscribe({
        next: (res) => {
          this.enviandoEmail.set(false);
          this.mensajeExito.set(`Factura despachada exitosamente a ${res.enviadoA}`);
          this.mostrandoEmailForm.set(false);
        },
        error: (err) => {
          this.enviandoEmail.set(false);
          this.errorMensaje.set(err.error?.message || err.message || 'Error enviando factura por email');
        },
      });
  }

  reconsultar(): void {
    const doc = this.documento();
    if (!doc) return;

    this.reconsultando.set(true);
    this.errorMensaje.set(null);

    this.dianService.reconsultar(doc.id).subscribe({
      next: (res) => {
        this.reconsultando.set(false);
        this.mensajeExito.set(`Reconsulta DIAN: ${res.estadoDian} - ${res.mensajeRespuesta || 'Actualizado'}`);
        if (res.documento) {
          this.actualizado.emit(res.documento);
        }
      },
      error: (err) => {
        this.reconsultando.set(false);
        this.errorMensaje.set(err.error?.message || err.message || 'Error reconsultando estado en DIAN');
      },
    });
  }

  cancelar(): void {
    this.cerrar.emit();
  }
}
