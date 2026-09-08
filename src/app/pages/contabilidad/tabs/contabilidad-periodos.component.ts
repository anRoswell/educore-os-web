import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { PeriodoContable, EstadoPeriodo } from '../models/contabilidad.models';
import { ModalCerrarPeriodoComponent } from '../modals/modal-cerrar-periodo.component';
import { ModalCierreAnualComponent } from '../modals/modal-cierre-anual.component';

@Component({
  selector: 'app-contabilidad-periodos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCerrarPeriodoComponent, ModalCierreAnualComponent],
  template: `
    <div class="tab-content" data-testid="tab-content-periodos">
      <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 class="font-semibold text-gray-800 text-base" data-testid="periodos-titulo">
            Periodos Contables Fiscales
          </h3>
          <p class="text-xs text-gray-500">
            Controle la apertura, bloqueo y cierre de los meses contables del colegio.
          </p>
        </div>
        <div class="flex items-end gap-2.5 flex-wrap">
          <div class="form-group-inline">
            <label class="form-label-sm">Año Fiscal</label>
            <select
              class="input-base input-sm w-select-year"
              data-testid="select-anio-periodos"
              [ngModel]="anioSeleccionado()"
              (ngModelChange)="onAnioChange($event)"
            >
              @for (a of aniosDisponibles; track a) {
                <option [value]="a">{{ a }}</option>
              }
            </select>
          </div>
          <button
            type="button"
            class="btn-primary btn-sm"
            data-testid="btn-abrir-periodo"
            (click)="abrirModalNuevoPeriodo()"
          >
            + Abrir Nuevo Periodo
          </button>
          <button
            type="button"
            class="btn-secondary btn-sm flex items-center gap-1 text-purple-800 bg-purple-50 border-purple-200 hover:bg-purple-100"
            data-testid="btn-cierre-periodo13"
            (click)="modalCierreAnual.set(true)"
          >
            <span>🏛️</span>
            <span>Cierre Fiscal Periodo 13</span>
          </button>
        </div>
      </div>

      @if (cargando()) {
        <div class="flex justify-center py-10" data-testid="periodos-loading-spinner">
          <div class="spinner"></div>
        </div>
      } @else {
        <div class="tabla-base overflow-auto" data-testid="tabla-periodos-container">
          <table class="tabla-datos w-full text-xs" data-testid="tabla-periodos">
            <thead>
              <tr>
                <th class="w-24 py-2 px-3">Año</th>
                <th class="py-2 px-3">Mes</th>
                <th class="text-center w-28 py-2 px-3">Estado</th>
                <th class="py-2 px-3">Apertura</th>
                <th class="py-2 px-3">Cierre</th>
                <th class="text-center w-36 py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of periodos(); track p.id) {
                <tr class="border-b hover:bg-gray-50/50" [attr.data-testid]="'row-periodo-' + p.id">
                  <td class="font-semibold py-2 px-3">{{ p.anio }}</td>
                  <td class="py-2 px-3 font-medium text-gray-800">{{ nombreMes(p.mes) }}</td>
                  <td class="text-center py-2 px-3">
                    <span [class]="badgePeriodo(p.estado)">{{ p.estado }}</span>
                  </td>
                  <td class="text-xs py-2 px-3 text-gray-600 font-mono">
                    {{ p.fechaApertura ? (p.fechaApertura | date:'dd/MM/yyyy') : '—' }}
                  </td>
                  <td class="text-xs py-2 px-3 text-gray-600 font-mono">
                    {{ p.fechaCierre ? (p.fechaCierre | date:'dd/MM/yyyy') : '—' }}
                  </td>
                  <td class="text-center py-2 px-3 whitespace-nowrap">
                    <div class="flex flex-row gap-1.5 justify-center items-center whitespace-nowrap">
                      @if (p.estado === 'ABIERTO') {
                        <button
                          type="button"
                          class="btn-icon text-yellow-600 hover:text-yellow-800"
                          title="Bloquear periodo"
                          [attr.data-testid]="'btn-bloquear-periodo-' + p.id"
                          (click)="bloquear(p)"
                        >
                          🔒
                        </button>
                        <button
                          type="button"
                          class="btn-icon text-red-600 hover:text-red-800"
                          title="Cerrar periodo definitivamente"
                          [attr.data-testid]="'btn-cerrar-periodo-' + p.id"
                          (click)="abrirModalCierre(p)"
                        >
                          ⊘
                        </button>
                      }
                      @if (p.estado === 'BLOQUEADO') {
                        <button
                          type="button"
                          class="btn-icon text-green-600 hover:text-green-800"
                          title="Reabrir periodo"
                          [attr.data-testid]="'btn-reabrir-periodo-' + p.id"
                          (click)="reabrir(p)"
                        >
                          🔓
                        </button>
                        <button
                          type="button"
                          class="btn-icon text-red-600 hover:text-red-800"
                          title="Cerrar periodo definitivamente"
                          [attr.data-testid]="'btn-cerrar-periodo-' + p.id"
                          (click)="abrirModalCierre(p)"
                        >
                          ⊘
                        </button>
                      }
                      @if (p.estado === 'CERRADO') {
                        <button
                          type="button"
                          class="btn-icon text-blue-600 hover:text-blue-800"
                          title="Reabrir periodo"
                          [attr.data-testid]="'btn-reabrir-periodo-' + p.id"
                          (click)="reabrir(p)"
                        >
                          🔓
                        </button>
                        <span class="text-gray-400 text-xs italic">Cerrado</span>
                      }
                    </div>
                  </td>
                </tr>
              }
              @if (periodos().length === 0) {
                <tr class="empty-row">
                  <td colspan="6" class="text-center py-8 text-gray-400">
                    No hay periodos configurados para el año seleccionado.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal: Abrir Nuevo Periodo -->
      @if (modalNuevo()) {
        <div class="modal-backdrop" data-testid="modal-abrir-periodo-backdrop" (click)="cerrarModales()">
          <div class="modal-box w-[460px]" data-testid="modal-abrir-periodo" (click)="$event.stopPropagation()">
            <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg shadow-xs">
                  📅
                </div>
                <div>
                  <h3 class="modal-title font-bold text-lg text-slate-800 tracking-tight" data-testid="modal-abrir-periodo-title">
                    Abrir Nuevo Periodo Contable
                  </h3>
                  <span class="text-xs text-slate-400 block">Habilita el registro de transacciones contables para el mes</span>
                </div>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base transition-colors"
                (click)="cerrarModales()"
              >
                ✕
              </button>
            </div>

            <div class="modal-body space-y-4 pt-3">
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-slate-700">Año Fiscal *</label>
                <input
                  class="input-base w-full text-xs"
                  data-testid="input-anio-periodo"
                  type="number"
                  [(ngModel)]="formNuevo.anio"
                  [min]="2020"
                  [max]="2099"
                />
              </div>
              <div class="form-group flex flex-col items-start gap-1">
                <label class="form-label text-xs font-semibold text-slate-700">Mes *</label>
                <select
                  class="input-base w-full text-xs"
                  data-testid="select-mes-periodo"
                  [(ngModel)]="formNuevo.mes"
                >
                  @for (m of meses; track m.valor) {
                    <option [value]="m.valor">{{ m.nombre }}</option>
                  }
                </select>
              </div>
              <div class="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 flex items-start gap-2">
                <span class="text-sm">⚠️</span>
                <span>Asegúrese de que el periodo anterior esté correctamente cerrado antes de abrir uno nuevo.</span>
              </div>
            </div>

            <div class="modal-footer flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                class="btn btn-secondary btn-sm font-medium"
                data-testid="btn-cancelar-abrir-periodo"
                (click)="cerrarModales()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn btn-primary btn-sm flex items-center gap-2 font-semibold shadow-sm"
                data-testid="btn-guardar-abrir-periodo"
                [disabled]="procesando()"
                (click)="guardarNuevoPeriodo()"
              >
                @if (procesando()) {
                  <span class="animate-spin text-xs">⏳</span>
                  <span>Abriendo...</span>
                } @else {
                  <span>📅</span>
                  <span>Abrir Periodo</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal: Cerrar Periodo Definitivamente -->
      <app-modal-cerrar-periodo
        [visible]="modalCierre()"
        [periodo]="periodoSeleccionado()"
        (closeModal)="modalCierre.set(false)"
        (cerrado)="onPeriodoCerrado($event)"
      />

      <!-- Modal: Cierre Anual Periodo 13 y Apertura Fiscal -->
      <app-modal-cierre-anual
        [visible]="modalCierreAnual()"
        [anio]="anioSeleccionado()"
        (closeModal)="modalCierreAnual.set(false)"
        (cierreCompletado)="onCierreAnualCompletado()"
      />
    </div>
  `,
})
export class ContabilidadPeriodosComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly cargando = signal<boolean>(false);
  readonly procesando = signal<boolean>(false);
  readonly modalNuevo = signal<boolean>(false);
  readonly modalCierre = signal<boolean>(false);
  readonly modalCierreAnual = signal<boolean>(false);
  readonly periodos = signal<PeriodoContable[]>([]);
  readonly periodoSeleccionado = signal<PeriodoContable | null>(null);
  readonly anioSeleccionado = signal<number>(new Date().getFullYear());

  readonly aniosDisponibles = [2024, 2025, 2026, 2027, 2099];

  formNuevo = { anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 };

  readonly meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' },
  ];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.getPeriodos(this.anioSeleccionado()).subscribe({
      next: (data) => {
        this.periodos.set(data || []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  onAnioChange(anio: number): void {
    this.anioSeleccionado.set(Number(anio));
    this.cargar();
  }

  abrirModalNuevoPeriodo(): void {
    this.formNuevo = { anio: this.anioSeleccionado(), mes: new Date().getMonth() + 1 };
    this.modalNuevo.set(true);
  }

  guardarNuevoPeriodo(): void {
    this.procesando.set(true);
    this.svc.abrirPeriodo(this.formNuevo.anio, this.formNuevo.mes).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cerrarModales();
        this.cargar();
      },
      error: () => this.procesando.set(false),
    });
  }

  bloquear(p: PeriodoContable): void {
    this.svc.bloquearPeriodo(p.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    });
  }

  reabrir(p: PeriodoContable): void {
    this.svc.reabrirPeriodo(p.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    });
  }

  abrirModalCierre(p: PeriodoContable): void {
    this.periodoSeleccionado.set(p);
    this.modalCierre.set(true);
  }

  onPeriodoCerrado(_cerrado: PeriodoContable): void {
    this.cargar();
  }

  onCierreAnualCompletado(): void {
    this.cargar();
  }

  cerrarModales(): void {
    this.modalNuevo.set(false);
    this.modalCierre.set(false);
    this.periodoSeleccionado.set(null);
  }

  nombreMes(mes: number): string {
    return this.meses.find((m) => m.valor === mes)?.nombre ?? mes.toString();
  }

  badgePeriodo(estado: EstadoPeriodo): string {
    const map: Record<string, string> = {
      ABIERTO: 'badge-green',
      BLOQUEADO: 'badge-yellow',
      CERRADO: 'badge-red',
    };
    return map[estado] ?? 'badge-gray';
  }
}
