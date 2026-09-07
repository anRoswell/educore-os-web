import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParametrosService, Parametro } from '../../../core/services/parametros.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { CurrencyMaskDirective } from '../../../shared/directives/currency-mask.directive';
import { ConfiguracionFinanciera } from '../../../core/enums';

@Component({
  selector: 'app-modal-configuracion-financiera',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('configuracionTesoreria') || 1100">
      <div class="modal-card card card-glass" style="max-width: 960px; width: 95vw; max-height: 90vh; display: flex; flex-direction: column;">
        <!-- Header -->
        <div class="modal-header" style="padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <div style="flex: 1;">
            <div class="flex items-center gap-2">
              <span style="font-size: 1.5rem;">⚙️</span>
              <h3 style="margin: 0;">Configuración Financiera por Institución</h3>
            </div>
            <p class="text-muted" style="margin: 0.25rem 0 0 0; font-size: 0.875rem;">
              Personalización de tarifas, fechas límites, recargos y políticas de becas por colegio
            </p>
          </div>
          <button (click)="cerrarModal()" class="close-btn" title="Cerrar">&times;</button>
        </div>

        <!-- Selector de Colegio / Institución -->
        <div style="padding: 1rem 1.5rem; background: rgba(0,0,0,0.05); border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));">
          <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 280px;">
              <label class="form-label" style="margin: 0; white-space: nowrap; font-weight: 600;">
                🏫 Escuela / Colegio:
              </label>
              <select
                class="form-select"
                style="flex: 1; font-weight: 500;"
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
              <span class="badge" [ngClass]="tieneOverrides() ? 'badge-primary' : 'badge-neutral'" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
                {{ tieneOverrides() ? '⚡ Configuración Personalizada Activa' : '🌐 Heredando Plantilla Global' }}
              </span>
              <button
                type="button"
                class="btn btn-sm btn-outline-warning"
                title="Restablecer todos los parámetros de este colegio a la plantilla del sistema"
                (click)="confirmarRestablecerDefecto()"
                [disabled]="isLoading() || !tieneOverrides()"
              >
                🔄 Restablecer Plantilla
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs de Navegación -->
        <div class="tabs-header" style="display: flex; gap: 0.5rem; padding: 0.75rem 1.5rem 0 1.5rem; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.1));">
          <button
            type="button"
            class="tab-btn"
            [class.active]="tabActivo() === 'tarifas'"
            (click)="tabActivo.set('tarifas')"
          >
            💳 Tarifas & Plazos
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="tabActivo() === 'acuerdos'"
            (click)="tabActivo.set('acuerdos')"
          >
            🤝 Acuerdos de Pago
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="tabActivo() === 'becas'"
            (click)="tabActivo.set('becas')"
          >
            🎓 Becas & Descuentos ({{ becas().length }})
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="tabActivo() === 'periodos'"
            (click)="tabActivo.set('periodos')"
          >
            📅 Cuotas por Periodo ({{ periodos().length }})
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" style="padding: 1.5rem; overflow-y: auto; flex: 1;">
          @if (isLoading()) {
            <div style="text-align: center; padding: 3rem 1rem;">
              <span class="spinner-border text-primary" style="width: 2.5rem; height: 2.5rem; display: inline-block;"></span>
              <p class="text-muted mt-2">Cargando parámetros institucionales...</p>
            </div>
          } @else {
            <!-- Tab 1: Tarifas & Plazos -->
            @if (tabActivo() === 'tarifas') {
              <div class="modal-form-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 600;">Año Lectivo Activo *</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="formConfig.anioLectivoDefecto"
                    min="2020"
                    max="2035"
                    placeholder="2026"
                  />
                  <small class="text-muted">Vigencia académica por defecto para facturación y cobros</small>
                </div>

                <div class="form-group">
                  <label class="form-label" style="font-weight: 600;">Tarifa Base Pensión Mensual ($ COP) *</label>
                  <input
                    type="text"
                    appCurrencyMask
                    class="form-control"
                    [(ngModel)]="formConfig.tarifaBasePension"
                    placeholder="$ 450.000"
                  />
                  <small class="text-muted">Monto mensual estándar aplicable a estudiantes sin beca</small>
                </div>

                <div class="form-group">
                  <label class="form-label" style="font-weight: 600;">Día Límite de Pago Oportuno (1-31) *</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="formConfig.diaLimitePagoDefecto"
                    min="1"
                    max="31"
                    placeholder="10"
                  />
                  <small class="text-muted">Día de corte de cada mes para cancelar sin generar mora</small>
                </div>

                <div class="form-group">
                  <label class="form-label" style="font-weight: 600;">Porcentaje Mensual de Mora (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    class="form-control"
                    [(ngModel)]="formConfig.moraPorcentajeDefault"
                    min="0"
                    max="10"
                    placeholder="2.0"
                  />
                  <small class="text-muted">Tasa de interés mensual aplicada tras vencer el plazo</small>
                </div>

                <div class="form-group">
                  <label class="form-label" style="font-weight: 600;">Días de Gracia sin Recargo *</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="formConfig.diasGraciaDefault"
                    min="0"
                    max="30"
                    placeholder="5"
                  />
                  <small class="text-muted">Días de tolerancia después del límite antes de liquidar mora</small>
                </div>
              </div>
            }

            <!-- Tab 2: Acuerdos de Pago -->
            @if (tabActivo() === 'acuerdos') {
              <div class="modal-form-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 600;">Día Programado de Cuotas en Acuerdos (1-30) *</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="formConfig.diaPagoAcuerdoDefecto"
                    min="1"
                    max="30"
                    placeholder="15"
                  />
                  <small class="text-muted">Día estándar fijado para la cancelación de cuotas refinanciadas</small>
                </div>

                <div class="form-group">
                  <label class="form-label" style="font-weight: 600;">Número Sugerido de Cuotas *</label>
                  <select class="form-select" [(ngModel)]="formConfig.cuotasAcuerdoDefecto">
                    <option [value]="2">2 cuotas mensuales</option>
                    <option [value]="3">3 cuotas mensuales (Estándar)</option>
                    <option [value]="4">4 cuotas mensuales</option>
                    <option [value]="6">6 cuotas mensuales</option>
                    <option [value]="10">10 cuotas mensuales</option>
                  </select>
                  <small class="text-muted">Plazo sugerido al reestructurar carteras vencidas</small>
                </div>

                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label" style="font-weight: 600;">Monto Base Sugerido de Acuerdo ($ COP) *</label>
                  <input
                    type="text"
                    appCurrencyMask
                    class="form-control"
                    [(ngModel)]="formConfig.valorDefaultAcuerdo"
                    placeholder="$ 900.000"
                  />
                  <small class="text-muted">Monto inicial sugerido cuando no hay extracto previo liquidado</small>
                </div>
              </div>
            }

            <!-- Tab 3: Becas & Descuentos CRUD -->
            @if (tabActivo() === 'becas') {
              <div>
                <!-- Formulario Agregar Nueva Beca -->
                <div class="card p-3 mb-3" style="background: rgba(var(--primary-rgb, 79, 70, 229), 0.05); border: 1px dashed var(--primary-color, #4f46e5);">
                  <h5 style="margin-top: 0; font-size: 0.95rem; font-weight: 600;">➕ Agregar Nuevo Porcentaje de Beca para este Colegio</h5>
                  <div style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr auto; gap: 0.75rem; align-items: end;">
                    <div>
                      <label class="form-label text-xs">Código *</label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevaBeca.codigo" placeholder="EJ: DEPORTIVA" />
                    </div>
                    <div>
                      <label class="form-label text-xs">Nombre del Beneficio *</label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevaBeca.nombre" placeholder="Beca Rendimiento Deportivo" />
                    </div>
                    <div>
                      <label class="form-label text-xs">Descuento (%) *</label>
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="nuevaBeca.valor" min="0" max="100" placeholder="40" />
                    </div>
                    <div>
                      <label class="form-label text-xs">Descripción</label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevaBeca.descripcion" placeholder="Convenio con liga deportiva" />
                    </div>
                    <div>
                      <button type="button" class="btn btn-primary btn-sm" (click)="agregarBeca()" [disabled]="!nuevaBeca.codigo || !nuevaBeca.nombre">
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Tabla de Becas -->
                <div class="table-responsive" style="max-height: 380px; overflow-y: auto;">
                  <table class="table table-hover align-middle mb-0" style="width: 100%; font-size: 0.875rem;">
                    <thead>
                      <tr style="background: rgba(0,0,0,0.03);">
                        <th>Código</th>
                        <th>Nombre del Descuento / Beca</th>
                        <th style="width: 110px; text-align: center;">% Beca</th>
                        <th>Descripción</th>
                        <th style="width: 90px; text-align: center;">Ámbito</th>
                        <th style="width: 120px; text-align: right;">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (b of becas(); track b.id) {
                        <tr>
                          <td><code>{{ b.codigo }}</code></td>
                          <td>
                            @if (editandoItem()?.id === b.id) {
                              <input type="text" class="form-control form-control-sm" [(ngModel)]="editandoItem()!.nombre" />
                            } @else {
                              <strong>{{ b.nombre }}</strong>
                            }
                          </td>
                          <td style="text-align: center;">
                            @if (editandoItem()?.id === b.id) {
                              <input type="number" class="form-control form-control-sm" [(ngModel)]="editandoItem()!.valor" min="0" max="100" style="text-align: center;" />
                            } @else {
                              <span class="badge badge-success" style="font-size: 0.85rem;">
                                {{ b.valor || 0 }}%
                              </span>
                            }
                          </td>
                          <td>
                            @if (editandoItem()?.id === b.id) {
                              <input type="text" class="form-control form-control-sm" [(ngModel)]="editandoItem()!.descripcion" />
                            } @else {
                              <span class="text-muted">{{ b.descripcion || '—' }}</span>
                            }
                          </td>
                          <td style="text-align: center;">
                            <span class="badge" [ngClass]="b.colegioId ? 'badge-primary' : 'badge-neutral'" style="font-size: 0.75rem;">
                              {{ b.colegioId ? 'Colegio' : 'Global' }}
                            </span>
                          </td>
                          <td style="text-align: right; white-space: nowrap;">
                            @if (editandoItem()?.id === b.id) {
                              <button class="btn btn-sm btn-success me-1" (click)="guardarEdicionItem()" title="Guardar cambios">💾</button>
                              <button class="btn btn-sm btn-secondary" (click)="cancelarEdicion()" title="Cancelar">✖</button>
                            } @else {
                              <button class="btn btn-sm btn-outline-primary me-1" (click)="iniciarEdicion(b)" title="Editar">✏️</button>
                              @if (b.colegioId) {
                                <button class="btn btn-sm btn-outline-danger" (click)="eliminarItem(b)" title="Eliminar sobreescritura">🗑️</button>
                              }
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Tab 4: Cuotas por Periodo CRUD -->
            @if (tabActivo() === 'periodos') {
              <div>
                <!-- Formulario Agregar Nuevo Periodo -->
                <div class="card p-3 mb-3" style="background: rgba(var(--primary-rgb, 79, 70, 229), 0.05); border: 1px dashed var(--primary-color, #4f46e5);">
                  <h5 style="margin-top: 0; font-size: 0.95rem; font-weight: 600;">➕ Agregar Nuevo Periodo de Cobro para este Colegio</h5>
                  <div style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr auto; gap: 0.75rem; align-items: end;">
                    <div>
                      <label class="form-label text-xs">Código *</label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevoPeriodo.codigo" placeholder="TRIMESTRE" />
                    </div>
                    <div>
                      <label class="form-label text-xs">Nombre del Periodo *</label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevoPeriodo.nombre" placeholder="Por Trimestre (3 cuotas)" />
                    </div>
                    <div>
                      <label class="form-label text-xs">Cuotas *</label>
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="nuevoPeriodo.valor" min="1" max="24" placeholder="3" />
                    </div>
                    <div>
                      <label class="form-label text-xs">Descripción</label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevoPeriodo.descripcion" placeholder="Cobros trimestrales del año" />
                    </div>
                    <div>
                      <button type="button" class="btn btn-primary btn-sm" (click)="agregarPeriodo()" [disabled]="!nuevoPeriodo.codigo || !nuevoPeriodo.nombre">
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Tabla de Periodos -->
                <div class="table-responsive" style="max-height: 380px; overflow-y: auto;">
                  <table class="table table-hover align-middle mb-0" style="width: 100%; font-size: 0.875rem;">
                    <thead>
                      <tr style="background: rgba(0,0,0,0.03);">
                        <th>Código</th>
                        <th>Nombre del Periodo</th>
                        <th style="width: 110px; text-align: center;">Cuotas</th>
                        <th>Descripción</th>
                        <th style="width: 90px; text-align: center;">Ámbito</th>
                        <th style="width: 120px; text-align: right;">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of periodos(); track p.id) {
                        <tr>
                          <td><code>{{ p.codigo }}</code></td>
                          <td>
                            @if (editandoItem()?.id === p.id) {
                              <input type="text" class="form-control form-control-sm" [(ngModel)]="editandoItem()!.nombre" />
                            } @else {
                              <strong>{{ p.nombre }}</strong>
                            }
                          </td>
                          <td style="text-align: center;">
                            @if (editandoItem()?.id === p.id) {
                              <input type="number" class="form-control form-control-sm" [(ngModel)]="editandoItem()!.valor" min="1" max="24" style="text-align: center;" />
                            } @else {
                              <span class="badge badge-info" style="font-size: 0.85rem;">
                                {{ p.valor || 1 }} cuotas
                              </span>
                            }
                          </td>
                          <td>
                            @if (editandoItem()?.id === p.id) {
                              <input type="text" class="form-control form-control-sm" [(ngModel)]="editandoItem()!.descripcion" />
                            } @else {
                              <span class="text-muted">{{ p.descripcion || '—' }}</span>
                            }
                          </td>
                          <td style="text-align: center;">
                            <span class="badge" [ngClass]="p.colegioId ? 'badge-primary' : 'badge-neutral'" style="font-size: 0.75rem;">
                              {{ p.colegioId ? 'Colegio' : 'Global' }}
                            </span>
                          </td>
                          <td style="text-align: right; white-space: nowrap;">
                            @if (editandoItem()?.id === p.id) {
                              <button class="btn btn-sm btn-success me-1" (click)="guardarEdicionItem()" title="Guardar cambios">💾</button>
                              <button class="btn btn-sm btn-secondary" (click)="cancelarEdicion()" title="Cancelar">✖</button>
                            } @else {
                              <button class="btn btn-sm btn-outline-primary me-1" (click)="iniciarEdicion(p)" title="Editar">✏️</button>
                              @if (p.colegioId) {
                                <button class="btn btn-sm btn-outline-danger" (click)="eliminarItem(p)" title="Eliminar sobreescritura">🗑️</button>
                              }
                            }
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
          <div class="text-muted" style="font-size: 0.825rem;">
            * Los cambios se aplican inmediatamente para la institución seleccionada.
          </div>
          <div class="flex items-center gap-2">
            <button (click)="cerrarModal()" class="btn btn-secondary">
              Cancelar
            </button>
            <button (click)="guardarConfiguracionGeneral()" class="btn btn-primary" [disabled]="isSaving()">
              💾 {{ isSaving() ? 'Guardando...' : 'Guardar Todo para este Colegio' }}
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
      font-size: 0.9rem;
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
    .badge-info {
      background-color: rgba(6, 182, 212, 0.15);
      color: #06b6d4;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }
    .btn-outline-warning {
      color: #f59e0b;
      border-color: rgba(245, 158, 11, 0.4);
      background: transparent;
    }
    .btn-outline-warning:hover:not(:disabled) {
      background: rgba(245, 158, 11, 0.15);
    }
  `],
})
export class ModalConfiguracionFinancieraComponent implements OnInit {
  private readonly parametrosService = inject(ParametrosService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly modalManager = inject(ModalManagerService);

  @Output() close = new EventEmitter<void>();
  @Output() configGuardada = new EventEmitter<ConfiguracionFinanciera>();

  colegiosDisponibles = this.authService.colegiosDisponibles;
  colegioSeleccionadoId = signal<string>(this.authService.colegio().id);

  tabActivo = signal<'tarifas' | 'acuerdos' | 'becas' | 'periodos'>('tarifas');
  isLoading = signal(false);
  isSaving = signal(false);

  // Datos del Formulario General
  formConfig: ConfiguracionFinanciera = {
    anioLectivoDefecto: 2026,
    tarifaBasePension: 450000,
    diaLimitePagoDefecto: 10,
    diaPagoAcuerdoDefecto: 15,
    cuotasAcuerdoDefecto: 3,
    valorDefaultAcuerdo: 900000,
    moraPorcentajeDefault: 2.0,
    diasGraciaDefault: 5,
  };

  // Catálogos reactivos
  becas = signal<Parametro[]>([]);
  periodos = signal<Parametro[]>([]);

  // Item en edición
  editandoItem = signal<Parametro | null>(null);

  // Nuevos registros
  nuevaBeca = {
    codigo: '',
    nombre: '',
    valor: '25',
    descripcion: '',
  };

  nuevoPeriodo = {
    codigo: '',
    nombre: '',
    valor: '3',
    descripcion: '',
  };

  ngOnInit() {
    this.modalManager.open('configuracionTesoreria');
    this.cargarParametrosInstitucionales(this.colegioSeleccionadoId());
  }

  tieneOverrides(): boolean {
    const hasBecasOverride = this.becas().some((b) => b.colegioId === this.colegioSeleccionadoId());
    const hasPeriodosOverride = this.periodos().some((p) => p.colegioId === this.colegioSeleccionadoId());
    return hasBecasOverride || hasPeriodosOverride;
  }

  cambiarColegio(nuevoColegioId: string) {
    if (!nuevoColegioId || nuevoColegioId === this.colegioSeleccionadoId()) return;
    this.colegioSeleccionadoId.set(nuevoColegioId);
    this.cancelarEdicion();
    this.cargarParametrosInstitucionales(nuevoColegioId);
  }

  cargarParametrosInstitucionales(colegioId: string) {
    this.isLoading.set(true);

    // 1. Configuración financiera general
    this.parametrosService.obtenerConfiguracionFinanciera(colegioId).subscribe({
      next: (cfg) => {
        this.formConfig = { ...cfg };
      },
      error: () => {
        this.toast.error('Error', 'No se pudo cargar la configuración financiera del colegio');
      },
    });

    // 2. Becas
    this.parametrosService.obtenerPorGrupo('PORCENTAJES_BECA', colegioId).subscribe({
      next: (items) => {
        this.becas.set(items);
      },
      error: () => {
        this.toast.error('Error', 'No se pudieron cargar las becas');
      },
    });

    // 3. Periodos
    this.parametrosService.obtenerPorGrupo('CUOTAS_PERIODO', colegioId).subscribe({
      next: (items) => {
        this.periodos.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error', 'No se pudieron cargar los periodos de cuotas');
        this.isLoading.set(false);
      },
    });
  }

  guardarConfiguracionGeneral() {
    this.isSaving.set(true);
    const colId = this.colegioSeleccionadoId();

    this.parametrosService.guardarConfiguracionFinanciera(this.formConfig, colId).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.toast.success(
          'Configuración Guardada',
          'Parámetros financieros actualizados con éxito para esta institución escolar.',
        );
        this.configGuardada.emit(updated);
        this.cargarParametrosInstitucionales(colId);
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.error('Error', 'No se pudo persistir la configuración financiera');
      },
    });
  }

  confirmarRestablecerDefecto() {
    if (!confirm('¿Deseas restablecer todos los parámetros personalizados de este colegio a la plantilla global por defecto?')) {
      return;
    }
    const colId = this.colegioSeleccionadoId();
    this.isLoading.set(true);

    this.parametrosService.restablecerDefecto('CONFIGURACION_FINANCIERA', colId).subscribe(() => {
      this.parametrosService.restablecerDefecto('PORCENTAJES_BECA', colId).subscribe(() => {
        this.parametrosService.restablecerDefecto('CUOTAS_PERIODO', colId).subscribe(() => {
          this.toast.success(
            'Plantilla Restaurada',
            'Se han restaurado los valores por defecto del sistema para este colegio.',
          );
          this.cargarParametrosInstitucionales(colId);
        });
      });
    });
  }

  // --- CRUD Becas ---
  agregarBeca() {
    if (!this.nuevaBeca.codigo || !this.nuevaBeca.nombre) return;
    const colId = this.colegioSeleccionadoId();

    const param: Partial<Parametro> = {
      grupo: 'PORCENTAJES_BECA',
      codigo: this.nuevaBeca.codigo.toUpperCase().trim().replace(/\\s+/g, '_'),
      nombre: this.nuevaBeca.nombre.trim(),
      valor: String(this.nuevaBeca.valor || '0'),
      descripcion: this.nuevaBeca.descripcion?.trim() || `Descuento del ${this.nuevaBeca.valor}% institucional`,
      orden: this.becas().length + 1,
      activo: true,
      colegioId: colId,
    };

    this.parametrosService.crearParametro(param, colId).subscribe({
      next: () => {
        this.toast.success('Beca Creada', `Se ha registrado el porcentaje para ${param.nombre}`);
        this.nuevaBeca = { codigo: '', nombre: '', valor: '25', descripcion: '' };
        this.cargarParametrosInstitucionales(colId);
      },
      error: () => {
        this.toast.error('Error', 'No se pudo registrar el porcentaje de beca');
      },
    });
  }

  // --- CRUD Periodos ---
  agregarPeriodo() {
    if (!this.nuevoPeriodo.codigo || !this.nuevoPeriodo.nombre) return;
    const colId = this.colegioSeleccionadoId();

    const param: Partial<Parametro> = {
      grupo: 'CUOTAS_PERIODO',
      codigo: this.nuevoPeriodo.codigo.toUpperCase().trim().replace(/\\s+/g, '_'),
      nombre: this.nuevoPeriodo.nombre.trim(),
      valor: String(this.nuevoPeriodo.valor || '1'),
      descripcion: this.nuevoPeriodo.descripcion?.trim() || `Periodo de ${this.nuevoPeriodo.valor} cuotas`,
      orden: this.periodos().length + 1,
      activo: true,
      colegioId: colId,
    };

    this.parametrosService.crearParametro(param, colId).subscribe({
      next: () => {
        this.toast.success('Periodo Creado', `Se ha registrado el periodo ${param.nombre}`);
        this.nuevoPeriodo = { codigo: '', nombre: '', valor: '3', descripcion: '' };
        this.cargarParametrosInstitucionales(colId);
      },
      error: () => {
        this.toast.error('Error', 'No se pudo registrar el periodo de cobro');
      },
    });
  }

  iniciarEdicion(item: Parametro) {
    this.editandoItem.set({ ...item });
  }

  cancelarEdicion() {
    this.editandoItem.set(null);
  }

  guardarEdicionItem() {
    const item = this.editandoItem();
    if (!item) return;
    const colId = this.colegioSeleccionadoId();

    this.parametrosService.actualizarParametro(item.id, item, colId).subscribe({
      next: () => {
        this.toast.success('Actualizado', `Parámetro ${item.nombre} actualizado correctamente.`);
        this.cancelarEdicion();
        this.cargarParametrosInstitucionales(colId);
      },
      error: () => {
        this.toast.error('Error', 'No se pudo actualizar el parámetro');
      },
    });
  }

  eliminarItem(item: Parametro) {
    if (!confirm(`¿Eliminar la personalización de "${item.nombre}" para este colegio?`)) return;
    const colId = this.colegioSeleccionadoId();

    this.parametrosService.eliminarParametro(item.id, colId).subscribe({
      next: () => {
        this.toast.success('Eliminado', `Se ha restablecido al valor global o eliminado el parámetro.`);
        this.cargarParametrosInstitucionales(colId);
      },
      error: () => {
        this.toast.error('Error', 'No se pudo eliminar el parámetro');
      },
    });
  }

  cerrarModal() {
    this.modalManager.close('configuracionTesoreria');
    this.close.emit();
  }
}
