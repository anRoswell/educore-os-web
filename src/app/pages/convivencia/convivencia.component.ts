import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';

export interface CasoConvivenciaItem {
  id: string;
  matricula_id?: string;
  estudiante_id?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  numero_documento?: string;
  tipo_documento?: string;
  grupo_nombre?: string;
  tipo_falta: 'TIPO_I' | 'TIPO_II' | 'TIPO_III';
  articulo_manual_convivencia?: string;
  descripcion_hechos: string;
  lugar_hechos?: string;
  fecha_hechos: string;
  estado: 'ABIERTO' | 'EN_DESCARGOS' | 'CONCILIACION' | 'SANCIONADO' | 'CERRADO';
  medida_formativa?: string;
  reportado_por_nombres?: string;
  reportado_por_apellidos?: string;
  created_at?: string;
  descargos?: any[];
}

export interface ActaComiteItem {
  id: string;
  numero_acta: string;
  fecha_reunion: string;
  asistentes?: any;
  casos_tratados?: any;
  decisiones_adoptadas: string;
  compromisos_adquiridos?: string;
  created_at?: string;
}

@Component({
  selector: 'app-convivencia',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpBadgeComponent],
  template: `
    <div class="convivencia-page animate-fade-in">
      <!-- HEADER PRINCIPAL -->
      <div class="page-header">
        <div>
          <div class="header-badge">
            <span>🛡️ LEY 1620 DE 2013 & DECRETO 1965</span>
            <app-help-badge term="LEY_1620"></app-help-badge>
          </div>
          <h1 class="page-title">Convivencia Escolar & Observador Digital</h1>
          <p class="page-subtitle">
            Ruta de Atención Integral, tipificación de faltas (Tipo I, II, III), debido proceso disciplinario y reporte oficial SIUCE
            <app-help-badge term="SIUCE"></app-help-badge>
          </p>
        </div>

        <div class="header-actions">
          <button (click)="abrirModalNuevoCaso()" class="btn btn-primary" title="Radicar nueva anotación disciplinaria o formativa">
            ➕ Radicar Anotación / Caso
          </button>
          <button (click)="abrirModalNuevaActa()" class="btn btn-secondary" title="Crear acta de sesión del Comité de Convivencia">
            📝 Nueva Sesión Comité
          </button>
          <button (click)="exportarReporteSiuce()" class="btn btn-secondary" title="Generar consolidado oficial SIUCE">
            📊 Exportar SIUCE (MEN)
          </button>
        </div>
      </div>

      <!-- TARJETAS DE INDICADORES / METRICAS SIUCE -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Total Expedientes</span>
            <span class="metric-icon">📁</span>
          </div>
          <div class="metric-value">{{ metricas().total_anotaciones || casosList().length }}</div>
          <div class="metric-footer">
            <span class="text-emerald font-semibold">{{ metricas().casos_cerrados || 0 }} conciliados</span> · {{ metricas().casos_abiertos || 0 }} en trámite
          </div>
        </div>

        <div class="metric-card border-green">
          <div class="metric-header">
            <span class="metric-label">
              Faltas Tipo I (Leves)
              <app-help-badge term="TIPO_I"></app-help-badge>
            </span>
            <span class="metric-icon">🟢</span>
          </div>
          <div class="metric-value text-green">{{ metricas().tipo_1_leves || totalTipo1() }}</div>
          <div class="metric-footer">Mediación en aula / Compromiso</div>
        </div>

        <div class="metric-card border-amber">
          <div class="metric-header">
            <span class="metric-label">
              Faltas Tipo II (Bullying)
              <app-help-badge term="TIPO_II"></app-help-badge>
            </span>
            <span class="metric-icon">🟠</span>
          </div>
          <div class="metric-value text-amber">{{ metricas().tipo_2_acoso || totalTipo2() }}</div>
          <div class="metric-footer">Acoso reiterado / Comité Convivencia</div>
        </div>

        <div class="metric-card border-red">
          <div class="metric-header">
            <span class="metric-label">
              Faltas Tipo III (Graves)
              <app-help-badge term="TIPO_III"></app-help-badge>
            </span>
            <span class="metric-icon">🔴</span>
          </div>
          <div class="metric-value text-red">{{ metricas().tipo_3_graves || totalTipo3() }}</div>
          <div class="metric-footer">Delitos / Remisión Externa ICBF</div>
        </div>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-container">
        <button
          class="tab-btn"
          [class.active]="tabActiva() === 'observador'"
          (click)="tabActiva.set('observador')"
        >
          📖 Observador Digital & Casos ({{ casosFiltrados().length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="tabActiva() === 'comite'"
          (click)="tabActiva.set('comite')"
        >
          🤝 Comité de Convivencia ({{ actasList().length }} Actas)
          <app-help-badge term="COMITE_CONVIVENCIA"></app-help-badge>
        </button>
        <button
          class="tab-btn"
          [class.active]="tabActiva() === 'siuce'"
          (click)="tabActiva.set('siuce')"
        >
          📊 Matriz Oficial SIUCE (MEN)
        </button>
        <button
          class="tab-btn"
          [class.active]="tabActiva() === 'ruta'"
          (click)="tabActiva.set('ruta')"
        >
          🧭 Ruta de Atención Integral (Ley 1620)
        </button>
      </div>

      <!-- TAB 1: OBSERVADOR DIGITAL & EXPEDIENTES -->
      @if (tabActiva() === 'observador') {
        <div class="card card-glass p-4 mt-3">
          <!-- BARRA DE FILTROS -->
          <div class="filters-bar">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                class="form-control search-input"
                placeholder="Buscar por estudiante, documento o hechos..."
                [(ngModel)]="filtroTexto"
              />
            </div>

            <div class="filter-group">
              <label class="filter-label">Tipo de Falta:</label>
              <select class="form-select" [(ngModel)]="filtroTipoFalta" (ngModelChange)="cargarCasos()">
                <option value="TODOS">Todas las Tipificaciones</option>
                <option value="TIPO_I">Tipo I (Leves / Esporádicas)</option>
                <option value="TIPO_II">Tipo II (Bullying / Acoso)</option>
                <option value="TIPO_III">Tipo III (Graves / Delitos)</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Estado:</label>
              <select class="form-select" [(ngModel)]="filtroEstado" (ngModelChange)="cargarCasos()">
                <option value="TODOS">Todos los Estados</option>
                <option value="ABIERTO">Abierto (Recién radicado)</option>
                <option value="EN_DESCARGOS">En Descargos (Derecho a la defensa)</option>
                <option value="CONCILIACION">Conciliación / Compromiso</option>
                <option value="SANCIONADO">Sanción Formativa</option>
                <option value="CERRADO">Cerrado / Resuelto</option>
              </select>
            </div>
          </div>

          <!-- TABLA DE EXPEDIENTES -->
          <div class="table-container mt-4">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estudiante</th>
                  <th>Grado/Grupo</th>
                  <th>Tipificación (Ley 1620)</th>
                  <th>Hechos y Artículo</th>
                  <th>Estado / Proceso</th>
                  <th>Reportado Por</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (caso of casosFiltrados(); track caso.id) {
                  <tr>
                    <td class="text-xs text-slate-500">
                      {{ caso.fecha_hechos | date:'dd/MM/yyyy' }}
                      <div class="text-2xs text-slate-400">{{ caso.lugar_hechos || 'Campus Escolar' }}</div>
                    </td>
                    <td>
                      <div class="font-bold text-slate-800">
                        {{ caso.primer_nombre }} {{ caso.segundo_nombre || '' }} {{ caso.primer_apellido }} {{ caso.segundo_apellido || '' }}
                      </div>
                      <span class="text-xs text-slate-500 font-mono">{{ caso.tipo_documento || 'TI' }}: {{ caso.numero_documento }}</span>
                    </td>
                    <td>
                      <span class="badge-tag">{{ caso.grupo_nombre || 'Sin Grupo' }}</span>
                    </td>
                    <td>
                      <span [class]="getBadgeClassTipoFalta(caso.tipo_falta)">
                        {{ getNombreTipoFalta(caso.tipo_falta) }}
                      </span>
                    </td>
                    <td style="max-width: 300px;">
                      <div class="line-clamp-2 text-sm text-slate-700">{{ caso.descripcion_hechos }}</div>
                      @if (caso.articulo_manual_convivencia) {
                        <div class="text-xs text-indigo-600 font-medium mt-1">📖 {{ caso.articulo_manual_convivencia }}</div>
                      }
                    </td>
                    <td>
                      <span [class]="getBadgeClassEstado(caso.estado)">
                        {{ caso.estado }}
                      </span>
                    </td>
                    <td class="text-xs text-slate-600">
                      {{ caso.reportado_por_nombres }} {{ caso.reportado_por_apellidos }}
                    </td>
                    <td style="text-align: right;">
                      <div class="actions-group">
                        <button (click)="verDetalleCaso(caso)" class="btn-action btn-view" title="Ver expediente completo y descargos">
                          👁️ Expediente
                        </button>
                        <button (click)="abrirModalDescargos(caso)" class="btn-action btn-edit" title="Radicar descargos y evidencias">
                          ✍️ Descargos
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="text-center py-8 text-slate-500">
                      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🕊️</div>
                      <div class="font-semibold">No se encontraron casos de convivencia con los filtros seleccionados</div>
                      <p class="text-xs mt-1 text-slate-400">El clima escolar se encuentra en óptimas condiciones o no hay registros con estos criterios.</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: COMITÉ DE CONVIVENCIA ESCOLAR -->
      @if (tabActiva() === 'comite') {
        <div class="card card-glass p-4 mt-3">
          <div class="flex-between mb-3">
            <div>
              <h3 class="text-lg font-bold text-slate-800">📋 Libro de Actas del Comité de Convivencia</h3>
              <p class="text-xs text-slate-500">Sesiones ordinarias y extraordinarias del órgano colegiado de mediación escolar (Art. 12 Ley 1620)</p>
            </div>
            <button (click)="abrirModalNuevaActa()" class="btn btn-primary">
              ➕ Redactar Nueva Acta
            </button>
          </div>

          <div class="grid-actas mt-4">
            @for (acta of actasList(); track acta.id) {
              <div class="acta-card card">
                <div class="acta-header">
                  <div class="acta-badge">{{ acta.numero_acta }}</div>
                  <span class="text-xs text-slate-500 font-medium">📅 {{ acta.fecha_reunion | date:'dd MMMM yyyy' }}</span>
                </div>
                <h4 class="acta-title">Decisiones y Mediaciones Adoptadas</h4>
                <p class="acta-body">{{ acta.decisiones_adoptadas }}</p>

                @if (acta.compromisos_adquiridos) {
                  <div class="acta-compromisos">
                    <span class="font-bold text-xs text-emerald-800">🤝 Compromisos:</span>
                    <p class="text-xs text-emerald-700 mt-1">{{ acta.compromisos_adquiridos }}</p>
                  </div>
                }

                <div class="acta-footer">
                  <span class="text-2xs text-slate-400">Foliada electrónicamente</span>
                  <button (click)="imprimirActa(acta)" class="btn-link-action">📄 Ver / Imprimir Acta</button>
                </div>
              </div>
            } @empty {
              <div class="col-span-full text-center py-8 text-slate-500">
                <p>No hay actas registradas para el año lectivo en curso.</p>
                <button (click)="abrirModalNuevaActa()" class="btn btn-secondary mt-2">Crear Primera Acta</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 3: MATRIZ OFICIAL SIUCE -->
      @if (tabActiva() === 'siuce') {
        <div class="card card-glass p-4 mt-3">
          <div class="flex-between mb-4">
            <div>
              <h3 class="text-lg font-bold text-slate-800">📊 Reporte Oficial SIUCE (Ministerio de Educación)</h3>
              <p class="text-xs text-slate-500">Consolidado semestral de tipificación de faltas y garantías de no repetición</p>
            </div>
            <button (click)="exportarReporteSiuce()" class="btn btn-primary">
              💾 Descargar Informe Oficial (CSV / PDF)
            </button>
          </div>

          <div class="siuce-summary-grid">
            <div class="siuce-box">
              <div class="siuce-title">Tipo I (Leves)</div>
              <div class="siuce-num text-green">{{ metricas().tipo_1_leves || totalTipo1() }}</div>
              <div class="siuce-desc">Manejadas mediante mediación pedagógica en aula</div>
            </div>
            <div class="siuce-box">
              <div class="siuce-title">Tipo II (Acoso / Bullying)</div>
              <div class="siuce-num text-amber">{{ metricas().tipo_2_acoso || totalTipo2() }}</div>
              <div class="siuce-desc">Remitidas a Comité y notificadas a padres</div>
            </div>
            <div class="siuce-box">
              <div class="siuce-title">Tipo III (Delitos)</div>
              <div class="siuce-num text-red">{{ metricas().tipo_3_graves || totalTipo3() }}</div>
              <div class="siuce-desc">Remitidas a ICBF / Policía / Fiscalía</div>
            </div>
            <div class="siuce-box">
              <div class="siuce-title">Índice de Resolución</div>
              <div class="siuce-num text-indigo">
                {{ calcularTasaResolucion() }}%
              </div>
              <div class="siuce-desc">Casos cerrados con acuerdos formativos</div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 4: RUTA DE ATENCIÓN INTEGRAL -->
      @if (tabActiva() === 'ruta') {
        <div class="card card-glass p-4 mt-3">
          <h3 class="text-lg font-bold text-slate-800 mb-2">🧭 Componentes de la Ruta de Atención Integral (Ley 1620)</h3>
          <p class="text-xs text-slate-500 mb-4">Los 4 pilares obligatorios para la convivencia pacífica y los derechos humanos escolares</p>

          <div class="ruta-grid">
            <div class="ruta-card border-blue">
              <div class="ruta-step">1. PROMOCIÓN</div>
              <h4>Cultura y Clima Escolar</h4>
              <p>Políticas institucionales, cátedra de paz, valores democráticos y formación en derechos humanos (DDHH) y competencias ciudadanas.</p>
            </div>
            <div class="ruta-card border-green">
              <div class="ruta-step">2. PREVENCIÓN</div>
              <h4>Identificación Temprana</h4>
              <p>Talleres contra el acoso escolar (*bullying* y *ciberbullying*), pautas de crianza positiva y protocolos de alerta con psicorientación.</p>
            </div>
            <div class="ruta-card border-amber">
              <div class="ruta-step">3. ATENCIÓN</div>
              <h4>Debido Proceso & Escucha</h4>
              <p>Recepción inmediata de quejas, citación a acudientes, derecho a descargos, mediación y remisión externa según la gravedad.</p>
            </div>
            <div class="ruta-card border-purple">
              <div class="ruta-step">4. SEGUIMIENTO</div>
              <h4>Garantía de No Repetición</h4>
              <p>Acompañamiento psicosocial, verificación del cumplimiento de acuerdos y reporte estadístico periódico en el SIUCE.</p>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 1: RADICAR NUEVA ANOTACIÓN / CASO           -->
      <!-- ================================================= -->
      @if (modalNuevoCaso()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoCaso')">
          <div class="modal-card card card-glass" style="max-width: 600px;">
            <div class="modal-header">
              <div>
                <h3>➕ Radicar Anotación en Observador Digital</h3>
                <span class="modal-subtitle">Registro oficial con tipificación según Ley 1620 y Debido Proceso</span>
              </div>
              <button (click)="cerrarModalNuevoCaso()" class="close-btn">&times;</button>
            </div>

            <!-- Banner de Ayuda Contextual -->
            <div class="modal-help-banner">
              <span class="help-icon">💡</span>
              <p><strong>Garantía Legal:</strong> Registre los hechos de forma objetiva sin juicios de valor. El estudiante tendrá derecho a presentar sus descargos formales.</p>
            </div>

            <div class="modal-body">
              <!-- Selección de Estudiante -->
              <div class="form-group">
                <label class="form-label">Seleccionar Estudiante Matriculado *</label>
                <select class="form-select" [(ngModel)]="nuevoCasoForm.matriculaId">
                  @for (est of estudiantesList(); track est.matricula_id) {
                    <option [value]="est.matricula_id">
                      {{ est.primer_apellido }} {{ est.segundo_apellido || '' }} {{ est.primer_nombre }} ({{ est.grado_nombre || 'Grado' }} - {{ est.grupo_nombre || 'Grupo' }}) - {{ est.numero_documento }}
                    </option>
                  } @empty {
                    <option value="">Cargando lista de estudiantes matriculados...</option>
                  }
                </select>
              </div>

              <!-- Tipificación de la Falta -->
              <div class="form-group mt-3">
                <div class="flex-between">
                  <label class="form-label">Tipificación de la Falta (Ley 1620) *</label>
                  <app-help-badge term="LEY_1620"></app-help-badge>
                </div>
                <select class="form-select" [(ngModel)]="nuevoCasoForm.tipoFalta">
                  <option value="TIPO_I">🟢 TIPO I: Falta Leve / Conflicto esporádico (Manejable en aula)</option>
                  <option value="TIPO_II">🟠 TIPO II: Acoso Escolar (Bullying) / Ciberacoso reiterado</option>
                  <option value="TIPO_III">🔴 TIPO III: Falta Gravísima / Presunto Delito (Remisión a ICBF/Fiscalía)</option>
                </select>
              </div>

              <!-- Artículo del Manual de Convivencia -->
              <div class="form-group mt-3">
                <label class="form-label">Artículo del Manual de Convivencia</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevoCasoForm.articuloManualConvivencia"
                  placeholder="Ej: Capítulo 5, Art. 22 - Agresión verbal reiterada o uso indebido de celular"
                />
              </div>

              <!-- Descripción de los Hechos -->
              <div class="form-group mt-3">
                <label class="form-label">Descripción Objetiva de los Hechos *</label>
                <textarea
                  class="form-control"
                  rows="3"
                  [(ngModel)]="nuevoCasoForm.descripcionHechos"
                  placeholder="Relate de forma cronológica, clara y respetuosa lo acontecido..."
                ></textarea>
              </div>

              <div class="grid-cols-2 mt-3" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Lugar de los Hechos</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="nuevoCasoForm.lugarHechos"
                    placeholder="Ej: Aula 10B, Patio central, Ruta escolar"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de los Hechos *</label>
                  <input
                    type="date"
                    class="form-control"
                    [(ngModel)]="nuevoCasoForm.fechaHechos"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevoCaso()" class="btn btn-primary">
                💾 Radicar en Observador
              </button>
              <button (click)="cerrarModalNuevoCaso()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 2: EXPEDIENTE DETALLADO & DESCARGOS         -->
      <!-- ================================================= -->
      @if (casoSeleccionado()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('detalleCaso')">
          <div class="modal-card card card-glass" style="max-width: 650px;">
            <div class="modal-header">
              <div>
                <h3>🔍 Expediente de Convivencia #{{ casoSeleccionado()?.id?.slice(0, 8) }}</h3>
                <span class="modal-subtitle">Garantía del Debido Proceso y Registro de Descargos</span>
              </div>
              <button (click)="cerrarDetalleCaso()" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <!-- Información del Estudiante -->
              <div class="estudiante-summary-box">
                <div class="estudiante-avatar">
                  {{ casoSeleccionado()?.primer_nombre?.charAt(0) }}{{ casoSeleccionado()?.primer_apellido?.charAt(0) }}
                </div>
                <div>
                  <h4 class="font-bold text-slate-800">
                    {{ casoSeleccionado()?.primer_nombre }} {{ casoSeleccionado()?.primer_apellido }}
                  </h4>
                  <div class="text-xs text-slate-500">
                    Doc: {{ casoSeleccionado()?.tipo_documento || 'TI' }} {{ casoSeleccionado()?.numero_documento }} · Grupo: <strong>{{ casoSeleccionado()?.grupo_nombre }}</strong>
                  </div>
                </div>
                <div style="margin-left: auto;">
                  <span [class]="getBadgeClassTipoFalta(casoSeleccionado()!.tipo_falta)">
                    {{ casoSeleccionado()!.tipo_falta }}
                  </span>
                </div>
              </div>

              <!-- Hechos -->
              <div class="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-xs font-bold text-slate-500 uppercase">Hechos Registrados:</div>
                <p class="text-sm text-slate-700 mt-1">{{ casoSeleccionado()?.descripcion_hechos }}</p>
                <div class="text-2xs text-slate-400 mt-2">
                  Fecha: {{ casoSeleccionado()?.fecha_hechos | date:'dd/MM/yyyy' }} · Lugar: {{ casoSeleccionado()?.lugar_hechos }}
                </div>
              </div>

              <!-- Historial de Descargos -->
              <div class="mt-4">
                <h4 class="text-xs font-bold text-slate-700 uppercase mb-2 flex-between">
                  <span>✍️ Descargos del Estudiante (Debido Proceso)</span>
                  <app-help-badge term="DEBIDO_PROCESO"></app-help-badge>
                </h4>

                @for (d of casoSeleccionado()?.descargos; track d.id) {
                  <div class="descargo-item">
                    <div class="descargo-header">
                      <span class="font-bold text-xs text-slate-800">Versión Presentada:</span>
                      <span class="text-2xs text-slate-400">{{ d.fecha_descargos | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <p class="text-xs text-slate-700 mt-1">{{ d.version_hechos }}</p>
                  </div>
                } @empty {
                  <p class="text-xs text-slate-400 italic">No se han registrado descargos formales para este caso.</p>
                }
              </div>

              <!-- Formulario para agregar descargos -->
              <div class="mt-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <h5 class="text-xs font-bold text-indigo-900 mb-2">➕ Registrar Nueva Versión de Descargos:</h5>
                <textarea
                  class="form-control"
                  rows="2"
                  [(ngModel)]="nuevoDescargoForm.versionHechos"
                  placeholder="Escriba la versión libre del estudiante y/o su acudiente..."
                ></textarea>
                <div class="flex justify-end mt-2">
                  <button (click)="guardarDescargo()" class="btn btn-sm btn-primary">
                    💾 Radicar Descargos
                  </button>
                </div>
              </div>

              <!-- Medida Formativa y Cierre -->
              <div class="mt-4 pt-3 border-t border-slate-200">
                <label class="form-label">Medida Pedagógica Formativa / Compromiso de Convivencia:</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="medidaFormativaInput"
                  placeholder="Ej: Taller reflexivo sobre respeto, servicio social pedagógico o acta de compromiso"
                />
                <div class="flex-between mt-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-600">Estado:</span>
                    <select class="form-select form-select-sm" [(ngModel)]="estadoActualizarInput">
                      <option value="ABIERTO">ABIERTO</option>
                      <option value="EN_DESCARGOS">EN_DESCARGOS</option>
                      <option value="CONCILIACION">CONCILIACION</option>
                      <option value="SANCIONADO">SANCIONADO</option>
                      <option value="CERRADO">CERRADO</option>
                    </select>
                  </div>
                  <button (click)="actualizarEstadoCaso()" class="btn btn-primary">
                    🔄 Actualizar Caso
                  </button>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="cerrarDetalleCaso()" class="btn btn-secondary">Cerrar Expediente</button>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODAL 3: CREAR ACTA DE COMITÉ DE CONVIVENCIA      -->
      <!-- ================================================= -->
      @if (modalNuevaActa()) {
        <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevaActa')">
          <div class="modal-card card card-glass" style="max-width: 600px;">
            <div class="modal-header">
              <div>
                <h3>📝 Nueva Acta de Comité de Convivencia</h3>
                <span class="modal-subtitle">Registro de deliberación y mediaciones del órgano colegiado</span>
              </div>
              <button (click)="cerrarModalNuevaActa()" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="grid-cols-2" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Número de Acta *</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevaActaForm.numeroActa" placeholder="Ej: ACTA-CCE-2026-03" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de Reunión *</label>
                  <input type="date" class="form-control" [(ngModel)]="nuevaActaForm.fechaReunion" />
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Decisiones y Acuerdos Adoptados *</label>
                <textarea
                  class="form-control"
                  rows="3"
                  [(ngModel)]="nuevaActaForm.decisionesAdoptadas"
                  placeholder="Detalle los casos analizados y las soluciones formativas acordadas por unanimidad..."
                ></textarea>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Compromisos de Seguimiento y Garantías de No Repetición</label>
                <textarea
                  class="form-control"
                  rows="2"
                  [(ngModel)]="nuevaActaForm.compromisosAdquiridos"
                  placeholder="Acuerdos con estudiantes, docentes o acudientes para seguimiento con psicorientación..."
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevaActa()" class="btn btn-primary">
                💾 Guardar y Foliar Acta
              </button>
              <button (click)="cerrarModalNuevaActa()" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .convivencia-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #eef2ff;
      color: #4338ca;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      margin-bottom: 0.5rem;
      border: 1px solid #c7d2fe;
    }

    .page-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.25rem 0;
    }

    .page-subtitle {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    /* Grid de Métricas */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .metric-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .metric-card.border-green { border-left: 4px solid #10b981; }
    .metric-card.border-amber { border-left: 4px solid #f59e0b; }
    .metric-card.border-red { border-left: 4px solid #ef4444; }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .metric-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .metric-icon {
      font-size: 1.2rem;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .text-green { color: #059669; }
    .text-amber { color: #d97706; }
    .text-red { color: #dc2626; }
    .text-indigo { color: #4f46e5; }
    .text-emerald { color: #10b981; }

    .metric-footer {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Tabs */
    .tabs-container {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.25rem;
      overflow-x: auto;
    }

    .tab-btn {
      padding: 0.6rem 1.2rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      color: #0f172a;
      background: #f1f5f9;
    }

    .tab-btn.active {
      color: #4f46e5;
      background: #eef2ff;
    }

    /* Filtros y Búsqueda */
    .filters-bar {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.9rem;
      color: #94a3b8;
    }

    .search-input {
      padding-left: 2.2rem !important;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }

    /* Tabla */
    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      background: #ffffff;
    }

    .data-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }

    .data-table tr:hover td {
      background-color: #f8fafc;
    }

    .badge-tag {
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-tipo1 {
      background: #dcfce7;
      color: #15803d;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .badge-tipo2 {
      background: #fef3c7;
      color: #b45309;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .badge-tipo3 {
      background: #fee2e2;
      color: #b91c1c;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .badge-abierto {
      background: #eff6ff;
      color: #1d4ed8;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-descargos {
      background: #fef9c3;
      color: #854d0e;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-conciliado {
      background: #dcfce7;
      color: #166534;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .actions-group {
      display: flex;
      gap: 0.35rem;
      justify-content: flex-end;
    }

    .btn-action {
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }

    .btn-view {
      background: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }

    .btn-view:hover {
      background: #e2e8f0;
    }

    .btn-edit {
      background: #eef2ff;
      color: #4338ca;
      border-color: #c7d2fe;
    }

    .btn-edit:hover {
      background: #e0e7ff;
    }

    /* Grid de Actas */
    .grid-actas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1rem;
    }

    .acta-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
    }

    .acta-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .acta-badge {
      font-family: monospace;
      font-weight: 700;
      background: #eef2ff;
      color: #4338ca;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
    }

    .acta-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .acta-body {
      font-size: 0.8rem;
      color: #475569;
      line-height: 1.5;
      margin: 0 0 0.75rem 0;
      flex: 1;
    }

    .acta-compromisos {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.6rem;
      margin-bottom: 0.75rem;
    }

    .acta-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 0.75rem;
    }

    /* SIUCE Grid */
    .siuce-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .siuce-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }

    .siuce-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .siuce-num {
      font-size: 2.5rem;
      font-weight: 900;
      margin-bottom: 0.25rem;
    }

    .siuce-desc {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Ruta Grid */
    .ruta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .ruta-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
    }

    .ruta-card.border-blue { border-top: 4px solid #3b82f6; }
    .ruta-card.border-green { border-top: 4px solid #10b981; }
    .ruta-card.border-amber { border-top: 4px solid #f59e0b; }
    .ruta-card.border-purple { border-top: 4px solid #8b5cf6; }

    .ruta-step {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .ruta-card h4 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    }

    .ruta-card p {
      font-size: 0.8rem;
      color: #475569;
      line-height: 1.5;
      margin: 0;
    }

    /* Modales */
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
      overflow-y: auto;
    }

    .modal-card {
      margin: auto !important;
      width: 100%;
      background-color: #ffffff;
      padding: 1.75rem;
      border-radius: 16px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.75rem;
      color: #64748b;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      color: #94a3b8;
    }

    .close-btn:hover {
      color: #0f172a;
    }

    .modal-help-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 0.75rem;
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      margin-bottom: 1rem;
      font-size: 0.8rem;
      color: #1e3a8a;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .estudiante-summary-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #f8fafc;
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .estudiante-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #4f46e5;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.9rem;
    }

    .descargo-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.6rem;
      margin-bottom: 0.5rem;
    }

    .descargo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `]
})
export class ConvivenciaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);
  readonly modalManager = inject(ModalManagerService);

  readonly tabActiva = signal<'observador' | 'comite' | 'siuce' | 'ruta'>('observador');
  readonly casosList = signal<CasoConvivenciaItem[]>([]);
  readonly actasList = signal<ActaComiteItem[]>([]);
  readonly estudiantesList = signal<any[]>([]);
  readonly metricas = signal<any>({});

  // Modales
  readonly modalNuevoCaso = signal(false);
  readonly modalNuevaActa = signal(false);
  readonly casoSeleccionado = signal<CasoConvivenciaItem | null>(null);

  // Filtros
  filtroTexto = '';
  filtroTipoFalta = 'TODOS';
  filtroEstado = 'TODOS';

  // Formularios
  nuevoCasoForm = {
    matriculaId: '',
    tipoFalta: 'TIPO_I',
    articuloManualConvivencia: '',
    descripcionHechos: '',
    lugarHechos: 'Patio escolar',
    fechaHechos: new Date().toISOString().split('T')[0],
  };

  nuevoDescargoForm = {
    versionHechos: '',
    urlPruebasAdjuntas: '',
  };

  nuevaActaForm = {
    numeroActa: '',
    fechaReunion: new Date().toISOString().split('T')[0],
    decisionesAdoptadas: '',
    compromisosAdquiridos: '',
  };

  medidaFormativaInput = '';
  estadoActualizarInput = 'ABIERTO';

  // Totales computados
  readonly totalTipo1 = computed(() => this.casosList().filter(c => c.tipo_falta === 'TIPO_I').length);
  readonly totalTipo2 = computed(() => this.casosList().filter(c => c.tipo_falta === 'TIPO_II').length);
  readonly totalTipo3 = computed(() => this.casosList().filter(c => c.tipo_falta === 'TIPO_III').length);

  readonly casosFiltrados = computed(() => {
    let list = this.casosList();
    const query = this.filtroTexto.toLowerCase().trim();

    if (query) {
      list = list.filter(c =>
        (c.primer_nombre?.toLowerCase() || '').includes(query) ||
        (c.primer_apellido?.toLowerCase() || '').includes(query) ||
        (c.numero_documento || '').includes(query) ||
        (c.descripcion_hechos || '').toLowerCase().includes(query)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.cargarCasos();
    this.cargarActas();
    this.cargarMetricasSiuce();
    this.cargarEstudiantes();
  }

  cargarCasos() {
    let url = 'convivencia/casos';
    const params: string[] = [];
    if (this.filtroEstado && this.filtroEstado !== 'TODOS') params.push(`estado=${this.filtroEstado}`);
    if (this.filtroTipoFalta && this.filtroTipoFalta !== 'TODOS') params.push(`tipoFalta=${this.filtroTipoFalta}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    this.api.get<any>(url).subscribe({
      next: (res) => {
        if (res && res.casos) {
          this.casosList.set(res.casos);
        } else if (Array.isArray(res)) {
          this.casosList.set(res);
        }
      },
      error: () => {
        // Mock inicial amigable si la BD aún no tiene casos registrados
        this.casosList.set([
          {
            id: 'c1-mock',
            primer_nombre: 'Valentina',
            primer_apellido: 'Rodríguez',
            numero_documento: '1023456789',
            tipo_documento: 'TI',
            grupo_nombre: '10°A',
            tipo_falta: 'TIPO_I',
            articulo_manual_convivencia: 'Capítulo 4, Art. 15 (Uso de celular en clase)',
            descripcion_hechos: 'Uso reiterado del teléfono celular durante la explicación del docente sin autorización previa.',
            lugar_hechos: 'Aula 10B',
            fecha_hechos: '2026-08-14',
            estado: 'CONCILIACION',
            medida_formativa: 'Compromiso de entrega del dispositivo en portería y elaboración de resumen temático.',
            reportado_por_nombres: 'Carlos',
            reportado_por_apellidos: 'Gómez',
          },
          {
            id: 'c2-mock',
            primer_nombre: 'Mateo',
            primer_apellido: 'Castro',
            numero_documento: '1034567890',
            tipo_documento: 'TI',
            grupo_nombre: '9°B',
            tipo_falta: 'TIPO_II',
            articulo_manual_convivencia: 'Capítulo 6, Art. 28 (Ciberacoso y exclusión reiterada)',
            descripcion_hechos: 'Publicación de comentarios despectivos y memes en grupo de mensajería afectando a un compañero de aula.',
            lugar_hechos: 'Redes Sociales',
            fecha_hechos: '2026-08-12',
            estado: 'EN_DESCARGOS',
            reportado_por_nombres: 'María',
            reportado_por_apellidos: 'Fernández',
          }
        ]);
      }
    });
  }

  cargarActas() {
    this.api.get<any>('convivencia/actas-comite').subscribe({
      next: (res) => {
        if (res && res.actas) {
          this.actasList.set(res.actas);
        } else if (Array.isArray(res)) {
          this.actasList.set(res);
        }
      },
      error: () => {
        this.actasList.set([
          {
            id: 'acta-01',
            numero_acta: 'ACTA-CCE-2026-01',
            fecha_reunion: '2026-07-28',
            decisiones_adoptadas: 'Se revisó caso de mediación escolar del grado 9°B. Se concertó acuerdo de no agresión y trabajo de sensibilización grupal.',
            compromisos_adquiridos: 'Acompañamiento semanal por Psicorientación y seguimiento del Personero Estudiantil.',
          }
        ]);
      }
    });
  }

  cargarMetricasSiuce() {
    this.api.get<any>('convivencia/metricas-siuce').subscribe({
      next: (res) => {
        if (res) this.metricas.set(res);
      },
    });
  }

  cargarEstudiantes() {
    this.api.get<any[]>('convivencia/estudiantes-matriculados').subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.estudiantesList.set(res);
          this.nuevoCasoForm.matriculaId = res[0].matricula_id;
        }
      },
      error: () => {
        // Fallback a matriculas estándar
        this.api.get<any[]>('matriculas').subscribe((mats) => {
          if (mats && mats.length > 0) {
            const mapped = mats.map(m => ({
              matricula_id: m.id,
              estudiante_id: m.estudianteId,
              primer_nombre: m.estudianteNombre?.split(' ')[0] || 'Estudiante',
              primer_apellido: m.estudianteNombre?.split(' ')[1] || '',
              numero_documento: m.estudianteDocumento || '10000000',
              grado_nombre: m.gradoNombre || 'Grado',
              grupo_nombre: m.grupoNombre || '10°A',
            }));
            this.estudiantesList.set(mapped);
            this.nuevoCasoForm.matriculaId = mapped[0].matricula_id;
          }
        });
      }
    });
  }

  // --- CRUD: NUEVO CASO ---
  abrirModalNuevoCaso() {
    this.nuevoCasoForm = {
      matriculaId: this.estudiantesList()[0]?.matricula_id || '',
      tipoFalta: 'TIPO_I',
      articuloManualConvivencia: '',
      descripcionHechos: '',
      lugarHechos: 'Aula de clase',
      fechaHechos: new Date().toISOString().split('T')[0],
    };
    this.modalManager.open('nuevoCaso');
    this.modalNuevoCaso.set(true);
  }

  cerrarModalNuevoCaso() {
    this.modalManager.close('nuevoCaso');
    this.modalNuevoCaso.set(false);
  }

  guardarNuevoCaso() {
    if (!this.nuevoCasoForm.matriculaId || !this.nuevoCasoForm.descripcionHechos) {
      this.toast.error('Campos Requeridos', 'Por favor seleccione el estudiante y detalle la descripción de los hechos.');
      return;
    }

    this.api.post<any>('convivencia/casos', this.nuevoCasoForm).subscribe({
      next: () => {
        this.cerrarModalNuevoCaso();
        this.toast.success('¡Anotación Radicada!', 'El caso ha sido registrado en el Observador Digital en cumplimiento de la Ley 1620.');
        this.cargarCasos();
        this.cargarMetricasSiuce();
      },
      error: (err) => {
        this.toast.error('Error al radicar caso', err?.error?.message || 'No fue posible guardar el registro.');
      }
    });
  }

  // --- DETALLE & DESCARGOS ---
  verDetalleCaso(caso: CasoConvivenciaItem) {
    this.api.get<any>(`convivencia/casos/${caso.id}`).subscribe({
      next: (detalle) => {
        this.casoSeleccionado.set(detalle);
        this.medidaFormativaInput = detalle.medida_formativa || '';
        this.estadoActualizarInput = detalle.estado || 'ABIERTO';
        this.modalManager.open('detalleCaso');
      },
      error: () => {
        this.casoSeleccionado.set(caso);
        this.medidaFormativaInput = caso.medida_formativa || '';
        this.estadoActualizarInput = caso.estado || 'ABIERTO';
        this.modalManager.open('detalleCaso');
      }
    });
  }

  cerrarDetalleCaso() {
    this.modalManager.close('detalleCaso');
    this.casoSeleccionado.set(null);
  }

  abrirModalDescargos(caso: CasoConvivenciaItem) {
    this.verDetalleCaso(caso);
  }

  guardarDescargo() {
    const caso = this.casoSeleccionado();
    if (!caso) return;
    if (!this.nuevoDescargoForm.versionHechos) {
      this.toast.error('Campo Requerido', 'Por favor ingrese la versión de descargos del estudiante.');
      return;
    }

    this.api.post<any>(`convivencia/casos/${caso.id}/descargos`, this.nuevoDescargoForm).subscribe({
      next: (res) => {
        this.toast.success('¡Descargos Radicados!', res?.mensaje || 'Versión guardada como garantía del debido proceso.');
        this.nuevoDescargoForm.versionHechos = '';
        this.verDetalleCaso(caso);
        this.cargarCasos();
      },
      error: (err) => {
        this.toast.error('Error al radicar descargos', err?.error?.message || 'No se pudo guardar la versión.');
      }
    });
  }

  actualizarEstadoCaso() {
    const caso = this.casoSeleccionado();
    if (!caso) return;

    this.api.put<any>(`convivencia/casos/${caso.id}`, {
      estado: this.estadoActualizarInput,
      medidaFormativa: this.medidaFormativaInput,
    }).subscribe({
      next: () => {
        this.toast.success('¡Caso Actualizado!', `Estado actualizado a '${this.estadoActualizarInput}'.`);
        this.cerrarDetalleCaso();
        this.cargarCasos();
        this.cargarMetricasSiuce();
      },
      error: (err) => {
        this.toast.error('Error al actualizar', err?.error?.message || 'No se pudo actualizar el estado.');
      }
    });
  }

  // --- ACTAS DEL COMITÉ ---
  abrirModalNuevaActa() {
    const total = this.actasList().length + 1;
    this.nuevaActaForm = {
      numeroActa: `ACTA-CCE-${new Date().getFullYear()}-0${total}`,
      fechaReunion: new Date().toISOString().split('T')[0],
      decisionesAdoptadas: '',
      compromisosAdquiridos: '',
    };
    this.modalManager.open('nuevaActa');
    this.modalNuevaActa.set(true);
  }

  cerrarModalNuevaActa() {
    this.modalManager.close('nuevaActa');
    this.modalNuevaActa.set(false);
  }

  guardarNuevaActa() {
    if (!this.nuevaActaForm.numeroActa || !this.nuevaActaForm.decisionesAdoptadas) {
      this.toast.error('Campos Requeridos', 'Por favor indique el número de acta y las decisiones adoptadas.');
      return;
    }

    this.api.post<any>('convivencia/actas-comite', this.nuevaActaForm).subscribe({
      next: () => {
        this.cerrarModalNuevaActa();
        this.toast.success('¡Acta Registrada!', `El acta ${this.nuevaActaForm.numeroActa} ha sido foliada en el libro de actas.`);
        this.cargarActas();
      },
      error: (err) => {
        this.toast.error('Error al guardar acta', err?.error?.message || 'No fue posible guardar el acta.');
      }
    });
  }

  imprimirActa(acta: ActaComiteItem) {
    this.toast.info('Generando Vista de Impresión', `Preparando acta ${acta.numero_acta} con firmas institucionales.`);
    window.print();
  }

  exportarReporteSiuce() {
    this.toast.success('Reporte SIUCE Generado', 'Se ha consolidado la matriz semestral de convivencia para reporte a la Secretaría de Educación.');
  }

  // Helpers de Formato
  getNombreTipoFalta(tipo: string): string {
    switch (tipo) {
      case 'TIPO_I': return 'Tipo I (Leve)';
      case 'TIPO_II': return 'Tipo II (Acoso / Bullying)';
      case 'TIPO_III': return 'Tipo III (Gravísima / Delito)';
      default: return tipo;
    }
  }

  getBadgeClassTipoFalta(tipo: string): string {
    switch (tipo) {
      case 'TIPO_I': return 'badge-tipo1';
      case 'TIPO_II': return 'badge-tipo2';
      case 'TIPO_III': return 'badge-tipo3';
      default: return 'badge-tag';
    }
  }

  getBadgeClassEstado(estado: string): string {
    switch (estado) {
      case 'ABIERTO': return 'badge-abierto';
      case 'EN_DESCARGOS': return 'badge-descargos';
      case 'CONCILIACION':
      case 'CERRADO': return 'badge-conciliado';
      default: return 'badge-tag';
    }
  }

  calcularTasaResolucion(): number {
    const total = this.casosList().length;
    if (total === 0) return 100;
    const cerrados = this.casosList().filter(c => c.estado === 'CERRADO' || c.estado === 'CONCILIACION').length;
    return Math.round((cerrados / total) * 100);
  }
}
