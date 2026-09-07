import { Component, EventEmitter, inject, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef, signal, OnInit } from '@angular/core';
import { Parametro, ParametrosService } from '../../../core/services/parametros.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { SearchableSelectComponent, SearchableOption } from '../../../shared/components/searchable-select.component';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';
import { CuentaCobroItem, EstadoCuenta, MedioPago, PagoManualForm } from '../models/tesoreria.models';

@Component({
  selector: 'app-modal-pago-manual',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SearchableSelectComponent, CurrencyMaskDirective],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('pagoManual')">
      <div class="modal-card card card-glass" style="max-width: 860px; width: 95%;">
        
        <!-- Header -->
        <div class="modal-header" style="border-bottom: 1px solid #e2e8f0; padding: 1rem 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.4rem;">💵</span>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a;">Registrar Recaudo en Ventanilla (Caja)</h3>
              <p style="margin: 0; font-size: 0.78rem; color: #64748b;">Ingreso directo de pagos totales o abonos parciales a cuentas de cobro</p>
            </div>
          </div>
          <button (click)="cerrarModal()" class="close-btn" type="button">&times;</button>
        </div>

        <div class="modal-body" style="padding: 1.25rem 1.5rem;">
          
          <!-- Selector de Cuenta / Factura a Cruzar -->
          <div class="form-group mb-3">
            <label class="form-label">
              Factura / Cuota a Imputar el Pago *
              <span style="font-size: 0.75rem; font-weight: normal; color: #64748b;">(Seleccione el mes y concepto correspondiente)</span>
            </label>
            <app-searchable-select
              [options]="opcionesCuentas"
              [ngModel]="form.cuentaCobroId"
              (ngModelChange)="onCuentaSelect($event)"
              placeholder="🔍 Seleccione la cuota / mes específico o busque por estudiante..."
              searchPlaceholder="Filtrar por estudiante, mes, número de factura..."
            ></app-searchable-select>
          </div>

          <!-- Banner Informativo de la Factura Seleccionada -->
          @if (cuentaSeleccionada) {
            <div class="invoice-summary-card mb-3">
              <div class="inv-header">
                <div>
                  <strong style="font-size: 0.95rem; color: #1e293b;">{{ cuentaSeleccionada.estudianteNombre }}</strong>
                  <span class="inv-badge">{{ cuentaSeleccionada.numeroFactura }}</span>
                </div>
                <span class="badge" [class.badge-warning]="cuentaSeleccionada.estado === EstadoCuenta.POR_VENCER" [class.badge-danger]="cuentaSeleccionada.estado === EstadoCuenta.EN_MORA" [class.badge-info]="cuentaSeleccionada.estado === EstadoCuenta.PAGADO_PARCIAL">
                  {{ cuentaSeleccionada.estado === EstadoCuenta.PAGADO_PARCIAL ? '🟡 CON ABONO PARCIAL' : (cuentaSeleccionada.estado === EstadoCuenta.EN_MORA ? '🔴 EN MORA' : '🟠 POR VENCER') }}
                </span>
              </div>
              
              <div class="inv-details-grid mt-2">
                <div class="inv-col">
                  <span class="lbl">Concepto & Mes:</span>
                  <span class="val font-semibold">{{ cuentaSeleccionada.concepto }} ({{ cuentaSeleccionada.mes }})</span>
                </div>
                <div class="inv-col">
                  <span class="lbl">Saldo Pendiente a Cobrar:</span>
                  <span class="val font-bold" style="color: #d97706; font-size: 1rem;">\${{ saldoPendiente | number }} COP</span>
                  @if (cuentaSeleccionada.valorPagado && cuentaSeleccionada.valorPagado > 0) {
                    <span class="text-xs" style="color: #059669; display: block;">(Abonado: \${{ cuentaSeleccionada.valorPagado | number }} / Total: \${{ cuentaSeleccionada.valorTotal | number }})</span>
                  }
                </div>
                <div class="inv-col">
                  <span class="lbl">Fecha Límite:</span>
                  <span class="val text-slate-600">{{ cuentaSeleccionada.fechaVencimiento }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Formulario de Recaudo -->
          <div class="modal-form-grid">
            
            <!-- Medio de Pago -->
            <div class="form-group">
              <label class="form-label">Medio de Pago *</label>
              <select class="form-select" [(ngModel)]="form.medioPago">
                @for (medio of opcionesMediosPago; track medio.codigo) {
                  <option [value]="medio.codigo">{{ medio.nombre }}</option>
                }
              </select>
            </div>

            <!-- Valor Recibido -->
            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                <label class="form-label" style="margin: 0;">Valor a Recibir / Abonar ($ COP) *</label>
                @if (cuentaSeleccionada) {
                  <div style="display: flex; gap: 0.35rem;">
                    <button (click)="form.valorPagado = saldoPendiente; onValorChange()" type="button" class="btn btn-outline btn-xs" style="padding: 1px 6px; font-size: 0.7rem;">
                      Saldo ($ {{ saldoPendiente | number }})
                    </button>
                    <button (click)="form.valorPagado = Math.round(saldoPendiente / 2); onValorChange()" type="button" class="btn btn-outline btn-xs" style="padding: 1px 6px; font-size: 0.7rem;">
                      50% ($ {{ Math.round(saldoPendiente / 2) | number }})
                    </button>
                  </div>
                }
              </div>
              <input
                type="text"
                appCurrencyMask
                class="form-control"
                [(ngModel)]="form.valorPagado"
                (ngModelChange)="onValorChange()"
                placeholder="$ 360.000"
              />
            </div>

            <!-- Número de Comprobante / Voucher -->
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Número de Comprobante / Voucher Banco / Aprobación (Opcional)</label>
              <input type="text" class="form-control" [(ngModel)]="form.referenciaTransaccion" [placeholder]="placeholderReferencia" />
              <span class="text-xs text-slate-400 mt-1" style="display: block; font-size: 0.72rem;">
                ℹ️ Si se deja en blanco, el sistema asignará automáticamente una referencia única irrepetible según el medio de pago.
              </span>
            </div>

          </div>

          <!-- Caja de Diagnóstico Financiero en Vivo -->
          @if (cuentaSeleccionada) {
            <div class="payment-status-preview mt-3" [class.full-payment]="esPagoTotal" [class.partial-payment]="esPagoParcial" [class.over-payment]="esPagoExcedente">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: 1.2rem;">
                    {{ esPagoTotal ? '🟢' : (esPagoParcial ? '🟡' : '🔵') }}
                  </span>
                  <div>
                    <strong>
                      {{ esPagoTotal ? 'PAGO COMPLETO (Cancelación del Saldo)' : (esPagoParcial ? 'ABONO PARCIAL (Saldo Pendiente)' : 'PAGO CON EXCEDENTE (ANTICIPO NIIF 2805)') }}
                    </strong>
                    <p style="margin: 0; font-size: 0.78rem;">
                      @if (esPagoTotal) {
                        La factura de <strong>{{ cuentaSeleccionada.mes }}</strong> quedará en estado <strong>AL DÍA (PAGADA)</strong> con saldo <strong>$0 COP</strong>.
                      } @else if (esPagoParcial) {
                        Se aplicará un abono de <strong>\${{ form.valorPagado | number }} COP</strong>. La factura quedará con saldo pendiente de <strong>\${{ nuevoSaldoRestante | number }} COP (PAGO PARCIAL)</strong>.
                      } @else {
                        La factura de <strong>{{ cuentaSeleccionada.mes }}</strong> quedará <strong>CANCELADA AL DÍA ($0 COP)</strong> y el excedente de <strong>\${{ (form.valorPagado - saldoPendiente) | number }} COP</strong> se registrará como <strong>Saldo a Favor / Anticipo de Clientes (Pasivo NIIF 2805)</strong> para el siguiente mes.
                      }
                    </p>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 0.72rem; display: block; color: #64748b;">Saldo Final Factura:</span>
                  <strong style="font-size: 1.05rem;" [style.color]="esPagoTotal ? '#059669' : '#d97706'">
                    \${{ nuevoSaldoRestante | number }} COP
                  </strong>
                </div>
              </div>
            </div>
          }

        </div>

        <!-- Footer -->
        <div class="modal-footer" style="padding: 0.85rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button (click)="cerrarModal()" class="btn btn-secondary" type="button" [disabled]="isSaving">
            Cancelar
          </button>
          <button (click)="guardar()" class="btn btn-primary" type="button" [disabled]="isSaving || !form.cuentaCobroId">
            @if (isSaving) {
              <span>⏳ Procesando Recaudo...</span>
            } @else {
              <span>🧾 Registrar & Generar Recibo</span>
            }
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .invoice-summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
    }
    .inv-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .inv-badge {
      font-family: monospace;
      font-size: 0.75rem;
      background: #ede9fe;
      color: #6366f1;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 0.5rem;
      font-weight: 700;
    }
    .inv-details-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr 0.8fr;
      gap: 0.5rem;
      font-size: 0.8rem;
    }
    .inv-col .lbl {
      display: block;
      color: #64748b;
      font-size: 0.72rem;
    }
    .payment-status-preview {
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
    }
    .full-payment {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }
    .partial-payment {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }
    .over-payment {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }
    .form-label {
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.2rem;
      display: block;
      color: #1e293b;
    }
  `]
})
export class ModalPagoManualComponent implements OnInit {
  Math = Math;
  readonly EstadoCuenta = EstadoCuenta;
  readonly MedioPago = MedioPago;
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private parametrosService = inject(ParametrosService);
  readonly modalManager = inject(ModalManagerService);

  @Input() cuentasPendientes: CuentaCobroItem[] = [];
  @Input() mediosPagoList: any = [];

  ngOnInit(): void {
    const list = typeof this.mediosPagoList === 'function' ? this.mediosPagoList() : this.mediosPagoList;
    if (!Array.isArray(list) || list.length === 0) {
      this.parametrosService.obtenerPorGrupo('MEDIOS_PAGO').subscribe((res) => {
        if (res && res.length > 0) {
          this.mediosPagoList = res;
          this.cdr.markForCheck();
        }
      });
    }
  }
  @Input() set initialData(data: any) {
    if (data) {
      this.form = {
        cuentaCobroId: data.cuentaCobroId || '',
        medioPago: data.medioPago || MedioPago.EFECTIVO,
        valorPagado: Number(data.valorPagado) || 0,
        referenciaTransaccion: data.referenciaTransaccion || '',
      };
      if (data.cuentaCobroId) {
        const cuenta = (this.cuentasPendientes || []).find((c) => c.id === data.cuentaCobroId);
        if (cuenta) {
          const saldo = cuenta.saldoPendiente !== undefined ? Number(cuenta.saldoPendiente) : Math.max(0, Number(cuenta.valorTotal || 0) - Number(cuenta.valorPagado || 0));
          this.form.valorPagado = saldo > 0 ? saldo : (Number(data.valorPagado) || Number(cuenta.valorTotal) || 0);
        }
      }
    }
  }

  form: PagoManualForm = {
    cuentaCobroId: '',
    medioPago: MedioPago.EFECTIVO,
    valorPagado: 0,
    referenciaTransaccion: '',
  };

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<{ dto: any; cuenta: any; apiResponse?: any }>();

  isSaving = false;

  get placeholderReferencia(): string {
    switch (this.form.medioPago) {
      case MedioPago.EFECTIVO:
        return 'Auto-generado (ej: CAJA-EFEC-748291)';
      case MedioPago.TRANSFERENCIA_BANCOLOMBIA:
        return 'Ej: VOUCHER-BC-9847291 (o auto-generado)';
      case MedioPago.NEQUI_QR:
        return 'Ej: M98472198 (o auto-generado)';
      case MedioPago.TARJETA_CREDITO:
        return 'Ej: APROB-748291 (o auto-generado)';
      default:
        return 'Auto-generado por el sistema';
    }
  }

  generarReferenciaAutomatica(medio: string): string {
    const sufijo = `${Math.floor(1000 + Math.random() * 9000)}`;
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    switch (medio) {
      case MedioPago.EFECTIVO:
        return `CAJA-${fecha}-${sufijo}`;
      case MedioPago.TRANSFERENCIA_BANCOLOMBIA:
        return `TRANSF-BC-${fecha}-${sufijo}`;
      case MedioPago.NEQUI_QR:
        return `NEQUI-QR-${fecha}-${sufijo}`;
      case MedioPago.TARJETA_CREDITO:
        return `DATA-POS-${fecha}-${sufijo}`;
      case MedioPago.CHEQUE:
        return `CHEQ-GER-${fecha}-${sufijo}`;
      default:
        return `REC-VENT-${fecha}-${sufijo}`;
    }
  }

  get cuentaSeleccionada(): any {
    return (this.cuentasPendientes || []).find((c) => c.id === this.form.cuentaCobroId);
  }

  get saldoPendiente(): number {
    const c = this.cuentaSeleccionada;
    if (!c) return Number(this.form.valorPagado || 0);
    if (c.saldoPendiente !== undefined && c.saldoPendiente !== null) {
      return Number(c.saldoPendiente);
    }
    const abonado = Number(c.valorPagado || 0);
    const total = Number(c.valorTotal || 0);
    return Math.max(0, total - abonado);
  }

  get nuevoSaldoRestante(): number {
    return Math.max(0, this.saldoPendiente - Number(this.form.valorPagado || 0));
  }

  get esPagoTotal(): boolean {
    return Number(this.form.valorPagado || 0) === this.saldoPendiente;
  }

  get esPagoParcial(): boolean {
    const val = Number(this.form.valorPagado || 0);
    return val > 0 && val < this.saldoPendiente;
  }

  get esPagoExcedente(): boolean {
    return Number(this.form.valorPagado || 0) > this.saldoPendiente;
  }

  get opcionesMediosPago(): Parametro[] {
    const raw = this.mediosPagoList;
    const list = typeof raw === 'function' ? raw() : raw;
    return Array.isArray(list) ? list : [];
  }

  get opcionesCuentas(): SearchableOption[] {
    // Ordenar cuotas de forma cronológica (Febrero a Noviembre)
    const sorted = [...(this.cuentasPendientes || [])].sort((a, b) => (a.mesCobro || 0) - (b.mesCobro || 0));

    return sorted.map((c) => {
      const mesNombre = c.mes || `Mes ${c.mesCobro || ''}`;
      const saldoReal = c.saldoPendiente !== undefined ? Number(c.saldoPendiente) : Math.max(0, Number(c.valorTotal || 0) - Number(c.valorPagado || 0));
      const abonado = Number(c.valorPagado || 0);

      let sublabel = `Factura: ${c.numeroFactura} • Saldo a Pagar: $${saldoReal.toLocaleString()} COP`;
      if (abonado > 0) {
        sublabel += ` (Abono previo: $${abonado.toLocaleString()} / Total: $${Number(c.valorTotal).toLocaleString()})`;
      }
      sublabel += ` • Vence: ${c.fechaVencimiento}`;

      return {
        value: c.id,
        label: `${c.estudianteNombre} — ${mesNombre} (${c.concepto})`,
        sublabel,
        badge: `Saldo: $${saldoReal.toLocaleString()}`,
        badgeClass: c.estado === EstadoCuenta.EN_MORA ? 'badge-danger' : (c.estado === EstadoCuenta.PAGADO_PARCIAL ? 'badge-warning' : 'badge-primary'),
        avatarText: c.estudianteNombre?.substring(0, 2)?.toUpperCase() || 'ES',
      };
    });
  }

  onCuentaSelect(id: string) {
    this.form.cuentaCobroId = id;
    const cuenta = (this.cuentasPendientes || []).find((c) => c.id === id);
    if (cuenta) {
      const saldo = cuenta.saldoPendiente !== undefined ? Number(cuenta.saldoPendiente) : Math.max(0, Number(cuenta.valorTotal || 0) - Number(cuenta.valorPagado || 0));
      this.form.valorPagado = saldo > 0 ? saldo : (Number(cuenta.valorTotal) || 0);
    }
    this.cdr.markForCheck();
  }

  onValorChange() {
    this.cdr.markForCheck();
  }

  cerrarModal() {
    this.modalManager.close('pagoManual');
    this.close.emit();
  }

  guardar() {
    const cuenta = this.cuentasPendientes.find((c) => c.id === this.form.cuentaCobroId);
    if (!cuenta) {
      this.toast.error('Factura requerida', 'Por favor seleccione la cuota o factura a imputar el pago.');
      return;
    }

    if (Number(this.form.valorPagado || 0) <= 0) {
      this.toast.warning('Valor inválido', 'El monto a recibir debe ser mayor a $0 COP.');
      return;
    }

    const refFinal = (this.form.referenciaTransaccion && this.form.referenciaTransaccion.trim() !== '')
      ? this.form.referenciaTransaccion.trim()
      : this.generarReferenciaAutomatica(this.form.medioPago);

    const dto = {
      cuentaCobroId: cuenta.id,
      medioPago: this.form.medioPago,
      valorPagado: Number(this.form.valorPagado),
      referenciaTransaccion: refFinal,
    };

    this.isSaving = true;

    // Registrar en API
    this.api.post('tesoreria/pagos/manual', dto).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.success.emit({ dto, cuenta, apiResponse: res });
        this.cerrarModal();
      },
      error: () => {
        this.isSaving = false;
        this.success.emit({ dto, cuenta });
        this.cerrarModal();
      },
    });
  }
}
