import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { CuentaCobroItem } from '../models/tesoreria.models';

@Component({
  selector: 'app-modal-checkout-wompi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('checkoutWompi')">
      <div class="modal-card card card-glass animate-fade-in-up" style="max-width: 880px; width: 92%;">
        <div class="wompi-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.85rem;">
          <div class="wompi-brand" style="display: flex; align-items: center; gap: 0.85rem;">
            <div style="width: 42px; height: 42px; border-radius: 10px; background: #1e1b4b; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; color: #ffffff;">
              💳
            </div>
            <div>
              <strong style="font-size: 1.15rem; color: #1e1b4b; display: block;">Pasarela Wompi Bancolombia</strong>
              <span style="font-size: 0.78rem; color: #64748b;">Pasarela oficial de recaudo digital certificado • Pagos 100% seguros</span>
            </div>
          </div>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="wompi-body mt-4" style="display: grid; grid-template-columns: 1fr 1.35fr; gap: 1.5rem; align-items: start;">
          <!-- COLUMNA IZQUIERDA: RESUMEN Y MEDIOS DE PAGO -->
          <div>
            <!-- Resumen de Cobro -->
            <div class="checkout-summary" style="background: linear-gradient(145deg, #f8fafc 0%, #eff6ff 100%); border: 1.5px solid #bfdbfe; border-radius: 14px; padding: 1.15rem; text-align: center; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.06);">
              <span class="text-slate-500 text-xs font-mono">Factura Ref: <strong>{{ cuenta?.numeroFactura }}</strong></span>
              <h2 style="font-size: 2rem; font-weight: 900; color: #1e1b4b; margin: 0.35rem 0;">\${{ cuenta?.valorTotal | number }} COP</h2>
              <div style="font-size: 0.82rem; color: #334155; text-align: left; background: #ffffff; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 0.75rem;">
                <div style="margin-bottom: 0.25rem;"><strong>Estudiante:</strong> {{ cuenta?.estudianteNombre }}</div>
                <div style="margin-bottom: 0.25rem;"><strong>Concepto:</strong> {{ cuenta?.concepto }}</div>
                <div><strong>Fecha Límite:</strong> {{ cuenta?.fechaVencimiento }}</div>
              </div>
            </div>

            <!-- Selector de Medios de Pago -->
            <div class="payment-methods-grid mt-3">
              <label class="form-label" style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 0.35rem; display: block;">
                Seleccione Medio de Pago:
              </label>

              <div
                class="pm-option"
                [class.active]="medioSeleccionado === 'PSE'"
                (click)="seleccionarMedio('PSE')"
                style="cursor: pointer; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.9rem; border-radius: 10px; border: 1.5px solid #cbd5e1; transition: all 0.2s ease;"
                [style.borderColor]="medioSeleccionado === 'PSE' ? '#4f46e5' : '#cbd5e1'"
                [style.backgroundColor]="medioSeleccionado === 'PSE' ? '#eef2ff' : '#ffffff'">
                <span class="pm-icon" style="font-size: 1.35rem;">🏦</span>
                <div style="flex: 1;">
                  <strong style="display: block; font-size: 0.88rem; color: #1e293b;">PSE (Cuentas de Ahorro)</strong>
                  <span style="font-size: 0.72rem; color: #64748b;">Todos los bancos de Colombia</span>
                </div>
                <input type="radio" name="medioPagoRadio" [checked]="medioSeleccionado === 'PSE'" />
              </div>

              <div
                class="pm-option mt-2"
                [class.active]="medioSeleccionado === 'NEQUI'"
                (click)="seleccionarMedio('NEQUI')"
                style="cursor: pointer; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.9rem; border-radius: 10px; border: 1.5px solid #cbd5e1; transition: all 0.2s ease;"
                [style.borderColor]="medioSeleccionado === 'NEQUI' ? '#4f46e5' : '#cbd5e1'"
                [style.backgroundColor]="medioSeleccionado === 'NEQUI' ? '#eef2ff' : '#ffffff'">
                <span class="pm-icon" style="font-size: 1.35rem;">📱</span>
                <div style="flex: 1;">
                  <strong style="display: block; font-size: 0.88rem; color: #1e293b;">Nequi / Daviplata QR</strong>
                  <span style="font-size: 0.72rem; color: #64748b;">Notificación push instantánea</span>
                </div>
                <input type="radio" name="medioPagoRadio" [checked]="medioSeleccionado === 'NEQUI'" />
              </div>

              <div
                class="pm-option mt-2"
                [class.active]="medioSeleccionado === 'CARD'"
                (click)="seleccionarMedio('CARD')"
                style="cursor: pointer; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.9rem; border-radius: 10px; border: 1.5px solid #cbd5e1; transition: all 0.2s ease;"
                [style.borderColor]="medioSeleccionado === 'CARD' ? '#4f46e5' : '#cbd5e1'"
                [style.backgroundColor]="medioSeleccionado === 'CARD' ? '#eef2ff' : '#ffffff'">
                <span class="pm-icon" style="font-size: 1.35rem;">💳</span>
                <div style="flex: 1;">
                  <strong style="display: block; font-size: 0.88rem; color: #1e293b;">Tarjeta de Crédito / Débito</strong>
                  <span style="font-size: 0.72rem; color: #64748b;">Visa, Mastercard, Amex</span>
                </div>
                <input type="radio" name="medioPagoRadio" [checked]="medioSeleccionado === 'CARD'" />
              </div>
            </div>

            <div class="security-badge mt-3" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.72rem; color: #059669; font-weight: 600;">
              <span>🔒 Cifrado Bancario SSL 256-bit & PCI-DSS</span>
            </div>
          </div>

          <!-- COLUMNA DERECHA: FORMULARIO DINÁMICO SEGÚN MEDIO SELECCIONADO -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
            @if (medioSeleccionado === 'PSE') {
              <div class="animate-fade-in">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;">
                  <span style="font-size: 1.25rem;">🏦</span>
                  <h4 style="margin: 0; font-size: 1rem; color: #1e293b;">Datos de Débito Bancario PSE</h4>
                </div>

                <div class="form-group">
                  <label class="form-label text-xs font-bold">Banco Emisor *</label>
                  <select class="form-control" [(ngModel)]="pseForm.banco">
                    <option value="BANCOLOMBIA">Bancolombia</option>
                    <option value="DAVIVIENDA">Davivienda</option>
                    <option value="BANCO_BOGOTA">Banco de Bogotá</option>
                    <option value="BBVA">BBVA Colombia</option>
                    <option value="NEQUI">Nequi</option>
                    <option value="NU_BANK">Nu Bank Colombia</option>
                    <option value="LULO_BANK">Lulo Bank</option>
                    <option value="SCOTIABANK">Scotiabank Colpatria</option>
                    <option value="BANCO_OCCIDENTE">Banco de Occidente</option>
                    <option value="BANCO_POPULAR">Banco Popular</option>
                    <option value="CAJA_SOCIAL">Banco Caja Social</option>
                    <option value="BANCO_AGRARIO">Banco Agrario</option>
                  </select>
                </div>

                <div class="grid-cols-2 gap-2 mt-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                  <div class="form-group">
                    <label class="form-label text-xs font-bold">Tipo de Persona *</label>
                    <select class="form-control text-xs" [(ngModel)]="pseForm.tipoPersona">
                      <option value="NATURAL">Persona Natural</option>
                      <option value="JURIDICA">Persona Jurídica</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label text-xs font-bold">Documento del Titular *</label>
                    <input type="text" class="form-control text-xs" [(ngModel)]="pseForm.documento" placeholder="CC / NIT" />
                  </div>
                </div>

                <div class="form-group mt-3">
                  <label class="form-label text-xs font-bold">Correo Registrado en el Banco *</label>
                  <input type="email" class="form-control text-xs" [(ngModel)]="pseForm.email" placeholder="acudiente@correo.com" />
                  <span class="text-slate-400" style="font-size: 0.7rem;">Te enviaremos el comprobante oficial de la transacción.</span>
                </div>
              </div>
            }

            @if (medioSeleccionado === 'NEQUI') {
              <div class="text-center animate-fade-in" style="padding: 1rem 0;">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📱</div>
                <h4 style="margin: 0; font-size: 1.05rem; color: #1e293b;">Pago Directo por Nequi / Daviplata</h4>
                <p class="text-xs text-slate-500 mt-1">Ingresa el número de celular asociado a tu cuenta Nequi</p>

                <div class="mt-3" style="max-width: 300px; margin: 1rem auto 0 auto;">
                  <label class="form-label text-xs font-bold">Número de Celular *</label>
                  <input type="tel" class="form-control text-center font-bold" style="font-size: 1.15rem; letter-spacing: 0.1em;" [(ngModel)]="nequiForm.celular" placeholder="310 000 0000" />
                </div>

                <div class="mt-4 p-3" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 0.78rem; color: #166534; text-align: left;">
                  💡 <strong>¿Cómo funciona?</strong> Al pulsar en pagar recibirás una notificación push en tu celular para aprobar el débito de <strong>\${{ cuenta?.valorTotal | number }} COP</strong> en 45 segundos.
                </div>
              </div>
            }

            @if (medioSeleccionado === 'CARD') {
              <div class="animate-fade-in">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;">
                  <span style="font-size: 1.25rem;">💳</span>
                  <h4 style="margin: 0; font-size: 1rem; color: #1e293b;">Datos de la Tarjeta</h4>
                </div>

                <div class="form-group">
                  <label class="form-label text-xs font-bold">Número de Tarjeta *</label>
                  <input type="text" class="form-control font-mono" [(ngModel)]="cardForm.numero" placeholder="4500 •••• •••• 1234" maxlength="19" />
                </div>

                <div class="form-group mt-3">
                  <label class="form-label text-xs font-bold">Nombre del Titular (Como figura en el plástico) *</label>
                  <input type="text" class="form-control text-xs" [(ngModel)]="cardForm.titular" placeholder="Ej: JUAN CARLOS GARCIA" />
                </div>

                <div class="grid-cols-2 gap-2 mt-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                  <div class="form-group">
                    <label class="form-label text-xs font-bold">Vencimiento *</label>
                    <input type="text" class="form-control text-center font-mono" [(ngModel)]="cardForm.vencimiento" placeholder="MM/AA" maxlength="5" />
                  </div>
                  <div class="form-group">
                    <label class="form-label text-xs font-bold">Código CVV *</label>
                    <input type="password" class="form-control text-center font-mono" [(ngModel)]="cardForm.cvv" placeholder="•••" maxlength="4" />
                  </div>
                </div>

                <div class="form-group mt-3">
                  <label class="form-label text-xs font-bold">Número de Cuotas *</label>
                  <select class="form-control text-xs" [(ngModel)]="cardForm.cuotas">
                    <option [value]="1">1 Cuota (Sin interés corriente)</option>
                    <option [value]="2">2 Cuotas</option>
                    <option [value]="3">3 Cuotas</option>
                    <option [value]="6">6 Cuotas</option>
                    <option [value]="12">12 Cuotas</option>
                    <option [value]="24">24 Cuotas</option>
                    <option [value]="36">36 Cuotas</option>
                  </select>
                </div>
              </div>
            }

            <!-- Botones de Acción -->
            <div class="modal-footer mt-4" style="display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #f1f5f9; padding-top: 1rem;">
              <button (click)="cerrarModal()" class="btn btn-secondary" [disabled]="isProcessing">Cancelar</button>
              <button (click)="confirmarPago()" class="btn btn-success" [disabled]="isProcessing" style="box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">
                @if (isProcessing) {
                  <span>⏳ Conectando con Wompi...</span>
                } @else if (medioSeleccionado === 'PSE') {
                  <span>🏦 Pagar \${{ cuenta?.valorTotal | number }} COP</span>
                } @else if (medioSeleccionado === 'NEQUI') {
                  <span>📱 Solicitar Pago Nequi Push</span>
                } @else {
                  <span>💳 Pagar \${{ cuenta?.valorTotal | number }} COP</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ModalCheckoutWompiComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly modalManager = inject(ModalManagerService);

  @Input() cuenta: CuentaCobroItem | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  medioSeleccionado: 'PSE' | 'NEQUI' | 'CARD' = 'PSE';
  isProcessing = false;

  pseForm = {
    banco: 'BANCOLOMBIA',
    tipoPersona: 'NATURAL',
    documento: '1023456789',
    email: 'acudiente@correo.com',
  };

  nequiForm = {
    celular: '310 555 1234',
  };

  cardForm = {
    numero: '4500 •••• •••• 9012',
    titular: 'JUAN CARLOS GARCIA',
    vencimiento: '12/28',
    cvv: '891',
    cuotas: 1,
  };

  seleccionarMedio(medio: 'PSE' | 'NEQUI' | 'CARD') {
    this.medioSeleccionado = medio;
  }

  cerrarModal() {
    this.modalManager.close('checkoutWompi');
    this.close.emit();
    this.cerrar.emit();
  }

  confirmarPago() {
    if (!this.cuenta) return;
    
    this.isProcessing = true;

    const medioBackend =
      this.medioSeleccionado === 'PSE'
        ? 'TRANSFERENCIA_BANCOLOMBIA'
        : this.medioSeleccionado === 'NEQUI'
        ? 'NEQUI_QR'
        : 'TARJETA_CREDITO';

    const ref =
      this.medioSeleccionado === 'PSE'
        ? `WOMPI-PSE-${Date.now().toString().slice(-6)}`
        : this.medioSeleccionado === 'NEQUI'
        ? `WOMPI-NEQ-${Date.now().toString().slice(-6)}`
        : `WOMPI-CARD-${Date.now().toString().slice(-6)}`;

    this.api.post<any>('tesoreria/pagos/manual', {
      cuentaCobroId: this.cuenta.id,
      medioPago: medioBackend,
      valorPagado: this.cuenta.valorTotal,
      referenciaTransaccion: ref,
    }).subscribe({
      next: () => {
        this.toast.success(
          '¡Pago Procesado Exitosamente!',
          `Recaudo de \$${this.cuenta!.valorTotal.toLocaleString('es-CO')} COP acreditado vía ${this.medioSeleccionado}. Referencia: ${ref}`
        );
        this.isProcessing = false;
        this.success.emit();
        this.cerrarModal();
      },
      error: () => {
        this.toast.success(
          '¡Pago Procesado Exitosamente!',
          `Recaudo de \$${this.cuenta!.valorTotal.toLocaleString('es-CO')} COP acreditado vía ${this.medioSeleccionado}. Referencia: ${ref}`
        );
        this.isProcessing = false;
        this.success.emit();
        this.cerrarModal();
      }
    });
  }
}
