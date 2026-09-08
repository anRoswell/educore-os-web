import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContabilidadService } from '../services/contabilidad.service';
import { CertificadoProveedorResumenModel } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-detalle-certificado-proveedor',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible() && certificado()) {
      <div class="modal-backdrop" data-testid="modal-certificado-prov-backdrop" (click)="cerrar()">
        <div class="modal-box w-[700px] max-w-full max-h-[90vh] overflow-y-auto" data-testid="modal-certificado-prov" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg shadow-xs">
                📜
              </div>
              <div>
                <h3 class="modal-title font-bold text-base text-slate-800 tracking-tight" data-testid="modal-certificado-prov-title">
                  Certificado de Retención en la Fuente (Art. 381 E.T.)
                </h3>
                <span class="text-xs text-indigo-700 font-semibold">Año Gravable {{ certificado()!.anioGravable }}</span>
              </div>
            </div>
            <button type="button" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors" (click)="cerrar()">✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (mensajeNotificacion()) {
              <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded p-2.5 flex items-center justify-between" data-testid="alert-notificacion-email">
                <span>{{ mensajeNotificacion() }}</span>
                <button type="button" class="text-emerald-700 font-bold" (click)="mensajeNotificacion.set(null)">✕</button>
              </div>
            }

            <!-- Tarjetas de Identificación Fiscal -->
            <div class="grid grid-cols-2 gap-3">
              <!-- Colegio / Agente Retenedor -->
              <div class="border rounded p-3 bg-slate-50 text-xs space-y-1">
                <span class="font-bold text-indigo-900 block border-b pb-1 mb-1">AGENTE RETENEDOR</span>
                <div><span class="text-gray-500">Razón Social:</span> <strong class="text-gray-800">{{ certificado()!.colegioNombre }}</strong></div>
                <div><span class="text-gray-500">NIT:</span> <strong class="text-gray-800">{{ certificado()!.colegioNit }}</strong></div>
                <div><span class="text-gray-500">Ciudad:</span> {{ certificado()!.colegioCiudad || 'Bogotá D.C.' }}</div>
              </div>

              <!-- Proveedor / Beneficiario Retenido -->
              <div class="border rounded p-3 bg-slate-50 text-xs space-y-1">
                <span class="font-bold text-indigo-900 block border-b pb-1 mb-1">SUJETO PASIVO RETENIDO</span>
                <div><span class="text-gray-500">Proveedor:</span> <strong class="text-gray-800" data-testid="label-proveedor-nombre">{{ certificado()!.terceroNombre }}</strong></div>
                <div><span class="text-gray-500">NIT / C.C.:</span> <strong class="text-gray-800" data-testid="label-proveedor-nit">{{ certificado()!.terceroNit }}</strong></div>
                <div><span class="text-gray-500">Email:</span> {{ certificado()!.terceroEmail || 'contacto@proveedor.com' }}</div>
              </div>
            </div>

            <!-- Tabla de Retenciones Practicadas -->
            <div>
              <span class="text-xs font-bold text-gray-700 block mb-1.5">
                Desglose de Retenciones Practicadas durante el Año Gravable {{ certificado()!.anioGravable }}
              </span>

              <div class="border rounded overflow-hidden text-xs">
                <table class="w-full">
                  <thead class="bg-indigo-900 text-white font-semibold">
                    <tr>
                      <th class="p-2 text-left">Concepto Retención</th>
                      <th class="p-2 text-left">Cuenta PUC</th>
                      <th class="p-2 text-right">Tarifa</th>
                      <th class="p-2 text-right">Base Gravable</th>
                      <th class="p-2 text-right">Monto Retenido</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    @for (d of certificado()!.detalles; track d.cuentaCodigo) {
                      <tr class="hover:bg-gray-50">
                        <td class="p-2 text-gray-800 font-medium">{{ d.concepto }}</td>
                        <td class="p-2 font-mono text-gray-600">{{ d.cuentaCodigo }}</td>
                        <td class="p-2 text-right text-indigo-700 font-bold">{{ d.porcentajeTarifa | number:'1.1-2' }}%</td>
                        <td class="p-2 text-right text-gray-700">$ {{ d.baseGravable | number:'1.0-0' }}</td>
                        <td class="p-2 text-right font-bold text-gray-900">$ {{ d.montoRetenido | number:'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                  <tfoot class="bg-slate-100 font-bold border-t">
                    <tr>
                      <td colspan="3" class="p-2 text-indigo-900 uppercase">Totales Consolidados:</td>
                      <td class="p-2 text-right text-gray-800">$ {{ certificado()!.totalBaseGravable | number:'1.0-0' }}</td>
                      <td class="p-2 text-right text-emerald-700 font-extrabold" data-testid="label-total-retenido-modal">
                        $ {{ certificado()!.totalRetenido | number:'1.0-0' }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Valor en Letras -->
            <div class="border rounded p-2.5 bg-gray-50 text-xs">
              <span class="font-bold text-gray-600 block mb-0.5">VALOR TOTAL RETENIDO EN LETRAS:</span>
              <span class="text-gray-800 font-medium italic" data-testid="label-total-letras">
                {{ certificado()!.totalRetenidoLetras }}
              </span>
            </div>

            <!-- Datos de Expedición y Firma -->
            <div class="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
              <div>
                <span>Expedido en: <strong>{{ certificado()!.ciudadExpedicion }}</strong>, el {{ certificado()!.fechaExpedicion }}</span>
              </div>
              <div>
                <span>Firma Responsable: <strong>{{ certificado()!.contadorNombre }}</strong> ({{ certificado()!.contadorTP }})</span>
              </div>
            </div>
          </div>

          <div class="modal-footer flex items-center justify-between pt-4 border-t mt-4">
            <div class="text-xs text-gray-400 font-mono">
              {{ certificado()!.codigoVerificacion }}
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn-secondary text-xs"
                data-testid="btn-cerrar-modal-cert"
                (click)="cerrar()"
              >
                Cerrar
              </button>
              <button
                type="button"
                class="btn-secondary text-xs flex items-center gap-1 text-indigo-700 hover:text-indigo-800"
                data-testid="btn-enviar-email-cert"
                (click)="enviarEmail()"
                [disabled]="enviandoEmail()"
              >
                @if (enviandoEmail()) {
                  <span class="animate-spin text-xs">⏳</span>
                } @else {
                  <span>✉️</span>
                }
                <span>Enviar por Email</span>
              </button>
              <button
                type="button"
                class="btn-primary text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                data-testid="btn-descargar-pdf-cert"
                (click)="descargarPdf()"
                [disabled]="descargandoPdf()"
              >
                @if (descargandoPdf()) {
                  <span class="animate-spin text-xs">⏳</span>
                } @else {
                  <span>📥</span>
                }
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalDetalleCertificadoProveedorComponent {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly certificado = input<CertificadoProveedorResumenModel | null>(null);
  readonly cerrarModal = output<void>();

  readonly descargandoPdf = signal(false);
  readonly enviandoEmail = signal(false);
  readonly mensajeNotificacion = signal<string | null>(null);

  cerrar(): void {
    this.mensajeNotificacion.set(null);
    this.cerrarModal.emit();
  }

  descargarPdf(): void {
    const cert = this.certificado();
    if (!cert) return;

    this.descargandoPdf.set(true);
    this.contabilidadService.descargarPdfCertificadoProveedor(cert.terceroId, cert.anioGravable).subscribe({
      next: (blob) => {
        this.descargandoPdf.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificado_Retencion_Art381_${cert.anioGravable}_${cert.terceroNit}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.descargandoPdf.set(false);
      },
    });
  }

  enviarEmail(): void {
    const cert = this.certificado();
    if (!cert) return;

    this.enviandoEmail.set(true);
    this.contabilidadService.enviarEmailCertificadoProveedor(cert.terceroId, cert.anioGravable).subscribe({
      next: (res) => {
        this.enviandoEmail.set(false);
        this.mensajeNotificacion.set(res.mensaje || 'Certificado enviado satisfactoriamente al proveedor.');
      },
      error: () => {
        this.enviandoEmail.set(false);
        this.mensajeNotificacion.set('Error al enviar el certificado por correo.');
      },
    });
  }
}
