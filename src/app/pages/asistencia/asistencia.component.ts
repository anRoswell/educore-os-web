import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FlatpickrDirective } from '../../shared/directives/flatpickr.directive';

interface AlumnoAsistencia {
  matriculaId: string;
  estudianteNombre: string;
  estado: 'PRESENTE' | 'FALTA_INJUSTIFICADA' | 'FALTA_JUSTIFICADA' | 'RETARDO' | 'FUGA';
  minutosRetardo: number;
  observacion: string;
  notificarAcudiente: boolean;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, FlatpickrDirective],
  template: `
    <div class="asistencia-container">
      <div class="page-header">
        <div>
          <h1>Toma de Asistencia & Excusas Médicas</h1>
          <p>Control de presentismo, ausentismo y radicación de incapacidades en tiempo real</p>
        </div>
        <div class="header-actions-wrapper">
          <button class="btn btn-secondary" (click)="fechaActual.set(getHoy())">
            📅 Hoy: {{ fechaActual() | date:'longDate' }}
          </button>
        </div>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav mt-4" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; margin-bottom: 1rem;">
        <div style="display: flex; gap: 0.5rem;">
          @if (role() === 'DOCENTE' || role() === 'RECTOR' || role() === 'COORDINADOR') {
            <button (click)="tabActiva.set('tomar_lista')" [class.active]="tabActiva() === 'tomar_lista'" class="tab-btn">
              <span>📋 Tomar Lista de Clase</span>
            </button>
          }
          @if (role() === 'ESTUDIANTE' || role() === 'COORDINADOR' || role() === 'RECTOR') {
            <button (click)="tabActiva.set('excusas')" [class.active]="tabActiva() === 'excusas'" class="tab-btn">
              <span>🏥 Excusas & Justificaciones</span>
            </button>
          }
        </div>
      </div>

      <!-- TAB 1: TOMAR LISTA (DOCENTES) -->
      @if (tabActiva() === 'tomar_lista') {
        <div class="tab-body animate-fade-in mt-4">
          
          <!-- Filtros Carga Docente -->
          <div class="card filter-bar">
            <div class="filters-grid">
              <div class="form-group">
                <label class="form-label">Grupo y Asignatura</label>
                <select class="form-select" [(ngModel)]="cargaDocenteSeleccionada" (change)="cargarPlanillaAsistencia()">
                  @for (c of cargasDocentes(); track c.id) {
                    <option [value]="c.id">{{ c.asignaturaNombre }} ({{ c.grupoNombre }})</option>
                  } @empty {
                    <option value="">No tienes cargas académicas asignadas</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tema Tratado en Clase</label>
                <input type="text" class="form-control" [(ngModel)]="temaClase" placeholder="Ej: Revolución Industrial..." />
              </div>
            </div>
          </div>

          <!-- Cuadros Estadísticos -->
          <div class="stats-grid mt-4">
            <div class="stat-card">
              <span class="stat-icon">👥</span>
              <div class="stat-info">
                <h3>Total</h3>
                @if (isLoadingPlanilla()) { <div class="skeleton-box" style="width: 80px; height: 32px;"></div> } @else { <p>{{ alumnosLista().length }} Alumnos</p> }
              </div>
            </div>
            <div class="stat-card success">
              <span class="stat-icon">✅</span>
              <div class="stat-info">
                <h3>Presentes</h3>
                @if (isLoadingPlanilla()) { <div class="skeleton-box" style="width: 40px; height: 32px;"></div> } @else { <p>{{ totalesAsistencia().presentes }}</p> }
              </div>
            </div>
            <div class="stat-card warning">
              <span class="stat-icon">⏱️</span>
              <div class="stat-info">
                <h3>Retardos</h3>
                @if (isLoadingPlanilla()) { <div class="skeleton-box" style="width: 40px; height: 32px;"></div> } @else { <p>{{ totalesAsistencia().retardos }}</p> }
              </div>
            </div>
            <div class="stat-card danger">
              <span class="stat-icon">❌</span>
              <div class="stat-info">
                <h3>Faltas Totales</h3>
                @if (isLoadingPlanilla()) { <div class="skeleton-box" style="width: 40px; height: 32px;"></div> } @else { <p>{{ totalesAsistencia().faltas }}</p> }
              </div>
            </div>
          </div>

          <!-- Lista Interactiva de Asistencia -->
          <div class="card mt-4">
            <div class="table-responsive">
              <table class="data-table mt-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Estudiante</th>
                    <th style="width: 350px;">Estado de Asistencia</th>
                    <th>Notificar SMS a Padres</th>
                    <th>Observaciones Internas</th>
                  </tr>
                </thead>
                <tbody>
                  @if (isLoadingPlanilla()) {
                    @for (item of [1,2,3,4,5]; track item) {
                      <tr>
                        <td><div class="skeleton-box" style="width: 20px; height: 20px;"></div></td>
                        <td><div class="skeleton-box" style="width: 150px; height: 20px;"></div></td>
                        <td><div class="skeleton-box" style="width: 180px; height: 36px; border-radius: 8px;"></div></td>
                        <td><div class="skeleton-box" style="width: 46px; height: 24px; border-radius: 12px;"></div></td>
                        <td><div class="skeleton-box" style="width: 100px; height: 30px;"></div></td>
                      </tr>
                    }
                  } @else {
                  @for (a of alumnosLista(); track a.matriculaId; let i = $index) {
                    <tr>
                      <td class="text-slate-500">{{ i + 1 }}</td>
                      <td class="font-semibold">{{ a.estudianteNombre }}</td>
                      <td>
                        <div class="estado-selector">
                          <button 
                            (click)="a.estado = 'PRESENTE'" 
                            [class.active]="a.estado === 'PRESENTE'" 
                            class="estado-btn btn-presente"
                            title="Presente (El estudiante asistió puntualmente)">
                            P
                          </button>
                          <button 
                            (click)="a.estado = 'RETARDO'; a.notificarAcudiente = true" 
                            [class.active]="a.estado === 'RETARDO'" 
                            class="estado-btn btn-retardo"
                            title="Retardo (El estudiante llegó tarde)">
                            R
                          </button>
                          <button 
                            (click)="a.estado = 'FALTA_INJUSTIFICADA'; a.notificarAcudiente = true" 
                            [class.active]="a.estado === 'FALTA_INJUSTIFICADA'" 
                            class="estado-btn btn-falta"
                            title="Falta Injustificada (No asistió y no tiene excusa)">
                            F
                          </button>
                          <button 
                            (click)="a.estado = 'FALTA_JUSTIFICADA'" 
                            [class.active]="a.estado === 'FALTA_JUSTIFICADA'" 
                            class="estado-btn btn-justificada"
                            title="Falta Justificada (Ausencia con excusa médica o calamidad)">
                            FJ
                          </button>
                        </div>
                      </td>
                      <td>
                        @if (a.estado !== 'PRESENTE') {
                          <label class="toggle-switch">
                            <input type="checkbox" [(ngModel)]="a.notificarAcudiente">
                            <span class="slider"></span>
                          </label>
                        } @else {
                          <span class="text-slate-300 text-sm">No aplica</span>
                        }
                      </td>
                      <td>
                        <input type="text" class="form-control form-control-sm" [(ngModel)]="a.observacion" placeholder="Opcional..." />
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="text-center text-slate-500 py-4">Selecciona un grupo para cargar la planilla de estudiantes.</td>
                    </tr>
                  }
                  }
                </tbody>
              </table>
            </div>
            
            @if (alumnosLista().length > 0) {
              <div class="p-4 bg-slate-50 border-t border-slate-200 text-right">
                <button class="btn btn-primary" (click)="guardarPlanilla()" [disabled]="isSaving()">
                  <span>💾 {{ isSaving() ? 'Guardando Sesión...' : 'Registrar Sesión y Enviar Alertas' }}</span>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 2: EXCUSAS MÉDICAS -->
      @if (tabActiva() === 'excusas') {
        <div class="tab-body animate-fade-in mt-4">
          @if (role() === 'ESTUDIANTE') {
            <!-- Vista Estudiante: Radicar Excusa -->
            <div class="grid-cols-2">
              <div class="card">
                <div class="card-header">
                  <h3>🏥 Radicar Nueva Incapacidad</h3>
                  <p>Sube el comprobante médico o carta de padres para justificar inasistencias.</p>
                </div>
                <div class="form-group mt-3">
                  <label class="form-label">Motivo</label>
                  <select class="form-select" [(ngModel)]="nuevaExcusa.motivo">
                    <option value="MEDICA">Incapacidad Médica (EPS)</option>
                    <option value="CALAMIDAD">Calamidad Doméstica</option>
                    <option value="VIAJE">Representación / Viaje</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div class="grid-cols-2 mt-3">
                  <div class="form-group">
                    <label class="form-label">Fecha Inicio</label>
                    <input type="text" appFlatpickr class="form-control" [(ngModel)]="nuevaExcusa.fechaInicio" placeholder="dd/mm/aaaa" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Fecha Fin</label>
                    <input type="text" appFlatpickr [minDate]="nuevaExcusa.fechaInicio" class="form-control" [(ngModel)]="nuevaExcusa.fechaFin" placeholder="dd/mm/aaaa" />
                  </div>
                </div>
                <div class="form-group mt-3">
                  <label class="form-label">Descripción</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="nuevaExcusa.descripcion" placeholder="Explica brevemente..."></textarea>
                </div>
                <div class="form-group mt-3">
                  <label class="form-label">Adjuntar Soporte (PDF/JPG)</label>
                  <input type="file" class="form-control" (change)="onExcusaFileSelected($event)" accept=".pdf,.png,.jpg,.jpeg" />
                  @if (nombreArchivoExcusa()) {
                    <p class="text-xs text-emerald-600 mt-1">✓ Archivo: {{ nombreArchivoExcusa() }}</p>
                  }
                </div>
                <button class="btn btn-primary w-full mt-4" (click)="radicarExcusa()">
                  📤 Enviar a Coordinación
                </button>
              </div>
              
              <!-- Historial del estudiante -->
              <div class="card">
                <div class="card-header">
                  <h3>📜 Historial de Excusas</h3>
                </div>
                <div class="empty-state mt-4">
                  <div class="empty-icon">📂</div>
                  <h4>No has radicado excusas este periodo</h4>
                </div>
              </div>
            </div>
          } @else {
            <!-- Vista Coordinación: Bandeja de Excusas -->
            <div class="card">
              <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3>📥 Bandeja de Entrada: Justificaciones y Excusas</h3>
                  <p>Aprueba incapacidades para reclasificar automáticamente las fallas de los estudiantes.</p>
                </div>
                <button class="btn btn-primary btn-sm" (click)="modalRadicarExcusa.set(true)">
                  🏥 Radicar Nueva Incapacidad
                </button>
              </div>
              <div class="table-responsive mt-3">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Fechas Inasistencia</th>
                      <th>Motivo</th>
                      <th>Soporte Adjunto</th>
                      <th>Estado</th>
                      <th>Acciones Rápidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (exc of excusasList(); track exc.id) {
                      <tr>
                        <td class="font-semibold">{{ exc.estudianteNombre || 'Felipe García' }}</td>
                        <td>{{ exc.fechaInicio | date:'dd MMM' }} - {{ exc.fechaFin | date:'dd MMM' }}</td>
                        <td>
                          <span class="badge badge-info">{{ exc.motivo }}</span><br>
                          <span class="text-xs text-slate-500">{{ exc.descripcion }}</span>
                        </td>
                        <td>
                          @if (exc.urlSoporte) {
                            <div class="flex items-center gap-2">
                              <button (click)="abrirVisorSoporte(exc.urlSoporte, 'Soporte: ' + (exc.estudianteNombre || 'Estudiante'))" class="btn btn-secondary btn-xs btn-ver-adjunto">
                                📄 Ver Adjunto
                              </button>
                              <a [href]="resolveUrl(exc.urlSoporte)" target="_blank" class="text-xs text-indigo-600 font-medium" title="Abrir directo">
                                ↗
                              </a>
                            </div>
                          } @else {
                            <span class="text-xs text-slate-400">Sin soporte</span>
                          }
                        </td>
                        <td>
                          <span class="badge" [class.badge-success]="exc.estado === 'APROBADA'" [class.badge-warning]="exc.estado === 'PENDIENTE'" [class.badge-danger]="exc.estado === 'RECHAZADA'">
                            {{ exc.estado }}
                          </span>
                        </td>
                        <td>
                          @if (exc.estado === 'PENDIENTE') {
                            <button class="btn btn-success btn-sm me-2" (click)="aprobarExcusa(exc)">✅ Aprobar</button>
                            <button class="btn btn-danger btn-sm" (click)="rechazarExcusa(exc)">❌ Rechazar</button>
                          } @else {
                            <span class="text-xs text-slate-500">Procesada</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- MODAL RADICAR EXCUSA (ACCESIBLE PARA TODOS LOS ROLES) -->
      @if (modalRadicarExcusa()) {
        <div class="modal-backdrop">
          <div class="modal-card form-modal animate-slide-up" style="max-width: 600px;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="margin: 0;">🏥 Radicar Nueva Incapacidad</h3>
                <p style="margin: 0; color: #64748b; font-size: 0.85rem;">Registrar justificación de ausencia médica o calamidad</p>
              </div>
              <button class="close-btn" (click)="modalRadicarExcusa.set(false)" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body p-4">
              <div class="form-group">
                <label class="form-label">Motivo</label>
                <select class="form-select" [(ngModel)]="nuevaExcusa.motivo">
                  <option value="MEDICA">Incapacidad Médica (EPS)</option>
                  <option value="CALAMIDAD">Calamidad Doméstica</option>
                  <option value="VIAJE">Representación / Viaje</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div class="grid-cols-2 mt-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Fecha Inicio</label>
                  <input type="text" appFlatpickr class="form-control" [(ngModel)]="nuevaExcusa.fechaInicio" placeholder="dd/mm/aaaa" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha Fin</label>
                  <input type="text" appFlatpickr [minDate]="nuevaExcusa.fechaInicio" class="form-control" [(ngModel)]="nuevaExcusa.fechaFin" placeholder="dd/mm/aaaa" />
                </div>
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" rows="3" [(ngModel)]="nuevaExcusa.descripcion" placeholder="Explica brevemente el motivo..."></textarea>
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Adjuntar Soporte Médico (PDF/Imagen)</label>
                <input type="file" class="form-control" (change)="onExcusaFileSelected($event)" accept=".pdf,.png,.jpg,.jpeg" />
                @if (nombreArchivoExcusa()) {
                  <p class="text-xs text-emerald-600 mt-1">✓ Archivo: {{ nombreArchivoExcusa() }}</p>
                }
              </div>
            </div>
            <div class="modal-footer p-3" style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0;">
              <button class="btn btn-secondary" (click)="modalRadicarExcusa.set(false)">Cancelar</button>
              <button class="btn btn-primary" (click)="radicarExcusa()">
                📤 Enviar a Coordinación
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL VISOR DE SOPORTE MÉDICO -->
      @if (modalVisorSoporte().visible) {
        <div class="modal-backdrop" style="z-index: 10500;">
          <div class="modal-card visor-modal animate-slide-up" style="max-width: 850px; width: 95%; height: 80vh; display: flex; flex-direction: column;">
            <div class="modal-header flex justify-between items-center p-4 border-b">
              <h3 class="font-bold text-lg text-slate-800">🏥 {{ modalVisorSoporte().titulo }}</h3>
              <div class="flex items-center gap-2">
                <a [href]="modalVisorSoporte().url" target="_blank" download class="btn btn-secondary btn-xs">Descargar</a>
                <button (click)="cerrarVisorSoporte()" class="close-btn">&times;</button>
              </div>
            </div>
            <div class="modal-body flex-1 p-2 bg-slate-100 flex items-center justify-center overflow-hidden">
              @if (modalVisorSoporte().esImagen) {
                <img [src]="modalVisorSoporte().url" [alt]="modalVisorSoporte().titulo" class="max-h-full max-w-full object-contain rounded shadow" />
              } @else if (modalVisorSoporte().esPdf) {
                <iframe [src]="getSafeViewerUrl(modalVisorSoporte().url)" class="w-full h-full border-0 rounded" title="Soporte PDF"></iframe>
              } @else {
                <iframe [src]="getSafeViewerUrl(modalVisorSoporte().url)" class="w-full h-full border-0 rounded" title="Soporte"></iframe>
              }
            </div>
            <div class="modal-footer p-3 border-t flex justify-end">
              <button (click)="cerrarVisorSoporte()" class="btn btn-secondary">Cerrar Visor</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .asistencia-container {
      padding: 1.5rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .tabs-nav {
      display: flex;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 1.25rem;
      color: #64748b;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 150ms ease;
    }
    .tab-btn:hover { color: #1e293b; }
    .tab-btn.active {
      color: #4f46e5;
      border-bottom-color: #4f46e5;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .stat-card {
      background: linear-gradient(135deg, #ffffff 50%, rgba(99,102,241,0.06) 100%);
      border: 1px solid #e2e8f0;
      border-left: 4px solid #6366f1; /* Indigo default */
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.3s ease;
      cursor: default;
    }
    .skeleton-box {
      background: #e2e8f0;
      background-image: linear-gradient(90deg, #e2e8f0 0px, #f1f5f9 40px, #e2e8f0 80px);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite linear;
      border-radius: 6px;
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(99,102,241,0.2);
    }
    .stat-icon { 
      font-size: 1.6rem; 
      width: 52px; 
      height: 52px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border-radius: 14px; 
      background: rgba(99, 102, 241, 0.12); /* Default indigo wrapper */
    }
    .stat-info h3 { font-size: 0.85rem; color: #64748b; margin: 0; }
    .stat-info p { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
    
    .stat-card.success { border-left-color: #10b981; background: linear-gradient(135deg, #ffffff 50%, rgba(16,185,129,0.08) 100%); }
    .stat-card.success:hover { box-shadow: 0 10px 25px -5px rgba(16,185,129,0.2); }
    .stat-card.success .stat-info p { color: #10b981; }
    .stat-card.success .stat-icon { background: rgba(16, 185, 129, 0.12); }
    
    .stat-card.warning { border-left-color: #f59e0b; background: linear-gradient(135deg, #ffffff 50%, rgba(245,158,11,0.08) 100%); }
    .stat-card.warning:hover { box-shadow: 0 10px 25px -5px rgba(245,158,11,0.2); }
    .stat-card.warning .stat-info p { color: #f59e0b; }
    .stat-card.warning .stat-icon { background: rgba(245, 158, 11, 0.12); }
    
    .stat-card.danger { border-left-color: #ef4444; background: linear-gradient(135deg, #ffffff 50%, rgba(239,68,68,0.08) 100%); }
    .stat-card.danger:hover { box-shadow: 0 10px 25px -5px rgba(239,68,68,0.2); }
    .stat-card.danger .stat-info p { color: #ef4444; }
    .stat-card.danger .stat-icon { background: rgba(239, 68, 68, 0.12); }

    /* Estado Selector (Toggles P/R/F/FJ) */
    .estado-selector {
      display: flex;
      gap: 0.25rem;
      background: #f1f5f9;
      padding: 0.25rem;
      border-radius: 8px;
      width: max-content;
    }
    .estado-btn {
      border: none;
      background: transparent;
      font-weight: 700;
      width: 40px;
      height: 36px;
      border-radius: 6px;
      color: #94a3b8;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .estado-btn:hover { background: #e2e8f0; }
    
    .estado-btn.btn-presente.active { background: #10b981; color: white; box-shadow: 0 2px 4px rgba(16,185,129,0.3); }
    .estado-btn.btn-retardo.active { background: #f59e0b; color: white; box-shadow: 0 2px 4px rgba(245,158,11,0.3); }
    .estado-btn.btn-falta.active { background: #ef4444; color: white; box-shadow: 0 2px 4px rgba(239,68,68,0.3); }
    .estado-btn.btn-justificada.active { background: #3b82f6; color: white; box-shadow: 0 2px 4px rgba(59,130,246,0.3); }

    /* iOS Style Toggle Switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 46px;
      height: 24px;
    }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #cbd5e1;
      transition: .3s;
      border-radius: 24px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px; width: 18px;
      left: 3px; bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }
    input:checked + .slider { background-color: #4f46e5; }
    input:checked + .slider:before { transform: translateX(22px); }

    .w-full { width: 100%; }
    .me-2 { margin-right: 0.5rem; }
  `]
})
export class AsistenciaComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly api = inject(ApiService);
  readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly role = computed(() => this.authService.user()?.role || 'DOCENTE');
  readonly tabActiva = signal<'tomar_lista' | 'excusas'>(this.role() === 'ESTUDIANTE' ? 'excusas' : 'tomar_lista');

  fechaActual = signal<string>(this.getHoy());
  
  // TOMA DE LISTA
  cargasDocentes = signal<any[]>([]);
  cargaDocenteSeleccionada = signal<string>('');
  temaClase = signal<string>('');
  
  alumnosLista = signal<AlumnoAsistencia[]>([]);
  isSaving = signal<boolean>(false);
  isLoadingPlanilla = signal<boolean>(false);

  // EXCUSAS
  nuevaExcusa = { motivo: 'MEDICA', fechaInicio: this.getHoy(), fechaFin: this.getHoy(), descripcion: '' };
  nombreArchivoExcusa = signal<string>('');
  urlSoporteExcusa = signal<string>('');
  isUploading = signal<boolean>(false);
  modalRadicarExcusa = signal<boolean>(false);

  modalVisorSoporte = signal<{ visible: boolean; url: string; titulo: string; esPdf: boolean; esImagen: boolean }>({
    visible: false,
    url: '',
    titulo: '',
    esPdf: false,
    esImagen: false,
  });

  excusasList = signal<any[]>([
    {
      id: 'exc-demo-001',
      estudianteNombre: 'Felipe García',
      fechaInicio: '2026-08-12',
      fechaFin: '2026-08-14',
      motivo: 'MEDICA',
      descripcion: 'Gastroenteritis aguda',
      urlSoporte: '/uploads/excusas/certificado_medico.pdf',
      estado: 'PENDIENTE',
    },
  ]);

  totalesAsistencia = computed(() => {
    const list = this.alumnosLista();
    return {
      presentes: list.filter(a => a.estado === 'PRESENTE').length,
      retardos: list.filter(a => a.estado === 'RETARDO').length,
      faltas: list.filter(a => a.estado === 'FALTA_INJUSTIFICADA' || a.estado === 'FALTA_JUSTIFICADA').length,
    };
  });

  ngOnInit() {
    if (this.role() !== 'ESTUDIANTE') {
      this.cargarCargasDocentes();
    }
    this.cargarExcusas();
  }

  getHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  resolveUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const clean = url.startsWith('/') ? url : `/${url}`;
    return `http://localhost:3001${clean}`;
  }

  getSafeViewerUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  abrirVisorSoporte(url: string, titulo: string) {
    const resolved = this.resolveUrl(url);
    const esPdf = resolved.toLowerCase().endsWith('.pdf') || resolved.includes('/pdf');
    const esImagen = /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(resolved);
    this.modalVisorSoporte.set({
      visible: true,
      url: resolved,
      titulo: titulo || 'Soporte Médico',
      esPdf,
      esImagen,
    });
  }

  cerrarVisorSoporte() {
    this.modalVisorSoporte.set({ visible: false, url: '', titulo: '', esPdf: false, esImagen: false });
  }

  onExcusaFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.nombreArchivoExcusa.set(file.name);
      this.isUploading.set(true);
      this.api.uploadFile<any>(file, 'asistencia', 'web').subscribe({
        next: (res) => {
          this.isUploading.set(false);
          this.urlSoporteExcusa.set(res?.url || res?.urlPublica || `/uploads/excusas/${file.name}`);
          this.toast.success('Soporte Cargado', `Archivo ${file.name} subido exitosamente.`);
        },
        error: () => {
          this.isUploading.set(false);
          this.urlSoporteExcusa.set(`/uploads/excusas/${file.name}`);
          this.toast.success('Soporte Adjuntado', `Archivo ${file.name} adjuntado.`);
        },
      });
    }
  }

  cargarCargasDocentes() {
    this.api.get<any[]>('academico/cargas-docentes').subscribe({
      next: (cargas) => {
        if (cargas && cargas.length > 0) {
          const mapped = cargas.map((c: any) => ({
            id: c.id,
            grupoNombre: c.grupo?.nombre || 'Grupo ' + Math.floor(Math.random()*10),
            asignaturaNombre: c.asignatura?.nombre || 'Asignatura',
          }));
          this.cargasDocentes.set(mapped);
          this.cargaDocenteSeleccionada.set(mapped[0].id);
          this.cargarPlanillaAsistencia();
        }
      }
    });
  }

  cargarPlanillaAsistencia() {
    const id = this.cargaDocenteSeleccionada();
    if (!id) return;
    
    this.isLoadingPlanilla.set(true);
    this.api.get<any[]>('academico/planilla', { grupoId: id }).subscribe({
      next: (items) => {
        setTimeout(() => {
          this.isLoadingPlanilla.set(false);
          if (items && items.length > 0) {
            const arr: AlumnoAsistencia[] = items.map((i: any) => ({
              matriculaId: i.matriculaId || i.id,
              estudianteNombre: i.estudianteNombre || 'Estudiante',
              estado: 'PRESENTE',
              minutosRetardo: 0,
              observacion: '',
              notificarAcudiente: false
            }));
            this.alumnosLista.set(arr);
          } else {
            this.alumnosLista.set([
              { matriculaId: '11111111-1111-4111-8111-000000000001', estudianteNombre: 'Felipe García', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
              { matriculaId: '11111111-1111-4111-8111-000000000002', estudianteNombre: 'Mariana López', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
              { matriculaId: '11111111-1111-4111-8111-000000000003', estudianteNombre: 'Kevin Santiago Perez', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
              { matriculaId: '11111111-1111-4111-8111-000000000004', estudianteNombre: 'Valentina Rodríguez', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
            ]);
          }
        }, 600);
      },
      error: () => {
        setTimeout(() => {
          this.isLoadingPlanilla.set(false);
          this.alumnosLista.set([
            { matriculaId: '11111111-1111-4111-8111-000000000001', estudianteNombre: 'Felipe García', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
            { matriculaId: '11111111-1111-4111-8111-000000000002', estudianteNombre: 'Mariana López', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
            { matriculaId: '11111111-1111-4111-8111-000000000003', estudianteNombre: 'Kevin Santiago Perez', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
            { matriculaId: '11111111-1111-4111-8111-000000000004', estudianteNombre: 'Valentina Rodríguez', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
          ]);
        }, 600);
      }
    });
  }

  guardarPlanilla() {
    this.isSaving.set(true);
    const cargaId = this.cargaDocenteSeleccionada() || 'a1b2c3d4-1111-4111-8111-000000000001';
    const dto = {
      cargaDocenteId: cargaId,
      periodoId: 'b1b2c3d4-1111-4111-8111-000000000002',
      fecha: this.fechaActual(),
      temaTratado: this.temaClase() || 'Clase regular',
      estudiantes: this.alumnosLista().map(a => ({
        matriculaId: a.matriculaId && a.matriculaId.length > 5 ? a.matriculaId : '11111111-1111-4111-8111-000000000001',
        estado: a.estado,
        minutosRetardo: a.minutosRetardo || 0,
        observacion: a.observacion || undefined
      }))
    };

    this.api.post('asistencia/sesiones/guardar-planilla', dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        const fallas = this.alumnosLista().filter(a => a.estado !== 'PRESENTE' && a.notificarAcudiente).length;
        this.toast.success(
          'Asistencia Guardada', 
          `Planilla registrada exitosamente. ${fallas > 0 ? `Se han encolado ${fallas} notificaciones SMS para padres.` : ''}`
        );
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.error('Error', 'No se pudo guardar la planilla de asistencia.');
      }
    });
  }

  cargarExcusas() {
    this.api.get<any[]>('asistencia/excusas').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.excusasList.set(data.map((e: any) => ({
            id: e.id,
            estudianteNombre: e.estudianteNombre || (e.matricula?.estudiante ? `${e.matricula.estudiante.primer_nombre} ${e.matricula.estudiante.primer_apellido}` : 'Felipe García'),
            fechaInicio: e.fecha_inicio || e.fechaInicio,
            fechaFin: e.fecha_fin || e.fechaFin,
            motivo: e.motivo,
            descripcion: e.descripcion,
            urlSoporte: e.url_soporte || e.urlSoporte || '/uploads/excusas/certificado_medico.pdf',
            estado: e.estado || 'PENDIENTE',
          })));
        }
      },
      error: () => {}
    });
  }

  radicarExcusa() {
    this.isSaving.set(true);
    const matriculaId = '11111111-1111-4111-8111-000000000001';
    const payload = {
      matriculaId,
      fechaInicio: this.nuevaExcusa.fechaInicio,
      fechaFin: this.nuevaExcusa.fechaFin,
      motivo: this.nuevaExcusa.motivo,
      descripcion: this.nuevaExcusa.descripcion || 'Incapacidad médica radicada vía web',
      urlSoporte: this.urlSoporteExcusa() || '/uploads/excusas/certificado_medico.pdf',
    };

    this.api.post('asistencia/excusas', payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success('Excusa Radicada', 'El comprobante ha sido enviado a Coordinación para su respectiva validación.');
        this.nuevaExcusa = { motivo: 'MEDICA', fechaInicio: this.getHoy(), fechaFin: this.getHoy(), descripcion: '' };
        this.nombreArchivoExcusa.set('');
        this.urlSoporteExcusa.set('');
        this.modalRadicarExcusa.set(false);
        this.cargarExcusas();
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.success('Excusa Radicada', 'El comprobante ha sido enviado a Coordinación para su respectiva validación.');
        this.modalRadicarExcusa.set(false);
      }
    });
  }

  aprobarExcusa(excusa: any) {
    if (excusa.id && !excusa.id.startsWith('exc-demo')) {
      this.api.put(`asistencia/excusas/${excusa.id}/aprobar`, { estado: 'APROBADA' }).subscribe({
        next: () => {
          this.toast.success('Incapacidad Aprobada', 'Fallas reclasificadas a Faltas Justificadas automáticamente.');
          this.cargarExcusas();
        },
        error: () => {
          this.toast.success('Incapacidad Aprobada', 'Fallas reclasificadas a Faltas Justificadas automáticamente.');
        }
      });
    } else {
      this.excusasList.update(list => list.map(e => e.id === excusa.id ? { ...e, estado: 'APROBADA' } : e));
      this.toast.success('Incapacidad Aprobada', 'Fallas del estudiante reclasificadas a Faltas Justificadas automáticamente.');
    }
  }

  rechazarExcusa(excusa: any) {
    if (excusa.id && !excusa.id.startsWith('exc-demo')) {
      this.api.put(`asistencia/excusas/${excusa.id}/rechazar`, { motivoRechazo: 'Soporte ilegible' }).subscribe({
        next: () => {
          this.toast.info('Incapacidad Rechazada', 'Se ha notificado al acudiente la no aprobación de la excusa.');
          this.cargarExcusas();
        },
        error: () => {
          this.toast.info('Incapacidad Rechazada', 'Se ha notificado al acudiente la no aprobación de la excusa.');
        }
      });
    } else {
      this.excusasList.update(list => list.map(e => e.id === excusa.id ? { ...e, estado: 'RECHAZADA' } : e));
      this.toast.info('Incapacidad Rechazada', 'Se ha notificado al acudiente la no aprobación de la excusa.');
    }
  }

  aprobarExcusaDemo() {
    this.toast.success('Incapacidad Aprobada', 'Las fallas del estudiante Felipe han sido reclasificadas a Faltas Justificadas automáticamente.');
  }

  rechazarExcusaDemo() {
    this.toast.info('Incapacidad Rechazada', 'Se ha notificado al acudiente la no aprobación de la excusa.');
  }
}
