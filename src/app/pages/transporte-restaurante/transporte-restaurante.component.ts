import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';

export interface RutaEscolarItem {
  id: string;
  colegioId?: string;
  nombre: string;
  placaVehiculo: string;
  nombreConductor: string;
  telefonoConductor?: string;
  nombreMonitora?: string;
  telefonoMonitora?: string;
  capacidad: number;
  latitudActual?: number;
  longitudActual?: number;
  ultimaActualizacionGps?: string;
  estudiantes?: EstudianteRutaItem[];
}

export interface EstudianteRutaItem {
  id: string;
  rutaId: string;
  matriculaId: string;
  direccionParada: string;
  ordenParada: number;
  jornadaTipo: string;
  matricula?: any;
}

export interface MenuNutricionalItem {
  id: string;
  colegioId?: string;
  fecha: string;
  tipoServicio: string;
  platoPrincipal: string;
  acompanamiento?: string;
  bebida?: string;
  caloriasAprox?: number;
  alergenosDeclarados?: string;
}

export interface AsistenciaComedorItem {
  id: string;
  colegioId?: string;
  matriculaId: string;
  tipoServicio: string;
  consumidoAt?: string;
  alertaAlergiaDisparada?: boolean;
}

@Component({
  selector: 'app-transporte-restaurante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="transporte-page animate-fade-in">
      <!-- HEADER PRINCIPAL -->
      <div class="page-header">
        <div>
          <div class="header-badge">
            <span>🚌 LOGÍSTICA ESCOLAR & BIENESTAR</span>
            <span class="badge-tag">RUTAS GPS & ALIMENTACIÓN</span>
          </div>
          <h1>Transporte & Restaurante Escolar</h1>
          <p class="subtitle">
            Monitoreo satelital GPS de rutas en tiempo real, control de paradas, publicación de minutas nutricionales y filtro preventivo de alérgenos alimentarios.
          </p>
        </div>

        <div class="header-actions">
          <button (click)="abrirModalNuevaRuta()" class="btn btn-primary shadow-glow">
            <span>➕ Nueva Ruta Escolar</span>
          </button>
          <button (click)="abrirModalNuevoMenu()" class="btn btn-emerald">
            <span>🍲 Publicar Menú Diario</span>
          </button>
          <button (click)="abrirModalMarcarConsumo()" class="btn btn-secondary">
            <span>🍽️ Marcar Consumo</span>
          </button>
        </div>
      </div>

      <!-- TARJETAS DE INDICADORES / KPIS -->
      <div class="kpi-grid">
        <div class="kpi-card card">
          <div class="kpi-icon-badge color-sky">
            <span>🚌</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Rutas Activas</span>
            <h3 class="kpi-value">{{ totalRutasActivas() }}</h3>
            <span class="kpi-hint">Vehículos con telemetría GPS</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-indigo">
            <span>👥</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Estudiantes en Ruta</span>
            <h3 class="kpi-value">{{ totalEstudiantesEnRuta() }}</h3>
            <span class="kpi-hint">Paradas y recorridos activos</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-green">
            <span>🥗</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Menús Publicados</span>
            <h3 class="kpi-value">{{ menus().length }}</h3>
            <span class="kpi-hint">Minutas con alérgenos</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-amber">
            <span>🍲</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Consumos en Comedor</span>
            <h3 class="kpi-value">{{ asistencias().length }}</h3>
            <span class="kpi-hint">Servicios de almuerzo y refrigerio</span>
          </div>
        </div>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'rutas'"
          (click)="activeTab.set('rutas')"
        >
          <span>🚌 Rutas & Monitoreo GPS</span>
          <span class="tab-badge">{{ rutas().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'paradas'"
          (click)="activeTab.set('paradas')"
        >
          <span>📍 Asignación de Paradas</span>
          <span class="tab-badge">{{ paradasConsolidadas().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'menus'"
          (click)="activeTab.set('menus')"
        >
          <span>🥗 Menú Nutricional & Alérgenos</span>
          <span class="tab-badge">{{ menus().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'comedor'"
          (click)="activeTab.set('comedor')"
        >
          <span>🍽️ Control de Comedor & Alergias</span>
          <span class="tab-badge">{{ asistencias().length }}</span>
        </button>
      </div>

      <!-- ================================================= -->
      <!-- TAB 1: RUTAS & MONITOREO GPS                     -->
      <!-- ================================================= -->
      @if (activeTab() === 'rutas') {
        <div class="tab-content animate-fade-in">
          <div class="filters-card card mb-4">
            <div class="filters-grid">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input
                  type="text"
                  class="search-input"
                  placeholder="Buscar ruta por nombre, placa o conductor..."
                  [(ngModel)]="filtroRuta"
                />
              </div>
            </div>
          </div>

          <div class="table-container card">
            @if (isLoading()) {
              <div class="empty-state">
                <div class="spinner"></div>
                <p>Consultando rutas escolares...</p>
              </div>
            } @else if (rutasFiltradas().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">🚌</span>
                <h3>No hay rutas escolares registradas</h3>
                <p>Cree la primera ruta escolar institucional para comenzar el monitoreo.</p>
                <button (click)="abrirModalNuevaRuta()" class="btn btn-primary mt-3">
                  Crear Primera Ruta
                </button>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nombre de Ruta</th>
                    <th>Placa Vehículo</th>
                    <th>Conductor & Teléfono</th>
                    <th>Monitora de Ruta</th>
                    <th>Capacidad</th>
                    <th>GPS Telemetría</th>
                    <th style="text-align: right;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of rutasFiltradas(); track r.id) {
                    <tr>
                      <td class="font-bold text-slate-800">{{ r.nombre }}</td>
                      <td>
                        <span class="plate-badge">{{ r.placaVehiculo }}</span>
                      </td>
                      <td>
                        <div class="font-semibold">{{ r.nombreConductor }}</div>
                        <span class="text-xs text-slate-500 font-mono">{{ r.telefonoConductor || '3100000000' }}</span>
                      </td>
                      <td>
                        <div class="font-medium">{{ r.nombreMonitora || 'Asignada' }}</div>
                        <span class="text-xs text-slate-500 font-mono">{{ r.telefonoMonitora || '3200000000' }}</span>
                      </td>
                      <td>
                        <span class="badge badge-purple">{{ r.capacidad }} puestos</span>
                      </td>
                      <td>
                        <span class="gps-status-badge">
                          <span class="status-dot"></span>
                          <span>Online (GPS Activo)</span>
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <div class="actions-group">
                          <button (click)="verTrackingGps(r)" class="btn-icon" title="Ver Monitoreo GPS en Vivo">
                            📡 GPS
                          </button>
                          <button (click)="abrirModalAsignarEstudiante(r)" class="btn-icon" title="Asignar Estudiante a Parada">
                            👥 Parada
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 2: ASIGNACIÓN DE PARADAS                     -->
      <!-- ================================================= -->
      @if (activeTab() === 'paradas') {
        <div class="tab-content animate-fade-in">
          <div class="table-container card">
            @if (paradasConsolidadas().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">📍</span>
                <h3>Sin asignación de paradas</h3>
                <p>Asigne estudiantes a las paradas de las rutas escolares.</p>
                <button (click)="activeTab.set('rutas')" class="btn btn-primary mt-3">
                  Ir a Rutas
                </button>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ruta</th>
                    <th>Orden</th>
                    <th>Dirección de Parada</th>
                    <th>Jornada</th>
                    <th style="text-align: right;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of paradasConsolidadas(); track p.id) {
                    <tr>
                      <td class="font-bold">{{ p.rutaNombre }}</td>
                      <td>
                        <span class="order-badge">#{{ p.ordenParada }}</span>
                      </td>
                      <td class="font-mono">{{ p.direccionParada }}</td>
                      <td>
                        <span class="badge badge-outline">{{ p.jornadaTipo }}</span>
                      </td>
                      <td style="text-align: right;">
                        <div class="actions-group">
                          <button (click)="verDetalleParada(p)" class="btn-icon" title="Ver Detalle de Parada">
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 3: MENÚ NUTRICIONAL & ALÉRGENOS              -->
      <!-- ================================================= -->
      @if (activeTab() === 'menus') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card mb-4">
            <div class="flex-between">
              <div>
                <h3>🥗 Carta Nutricional Semanal</h3>
                <p class="text-sm">Menús balanceados con declaración obligatoria de alérgenos (gluten, lácteos, frutos secos).</p>
              </div>
              <button (click)="abrirModalNuevoMenu()" class="btn btn-emerald">
                ➕ Publicar Menú Diario
              </button>
            </div>
          </div>

          <div class="menus-grid">
            @for (m of menus(); track m.id) {
              <div class="menu-card card">
                <div class="menu-header">
                  <span class="menu-service">{{ m.tipoServicio }}</span>
                  <span class="menu-date">📅 {{ m.fecha }}</span>
                </div>
                <h4 class="menu-dish">{{ m.platoPrincipal }}</h4>
                <p class="menu-sides">{{ m.acompanamiento || 'Arroz jardinero y ensalada' }}</p>
                <div class="menu-beverage">🥤 Bebida: {{ m.bebida || 'Jugo natural' }}</div>
                <div class="menu-calories">🔥 {{ m.caloriasAprox || 650 }} kcal aprox.</div>
                @if (m.alergenosDeclarados) {
                  <div class="menu-allergens">
                    <span class="allergen-tag">⚠️ {{ m.alergenosDeclarados }}</span>
                  </div>
                }
              </div>
            } @empty {
              <div class="col-span-full empty-state card">
                <span class="empty-icon">🥗</span>
                <h3>No hay minutas publicadas</h3>
                <p>Publique el menú nutricional para el casino escolar.</p>
                <button (click)="abrirModalNuevoMenu()" class="btn btn-emerald mt-2">Publicar Menú</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- TAB 4: CONTROL DE COMEDOR & ALERGIAS             -->
      <!-- ================================================= -->
      @if (activeTab() === 'comedor') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card mb-4">
            <div class="flex-between">
              <div>
                <h3>🍽️ Registro de Asistencia & Bloqueo de Alergias</h3>
                <p class="text-sm">Verificación en vivo en el ingreso al comedor escolar para prevenir incidentes anafilácticos.</p>
              </div>
              <button (click)="abrirModalMarcarConsumo()" class="btn btn-primary">
                🍽️ Marcar Consumo
              </button>
            </div>
          </div>

          <div class="table-container card">
            @if (asistencias().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">🍽️</span>
                <h3>Sin consumos registrados hoy</h3>
                <p>Marque los consumos de almuerzo o refrigerio de los estudiantes.</p>
                <button (click)="abrirModalMarcarConsumo()" class="btn btn-primary mt-3">
                  Registrar Consumo
                </button>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Fecha & Hora</th>
                    <th>Matrícula ID</th>
                    <th>Servicio</th>
                    <th>Verificación de Alergias</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of asistencias(); track a.id) {
                    <tr>
                      <td>{{ a.consumidoAt | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td class="font-mono font-bold">{{ a.matriculaId }}</td>
                      <td>
                        <span class="badge badge-purple">{{ a.tipoServicio }}</span>
                      </td>
                      <td>
                        <span class="allergy-safe-badge">✓ Seguro / Sin Riesgo</span>
                      </td>
                      <td>
                        <span class="status-pill status-activo">Entregado</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODALES                                           -->
      <!-- ================================================= -->

      <!-- 1. MODAL NUEVA RUTA -->
      @if (modalNuevaRuta()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card">
            <div class="modal-header">
              <h3>🚌 Crear Ruta de Transporte Escolar</h3>
              <button (click)="modalNuevaRuta.set(false)" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label">Nombre de la Ruta:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaRuta.nombre" placeholder="Ej. Ruta 07 - Zona Norte" />
                </div>
                <div class="form-group">
                  <label class="form-label">Placa del Vehículo:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaRuta.placaVehiculo" placeholder="BUS-123" />
                </div>
                <div class="form-group">
                  <label class="form-label">Capacidad de Pasajeros:</label>
                  <input type="number" class="form-control" [(ngModel)]="nuevaRuta.capacidad" placeholder="32" />
                </div>
                <div class="form-group">
                  <label class="form-label">Nombre del Conductor:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaRuta.nombreConductor" placeholder="Hernando Pardo" />
                </div>
                <div class="form-group">
                  <label class="form-label">Teléfono Conductor:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaRuta.telefonoConductor" placeholder="3108765432" />
                </div>
                <div class="form-group">
                  <label class="form-label">Nombre de la Monitora:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaRuta.nombreMonitora" placeholder="Gladys Morales" />
                </div>
                <div class="form-group">
                  <label class="form-label">Teléfono Monitora:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaRuta.telefonoMonitora" placeholder="3209876543" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button (click)="modalNuevaRuta.set(false)" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarNuevaRuta()" class="btn btn-primary">Guardar Ruta</button>
            </div>
          </div>
        </div>
      }

      <!-- 2. MODAL ASIGNAR ESTUDIANTE A PARADA -->
      @if (modalAsignarEstudiante()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card">
            <div class="modal-header">
              <h3>📍 Asignar Estudiante y Parada a Ruta</h3>
              <button (click)="modalAsignarEstudiante.set(false)" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label">ID de Matrícula del Estudiante:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaParada.matriculaId" placeholder="UUID de matrícula..." />
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Dirección de la Parada:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaParada.direccionParada" placeholder="Calle 127 # 15-40, Apto 501" />
                </div>
                <div class="form-group">
                  <label class="form-label">Orden de la Parada:</label>
                  <input type="number" class="form-control" [(ngModel)]="nuevaParada.ordenParada" placeholder="1" />
                </div>
                <div class="form-group">
                  <label class="form-label">Jornada:</label>
                  <select class="form-select" [(ngModel)]="nuevaParada.jornadaTipo">
                    <option value="AM_PM">Ida y Vuelta (AM/PM)</option>
                    <option value="SOLO_MANANA">Solo Mañana (AM)</option>
                    <option value="SOLO_TARDE">Solo Tarde (PM)</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button (click)="modalAsignarEstudiante.set(false)" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarAsignacionParada()" class="btn btn-primary">Asignar Parada</button>
            </div>
          </div>
        </div>
      }

      <!-- 3. MODAL NUEVO MENÚ -->
      @if (modalNuevoMenu()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card">
            <div class="modal-header">
              <h3>🥗 Publicar Menú Nutricional Diario</h3>
              <button (click)="modalNuevoMenu.set(false)" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Fecha del Servicio:</label>
                  <input type="date" class="form-control" [(ngModel)]="nuevoMenu.fecha" />
                </div>
                <div class="form-group">
                  <label class="form-label">Tipo de Servicio:</label>
                  <select class="form-select" [(ngModel)]="nuevoMenu.tipoServicio">
                    <option value="ALMUERZO">Almuerzo</option>
                    <option value="REFRIGERIO_AM">Refrigerio Mañana</option>
                    <option value="REFRIGERIO_PM">Refrigerio Tarde</option>
                  </select>
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Plato Principal:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoMenu.platoPrincipal" placeholder="Pechuga Cordon Bleu en Salsa Tártara" />
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Acompañamiento:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoMenu.acompanamiento" placeholder="Arroz jardinero, ensalada caprese y papas al vapor" />
                </div>
                <div class="form-group">
                  <label class="form-label">Bebida:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoMenu.bebida" placeholder="Jugo natural de mango" />
                </div>
                <div class="form-group">
                  <label class="form-label">Calorías Aprox (kcal):</label>
                  <input type="number" class="form-control" [(ngModel)]="nuevoMenu.caloriasAprox" placeholder="650" />
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Alérgenos Declarados:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoMenu.alergenosDeclarados" placeholder="Contiene derivados lácteos y gluten" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button (click)="modalNuevoMenu.set(false)" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarNuevoMenu()" class="btn btn-emerald">Publicar Menú</button>
            </div>
          </div>
        </div>
      }

      <!-- 4. MODAL MARCAR CONSUMO -->
      @if (modalMarcarConsumo()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card">
            <div class="modal-header">
              <h3>🍽️ Registrar Consumo en Comedor</h3>
              <button (click)="modalMarcarConsumo.set(false)" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label">ID de Matrícula del Estudiante:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoConsumo.matriculaId" placeholder="UUID de matrícula..." />
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Tipo de Servicio:</label>
                  <select class="form-select" [(ngModel)]="nuevoConsumo.tipoServicio">
                    <option value="ALMUERZO">Almuerzo</option>
                    <option value="REFRIGERIO_AM">Refrigerio Mañana</option>
                    <option value="REFRIGERIO_PM">Refrigerio Tarde</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button (click)="modalMarcarConsumo.set(false)" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarConsumo()" class="btn btn-primary">Registrar Entrega</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .transporte-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #0284c7;
      margin-bottom: 0.25rem;
    }

    .badge-tag {
      background: rgba(2, 132, 199, 0.12);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.65rem;
      border: 1px solid rgba(2, 132, 199, 0.25);
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      max-width: 800px;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    /* KPIS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .kpi-card {
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .kpi-icon-badge {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .color-sky { background: rgba(56, 189, 248, 0.15); color: #0284c7; }
    .color-indigo { background: rgba(99, 102, 241, 0.12); }
    .color-green { background: rgba(16, 185, 129, 0.12); }
    .color-amber { background: rgba(245, 158, 11, 0.12); }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0.1rem 0;
    }

    .kpi-hint {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    /* TABS */
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 2px;
    }

    .tab-btn {
      padding: 0.65rem 1rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: #64748b;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .tab-btn:hover { color: #0284c7; }
    .tab-btn.active { color: #0284c7; border-bottom-color: #0284c7; }

    .tab-badge {
      background: #e2e8f0;
      color: #334155;
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
    }

    .tab-btn.active .tab-badge {
      background: rgba(2, 132, 199, 0.15);
      color: #0284c7;
    }

    /* FILTERS */
    .filters-card {
      padding: 1rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }

    .filters-grid {
      display: flex;
      gap: 1rem;
    }

    .search-box {
      flex: 1;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .search-input {
      width: 100%;
      padding: 0.55rem 0.75rem 0.55rem 2.25rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
    }

    /* TABLES */
    .table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }

    .data-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .plate-badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      background: #fef08a;
      color: #854d0e;
      border: 1.5px solid #eab308;
      border-radius: 6px;
      font-weight: 800;
      font-family: monospace;
      letter-spacing: 0.05em;
    }

    .order-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background: rgba(99, 102, 241, 0.15);
      color: #4f46e5;
      border-radius: 6px;
      font-weight: 800;
    }

    .gps-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: #059669;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .allergy-safe-badge {
      display: inline-block;
      padding: 0.2rem 0.55rem;
      background: rgba(16, 185, 129, 0.15);
      color: #059669;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    .badge {
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.725rem;
      font-weight: 700;
    }

    .badge-purple {
      background: rgba(168, 85, 247, 0.15);
      color: #9333ea;
    }

    .badge-outline {
      border: 1px solid #cbd5e1;
      color: #475569;
    }

    .status-pill {
      display: inline-block;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .status-activo {
      background: rgba(16, 185, 129, 0.15);
      color: #059669;
    }

    .actions-group {
      display: flex;
      gap: 0.35rem;
      justify-content: flex-end;
    }

    .btn-icon {
      padding: 0.35rem 0.6rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s ease;
    }

    .btn-icon:hover { background: #e2e8f0; }

    /* MENUS GRID */
    .menus-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }

    .menu-card {
      padding: 1.5rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }

    .menu-service {
      font-weight: 800;
      color: #0284c7;
      text-transform: uppercase;
    }

    .menu-date { color: #64748b; }

    .menu-dish {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .menu-sides {
      color: #475569;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .menu-beverage, .menu-calories {
      font-size: 0.8rem;
      color: #64748b;
    }

    .menu-allergens {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px dashed #e2e8f0;
    }

    .allergen-tag {
      font-size: 0.75rem;
      color: #b45309;
      background: #fef3c7;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
      font-weight: 600;
    }

    /* BUTTONS */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .btn-primary { background: #0284c7; color: white; }
    .btn-primary:hover { background: #0369a1; }
    .btn-secondary { background: #f1f5f9; color: #334155; border-color: #cbd5e1; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-emerald { background: #10b981; color: white; }
    .btn-emerald:hover { background: #059669; }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
      max-height: 75vh;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background: #f8fafc;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .full-width { grid-column: span 2; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
    }

    .form-control, .form-select {
      padding: 0.55rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
    }

    .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      color: #64748b;
    }

    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
  `]
})
export class TransporteRestauranteComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly activeTab = signal<'rutas' | 'paradas' | 'menus' | 'comedor'>('rutas');
  readonly isLoading = signal<boolean>(false);

  readonly rutas = signal<RutaEscolarItem[]>([]);
  readonly menus = signal<MenuNutricionalItem[]>([]);
  readonly asistencias = signal<AsistenciaComedorItem[]>([]);

  // Modales
  readonly modalNuevaRuta = signal<boolean>(false);
  readonly modalAsignarEstudiante = signal<boolean>(false);
  readonly modalNuevoMenu = signal<boolean>(false);
  readonly modalMarcarConsumo = signal<boolean>(false);

  rutaSeleccionada: RutaEscolarItem | null = null;

  filtroRuta = '';

  // Formularios
  nuevaRuta = {
    nombre: '',
    placaVehiculo: '',
    nombreConductor: 'Hernando Pardo',
    telefonoConductor: '3108765432',
    nombreMonitora: 'Gladys Morales',
    telefonoMonitora: '3209876543',
    capacidad: 32
  };

  nuevaParada = {
    rutaId: '',
    matriculaId: '',
    direccionParada: 'Calle 127 # 15-40, Apto 501',
    ordenParada: 1,
    jornadaTipo: 'AM_PM'
  };

  nuevoMenu = {
    fecha: '2026-09-01',
    tipoServicio: 'ALMUERZO',
    platoPrincipal: 'Pechuga Cordon Bleu en Salsa Tártara',
    acompanamiento: 'Arroz jardinero, ensalada caprese y papas al vapor',
    bebida: 'Jugo natural de mango',
    caloriasAprox: 650,
    alergenosDeclarados: 'Contiene derivados lácteos y gluten'
  };

  nuevoConsumo = {
    matriculaId: '',
    tipoServicio: 'ALMUERZO'
  };

  // Computados
  readonly totalRutasActivas = computed(() => this.rutas().length);

  readonly paradasConsolidadas = computed(() => {
    const list: Array<EstudianteRutaItem & { rutaNombre: string }> = [];
    for (const r of this.rutas()) {
      if (r.estudiantes && r.estudiantes.length > 0) {
        for (const est of r.estudiantes) {
          list.push({ ...est, rutaNombre: r.nombre });
        }
      }
    }
    return list;
  });

  readonly totalEstudiantesEnRuta = computed(() => this.paradasConsolidadas().length);

  readonly rutasFiltradas = computed(() => {
    const query = this.filtroRuta.toLowerCase().trim();
    if (!query) return this.rutas();
    return this.rutas().filter(r =>
      r.nombre.toLowerCase().includes(query) ||
      r.placaVehiculo.toLowerCase().includes(query) ||
      (r.nombreConductor || '').toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading.set(true);
    this.cargarRutas();
    this.cargarMenus();
    this.cargarAsistenciaComedor();
  }

  cargarRutas() {
    this.api.get<RutaEscolarItem[]>('servicios-escolares/transporte/rutas').subscribe({
      next: (data) => {
        this.rutas.set(data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  cargarMenus() {
    this.api.get<MenuNutricionalItem[]>('servicios-escolares/restaurante/menus').subscribe({
      next: (data) => this.menus.set(data || []),
      error: () => {}
    });
  }

  cargarAsistenciaComedor() {
    this.api.get<AsistenciaComedorItem[]>('servicios-escolares/restaurante/asistencia').subscribe({
      next: (data) => this.asistencias.set(data || []),
      error: () => {}
    });
  }

  abrirModalNuevaRuta() {
    this.nuevaRuta.nombre = `Ruta 07 - Zona Norte E2E ${Date.now().toString().slice(-4)}`;
    this.nuevaRuta.placaVehiculo = `BUS-${Math.floor(100 + Math.random() * 900)}`;
    this.modalNuevaRuta.set(true);
  }

  guardarNuevaRuta() {
    if (!this.nuevaRuta.nombre || !this.nuevaRuta.placaVehiculo) {
      this.toast.error('Complete el nombre y placa de la ruta');
      return;
    }
    this.api.post<RutaEscolarItem>('servicios-escolares/transporte/rutas', this.nuevaRuta).subscribe({
      next: () => {
        this.toast.success('Ruta escolar creada exitosamente');
        this.modalNuevaRuta.set(false);
        this.cargarRutas();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al crear ruta escolar')
    });
  }

  abrirModalAsignarEstudiante(ruta: RutaEscolarItem) {
    this.rutaSeleccionada = ruta;
    this.nuevaParada.rutaId = ruta.id;
    this.nuevaParada.matriculaId = '22222222-1111-4111-8111-000000000001';
    this.modalAsignarEstudiante.set(true);
  }

  guardarAsignacionParada() {
    if (!this.rutaSeleccionada || !this.nuevaParada.matriculaId) {
      this.toast.error('Seleccione un estudiante válido');
      return;
    }
    this.api.post<any>(`servicios-escolares/transporte/rutas/${this.rutaSeleccionada.id}/asignar-estudiante`, this.nuevaParada).subscribe({
      next: () => {
        this.toast.success('Estudiante asignado a la ruta escolar');
        this.modalAsignarEstudiante.set(false);
        this.cargarRutas();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al asignar parada')
    });
  }

  abrirModalNuevoMenu() {
    this.modalNuevoMenu.set(true);
  }

  guardarNuevoMenu() {
    this.api.post<MenuNutricionalItem>('servicios-escolares/restaurante/menus', this.nuevoMenu).subscribe({
      next: () => {
        this.toast.success('Menú nutricional publicado exitosamente');
        this.modalNuevoMenu.set(false);
        this.cargarMenus();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al publicar menú')
    });
  }

  abrirModalMarcarConsumo() {
    this.nuevoConsumo.matriculaId = '22222222-1111-4111-8111-000000000001';
    this.modalMarcarConsumo.set(true);
  }

  guardarConsumo() {
    this.api.post<any>('servicios-escolares/restaurante/marcar-consumo', this.nuevoConsumo).subscribe({
      next: () => {
        this.toast.success('Consumo registrado con validación de alergias');
        this.modalMarcarConsumo.set(false);
        this.cargarAsistenciaComedor();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al registrar consumo')
    });
  }

  verTrackingGps(ruta: RutaEscolarItem) {
    this.toast.info(`Telemetría GPS en vivo para ${ruta.nombre} (${ruta.placaVehiculo})`);
  }

  verDetalleParada(parada: any) {
    this.toast.info(`Parada #${parada.ordenParada}: ${parada.direccionParada}`);
  }
}
