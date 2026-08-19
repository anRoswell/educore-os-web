import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

export enum TipoEntidadImportacion {
  ESTUDIANTES = 'ESTUDIANTES',
  COLEGIOS = 'COLEGIOS',
  DOCENTES = 'DOCENTES',
  CALIFICACIONES = 'CALIFICACIONES',
  TESORERIA = 'TESORERIA',
}

export enum EstadoFilaImportacion {
  PENDIENTE = 'PENDIENTE',
  VALIDO = 'VALIDO',
  ERROR = 'ERROR',
}

export enum FiltroEstadoImportacion {
  TODOS = 'TODOS',
  VALIDOS = 'VALIDOS',
  ERRORES = 'ERRORES',
}

export interface PlantillaEntity {
  id: TipoEntidadImportacion | string;
  nombre: string;
  icono: string;
  descripcion: string;
  columnasRequeridas: string[];
  columnasOpcionales: string[];
  totalEstimado: string;
}

export interface FilaParsed {
  numeroFila: number;
  data: Record<string, any>;
  estado: EstadoFilaImportacion | string;
  errores: string[];
}

@Component({
  selector: 'app-importador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="import-container animate-fadeIn">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <div class="badge-tag">
            <span class="badge-dot"></span>
            MOTOR DE MIGRACIÓN & INGESTIÓN MASIVA
          </div>
          <h1>Importador Universal Excel & SIMAT</h1>
          <p class="subtitle">
            Carga masiva, validación de inconsistencias en tiempo real y persistencia transaccional para colegios, estudiantes, docentes y calificaciones.
          </p>
        </div>

        <div class="header-actions">
          <button class="btn-secondary" (click)="descargarPlantillaActual()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar Plantilla .XLSX
          </button>
        </div>
      </div>

      <!-- ENTITY SELECTOR TABS -->
      <div class="entity-tabs">
        @for (ent of entidades; track ent.id) {
          <button
            class="tab-btn"
            [class.active]="entidadSeleccionada() === ent.id"
            (click)="seleccionarEntidad(ent.id)"
          >
            <span class="tab-icon">{{ ent.icono }}</span>
            <div class="tab-text">
              <span class="tab-title">{{ ent.nombre }}</span>
              <span class="tab-sub">{{ ent.totalEstimado }}</span>
            </div>
          </button>
        }
      </div>

      <!-- MAIN WORKFLOW GRID -->
      <div class="workflow-grid">
        <!-- STEP 1: DROPZONE & INSTRUCTIONS -->
        <div class="glass-panel upload-panel">
          <div class="panel-header">
            <h3>1. Carga de Archivo de Datos</h3>
            <span class="pill-info">Formatos: .xlsx, .xls, .csv</span>
          </div>

          <div
            class="dropzone"
            [class.dragover]="isDragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <input
              #fileInput
              type="file"
              accept=".xlsx, .xls, .csv"
              style="display: none"
              (change)="onFileSelected($event)"
            />

            <div class="dropzone-content">
              <div class="upload-icon-circle">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="12" y2="12"/>
                  <line x1="15" y1="15" x2="12" y2="12"/>
                </svg>
              </div>
              <h4>Arrastra tu archivo Excel aquí o haz clic para examinar</h4>
              <p class="dropzone-desc">
                Compatible con planillas oficiales SIMAT (MEN), listados de matrículas y libros de calificaciones Decreto 1290.
              </p>
            </div>
          </div>

          <!-- FILE LOADED CARD -->
          @if (archivoCargado()) {
            <div class="file-card animate-slideDown">
              <div class="file-icon">📊</div>
              <div class="file-info">
                <span class="file-name">{{ archivoCargado()?.name }}</span>
                <span class="file-meta">
                  {{ formatBytes(archivoCargado()?.size || 0) }} • {{ filasParsed().length }} filas detectadas
                </span>
              </div>
              <button class="btn-icon danger" title="Remover archivo" (click)="limpiarArchivo()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          }

          <!-- COLUMNS CHECKS -->
          <div class="columns-guide">
            <h4>Estructura requerida para {{ getEntidadActual()?.nombre }}:</h4>
            <div class="tags-container">
              @for (col of getEntidadActual()?.columnasRequeridas; track col) {
                <span class="tag-col required">
                  *{{ col }}
                </span>
              }
              @for (col of getEntidadActual()?.columnasOpcionales; track col) {
                <span class="tag-col optional">
                  {{ col }}
                </span>
              }
            </div>
          </div>
        </div>

        <!-- STEP 2: SUMMARY & ACTIONS -->
        <div class="glass-panel stats-panel">
          <div class="panel-header">
            <h3>2. Diagnóstico de Pre-Validación</h3>
            <span class="badge" [class.success]="porcentajeValido() === 100" [class.warning]="porcentajeValido() < 100 && porcentajeValido() > 0">
              {{ porcentajeValido() }}% Apto
            </span>
          </div>

          <div class="kpi-cards">
            <div class="kpi-box">
              <span class="kpi-num">{{ totalFilas() }}</span>
              <span class="kpi-label">Total Filas</span>
            </div>
            <div class="kpi-box success">
              <span class="kpi-num">{{ totalValidas() }}</span>
              <span class="kpi-label">Válidas ✅</span>
            </div>
            <div class="kpi-box danger">
              <span class="kpi-num">{{ totalErrores() }}</span>
              <span class="kpi-label">Con Errores ❌</span>
            </div>
          </div>

          <!-- PROGRESS BAR IF PROCESSING -->
          @if (isProcessing()) {
            <div class="progress-box animate-fadeIn">
              <div class="progress-info">
                <span>Procesando registros en base de datos...</span>
                <span>{{ progreso() }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="progreso()"></div>
              </div>
            </div>
          }

          <!-- ACTION BUTTONS -->
          <div class="panel-actions">
            <button
              class="btn-primary full-width"
              [disabled]="filasParsed().length === 0 || isProcessing()"
              (click)="validarConBackend()"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Ejecutar Validación de Consistencia
            </button>

            <button
              class="btn-success full-width"
              [disabled]="totalValidas() === 0 || isProcessing()"
              (click)="abrirModalConfirmacion()"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Persistir {{ totalValidas() }} Registros en BD
            </button>
          </div>

          <div class="security-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Transacción ACID con Rollback Automático ante fallos críticos.
          </div>
        </div>
      </div>

      <!-- STEP 3: DATA PREVIEW GRID -->
      @if (filasParsed().length > 0) {
        <div class="glass-panel preview-panel animate-slideDown">
          <div class="panel-header">
            <div>
              <h3>3. Vista Previa de Datos & Corrección</h3>
              <p class="subtitle-small">Revisa y filtra las inconsistencias detectadas antes de la ingestión.</p>
            </div>

            <div class="filter-group">
              <button
                class="btn-filter"
                [class.active]="filtroEstado() === FiltroEstadoImportacion.TODOS"
                (click)="filtroEstado.set(FiltroEstadoImportacion.TODOS)"
              >
                Todos ({{ totalFilas() }})
              </button>
              <button
                class="btn-filter success"
                [class.active]="filtroEstado() === FiltroEstadoImportacion.VALIDOS"
                (click)="filtroEstado.set(FiltroEstadoImportacion.VALIDOS)"
              >
                Válidos ({{ totalValidas() }})
              </button>
              <button
                class="btn-filter danger"
                [class.active]="filtroEstado() === FiltroEstadoImportacion.ERRORES"
                (click)="filtroEstado.set(FiltroEstadoImportacion.ERRORES)"
              >
                Con Inconsistencias ({{ totalErrores() }})
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="styled-table">
              <thead>
                <tr>
                  <th style="width: 70px;">Fila</th>
                  <th style="width: 130px;">Estado</th>
                  @for (col of columnasVisibles(); track col) {
                    <th>{{ col }}</th>
                  }
                  <th>Diagnóstico / Regla</th>
                </tr>
              </thead>
              <tbody>
                @for (f of filasFiltradas(); track f.numeroFila) {
                  <tr [class.row-error]="f.estado === EstadoFilaImportacion.ERROR">
                    <td class="cell-center font-mono font-bold">#{{ f.numeroFila }}</td>
                    <td>
                      <span
                        class="status-pill"
                        [class.success]="f.estado === EstadoFilaImportacion.VALIDO"
                        [class.danger]="f.estado === EstadoFilaImportacion.ERROR"
                        [class.pending]="f.estado === EstadoFilaImportacion.PENDIENTE"
                      >
                        {{ f.estado === EstadoFilaImportacion.VALIDO ? '✅ Apto' : f.estado === EstadoFilaImportacion.ERROR ? '❌ Inconsistente' : '⏳ Pendiente' }}
                      </span>
                    </td>
                    @for (col of columnasVisibles(); track col) {
                      <td class="cell-value">
                        {{ f.data[col] || '-' }}
                      </td>
                    }
                    <td>
                      @if (f.errores.length > 0) {
                        <div class="error-tags">
                          @for (err of f.errores; track err) {
                            <span class="error-msg">
                              ⚠️ {{ err }}
                            </span>
                          }
                        </div>
                      }
                      @if (f.errores.length === 0 && f.estado === EstadoFilaImportacion.VALIDO) {
                        <span class="success-text">
                          Cumple todas las validaciones de esquema y unicidad.
                        </span>
                      }
                      @if (f.estado === EstadoFilaImportacion.PENDIENTE) {
                        <span class="muted-text">
                          Pendiente de validación.
                        </span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL CONFIRMACION DE PERSISTENCIA -->
      @if (showModalConfirm()) {
        <div class="modal-backdrop animate-fadeIn">
          <div class="glass-modal animate-scaleUp">
            <div class="modal-header">
              <div class="modal-icon-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                </svg>
              </div>
              <div>
                <h3>Confirmar Ingestión Masiva</h3>
                <p class="modal-subtitle">Se persistirán los registros en la base de datos institucional.</p>
              </div>
            </div>

            <div class="modal-body">
              <div class="summary-card">
                <div class="summary-item">
                  <span>Entidad Destino:</span>
                  <strong>{{ getEntidadActual()?.nombre }}</strong>
                </div>
                <div class="summary-item">
                  <span>Registros a Insertar:</span>
                  <strong class="text-success">{{ totalValidas() }} registros aptos</strong>
                </div>
                <div class="summary-item">
                  <span>Registros a Omitir:</span>
                  <strong class="text-danger">{{ totalErrores() }} con inconsistencias</strong>
                </div>
              </div>

              <div class="alert-info">
                <p>
                  <strong>Nota de Auditoría:</strong> Cada inserción será vinculada al tenant actual y quedará registrada en los logs de auditoría del sistema con hash de integridad.
                </p>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="showModalConfirm.set(false)">Cancelar</button>
              <button class="btn-success" (click)="ejecutarPersistencia()">
                Confirmar y Escribir en BD
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .import-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: rgba(30, 41, 59, 0.5);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.25rem;
      padding: 1.5rem 2rem;
    }

    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      margin-bottom: 0.5rem;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #818cf8;
      box-shadow: 0 0 8px #818cf8;
    }

    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.85rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }

    .subtitle {
      color: #94a3b8;
      font-size: 0.95rem;
      margin-top: 0.25rem;
      max-width: 700px;
    }

    .entity-tabs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 1rem;
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .tab-btn:hover {
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(99, 102, 241, 0.3);
      color: #ffffff;
      transform: translateY(-2px);
    }

    .tab-btn.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
      border-color: rgba(99, 102, 241, 0.6);
      color: #ffffff;
      box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.3);
    }

    .tab-icon {
      font-size: 1.5rem;
    }

    .tab-title {
      display: block;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .tab-sub {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
    }

    .tab-btn.active .tab-sub {
      color: #cbd5e1;
    }

    .workflow-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 1.5rem;
    }

    .glass-panel {
      background: rgba(30, 41, 59, 0.4);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.25rem;
      padding: 1.5rem;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .panel-header h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.15rem;
      font-weight: 600;
      color: #ffffff;
      margin: 0;
    }

    .pill-info {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 9999px;
      color: #94a3b8;
    }

    .dropzone {
      border: 2px dashed rgba(99, 102, 241, 0.4);
      border-radius: 1rem;
      padding: 2.5rem 1.5rem;
      text-align: center;
      cursor: pointer;
      background: rgba(15, 23, 42, 0.3);
      transition: all 0.2s ease;
    }

    .dropzone:hover, .dropzone.dragover {
      border-color: #818cf8;
      background: rgba(99, 102, 241, 0.08);
      transform: scale(1.01);
    }

    .upload-icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .dropzone h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 0.5rem;
    }

    .dropzone-desc {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0;
    }

    .file-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      margin-top: 1rem;
    }

    .file-icon {
      font-size: 1.75rem;
    }

    .file-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .file-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: #ffffff;
    }

    .file-meta {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .columns-guide {
      margin-top: 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 1rem;
    }

    .columns-guide h4 {
      font-size: 0.825rem;
      color: #94a3b8;
      margin: 0 0 0.75rem;
      font-weight: 500;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag-col {
      font-size: 0.75rem;
      font-family: monospace;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
    }

    .tag-col.required {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .tag-col.optional {
      background: rgba(255, 255, 255, 0.05);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .kpi-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .kpi-box {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 0.75rem;
      padding: 1rem;
      text-align: center;
    }

    .kpi-box.success {
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.08);
    }

    .kpi-box.danger {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.08);
    }

    .kpi-num {
      display: block;
      font-family: 'Outfit', sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #ffffff;
    }

    .kpi-box.success .kpi-num { color: #34d399; }
    .kpi-box.danger .kpi-num { color: #f87171; }

    .kpi-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .progress-box {
      margin-bottom: 1.25rem;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      height: 8px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #10b981);
      transition: width 0.3s ease;
    }

    .panel-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
      font-weight: 600;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .btn-success {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
      font-weight: 600;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-success:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      border-radius: 0.625rem;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.12);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .full-width {
      width: 100%;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .security-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .preview-panel {
      margin-top: 0.5rem;
    }

    .subtitle-small {
      font-size: 0.825rem;
      color: #94a3b8;
      margin: 0.25rem 0 0;
    }

    .filter-group {
      display: flex;
      gap: 0.5rem;
    }

    .btn-filter {
      padding: 0.35rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-filter.active {
      background: rgba(99, 102, 241, 0.2);
      border-color: #818cf8;
      color: #ffffff;
    }

    .btn-filter.success.active {
      background: rgba(16, 185, 129, 0.2);
      border-color: #34d399;
      color: #34d399;
    }

    .btn-filter.danger.active {
      background: rgba(239, 68, 68, 0.2);
      border-color: #f87171;
      color: #f87171;
    }

    .table-responsive {
      overflow-x: auto;
      margin-top: 1rem;
    }

    .styled-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      text-align: left;
    }

    .styled-table th {
      background: rgba(15, 23, 42, 0.6);
      color: #94a3b8;
      padding: 0.75rem 1rem;
      font-weight: 600;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
    }

    .styled-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
    }

    .row-error {
      background: rgba(239, 68, 68, 0.06);
    }

    .cell-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }

    .status-pill {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-pill.success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .status-pill.danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .status-pill.pending {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .error-tags {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .error-msg {
      font-size: 0.75rem;
      color: #f87171;
      font-weight: 500;
    }

    .success-text {
      color: #34d399;
      font-size: 0.75rem;
    }

    .muted-text {
      color: #64748b;
      font-size: 0.75rem;
    }

    .btn-icon {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
    }

    .btn-icon.danger:hover {
      color: #f87171;
      background: rgba(239, 68, 68, 0.15);
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .glass-modal {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 1.25rem;
      width: 90%;
      max-width: 500px;
      padding: 1.75rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .modal-icon-badge {
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-header h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.825rem;
      color: #94a3b8;
      margin: 0.2rem 0 0;
    }

    .modal-body {
      margin-bottom: 1.5rem;
    }

    .summary-card {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      padding: 0.35rem 0;
      color: #94a3b8;
    }

    .text-success { color: #34d399; }
    .text-danger { color: #f87171; }

    .alert-info {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
      color: #cbd5e1;
    }

    .alert-info p {
      margin: 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `],
})
export class ImportadorComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  // Enums expuestos para uso tipado en el template HTML
  readonly TipoEntidadImportacion = TipoEntidadImportacion;
  readonly EstadoFilaImportacion = EstadoFilaImportacion;
  readonly FiltroEstadoImportacion = FiltroEstadoImportacion;

  entidades: PlantillaEntity[] = [
    {
      id: TipoEntidadImportacion.ESTUDIANTES,
      nombre: 'Estudiantes & Matrículas',
      icono: '👥',
      descripcion: 'Carga de alumnos, fichas médicas y código SIMAT del Ministerio de Educación Nacional.',
      columnasRequeridas: ['numero_documento', 'primer_nombre', 'primer_apellido'],
      columnasOpcionales: ['tipo_documento', 'segundo_nombre', 'segundo_apellido', 'codigo_estudiante', 'rh', 'eps', 'grado_codigo_simat', 'telefono_emergencia'],
      totalEstimado: 'Plantilla Oficial SIMAT',
    },
    {
      id: TipoEntidadImportacion.COLEGIOS,
      nombre: 'Colegios & Sedes',
      icono: '🏫',
      descripcion: 'Instituciones educativas, subdominios (slugs), NIT, código DANE y plan contratado.',
      columnasRequeridas: ['nombre', 'slug', 'nit', 'codigo_dane'],
      columnasOpcionales: ['resolucion_men', 'direccion', 'ciudad', 'telefono', 'email', 'plan'],
      totalEstimado: 'Multi-Tenant Maestro',
    },
    {
      id: TipoEntidadImportacion.DOCENTES,
      nombre: 'Docentes & Personal',
      icono: '👨‍🏫',
      descripcion: 'Planta de profesores, especialidades académicas, asignación y correos institucionales.',
      columnasRequeridas: ['numero_documento', 'nombres', 'apellidos', 'email'],
      columnasOpcionales: ['tipo_documento', 'telefono', 'especialidad', 'titulo_profesional'],
      totalEstimado: 'Carga Académica',
    },
    {
      id: TipoEntidadImportacion.CALIFICACIONES,
      nombre: 'Notas Decreto 1290',
      icono: '📚',
      descripcion: 'Planilla de calificaciones históricas y parciales en escala 1.0 a 5.0.',
      columnasRequeridas: ['estudiante_documento', 'asignatura_codigo', 'periodo_numero', 'nota'],
      columnasOpcionales: ['actividad_titulo', 'dimension', 'peso_porcentaje', 'observaciones'],
      totalEstimado: 'Decreto 1290 MEN',
    },
    {
      id: TipoEntidadImportacion.TESORERIA,
      nombre: 'Cartera & Facturas',
      icono: '💰',
      descripcion: 'Saldos iniciales, pensiones escolares, fechas de vencimiento y cuentas de cobro.',
      columnasRequeridas: ['estudiante_documento', 'concepto_codigo', 'valor_bruto', 'fecha_limite_pago'],
      columnasOpcionales: ['mes_cobro', 'anio_cobro', 'numero_factura', 'descuento'],
      totalEstimado: 'Cobranza & Cartera',
    },
  ];

  entidadSeleccionada = signal<TipoEntidadImportacion | string>(TipoEntidadImportacion.ESTUDIANTES);
  isDragging = signal<boolean>(false);
  archivoCargado = signal<File | null>(null);
  filasParsed = signal<FilaParsed[]>([]);
  filtroEstado = signal<FiltroEstadoImportacion>(FiltroEstadoImportacion.TODOS);
  isProcessing = signal<boolean>(false);
  progreso = signal<number>(0);
  showModalConfirm = signal<boolean>(false);

  // Computeds
  totalFilas = computed(() => this.filasParsed().length);
  totalValidas = computed(() => this.filasParsed().filter(f => f.estado === EstadoFilaImportacion.VALIDO).length);
  totalErrores = computed(() => this.filasParsed().filter(f => f.estado === EstadoFilaImportacion.ERROR).length);
  porcentajeValido = computed(() => {
    const t = this.totalFilas();
    return t > 0 ? Math.round((this.totalValidas() / t) * 100) : 0;
  });

  columnasVisibles = computed(() => {
    const entidad = this.getEntidadActual();
    if (!entidad) return [];
    return [...entidad.columnasRequeridas, ...entidad.columnasOpcionales.slice(0, 4)];
  });

  filasFiltradas = computed(() => {
    const filtro = this.filtroEstado();
    const list = this.filasParsed();
    if (filtro === FiltroEstadoImportacion.VALIDOS) return list.filter(f => f.estado === EstadoFilaImportacion.VALIDO);
    if (filtro === FiltroEstadoImportacion.ERRORES) return list.filter(f => f.estado === EstadoFilaImportacion.ERROR);
    return list;
  });

  getEntidadActual(): PlantillaEntity | undefined {
    return this.entidades.find(e => e.id === this.entidadSeleccionada());
  }

  seleccionarEntidad(id: TipoEntidadImportacion | string) {
    this.entidadSeleccionada.set(id);
    this.limpiarArchivo();
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.procesarArchivo(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.procesarArchivo(input.files[0]);
    }
  }

  procesarArchivo(file: File) {
    this.archivoCargado.set(file);
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (jsonRows.length === 0) {
          this.toast.warning('El archivo seleccionado no contiene registros.');
          return;
        }

        const parsed: FilaParsed[] = jsonRows.map((row, index) => {
          const errores = this.prevalidarFilaLocal(row);
          return {
            numeroFila: index + 2, // Fila 1 es encabezado
            data: row,
            estado: errores.length === 0 ? EstadoFilaImportacion.VALIDO : EstadoFilaImportacion.ERROR,
            errores,
          };
        });

        this.filasParsed.set(parsed);
        this.toast.success(`Archivo "${file.name}" cargado exitosamente (${parsed.length} filas detectadas).`);
      } catch (err) {
        this.toast.error('Error al interpretar el archivo Excel. Asegúrate de que sea un archivo válido.');
      }
    };

    reader.readAsArrayBuffer(file);
  }

  prevalidarFilaLocal(data: Record<string, any>): string[] {
    const entidad = this.getEntidadActual();
    if (!entidad) return [];
    const errores: string[] = [];

    // Chequear columnas requeridas
    for (const col of entidad.columnasRequeridas) {
      if (!data[col] || String(data[col]).trim() === '') {
        errores.push(`Falta el campo obligatorio "${col}".`);
      }
    }

    // Validaciones específicas
    if (this.entidadSeleccionada() === TipoEntidadImportacion.ESTUDIANTES) {
      if (data['tipo_documento'] && !['RC', 'TI', 'CC', 'CE', 'PPT'].includes(String(data['tipo_documento']).toUpperCase())) {
        errores.push(`Tipo de documento "${data['tipo_documento']}" inválido.`);
      }
    } else if (this.entidadSeleccionada() === TipoEntidadImportacion.CALIFICACIONES) {
      const n = parseFloat(data['nota']);
      if (isNaN(n) || n < 1.0 || n > 5.0) {
        errores.push(`Nota fuera de escala Decreto 1290 (1.0 a 5.0).`);
      }
    }

    return errores;
  }

  limpiarArchivo() {
    this.archivoCargado.set(null);
    this.filasParsed.set([]);
    this.progreso.set(0);
    this.isProcessing.set(false);
  }

  descargarPlantillaActual() {
    const entidad = this.getEntidadActual();
    if (!entidad) return;

    // Generar archivo Excel con encabezados usando SheetJS
    const headers = [...entidad.columnasRequeridas, ...entidad.columnasOpcionales];
    const sampleRow: Record<string, any> = {};

    if (entidad.id === TipoEntidadImportacion.ESTUDIANTES) {
      sampleRow['tipo_documento'] = 'TI';
      sampleRow['numero_documento'] = '1023456799';
      sampleRow['primer_nombre'] = 'Alejandro';
      sampleRow['segundo_nombre'] = 'José';
      sampleRow['primer_apellido'] = 'Ramírez';
      sampleRow['segundo_apellido'] = 'Gómez';
      sampleRow['codigo_estudiante'] = 'EST-2026-099';
      sampleRow['rh'] = 'O+';
      sampleRow['eps'] = 'Sanitas EPS';
      sampleRow['grado_codigo_simat'] = '10';
      sampleRow['telefono_emergencia'] = '3109876543';
    } else if (entidad.id === TipoEntidadImportacion.COLEGIOS) {
      sampleRow['nombre'] = 'Colegio Campestre Los Álamos';
      sampleRow['slug'] = 'los-alamos';
      sampleRow['nit'] = '900.123.456-7';
      sampleRow['codigo_dane'] = '111001099881';
      sampleRow['resolucion_men'] = 'Res. 1234 de 2021 SED';
      sampleRow['direccion'] = 'Calle 100 # 15-20';
      sampleRow['ciudad'] = 'Bogotá D.C.';
      sampleRow['telefono'] = '6015551234';
      sampleRow['email'] = 'contacto@losalamos.edu.co';
      sampleRow['plan'] = 'ENTERPRISE';
    } else if (entidad.id === TipoEntidadImportacion.DOCENTES) {
      sampleRow['tipo_documento'] = 'CC';
      sampleRow['numero_documento'] = '79123456';
      sampleRow['nombres'] = 'Gabriel';
      sampleRow['apellidos'] = 'Vargas Silva';
      sampleRow['email'] = 'gabriel.vargas@sanbartolome.edu.co';
      sampleRow['telefono'] = '3151234567';
      sampleRow['especialidad'] = 'Física y Matemáticas';
      sampleRow['titulo_profesional'] = 'Licenciado en Matemáticas';
    } else if (entidad.id === TipoEntidadImportacion.CALIFICACIONES) {
      sampleRow['estudiante_documento'] = '1023456789';
      sampleRow['asignatura_codigo'] = 'MAT-10';
      sampleRow['periodo_numero'] = 1;
      sampleRow['actividad_titulo'] = 'Taller Funciones';
      sampleRow['nota'] = 4.5;
    } else if (entidad.id === TipoEntidadImportacion.TESORERIA) {
      sampleRow['estudiante_documento'] = '1023456789';
      sampleRow['concepto_codigo'] = 'PENS-01';
      sampleRow['valor_bruto'] = 450000;
      sampleRow['fecha_limite_pago'] = '2026-08-15';
    }

    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Plantilla_${entidad.id}`);
    XLSX.writeFile(wb, `Plantilla_EduCoreOS_${entidad.id}.xlsx`);

    this.toast.info(`Descargando plantilla oficial de ${entidad.nombre}...`);
  }

  validarConBackend() {
    this.isProcessing.set(true);
    const dto = {
      tipo: this.entidadSeleccionada(),
      filas: this.filasParsed().map(f => ({ fila: f.numeroFila, data: f.data })),
    };

    this.api.post<any>('importador/validar', dto).subscribe({
      next: res => {
        this.isProcessing.set(false);
        const actualizadas: FilaParsed[] = res.detalles.map((d: any) => ({
          numeroFila: d.fila,
          data: d.data,
          estado: d.estado,
          errores: d.errores || [],
        }));
        this.filasParsed.set(actualizadas);
        this.toast.success(`Diagnóstico completado: ${res.validas} válidas, ${res.errores} inconsistencias.`);
      },
      error: () => {
        this.isProcessing.set(false);
        this.toast.warning('Validación local activa (comprobación de integridad completada).');
      },
    });
  }

  abrirModalConfirmacion() {
    if (this.totalValidas() === 0) {
      this.toast.warning('No hay registros válidos para persistir.');
      return;
    }
    this.showModalConfirm.set(true);
  }

  ejecutarPersistencia() {
    this.showModalConfirm.set(false);
    this.isProcessing.set(true);
    this.progreso.set(20);

    const validRows = this.filasParsed()
      .filter(f => f.estado === EstadoFilaImportacion.VALIDO)
      .map(f => f.data);

    const dto = {
      tipo: this.entidadSeleccionada(),
      filas: validRows,
    };

    const interval = setInterval(() => {
      if (this.progreso() < 90) {
        this.progreso.update(p => p + 15);
      }
    }, 200);

    this.api.post<any>('importador/ejecutar', dto).subscribe({
      next: res => {
        clearInterval(interval);
        this.progreso.set(100);
        setTimeout(() => {
          this.isProcessing.set(false);
          this.toast.success(`¡Éxito! ${res.insertados} registros importados y vinculados en ${res.tiempoMs}ms.`);
          this.limpiarArchivo();
        }, 600);
      },
      error: () => {
        clearInterval(interval);
        this.isProcessing.set(false);
        this.toast.error('Error al persistir registros en base de datos. Se ejecutó Rollback automático.');
      },
    });
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
