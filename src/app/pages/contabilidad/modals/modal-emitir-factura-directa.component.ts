import { Component, inject, signal, computed, input, output, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DianService } from '../services/dian.service';
import { ContabilidadService } from '../services/contabilidad.service';
import {
  DocumentoElectronicoModel,
  EmitirFacturaDirectaModel,
  FacturaDirectaItemModel,
  Tercero,
} from '../models/contabilidad.models';

interface ItemFormRow {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  porcentajeIva: number;
  cuentaIngresoCodigo: string;
}

@Component({
  selector: 'app-modal-emitir-factura-directa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .modal-factura-directa {
      width: 95% !important;
      max-width: 960px !important;
      max-height: 92vh !important;
      overflow-y: auto;
      padding: 1.5rem !important;
      border-radius: 1rem;
      background: #ffffff;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .items-table th, .items-table td {
      padding: 0.5rem;
      font-size: 0.75rem;
    }
  `],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-factura-directa-backdrop" (click)="cancelar()">
        <div class="modal-box modal-factura-directa" data-testid="modal-factura-directa" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 text-xl font-bold shadow-sm">
                🧾
              </div>
              <div>
                <h3 class="modal-title font-bold text-lg text-slate-800" data-testid="modal-factura-directa-title">
                  Emitir Factura Electrónica Directa (UBL 2.1)
                </h3>
                <p class="text-xs text-slate-500">
                  Emisión individual para venta de servicios educativos, uniformes o matrículas directas
                </p>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
              (click)="cancelar()"
              data-testid="btn-close-factura-directa"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body space-y-4">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-center justify-between" data-testid="alert-error-factura-directa">
                <span>⚠️ {{ errorMensaje() }}</span>
                <button type="button" class="text-red-700 font-bold" (click)="errorMensaje.set(null)">✕</button>
              </div>
            }

            <!-- 1. Datos del Adquiriente / Cliente -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>👤</span> 1. Datos del Adquiriente / Cliente
              </h4>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="form-group flex flex-col gap-1">
                  <label class="text-xs font-semibold text-slate-600">Seleccionar Tercero Existente</label>
                  <select
                    class="input-base text-xs"
                    data-testid="select-tercero-factura-directa"
                    [ngModel]="terceroSeleccionadoId()"
                    (ngModelChange)="onTerceroSelect($event)"
                  >
                    <option value="">-- Manual / Sin seleccionar --</option>
                    @for (t of terceros(); track t.id) {
                      <option [value]="t.id">
                        {{ t.nombreCompleto || t.razonSocial || (t.primerNombre + ' ' + t.primerApellido) }} ({{ t.numeroIdentificacion || t.numeroDocumento }})
                      </option>
                    }
                  </select>
                </div>

                <div class="form-group flex flex-col gap-1">
                  <label class="text-xs font-semibold text-slate-600">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    class="input-base text-xs"
                    data-testid="input-cliente-nombre"
                    placeholder="Nombre completo del cliente o acudiente"
                    [ngModel]="clienteNombre()"
                    (ngModelChange)="clienteNombre.set($event)"
                  />
                </div>

                <div class="form-group flex flex-col gap-1">
                  <label class="text-xs font-semibold text-slate-600">Número de Identificación (NIT/CC) *</label>
                  <input
                    type="text"
                    class="input-base text-xs font-mono"
                    data-testid="input-cliente-documento"
                    placeholder="1020304050"
                    [ngModel]="clienteNumeroDocumento()"
                    (ngModelChange)="clienteNumeroDocumento.set($event)"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="form-group flex flex-col gap-1">
                  <label class="text-xs font-semibold text-slate-600">Email para Facturación Electrónica</label>
                  <input
                    type="email"
                    class="input-base text-xs"
                    data-testid="input-cliente-email"
                    placeholder="cliente@ejemplo.com"
                    [ngModel]="clienteEmail()"
                    (ngModelChange)="clienteEmail.set($event)"
                  />
                </div>

                <div class="form-group flex flex-col gap-1">
                  <label class="text-xs font-semibold text-slate-600">Teléfono</label>
                  <input
                    type="text"
                    class="input-base text-xs"
                    data-testid="input-cliente-telefono"
                    placeholder="3001234567"
                    [ngModel]="clienteTelefono()"
                    (ngModelChange)="clienteTelefono.set($event)"
                  />
                </div>

                <div class="form-group flex flex-col gap-1">
                  <label class="text-xs font-semibold text-slate-600">Dirección</label>
                  <input
                    type="text"
                    class="input-base text-xs"
                    data-testid="input-cliente-direccion"
                    placeholder="Calle 123 # 45 - 67"
                    [ngModel]="clienteDireccion()"
                    (ngModelChange)="clienteDireccion.set($event)"
                  />
                </div>
              </div>
            </div>

            <!-- 2. Ítems de la Factura -->
            <div class="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📦</span> 2. Ítems y Conceptos a Facturar
                </h4>
                <button
                  type="button"
                  class="btn btn-secondary btn-xs flex items-center gap-1"
                  data-testid="btn-agregar-item-factura"
                  (click)="agregarItem()"
                >
                  <span>➕</span>
                  <span>Agregar Ítem</span>
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="items-table w-full text-left border border-slate-200 rounded-lg">
                  <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th class="w-2/5">Descripción del Servicio / Producto</th>
                      <th class="w-16 text-center">Cant.</th>
                      <th class="w-28 text-right">Precio Unit.</th>
                      <th class="w-24 text-right">Desc. ($)</th>
                      <th class="w-20 text-center">% IVA</th>
                      <th class="w-28 text-right">Total</th>
                      <th class="w-10 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (item of items(); track $index) {
                      <tr [attr.data-testid]="'row-item-' + $index">
                        <td>
                          <input
                            type="text"
                            class="input-base text-xs w-full"
                            [attr.data-testid]="'input-item-desc-' + $index"
                            placeholder="Ej: Mensualidad Grado Décimo"
                            [ngModel]="item.descripcion"
                            (ngModelChange)="actualizarItem($index, 'descripcion', $event)"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            class="input-base text-xs w-full text-center"
                            [attr.data-testid]="'input-item-cant-' + $index"
                            [ngModel]="item.cantidad"
                            (ngModelChange)="actualizarItem($index, 'cantidad', +$event)"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            class="input-base text-xs w-full text-right font-mono"
                            [attr.data-testid]="'input-item-precio-' + $index"
                            [ngModel]="item.precioUnitario"
                            (ngModelChange)="actualizarItem($index, 'precioUnitario', +$event)"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            class="input-base text-xs w-full text-right font-mono"
                            [attr.data-testid]="'input-item-descuento-' + $index"
                            [ngModel]="item.descuento"
                            (ngModelChange)="actualizarItem($index, 'descuento', +$event)"
                          />
                        </td>
                        <td>
                          <select
                            class="input-base text-xs w-full text-center"
                            [attr.data-testid]="'select-item-iva-' + $index"
                            [ngModel]="item.porcentajeIva"
                            (ngModelChange)="actualizarItem($index, 'porcentajeIva', +$event)"
                          >
                            <option [value]="0">0% (Excluido)</option>
                            <option [value]="5">5%</option>
                            <option [value]="19">19%</option>
                          </select>
                        </td>
                        <td class="text-right font-mono font-bold text-slate-800" [attr.data-testid]="'total-item-' + $index">
                          \${{ calcularTotalLinea(item) | number:'1.0-0' }}
                        </td>
                        <td class="text-center">
                          <button
                            type="button"
                            class="text-red-500 hover:text-red-700 font-bold p-1 disabled:opacity-30"
                            [attr.data-testid]="'btn-eliminar-item-' + $index"
                            [disabled]="items().length <= 1"
                            (click)="eliminarItem($index)"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 3. Totales y Parámetros Adicionales -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div class="space-y-3">
                <div class="form-group flex flex-col gap-1">
                  <label class="text-xs font-semibold text-slate-600">Observaciones en la Factura</label>
                  <textarea
                    class="input-base text-xs h-16"
                    data-testid="textarea-factura-observaciones"
                    placeholder="Notas para el cliente o detalles normativos..."
                    [ngModel]="observaciones()"
                    (ngModelChange)="observaciones.set($event)"
                  ></textarea>
                </div>

                <div class="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-send-dian"
                    class="w-4 h-4 text-indigo-600 rounded"
                    data-testid="chk-send-to-dian"
                    [ngModel]="sendToDian()"
                    (ngModelChange)="sendToDian.set($event)"
                  />
                  <label for="chk-send-dian" class="text-xs font-semibold text-slate-700 cursor-pointer">
                    Firmar digitalmente y transmitir a la DIAN en tiempo real
                  </label>
                </div>
              </div>

              <!-- Resumen de Liquidación -->
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div class="flex justify-between text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span class="font-mono font-semibold" data-testid="factura-resumen-subtotal">\${{ subtotalCalculado() | number:'1.0-0' }} COP</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Total Descuentos:</span>
                  <span class="font-mono font-semibold text-amber-700" data-testid="factura-resumen-descuento">-\${{ descuentosCalculados() | number:'1.0-0' }} COP</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Total IVA:</span>
                  <span class="font-mono font-semibold" data-testid="factura-resumen-iva">\${{ ivaCalculado() | number:'1.0-0' }} COP</span>
                </div>
                <div class="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total Factura (COP):</span>
                  <span class="text-base text-indigo-700 font-mono" data-testid="factura-resumen-total">
                    \${{ totalCalculado() | number:'1.0-0' }} COP
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="modal-footer flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              data-testid="btn-cancelar-factura-directa"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm flex items-center gap-2 font-semibold shadow-sm"
              data-testid="btn-confirmar-factura-directa"
              [disabled]="guardando()"
              (click)="emitir()"
            >
              @if (guardando()) {
                <span class="animate-spin text-xs">⏳</span>
                <span>Procesando y Transmitiendo...</span>
              } @else {
                <span>🚀</span>
                <span>Emitir Factura Electrónica</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalEmitirFacturaDirectaComponent implements OnInit {
  private readonly dianService = inject(DianService);
  private readonly contabilidadService = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly cerrar = output<void>();
  readonly emitido = output<DocumentoElectronicoModel>();

  readonly terceros = signal<Tercero[]>([]);
  readonly terceroSeleccionadoId = signal<string>('');

  readonly clienteNombre = signal<string>('');
  readonly clienteNumeroDocumento = signal<string>('');
  readonly clienteTipoDocumento = signal<string>('CC');
  readonly clienteEmail = signal<string>('');
  readonly clienteTelefono = signal<string>('');
  readonly clienteDireccion = signal<string>('');
  readonly observaciones = signal<string>('');
  readonly sendToDian = signal<boolean>(true);

  readonly items = signal<ItemFormRow[]>([
    {
      descripcion: 'Servicio Educativo / Colegiatura Mensual',
      cantidad: 1,
      precioUnitario: 350000,
      descuento: 0,
      porcentajeIva: 0,
      cuentaIngresoCodigo: '416005',
    },
  ]);

  readonly guardando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  // Cálculos reactivos
  readonly subtotalCalculado = computed(() => {
    return this.items().reduce((acc, it) => acc + (Number(it.cantidad || 0) * Number(it.precioUnitario || 0)), 0);
  });

  readonly descuentosCalculados = computed(() => {
    return this.items().reduce((acc, it) => acc + Number(it.descuento || 0), 0);
  });

  readonly ivaCalculado = computed(() => {
    return this.items().reduce((acc, it) => {
      const base = Math.max(0, (Number(it.cantidad || 0) * Number(it.precioUnitario || 0)) - Number(it.descuento || 0));
      return acc + (base * (Number(it.porcentajeIva || 0) / 100));
    }, 0);
  });

  readonly totalCalculado = computed(() => {
    return Math.max(0, this.subtotalCalculado() - this.descuentosCalculados() + this.ivaCalculado());
  });

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
      next: (list) => this.terceros.set(list || []),
      error: () => {},
    });
  }

  onTerceroSelect(id: string): void {
    this.terceroSeleccionadoId.set(id);
    const found = this.terceros().find((t) => t.id === id);
    if (found) {
      this.clienteNombre.set(found.nombreCompleto || found.razonSocial || `${found.primerNombre || ''} ${found.primerApellido || ''}`.trim());
      this.clienteNumeroDocumento.set(found.numeroIdentificacion || found.numeroDocumento || '');
      this.clienteTipoDocumento.set(found.tipoIdentificacion || found.tipoDocumento || 'CC');
      this.clienteEmail.set(found.email || '');
      this.clienteTelefono.set(found.telefono || '');
    }
  }

  agregarItem(): void {
    this.items.update((prev) => [
      ...prev,
      {
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        descuento: 0,
        porcentajeIva: 0,
        cuentaIngresoCodigo: '416005',
      },
    ]);
  }

  eliminarItem(index: number): void {
    if (this.items().length > 1) {
      this.items.update((prev) => prev.filter((_, i) => i !== index));
    }
  }

  actualizarItem(index: number, field: keyof ItemFormRow, value: any): void {
    this.items.update((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  calcularTotalLinea(item: ItemFormRow): number {
    const sub = Number(item.cantidad || 0) * Number(item.precioUnitario || 0);
    const desc = Number(item.descuento || 0);
    const base = Math.max(0, sub - desc);
    const iva = base * (Number(item.porcentajeIva || 0) / 100);
    return base + iva;
  }

  emitir(): void {
    if (!this.clienteNombre().trim() || !this.clienteNumeroDocumento().trim()) {
      this.errorMensaje.set('Debe ingresar el Nombre y Número de Documento del Adquiriente.');
      return;
    }

    if (this.items().length === 0 || this.items().some((i) => !i.descripcion.trim() || Number(i.precioUnitario) <= 0)) {
      this.errorMensaje.set('Todos los ítems deben tener descripción válida y precio unitario mayor a cero.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const payload: EmitirFacturaDirectaModel = {
      sendToDian: this.sendToDian(),
      terceroId: this.terceroSeleccionadoId() || 'tercero-directo',
      clienteNombre: this.clienteNombre().trim(),
      clienteNumeroDocumento: this.clienteNumeroDocumento().trim(),
      clienteTipoDocumento: this.clienteTipoDocumento(),
      clienteEmail: this.clienteEmail().trim() || undefined,
      clienteTelefono: this.clienteTelefono().trim() || undefined,
      clienteDireccion: this.clienteDireccion().trim() || undefined,
      observaciones: this.observaciones().trim() || undefined,
      items: this.items().map((it) => ({
        concepto: it.descripcion.trim(),
        descripcion: it.descripcion.trim(),
        cantidad: Number(it.cantidad || 1),
        valorUnitario: Number(it.precioUnitario || 0),
        precioUnitario: Number(it.precioUnitario || 0),
        descuento: Number(it.descuento || 0),
        porcentajeIva: Number(it.porcentajeIva || 0),
        cuentaIngresoCodigo: it.cuentaIngresoCodigo || '416005',
      })),
    };

    this.dianService.emitirFacturaDirecta(payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.emitido.emit(res.documento);
        this.cerrar.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err.error?.message || err.message || 'Error emitiendo factura directa');
      },
    });
  }

  cancelar(): void {
    this.cerrar.emit();
  }
}
