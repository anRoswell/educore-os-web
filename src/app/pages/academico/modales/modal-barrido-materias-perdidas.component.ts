import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParametrosService } from '../../../core/services/parametros.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { ApiService } from '../../../core/services/api.service';
import { DiaSemanaNotificacion } from '../../../core/enums';
import {
  ConfiguracionAlertasAcademicas,
  EstudianteBarridoAlerta,
  PrevisualizacionBarridoResponse,
  ResultadoBarridoEjecutado,
} from '../../../core/models';

export interface DiaOpcion {
  clave: DiaSemanaNotificacion;
  nombre: string;
  abreviatura: string;
  icono: string;
}

import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';

@Component({
  selector: 'app-modal-barrido-materias-perdidas',
  standalone: true,
  imports: [CommonModule, FormsModule, FlatpickrDirective],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('barridoMateriasPerdidas') || 1200">
      <div class="modal-card card card-glass" style="max-width: 1050px; width: 96vw; max-height: 92vh; display: flex; flex-direction: column;">
        
        <!-- Header -->
        <div class="modal-header" style="padding: 1.25rem 1.5rem 1rem 1.5rem; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <div style="flex: 1;">
            <div class="flex items-center gap-2">
              <span style="font-size: 1.6rem;">🔔</span>
              <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">
                Barrido de Materias Perdidas & Alertas a Padres
              </h3>
            </div>
            <p class="text-muted" style="margin: 0.35rem 0 0 0; font-size: 0.85rem;">
              Parametrización por días de la semana, umbral de reprobación (Decreto 1290) y despacho automático de alertas a acudientes
            </p>
          </div>
          <button (click)="cerrarModal()" class="close-btn" title="Cerrar ventana">&times;</button>
        </div>

        <!-- Selector de Colegio & Tenant -->
        <div style="padding: 0.85rem 1.5rem; background: rgba(0,0,0,0.04); border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));">
          <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 280px;">
              <label class="form-label" style="margin: 0; white-space: nowrap; font-weight: 600; font-size: 0.875rem;">
                🏫 Colegio / Institución:
              </label>
              <select
                class="form-select"
                style="flex: 1; font-weight: 500; font-size: 0.875rem;"
                [ngModel]="colegioSeleccionadoId()"
                (ngModelChange)="cambiarColegio($event)"
              >
                @for (c of colegiosDisponibles(); track c.id) {
                  <option [value]="c.id">
                    {{ c.nombre }} ({{ c.ciudad || 'Sede Principal' }})
                  </option>
                }
              </select>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge" [ngClass]="formConfig.barridoActivo ? 'badge-success' : 'badge-neutral'" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
                {{ formConfig.barridoActivo ? '🟢 Barrido Automático ACTIVO' : '⚪ Barrido Automático PAUSADO' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pestañas de Navegación -->
        <div class="tabs-header" style="display: flex; gap: 0.5rem; padding: 0.75rem 1.5rem 0 1.5rem; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.1)); background: rgba(0,0,0,0.02);">
          <button
            type="button"
            class="tab-btn"
            [class.active]="tabActivo() === 'parametros'"
            (click)="tabActivo.set('parametros')"
          >
            ⚙️ Parametrización & Días de Envío
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="tabActivo() === 'previsualizacion'"
            (click)="cambiarTabPrevisualizacion()"
          >
            👁️ Previsualización de Estudiantes en Riesgo ({{ previewData()?.totalEstudiantesEnRiesgo ?? 0 }})
          </button>
          @if (ultimoResultadoEnvio()) {
            <button
              type="button"
              class="tab-btn"
              [class.active]="tabActivo() === 'reporte'"
              (click)="tabActivo.set('reporte')"
            >
              📊 Reporte del Último Envío
            </button>
          }
        </div>

        <!-- Cuerpo del Modal -->
        <div class="modal-body" style="padding: 1.5rem; overflow-y: auto; flex: 1;">
          @if (isLoading()) {
            <div style="text-align: center; padding: 3rem 1rem;">
              <div class="spinner" style="display: inline-block; width: 2.5rem; height: 2.5rem; border: 3px solid rgba(79, 70, 229, 0.2); border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
              <p class="text-muted mt-2" style="font-size: 0.9rem;">Cargando información institucional...</p>
            </div>
          } @else {

            <!-- TAB 1: PARAMETRIZACIÓN & DÍAS -->
            @if (tabActivo() === 'parametros') {
              <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 1.5rem;">
                
                <!-- Sección Días de la Semana (Checklist) -->
                <div class="card p-3" style="background: rgba(var(--primary-rgb, 79, 70, 229), 0.03); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 10px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <div>
                      <h4 style="margin: 0; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        <span>📅</span> Días de la Semana para Informar a los Padres
                      </h4>
                      <p class="text-muted" style="margin: 0.2rem 0 0 0; font-size: 0.8rem;">
                        Selecciona los días en los que el sistema barrerá las calificaciones y enviará la notificación a los acudientes
                      </p>
                    </div>

                    <!-- Acciones rápidas de selección -->
                    <div style="display: flex; gap: 0.4rem;">
                      <button
                        type="button"
                        class="btn btn-xs btn-outline"
                        style="font-size: 0.75rem; padding: 0.25rem 0.55rem;"
                        (click)="seleccionarDiasHabiles()"
                        title="Seleccionar de Lunes a Viernes"
                      >
                        ⚡ Días Hábiles (Lun - Vie)
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-outline"
                        style="font-size: 0.75rem; padding: 0.25rem 0.55rem;"
                        (click)="seleccionarTodosDias()"
                        title="Seleccionar toda la semana"
                      >
                        🌟 Todos
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-outline"
                        style="font-size: 0.75rem; padding: 0.25rem 0.55rem;"
                        (click)="desmarcarTodosDias()"
                        title="Limpiar selección"
                      >
                        🛑 Ninguno
                      </button>
                    </div>
                  </div>

                  <!-- Grid de checkboxes de días de la semana -->
                  <div class="dias-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem;">
                    @for (dia of listaDias; track dia.clave) {
                      <label
                        class="dia-card"
                        [class.dia-selected]="isDiaSeleccionado(dia.clave)"
                        style="cursor: pointer; display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 0.85rem; border-radius: 8px; border: 1px solid var(--border-color, rgba(255,255,255,0.12)); transition: all 0.2s ease; user-select: none;"
                      >
                        <input
                          type="checkbox"
                          class="form-check-input"
                          style="cursor: pointer; width: 1.15rem; height: 1.15rem; margin: 0;"
                          [checked]="isDiaSeleccionado(dia.clave)"
                          (change)="toggleDia(dia.clave)"
                        />
                        <div style="display: flex; flex-direction: column;">
                          <span style="font-weight: 600; font-size: 0.875rem;">{{ dia.icono }} {{ dia.nombre }}</span>
                          <span class="text-muted" style="font-size: 0.7rem;">{{ dia.abreviatura }}</span>
                        </div>
                      </label>
                    }
                  </div>

                  @if (formConfig.diasNotificacion.length === 0) {
                    <div style="margin-top: 0.75rem; padding: 0.5rem 0.75rem; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; border-radius: 4px; font-size: 0.8rem; color: #ef4444;">
                      ⚠️ Advertencia: No has seleccionado ningún día. El barrido automático no se ejecutará en ningún día de la semana.
                    </div>
                  } @else {
                    <div style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-muted, #94a3b8);">
                      ✅ Días activos para este colegio: <strong style="color: var(--primary-color, #4f46e5);">{{ formConfig.diasNotificacion.join(', ') }}</strong>
                    </div>
                  }
                </div>

                <!-- Configuración de Horario & Umbrales -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">
                  
                  <!-- Switch Barrido Activo -->
                  <div class="form-group" style="background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color, rgba(255,255,255,0.08));">
                    <label class="form-label" style="font-weight: 600; margin-bottom: 0.5rem; display: block;">
                      🔄 Estado del Barrido Automático
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer;">
                      <input
                        type="checkbox"
                        style="width: 1.25rem; height: 1.25rem; cursor: pointer;"
                        [(ngModel)]="formConfig.barridoActivo"
                      />
                      <span style="font-weight: 500; font-size: 0.9rem;">
                        {{ formConfig.barridoActivo ? 'Habilitado (ejecución programada)' : 'Deshabilitado (solo envíos manuales)' }}
                      </span>
                    </label>
                    <small class="text-muted" style="display: block; margin-top: 0.35rem; font-size: 0.75rem;">
                      Si está activo, el cron verificará si hoy coincide con los días seleccionados.
                    </small>
                  </div>

                  <!-- Hora de Envío -->
                  <div class="form-group" style="background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color, rgba(255,255,255,0.08));">
                    <label class="form-label" style="font-weight: 600; margin-bottom: 0.35rem; display: block;">
                      ⏰ Hora Programada de Envío
                    </label>
                    <input
                      type="text"
                      appFlatpickr
                      [enableTime]="true"
                      [noCalendar]="true"
                      [time24hr]="true"
                      dateFormat="H:i"
                      class="form-control"
                      style="font-size: 0.95rem; font-weight: 600;"
                      [(ngModel)]="formConfig.horaEnvio"
                      placeholder="hh:mm"
                    />
                    <small class="text-muted" style="display: block; margin-top: 0.35rem; font-size: 0.75rem;">
                      Hora militar en la que se despacharán las notificaciones en los días programados.
                    </small>
                  </div>

                  <!-- Nota de Corte (Decreto 1290) -->
                  <div class="form-group" style="background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color, rgba(255,255,255,0.08));">
                    <label class="form-label" style="font-weight: 600; margin-bottom: 0.35rem; display: block;">
                      📉 Nota de Corte Aprobatoria (D. 1290)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      class="form-control"
                      style="font-size: 0.95rem; font-weight: 600;"
                      [(ngModel)]="formConfig.notaCorteAprobacion"
                    />
                    <small class="text-muted" style="display: block; margin-top: 0.35rem; font-size: 0.75rem;">
                      Calificaciones inferiores a este valor se consideran reprobadas (por defecto: 3.0).
                    </small>
                  </div>

                  <!-- Mínimo de Materias Perdidas -->
                  <div class="form-group" style="background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color, rgba(255,255,255,0.08));">
                    <label class="form-label" style="font-weight: 600; margin-bottom: 0.35rem; display: block;">
                      🎯 Mínimo de Materias Perdidas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      class="form-control"
                      style="font-size: 0.95rem; font-weight: 600;"
                      [(ngModel)]="formConfig.minimoMateriasPerdidas"
                    />
                    <small class="text-muted" style="display: block; margin-top: 0.35rem; font-size: 0.75rem;">
                      Disparar alerta si el estudiante reprueba al menos este número de asignaturas.
                    </small>
                  </div>
                </div>

                <!-- Canales de Notificación -->
                <div class="card p-3" style="background: rgba(0,0,0,0.02); border: 1px solid var(--border-color, rgba(255,255,255,0.08)); border-radius: 10px;">
                  <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; font-weight: 600;">
                    📨 Canales de Difusión a Acudientes
                  </h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 1.25rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem;">
                      <input
                        type="checkbox"
                        [checked]="isCanalSeleccionado('PLATAFORMA_WEB')"
                        (change)="toggleCanal('PLATAFORMA_WEB')"
                      />
                      <span>💻 Portal Web / Notificaciones App</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem;">
                      <input
                        type="checkbox"
                        [checked]="isCanalSeleccionado('EMAIL')"
                        (change)="toggleCanal('EMAIL')"
                      />
                      <span>📧 Correo Electrónico Institucional</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem;">
                      <input
                        type="checkbox"
                        [checked]="isCanalSeleccionado('SMS')"
                        (change)="toggleCanal('SMS')"
                      />
                      <span>📱 Mensajería de Texto SMS</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem;">
                      <input
                        type="checkbox"
                        [checked]="isCanalSeleccionado('WHATSAPP')"
                        (change)="toggleCanal('WHATSAPP')"
                      />
                      <span>💬 Mensajería WhatsApp</span>
                    </label>
                  </div>
                </div>

              </div>
            }

            <!-- TAB 2: PREVISUALIZACIÓN -->
            @if (tabActivo() === 'previsualizacion') {
              <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 1.25rem;">
                
                <!-- Barra de Herramientas de Previsualización -->
                <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; background: rgba(0,0,0,0.03); padding: 0.75rem 1rem; border-radius: 8px;">
                  <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 250px;">
                    <label class="form-label" style="margin: 0; font-weight: 600; font-size: 0.85rem; white-space: nowrap;">
                      Filtro Periodo:
                    </label>
                    <select
                      class="form-select"
                      style="font-size: 0.85rem; max-width: 220px;"
                      [(ngModel)]="filtroPeriodoId"
                      (change)="cargarPrevisualizacion()"
                    >
                      <option value="">Todos los periodos activos</option>
                      @for (p of periodos(); track p.id) {
                        <option [value]="p.id">{{ p.nombre }}</option>
                      }
                    </select>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline"
                      (click)="cargarPrevisualizacion()"
                      [disabled]="isLoadingPreview()"
                      title="Refrescar previsualización con los datos de calificaciones actuales"
                    >
                      🔄 Refrescar
                    </button>
                  </div>

                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <button
                      type="button"
                      class="btn btn-sm btn-primary"
                      style="background: #e11d48; border-color: #e11d48; font-weight: 600;"
                      (click)="ejecutarBarridoManual()"
                      [disabled]="isExecutingSweep() || !previewData() || previewData()!.estudiantes.length === 0"
                    >
                      <span>🚀 {{ isExecutingSweep() ? 'Despachando...' : 'Ejecutar Barrido & Notificar Ahora' }}</span>
                    </button>
                  </div>
                </div>

                <!-- KPIs Rápidos -->
                @if (previewData()) {
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="card p-3" style="text-align: center; border-left: 4px solid #ef4444;">
                      <div style="font-size: 0.8rem; color: var(--text-muted, #94a3b8); text-transform: uppercase; font-weight: 600;">
                        Estudiantes en Riesgo
                      </div>
                      <div style="font-size: 1.8rem; font-weight: 700; color: #ef4444; margin-top: 0.25rem;">
                        {{ previewData()!.totalEstudiantesEnRiesgo }}
                      </div>
                      <small class="text-muted" style="font-size: 0.72rem;">
                        ≥ {{ formConfig.minimoMateriasPerdidas }} materia(s) con nota &lt; {{ formConfig.notaCorteAprobacion }}
                      </small>
                    </div>

                    <div class="card p-3" style="text-align: center; border-left: 4px solid #10b981;">
                      <div style="font-size: 0.8rem; color: var(--text-muted, #94a3b8); text-transform: uppercase; font-weight: 600;">
                        Acudientes Contactables
                      </div>
                      <div style="font-size: 1.8rem; font-weight: 700; color: #10b981; margin-top: 0.25rem;">
                        {{ previewData()!.totalAcudientesContactables }}
                      </div>
                      <small class="text-muted" style="font-size: 0.72rem;">
                        Cuentan con email o teléfono registrado
                      </small>
                    </div>

                    <div class="card p-3" style="text-align: center; border-left: 4px solid #3b82f6;">
                      <div style="font-size: 0.8rem; color: var(--text-muted, #94a3b8); text-transform: uppercase; font-weight: 600;">
                        Tasa de Contactabilidad
                      </div>
                      <div style="font-size: 1.8rem; font-weight: 700; color: #3b82f6; margin-top: 0.25rem;">
                        {{ calcularTasaContactabilidad() }}%
                      </div>
                      <small class="text-muted" style="font-size: 0.72rem;">
                        Efectividad potencial del barrido
                      </small>
                    </div>
                  </div>
                }

                <!-- Tabla de Estudiantes Detectados -->
                @if (isLoadingPreview()) {
                  <div style="text-align: center; padding: 2.5rem 1rem;">
                    <div class="spinner" style="display: inline-block; width: 2rem; height: 2rem; border: 3px solid rgba(79, 70, 229, 0.2); border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    <p class="text-muted mt-2" style="font-size: 0.85rem;">Analizando planillas de calificaciones...</p>
                  </div>
                } @else if (!previewData() || previewData()!.estudiantes.length === 0) {
                  <div class="card p-4" style="text-align: center; background: rgba(16, 185, 129, 0.05); border: 1px dashed #10b981;">
                    <span style="font-size: 2.5rem;">🎉</span>
                    <h4 style="margin: 0.5rem 0 0.25rem 0; color: #10b981;">¡Excelente! No hay estudiantes con materias reprobadas</h4>
                    <p class="text-muted" style="margin: 0; font-size: 0.85rem;">
                      Todos los alumnos evaluados cumplen con la nota de corte aprobatoria (≥ {{ formConfig.notaCorteAprobacion }}).
                    </p>
                  </div>
                } @else {
                  <div class="table-responsive" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 8px;">
                    <table class="table table-hover align-middle mb-0" style="width: 100%; font-size: 0.85rem;">
                      <thead style="position: sticky; top: 0; background: var(--card-bg, #1e293b); z-index: 2;">
                        <tr style="border-bottom: 2px solid var(--border-color, rgba(255,255,255,0.15));">
                          <th style="padding: 0.75rem;">Estudiante & Grupo</th>
                          <th style="padding: 0.75rem;">Materias Reprobadas (&lt; {{ formConfig.notaCorteAprobacion }})</th>
                          <th style="padding: 0.75rem;">Acudiente / Contacto</th>
                          <th style="padding: 0.75rem; text-align: center;">Disponibilidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (est of previewData()!.estudiantes; track est.estudianteId) {
                          <tr style="border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                            
                            <!-- Estudiante -->
                            <td style="padding: 0.75rem; vertical-align: top;">
                              <div style="font-weight: 600; color: var(--text-color, #f8fafc);">
                                {{ est.estudianteNombre }}
                              </div>
                              <div class="text-muted" style="font-size: 0.75rem;">
                                Doc: {{ est.documento }} | Salón: <strong style="color: #6366f1;">{{ est.grupoNombre }}</strong>
                              </div>
                              <div class="text-muted" style="font-size: 0.7rem;">
                                Periodo: {{ est.periodoNombre }}
                              </div>
                            </td>

                            <!-- Materias Reprobadas -->
                            <td style="padding: 0.75rem; vertical-align: top;">
                              <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                                @for (mat of est.materiasPerdidas; track mat.asignaturaId) {
                                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); padding: 0.25rem 0.5rem; border-radius: 6px;">
                                    <span style="font-weight: 500; font-size: 0.8rem; color: #f87171;">
                                      {{ mat.asignaturaNombre }}
                                    </span>
                                    <span class="badge" style="background: #ef4444; color: white; font-weight: 700; font-size: 0.75rem; padding: 0.15rem 0.45rem;">
                                      {{ mat.notaPromedio.toFixed(1) }} ({{ mat.desempeno }})
                                    </span>
                                  </div>
                                }
                              </div>
                            </td>

                            <!-- Acudiente -->
                            <td style="padding: 0.75rem; vertical-align: top;">
                              <div style="font-weight: 600;">{{ est.acudienteNombre }}</div>
                              @if (est.acudienteEmail) {
                                <div style="font-size: 0.75rem; color: var(--text-muted, #94a3b8); display: flex; align-items: center; gap: 0.3rem;">
                                  <span>✉️</span> {{ est.acudienteEmail }}
                                </div>
                              }
                              @if (est.acudienteTelefono) {
                                <div style="font-size: 0.75rem; color: var(--text-muted, #94a3b8); display: flex; align-items: center; gap: 0.3rem;">
                                  <span>📞</span> {{ est.acudienteTelefono }}
                                </div>
                              }
                              @if (!est.acudienteEmail && !est.acudienteTelefono) {
                                <div style="font-size: 0.75rem; color: #ef4444; font-weight: 500;">
                                  ⚠️ Sin datos de contacto directos
                                </div>
                              }
                            </td>

                            <!-- Disponibilidad -->
                            <td style="padding: 0.75rem; text-align: center; vertical-align: middle;">
                              @if (est.acudienteEmail || est.acudienteTelefono) {
                                <span class="badge badge-success" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;">
                                  Listo para envío
                                </span>
                              } @else {
                                <span class="badge badge-neutral" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; color: #f59e0b;">
                                  Solo Portal Web
                                </span>
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

            <!-- TAB 3: REPORTE ÚLTIMO ENVÍO -->
            @if (tabActivo() === 'reporte' && ultimoResultadoEnvio()) {
              <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 1.25rem;">
                <div class="card p-3" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <h4 style="margin: 0; color: #10b981; font-weight: 700; font-size: 1.05rem;">
                        ✅ {{ ultimoResultadoEnvio()!.mensaje }}
                      </h4>
                      <div class="text-muted" style="font-size: 0.8rem; margin-top: 0.25rem;">
                        Fecha y Hora: {{ formatFecha(ultimoResultadoEnvio()!.fechaEjecucion) }}
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <span class="badge badge-success" style="font-size: 0.9rem; padding: 0.4rem 0.8rem;">
                        {{ ultimoResultadoEnvio()!.totalNotificacionesDespachadas }} Despachos Exitosos
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Detalle de notificados -->
                <div class="table-responsive" style="max-height: 350px; overflow-y: auto; border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 8px;">
                  <table class="table table-hover align-middle mb-0" style="width: 100%; font-size: 0.85rem;">
                    <thead style="position: sticky; top: 0; background: var(--card-bg, #1e293b); z-index: 2;">
                      <tr style="border-bottom: 2px solid var(--border-color, rgba(255,255,255,0.15));">
                        <th style="padding: 0.75rem;">Estudiante</th>
                        <th style="padding: 0.75rem;">Salón</th>
                        <th style="padding: 0.75rem;">Acudiente Notificado</th>
                        <th style="padding: 0.75rem; text-align: center;">Materias Informadas</th>
                        <th style="padding: 0.75rem; text-align: center;">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of ultimoResultadoEnvio()!.detalles; track item.estudianteId) {
                        <tr style="border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                          <td style="padding: 0.65rem 0.75rem; font-weight: 600;">{{ item.estudianteNombre }}</td>
                          <td style="padding: 0.65rem 0.75rem;">{{ item.grupo }}</td>
                          <td style="padding: 0.65rem 0.75rem;">
                            <div>{{ item.acudiente }}</div>
                            <small class="text-muted">{{ item.email || item.telefono || 'Portal Web' }}</small>
                          </td>
                          <td style="padding: 0.65rem 0.75rem; text-align: center;">
                            <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; font-weight: 600;">
                              {{ item.materiasPerdidasCount }} Asignatura(s)
                            </span>
                          </td>
                          <td style="padding: 0.65rem 0.75rem; text-align: center;">
                            <span class="badge badge-success">Enviado</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

          }
        </div>

        <!-- Footer -->
        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <div class="text-muted" style="font-size: 0.8rem;">
            * Los días seleccionados aplicarán automáticamente para el cron institucional del colegio.
          </div>
          <div class="flex items-center gap-2">
            <button (click)="cerrarModal()" class="btn btn-secondary">
              Cerrar
            </button>
            <button
              (click)="guardarConfiguracion()"
              class="btn btn-primary"
              [disabled]="isSaving()"
            >
              💾 {{ isSaving() ? 'Guardando...' : 'Guardar Parametrización' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .tab-btn {
      background: none;
      border: none;
      padding: 0.6rem 1.1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted, #94a3b8);
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn:hover {
      color: var(--text-color, #f8fafc);
    }
    .tab-btn.active {
      color: var(--primary-color, #4f46e5);
      border-bottom-color: var(--primary-color, #4f46e5);
      font-weight: 600;
    }
    .dia-card {
      background: rgba(255, 255, 255, 0.03);
    }
    .dia-card:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(79, 70, 229, 0.4);
    }
    .dia-selected {
      background: rgba(79, 70, 229, 0.12) !important;
      border-color: #4f46e5 !important;
      box-shadow: 0 0 0 1px #4f46e5;
    }
    .badge-primary {
      background-color: rgba(79, 70, 229, 0.15);
      color: #6366f1;
      border: 1px solid rgba(79, 70, 229, 0.3);
    }
    .badge-neutral {
      background-color: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .badge-success {
      background-color: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class ModalBarridoMateriasPerdidasComponent implements OnInit {
  private readonly parametrosService = inject(ParametrosService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  readonly modalManager = inject(ModalManagerService);

  @Output() close = new EventEmitter<void>();
  @Output() sweepCompleted = new EventEmitter<ResultadoBarridoEjecutado>();

  colegiosDisponibles = this.authService.colegiosDisponibles;
  colegioSeleccionadoId = signal<string>(this.authService.colegio().id);

  tabActivo = signal<'parametros' | 'previsualizacion' | 'reporte'>('parametros');
  isLoading = signal(false);
  isSaving = signal(false);
  isLoadingPreview = signal(false);
  isExecutingSweep = signal(false);

  periodos = signal<any[]>([]);
  filtroPeriodoId = '';

  // Lista canónica de días de la semana con iconos
  readonly listaDias: DiaOpcion[] = [
    { clave: DiaSemanaNotificacion.LUNES, nombre: 'Lunes', abreviatura: 'Lun', icono: '📅' },
    { clave: DiaSemanaNotificacion.MARTES, nombre: 'Martes', abreviatura: 'Mar', icono: '📅' },
    { clave: DiaSemanaNotificacion.MIERCOLES, nombre: 'Miércoles', abreviatura: 'Mié', icono: '📅' },
    { clave: DiaSemanaNotificacion.JUEVES, nombre: 'Jueves', abreviatura: 'Jue', icono: '📅' },
    { clave: DiaSemanaNotificacion.VIERNES, nombre: 'Viernes', abreviatura: 'Vie', icono: '📅' },
    { clave: DiaSemanaNotificacion.SABADO, nombre: 'Sábado', abreviatura: 'Sáb', icono: '🏖️' },
    { clave: DiaSemanaNotificacion.DOMINGO, nombre: 'Domingo', abreviatura: 'Dom', icono: '☀️' },
  ];

  // Modelo del Formulario
  formConfig: ConfiguracionAlertasAcademicas = {
    diasNotificacion: ['VIERNES'],
    barridoActivo: true,
    horaEnvio: '18:00',
    notaCorteAprobacion: 3.0,
    minimoMateriasPerdidas: 1,
    canalesNotificacion: ['PLATAFORMA_WEB', 'EMAIL'],
    colegioId: null,
  };

  previewData = signal<PrevisualizacionBarridoResponse | null>(null);
  ultimoResultadoEnvio = signal<ResultadoBarridoEjecutado | null>(null);

  ngOnInit() {
    this.modalManager.open('barridoMateriasPerdidas');
    this.cargarPeriodosAcademicos();
    this.cargarConfiguracion(this.colegioSeleccionadoId());
  }

  cargarPeriodosAcademicos() {
    this.api.get<any[]>('academico/periodos').subscribe({
      next: (res) => {
        this.periodos.set(res || []);
      },
      error: () => {
        this.periodos.set([]);
      },
    });
  }

  cambiarColegio(nuevoId: string) {
    if (!nuevoId || nuevoId === this.colegioSeleccionadoId()) return;
    this.colegioSeleccionadoId.set(nuevoId);
    this.cargarConfiguracion(nuevoId);
  }

  cargarConfiguracion(colegioId: string) {
    this.isLoading.set(true);
    this.parametrosService.obtenerConfiguracionAlertasAcademicas(colegioId).subscribe({
      next: (cfg) => {
        this.formConfig = {
          diasNotificacion: Array.isArray(cfg.diasNotificacion) ? [...cfg.diasNotificacion] : ['VIERNES'],
          barridoActivo: cfg.barridoActivo ?? true,
          horaEnvio: cfg.horaEnvio || '18:00',
          notaCorteAprobacion: Number(cfg.notaCorteAprobacion) || 3.0,
          minimoMateriasPerdidas: Number(cfg.minimoMateriasPerdidas) || 1,
          canalesNotificacion: Array.isArray(cfg.canalesNotificacion) ? [...cfg.canalesNotificacion] : ['PLATAFORMA_WEB', 'EMAIL'],
          colegioId,
        };
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la configuración de alertas');
        this.isLoading.set(false);
      },
    });
  }

  // --- Manejo de Días de la Semana ---

  isDiaSeleccionado(dia: DiaSemanaNotificacion): boolean {
    return this.formConfig.diasNotificacion.includes(dia);
  }

  toggleDia(dia: DiaSemanaNotificacion) {
    const idx = this.formConfig.diasNotificacion.indexOf(dia);
    if (idx >= 0) {
      this.formConfig.diasNotificacion.splice(idx, 1);
    } else {
      this.formConfig.diasNotificacion.push(dia);
    }
  }

  seleccionarDiasHabiles() {
    this.formConfig.diasNotificacion = [
      DiaSemanaNotificacion.LUNES,
      DiaSemanaNotificacion.MARTES,
      DiaSemanaNotificacion.MIERCOLES,
      DiaSemanaNotificacion.JUEVES,
      DiaSemanaNotificacion.VIERNES,
    ];
  }

  seleccionarTodosDias() {
    this.formConfig.diasNotificacion = this.listaDias.map((d) => d.clave);
  }

  desmarcarTodosDias() {
    this.formConfig.diasNotificacion = [];
  }

  // --- Canales de Notificación ---

  isCanalSeleccionado(canal: string): boolean {
    return this.formConfig.canalesNotificacion.includes(canal);
  }

  toggleCanal(canal: string) {
    const idx = this.formConfig.canalesNotificacion.indexOf(canal);
    if (idx >= 0) {
      this.formConfig.canalesNotificacion.splice(idx, 1);
    } else {
      this.formConfig.canalesNotificacion.push(canal);
    }
  }

  // --- Guardar Parametrización ---

  guardarConfiguracion() {
    this.isSaving.set(true);
    const colegioId = this.colegioSeleccionadoId();

    this.parametrosService
      .guardarConfiguracionAlertasAcademicas(this.formConfig, colegioId)
      .subscribe({
        next: (saved) => {
          this.formConfig = { ...saved };
          this.isSaving.set(false);
          this.toast.success('Parametrización de alertas guardada exitosamente');
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error(err?.error?.message || 'Error al guardar la parametrización de alertas');
        },
      });
  }

  // --- Previsualización y Ejecución ---

  cambiarTabPrevisualizacion() {
    this.tabActivo.set('previsualizacion');
    if (!this.previewData()) {
      this.cargarPrevisualizacion();
    }
  }

  cargarPrevisualizacion() {
    this.isLoadingPreview.set(true);
    const colegioId = this.colegioSeleccionadoId();
    const periodoId = this.filtroPeriodoId || undefined;

    this.parametrosService
      .previsualizarBarridoMateriasPerdidas(periodoId, colegioId)
      .subscribe({
        next: (res) => {
          this.previewData.set(res);
          this.isLoadingPreview.set(false);
        },
        error: (err) => {
          this.isLoadingPreview.set(false);
          this.toast.error('Error al previsualizar estudiantes con materias perdidas');
        },
      });
  }

  calcularTasaContactabilidad(): number {
    const d = this.previewData();
    if (!d || d.totalEstudiantesEnRiesgo === 0) return 100;
    return Math.round((d.totalAcudientesContactables / d.totalEstudiantesEnRiesgo) * 100);
  }

  ejecutarBarridoManual() {
    const prev = this.previewData();
    if (!prev || prev.estudiantes.length === 0) {
      this.toast.warning('No hay estudiantes en riesgo para notificar');
      return;
    }

    const confirmar = confirm(
      `¿Deseas ejecutar el barrido de calificaciones y despachar alertas a ${prev.estudiantes.length} padres de familia ahora mismo?`
    );
    if (!confirmar) return;

    this.isExecutingSweep.set(true);
    const colegioId = this.colegioSeleccionadoId();
    const periodoId = this.filtroPeriodoId || undefined;

    this.parametrosService
      .ejecutarBarridoMateriasPerdidas(periodoId, colegioId)
      .subscribe({
        next: (res) => {
          this.isExecutingSweep.set(false);
          this.ultimoResultadoEnvio.set(res);
          this.tabActivo.set('reporte');
          this.toast.success(res.mensaje);
          this.sweepCompleted.emit(res);
        },
        error: (err) => {
          this.isExecutingSweep.set(false);
          this.toast.error(err?.error?.message || 'Error al ejecutar el barrido de notificaciones');
        },
      });
  }

  formatFecha(isoStr: string): string {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoStr;
    }
  }

  cerrarModal() {
    this.modalManager.close('barridoMateriasPerdidas');
    this.close.emit();
  }
}
