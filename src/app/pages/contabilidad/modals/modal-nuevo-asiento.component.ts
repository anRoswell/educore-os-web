import { Component, OnInit, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { Asiento, AsientoLineaForm, TipoComprobante, PucCuenta, Tercero } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-nuevo-asiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-nuevo-asiento-backdrop" (click)="cancelar()">
        <div class="modal-box w-[820px]" data-testid="modal-nuevo-asiento" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b">
            <h3 class="modal-title font-bold text-lg text-gray-800" data-testid="modal-nuevo-asiento-title">
              Nuevo Comprobante Manual
            </h3>
            <span class="badge-mini" [class.badge-green]="isBalanced()" [class.badge-red]="!isBalanced()" data-testid="badge-balance-asiento">
              {{ isBalanced() ? 'Partida Doble Balanceada' : 'Descuadrado' }}
            </span>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2" data-testid="alert-error-nuevo-asiento">
                {{ errorMensaje() }}
              </div>
            }

            <div class="grid grid-cols-3 gap-3">
              <div class="form-group">
                <label class="form-label text-xs font-semibold">Tipo *</label>
                <select
                  class="input-base"
                  data-testid="input-nuevo-asiento-tipo"
                  [ngModel]="tipoComprobante()"
                  (ngModelChange)="tipoComprobante.set($event)"
                >
                  <option value="CAU">CAU — Causación</option>
                  <option value="ING">ING — Ingreso</option>
                  <option value="EGR">EGR — Egreso</option>
                  <option value="AJU">AJU — Ajuste</option>
                  <option value="NOT">NOT — Nota</option>
                  <option value="CIER">CIER — Cierre</option>
                  <option value="APE">APE — Apertura</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label text-xs font-semibold">Fecha *</label>
                <input
                  class="input-base"
                  type="date"
                  data-testid="input-nuevo-asiento-fecha"
                  [ngModel]="fechaContable()"
                  (ngModelChange)="fechaContable.set($event)"
                />
              </div>

              <div class="form-group">
                <label class="form-label text-xs font-semibold">Concepto</label>
                <input
                  class="input-base"
                  data-testid="input-nuevo-asiento-concepto"
                  [ngModel]="concepto()"
                  (ngModelChange)="concepto.set($event)"
                  placeholder="Descripción del asiento"
                />
              </div>
            </div>

            <!-- Tabla de líneas de asiento -->
            <div class="border rounded-md overflow-hidden">
              <div class="overflow-auto max-h-60">
                <table class="tabla-datos w-full text-xs">
                  <thead class="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th class="w-40 text-left py-2 px-3">Código PUC</th>
                      <th class="text-left py-2 px-3">Descripción</th>
                      <th class="w-32 text-right py-2 px-3">Débito</th>
                      <th class="w-32 text-right py-2 px-3">Crédito</th>
                      <th class="w-12 text-center py-2 px-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (linea of lineas(); track $index; let i = $index) {
                      <tr class="border-b hover:bg-gray-50/50">
                        <td class="p-2">
                          <input
                            class="input-base input-sm w-full font-mono"
                            [attr.data-testid]="'input-linea-cuenta-' + i"
                            [ngModel]="linea.cuentaCodigo"
                            (ngModelChange)="actualizarLineaCodigo(i, $event)"
                            placeholder="ej: 110505"
                          />
                        </td>
                        <td class="p-2">
                          <input
                            class="input-base input-sm w-full"
                            [attr.data-testid]="'input-linea-desc-' + i"
                            [ngModel]="linea.descripcion"
                            (ngModelChange)="actualizarLineaDesc(i, $event)"
                            placeholder="Descripción"
                          />
                        </td>
                        <td class="p-2">
                          <input
                            class="input-base input-sm w-full text-right font-mono"
                            type="number"
                            step="0.01"
                            [attr.data-testid]="'input-linea-debito-' + i"
                            [ngModel]="linea.debito"
                            (ngModelChange)="actualizarLineaDebito(i, $event)"
                            placeholder="0.00"
                          />
                        </td>
                        <td class="p-2">
                          <input
                            class="input-base input-sm w-full text-right font-mono"
                            type="number"
                            step="0.01"
                            [attr.data-testid]="'input-linea-credito-' + i"
                            [ngModel]="linea.credito"
                            (ngModelChange)="actualizarLineaCredito(i, $event)"
                            placeholder="0.00"
                          />
                        </td>
                        <td class="p-2 text-center">
                          <button
                            type="button"
                            class="btn-icon text-red-500 hover:text-red-700 text-xs"
                            [attr.data-testid]="'btn-eliminar-linea-' + i"
                            (click)="quitarLinea(i)"
                            title="Eliminar fila"
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

            <!-- Controles y Totales en tiempo real -->
            <div class="flex items-center justify-between pt-1">
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-agregar-linea-asiento"
                (click)="agregarLinea()"
              >
                + Agregar Línea
              </button>
              <div class="text-xs font-mono space-x-4 flex items-center">
                <span>Débito: <strong>{{ totalDebito() | number:'1.2-2' }}</strong></span>
                <span>Crédito: <strong>{{ totalCredito() | number:'1.2-2' }}</strong></span>
                <span
                  class="px-2 py-1 rounded font-bold"
                  [class.text-green-600]="isBalanced()"
                  [class.text-red-500]="!isBalanced()"
                  [class.bg-green-50]="isBalanced()"
                  [class.bg-red-50]="!isBalanced()"
                >
                  {{ isBalanced() ? '✓ Cuadra' : '✗ Descuadrado (' + (diferencia() | number:'1.2-2') + ')' }}
                </span>
              </div>
            </div>
          </div>

          <div class="modal-actions flex justify-end gap-2 pt-4 border-t mt-4">
            <button
              type="button"
              class="btn-secondary"
              data-testid="btn-cancelar-nuevo-asiento"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-primary"
              data-testid="btn-guardar-nuevo-asiento"
              [disabled]="!puedeGuardar() || guardando()"
              (click)="guardar()"
            >
              {{ guardando() ? 'Guardando...' : 'Registrar Asiento' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalNuevoAsientoComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly visible = input<boolean>(false);
  readonly closeModal = output<void>();
  readonly asientoCreado = output<Asiento>();

  readonly tipoComprobante = signal<TipoComprobante>('AJU');
  readonly fechaContable = signal<string>(new Date().toISOString().split('T')[0]);
  readonly concepto = signal<string>('');
  readonly guardando = signal<boolean>(false);
  readonly errorMensaje = signal<string>('');
  readonly lineas = signal<AsientoLineaForm[]>([
    this.crearLineaVacia(),
    this.crearLineaVacia(),
  ]);

  // Computed signals para balance de partida doble
  readonly totalDebito = computed(() => {
    return Math.round(this.lineas().reduce((sum, l) => sum + (Number(l.debito) || 0), 0) * 100) / 100;
  });

  readonly totalCredito = computed(() => {
    return Math.round(this.lineas().reduce((sum, l) => sum + (Number(l.credito) || 0), 0) * 100) / 100;
  });

  readonly diferencia = computed(() => {
    return Math.round((this.totalDebito() - this.totalCredito()) * 100) / 100;
  });

  readonly isBalanced = computed(() => {
    return Math.abs(this.diferencia()) < 0.01 && this.totalDebito() > 0;
  });

  readonly puedeGuardar = computed(() => {
    return (
      this.isBalanced() &&
      this.lineas().length >= 2 &&
      this.fechaContable().length >= 8 &&
      !this.guardando()
    );
  });

  ngOnInit(): void {
    this.reiniciarFormulario();
  }

  reiniciarFormulario(): void {
    this.tipoComprobante.set('AJU');
    this.fechaContable.set(new Date().toISOString().split('T')[0]);
    this.concepto.set('');
    this.errorMensaje.set('');
    this.lineas.set([this.crearLineaVacia(), this.crearLineaVacia()]);
  }

  agregarLinea(): void {
    this.lineas.update((actual) => [...actual, this.crearLineaVacia()]);
  }

  quitarLinea(index: number): void {
    this.lineas.update((actual) => {
      const copia = [...actual];
      copia.splice(index, 1);
      return copia;
    });
  }

  actualizarLineaCodigo(index: number, codigo: string): void {
    this.lineas.update((actual) => {
      const copia = [...actual];
      copia[index] = { ...copia[index], cuentaCodigo: codigo, cuentaPucId: codigo };
      return copia;
    });
  }

  actualizarLineaDesc(index: number, desc: string): void {
    this.lineas.update((actual) => {
      const copia = [...actual];
      copia[index] = { ...copia[index], descripcion: desc };
      return copia;
    });
  }

  actualizarLineaDebito(index: number, valor: number | null): void {
    this.lineas.update((actual) => {
      const copia = [...actual];
      const numVal = valor !== null && valor !== undefined ? Number(valor) : null;
      // Regla de no-unilateralidad: si entra débito, crédito es 0
      copia[index] = {
        ...copia[index],
        debito: numVal,
        credito: numVal && numVal > 0 ? 0 : copia[index].credito,
      };
      return copia;
    });
  }

  actualizarLineaCredito(index: number, valor: number | null): void {
    this.lineas.update((actual) => {
      const copia = [...actual];
      const numVal = valor !== null && valor !== undefined ? Number(valor) : null;
      // Regla de no-unilateralidad: si entra crédito, débito es 0
      copia[index] = {
        ...copia[index],
        credito: numVal,
        debito: numVal && numVal > 0 ? 0 : copia[index].debito,
      };
      return copia;
    });
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;
    this.guardando.set(true);
    this.errorMensaje.set('');

    const payload = {
      tipoComprobante: this.tipoComprobante(),
      fechaContable: this.fechaContable(),
      concepto: this.concepto().trim() || `${this.tipoComprobante()} Manual`,
      lineas: this.lineas().map((l, idx) => ({
        lineaNumero: idx + 1,
        cuentaPucId: l.cuentaPucId || l.cuentaCodigo,
        cuentaCodigo: l.cuentaCodigo,
        descripcion: l.descripcion || this.concepto() || '',
        debito: Number(l.debito) || 0,
        credito: Number(l.credito) || 0,
        terceroId: l.terceroId,
        centroCostoId: l.centroCostoId,
      })),
    };

    this.svc.crearAsiento(payload).subscribe({
      next: (creado) => {
        this.guardando.set(false);
        this.asientoCreado.emit(creado);
        this.reiniciarFormulario();
        this.closeModal.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        const detalle = err?.error?.message || err?.message || 'Error al registrar el comprobante';
        this.errorMensaje.set(Array.isArray(detalle) ? detalle.join(', ') : detalle);
      },
    });
  }

  cancelar(): void {
    this.reiniciarFormulario();
    this.closeModal.emit();
  }

  private crearLineaVacia(): AsientoLineaForm {
    return {
      cuentaPucId: '',
      cuentaCodigo: '',
      cuentaNombre: '',
      descripcion: '',
      debito: null,
      credito: null,
    };
  }
}
