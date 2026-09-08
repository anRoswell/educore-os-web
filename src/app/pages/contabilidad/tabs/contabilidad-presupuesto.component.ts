import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { ModalCrearPresupuestoComponent } from '../modals/modal-crear-presupuesto.component';
import { ModalEditarPresupuestoComponent } from '../modals/modal-editar-presupuesto.component';
import { ModalAprobarPresupuestoComponent } from '../modals/modal-aprobar-presupuesto.component';
import { ModalTrasladoPresupuestalComponent } from '../modals/modal-traslado-presupuestal.component';
import { ModalReduccionPresupuestalComponent } from '../modals/modal-reduccion-presupuestal.component';
import { ModalLibroModificacionesComponent } from '../modals/modal-libro-modificaciones.component';
import { ModalCrearRubroPresupuestalComponent } from '../modals/modal-crear-rubro.component';
import { ModalAdicionPresupuestalComponent } from '../modals/modal-adicion-presupuestal.component';
import { ModalRespuestaPresupuestoComponent, RespuestaPresupuestoData } from '../modals/modal-respuesta-presupuesto.component';

@Component({
  selector: 'app-contabilidad-presupuesto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalCrearPresupuestoComponent,
    ModalEditarPresupuestoComponent,
    ModalAprobarPresupuestoComponent,
    ModalTrasladoPresupuestalComponent,
    ModalReduccionPresupuestalComponent,
    ModalLibroModificacionesComponent,
    ModalCrearRubroPresupuestalComponent,
    ModalAdicionPresupuestalComponent,
    ModalRespuestaPresupuestoComponent,
  ],
  template: `
    <div class="space-y-4" data-testid="contabilidad-presupuesto-tab">
      <!-- Barra Superior de Parámetros y Acciones -->
      <div class="card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <!-- Título y Filtros -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">📊</span>
              <div>
                <h3 class="font-bold text-base text-slate-800 tracking-tight">Presupuesto Institucional</h3>
                <p class="text-xs text-slate-500">Planificación, techos de gasto y ejecución presupuestal en vivo</p>
              </div>
            </div>

            <div class="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <!-- Vigencia Fiscal -->
            <div class="flex items-center gap-2">
              <label class="text-xs font-semibold text-slate-600">Vigencia:</label>
              <input
                type="number"
                class="input-base text-xs font-mono font-semibold w-24 py-1.5 px-2.5 rounded-lg border-slate-300"
                data-testid="input-presupuesto-filtro-anio"
                [ngModel]="anio()"
                (ngModelChange)="onAnioChange($event)"
                min="2020"
                max="2035"
              />
            </div>

            <!-- Selector de Presupuesto Activo -->
            <div class="flex items-center gap-2">
              <label class="text-xs font-semibold text-slate-600">Presupuesto:</label>
              <select
                class="input-base text-xs font-semibold py-1.5 px-2.5 rounded-lg border-slate-300 min-w-[240px]"
                data-testid="select-presupuesto-activo"
                [ngModel]="presupuestoSeleccionadoId()"
                (ngModelChange)="onPresupuestoSeleccionado($event)"
              >
                @if (presupuestos().length === 0) {
                  <option value="" disabled>No hay presupuestos para {{ anio() }}</option>
                } @else {
                  <option value="TODOS" class="font-bold text-indigo-900 bg-indigo-50/50">
                    📊 Todos (Consolidado Institucional {{ anio() }})
                  </option>
                  @for (p of presupuestos(); track p.id) {
                    <option [value]="p.id">
                      {{ p.nombre }} ({{ p.centroCosto?.nombre || 'General' }}) — $ {{ (p.totalPresupuestado || 0) | number:'1.0-0' }} [{{ p.estado }}] · #{{ p.id.slice(0, 6) }}
                    </option>
                  }
                }
              </select>
            </div>

            <!-- Badge de Estado Legal del Presupuesto (Decreto 1075 de 2015) -->
            @if (presupuestoActual()) {
              @if (presupuestoActual()?.id === 'TODOS') {
                <span
                  class="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5 shadow-2xs"
                  data-testid="badge-estado-presupuesto"
                  title="Vista consolidada de todos los presupuestos de la vigencia institucional"
                >
                  <span>📊</span>
                  <span>CONSOLIDADO ({{ presupuestos().length }} Presupuestos)</span>
                </span>
              } @else if (presupuestoActual()?.estado === 'BORRADOR') {
                <span
                  class="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-2xs"
                  data-testid="badge-estado-presupuesto"
                  title="Presupuesto en formulación. Edición libre de partidas antes de la adopción del Consejo Directivo."
                >
                  <span>📝</span>
                  <span>BORRADOR (Formulación)</span>
                </span>
              } @else {
                <span
                  class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs"
                  data-testid="badge-estado-presupuesto"
                  title="Presupuesto legalmente adoptado. Modificaciones solo mediante Acuerdo de Consejo Directivo."
                >
                  <span>🏛️</span>
                  <span>APROBADO {{ presupuestoActual()?.numeroAcuerdo ? '— ' + presupuestoActual()?.numeroAcuerdo : '' }}</span>
                </span>
              }
            }
          </div>

          <!-- Botones de Acción Contextuales según Estado Normativo -->
          <div class="flex flex-wrap items-center gap-2">
            @if (presupuestoActual()) {
              @if (presupuestoActual()?.id === 'TODOS') {
                <!-- Acciones en Modo Consolidado Institucional -->
                <button
                  type="button"
                  class="btn-secondary btn-sm inline-flex items-center gap-1.5 !bg-indigo-50 !text-indigo-800 hover:!bg-indigo-100 !border-indigo-200 font-medium"
                  data-testid="btn-libro-modificaciones"
                  (click)="modalLibroVisible.set(true)"
                  title="Consultar Libro Histórico Consolidado de Modificaciones y Acuerdos de toda la institución"
                >
                  <span>📜</span>
                  <span>Libro Modificaciones (Consolidado)</span>
                </button>
              } @else if (presupuestoActual()?.estado === 'BORRADOR') {
                <!-- Acciones en Estado BORRADOR (Edición Libre y Adopción) -->
                <button
                  type="button"
                  class="btn-secondary btn-sm inline-flex items-center gap-1.5 !text-amber-800 hover:!bg-amber-50 !border-amber-200"
                  data-testid="btn-editar-presupuesto"
                  (click)="modalEditarPresupuestoVisible.set(true)"
                  title="Modificar denominación, justificación o centro de costo del proyecto de presupuesto"
                >
                  <span>✏️</span>
                  <span>Editar Formulación</span>
                </button>

                <button
                  type="button"
                  class="btn-secondary btn-sm inline-flex items-center gap-1.5 !bg-emerald-50 !text-emerald-800 hover:!bg-emerald-100 !border-emerald-300 font-semibold"
                  data-testid="btn-aprobar-presupuesto"
                  (click)="modalAprobarPresupuestoVisible.set(true)"
                  title="Adoptar formalmente mediante Acuerdo de Consejo Directivo (Decreto 1075 de 2015)"
                >
                  <span>🏛️</span>
                  <span>Aprobar Consejo Directivo</span>
                </button>
              } @else {
                <!-- Acciones en Estado APROBADO (Modificaciones Formales según Ley Colombiana) -->
                <button
                  type="button"
                  class="btn-secondary btn-sm inline-flex items-center gap-1.5"
                  data-testid="btn-traslado-presupuestal"
                  (click)="modalTrasladoVisible.set(true)"
                  [disabled]="rubros().length < 2"
                  title="Traslado presupuestal (Créditos y Contracréditos autorizados por Consejo Directivo)"
                >
                  <span>🔄</span>
                  <span>Traslado</span>
                </button>

                <button
                  type="button"
                  class="btn-secondary btn-sm inline-flex items-center gap-1.5"
                  data-testid="btn-reduccion-presupuestal"
                  (click)="modalReduccionVisible.set(true)"
                  [disabled]="!tieneRubros()"
                  title="Reducción de apropiación presupuestal autorizada por Consejo Directivo"
                >
                  <span>📉</span>
                  <span>Reducción</span>
                </button>

                <button
                  type="button"
                  class="btn-secondary btn-sm inline-flex items-center gap-1.5"
                  data-testid="btn-nueva-adicion"
                  (click)="abrirModalAdicion()"
                  [disabled]="!tieneRubros()"
                  title="Adición presupuestal extraordinaria autorizada por Consejo Directivo"
                >
                  <span>⚡</span>
                  <span>Adición</span>
                </button>

                <button
                  type="button"
                  class="btn-secondary btn-sm inline-flex items-center gap-1.5"
                  data-testid="btn-libro-modificaciones"
                  (click)="modalLibroVisible.set(true)"
                  title="Consultar Libro Histórico de Modificaciones y Acuerdos de Consejo Directivo"
                >
                  <span>📜</span>
                  <span>Libro Modificaciones</span>
                </button>
              }

              @if (presupuestoActual()?.id !== 'TODOS') {
                <button
                  type="button"
                  class="btn-secondary btn-sm inline-flex items-center gap-1.5"
                  data-testid="btn-nuevo-rubro"
                  (click)="abrirModalRubro()"
                  title="Agregar partida de ingreso o gasto al presupuesto activo"
                >
                  <span>+</span>
                  <span>Agregar Rubro</span>
                </button>
              }
            }

            <button
              type="button"
              class="btn-primary btn-sm inline-flex items-center gap-1.5"
              data-testid="btn-nuevo-presupuesto"
              (click)="abrirModalPresupuesto()"
            >
              <span>+</span>
              <span>Nuevo Presupuesto</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Alerta Toast de Éxito -->
      @if (alertaToast()) {
        <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center justify-between shadow-sm" data-testid="alert-toast-presupuesto">
          <div class="flex items-center gap-2">
            <span class="text-base">✅</span>
            <span class="font-medium">{{ alertaToast() }}</span>
          </div>
          <button type="button" class="text-emerald-700 hover:text-emerald-900 font-bold px-1" (click)="alertaToast.set(null)">✕</button>
        </div>
      }

      <!-- Alerta de Error si ocurre -->
      @if (errorMensaje()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-center justify-between" data-testid="error-presupuesto">
          <span>⚠️ {{ errorMensaje() }}</span>
          <button type="button" class="text-red-500 hover:text-red-700 font-bold" (click)="errorMensaje.set(null)">✕</button>
        </div>
      }

      <!-- Spinner de Carga -->
      @if (cargando()) {
        <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-slate-500">
          <div class="spinner mb-3"></div>
          <span class="text-xs font-semibold">Cargando presupuesto y consolidando ejecución en libros...</span>
        </div>
      } @else if (presupuestos().length === 0) {
        <!-- Empty State Sin Presupuestos -->
        <div class="card p-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center flex flex-col items-center justify-center" data-testid="empty-presupuestos">
          <div class="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 text-3xl mb-3 shadow-xs">
            📊
          </div>
          <h4 class="font-bold text-slate-800 text-base mb-1">No hay presupuestos registrados para la vigencia {{ anio() }}</h4>
          <p class="text-xs text-slate-500 max-w-md mb-4">
            Crea el presupuesto general del colegio o clasificado por centros de costo para dar inicio al seguimiento presupuestal.
          </p>
          <button
            type="button"
            class="btn-primary btn-sm inline-flex items-center gap-1.5"
            data-testid="btn-crear-primer-presupuesto"
            (click)="abrirModalPresupuesto()"
          >
            <span>+</span>
            <span>Crear Primer Presupuesto Anual</span>
          </button>
        </div>
      } @else {
        <!-- Cuadrícula de KPIs Estilo NIIF 15 -->
        <div class="presupuesto-kpis-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" data-testid="presupuesto-kpis">
          <!-- KPI 1: Presupuestado -->
          <div class="kpi-widget-card" style="border-color: #dbeafe; background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);">
            <div class="kpi-widget-header">
              <span class="kpi-widget-title" style="color: #1e40af;">Total Presupuestado</span>
              <span class="text-base">📊</span>
            </div>
            <div class="kpi-widget-value" style="color: #1d4ed8;" data-testid="kpi-total-presupuestado">
              $ {{ totales().totalPresupuestado | number:'1.2-2' }}
            </div>
            <div class="kpi-widget-footer" style="color: #3b82f6;">Meta anual aprobada</div>
          </div>

          <!-- KPI 2: Causado -->
          <div class="kpi-widget-card" style="border-color: #e0e7ff; background: linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%);">
            <div class="kpi-widget-header">
              <span class="kpi-widget-title" style="color: #4338ca;">Total Causado</span>
              <span class="text-base">⚡</span>
            </div>
            <div class="kpi-widget-value" style="color: #4f46e5;" data-testid="kpi-total-causado">
              $ {{ totales().totalCausado | number:'1.2-2' }}
            </div>
            <div class="kpi-widget-footer" style="color: #6366f1;">Comprometido y devengado</div>
          </div>

          <!-- KPI 3: Pagado -->
          <div class="kpi-widget-card" style="border-color: #d1fae5; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);">
            <div class="kpi-widget-header">
              <span class="kpi-widget-title" style="color: #065f46;">Total Pagado</span>
              <span class="text-base">✅</span>
            </div>
            <div class="kpi-widget-value" style="color: #059669;" data-testid="kpi-total-pagado">
              $ {{ totales().totalPagado | number:'1.2-2' }}
            </div>
            <div class="kpi-widget-footer" style="color: #10b981;">Desembolsos ejecutados</div>
          </div>

          <!-- KPI 4: Desviación Global -->
          <div class="kpi-widget-card" style="border-color: #f3e8ff; background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);">
            <div class="kpi-widget-header">
              <span class="kpi-widget-title" style="color: #6b21a8;">Desviación Global</span>
              <span class="text-base">🎯</span>
            </div>
            <div class="kpi-widget-value" style="color: #7c3aed;" data-testid="kpi-desviacion-global">
              {{ totales().desviacionGlobal }}%
            </div>
            <div class="kpi-widget-footer" style="color: #a855f7;">Variación presupuestal</div>
          </div>
        </div>

        <!-- Tabla de Rubros Presupuestales -->
        <div class="card p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3" data-testid="seccion-tabla-rubros">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h4 class="font-bold text-slate-800 text-sm">
                Partidas Presupuestales — {{ presupuestoActual()?.nombre || 'Presupuesto Activo' }}
              </h4>
              <span class="text-xs text-slate-400">
                Centro de costo: <strong>{{ presupuestoActual()?.centroCosto?.nombre || 'Institucional / General' }}</strong>
              </span>
            </div>
            <span class="badge-mini bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-xs">
              {{ rubros().length }} Partidas
            </span>
          </div>

          @if (rubros().length === 0) {
            <div class="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200" data-testid="empty-rubros">
              <p class="text-xs text-slate-500 mb-2">Este presupuesto aún no tiene rubros asociados.</p>
              <button
                type="button"
                class="btn-primary btn-sm inline-flex items-center gap-1"
                (click)="abrirModalRubro()"
                data-testid="btn-agregar-primer-rubro"
              >
                <span>+</span>
                <span>Agregar Primer Rubro</span>
              </button>
            </div>
          } @else {
            <div class="overflow-x-auto w-full">
              <table class="tabla-datos w-full text-xs" data-testid="tabla-rubros-presupuesto">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="py-2.5 px-3 text-left font-semibold text-slate-600">Código</th>
                    <th class="py-2.5 px-3 text-left font-semibold text-slate-600">Rubro Presupuestal</th>
                    <th class="py-2.5 px-3 text-center font-semibold text-slate-600">Tipo</th>
                    <th class="py-2.5 px-3 text-right font-semibold text-slate-600">Presupuestado</th>
                    <th class="py-2.5 px-3 text-right font-semibold text-slate-600">Comprometido</th>
                    <th class="py-2.5 px-3 text-right font-semibold text-slate-600">Causado</th>
                    <th class="py-2.5 px-3 text-right font-semibold text-slate-600">Pagado</th>
                    <th class="py-2.5 px-3 text-right font-semibold text-slate-600">% Ejecución</th>
                    <th class="py-2.5 px-3 text-center font-semibold text-slate-600">Semáforo</th>
                    <th class="py-2.5 px-3 text-center font-semibold text-slate-600">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (r of rubros(); track r.codigo) {
                    <tr class="hover:bg-slate-50/60 transition-colors">
                      <td class="py-2 px-3 font-mono font-semibold text-slate-800">{{ r.codigo }}</td>
                      <td class="py-2 px-3 font-medium text-slate-700">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span>{{ r.nombre }}</span>
                          @if (presupuestoActual()?.id === 'TODOS' && r.presupuestoNombre) {
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200" title="Presupuesto de origen">
                              📁 {{ r.presupuestoNombre }}
                            </span>
                          }
                        </div>
                      </td>
                      <td class="py-2 px-3 text-center">
                        <span
                          class="badge-mini px-2 py-0.5 rounded font-semibold text-[10px]"
                          [class.bg-emerald-50]="r.tipo === 'INGRESO'"
                          [class.text-emerald-700]="r.tipo === 'INGRESO'"
                          [class.border]="true"
                          [class.border-emerald-200]="r.tipo === 'INGRESO'"
                          [class.bg-amber-50]="r.tipo === 'GASTO'"
                          [class.text-amber-700]="r.tipo === 'GASTO'"
                          [class.border-amber-200]="r.tipo === 'GASTO'"
                        >
                          {{ r.tipo || 'RUBRO' }}
                        </span>
                      </td>
                      <td class="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                        $ {{ r.presupuestado | number:'1.2-2' }}
                      </td>
                      <td class="py-2 px-3 text-right font-mono text-slate-600">
                        $ {{ r.comprometido | number:'1.2-2' }}
                      </td>
                      <td class="py-2 px-3 text-right font-mono text-slate-600">
                        $ {{ r.causado | number:'1.2-2' }}
                      </td>
                      <td class="py-2 px-3 text-right font-mono text-slate-600">
                        $ {{ r.pagado | number:'1.2-2' }}
                      </td>
                      <td class="py-2 px-3 text-right font-mono font-bold" [class.text-emerald-700]="r.porcentajeEjecucion >= 80" [class.text-slate-800]="r.porcentajeEjecucion < 80">
                        {{ r.porcentajeEjecucion }}%
                      </td>
                      <td class="py-2 px-3 text-center">
                        <span
                          class="badge-mini font-bold px-2 py-0.5 rounded text-[10px] inline-block"
                          [class.bg-emerald-100]="r.semaforo === 'VERDE'"
                          [class.text-emerald-800]="r.semaforo === 'VERDE'"
                          [class.bg-amber-100]="r.semaforo === 'AMARILLO'"
                          [class.text-amber-800]="r.semaforo === 'AMARILLO'"
                          [class.bg-rose-100]="r.semaforo === 'ROJO'"
                          [class.text-rose-800]="r.semaforo === 'ROJO'"
                          data-testid="badge-semaforo"
                        >
                          {{ r.semaforo }}
                        </span>
                      </td>
                      <td class="py-2 px-3 text-center">
                        @if (presupuestoActual()?.id === 'TODOS') {
                          <span class="text-slate-300 font-mono text-xs" title="Para adicionar partidas, seleccione el presupuesto específico en la cabecera">—</span>
                        } @else {
                          <button
                            type="button"
                            class="btn-secondary btn-xs inline-flex items-center gap-1 text-[11px] py-1 px-2"
                            data-testid="btn-adicion-fila"
                            (click)="abrirModalAdicion(r.codigo)"
                            title="Registrar adición extraordinaria a este rubro"
                          >
                            <span>⚡</span>
                            <span>Adición</span>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- Modales de Presupuesto -->
      <app-modal-crear-presupuesto
        [visible]="modalCrearPresupuestoVisible()"
        (cerrar)="modalCrearPresupuestoVisible.set(false)"
        (guardado)="onPresupuestoCreado($event)"
      ></app-modal-crear-presupuesto>

      <app-modal-editar-presupuesto
        [visible]="modalEditarPresupuestoVisible()"
        [presupuesto]="presupuestoActual()"
        (cerrar)="modalEditarPresupuestoVisible.set(false)"
        (guardado)="onPresupuestoActualizado($event)"
      ></app-modal-editar-presupuesto>

      <app-modal-aprobar-presupuesto
        [visible]="modalAprobarPresupuestoVisible()"
        [presupuesto]="presupuestoActual()"
        (cerrar)="modalAprobarPresupuestoVisible.set(false)"
        (aprobado)="onPresupuestoAprobado($event)"
      ></app-modal-aprobar-presupuesto>

      <app-modal-traslado-presupuestal
        [visible]="modalTrasladoVisible()"
        [presupuestoId]="presupuestoSeleccionadoId()"
        [rubros]="rubros()"
        (cerrar)="modalTrasladoVisible.set(false)"
        (guardado)="onTrasladoCreado($event)"
      ></app-modal-traslado-presupuestal>

      <app-modal-reduccion-presupuestal
        [visible]="modalReduccionVisible()"
        [presupuestoId]="presupuestoSeleccionadoId()"
        [rubros]="rubros()"
        (cerrar)="modalReduccionVisible.set(false)"
        (guardado)="onReduccionCreada($event)"
      ></app-modal-reduccion-presupuestal>

      <app-modal-libro-modificaciones
        [visible]="modalLibroVisible()"
        [presupuesto]="presupuestoActual()"
        (cerrar)="modalLibroVisible.set(false)"
      ></app-modal-libro-modificaciones>

      <app-modal-crear-rubro
        [visible]="modalCrearRubroVisible()"
        [presupuestoId]="presupuestoSeleccionadoId()"
        [presupuestoNombre]="presupuestoActual()?.nombre || ''"
        (cerrar)="modalCrearRubroVisible.set(false)"
        (guardado)="onRubroCreado($event)"
      ></app-modal-crear-rubro>

      <app-modal-adicion-presupuestal
        [visible]="modalAdicionVisible()"
        [presupuestoId]="presupuestoSeleccionadoId()"
        [rubros]="rubros()"
        [rubroSeleccionadoCodigo]="rubroParaAdicion()"
        (cerrar)="modalAdicionVisible.set(false)"
        (guardado)="onAdicionCreada($event)"
      ></app-modal-adicion-presupuestal>

      <app-modal-respuesta-presupuesto
        [visible]="modalRespuestaVisible()"
        [data]="respuestaData()"
        (cerrar)="modalRespuestaVisible.set(false)"
      ></app-modal-respuesta-presupuesto>
    </div>
  `,
  styles: [`
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
      transform: translateY(-1px);
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
      font-size: 1.35rem;
      font-weight: 800;
      font-family: var(--font-mono, monospace);
      line-height: 1.2;
    }
    .kpi-widget-footer {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.35rem;
    }
  `],
})
export class ContabilidadPresupuestoTabComponent implements OnInit {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly anio = signal<number>(new Date().getFullYear());
  readonly presupuestos = signal<any[]>([]);
  readonly presupuestoSeleccionadoId = signal<string>('');
  readonly ejecucion = signal<any | null>(null);
  readonly cargando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly alertaToast = signal<string | null>(null);

  // Modales
  readonly modalCrearPresupuestoVisible = signal<boolean>(false);
  readonly modalEditarPresupuestoVisible = signal<boolean>(false);
  readonly modalAprobarPresupuestoVisible = signal<boolean>(false);
  readonly modalTrasladoVisible = signal<boolean>(false);
  readonly modalReduccionVisible = signal<boolean>(false);
  readonly modalLibroVisible = signal<boolean>(false);
  readonly modalCrearRubroVisible = signal<boolean>(false);
  readonly modalAdicionVisible = signal<boolean>(false);
  readonly modalRespuestaVisible = signal<boolean>(false);
  readonly respuestaData = signal<RespuestaPresupuestoData | null>(null);
  readonly rubroParaAdicion = signal<string>('');

  readonly presupuestoActual = computed(() => {
    const list = this.presupuestos();
    const id = this.presupuestoSeleccionadoId();
    if (id === 'TODOS') {
      return {
        id: 'TODOS',
        nombre: `Consolidado Institucional (${this.anio()})`,
        estado: 'CONSOLIDADO',
        anio: this.anio(),
        centroCosto: { nombre: 'Todos los Centros de Costo' },
        totalPresupuestado: list.reduce((acc, p) => acc + Number(p.totalPresupuestado || 0), 0),
      };
    }
    return list.find((p) => String(p.id) === String(id)) || null;
  });

  readonly rubros = computed<any[]>(() => {
    const ej = this.ejecucion();
    const id = this.presupuestoSeleccionadoId();
    if (ej && ej.rubros && ej.rubros.length > 0) {
      if (id === 'TODOS') {
        return ej.rubros.map((r: any) => {
          const matching = this.presupuestos().find((p) => p.rubros?.some((pr: any) => pr.codigo === r.codigo));
          return {
            ...r,
            presupuestoNombre: r.presupuestoNombre || matching?.nombre || '',
          };
        });
      }
      return ej.rubros;
    }
    if (id === 'TODOS') {
      const list = this.presupuestos();
      return list.flatMap((p: any) =>
        (p.rubros || []).map((r: any) => ({
          codigo: r.codigo,
          nombre: r.nombre,
          tipo: r.tipo,
          presupuestado: Number(r.presupuestado || 0),
          comprometido: Number(r.comprometido || 0),
          causado: Number(r.causado || 0),
          pagado: Number(r.pagado || 0),
          porcentajeEjecucion:
            r.presupuestado > 0 ? Math.round((Number(r.causado || 0) / Number(r.presupuestado)) * 100) : 0,
          semaforo: 'VERDE',
          presupuestoId: p.id,
          presupuestoNombre: p.nombre,
          centroCostoNombre: p.centroCosto?.nombre || 'General',
        }))
      );
    }
    const actual = this.presupuestoActual();
    if (actual && actual.rubros) {
      return actual.rubros.map((r: any) => ({
        codigo: r.codigo,
        nombre: r.nombre,
        tipo: r.tipo,
        presupuestado: Number(r.presupuestado || 0),
        comprometido: Number(r.comprometido || 0),
        causado: Number(r.causado || 0),
        pagado: Number(r.pagado || 0),
        porcentajeEjecucion: r.presupuestado > 0 ? Math.round((Number(r.causado || 0) / Number(r.presupuestado)) * 100) : 0,
        semaforo: 'VERDE',
      }));
    }
    return [];
  });

  readonly tieneRubros = computed(() => this.rubros().length > 0);

  readonly totales = computed(() => {
    const ej = this.ejecucion();
    if (ej && ej.totales) {
      return ej.totales;
    }
    const rList = this.rubros();
    const totalPresupuestado = rList.reduce((acc, r) => acc + Number(r.presupuestado || 0), 0);
    const totalCausado = rList.reduce((acc, r) => acc + Number(r.causado || 0), 0);
    const totalPagado = rList.reduce((acc, r) => acc + Number(r.pagado || 0), 0);
    const desviacionGlobal = totalPresupuestado > 0 ? Number(((totalCausado / totalPresupuestado) * 100).toFixed(1)) : 0;
    return {
      totalPresupuestado,
      totalCausado,
      totalPagado,
      desviacionGlobal,
    };
  });

  ngOnInit(): void {
    this.cargarPresupuestos();
  }

  onAnioChange(nuevoAnio: number): void {
    this.anio.set(nuevoAnio);
    this.cargarPresupuestos(nuevoAnio);
  }

  onPresupuestoSeleccionado(id: string): void {
    this.presupuestoSeleccionadoId.set(id);
    if (id) {
      this.cargarEjecucion(id);
    } else {
      this.ejecucion.set(null);
    }
  }

  cargarPresupuestos(anioFiltro?: number, targetSelectId?: string): void {
    const year = anioFiltro || this.anio();
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.contabilidadService.getPresupuestos(year).subscribe({
      next: (list) => {
        this.presupuestos.set(list || []);
        if (list && list.length > 0) {
          let targetId: string;
          if (targetSelectId && (targetSelectId === 'TODOS' || list.some((p: any) => String(p.id) === String(targetSelectId)))) {
            targetId = targetSelectId;
          } else {
            const currentId = this.presupuestoSeleccionadoId();
            if (currentId === 'TODOS') {
              targetId = 'TODOS';
            } else {
              const match = list.find((p: any) => String(p.id) === String(currentId));
              targetId = match ? match.id : list[0].id;
            }
          }
          this.presupuestoSeleccionadoId.set(targetId);
          this.cargarEjecucion(targetId);
        } else {
          this.presupuestoSeleccionadoId.set('');
          this.ejecucion.set(null);
          this.cargando.set(false);
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err?.error?.message || err?.message || 'Error al listar los presupuestos.');
      },
    });
  }

  cargarEjecucion(id: string): void {
    this.cargando.set(true);
    this.contabilidadService.getPresupuestoEjecucion(id).subscribe({
      next: (data) => {
        this.ejecucion.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        // Si no hay asientos, mantenemos el presupuesto cargado
        this.ejecucion.set(null);
      },
    });
  }

  abrirModalRespuesta(data: RespuestaPresupuestoData): void {
    this.respuestaData.set(data);
    this.modalRespuestaVisible.set(true);
  }

  abrirModalPresupuesto(): void {
    this.modalCrearPresupuestoVisible.set(true);
  }

  abrirModalRubro(): void {
    if (!this.presupuestoSeleccionadoId()) {
      this.abrirModalPresupuesto();
      return;
    }
    this.modalCrearRubroVisible.set(true);
  }

  abrirModalAdicion(rubroCodigo?: string): void {
    if (rubroCodigo) {
      this.rubroParaAdicion.set(rubroCodigo);
    } else if (this.rubros().length > 0) {
      this.rubroParaAdicion.set(this.rubros()[0].codigo);
    }
    this.modalAdicionVisible.set(true);
  }

  onPresupuestoCreado(nuevo: any): void {
    const anioCreado = Number(nuevo?.anio) || this.anio();
    if (this.anio() !== anioCreado) {
      this.anio.set(anioCreado);
    }
    const nuevoId = nuevo?.id || '';
    this.cargarPresupuestos(anioCreado, nuevoId);

    this.alertaToast.set(`✅ Presupuesto "${nuevo?.nombre || 'Nuevo Presupuesto'}" para la vigencia ${anioCreado} guardado exitosamente.`);
    this.abrirModalRespuesta({
      tipo: 'PRESUPUESTO',
      titulo: '¡Presupuesto Anual Creado Exitosamente!',
      subtitulo: `${nuevo?.nombre || 'Presupuesto'} — Vigencia ${anioCreado}`,
      detalles: [
        { etiqueta: 'Denominación', valor: nuevo?.nombre || 'Presupuesto General' },
        { etiqueta: 'Vigencia Fiscal (Año)', valor: String(anioCreado) },
        { etiqueta: 'Centro de Costo', valor: nuevo?.centroCosto?.nombre || 'Institucional / General' },
        { etiqueta: 'Estado Inicial', valor: nuevo?.estado || 'APROBADO' },
        { etiqueta: 'Total Presupuestado', valor: '$ 0,00' },
      ],
      mensaje: 'El presupuesto ha sido registrado y persistido en la base de datos institucional. La vigencia y el presupuesto activo se han sincronizado en pantalla.',
    });
  }

  onRubroCreado(nuevoRubro: any): void {
    if (this.presupuestoSeleccionadoId()) {
      this.cargarEjecucion(this.presupuestoSeleccionadoId());
    }
    const montoFormat = nuevoRubro?.presupuestado
      ? '$ ' + Number(nuevoRubro.presupuestado).toLocaleString('es-CO', { minimumFractionDigits: 2 })
      : '$ 0,00';

    this.alertaToast.set(`✅ Rubro "${nuevoRubro?.codigo} - ${nuevoRubro?.nombre}" agregado correctamente.`);
    this.abrirModalRespuesta({
      tipo: 'RUBRO',
      titulo: '¡Rubro Presupuestal Agregado!',
      subtitulo: `${nuevoRubro?.codigo || ''} — ${nuevoRubro?.nombre || ''}`,
      detalles: [
        { etiqueta: 'Código de Partida', valor: nuevoRubro?.codigo || '' },
        { etiqueta: 'Nombre del Rubro', valor: nuevoRubro?.nombre || '' },
        { etiqueta: 'Tipo de Partida', valor: nuevoRubro?.tipo || 'INGRESO' },
        { etiqueta: 'Cuenta PUC Enlazada', valor: nuevoRubro?.cuentaPucCodigo || 'Sin enlazar' },
        { etiqueta: 'Monto Presupuestado', valor: montoFormat },
      ],
      mensaje: 'La partida presupuestal ha sido enlazada al presupuesto activo y guardada en base de datos.',
    });
  }

  onAdicionCreada(res: any): void {
    if (this.presupuestoSeleccionadoId()) {
      this.cargarEjecucion(this.presupuestoSeleccionadoId());
    }
    const montoFormat = res?.presupuestado
      ? '$ ' + Number(res.presupuestado).toLocaleString('es-CO', { minimumFractionDigits: 2 })
      : '$ 0,00';

    this.alertaToast.set(`⚡ Adición extraordinaria aplicada al rubro "${res?.codigo}".`);
    this.abrirModalRespuesta({
      tipo: 'ADICION',
      titulo: '¡Adición Presupuestal Extraordinaria Aplicada!',
      subtitulo: `Rubro ${res?.codigo || ''} — ${res?.nombre || ''}`,
      detalles: [
        { etiqueta: 'Rubro Modificado', valor: `${res?.codigo || ''} - ${res?.nombre || ''}` },
        { etiqueta: 'Nuevo Techo Presupuestado', valor: montoFormat },
        { etiqueta: 'Aprobación', valor: 'APROBADO POR CONSEJO DIRECTIVO' },
      ],
      mensaje: 'La adición presupuestal extraordinaria ha sido registrada y aplicada al techo presupuestal.',
    });
  }

  onPresupuestoActualizado(res: any): void {
    const id = this.presupuestoSeleccionadoId();
    this.cargarPresupuestos(this.anio(), id);
    this.alertaToast.set(`✅ Formulación de presupuesto "${res?.nombre || ''}" actualizada correctamente.`);
    this.abrirModalRespuesta({
      tipo: 'EDICION',
      titulo: '¡Formulación de Presupuesto Actualizada!',
      subtitulo: `${res?.nombre || 'Presupuesto'} (Vigencia ${res?.anio || this.anio()})`,
      detalles: [
        { etiqueta: 'Nombre Presupuesto', valor: res?.nombre || '' },
        { etiqueta: 'Centro de Costo', valor: res?.centroCostoId || 'Institucional / General' },
        { etiqueta: 'Estado', valor: 'BORRADOR (En formulación)' },
        { etiqueta: 'Normativa', valor: 'Decreto 1075 de 2015' },
      ],
      mensaje: 'Los datos del proyecto de presupuesto fueron guardados en la base de datos institucional. Permanecerá editable hasta su adopción formal por el Consejo Directivo.',
    });
  }

  onPresupuestoAprobado(res: any): void {
    const id = this.presupuestoSeleccionadoId();
    this.cargarPresupuestos(this.anio(), id);
    this.alertaToast.set(`🏛️ Presupuesto "${res?.nombre || ''}" aprobado formalmente mediante Acuerdo "${res?.numeroAcuerdo || ''}".`);
    this.abrirModalRespuesta({
      tipo: 'APROBACION',
      titulo: '¡Presupuesto Formalmente Adoptado!',
      subtitulo: `${res?.nombre || ''} — Vigencia ${res?.anio || this.anio()}`,
      detalles: [
        { etiqueta: 'Acto Administrativo', valor: res?.numeroAcuerdo || 'Acuerdo de Consejo Directivo' },
        { etiqueta: 'Fecha del Acuerdo', valor: res?.fechaAcuerdo ? String(res.fechaAcuerdo).split('T')[0] : 'Hoy' },
        { etiqueta: 'Aprobado Por', valor: res?.aprobadoPor || 'Consejo Directivo' },
        { etiqueta: 'Nuevo Estado', valor: 'APROBADO (Vinculante)' },
      ],
      mensaje: 'El presupuesto ha adquirido fuerza vinculante y formal ante el Consejo Directivo y los entes de control educativo. Toda modificación posterior deberá tramitarse como Adición, Traslado o Reducción.',
    });
  }

  onTrasladoCreado(res: any): void {
    const id = this.presupuestoSeleccionadoId();
    if (id) {
      this.cargarEjecucion(id);
    }
    const montoFormat = res?.monto
      ? '$ ' + Number(res.monto).toLocaleString('es-CO', { minimumFractionDigits: 2 })
      : '$ 0,00';

    this.alertaToast.set(`🔄 Traslado presupuestal de ${montoFormat} efectuado con éxito.`);
    this.abrirModalRespuesta({
      tipo: 'TRASLADO',
      titulo: '¡Traslado Presupuestal Ejecutado!',
      subtitulo: `Crédito y Contracrédito — ${res?.modificacion?.numeroAcuerdo || 'Acuerdo de Consejo'}`,
      detalles: [
        { etiqueta: 'Rubro Cedente (Contracrédito)', valor: res?.modificacion?.rubroOrigenCodigo || 'Origen' },
        { etiqueta: 'Rubro Beneficiario (Crédito)', valor: res?.modificacion?.rubroDestinoCodigo || 'Destino' },
        { etiqueta: 'Monto Trasladado', valor: montoFormat },
        { etiqueta: 'Acuerdo Consejo', valor: res?.modificacion?.numeroAcuerdo || 'N/A' },
        { etiqueta: 'Impacto Presupuesto Total', valor: '$ 0,00 (Techo total inalterado)' },
      ],
      mensaje: 'El traslado presupuestal fue registrado conforme a la ley colombiana. Las apropiaciones de ambos rubros se han actualizado y el acto quedó asentado en el Libro de Modificaciones.',
    });
  }

  onReduccionCreada(res: any): void {
    const id = this.presupuestoSeleccionadoId();
    if (id) {
      this.cargarPresupuestos(this.anio(), id);
      this.cargarEjecucion(id);
    }
    const montoFormat = res?.modificacion?.monto
      ? '$ ' + Number(res.modificacion.monto).toLocaleString('es-CO', { minimumFractionDigits: 2 })
      : '$ 0,00';

    this.alertaToast.set(`📉 Reducción presupuestal de ${montoFormat} aplicada al rubro "${res?.rubro?.codigo || ''}".`);
    this.abrirModalRespuesta({
      tipo: 'REDUCCION',
      titulo: '¡Reducción Presupuestal Aplicada!',
      subtitulo: `Rubro ${res?.rubro?.codigo || ''} — ${res?.rubro?.nombre || ''}`,
      detalles: [
        { etiqueta: 'Rubro Afectado', valor: `${res?.rubro?.codigo || ''} - ${res?.rubro?.nombre || ''}` },
        { etiqueta: 'Monto Reducido', valor: montoFormat },
        { etiqueta: 'Nuevo Techo del Rubro', valor: '$ ' + Number(res?.rubro?.presupuestado || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) },
        { etiqueta: 'Acuerdo Consejo', valor: res?.modificacion?.numeroAcuerdo || 'N/A' },
      ],
      mensaje: 'La reducción de apropiación presupuestal fue legalmente procesada y el total del presupuesto anual ha sido actualizado.',
    });
  }
}
