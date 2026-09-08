import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { CajaMenorModel, CajaMenorLegalizacionModel } from '../models/contabilidad.models';
import { ModalCrearCajaMenorComponent } from '../modals/modal-crear-caja-menor.component';
import { ModalLegalizarGastoComponent } from '../modals/modal-legalizar-gasto.component';
import { ModalReembolsoCajaMenorComponent } from '../modals/modal-reembolso-caja-menor.component';

@Component({
  selector: 'app-contabilidad-caja-menor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalCrearCajaMenorComponent,
    ModalLegalizarGastoComponent,
    ModalReembolsoCajaMenorComponent,
  ],
  styles: [`
    .caja-header-card {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      border: 1.5px solid #e2e8f0;
      border-left: 5px solid #4f46e5;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.03);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .kpis-caja-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .kpis-caja-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .kpis-caja-grid {
        grid-template-columns: 1fr;
      }
    }

    .kpi-widget-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
    }
    .kpi-widget-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
      border-color: #cbd5e1;
    }
    .kpi-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }
    .kpi-widget-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    .kpi-widget-value {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: var(--font-mono);
      line-height: 1.2;
    }
    .kpi-widget-footer {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.35rem;
    }

    .fondos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .fondo-widget-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 1.25rem;
      border: 1.5px solid #cbd5e1;
      border-top: 4px solid #6366f1;
      box-shadow: 0 10px 22px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .fondo-widget-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 30px -4px rgba(99, 102, 241, 0.18), 0 6px 10px -3px rgba(0, 0, 0, 0.06);
      border-color: #818cf8;
    }

    .fondo-widget-card.fondo-active {
      border: 2px solid #4f46e5;
      border-top: 5px solid #4338ca;
      background: linear-gradient(180deg, #ffffff 0%, #f5f7ff 100%);
      box-shadow: 0 14px 32px -4px rgba(79, 70, 229, 0.24), 0 6px 12px -3px rgba(79, 70, 229, 0.12);
    }

    .fondo-widget-card.fondo-warning {
      border-top-color: #f43f5e;
    }

    .panel-legalizaciones-widget {
      background: #ffffff;
      border-radius: 14px;
      padding: 1.35rem 1.5rem;
      border: 1.5px solid #cbd5e1;
      border-top: 4px solid #4f46e5;
      box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.07), 0 6px 10px -4px rgba(0, 0, 0, 0.04);
    }
  `],
  template: `
    <div class="caja-menor-container space-y-4" data-testid="caja-menor-tab-container">
      <!-- Encabezado de la Pestaña -->
      <div class="caja-header-card">
        <div>
          <div class="flex items-center gap-3">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: #eef2ff; border: 1.5px solid #c7d2fe; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
              💼
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <h2 class="text-lg font-bold text-gray-800" data-testid="title-caja-menor" style="font-size: 1.15rem; font-weight: 800; color: #1e1b4b; margin: 0;">
                  Gestión de Caja Menor Escolar y Fondos Fijos
                </h2>
                <span class="badge-mini badge-blue" style="font-size: 0.65rem;">Fondos Fijos</span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5" style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
                Administración de fondos asignados a Pagaduría, Rectoría y Secretaría con control de saldo en tiempo real y reposición por partida doble (EGR).
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn-primary"
            style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.55rem 1.1rem; border-radius: 9px; font-weight: 700; font-size: 0.8125rem; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);"
            data-testid="btn-abrir-caja-menor"
            (click)="mostrarModalCrear.set(true)"
          >
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 5px; background: rgba(255, 255, 255, 0.25);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </span>
            <span>Abrir Fondo de Caja</span>
          </button>
        </div>
      </div>

      <!-- Tarjetas KPI Resumen Estilo NIIF 15 -->
      <div class="kpis-caja-grid" data-testid="kpis-caja-menor">
        <!-- KPI 1: Fondos Asignados -->
        <div class="kpi-widget-card" data-testid="kpi-total-autorizado-card">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title">Total Fondos Asignados</span>
            <span class="text-sm">💼</span>
          </div>
          <div class="kpi-widget-value text-slate-800" data-testid="kpi-total-autorizado">
            $ {{ totalMontoAutorizado() | number:'1.0-0' }}
          </div>
          <div class="kpi-widget-footer">
            {{ cajas().length }} fondos activos
          </div>
        </div>

        <!-- KPI 2: Saldo Disponible -->
        <div class="kpi-widget-card" style="border-color: #d1fae5; background: linear-gradient(135deg, rgba(209, 250, 229, 0.25) 0%, #ffffff 100%);">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #047857;">Saldo Disponible Total</span>
            <span class="text-sm">💰</span>
          </div>
          <div class="kpi-widget-value" style="color: #047857;" data-testid="kpi-total-disponible">
            $ {{ totalSaldoDisponible() | number:'1.0-0' }}
          </div>
          <div class="kpi-widget-footer" style="color: #059669;">
            {{ porcentajeGlobalDisponible() }}% de liquidez
          </div>
        </div>

        <!-- KPI 3: Gastos Pendientes de Reembolso -->
        <div class="kpi-widget-card" style="border-color: #fef3c7; background: linear-gradient(135deg, rgba(254, 243, 199, 0.25) 0%, #ffffff 100%);">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #b45309;">Gastos por Reembolsar</span>
            <span class="text-sm">🧾</span>
          </div>
          <div class="kpi-widget-value" style="color: #b45309;" data-testid="kpi-total-por-reembolsar">
            $ {{ totalGastadoPendiente() | number:'1.0-0' }}
          </div>
          <div class="kpi-widget-footer" style="color: #d97706;">
            {{ cantidadGastosPendientes() }} recibos legalizados
          </div>
        </div>

        <!-- KPI 4: Alertas de Reposición -->
        <div
          class="kpi-widget-card"
          [style.border-color]="cajasEnAlerta().length > 0 ? '#fee2e2' : '#e0f2fe'"
          [style.background]="cajasEnAlerta().length > 0 ? 'linear-gradient(135deg, rgba(254, 226, 226, 0.25) 0%, #ffffff 100%)' : 'linear-gradient(135deg, rgba(224, 242, 254, 0.25) 0%, #ffffff 100%)'"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" [style.color]="cajasEnAlerta().length > 0 ? '#be123c' : '#0369a1'">Alertas de Reposición (≤ 30%)</span>
            <span class="text-sm">{{ cajasEnAlerta().length > 0 ? '🚨' : '✨' }}</span>
          </div>
          <div class="kpi-widget-value" [style.color]="cajasEnAlerta().length > 0 ? '#be123c' : '#0369a1'" data-testid="kpi-alertas-reposicion">
            {{ cajasEnAlerta().length }}
          </div>
          <div class="kpi-widget-footer" [style.color]="cajasEnAlerta().length > 0 ? '#e11d48' : '#0284c7'">
            {{ cajasEnAlerta().length > 0 ? 'Requieren reposición EGR' : 'Fondos en nivel óptimo' }}
          </div>
        </div>
      </div>

      <!-- Tarjetas de Fondos Fijos Activos con Bordes y Sombras -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-base">🏢</span>
            <h3 class="text-sm font-bold text-slate-800" style="font-size: 0.95rem; font-weight: 800; color: #1e1b4b;">Fondos Fijos Institucionales</h3>
          </div>
          <span class="text-xs text-slate-400">Seleccione un fondo para consultar su libro de legalizaciones</span>
        </div>

        <div class="fondos-grid" data-testid="grid-fondos-fijos">
          @for (c of cajas(); track c.id) {
            <div
              class="fondo-widget-card"
              [ngClass]="{
                'fondo-active': cajaSeleccionada()?.id === c.id,
                'fondo-warning': (c.alertaReposicion || (c.saldoDisponible / c.montoAutorizado) <= 0.3)
              }"
              (click)="seleccionarCaja(c)"
              [attr.data-testid]="'card-caja-' + c.id"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-2.5">
                  <div style="width: 36px; height: 36px; border-radius: 10px; background: #eef2ff; border: 1.5px solid #c7d2fe; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    💼
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-800 tracking-tight" data-testid="card-caja-nombre" style="font-size: 0.8125rem; font-weight: 800; color: #1e1b4b;">{{ c.nombre }}</h4>
                    <span class="text-[11px] text-slate-500 block mt-0.5" style="font-size: 0.72rem; color: #64748b;">Custodio: <strong style="color: #334155; font-weight: 700;">{{ c.responsableNombre }}</strong></span>
                  </div>
                </div>
                @if (c.alertaReposicion || (c.saldoDisponible / c.montoAutorizado) <= 0.3) {
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px] shadow-2xs animate-pulse" data-testid="badge-alerta-reposicion">
                    <span>⚠️</span> Reponer
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[10px] shadow-2xs">
                    <span class="text-emerald-500">●</span> Activa
                  </span>
                }
              </div>

              <!-- Barra de Saldo -->
              <div class="mt-3.5 pt-3 border-t border-slate-100">
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span style="font-size: 0.72rem; font-weight: 600; color: #64748b;">Disponible:</span>
                  <span class="font-black text-slate-800" data-testid="card-caja-saldo" style="font-size: 0.78rem; font-weight: 800;">
                    $ {{ c.saldoDisponible | number:'1.0-0' }} <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 500;">/ $ {{ c.montoAutorizado | number:'1.0-0' }}</span>
                  </span>
                </div>
                <div style="width: 100%; background: #f1f5f9; border-radius: 9999px; height: 9px; overflow: hidden; padding: 1px; border: 1px solid #e2e8f0;">
                  <div
                    style="height: 100%; border-radius: 9999px; transition: width 0.4s ease;"
                    [style.width.%]="calcularPorcentaje(c)"
                    [style.background]="calcularPorcentaje(c) <= 30 ? 'linear-gradient(90deg, #ef4444, #f43f5e)' : (calcularPorcentaje(c) <= 50 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #10b981, #14b8a6)')"
                  ></div>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span class="font-bold" [style.color]="calcularPorcentaje(c) <= 30 ? '#e11d48' : '#334155'" style="font-size: 0.72rem; font-weight: 700;">{{ calcularPorcentaje(c) }}% disponible</span>
                  <span style="font-family: monospace; font-size: 0.68rem; background: #f8fafc; color: #475569; padding: 2px 8px; border-radius: 6px; border: 1.5px solid #e2e8f0; font-weight: 700;">PUC: {{ c.cuentaPucCaja }}</span>
                </div>
              </div>
            </div>
          } @empty {
            <div
              class="border border-dashed rounded-xl p-8 bg-white"
              style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 2.5rem 1.5rem; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 14px; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;"
            >
              <div style="width: 44px; height: 44px; border-radius: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 1.35rem;">
                💼
              </div>
              <p style="margin: 0; font-size: 0.875rem; font-weight: 600; color: #64748b; text-align: center; max-width: 540px; line-height: 1.5;">
                No hay fondos de caja menor registrados. Haga clic en <strong style="color: #4f46e5;">"+ Abrir Fondo de Caja"</strong> para crear el primero.
              </p>
            </div>
          }
        </div>
      </div>

      <!-- Detalle del Fondo Seleccionado y Legalizaciones -->
      @if (cajaSeleccionada(); as sel) {
        <div class="panel-legalizaciones-widget space-y-4" data-testid="panel-detalle-caja">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div class="flex items-center gap-2.5">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: #eef2ff; border: 1.5px solid #c7d2fe; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                  📖
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <h3 class="text-sm font-bold text-slate-800 tracking-tight" data-testid="titulo-fondo-seleccionado" style="font-size: 0.95rem; font-weight: 800; color: #1e1b4b; margin: 0;">
                      Libro de Legalizaciones — {{ sel.nombre }}
                    </h3>
                    <span style="padding: 2px 10px; border-radius: 9999px; font-size: 0.68rem; font-family: monospace; font-weight: 800; background: #eef2ff; color: #4338ca; border: 1.5px solid #c7d2fe;">
                      Cuenta: {{ sel.cuentaPucCaja }}
                    </span>
                  </div>
                  <span class="text-xs text-slate-500 block mt-0.5" style="font-size: 0.75rem; color: #64748b;">
                    Responsable: <strong style="color: #334155; font-weight: 700;">{{ sel.responsableNombre }}</strong> ({{ sel.responsableCargo || 'Custodio Institucional' }})
                  </span>
                </div>
              </div>
            </div>

            <!-- Acciones Operativas -->
            <div class="flex items-center gap-2.5">
              <button
                type="button"
                class="btn-secondary"
                style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.9rem; font-size: 0.78rem; font-weight: 600; border-radius: 8px; border: 1.5px solid #c7d2fe; color: #4338ca; background: #f5f7ff; box-shadow: 0 1px 3px rgba(0,0,0,0.04);"
                data-testid="btn-nuevo-gasto"
                (click)="mostrarModalGasto.set(true)"
              >
                <span>🧾</span>
                <span>+ Registrar Gasto Menor</span>
              </button>

              <button
                type="button"
                class="btn-primary"
                style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; background: #059669; border-color: #059669; color: #ffffff; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.25);"
                data-testid="btn-reembolsar-caja"
                (click)="mostrarModalReembolso.set(true)"
                [disabled]="(sel.montoAutorizado - sel.saldoDisponible) <= 0"
              >
                <span>🔄</span>
                <span>Reembolsar Caja (Egreso EGR)</span>
              </button>
            </div>
          </div>

          <!-- Tabla de Gastos Menores -->
          <div class="overflow-x-auto">
            <table class="w-full text-xs" data-testid="tabla-legalizaciones">
              <thead class="bg-slate-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th class="p-2.5 text-left">Fecha</th>
                  <th class="p-2.5 text-left">No. Recibo</th>
                  <th class="p-2.5 text-left">Proveedor / Tercero</th>
                  <th class="p-2.5 text-left">NIT</th>
                  <th class="p-2.5 text-left">Concepto</th>
                  <th class="p-2.5 text-left">Cuenta Gasto</th>
                  <th class="p-2.5 text-right">Valor Bruto</th>
                  <th class="p-2.5 text-right">Valor Neto</th>
                  <th class="p-2.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (g of legalizaciones(); track g.id) {
                  <tr class="hover:bg-slate-50 transition-colors" [attr.data-testid]="'row-gasto-' + g.id">
                    <td class="p-2.5 text-gray-600">{{ g.fechaGasto | slice:0:10 }}</td>
                    <td class="p-2.5 font-mono font-bold text-indigo-900" data-testid="col-recibo-numero">{{ g.numeroRecibo }}</td>
                    <td class="p-2.5 font-medium text-gray-800">{{ g.terceroNombre }}</td>
                    <td class="p-2.5 font-mono text-gray-500">{{ g.terceroNit }}</td>
                    <td class="p-2.5 text-gray-700 max-w-[200px] truncate" [title]="g.concepto">{{ g.concepto }}</td>
                    <td class="p-2.5 font-mono text-gray-600">{{ g.cuentaPucGasto }}</td>
                    <td class="p-2.5 text-right text-gray-500">$ {{ g.valorBruto | number:'1.0-0' }}</td>
                    <td class="p-2.5 text-right font-bold text-gray-900" data-testid="col-valor-neto">
                      $ {{ g.valorNeto | number:'1.0-0' }}
                    </td>
                    <td class="p-2.5 text-center">
                      @if (g.estado === 'REEMBOLSADO') {
                        <span class="badge-mini bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px]" data-testid="badge-gasto-reembolsado">
                          Reembolsado ({{ g.comprobanteEgresoNumero || 'EGR' }})
                        </span>
                      } @else {
                        <span class="badge-mini bg-amber-100 text-amber-800 border border-amber-200 text-[10px]" data-testid="badge-gasto-pendiente">
                          Pendiente
                        </span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="p-6 text-center text-gray-400">
                      No se han registrado legalizaciones ni compras menores para este fondo.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    <!-- Modales -->
    <app-modal-crear-caja-menor
      [visible]="mostrarModalCrear()"
      (cajaCreada)="cargarCajas()"
      (cerrarModal)="mostrarModalCrear.set(false)"
    />

    <app-modal-legalizar-gasto
      [visible]="mostrarModalGasto()"
      [caja]="cajaSeleccionada()"
      (gastoRegistrado)="alGastoRegistrado()"
      (cerrarModal)="mostrarModalGasto.set(false)"
    />

    <app-modal-reembolso-caja-menor
      [visible]="mostrarModalReembolso()"
      [caja]="cajaSeleccionada()"
      (reembolsoCompletado)="alReembolsoCompletado()"
      (cerrarModal)="mostrarModalReembolso.set(false)"
    />
  `,
})
export class ContabilidadCajaMenorTabComponent implements OnInit {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly cajas = signal<CajaMenorModel[]>([]);
  readonly cajaSeleccionada = signal<CajaMenorModel | null>(null);

  readonly cargando = signal(false);
  readonly mostrarModalCrear = signal(false);
  readonly mostrarModalGasto = signal(false);
  readonly mostrarModalReembolso = signal(false);

  readonly totalMontoAutorizado = computed(() =>
    this.cajas().reduce((acc, c) => acc + Number(c.montoAutorizado || 0), 0),
  );

  readonly totalSaldoDisponible = computed(() =>
    this.cajas().reduce((acc, c) => acc + Number(c.saldoDisponible || 0), 0),
  );

  readonly totalGastadoPendiente = computed(() =>
    Math.max(0, this.totalMontoAutorizado() - this.totalSaldoDisponible()),
  );

  readonly porcentajeGlobalDisponible = computed(() => {
    const tot = this.totalMontoAutorizado();
    if (tot <= 0) return 100;
    return Math.round((this.totalSaldoDisponible() / tot) * 1000) / 10;
  });

  readonly cajasEnAlerta = computed(() =>
    this.cajas().filter((c) => {
      const pct = (Number(c.saldoDisponible) / (Number(c.montoAutorizado) || 1)) * 100;
      return pct <= Number(c.umbralAlertaPorcentaje || 30);
    }),
  );

  readonly cantidadGastosPendientes = computed(() => {
    return this.cajas().reduce((acc, c) => {
      const pend = (c.legalizaciones || []).filter((l) => l.estado === 'PENDIENTE').length;
      return acc + (c.cantidadGastosPendientes || pend);
    }, 0);
  });

  readonly legalizaciones = computed<CajaMenorLegalizacionModel[]>(() => {
    const c = this.cajaSeleccionada();
    return c?.legalizaciones || [];
  });

  ngOnInit(): void {
    this.cargarCajas();
  }

  cargarCajas(): void {
    this.cargando.set(true);
    this.contabilidadService.getCajasMenores().subscribe({
      next: (lista) => {
        this.cajas.set(lista);
        this.cargando.set(false);
        if (lista.length > 0) {
          const actual = this.cajaSeleccionada();
          const encontrada = actual ? lista.find((c) => c.id === actual.id) : null;
          this.seleccionarCaja(encontrada || lista[0]);
        } else {
          this.cajaSeleccionada.set(null);
        }
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  seleccionarCaja(caja: CajaMenorModel): void {
    // Cargar con detalle completo incluyendo legalizaciones
    this.contabilidadService.getCajaMenorById(caja.id).subscribe({
      next: (detalle) => {
        this.cajaSeleccionada.set(detalle);
      },
      error: () => {
        this.cajaSeleccionada.set(caja);
      },
    });
  }

  calcularPorcentaje(caja: CajaMenorModel): number {
    const monto = Number(caja.montoAutorizado) || 1;
    const saldo = Number(caja.saldoDisponible) || 0;
    return Math.min(100, Math.max(0, Math.round((saldo / monto) * 100)));
  }

  alGastoRegistrado(): void {
    const sel = this.cajaSeleccionada();
    if (sel) {
      this.seleccionarCaja(sel);
    }
    this.cargarCajas();
  }

  alReembolsoCompletado(): void {
    const sel = this.cajaSeleccionada();
    if (sel) {
      this.seleccionarCaja(sel);
    }
    this.cargarCajas();
  }
}
