import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';

type AdminTab = 'niveles' | 'grados' | 'grupos' | 'areas' | 'asignaturas' | 'periodos';

@Component({
  selector: 'app-academico-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, FlatpickrDirective],
  styles: [`
    .modal-backdrop {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background-color: rgba(15, 23, 42, 0.65) !important;
      backdrop-filter: blur(5px);
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 1.5rem !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      z-index: 10600 !important;
      overflow-y: auto;
    }
    .modal-card {
      margin: auto !important;
      width: 100%;
      max-width: 520px !important;
      background-color: #ffffff;
      padding: 1.75rem;
      border-radius: 16px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      position: relative;
      transition: max-width 0.2s ease-in-out;
    }
    .modal-card-lg {
      max-width: 720px !important;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .modal-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .modal-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
      margin-top: 0.2rem;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
      line-height: 1;
      padding: 0 0.25rem;
    }
    .close-btn:hover {
      color: #0f172a;
    }
    .modal-help-banner {
      display: flex;
      gap: 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      margin-bottom: 1.25rem;
      align-items: flex-start;
    }
    .help-icon {
      font-size: 1.25rem;
      line-height: 1;
    }
    .modal-help-banner p {
      font-size: 0.8rem;
      color: #1e3a8a;
      line-height: 1.35;
      margin: 0;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.35rem;
    }
    .form-control, .form-select {
      width: 100%;
      padding: 0.55rem 0.75rem;
      font-size: 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background-color: #ffffff;
      color: #1e293b;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-control:focus, .form-select:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .badge-code {
      display: inline-block;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      background-color: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .badge-status-activo {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      background-color: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .badge-status-abierto {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      background-color: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .badge-status-pendiente {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      background-color: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .badge-status-cerrado {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      background-color: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
  `],
  template: `
    <div class="card p-6 bg-white rounded-xl shadow-sm border border-slate-200 mt-4">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-bold text-slate-800">⚙️ Administrar Estructura Académica</h2>
          <p class="text-sm text-slate-500">Consulta, edita con sus formularios originales y elimina los registros estructurales del colegio.</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex space-x-2 border-b-2 border-slate-200 mb-6 overflow-x-auto pb-3 pt-1 items-center">
        @for (tab of tabs; track tab.id) {
          <button 
            type="button"
            class="px-4 py-2.5 font-semibold text-sm rounded-xl focus:outline-none whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm"
            [ngClass]="activeTab() === tab.id ? tab.activeClasses : tab.inactiveClasses"
            (click)="setTab(tab.id)">
            <span class="text-base">{{ tab.icon }}</span>
            <span>{{ tab.name }}</span>
            @if (activeTab() === tab.id) {
              <span class="inline-flex items-center gap-1 bg-white/25 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ml-1 border border-white/30 shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Activa
              </span>
            }
          </button>
        }
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="p-8 text-center text-slate-500">
          <p>⏳ Cargando datos desde el servidor...</p>
        </div>
      } @else {
        
        <!-- Tablas de Datos con Columnas Específicas por Entidad -->
        <div class="table-container overflow-x-auto">
          <table class="data-table w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-y border-slate-200 text-slate-700 text-sm">
                @switch (activeTab()) {
                  @case ('niveles') {
                    <th class="py-3 px-4 font-semibold">Código</th>
                    <th class="py-3 px-4 font-semibold">Nombre del Nivel Educativo</th>
                    <th class="py-3 px-4 font-semibold text-center">Orden</th>
                    <th class="py-3 px-4 font-semibold text-center">Estado</th>
                  }
                  @case ('grados') {
                    <th class="py-3 px-4 font-semibold">Cód. SIMAT</th>
                    <th class="py-3 px-4 font-semibold">Nombre del Grado</th>
                    <th class="py-3 px-4 font-semibold">Nivel Educativo Asociado</th>
                    <th class="py-3 px-4 font-semibold text-center">Orden</th>
                    <th class="py-3 px-4 font-semibold text-center">Estado</th>
                  }
                  @case ('grupos') {
                    <th class="py-3 px-4 font-semibold">Grupo / Salón</th>
                    <th class="py-3 px-4 font-semibold">Grado Escolar</th>
                    <th class="py-3 px-4 font-semibold text-center">Cupo Máx.</th>
                    <th class="py-3 px-4 font-semibold">Año Lectivo</th>
                    <th class="py-3 px-4 font-semibold text-center">Estado</th>
                  }
                  @case ('areas') {
                    <th class="py-3 px-4 font-semibold">Código</th>
                    <th class="py-3 px-4 font-semibold">Nombre del Área (Ley 115)</th>
                    <th class="py-3 px-4 font-semibold text-center">Orden Boletín</th>
                    <th class="py-3 px-4 font-semibold text-center">Estado</th>
                  }
                  @case ('asignaturas') {
                    <th class="py-3 px-4 font-semibold">Código</th>
                    <th class="py-3 px-4 font-semibold">Nombre de la Asignatura</th>
                    <th class="py-3 px-4 font-semibold">Área del Conocimiento</th>
                    <th class="py-3 px-4 font-semibold text-center">Peso (%)</th>
                    <th class="py-3 px-4 font-semibold text-center">Estado</th>
                  }
                  @case ('periodos') {
                    <th class="py-3 px-4 font-semibold text-center">N°</th>
                    <th class="py-3 px-4 font-semibold">Nombre del Periodo</th>
                    <th class="py-3 px-4 font-semibold text-center">Peso (%)</th>
                    <th class="py-3 px-4 font-semibold">Fechas (Inicio - Fin)</th>
                    <th class="py-3 px-4 font-semibold text-center">Estado</th>
                  }
                }
                <th class="py-3 px-4 font-semibold text-center" style="width: 120px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (item of dataList(); track item.id) {
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  
                  @switch (activeTab()) {
                    @case ('niveles') {
                      <td class="py-3 px-4">
                        <span class="badge-code">{{ item.codigo }}</span>
                      </td>
                      <td class="py-3 px-4 text-sm font-medium text-slate-800">{{ item.nombre }}</td>
                      <td class="py-3 px-4 text-sm text-slate-600 text-center">{{ item.orden }}</td>
                      <td class="py-3 px-4 text-center">
                        <span [ngClass]="getStatusBadgeClass(item.estado)">{{ item.estado }}</span>
                      </td>
                    }
                    @case ('grados') {
                      <td class="py-3 px-4">
                        <span class="badge-code">{{ item.codigoSimat || 'N/A' }}</span>
                      </td>
                      <td class="py-3 px-4 text-sm font-medium text-slate-800">{{ item.nombre }}</td>
                      <td class="py-3 px-4 text-sm text-slate-600">
                        {{ item.nivel?.nombre || getNivelNombre(item.nivelId) || 'Media Académica' }}
                      </td>
                      <td class="py-3 px-4 text-sm text-slate-600 text-center">{{ item.orden }}</td>
                      <td class="py-3 px-4 text-center">
                        <span [ngClass]="getStatusBadgeClass(item.estado)">{{ item.estado }}</span>
                      </td>
                    }
                    @case ('grupos') {
                      <td class="py-3 px-4 text-sm font-bold text-slate-800">{{ item.nombre }}</td>
                      <td class="py-3 px-4 text-sm text-slate-600">
                        {{ item.grado?.nombre || getGradoNombre(item.gradoId) || '-' }}
                      </td>
                      <td class="py-3 px-4 text-sm text-slate-600 text-center">{{ item.cupoMaximo }} est.</td>
                      <td class="py-3 px-4 text-sm text-slate-500">
                        {{ item.anioLectivo?.anio ? ('Año Académico ' + item.anioLectivo.anio) : (item.anioLectivo?.nombre || 'Año Académico 2026') }}
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span [ngClass]="getStatusBadgeClass(item.estado)">{{ item.estado }}</span>
                      </td>
                    }
                    @case ('areas') {
                      <td class="py-3 px-4">
                        <span class="badge-code">{{ item.codigo }}</span>
                      </td>
                      <td class="py-3 px-4 text-sm font-medium text-slate-800">{{ item.nombre }}</td>
                      <td class="py-3 px-4 text-sm text-slate-600 text-center">{{ item.orden }}</td>
                      <td class="py-3 px-4 text-center">
                        <span [ngClass]="getStatusBadgeClass(item.estado)">{{ item.estado }}</span>
                      </td>
                    }
                    @case ('asignaturas') {
                      <td class="py-3 px-4">
                        <span class="badge-code">{{ item.codigo || 'N/A' }}</span>
                      </td>
                      <td class="py-3 px-4 text-sm font-medium text-slate-800">{{ item.nombre }}</td>
                      <td class="py-3 px-4 text-sm text-slate-600">
                        {{ item.area?.nombre || getAreaNombre(item.areaId) || '-' }}
                      </td>
                      <td class="py-3 px-4 text-sm text-slate-700 font-semibold text-center">{{ item.pesoAreaPorcentaje }}%</td>
                      <td class="py-3 px-4 text-center">
                        <span [ngClass]="getStatusBadgeClass(item.estado)">{{ item.estado }}</span>
                      </td>
                    }
                    @case ('periodos') {
                      <td class="py-3 px-4 text-center">
                        <span class="badge-code">P{{ item.numero }}</span>
                      </td>
                      <td class="py-3 px-4 text-sm font-medium text-slate-800">{{ item.nombre }}</td>
                      <td class="py-3 px-4 text-sm text-slate-700 font-semibold text-center">{{ item.pesoPorcentual }}%</td>
                      <td class="py-3 px-4 text-xs text-slate-600">
                        {{ item.fechaInicio }} a {{ item.fechaFin }}
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span [ngClass]="getStatusBadgeClass(item.estado)">{{ item.estado }}</span>
                      </td>
                    }
                  }

                  <td class="py-3 px-4 text-center">
                    <div class="flex justify-center space-x-2">
                      <button (click)="iniciarEdicion(item)" class="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded" title="Editar">✏️</button>
                      <button (click)="confirmarEliminacion(item)" class="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center py-8 text-slate-500">
                    <p>No se encontraron registros de este tipo.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- ======================================================== -->
    <!-- MODALES DE EDICIÓN ESPECÍFICOS (REUTILIZAN FORMATO REAL) -->
    <!-- ======================================================== -->
    @if (editingItem()) {
      <div class="modal-backdrop">
        <div class="modal-card" [class.modal-card-lg]="activeTab() === 'periodos'">

          <!-- 1. EDITAR NIVEL EDUCATIVO -->
          @if (activeTab() === 'niveles') {
            <div class="modal-header">
              <div>
                <h3>🎓 Editar Nivel Educativo</h3>
                <span class="modal-subtitle">Estructura macro según la Ley General de Educación (Ley 115 de 1994)</span>
              </div>
              <button (click)="cancelarEdicion()" class="close-btn">&times;</button>
            </div>

            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Registra los bloques educativos del colegio. Ejemplo: <em>Educación Preescolar</em> (código <code>PRE</code>), <em>Básica Primaria</em> (código <code>PRI</code>), <em>Básica Secundaria</em> (código <code>SEC</code>), <em>Media Académica</em> (código <code>MED</code>).</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Nivel Educativo *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="editForm.nombre"
                  placeholder="Ej: Educación Preescolar, Básica Primaria, Media Académica"
                />
              </div>

              <div class="grid grid-cols-2 gap-3 mt-3">
                <div class="form-group">
                  <label class="form-label">Código del Nivel *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="editForm.codigo"
                    placeholder="Ej: PRE, PRI, SEC, MED"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Orden Cronológico (1 - 10)</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="editForm.orden"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>
          }

          <!-- 2. EDITAR GRADO ESCOLAR -->
          @if (activeTab() === 'grados') {
            <div class="modal-header">
              <div>
                <h3>🏛️ Editar Grado Escolar</h3>
                <span class="modal-subtitle">Grados organizados por nivel y código oficial SIMAT</span>
              </div>
              <button (click)="cancelarEdicion()" class="close-btn">&times;</button>
            </div>

            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Asocia el grado a un nivel educativo (ej: Transición en Preescolar, Primero a Quinto en Primaria, Décimo u Once en Media).</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Grado *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="editForm.nombre"
                  placeholder="Ej: Décimo (10°), Undécimo (11°)"
                />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Nivel Educativo Asociado *</label>
                <select class="form-select" [(ngModel)]="editForm.nivelId">
                  @for (nivel of nivelesList(); track nivel.id) {
                    <option [value]="nivel.id">{{ nivel.nombre }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3 mt-3">
                <div class="form-group">
                  <label class="form-label">Código SIMAT (MEN)</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="editForm.codigoSimat"
                    placeholder="Ej: 10, 11"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Orden Cronológico</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="editForm.orden"
                    min="0"
                    max="15"
                  />
                </div>
              </div>
            </div>
          }

          <!-- 3. EDITAR GRUPO / SALÓN -->
          @if (activeTab() === 'grupos') {
            <div class="modal-header">
              <div>
                <h3>🚪 Editar Grupo / Salón</h3>
                <span class="modal-subtitle">Apertura de cursos o secciones por grado académico</span>
              </div>
              <button (click)="cancelarEdicion()" class="close-btn">&times;</button>
            </div>

            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Modifica el nombre de la sección o salón (ej: <em>10-A</em>, <em>10-B</em>) y el cupo máximo permitido.</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Grupo / Salón *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="editForm.nombre"
                  placeholder="Ej: 10-A, 11-B"
                />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Cupo Máximo</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="editForm.cupoMaximo"
                  min="1"
                  max="60"
                />
              </div>
            </div>
          }

          <!-- 4. EDITAR ÁREA FUNDAMENTAL -->
          @if (activeTab() === 'areas') {
            <div class="modal-header">
              <div>
                <h3>📐 Editar Área Fundamental (Ley 115)</h3>
                <span class="modal-subtitle">Áreas obligatorias del Art. 23 o áreas optativas del PEI</span>
              </div>
              <button (click)="cancelarEdicion()" class="close-btn">&times;</button>
            </div>

            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Registra el área marco donde se agruparán las asignaturas. Ejemplo: <em>Ciencias Naturales</em> (<code>CN</code>), <em>Matemáticas</em> (<code>MAT</code>).</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Área del Conocimiento *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="editForm.nombre"
                  placeholder="Ej: Matemáticas & Ciencias Exactas"
                />
              </div>

              <div class="grid grid-cols-2 gap-3 mt-3">
                <div class="form-group">
                  <label class="form-label">Código del Área *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="editForm.codigo"
                    placeholder="Ej: MAT, CN, HUM"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Orden en Boletín</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="editForm.orden"
                    min="1"
                    max="20"
                  />
                </div>
              </div>
            </div>
          }

          <!-- 5. EDITAR ASIGNATURA CURRICULAR -->
          @if (activeTab() === 'asignaturas') {
            <div class="modal-header">
              <div>
                <h3>📚 Editar Asignatura Curricular</h3>
                <span class="modal-subtitle">Materias con peso porcentual dentro de su respectiva área</span>
              </div>
              <button (click)="cancelarEdicion()" class="close-btn">&times;</button>
            </div>

            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Modifica el área matriz asociada, el nombre de la materia específica, su código y el porcentaje que pondera.</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Área del Conocimiento (Ley 115) *</label>
                <select class="form-select" [(ngModel)]="editForm.areaId">
                  @for (area of areasList(); track area.id) {
                    <option [value]="area.id">{{ area.nombre }}</option>
                  }
                </select>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Nombre de la Asignatura *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="editForm.nombre"
                  placeholder="Ej: Matemáticas & Cálculo"
                />
              </div>

              <div class="grid grid-cols-2 gap-3 mt-3">
                <div class="form-group">
                  <label class="form-label">Código de Asignatura</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="editForm.codigo"
                    placeholder="Ej: MAT-10"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Peso en Área (%)</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="editForm.pesoAreaPorcentaje"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </div>
          }

          <!-- 6. EDITAR PERIODO ACADÉMICO -->
          @if (activeTab() === 'periodos') {
            <div class="modal-header">
              <div>
                <h3>📅 Editar Periodo Académico (SIEE)</h3>
                <span class="modal-subtitle">Configuración de calendario escolar, ponderación y fechas límite</span>
              </div>
              <button (click)="cancelarEdicion()" class="close-btn">&times;</button>
            </div>

            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>¿Qué debes ingresar?</strong> Define el nombre del periodo, peso ponderado, rango de fechas y estado operativo.</p>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Periodo *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="editForm.nombre"
                  placeholder="Ej: Primer Periodo"
                />
              </div>

              <div class="grid grid-cols-2 gap-3 mt-3">
                <div class="form-group">
                  <label class="form-label">Número de Periodo (1 - 4) *</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="editForm.numero"
                    min="1"
                    max="6"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Peso Porcentual (%) *</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="editForm.pesoPorcentual"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 mt-3">
                <div class="form-group">
                  <label class="form-label">Fecha de Inicio *</label>
                  <input
                    type="text"
                    appFlatpickr
                    class="form-control"
                    placeholder="dd/mm/aaaa"
                    [(ngModel)]="editForm.fechaInicio"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de Fin *</label>
                  <input
                    type="text"
                    appFlatpickr
                    [minDate]="editForm.fechaInicio"
                    class="form-control"
                    placeholder="dd/mm/aaaa"
                    [(ngModel)]="editForm.fechaFin"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 mt-3">
                <div class="form-group">
                  <label class="form-label">Límite para Docentes</label>
                  <input
                    type="text"
                    appFlatpickr
                    [enableTime]="true"
                    [minDate]="editForm.fechaInicio"
                    class="form-control"
                    placeholder="dd/mm/aaaa --:--"
                    [(ngModel)]="editForm.fechaLimiteDocentes"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Estado del Periodo *</label>
                  <select class="form-select" [(ngModel)]="editForm.estado">
                    <option value="ABIERTO">ABIERTO</option>
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="CERRADO">CERRADO</option>
                  </select>
                </div>
              </div>
            </div>
          }

          <!-- Botones de Acción del Modal -->
          <div class="modal-footer">
            <button (click)="cancelarEdicion()" class="btn btn-secondary">Cancelar</button>
            <button (click)="guardarEdicion()" class="btn btn-primary">💾 Guardar Cambios</button>
          </div>

        </div>
      </div>
    }

    <!-- Modal Confirmación Eliminación -->
    @if (itemToDelete()) {
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width: 540px !important;">
          <div class="flex items-start gap-3.5 mb-4">
            <div class="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-red-200">
              🗑️
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-slate-900 leading-tight">⚠️ Confirmar Eliminación</h3>
              <p class="text-xs text-slate-500 mt-0.5">Operación de retiro y borrado lógico del sistema académico</p>
            </div>
          </div>

          <!-- Tarjeta Destacada del Elemento a Eliminar con su Nombre -->
          <div class="p-4 mb-4 rounded-xl bg-gradient-to-r from-red-50 to-amber-50/40 border border-red-200 shadow-inner">
            <div class="flex items-center justify-between text-xs font-bold text-red-700 uppercase tracking-wider mb-1.5">
              <span class="flex items-center gap-1.5">
                <span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                {{ itemToDeleteInfo().tipo }}
              </span>
              @if (itemToDeleteInfo().detalle) {
                <span class="bg-red-200/60 text-red-800 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold">
                  {{ itemToDeleteInfo().detalle }}
                </span>
              }
            </div>
            <div class="text-xl font-black text-slate-900 tracking-tight leading-snug">
              {{ itemToDeleteInfo().nombre }}
            </div>
          </div>

          <p class="text-slate-600 text-sm mb-6 leading-relaxed">
            ¿Estás seguro de que deseas eliminar {{ itemToDeleteInfo().etiqueta }} <strong class="text-red-700 font-bold">"{{ itemToDeleteInfo().nombre }}"</strong>? El registro pasará a estado inactivo (<code class="text-red-600 bg-red-100/70 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">ELIMINADO</code>).
            Si ya cuenta con dependencias activas (calificaciones, matrículas o asignaciones), la operación será rechazada por integridad referencial institucional.
          </p>

          <div class="flex justify-end items-center pt-3 border-t border-slate-100" style="gap: 16px; margin-top: 0.5rem;">
            <button (click)="itemToDelete.set(null)" class="btn btn-secondary px-4 py-2" [disabled]="isDeleting()">
              Cancelar
            </button>
            <button (click)="ejecutarEliminacion()" class="btn btn-primary bg-red-600 border-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 px-5 py-2 shadow-sm" [disabled]="isDeleting()">
              {{ isDeleting() ? '⏳ Eliminando...' : '🗑️ Sí, Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AcademicoAdminComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  activeTab = signal<AdminTab>('niveles');
  isLoading = signal<boolean>(false);
  dataList = signal<any[]>([]);

  // Listas auxiliares para selects en modales de edición
  nivelesList = signal<any[]>([]);
  gradosList = signal<any[]>([]);
  areasList = signal<any[]>([]);

  tabs: { id: AdminTab; name: string; icon: string; activeClasses: string; inactiveClasses: string }[] = [
    { 
      id: 'niveles', 
      name: 'Niveles', 
      icon: '🎓',
      activeClasses: 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-300 border-2 border-indigo-700 ring-2 ring-indigo-200 scale-105', 
      inactiveClasses: 'bg-indigo-50/80 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 opacity-80 hover:opacity-100' 
    },
    { 
      id: 'grados', 
      name: 'Grados', 
      icon: '🏛️',
      activeClasses: 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-300 border-2 border-emerald-700 ring-2 ring-emerald-200 scale-105', 
      inactiveClasses: 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 opacity-80 hover:opacity-100' 
    },
    { 
      id: 'grupos', 
      name: 'Grupos', 
      icon: '🚪',
      activeClasses: 'bg-amber-600 text-white font-bold shadow-md shadow-amber-300 border-2 border-amber-700 ring-2 ring-amber-200 scale-105', 
      inactiveClasses: 'bg-amber-50/80 text-amber-800 hover:bg-amber-100 border border-amber-200 opacity-80 hover:opacity-100' 
    },
    { 
      id: 'areas', 
      name: 'Áreas', 
      icon: '📐',
      activeClasses: 'bg-rose-600 text-white font-bold shadow-md shadow-rose-300 border-2 border-rose-700 ring-2 ring-rose-200 scale-105', 
      inactiveClasses: 'bg-rose-50/80 text-rose-800 hover:bg-rose-100 border border-rose-200 opacity-80 hover:opacity-100' 
    },
    { 
      id: 'asignaturas', 
      name: 'Asignaturas', 
      icon: '📚',
      activeClasses: 'bg-fuchsia-600 text-white font-bold shadow-md shadow-fuchsia-300 border-2 border-fuchsia-700 ring-2 ring-fuchsia-200 scale-105', 
      inactiveClasses: 'bg-fuchsia-50/80 text-fuchsia-800 hover:bg-fuchsia-100 border border-fuchsia-200 opacity-80 hover:opacity-100' 
    },
    { 
      id: 'periodos', 
      name: 'Periodos', 
      icon: '📅',
      activeClasses: 'bg-sky-600 text-white font-bold shadow-md shadow-sky-300 border-2 border-sky-700 ring-2 ring-sky-200 scale-105', 
      inactiveClasses: 'bg-sky-50/80 text-sky-800 hover:bg-sky-100 border border-sky-200 opacity-80 hover:opacity-100' 
    },
  ];

  // Estado de edición
  editingItem = signal<any | null>(null);
  editForm: any = {};

  // Estado de eliminación
  itemToDelete = signal<any | null>(null);
  isDeleting = signal<boolean>(false);

  itemToDeleteInfo = computed(() => {
    const item = this.itemToDelete();
    if (!item) return { tipo: 'Registro', nombre: '', etiqueta: 'el registro', detalle: '' };

    switch (this.activeTab()) {
      case 'niveles':
        return {
          tipo: 'Nivel Educativo',
          nombre: item.nombre || 'Sin nombre',
          etiqueta: 'el nivel educativo',
          detalle: item.codigo ? `Código: ${item.codigo}` : ''
        };
      case 'grados':
        return {
          tipo: 'Grado Escolar',
          nombre: item.nombre || 'Sin nombre',
          etiqueta: 'el grado escolar',
          detalle: (item.codigoSimat || item.codigo) ? `Código: ${item.codigoSimat || item.codigo}` : ''
        };
      case 'grupos':
        const grado = item.gradoId ? this.getGradoNombre(item.gradoId) : '';
        return {
          tipo: 'Grupo Escolar',
          nombre: item.nombre || 'Sin nombre',
          etiqueta: 'el grupo escolar',
          detalle: grado ? `Grado: ${grado}` : (item.cupoMaximo ? `Capacidad: ${item.cupoMaximo} est.` : '')
        };
      case 'areas':
        return {
          tipo: 'Área del Conocimiento',
          nombre: item.nombre || 'Sin nombre',
          etiqueta: 'el área del conocimiento',
          detalle: item.codigo ? `Código: ${item.codigo}` : ''
        };
      case 'asignaturas':
        const area = item.areaId ? this.getAreaNombre(item.areaId) : '';
        return {
          tipo: 'Asignatura Curricular',
          nombre: item.nombre || 'Sin nombre',
          etiqueta: 'la asignatura curricular',
          detalle: area ? `Área: ${area}` : (item.codigo ? `Código: ${item.codigo}` : '')
        };
      case 'periodos':
        return {
          tipo: 'Periodo Académico',
          nombre: item.nombre || (item.numero ? `Periodo ${item.numero}` : 'Sin nombre'),
          etiqueta: 'el periodo académico',
          detalle: item.pesoPorcentual ? `Ponderación: ${item.pesoPorcentual}%` : ''
        };
      default:
        return {
          tipo: 'Registro',
          nombre: item.nombre || item.id || 'Sin nombre',
          etiqueta: 'el registro',
          detalle: ''
        };
    }
  });

  ngOnInit() {
    this.cargarListasAuxiliares();
    this.cargarDatos();
  }

  setTab(tabId: AdminTab) {
    this.activeTab.set(tabId);
    this.cancelarEdicion();
    this.cargarDatos();
  }

  cargarListasAuxiliares() {
    this.api.get<any[]>('/academico/niveles').subscribe({
      next: (res: any) => this.nivelesList.set(Array.isArray(res) ? res : res?.data || [])
    });
    this.api.get<any[]>('/academico/grados').subscribe({
      next: (res: any) => this.gradosList.set(Array.isArray(res) ? res : res?.data || [])
    });
    this.api.get<any[]>('/academico/areas').subscribe({
      next: (res: any) => this.areasList.set(Array.isArray(res) ? res : res?.data || [])
    });
  }

  getEndpointForTab(tab: AdminTab): string {
    return `/academico/${tab}`;
  }

  cargarDatos() {
    this.isLoading.set(true);
    const endpoint = this.getEndpointForTab(this.activeTab());
    
    this.api.get<any[]>(endpoint).subscribe({
      next: (res: any) => {
        let datos = Array.isArray(res) ? res : res?.data || res;
        if (Array.isArray(datos)) {
          if (this.activeTab() === 'grupos') {
            datos = [...datos].sort((a, b) => {
              const ordenA = a.grado?.orden ?? (this.gradosList().find(g => g.id === a.gradoId)?.orden ?? 99);
              const ordenB = b.grado?.orden ?? (this.gradosList().find(g => g.id === b.gradoId)?.orden ?? 99);
              if (ordenA !== ordenB) return ordenA - ordenB;
              return (a.nombre || '').localeCompare(b.nombre || '', undefined, { numeric: true });
            });
          } else if (this.activeTab() === 'grados' || this.activeTab() === 'niveles' || this.activeTab() === 'areas') {
            datos = [...datos].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
          } else if (this.activeTab() === 'asignaturas') {
            datos = [...datos].sort((a, b) => {
              const ordenA = a.area?.orden ?? (this.areasList().find(ar => ar.id === a.areaId)?.orden ?? 99);
              const ordenB = b.area?.orden ?? (this.areasList().find(ar => ar.id === b.areaId)?.orden ?? 99);
              if (ordenA !== ordenB) return ordenA - ordenB;
              return (a.codigo || '').localeCompare(b.codigo || '');
            });
          } else if (this.activeTab() === 'periodos') {
            datos = [...datos].sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99));
          }
        }
        this.dataList.set(datos);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error', `No se pudieron cargar los datos de ${this.activeTab()}.`);
        this.isLoading.set(false);
      }
    });
  }

  getStatusBadgeClass(estado: string): string {
    switch (estado) {
      case 'ACTIVO': return 'badge-status-activo';
      case 'ABIERTO': return 'badge-status-abierto';
      case 'PENDIENTE': return 'badge-status-pendiente';
      case 'CERRADO': return 'badge-status-cerrado';
      default: return 'badge-code';
    }
  }

  getNivelNombre(nivelId: string): string {
    const n = this.nivelesList().find(x => x.id === nivelId);
    return n ? n.nombre : '';
  }

  getGradoNombre(gradoId: string): string {
    const g = this.gradosList().find(x => x.id === gradoId);
    return g ? g.nombre : '';
  }

  getAreaNombre(areaId: string): string {
    const a = this.areasList().find(x => x.id === areaId);
    return a ? a.nombre : '';
  }

  private formatDateForInput(d: any): string {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    return '';
  }

  private formatDateTimeForInput(d: any): string {
    if (!d) return '';
    if (typeof d === 'string') return d;
    if (d instanceof Date) return d.toISOString();
    return '';
  }

  iniciarEdicion(item: any) {
    this.editingItem.set(item);
    
    // Clonar y mapear campos específicos según la pestaña activa
    switch (this.activeTab()) {
      case 'niveles':
        this.editForm = {
          nombre: item.nombre || '',
          codigo: item.codigo || '',
          orden: item.orden ?? 1
        };
        break;
      case 'grados':
        this.editForm = {
          nombre: item.nombre || '',
          nivelId: item.nivelId || (this.nivelesList()[0]?.id ?? ''),
          codigoSimat: item.codigoSimat || '',
          orden: item.orden ?? 1
        };
        break;
      case 'grupos':
        this.editForm = {
          nombre: item.nombre || '',
          gradoId: item.gradoId || '',
          cupoMaximo: item.cupoMaximo ?? 35
        };
        break;
      case 'areas':
        this.editForm = {
          nombre: item.nombre || '',
          codigo: item.codigo || '',
          orden: item.orden ?? 1
        };
        break;
      case 'asignaturas':
        this.editForm = {
          nombre: item.nombre || '',
          areaId: item.areaId || (this.areasList()[0]?.id ?? ''),
          codigo: item.codigo || '',
          pesoAreaPorcentaje: item.pesoAreaPorcentaje ? Number(item.pesoAreaPorcentaje) : 100
        };
        break;
      case 'periodos':
        this.editForm = {
          nombre: item.nombre || '',
          numero: item.numero ?? 1,
          pesoPorcentual: item.pesoPorcentual ? Number(item.pesoPorcentual) : 25,
          fechaInicio: this.formatDateForInput(item.fechaInicio),
          fechaFin: this.formatDateForInput(item.fechaFin),
          fechaLimiteDocentes: this.formatDateTimeForInput(item.fechaLimiteDocentes),
          estado: item.estado || 'ABIERTO'
        };
        break;
    }
  }

  cancelarEdicion() {
    this.editingItem.set(null);
    this.editForm = {};
  }

  guardarEdicion() {
    const item = this.editingItem();
    if (!item) return;

    if (!this.editForm.nombre || !this.editForm.nombre.trim()) {
      this.toast.error('Validación', 'El nombre es obligatorio.');
      return;
    }

    const tab = this.activeTab();
    const endpoint = `${this.getEndpointForTab(tab)}/${item.id}`;
    let payload: any = {};

    switch (tab) {
      case 'niveles':
        if (!this.editForm.codigo?.trim()) {
          this.toast.error('Validación', 'El código del nivel es requerido.');
          return;
        }
        payload = {
          nombre: this.editForm.nombre.trim(),
          codigo: this.editForm.codigo.trim(),
          orden: Number(this.editForm.orden) || 1
        };
        break;

      case 'grados':
        payload = {
          nombre: this.editForm.nombre.trim(),
          nivelId: this.editForm.nivelId,
          orden: Number(this.editForm.orden) || 1,
          ...(this.editForm.codigoSimat ? { codigoSimat: this.editForm.codigoSimat.trim() } : {})
        };
        break;

      case 'grupos':
        payload = {
          nombre: this.editForm.nombre.trim(),
          cupoMaximo: Number(this.editForm.cupoMaximo) || 35
        };
        break;

      case 'areas':
        if (!this.editForm.codigo?.trim()) {
          this.toast.error('Validación', 'El código del área es requerido.');
          return;
        }
        payload = {
          nombre: this.editForm.nombre.trim(),
          codigo: this.editForm.codigo.trim(),
          orden: Number(this.editForm.orden) || 1
        };
        break;

      case 'asignaturas':
        payload = {
          nombre: this.editForm.nombre.trim(),
          areaId: this.editForm.areaId,
          codigo: this.editForm.codigo?.trim() || '',
          pesoAreaPorcentaje: Number(this.editForm.pesoAreaPorcentaje) || 100
        };
        break;

      case 'periodos':
        if (!this.editForm.fechaInicio || !this.editForm.fechaFin) {
          this.toast.error('Validación', 'Las fechas de inicio y fin son obligatorias.');
          return;
        }
        payload = {
          nombre: this.editForm.nombre.trim(),
          numero: Number(this.editForm.numero) || 1,
          pesoPorcentual: Number(this.editForm.pesoPorcentual) || 25,
          fechaInicio: this.editForm.fechaInicio,
          fechaFin: this.editForm.fechaFin,
          estado: this.editForm.estado || 'ABIERTO'
        };
        if (this.editForm.fechaLimiteDocentes) {
          payload.fechaLimiteDocentes = this.editForm.fechaLimiteDocentes;
        }
        break;
    }

    this.api.put(endpoint, payload).subscribe({
      next: () => {
        this.toast.success('Guardado', 'El registro ha sido actualizado exitosamente.');
        this.cancelarEdicion();
        this.cargarDatos();
        this.cargarListasAuxiliares();
      },
      error: (err: any) => {
        this.toast.error('Error al actualizar', err.error?.message || 'No se pudo guardar el registro.');
      }
    });
  }

  confirmarEliminacion(item: any) {
    this.itemToDelete.set(item);
  }

  ejecutarEliminacion() {
    const item = this.itemToDelete();
    if (!item) return;

    this.isDeleting.set(true);
    const endpoint = `${this.getEndpointForTab(this.activeTab())}/${item.id}`;

    this.api.delete(endpoint).subscribe({
      next: () => {
        this.toast.success('Eliminado', 'El registro ha sido eliminado exitosamente.');
        this.isDeleting.set(false);
        this.itemToDelete.set(null);
        this.cargarDatos();
        this.cargarListasAuxiliares();
      },
      error: (err: any) => {
        this.isDeleting.set(false);
        this.itemToDelete.set(null);
        if (err.status === 409 || err.error?.statusCode === 409 || (err.error?.message && err.error.message.includes('violates foreign key'))) {
          this.toast.error('Restricción de Integridad', 'No se puede eliminar porque ya está en uso (tiene dependencias asociadas).');
        } else {
          this.toast.error('Error al eliminar', err.error?.message || 'Operación fallida.');
        }
      }
    });
  }
}
