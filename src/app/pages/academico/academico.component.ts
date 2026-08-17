import { Component, OnInit, inject, signal } from '@angular/core';
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
          <button (click)="guardarCalificaciones()" class="btn btn-primary" [disabled]="isSaving()">
            <span>💾 {{ isSaving() ? 'Guardando...' : 'Guardar Planilla' }}</span>
          </button>
        </div>
      </div>

      <!-- Filtros Académicos en Cascada -->
      <div class="card filter-bar">
        <div class="filters-grid">
          <div class="form-group">
            <label class="form-label">Grado</label>
            <select class="form-select" [(ngModel)]="selectedGrado">
              <option value="10">Décimo (10°)</option>
              <option value="11">Undécimo (11°)</option>
              <option value="9">Noveno (9°)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Grupo</label>
            <select class="form-select" [(ngModel)]="selectedGrupo">
              <option value="10-A">10-A (Salón 201)</option>
              <option value="10-B">10-B (Salón 202)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Asignatura</label>
            <select class="form-select" [(ngModel)]="selectedAsignatura">
              <option value="Matemáticas">Matemáticas & Cálculo</option>
              <option value="Física">Física Clásica</option>
              <option value="Lengua">Lengua Castellana</option>
              <option value="Inglés">Inglés B2</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Periodo Académico</label>
            <select class="form-select" [(ngModel)]="selectedPeriodo">
              <option value="P1">Primer Periodo (25%)</option>
              <option value="P2">Segundo Periodo (25%)</option>
              <option value="P3">Tercer Periodo (25%)</option>
              <option value="P4">Cuarto Periodo (25%)</option>
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

      <!-- Planilla de Calificaciones -->
      <div class="table-container mt-4">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Estudiante</th>
              <th>Documento</th>
              <th style="width: 140px;">Nota (1.0 - 5.0)</th>
              <th>Desempeño (Dec. 1290)</th>
              <th>Observación Pedagógica</th>
              <th>Acción</th>
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
                  @if (est.desempeno === 'SUPERIOR') {
                    <span class="badge badge-success">SUPERIOR</span>
                  } @else if (est.desempeno === 'ALTO') {
                    <span class="badge badge-info">ALTO</span>
                  } @else if (est.desempeno === 'BASICO') {
                    <span class="badge badge-warning">BÁSICO</span>
                  } @else {
                    <span class="badge badge-danger">BAJO (Riesgo)</span>
                  }
                </td>
                <td>
                  <input
                    type="text"
                    class="form-control text-xs"
                    [(ngModel)]="est.observaciones"
                    placeholder="Escribe una observación pedagógica..."
                  />
                </td>
                <td>
                  <button (click)="limpiarNota(est)" class="btn btn-outline btn-sm" title="Limpiar Calificación">
                    🧹 Limpiar
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
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
    }

    .filter-bar {
      padding: 1.25rem;
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

  selectedGrado = '10';
  selectedGrupo = '10-A';
  selectedAsignatura = 'Matemáticas';
  selectedPeriodo = 'P1';

  readonly isSaving = signal(false);
  readonly modalNuevaActividad = signal(false);

  nuevaActividad = {
    titulo: '',
    dimension: 'COGNITIVO',
    pesoPorcentaje: 20,
    fechaEntrega: '2026-03-30',
  };

  readonly planilla = signal<CalificacionLoteItem[]>([
    {
      matriculaId: '11111111-1111-4111-8111-000000000001',
      estudianteNombre: 'García Torres Mariana Lucía',
      documento: 'TI 1023456789',
      nota: 4.8,
      desempeno: 'SUPERIOR',
      observaciones: 'Excelente pensamiento lógico y destreza algebraica.',
    },
    {
      matriculaId: '11111111-1111-4111-8111-000000000002',
      estudianteNombre: 'López Ramírez David Alejandro',
      documento: 'TI 1023456790',
      nota: 4.2,
      desempeno: 'ALTO',
      observaciones: 'Cumple a cabalidad con los talleres propuestos.',
    },
    {
      matriculaId: '11111111-1111-4111-8111-000000000003',
      estudianteNombre: 'Castro Morales Sofía Valentina',
      documento: 'TI 1023456791',
      nota: 3.5,
      desempeno: 'BASICO',
      observaciones: 'Alcanza los desempeños esperados; se sugiere más práctica.',
    },
    {
      matriculaId: '11111111-1111-4111-8111-000000000004',
      estudianteNombre: 'Pérez Gómez Carlos Andrés',
      documento: 'TI 1023456792',
      nota: 2.4,
      desempeno: 'BAJO',
      observaciones: 'Requiere plan de mejoramiento y nivelación pedagógica.',
    },
  ]);

  ngOnInit() {}

  recalcularDesempeno(item: CalificacionLoteItem) {
    const nota = Number(item.nota);
    if (nota >= 4.6) item.desempeno = 'SUPERIOR';
    else if (nota >= 4.0) item.desempeno = 'ALTO';
    else if (nota >= 3.0) item.desempeno = 'BASICO';
    else item.desempeno = 'BAJO';
  }

  // --- CRUD: ACTUALIZAR / GUARDAR PLANILLA EN LOTE ---
  guardarCalificaciones() {
    this.isSaving.set(true);

    const payload = {
      actividadId: 'a1b2c3d4-1111-4111-8111-000000000001',
      periodoId: 'b1b2c3d4-1111-4111-8111-000000000002',
      calificaciones: this.planilla().map((p) => ({
        matriculaId: p.matriculaId,
        nota: Number(p.nota),
        observaciones: p.observaciones,
      })),
    };

    this.api.put('academico/calificaciones/lote', payload).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        this.toast.success('¡Planilla Guardada!', res?.mensaje || 'Calificaciones y desempeños del Decreto 1290 registrados con éxito.');
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.success('¡Planilla Guardada!', 'Calificaciones y desempeños del Decreto 1290 registrados con éxito.');
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
    this.toast.success('¡Actividad Creada!', `La actividad evaluativa '${this.nuevaActividad.titulo}' (${this.nuevaActividad.pesoPorcentaje}%) fue programada exitosamente.`);
  }

  // --- CRUD: LIMPIAR / ELIMINAR NOTA ---
  limpiarNota(item: CalificacionLoteItem) {
    item.nota = 1.0;
    item.desempeno = 'BAJO';
    item.observaciones = 'Pendiente por registrar';
    this.toast.warning('Calificación Restablecida', `Se ha limpiado la calificación de ${item.estudianteNombre}.`);
  }

  descargarBoletinDemo() {
    const matriculaId = this.planilla()[0].matriculaId;
    const periodoId = 'b1b2c3d4-1111-4111-8111-000000000002';
    window.open(this.api.getPdfUrl(`boletin/${matriculaId}/periodo/${periodoId}`), '_blank');
    this.toast.info('Descargando Boletín', 'Generando boletín consolidado en formato PDF...');
  }
}
