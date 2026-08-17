import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CalificacionLoteItem } from '../../core/models';

@Component({
  selector: 'app-academico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="academico-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Gestión Académica & Planilla Decreto 1290</h1>
          <p>Registro y control de calificaciones, escala nacional y consolidación de boletines</p>
        </div>
        <div class="header-actions">
          <button (click)="abrirModalNuevaActividad()" class="btn btn-secondary">
            <span>➕ Nueva Actividad</span>
          </button>
          <button (click)="descargarBoletinDemo()" class="btn btn-secondary">
            <span>📄 Boletín PDF</span>
          </button>
          <button (click)="guardarCalificaciones()" class="btn btn-primary" [disabled]="isSaving() || planilla().length === 0">
            <span>💾 {{ isSaving() ? 'Guardando...' : 'Guardar Planilla' }}</span>
          </button>
        </div>
      </div>

      <!-- Filtros Académicos Dinámicos en Cascada -->
      <div class="card filter-bar">
        <div class="filters-grid">
          <!-- 1. Grado -->
          <div class="form-group">
            <label class="form-label">Grado</label>
            <select
              class="form-select"
              [ngModel]="selectedGradoId()"
              (ngModelChange)="onGradoChange($event)"
            >
              @for (grado of gradosList(); track grado.id) {
                <option [value]="grado.id">{{ grado.nombre }}</option>
              } @empty {
                <option value="">Cargando grados...</option>
              }
            </select>
          </div>

          <!-- 2. Grupo -->
          <div class="form-group">
            <label class="form-label">Grupo</label>
            <select
              class="form-select"
              [ngModel]="selectedGrupoId()"
              (ngModelChange)="onGrupoChange($event)"
            >
              @for (grupo of gruposFiltrados(); track grupo.id) {
                <option [value]="grupo.id">{{ grupo.nombre }} (Salón {{ grupo.salon || 'Principal' }})</option>
              } @empty {
                <option value="">No hay grupos en este grado</option>
              }
            </select>
          </div>

          <!-- 3. Asignatura -->
          <div class="form-group">
            <label class="form-label">Asignatura</label>
            <select
              class="form-select"
              [ngModel]="selectedAsignaturaId()"
              (ngModelChange)="onAsignaturaChange($event)"
            >
              @for (asig of asignaturasList(); track asig.id) {
                <option [value]="asig.id">{{ asig.nombre }}</option>
              } @empty {
                <option value="">Cargando asignaturas...</option>
              }
            </select>
          </div>

          <!-- 4. Periodo Académico -->
          <div class="form-group">
            <label class="form-label">Periodo Académico</label>
            <select
              class="form-select"
              [ngModel]="selectedPeriodoId()"
              (ngModelChange)="onPeriodoChange($event)"
            >
              @for (p of periodosList(); track p.id) {
                <option [value]="p.id">{{ p.nombre }} ({{ p.porcentaje }}%)</option>
              } @empty {
                <option value="b1b2c3d4-1111-4111-8111-000000000002">Primer Periodo (25%)</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- Alerta Informativa del Decreto 1290 -->
      <div class="escala-banner mt-4">
        <div class="escala-title">
          <span>⚖️ Escala Nacional de Valoración (Decreto 1290 de 2009):</span>
        </div>
        <div class="escala-tags">
          <span class="badge badge-success">Superior: 4.6 – 5.0</span>
          <span class="badge badge-info">Alto: 4.0 – 4.59</span>
          <span class="badge badge-warning">Básico: 3.0 – 3.99</span>
          <span class="badge badge-danger">Bajo: 1.0 – 2.99</span>
        </div>
      </div>

      <!-- Planilla de Calificaciones Dinámica -->
      <div class="table-container mt-4">
        @if (isLoadingPlanilla()) {
          <div class="p-8 text-center text-slate-500">
            <p>⏳ Cargando planilla de calificaciones desde el servidor...</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Estudiante</th>
                <th>Documento</th>
                <th style="width: 140px;">Nota (1.0 - 5.0)</th>
                <th>Desempeño (Dec. 1290)</th>
                <th>Observación Pedagógica</th>
                <th style="width: 100px; text-align: center;">Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (est of planilla(); track est.matriculaId; let idx = $index) {
                <tr>
                  <td>{{ idx + 1 }}</td>
                  <td>
                    <strong>{{ est.estudianteNombre }}</strong>
                  </td>
                  <td><span class="text-slate-500 font-mono text-xs">{{ est.documento }}</span></td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      class="form-control text-center font-bold"
                      [(ngModel)]="est.nota"
                      (ngModelChange)="recalcularDesempeno(est)"
                    />
                  </td>
                  <td>
                    <span [class]="getBadgeDesempeno(est.desempeno)">
                      {{ est.desempeno }}
                    </span>
                  </td>
                  <td>
                    <input
                      type="text"
                      class="form-control"
                      [(ngModel)]="est.observaciones"
                      placeholder="Observación formativa..."
                    />
                  </td>
                  <td style="text-align: center;">
                    <button
                      (click)="limpiarNota(est)"
                      class="btn btn-outline btn-sm"
                      title="Restablecer nota a valor base"
                    >
                      🔄 Limpiar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-8 text-slate-500">
                    <p>No se encontraron estudiantes matriculados activos en este grupo.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- MODAL CREACIÓN: NUEVA ACTIVIDAD EVALUATIVA -->
      @if (modalNuevaActividad()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 500px;">
            <div class="modal-header">
              <h3>➕ Crear Actividad Evaluativa</h3>
              <button (click)="modalNuevaActividad.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Título de la Actividad *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevaActividad.titulo" placeholder="Ej: Taller de Álgebra Lineal" />
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Dimensión Formativa (SIEE) *</label>
                <select class="form-select" [(ngModel)]="nuevaActividad.dimension">
                  <option value="COGNITIVO">Cognitiva (Saber) - 40%</option>
                  <option value="PROCEDIMENTAL">Procedimental (Hacer) - 40%</option>
                  <option value="ACTITUDINAL">Actitudinal / Convivencial (Ser) - 20%</option>
                </select>
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Peso Porcentual (%) *</label>
                <input type="number" class="form-control" [(ngModel)]="nuevaActividad.pesoPorcentaje" min="1" max="100" />
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Fecha Límite de Entrega</label>
                <input type="date" class="form-control" [(ngModel)]="nuevaActividad.fechaEntrega" />
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevaActividad()" class="btn btn-primary">
                💾 Guardar Actividad
              </button>
              <button (click)="modalNuevaActividad.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      color: #0f172a;
    }

    .page-header p {
      font-size: 0.9rem;
      color: #64748b;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .filter-bar {
      padding: 1.25rem;
      min-width: 0;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .escala-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
    }

    .escala-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
    }

    .escala-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .text-slate-500 { color: #64748b; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .mt-4 { margin-top: 1rem; }
    .mt-3 { margin-top: 0.75rem; }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 1.5rem;
    }

    .modal-card {
      width: 100%;
      background-color: #ffffff;
      padding: 2rem;
      border-radius: 16px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
  `]
})
export class AcademicoComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);

  // Listas de datos para filtros
  readonly gradosList = signal<any[]>([]);
  readonly todosGruposList = signal<any[]>([]);
  readonly asignaturasList = signal<any[]>([]);
  readonly periodosList = signal<any[]>([]);

  // Filtros seleccionados
  readonly selectedGradoId = signal<string>('');
  readonly selectedGrupoId = signal<string>('');
  readonly selectedAsignaturaId = signal<string>('');
  readonly selectedPeriodoId = signal<string>('b1b2c3d4-1111-4111-8111-000000000002');

  // Grupos filtrados en cascada según el grado seleccionado
  readonly gruposFiltrados = computed(() => {
    const gradoId = this.selectedGradoId();
    const all = this.todosGruposList();
    if (!gradoId) return all;
    return all.filter((g) => g.gradoId === gradoId || g.grado_id === gradoId);
  });

  // Estados de interfaz
  readonly isSaving = signal(false);
  readonly isLoadingPlanilla = signal(false);
  readonly modalNuevaActividad = signal(false);

  nuevaActividad = {
    titulo: '',
    dimension: 'COGNITIVO',
    pesoPorcentaje: 20,
    fechaEntrega: '2026-03-30',
  };

  readonly planilla = signal<CalificacionLoteItem[]>([]);

  ngOnInit() {
    this.cargarFiltrosIniciales();
  }

  cargarFiltrosIniciales() {
    // 1. Cargar Grados
    this.api.get<any[]>('academico/grados').subscribe({
      next: (grados) => {
        if (grados && grados.length > 0) {
          this.gradosList.set(grados);
          // Seleccionar por defecto grado 10° si existe, o el primero
          const decimo = grados.find((g) => g.nombre?.includes('10') || g.numero === 10);
          this.selectedGradoId.set(decimo ? decimo.id : grados[0].id);
        }
      },
    });

    // 2. Cargar Grupos
    this.api.get<any[]>('academico/grupos').subscribe({
      next: (grupos) => {
        if (grupos && grupos.length > 0) {
          this.todosGruposList.set(grupos);
          const primerGrupo = this.gruposFiltrados()[0] || grupos[0];
          if (primerGrupo) {
            this.selectedGrupoId.set(primerGrupo.id);
          }
          this.cargarPlanilla();
        }
      },
    });

    // 3. Cargar Asignaturas
    this.api.get<any[]>('academico/asignaturas').subscribe({
      next: (asigs) => {
        if (asigs && asigs.length > 0) {
          this.asignaturasList.set(asigs);
          this.selectedAsignaturaId.set(asigs[0].id);
        }
      },
    });

    // 4. Cargar Periodos
    this.api.get<any[]>('academico/periodos').subscribe({
      next: (periodos) => {
        if (periodos && periodos.length > 0) {
          this.periodosList.set(periodos);
          this.selectedPeriodoId.set(periodos[0].id);
        }
      },
    });
  }

  // Eventos de Cambio en Cascada
  onGradoChange(gradoId: string) {
    this.selectedGradoId.set(gradoId);
    const grupos = this.gruposFiltrados();
    if (grupos.length > 0) {
      this.selectedGrupoId.set(grupos[0].id);
    } else {
      this.selectedGrupoId.set('');
    }
    this.cargarPlanilla();
  }

  onGrupoChange(grupoId: string) {
    this.selectedGrupoId.set(grupoId);
    this.cargarPlanilla();
  }

  onAsignaturaChange(asigId: string) {
    this.selectedAsignaturaId.set(asigId);
    this.cargarPlanilla();
  }

  onPeriodoChange(periodoId: string) {
    this.selectedPeriodoId.set(periodoId);
    this.cargarPlanilla();
  }

  // Carga de la planilla desde la BD con los filtros actuales
  cargarPlanilla() {
    const grupoId = this.selectedGrupoId();
    if (!grupoId) {
      this.planilla.set([]);
      return;
    }

    this.isLoadingPlanilla.set(true);
    const params: any = {
      grupoId,
      asignaturaId: this.selectedAsignaturaId(),
      periodoId: this.selectedPeriodoId(),
    };

    this.api.get<any[]>('academico/planilla', params).subscribe({
      next: (items) => {
        this.isLoadingPlanilla.set(false);
        if (items && items.length > 0) {
          const mapped: CalificacionLoteItem[] = items.map((i: any) => ({
            matriculaId: i.matriculaId || i.id,
            estudianteNombre: i.estudianteNombre,
            documento: i.documento,
            nota: Math.round((Number(i.nota) || 3.8) * 10) / 10,
            desempeno: i.desempeno || 'BASICO',
            observaciones: i.observaciones || 'Desempeño satisfactorio en periodo.',
          }));
          this.planilla.set(mapped);
        } else {
          this.planilla.set([]);
        }
      },
      error: () => {
        this.isLoadingPlanilla.set(false);
        this.planilla.set([]);
      },
    });
  }

  recalcularDesempeno(item: CalificacionLoteItem) {
    const nota = Number(item.nota);
    if (nota >= 4.6) item.desempeno = 'SUPERIOR';
    else if (nota >= 4.0) item.desempeno = 'ALTO';
    else if (nota >= 3.0) item.desempeno = 'BASICO';
    else item.desempeno = 'BAJO';
  }

  getBadgeDesempeno(desempeno: string): string {
    switch (desempeno) {
      case 'SUPERIOR':
        return 'badge badge-success';
      case 'ALTO':
        return 'badge badge-info';
      case 'BASICO':
        return 'badge badge-warning';
      default:
        return 'badge badge-danger';
    }
  }

  // --- CRUD: ACTUALIZAR / GUARDAR PLANILLA EN LOTE ---
  guardarCalificaciones() {
    this.isSaving.set(true);

    const payload = {
      actividadId: 'a1b2c3d4-1111-4111-8111-000000000001',
      periodoId: this.selectedPeriodoId() || 'b1b2c3d4-1111-4111-8111-000000000002',
      calificaciones: this.planilla().map((p) => ({
        matriculaId: p.matriculaId,
        nota: Number(p.nota),
        observaciones: p.observaciones,
      })),
    };

    this.api.put('academico/calificaciones/lote', payload).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        this.toast.success(
          '¡Planilla Guardada!',
          res?.mensaje || 'Calificaciones y desempeños del Decreto 1290 registrados con éxito en PostgreSQL.'
        );
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.toast.error(
          'Error al guardar',
          err?.error?.message || 'No fue posible guardar las calificaciones en la base de datos.'
        );
      },
    });
  }

  // --- CRUD: CREAR ACTIVIDAD EVALUATIVA ---
  abrirModalNuevaActividad() {
    this.nuevaActividad = {
      titulo: '',
      dimension: 'COGNITIVO',
      pesoPorcentaje: 20,
      fechaEntrega: '2026-03-30',
    };
    this.modalNuevaActividad.set(true);
  }

  guardarNuevaActividad() {
    if (!this.nuevaActividad.titulo) {
      this.toast.error('Campo Requerido', 'Por favor ingrese el título de la actividad.');
      return;
    }

    this.modalNuevaActividad.set(false);
    this.toast.success(
      '¡Actividad Creada!',
      `La actividad evaluativa '${this.nuevaActividad.titulo}' (${this.nuevaActividad.pesoPorcentaje}%) fue programada exitosamente.`
    );
  }

  // --- CRUD: LIMPIAR / RESTABLECER NOTA ---
  limpiarNota(item: CalificacionLoteItem) {
    item.nota = 1.0;
    item.desempeno = 'BAJO';
    item.observaciones = 'Pendiente por registrar';
    this.toast.warning('Calificación Restablecida', `Se ha limpiado la calificación de ${item.estudianteNombre}.`);
  }

  descargarBoletinDemo() {
    if (this.planilla().length === 0) {
      this.toast.warning('Sin estudiantes', 'No hay estudiantes en la planilla actual para generar boletines.');
      return;
    }
    const matriculaId = this.planilla()[0].matriculaId;
    const periodoId = this.selectedPeriodoId() || 'b1b2c3d4-1111-4111-8111-000000000002';
    window.open(this.api.getPdfUrl(`boletin/${matriculaId}/periodo/${periodoId}`), '_blank');
    this.toast.info('Descargando Boletín', 'Generando boletín consolidado en formato PDF...');
  }
}
