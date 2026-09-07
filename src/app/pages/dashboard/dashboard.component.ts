import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { KpiRectoria } from '../../core/models';
import { EstadoCuenta } from '../../core/enums';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <!-- =================================================== -->
      <!-- VISTA 1: DASHBOARD PARA DOCENTE (PEDAGÓGICO)        -->
      <!-- =================================================== -->
      @if (authService.user()?.role === 'DOCENTE') {
        <!-- Header Docente -->
        <div class="dashboard-header">
          <div>
            <div class="badge-header">
              <span>👨‍🏫 PANEL DOCENTE</span>
              <span class="badge-pill">Decreto 1290 / MEN</span>
            </div>
            <h1>Dashboard Pedagógico & Gestión de Aula</h1>
            <p>
              Bienvenida(o),
              <strong
                >Prof. {{ authService.user()?.primerNombre }}
                {{ authService.user()?.primerApellido }}</strong
              >
              — {{ authService.colegio()?.nombre }}
            </p>
          </div>
          <div class="header-actions">
            <a routerLink="/academico" class="btn btn-primary">
              <span>📝 Mis Planillas (1290)</span>
            </a>
            <a routerLink="/lms" class="btn btn-secondary">
              <span>📚 Aula Virtual LMS</span>
            </a>
            <a routerLink="/educore-ai" class="btn btn-secondary">
              <span>✨ EduCore AI Planeador</span>
            </a>
          </div>
        </div>

        <!-- KPIs Pedagógicos Reales -->
        <div class="grid-cols-4 kpi-cards-grid">
          <div class="card kpi-card">
            <div class="kpi-icon-box blue">
              <span class="icon">👥</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">ESTUDIANTES A CARGO</span>
              <div class="kpi-value">{{ totalEstudiantesDocente() }}</div>
              <span class="kpi-sub positive">{{ totalGruposDocente() }} grupo(s) asignado(s)</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box green">
              <span class="icon">📋</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">CARGAS Y ASIGNATURAS</span>
              <div class="kpi-value">{{ totalPlanillasDocente() }}</div>
              <span class="kpi-sub positive">Planillas activas en periodo</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box emerald">
              <span class="icon">🎓</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">PROMEDIO DE MIS GRUPOS</span>
              <div class="kpi-value">{{ promedioGruposDocente() | number: '1.2-2' }}</div>
              <span class="kpi-sub positive">
                {{
                  promedioGruposDocente() >= 4.0
                    ? 'Desempeño Alto'
                    : promedioGruposDocente() >= 3.0
                      ? 'Desempeño Básico'
                      : 'Desempeño Bajo'
                }}
                (Dec. 1290)
              </span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box amber">
              <span class="icon">⚠️</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">EN RIESGO ACADÉMICO</span>
              <div class="kpi-value">{{ enRiesgoDocente() }}</div>
              <span class="kpi-sub text-amber-600">Nota < 3.0 para recuperación</span>
            </div>
          </div>
        </div>

        <!-- Fila 2: Mis Asignaturas + Tareas LMS -->
        <div class="grid-cols-2 mt-6">
          <!-- Mis Asignaturas y Planillas -->
          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>📚 Mis Asignaturas & Planillas Digitales</h3>
                <p>Cargas académicas asociadas en el sistema institucional</p>
              </div>
              <span class="badge badge-info">Cargas Asignadas</span>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th>Asignatura</th>
                    <th>Alumnos</th>
                    <th>Periodo</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  @for (carga of cursosDocente(); track carga.id) {
                    <tr>
                      <td>
                        <strong>{{ carga.grupoNombre }}</strong>
                      </td>
                      <td>{{ carga.asignaturaNombre }}</td>
                      <td>{{ carga.alumnos }} estudiantes</td>
                      <td><span class="badge badge-secondary">Periodo 1</span></td>
                      <td>
                        <a routerLink="/academico" class="btn btn-secondary btn-sm">
                          ✏️ Planilla
                        </a>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="text-center py-4 text-slate-500">
                        No hay cargas académicas asignadas para este docente.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tareas Activas en Aula Virtual LMS -->
          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>📚 Tareas & Actividades en Aula Virtual LMS</h3>
                <p>Publicación de guías y revisión de evidencias digitales</p>
              </div>
              <a routerLink="/lms" class="btn btn-primary btn-sm">Ir a LMS</a>
            </div>

            <div class="schedule-list">
              @for (tarea of tareasDocenteList(); track tarea.id) {
                <div class="schedule-item">
                  <div class="schedule-time">
                    <strong>{{ tarea.grupoNombre }}</strong>
                    <span>{{ tarea.asignaturaNombre }}</span>
                  </div>
                  <div class="schedule-detail">
                    <h4>{{ tarea.titulo }}</h4>
                    <p>
                      Límite: {{ tarea.fechaLimite | date: 'dd/MM/yyyy HH:mm' }} • Entregas:
                      {{ tarea.totalEntregas }}/{{ tarea.totalEstudiantes }}
                    </p>
                  </div>
                  <a routerLink="/lms" class="btn btn-secondary btn-sm" title="Revisar Entregas">
                    📋 Revisar
                  </a>
                </div>
              } @empty {
                <div class="empty-state-small py-4 text-center text-slate-500">
                  <p>No tienes tareas virtuales publicadas.</p>
                  <a routerLink="/lms" class="btn btn-primary btn-sm mt-2"
                    >➕ Publicar Primera Tarea</a
                  >
                </div>
              }
            </div>

            <div class="ai-box mt-4">
              <div class="ai-box-header">
                <span class="ai-icon">✨</span>
                <strong>EduCore AI — Asistente de Planeación Pedagógica</strong>
              </div>
              <p class="ai-text">
                Genera rúbricas de evaluación formativa y adaptaciones curriculares
                <strong>PIAR (Decreto 1421)</strong> en segundos.
              </p>
              <a routerLink="/educore-ai" class="btn btn-outline btn-sm mt-2">
                Abrir Copiloto de Planeación →
              </a>
            </div>
          </div>
        </div>
      }

      <!-- =================================================== -->
      <!-- VISTA 2: DASHBOARD PARA TESORERÍA (FINANCIERO)     -->
      <!-- =================================================== -->
      @else if (authService.user()?.role === 'TESORERO') {
        <!-- Header Tesorería -->
        <div class="dashboard-header">
          <div>
            <div class="badge-header">
              <span>💰 GESTIÓN FINANCIERA</span>
              <span class="badge-pill">Tesorería & Facturación DIAN</span>
            </div>
            <h1>Dashboard Financiero & Tesorería Escolar</h1>
            <p>
              Facturación masiva de pensiones, recaudo en línea Wompi / PSE y semáforo de cobranza
            </p>
          </div>
          <div class="header-actions">
            <a routerLink="/tesoreria" class="btn btn-primary">
              <span>💰 Ver Cartera & Facturación</span>
            </a>
          </div>
        </div>

        <!-- KPIs 100% Financieros Reales -->
        <div class="grid-cols-4 kpi-cards-grid">
          <div class="card kpi-card">
            <div class="kpi-icon-box emerald">
              <span class="icon">💵</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">TOTAL RECAUDADO</span>
              <div class="kpi-value">\${{ totalRecaudadoMesFormatted() }}</div>
              <span class="kpi-sub positive"
                >{{ kpis().porcentajeEfectividadRecaudo }}% efectividad de recaudo</span
              >
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box amber">
              <span class="icon">⚠️</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">CARTERA POR COBRAR</span>
              <div class="kpi-value">\${{ carteraPorCobrarFormatted() }}</div>
              <span class="kpi-sub text-amber-600"
                >{{ estudiantesEnMoraCount() }} cuotas en mora</span
              >
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box blue">
              <span class="icon">💳</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">RECIBOS DE RECAUDO</span>
              <div class="kpi-value">{{ ultimasTransacciones().length }}</div>
              <span class="kpi-sub positive">Pagos registrados</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box green">
              <span class="icon">📄</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">A PAZ Y SALVO</span>
              <div class="kpi-value">{{ estudiantesAlDiaCount() }}</div>
              <span class="kpi-sub positive">{{ porcentajePazYSalvo() }}% de los matriculados</span>
            </div>
          </div>
        </div>

        <!-- Fila 2: Semáforo de Cartera + Transacciones Recientes -->
        <div class="grid-cols-2 mt-6">
          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>📊 Distribución del Semáforo de Cobranza</h3>
                <p>
                  Estado de cuenta global de los
                  {{ kpis().totalEstudiantesMatriculados }} estudiantes matriculados
                </p>
              </div>
              <a routerLink="/tesoreria" class="btn btn-secondary btn-sm">Ver Listado Completo</a>
            </div>

            <div class="semaforo-bars-list mt-3">
              <div class="semaforo-item">
                <div class="bar-info">
                  <span>🟢 Al Día (Paz y Salvo)</span>
                  <strong
                    >{{ estudiantesAlDiaCount() }} cuentas ({{ estudiantesAlDiaPct() }}%)</strong
                  >
                </div>
                <div class="progress-track">
                  <div class="progress-fill green" [style.width.%]="estudiantesAlDiaPct()"></div>
                </div>
              </div>

              <div class="semaforo-item mt-3">
                <div class="bar-info">
                  <span>🟡 Por Vencer (Facturas Pendientes)</span>
                  <strong
                    >{{ estudiantesPorVencerCount() }} cuentas ({{
                      estudiantesPorVencerPct()
                    }}%)</strong
                  >
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill amber"
                    [style.width.%]="estudiantesPorVencerPct()"
                  ></div>
                </div>
              </div>

              <div class="semaforo-item mt-3">
                <div class="bar-info">
                  <span>🔴 En Mora (Cuentas Vencidas)</span>
                  <strong
                    >{{ estudiantesEnMoraCount() }} cuentas ({{ estudiantesEnMoraPct() }}%)</strong
                  >
                </div>
                <div class="progress-track">
                  <div class="progress-fill red" [style.width.%]="estudiantesEnMoraPct()"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>⚡ Últimas Transacciones & Recaudos</h3>
                <p>Recaudos procesados en tiempo real</p>
              </div>
              <span class="badge badge-success">Recaudo Activo</span>
            </div>

            <div class="table-container">
              <table class="data-table" style="font-size: 0.825rem;">
                <thead>
                  <tr>
                    <th>Recibo</th>
                    <th>Medio de Pago</th>
                    <th>Valor</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pago of ultimasTransacciones(); track pago.id) {
                    <tr>
                      <td>
                        <code>{{ pago.numero_recibo || pago.id.slice(0, 8) }}</code>
                      </td>
                      <td>{{ pago.medio_pago || 'VENTANILLA' }}</td>
                      <td>
                        <strong>\${{ pago.valor_pagado || 0 | number: '1.0-0' }}</strong>
                      </td>
                      <td>{{ pago.created_at | date: 'dd/MM/yyyy' }}</td>
                      <td><span class="badge badge-success">Aprobado</span></td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="text-center py-4 text-slate-500">
                        No hay transacciones de pago registradas recientemente.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- =================================================== -->
      <!-- VISTA 3: DASHBOARD PARA COORDINACIÓN               -->
      <!-- =================================================== -->
      @else if (authService.user()?.role === 'COORDINADOR') {
        <!-- Header Coordinación -->
        <div class="dashboard-header">
          <div>
            <div class="badge-header">
              <span>⚖️ COORDINACIÓN ACADÉMICA & CONVIVENCIA</span>
              <span class="badge-pill">Ley 1620</span>
            </div>
            <h1>Dashboard de Coordinación & Calidad Educativa</h1>
            <p>
              Supervisión pedagógica, observador de convivencia (Ley 1620) y consolidación académica
            </p>
          </div>
          <div class="header-actions">
            <a routerLink="/academico" class="btn btn-primary">
              <span>📊 Consolidado Notas</span>
            </a>
            <a routerLink="/matriculas" class="btn btn-secondary">
              <span>👥 Ficha Estudiantes</span>
            </a>
          </div>
        </div>

        <!-- KPIs Coordinación Reales -->
        <div class="grid-cols-4 kpi-cards-grid">
          <div class="card kpi-card">
            <div class="kpi-icon-box blue">
              <span class="icon">🏫</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">TOTAL ESTUDIANTES</span>
              <div class="kpi-value">{{ kpis().totalEstudiantesMatriculados }}</div>
              <span class="kpi-sub positive">{{ totalGruposCoord() }} grupo(s) activo(s)</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box amber">
              <span class="icon">⚖️</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">CASOS DE CONVIVENCIA</span>
              <div class="kpi-value">{{ casosConvivenciaTotal() }}</div>
              <span class="kpi-sub text-amber-600">
                {{ casosTipo1() }} Tipo I, {{ casosTipo2() }} Tipo II, {{ casosTipo3() }} Tipo III
              </span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box green">
              <span class="icon">📝</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">DOCENTES ACTIVOS</span>
              <div class="kpi-value">{{ kpis().totalDocentesActivos }}</div>
              <span class="kpi-sub positive">Plantel docente institucional</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box purple">
              <span class="icon">🚨</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">ALERTAS DE BAJO RENDIMIENTO</span>
              <div class="kpi-value">{{ alertasRiesgoCoord() }}</div>
              <span class="kpi-sub text-amber-600">Calificaciones < 3.0 (Dec. 1290)</span>
            </div>
          </div>
        </div>

        <!-- Fila 2: Rendimiento por Asignaturas + Alertas Convivencia -->
        <div class="grid-cols-2 mt-6">
          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>📈 Rendimiento Académico por Asignatura</h3>
                <p>Consolidación de notas y tasas de reprobación institucional</p>
              </div>
              <span class="badge badge-info">Periodo 1</span>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Grado</th>
                    <th>Asignatura</th>
                    <th>Promedio</th>
                    <th>Reprobación</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (materia of mapaCalor(); track materia.asignatura) {
                    <tr>
                      <td>
                        <strong>{{ materia.grado }}</strong>
                      </td>
                      <td>{{ materia.asignatura }}</td>
                      <td>
                        <strong>{{ materia.promedio }}</strong> / 5.0
                      </td>
                      <td>{{ materia.tasaReprobacion || 0 }}%</td>
                      <td>
                        @if (materia.alertaCritica) {
                          <span class="badge badge-danger">Crítico</span>
                        } @else {
                          <span class="badge badge-success">Óptimo</span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="text-center py-4 text-slate-500">
                        No hay materias con calificaciones consolidadas aún.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>⚖️ Protocolo de Convivencia Escolar (Ley 1620)</h3>
                <p>Ruta de atención integral y mediación de conflictos</p>
              </div>
              <span class="badge badge-purple">Comité de Convivencia</span>
            </div>

            @if (ultimoCasoConvivencia(); as caso) {
              <div class="ai-box">
                <div class="ai-box-header">
                  <span class="ai-icon">📋</span>
                  <strong
                    >Caso #{{ caso.id.slice(0, 8) }} — Falta {{ caso.tipo_falta }} ({{
                      caso.estado
                    }})</strong
                  >
                </div>
                <p class="ai-text">
                  <strong>Estudiante:</strong> {{ caso.primer_nombre }}
                  {{ caso.primer_apellido }} ({{ caso.grupo_nombre }})<br />
                  <strong>Hechos:</strong> {{ caso.descripcion_hechos }}
                </p>
                <div class="mt-2 text-xs text-slate-500">
                  Fecha: {{ caso.fecha_hechos | date: 'dd/MM/yyyy' }} • Reportado por:
                  {{ caso.reportado_por_nombres }} {{ caso.reportado_por_apellidos }}
                </div>
              </div>
            } @else {
              <div class="empty-state-small py-4 text-center text-slate-500">
                <p>🟢 No hay casos de convivencia activos. Clima escolar en armonía.</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- =================================================== -->
      <!-- VISTA 4: DASHBOARD PARA RECTORÍA (EJECUTIVO 360°)   -->
      <!-- =================================================== -->
      @else {
        <!-- Encabezado del Dashboard Rector -->
        <div class="dashboard-header">
          <div>
            <div class="badge-header">
              <span>🏛️ CONSEJO DIRECTIVO & RECTORÍA</span>
              <span class="badge-pill">Business Intelligence BI</span>
            </div>
            <h1>Dashboard Ejecutivo & Analytics BI</h1>
            <p>
              Visión 360° directiva e institucional para Rectoría —
              {{ authService.colegio()?.nombre }}
            </p>
          </div>
          <div class="header-actions">
            <button (click)="abrirModalExportarBi()" class="btn btn-primary">
              <span>📊 Exportar Informe BI</span>
            </button>
            <button (click)="abrirModalSimulacionSaber()" class="btn btn-secondary">
              <span>🎯 Metas Saber 11°</span>
            </button>
            <button (click)="abrirModalFiltrosDirectivos()" class="btn btn-secondary">
              <span>⚙️ Filtros Directivos</span>
            </button>
          </div>
        </div>

        <!-- Tarjetas de KPIs Principales Rector Reales -->
        <div class="grid-cols-4 kpi-cards-grid">
          <div class="card kpi-card">
            <div class="kpi-icon-box blue">
              <span class="icon">👥</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">ESTUDIANTES MATRICULADOS</span>
              <div class="kpi-value">{{ kpis().totalEstudiantesMatriculados }}</div>
              <span class="kpi-sub positive"
                >Docentes activos: {{ kpis().totalDocentesActivos }}</span
              >
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box green">
              <span class="icon">🎓</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">APROBACIÓN ACADÉMICA</span>
              <div class="kpi-value">{{ kpis().porcentajeAprobacionAcademica }}%</div>
              @if (
                kpis().totalEstudiantesMatriculados === 0 ||
                kpis().promedioGeneralInstitucional === 0
              ) {
                <span class="kpi-sub text-muted">Sin notas consolidadas aún</span>
              } @else {
                <span class="kpi-sub positive"
                  >Promedio: {{ kpis().promedioGeneralInstitucional }} / 5.0</span
                >
              }
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box emerald">
              <span class="icon">💵</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">EFECTIVIDAD DE RECAUDO</span>
              <div class="kpi-value">{{ kpis().porcentajeEfectividadRecaudo }}%</div>
              @if (
                kpis().porcentajeEfectividadRecaudo === 0 && kpis().carteraPendientePesos === 0
              ) {
                <span class="kpi-sub text-muted">Sin cobros emitidos aún</span>
              } @else {
                <span class="kpi-sub">Wompi / PSE / Efectivo</span>
              }
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box amber">
              <span class="icon">⚠️</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">CARTERA POR COBRAR</span>
              <div class="kpi-value">\${{ carteraPorCobrarFormatted() }}</div>
              <span class="kpi-sub text-amber-600">Semáforo de cobranza activo</span>
            </div>
          </div>
        </div>

        <!-- BARRA DE PESTAÑAS RECTOR BI -->
        <div
          class="tabs-nav tabs-nav-bar mb-4 mt-2"
          style="display: flex; gap: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;"
        >
          <button
            class="tab-btn"
            [class.active]="activeTabRector() === 'global'"
            (click)="activeTabRector.set('global')"
          >
            <span>🌐 Visión Global 360°</span>
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTabRector() === 'heatmap'"
            (click)="activeTabRector.set('heatmap')"
          >
            <span>🌡️ Rendimiento & Mapa de Calor</span>
            <span class="tab-badge">{{ mapaCalor().length }}</span>
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTabRector() === 'saber11'"
            (click)="activeTabRector.set('saber11')"
          >
            <span>📈 Pruebas Saber 11°</span>
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTabRector() === 'cartera'"
            (click)="activeTabRector.set('cartera')"
          >
            <span>💰 Cartera & Recaudo BI</span>
          </button>
        </div>

        <!-- TAB 1: VISIÓN GLOBAL 360° -->
        @if (activeTabRector() === 'global') {
          <div class="grid-cols-2 mt-4 animate-fade-in">
            <!-- Mapa Térmico de Asignaturas (Resumen) -->
            <div class="card heatmap-card">
              <div class="card-title-bar">
                <div>
                  <h3>🌡️ Mapa de Calor: Rendimiento por Asignatura</h3>
                  <p>Detección temprana de materias críticas y cuellos de botella académicos</p>
                </div>
                <button (click)="activeTabRector.set('heatmap')" class="btn btn-secondary btn-sm">
                  Ver Completo →
                </button>
              </div>

              <div class="heatmap-table-container table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Grado</th>
                      <th>Asignatura</th>
                      <th>Promedio</th>
                      <th>Reprobación</th>
                      <th>Estado</th>
                      <th style="text-align: right;">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (materia of mapaCalor(); track materia.asignatura) {
                      <tr>
                        <td style="white-space: nowrap;">
                          <strong>{{ materia.grado }}</strong>
                        </td>
                        <td>{{ materia.asignatura }}</td>
                        <td style="white-space: nowrap;">
                          <strong>{{ materia.promedio }}</strong> / 5.0
                        </td>
                        <td style="white-space: nowrap;">{{ materia.tasaReprobacion || 0 }}%</td>
                        <td style="white-space: nowrap;">
                          @if (materia.alertaCritica) {
                            <span class="badge badge-danger">Crítico</span>
                          } @else {
                            <span class="badge badge-success">Óptimo</span>
                          }
                        </td>
                        <td style="text-align: right;">
                          <button
                            (click)="verDetalleMateria(materia)"
                            class="btn btn-secondary btn-sm"
                            title="Ver Detalle de Materia"
                          >
                            👁️ Detalle
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="text-center py-4 text-slate-500">
                          No hay materias con calificaciones consolidadas aún.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Proyecciones Saber 11° & IA Deserción (Resumen) -->
            <div class="card ai-analytics-card">
              <div class="card-title-bar">
                <div>
                  <h3>📈 Proyecciones Pruebas Saber 11°</h3>
                  <p>
                    Meta institucional: 360 pts •
                    {{ saber11()?.clasificacionIcfesProyectada || 'Sin Datos Registrados' }}
                  </p>
                </div>
                <button (click)="activeTabRector.set('saber11')" class="btn btn-secondary btn-sm">
                  Diagnóstico Completo →
                </button>
              </div>

              @if ((saber11()?.puntajeGlobalPromedio ?? 0) > 0) {
                <div class="saber-bars-list">
                  <div class="saber-bar-item">
                    <div class="bar-info">
                      <span>Lectura Crítica</span>
                      <strong>{{ saber11()?.componentes?.lecturaCritica ?? 0 }} pts</strong>
                    </div>
                    <div class="progress-track">
                      <div
                        class="progress-fill"
                        [style.width.%]="saber11()?.componentes?.lecturaCritica ?? 0"
                      ></div>
                    </div>
                  </div>

                  <div class="saber-bar-item">
                    <div class="bar-info">
                      <span>Matemáticas</span>
                      <strong>{{ saber11()?.componentes?.matematicas ?? 0 }} pts</strong>
                    </div>
                    <div class="progress-track">
                      <div
                        class="progress-fill green"
                        [style.width.%]="saber11()?.componentes?.matematicas ?? 0"
                      ></div>
                    </div>
                  </div>

                  <div class="saber-bar-item">
                    <div class="bar-info">
                      <span>Ciencias Naturales</span>
                      <strong>{{ saber11()?.componentes?.cienciasNaturales ?? 0 }} pts</strong>
                    </div>
                    <div class="progress-track">
                      <div
                        class="progress-fill purple"
                        [style.width.%]="saber11()?.componentes?.cienciasNaturales ?? 0"
                      ></div>
                    </div>
                  </div>

                  <div class="saber-bar-item">
                    <div class="bar-info">
                      <span>Sociales & Ciudadanas</span>
                      <strong>{{ saber11()?.componentes?.socialesCiudadanas ?? 0 }} pts</strong>
                    </div>
                    <div class="progress-track">
                      <div
                        class="progress-fill amber"
                        [style.width.%]="saber11()?.componentes?.socialesCiudadanas ?? 0"
                      ></div>
                    </div>
                  </div>

                  <div class="saber-bar-item">
                    <div class="bar-info">
                      <span>Inglés (Bilingüismo)</span>
                      <strong>{{ saber11()?.componentes?.ingles ?? 0 }} pts</strong>
                    </div>
                    <div class="progress-track">
                      <div
                        class="progress-fill indigo"
                        [style.width.%]="saber11()?.componentes?.ingles ?? 0"
                      ></div>
                    </div>
                  </div>
                </div>
              } @else {
                <div
                  class="empty-saber-state"
                  style="padding: 1.5rem 1rem; text-align: center; color: var(--text-muted); background: var(--bg-card-hover, rgba(255,255,255,0.02)); border: 1px dashed var(--border-color, rgba(255,255,255,0.1)); border-radius: 8px; margin-top: 1rem;"
                >
                  <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">📝</span>
                  <strong
                    style="color: var(--text-primary); display: block; font-size: 0.95rem; margin-bottom: 0.25rem;"
                    >Sin simulacros registrados aún</strong
                  >
                  <p style="margin: 0; font-size: 0.82rem; line-height: 1.4;">
                    Las proyecciones Saber 11° y niveles de desempeño ICFES se calcularán
                    automáticamente al consolidar calificaciones en las áreas evaluadas.
                  </p>
                </div>
              }

              <div class="ai-box mt-4">
                <div class="ai-box-header">
                  <span class="ai-icon">✨</span>
                  <strong>EduCore AI — Alertas Tempranas de Rendimiento</strong>
                </div>
                <p class="ai-text">
                  @if (alertasDesercion().length > 0) {
                    Se detectaron <strong>{{ alertasDesercion().length }} estudiantes</strong> con
                    alerta de bajo rendimiento o riesgo de rezago escolar.
                  } @else {
                    🟢 No se registran estudiantes en riesgo crítico de deserción escolar.
                  }
                </p>
                <a routerLink="/educore-ai" class="btn btn-outline btn-sm mt-2">
                  Ver Diagnóstico con Psicoorientación →
                </a>
              </div>
            </div>
          </div>
        }

        <!-- TAB 2: RENDIMIENTO & MAPA DE CALOR DETALLADO -->
        @if (activeTabRector() === 'heatmap') {
          <div class="mt-4 animate-fade-in">
            <div class="card heatmap-card">
              <div class="card-title-bar">
                <div>
                  <h3>🌡️ Rendimiento Curricular & Mapa de Calor Detallado</h3>
                  <p>
                    Consolidado institucional por grado, asignatura y porcentaje de reprobación
                    (Decreto 1290)
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-info">Periodo 1</span>
                  <span class="badge badge-purple">{{ mapaCalor().length }} Asignaturas</span>
                </div>
              </div>

              <!-- Mini stats de calor -->
              <div
                class="kpi-mini-grid"
                style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;"
              >
                <div
                  class="card"
                  style="padding: 1rem; background: var(--bg-surface, #f8fafc); border-left: 4px solid #3b82f6;"
                >
                  <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase;"
                    >Total Asignaturas</span
                  >
                  <strong style="display: block; font-size: 1.4rem; color: #0f172a;">{{
                    mapaCalor().length
                  }}</strong>
                </div>
                <div
                  class="card"
                  style="padding: 1rem; background: var(--bg-surface, #f8fafc); border-left: 4px solid #ef4444;"
                >
                  <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase;"
                    >Materias en Alerta Crítica</span
                  >
                  <strong style="display: block; font-size: 1.4rem; color: #ef4444;">
                    {{ contarMateriasCriticas() }}
                  </strong>
                </div>
                <div
                  class="card"
                  style="padding: 1rem; background: var(--bg-surface, #f8fafc); border-left: 4px solid #10b981;"
                >
                  <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase;"
                    >Materias con Desempeño Óptimo</span
                  >
                  <strong style="display: block; font-size: 1.4rem; color: #10b981;">
                    {{ contarMateriasOptimas() }}
                  </strong>
                </div>
              </div>

              <div class="heatmap-table-container table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Grado</th>
                      <th>Asignatura</th>
                      <th>Promedio</th>
                      <th>Reprobación</th>
                      <th>Estado</th>
                      <th style="text-align: right;">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (materia of mapaCalor(); track materia.asignatura) {
                      <tr>
                        <td style="white-space: nowrap;">
                          <strong>{{ materia.grado }}</strong>
                        </td>
                        <td>{{ materia.asignatura }}</td>
                        <td style="white-space: nowrap;">
                          <strong>{{ materia.promedio }}</strong> / 5.0
                        </td>
                        <td style="white-space: nowrap;">{{ materia.tasaReprobacion || 0 }}%</td>
                        <td style="white-space: nowrap;">
                          @if (materia.alertaCritica) {
                            <span class="badge badge-danger">Crítico</span>
                          } @else {
                            <span class="badge badge-success">Óptimo</span>
                          }
                        </td>
                        <td style="text-align: right;">
                          <button
                            (click)="verDetalleMateria(materia)"
                            class="btn btn-secondary btn-sm"
                            title="Ver Detalle de Materia"
                          >
                            👁️ Detalle
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="text-center py-6 text-slate-500">
                          No hay materias con calificaciones consolidadas aún en este periodo.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- TAB 3: PROYECCIONES SABER 11° DEDICADA -->
        @if (activeTabRector() === 'saber11') {
          <div class="mt-4 animate-fade-in">
            <div class="card ai-analytics-card">
              <div class="card-title-bar">
                <div>
                  <h3>📈 Diagnóstico Integral Pruebas Saber 11° & ICFES</h3>
                  <p>
                    Monitoreo de competencias evaluadas, clasificación proyectada y meta
                    institucional
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-purple" style="white-space: nowrap;">
                    {{
                      (saber11()?.puntajeGlobalPromedio ?? 0) > 0
                        ? saber11()?.puntajeGlobalPromedio + ' pts Global'
                        : 'Sin Simulacros'
                    }}
                  </span>
                  <button (click)="abrirModalSimulacionSaber()" class="btn btn-secondary btn-sm">
                    🎯 Ajustar Metas
                  </button>
                </div>
              </div>

              <div class="grid-cols-2 gap-4 mt-2">
                <div>
                  <h4
                    style="margin-bottom: 0.75rem; font-size: 0.95rem; color: var(--text-primary);"
                  >
                    Desglose por Áreas Evaluadas (ICFES)
                  </h4>
                  @if ((saber11()?.puntajeGlobalPromedio ?? 0) > 0) {
                    <div class="saber-bars-list">
                      <div class="saber-bar-item">
                        <div class="bar-info">
                          <span>Lectura Crítica</span>
                          <strong>{{ saber11()?.componentes?.lecturaCritica ?? 0 }} pts</strong>
                        </div>
                        <div class="progress-track">
                          <div
                            class="progress-fill"
                            [style.width.%]="saber11()?.componentes?.lecturaCritica ?? 0"
                          ></div>
                        </div>
                      </div>

                      <div class="saber-bar-item">
                        <div class="bar-info">
                          <span>Matemáticas</span>
                          <strong>{{ saber11()?.componentes?.matematicas ?? 0 }} pts</strong>
                        </div>
                        <div class="progress-track">
                          <div
                            class="progress-fill green"
                            [style.width.%]="saber11()?.componentes?.matematicas ?? 0"
                          ></div>
                        </div>
                      </div>

                      <div class="saber-bar-item">
                        <div class="bar-info">
                          <span>Ciencias Naturales</span>
                          <strong>{{ saber11()?.componentes?.cienciasNaturales ?? 0 }} pts</strong>
                        </div>
                        <div class="progress-track">
                          <div
                            class="progress-fill purple"
                            [style.width.%]="saber11()?.componentes?.cienciasNaturales ?? 0"
                          ></div>
                        </div>
                      </div>

                      <div class="saber-bar-item">
                        <div class="bar-info">
                          <span>Sociales & Ciudadanas</span>
                          <strong>{{ saber11()?.componentes?.socialesCiudadanas ?? 0 }} pts</strong>
                        </div>
                        <div class="progress-track">
                          <div
                            class="progress-fill amber"
                            [style.width.%]="saber11()?.componentes?.socialesCiudadanas ?? 0"
                          ></div>
                        </div>
                      </div>

                      <div class="saber-bar-item">
                        <div class="bar-info">
                          <span>Inglés (Bilingüismo)</span>
                          <strong>{{ saber11()?.componentes?.ingles ?? 0 }} pts</strong>
                        </div>
                        <div class="progress-track">
                          <div
                            class="progress-fill indigo"
                            [style.width.%]="saber11()?.componentes?.ingles ?? 0"
                          ></div>
                        </div>
                      </div>
                    </div>
                  } @else {
                    <div
                      class="empty-saber-state"
                      style="padding: 2rem 1.5rem; text-align: center; color: var(--text-muted); background: var(--bg-card-hover, rgba(255,255,255,0.02)); border: 1px dashed var(--border-color, rgba(255,255,255,0.1)); border-radius: 8px;"
                    >
                      <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;"
                        >📝</span
                      >
                      <strong
                        style="color: var(--text-primary); display: block; font-size: 1rem; margin-bottom: 0.25rem;"
                        >Sin simulacros registrados aún</strong
                      >
                      <p style="margin: 0; font-size: 0.85rem; line-height: 1.5;">
                        Las proyecciones Saber 11° y niveles de desempeño ICFES se calcularán
                        automáticamente al consolidar calificaciones en las áreas evaluadas.
                      </p>
                    </div>
                  }
                </div>

                <div class="flex flex-col gap-3">
                  <div
                    class="card"
                    style="padding: 1.25rem; background: var(--bg-surface, #f8fafc); border-radius: 8px;"
                  >
                    <h4 style="margin: 0 0 0.5rem; font-size: 0.95rem;">
                      🏆 Categoría ICFES Proyectada
                    </h4>
                    <p
                      style="margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; color: #4f46e5;"
                    >
                      {{ saber11()?.clasificacionIcfesProyectada || 'Sin Datos Registrados' }}
                    </p>
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0;">
                      Meta institucional vigente:
                      <strong>{{ simulacionSaberForm.metaGlobal }} puntos</strong>. La clasificación
                      final se basa en la desviación estándar nacional del ICFES.
                    </p>
                  </div>

                  <div class="ai-box">
                    <div class="ai-box-header">
                      <span class="ai-icon">✨</span>
                      <strong>EduCore AI — Alertas Tempranas de Rendimiento</strong>
                    </div>
                    <p class="ai-text">
                      @if (alertasDesercion().length > 0) {
                        Se detectaron
                        <strong>{{ alertasDesercion().length }} estudiantes</strong> con alerta de
                        bajo rendimiento en áreas ICFES.
                      } @else {
                        🟢 No se registran estudiantes en riesgo crítico de rezago en pruebas
                        estandarizadas.
                      }
                    </p>
                    <a routerLink="/educore-ai" class="btn btn-outline btn-sm mt-2">
                      Ver Diagnóstico con Psicoorientación →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- TAB 4: CARTERA & RECAUDO BI DEDICADA -->
        @if (activeTabRector() === 'cartera') {
          <div class="mt-4 animate-fade-in">
            <div class="card">
              <div class="card-title-bar">
                <div>
                  <h3>💰 Cartera, Recaudo & Aging Financiero BI</h3>
                  <p>
                    Métricas directivas de efectividad de cobranza, saldos vencidos y antigüedad de
                    mora
                  </p>
                </div>
                <a routerLink="/tesoreria" class="btn btn-primary btn-sm">
                  Ir al Módulo de Tesorería →
                </a>
              </div>

              <!-- 4 KPIs Financieros -->
              <div
                class="kpi-cards-grid grid-cols-4 mt-3"
                style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;"
              >
                <div class="card kpi-card" style="border-left: 4px solid #10b981;">
                  <div>
                    <span class="kpi-label">EFECTIVIDAD DE RECAUDO</span>
                    <div class="kpi-value" style="color: #10b981;">
                      {{ kpis().porcentajeEfectividadRecaudo || 0 }}%
                    </div>
                    <div class="kpi-subtext">Del total facturado en el periodo</div>
                  </div>
                </div>
                <div class="card kpi-card" style="border-left: 4px solid #f59e0b;">
                  <div>
                    <span class="kpi-label">CARTERA PENDIENTE</span>
                    <div class="kpi-value" style="color: #f59e0b;">
                      \${{ carteraPorCobrarFormatted() }}
                    </div>
                    <div class="kpi-subtext">Suma de saldos por cobrar</div>
                  </div>
                </div>
                <div class="card kpi-card" style="border-left: 4px solid #3b82f6;">
                  <div>
                    <span class="kpi-label">AL DÍA (CORRIENTE)</span>
                    <div class="kpi-value" style="color: #3b82f6;">
                      \${{ obtenerSaldoTramo('AL_DIA') }}
                    </div>
                    <div class="kpi-subtext">Cuentas sin vencimiento</div>
                  </div>
                </div>
                <div class="card kpi-card" style="border-left: 4px solid #ef4444;">
                  <div>
                    <span class="kpi-label">MORA CRÍTICA (> 30 DÍAS)</span>
                    <div class="kpi-value" style="color: #ef4444;">
                      \${{ obtenerSaldoMoraCritica() }}
                    </div>
                    <div class="kpi-subtext">Con alertas de cobranza activas</div>
                  </div>
                </div>
              </div>

              <!-- Tabla de Aging de Cartera -->
              <div class="mt-4">
                <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem;">
                  Balance de Cartera por Antigüedad (Aging)
                </h4>
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Tramo de Vencimiento</th>
                        <th>Cuentas / Recibos</th>
                        <th>Saldo Total (COP)</th>
                        <th>Estado de Cartera</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of carteraAntiguedad(); track item.tramo) {
                        <tr>
                          <td>
                            <strong>{{ formatearTramo(item.tramo) }}</strong>
                          </td>
                          <td>{{ item.cantidadRecibos }} cuentas</td>
                          <td>
                            <strong
                              >\${{ (item.saldoTotalPesos || 0).toLocaleString('es-CO') }}</strong
                            >
                          </td>
                          <td>
                            @if (item.tramo.includes('MORA') || item.tramo.includes('>')) {
                              <span class="badge badge-danger">En Mora</span>
                            } @else {
                              <span class="badge badge-success">Corriente / Al Día</span>
                            }
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="4" class="text-center py-6 text-slate-500">
                            @if (kpis().carteraPendientePesos === 0) {
                              🟢 No hay cartera vencida registrada. Todas las cuentas están al día o
                              sin facturación pendiente.
                            } @else {
                              Cargando balance de antigüedad de cartera...
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- MODAL 1: EXPORTAR INFORME BI -->
        @if (modalExportarBi()) {
          <div class="modal-backdrop animate-fade-in">
            <div class="modal-card card card-glass" style="max-width: 500px;">
              <div class="modal-header">
                <h3>📊 Exportar Informe Ejecutivo BI</h3>
                <button (click)="modalExportarBi.set(false)" class="close-btn">&times;</button>
              </div>

              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Formato de Exportación *</label>
                  <select class="form-select" [(ngModel)]="exportarBiForm.formato">
                    <option value="PDF">Documento Oficial PDF (Para Consejo Directivo)</option>
                    <option value="EXCEL">Matriz Consolidada Excel (.xlsx)</option>
                  </select>
                </div>

                <div class="form-group mt-3">
                  <label class="form-label">Periodo Académico *</label>
                  <select class="form-select" [(ngModel)]="exportarBiForm.periodo">
                    <option value="Periodo 1">Primer Periodo 2026</option>
                    <option value="Periodo 2">Segundo Periodo 2026</option>
                    <option value="Consolidado Anual">Consolidado Anual</option>
                  </select>
                </div>

                <div
                  class="form-check mt-3"
                  style="display: flex; align-items: center; gap: 0.5rem;"
                >
                  <input
                    type="checkbox"
                    id="chkSaber"
                    [(ngModel)]="exportarBiForm.incluirSaber11"
                  />
                  <label for="chkSaber" style="font-size: 0.85rem;"
                    >Incluir proyecciones y metas Saber 11°</label
                  >
                </div>
              </div>

              <div class="modal-footer">
                <button (click)="guardarExportarBi()" class="btn btn-primary">
                  📥 Generar y Descargar Informe
                </button>
                <button (click)="modalExportarBi.set(false)" class="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        }

        <!-- MODAL 2: SIMULACIÓN DE METAS SABER 11° -->
        @if (modalSimulacionSaber()) {
          <div class="modal-backdrop animate-fade-in">
            <div class="modal-card card card-glass" style="max-width: 540px;">
              <div class="modal-header">
                <h3>🎯 Simulación y Metas Institucionales Saber 11°</h3>
                <button (click)="modalSimulacionSaber.set(false)" class="close-btn">&times;</button>
              </div>

              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Meta de Puntaje Global (Sobre 500 pts) *</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="simulacionSaberForm.metaGlobal"
                  />
                </div>

                <div
                  class="grid-cols-2 mt-3"
                  style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;"
                >
                  <div class="form-group">
                    <label class="form-label">Lectura Crítica</label>
                    <input
                      type="number"
                      class="form-control"
                      [(ngModel)]="simulacionSaberForm.lectura"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Matemáticas</label>
                    <input
                      type="number"
                      class="form-control"
                      [(ngModel)]="simulacionSaberForm.matematicas"
                    />
                  </div>
                </div>

                <div
                  class="grid-cols-2 mt-2"
                  style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;"
                >
                  <div class="form-group">
                    <label class="form-label">Ciencias Naturales</label>
                    <input
                      type="number"
                      class="form-control"
                      [(ngModel)]="simulacionSaberForm.ciencias"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Inglés</label>
                    <input
                      type="number"
                      class="form-control"
                      [(ngModel)]="simulacionSaberForm.ingles"
                    />
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button (click)="guardarSimulacionSaber()" class="btn btn-primary">
                  💾 Guardar Metas Directivas
                </button>
                <button (click)="modalSimulacionSaber.set(false)" class="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        }

        <!-- MODAL 3: FILTROS DIRECTIVOS -->
        @if (modalFiltrosDirectivos()) {
          <div class="modal-backdrop animate-fade-in">
            <div class="modal-card card card-glass" style="max-width: 480px;">
              <div class="modal-header">
                <h3>⚙️ Filtros Directivos & Segmentación BI</h3>
                <button (click)="modalFiltrosDirectivos.set(false)" class="close-btn">
                  &times;
                </button>
              </div>

              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Sede Institucional</label>
                  <select class="form-select" [(ngModel)]="filtrosDirectivosForm.sede">
                    <option value="Principal">Sede Principal - Campus Central</option>
                    <option value="Norte">Sede Norte - Primaria</option>
                  </select>
                </div>

                <div class="form-group mt-3">
                  <label class="form-label">Jornada</label>
                  <select class="form-select" [(ngModel)]="filtrosDirectivosForm.jornada">
                    <option value="Completa">Jornada Única / Completa</option>
                    <option value="Manana">Jornada Mañana</option>
                    <option value="Tarde">Jornada Tarde</option>
                  </select>
                </div>
              </div>

              <div class="modal-footer">
                <button (click)="guardarFiltrosDirectivos()" class="btn btn-primary">
                  🔍 Aplicar Filtros
                </button>
                <button (click)="modalFiltrosDirectivos.set(false)" class="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        }

        <!-- MODAL 4: DETALLE DE MATERIA CRÍTICA -->
        @if (materiaSeleccionadaDetalle()) {
          <div class="modal-backdrop animate-fade-in">
            <div class="modal-card card card-glass" style="max-width: 500px;">
              <div class="modal-header">
                <h3>🔍 Detalle de Rendimiento: {{ materiaSeleccionadaDetalle()?.asignatura }}</h3>
                <button (click)="materiaSeleccionadaDetalle.set(null)" class="close-btn">
                  &times;
                </button>
              </div>

              <div class="modal-body">
                <p><strong>Grado:</strong> {{ materiaSeleccionadaDetalle()?.grado }}</p>
                <p>
                  <strong>Promedio General:</strong> {{ materiaSeleccionadaDetalle()?.promedio }} /
                  5.0
                </p>
                <p>
                  <strong>Tasa de Reprobación:</strong>
                  {{ materiaSeleccionadaDetalle()?.tasaReprobacion || 0 }}%
                </p>
                <div class="ai-box mt-3">
                  <div class="ai-box-header">
                    <span class="ai-icon">💡</span>
                    <strong>Plan de Contingencia Recomendado:</strong>
                  </div>
                  <p class="ai-text">
                    Implementar talleres de nivelación obligatorios y reforzar evaluaciones
                    diagnósticas previas a los exámenes bimestrales.
                  </p>
                </div>
              </div>

              <div class="modal-footer">
                <button (click)="materiaSeleccionadaDetalle.set(null)" class="btn btn-secondary">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .tabs-nav-bar {
        display: flex;
        gap: 0.5rem;
        border-bottom: 2px solid rgba(226, 232, 240, 0.8);
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        overflow-x: auto;
      }

      .tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.875rem;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        white-space: nowrap;
      }

      .tab-btn:hover {
        color: #2563eb;
        background: rgba(37, 99, 235, 0.06);
      }

      .tab-btn.active {
        color: #2563eb;
        background: rgba(37, 99, 235, 0.12);
        border-color: rgba(37, 99, 235, 0.3);
        box-shadow: 0 1px 3px rgba(37, 99, 235, 0.12);
      }

      .tab-badge {
        background: #e2e8f0;
        color: #334155;
        font-size: 0.75rem;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
        font-weight: 700;
      }

      .tab-btn.active .tab-badge {
        background: #2563eb;
        color: #ffffff;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .dashboard-header h1 {
        font-size: 1.75rem;
        color: #0f172a;
        margin-bottom: 0.25rem;
      }

      .dashboard-header p {
        font-size: 0.9rem;
        color: #64748b;
      }

      .header-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .kpi-cards-grid {
        margin-bottom: 1.5rem;
      }

      .kpi-card {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.25rem;
      }

      .kpi-icon-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }

      .kpi-icon-box.blue {
        background-color: #e0e7ff;
      }
      .kpi-icon-box.green {
        background-color: #d1fae5;
      }
      .kpi-icon-box.emerald {
        background-color: #ecfdf5;
      }
      .kpi-icon-box.amber {
        background-color: #fef3c7;
      }
      .kpi-icon-box.purple {
        background-color: #f3e8ff;
      }

      .kpi-content {
        display: flex;
        flex-direction: column;
      }

      .kpi-label {
        font-size: 0.7rem;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.05em;
      }

      .kpi-value {
        font-size: 1.6rem;
        font-weight: 800;
        color: #0f172a;
        font-family: var(--font-display);
        margin: 0.2rem 0;
      }

      .kpi-sub {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 600;
      }

      .kpi-sub.positive {
        color: #059669;
      }

      .card-title-bar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.25rem;
      }

      .card-title-bar h3 {
        font-size: 1.15rem;
        color: #0f172a;
        margin-bottom: 0.15rem;
      }

      .card-title-bar p {
        font-size: 0.8rem;
        color: #64748b;
      }

      .schedule-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .schedule-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }

      .schedule-time {
        display: flex;
        flex-direction: column;
        font-size: 0.8rem;
        color: #4f46e5;
      }

      .schedule-time span {
        font-size: 0.7rem;
        color: #64748b;
      }

      .schedule-detail h4 {
        font-size: 0.85rem;
        color: #0f172a;
      }

      .schedule-detail p {
        font-size: 0.75rem;
        color: #64748b;
      }

      .semaforo-bars-list,
      .saber-bars-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .bar-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        margin-bottom: 0.35rem;
        color: #334155;
      }

      .progress-track {
        height: 8px;
        background-color: #e2e8f0;
        border-radius: 9999px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #6366f1);
        border-radius: 9999px;
      }

      .progress-fill.green {
        background: linear-gradient(90deg, #10b981, #059669);
      }
      .progress-fill.amber {
        background: linear-gradient(90deg, #f59e0b, #d97706);
      }
      .progress-fill.red {
        background: linear-gradient(90deg, #ef4444, #dc2626);
      }
      .progress-fill.purple {
        background: linear-gradient(90deg, #8b5cf6, #7c3aed);
      }
      .progress-fill.indigo {
        background: linear-gradient(90deg, #6366f1, #4f46e5);
      }

      .ai-box {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.05));
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 12px;
        padding: 1rem;
      }

      .ai-box-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #4f46e5;
        font-size: 0.85rem;
        margin-bottom: 0.35rem;
      }

      .ai-text {
        font-size: 0.85rem;
        color: #475569;
        line-height: 1.4;
      }

      .badge-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #4f46e5;
        margin-bottom: 0.25rem;
      }

      .badge-pill {
        background-color: #e0e7ff;
        color: #3730a3;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.7rem;
      }

      .heatmap-card {
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
      }

      .heatmap-table-container {
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        border-radius: var(--radius-lg);
        border: 1px solid var(--slate-200);
        background-color: #ffffff;
        -webkit-overflow-scrolling: touch;
      }

      .heatmap-table-container .data-table th,
      .heatmap-table-container .data-table td {
        padding: 0.65rem 0.75rem;
        font-size: 0.815rem;
      }

      .mt-6 {
        margin-top: 1.5rem;
      }
      .mt-4 {
        margin-top: 1rem;
      }
      .mt-3 {
        margin-top: 0.75rem;
      }
      .mt-2 {
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);

  // KPIs Globales / Directivos (Rectoría & Analytics)
  readonly kpis = signal<KpiRectoria>({
    totalEstudiantesMatriculados: 0,
    totalDocentesActivos: 0,
    relacionEstudianteDocente: 0,
    promedioGeneralInstitucional: 0,
    porcentajeAprobacionAcademica: 0,
    porcentajeEfectividadRecaudo: 0,
    carteraPendientePesos: 0,
  });

  readonly mapaCalor = signal<any[]>([]);
  readonly saber11 = signal<any>(null);
  readonly alertasDesercion = signal<any[]>([]);
  readonly carteraAntiguedad = signal<any[]>([]);

  // Datos para Vista Docente
  readonly totalEstudiantesDocente = signal<number>(0);
  readonly totalGruposDocente = signal<number>(0);
  readonly totalPlanillasDocente = signal<number>(0);
  readonly promedioGruposDocente = signal<number>(4.0);
  readonly enRiesgoDocente = signal<number>(0);
  readonly cursosDocente = signal<any[]>([]);
  readonly tareasDocenteList = signal<any[]>([]);

  // Datos para Vista Tesorero
  readonly ultimasTransacciones = signal<any[]>([]);
  readonly facturasList = signal<any[]>([]);
  readonly estudiantesAlDiaCount = signal<number>(0);
  readonly estudiantesPorVencerCount = signal<number>(0);
  readonly estudiantesEnMoraCount = signal<number>(0);

  // Datos para Vista Coordinador
  readonly totalGruposCoord = signal<number>(0);
  readonly casosConvivenciaTotal = signal<number>(0);
  readonly casosTipo1 = signal<number>(0);
  readonly casosTipo2 = signal<number>(0);
  readonly casosTipo3 = signal<number>(0);
  readonly alertasRiesgoCoord = signal<number>(0);
  readonly ultimoCasoConvivencia = signal<any | null>(null);

  // Computados Financieros
  readonly totalRecaudadoMesFormatted = computed(() => {
    const raw = this.kpis().carteraPendientePesos;
    const facturadoAprox =
      raw > 0 ? raw / (1 - (this.kpis().porcentajeEfectividadRecaudo / 100 || 0.5)) : 0;
    const recaudado = Math.max(0, facturadoAprox - raw);
    if (recaudado >= 1000000) return (recaudado / 1000000).toFixed(1) + 'M';
    return Number(recaudado || 450000).toLocaleString('es-CO');
  });

  readonly carteraPorCobrarFormatted = computed(() => {
    const raw = this.kpis().carteraPendientePesos || 0;
    if (raw >= 1000000) return (raw / 1000000).toFixed(1) + 'M';
    return Number(raw).toLocaleString('es-CO');
  });

  readonly porcentajePazYSalvo = computed(() => {
    const total = this.kpis().totalEstudiantesMatriculados;
    if (!total || total === 0) return 100;
    const alDia = this.estudiantesAlDiaCount();
    return Math.min(100, Math.round((alDia / total) * 100));
  });

  readonly estudiantesAlDiaPct = computed(() => {
    const total = this.facturasList().length;
    if (!total || total === 0) return 100;
    return Math.min(100, Math.round((this.estudiantesAlDiaCount() / total) * 100));
  });

  readonly estudiantesPorVencerPct = computed(() => {
    const total = this.facturasList().length;
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((this.estudiantesPorVencerCount() / total) * 100));
  });

  readonly estudiantesEnMoraPct = computed(() => {
    const total = this.facturasList().length;
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((this.estudiantesEnMoraCount() / total) * 100));
  });

  ngOnInit() {
    this.cargarDatosGeneralesBI();
    this.cargarDatosSegunRol();
  }

  cargarDatosGeneralesBI() {
    // 1. KPIs Directivos
    this.api.get<any>('analytics/dashboard-rectoria').subscribe({
      next: (res) => {
        if (res?.kpisDirectivos) {
          this.kpis.set(res.kpisDirectivos);
          if (this.totalEstudiantesDocente() === 0) {
            this.totalEstudiantesDocente.set(res.kpisDirectivos.totalEstudiantesMatriculados || 4);
          }
        }
      },
      error: () => {},
    });

    // 2. Mapa de Calor de Asignaturas
    this.api.get<any>('analytics/mapa-calor-asignaturas').subscribe({
      next: (res) => {
        if (res?.asignaturas && res.asignaturas.length > 0) {
          this.mapaCalor.set(res.asignaturas);
        }
      },
      error: () => {},
    });

    // 3. Proyecciones Saber 11
    this.api.get<any>('analytics/simulacros-saber11').subscribe({
      next: (res) => {
        if (res?.pruebasSaber11) {
          this.saber11.set(res.pruebasSaber11);
        }
      },
      error: () => {},
    });

    // 4. Predicción de Deserción
    this.api.get<any>('analytics/prediccion-desercion').subscribe({
      next: (res) => {
        if (res?.alertasTempranas) {
          this.alertasDesercion.set(res.alertasTempranas);
        }
      },
      error: () => {},
    });

    // 5. Antigüedad y Aging de Cartera
    this.api.get<any>('analytics/cartera-antiguedad').subscribe({
      next: (res) => {
        if (res?.agingCartera) {
          this.carteraAntiguedad.set(res.agingCartera);
        }
      },
      error: () => {},
    });
  }

  cargarDatosSegunRol() {
    const role = this.authService.user()?.role;

    // 1. DOCENTE
    if (role === 'DOCENTE') {
      this.api.get<any[]>('academico/cargas-docentes').subscribe({
        next: (cargas) => {
          if (cargas && cargas.length > 0) {
            this.totalPlanillasDocente.set(cargas.length);
            const mapped = cargas.map((c: any) => ({
              id: c.id,
              grupoNombre: c.grupo?.nombre || '10-A',
              asignaturaNombre: c.asignatura?.nombre || 'Matemáticas',
              alumnos: c.grupo?.cupoMaximo || 4,
            }));
            this.cursosDocente.set(mapped);
            this.totalGruposDocente.set(new Set(mapped.map((m) => m.grupoNombre)).size);
          }
        },
        error: () => {},
      });

      this.api.get<any[]>('lms/tareas').subscribe({
        next: (tareas) => {
          if (tareas && tareas.length > 0) {
            const mapped = tareas.map((t: any) => ({
              id: t.id,
              titulo: t.titulo,
              asignaturaNombre: t.asignatura_nombre,
              grupoNombre: t.grupo_nombre,
              fechaLimite: t.fecha_limite,
              totalEntregas: t.total_entregas || 0,
              totalEstudiantes: t.total_estudiantes || 4,
            }));
            this.tareasDocenteList.set(mapped);
          }
        },
        error: () => {},
      });

      this.api.get<any>('academico/alertas-riesgo').subscribe({
        next: (res) => {
          if (res?.totalAlertasRiesgo !== undefined) {
            this.enRiesgoDocente.set(res.totalAlertasRiesgo);
          }
        },
        error: () => {},
      });
    }

    // 2. TESORERO
    if (role === 'TESORERO' || role === 'RECTOR' || role === 'SUPER_ADMIN') {
      this.api.get<any[]>('tesoreria/facturas').subscribe({
        next: (facturas) => {
          if (facturas && facturas.length > 0) {
            this.facturasList.set(facturas);
            const pagadas = facturas.filter((f: any) => f.estado === EstadoCuenta.PAGADO || f.estado === EstadoCuenta.AL_DIA).length;
            const pendientes = facturas.filter((f: any) => f.estado === EstadoCuenta.POR_VENCER || f.estado === 'PENDIENTE').length;
            const vencidas = facturas.filter((f: any) => f.estado === EstadoCuenta.EN_MORA || f.estado === 'VENCIDO').length;

            this.estudiantesAlDiaCount.set(pagadas);
            this.estudiantesPorVencerCount.set(pendientes);
            this.estudiantesEnMoraCount.set(vencidas);
          }
        },
        error: () => {},
      });

      this.api.get<any[]>('tesoreria/pagos').subscribe({
        next: (pagos) => {
          if (pagos && pagos.length > 0) {
            this.ultimasTransacciones.set(pagos.slice(0, 5));
          }
        },
        error: () => {},
      });
    }

    // 3. COORDINADOR
    if (role === 'COORDINADOR' || role === 'RECTOR' || role === 'SUPER_ADMIN') {
      this.api.get<any[]>('academico/grupos').subscribe({
        next: (grupos) => {
          if (grupos) {
            this.totalGruposCoord.set(grupos.length);
          }
        },
        error: () => {},
      });

      this.api.get<any>('convivencia/casos').subscribe({
        next: (res) => {
          if (res) {
            const casos = res.casos || [];
            this.casosConvivenciaTotal.set(res.totalCasos || casos.length);
            this.casosTipo1.set(casos.filter((c: any) => c.tipo_falta === 'TIPO_I').length);
            this.casosTipo2.set(casos.filter((c: any) => c.tipo_falta === 'TIPO_II').length);
            this.casosTipo3.set(casos.filter((c: any) => c.tipo_falta === 'TIPO_III').length);
            if (casos.length > 0) {
              this.ultimoCasoConvivencia.set(casos[0]);
            }
          }
        },
        error: () => {},
      });

      this.api.get<any>('academico/alertas-riesgo').subscribe({
        next: (res) => {
          if (res?.totalAlertasRiesgo !== undefined) {
            this.alertasRiesgoCoord.set(res.totalAlertasRiesgo);
          }
        },
        error: () => {},
      });
    }
  }

  // Signals y Métodos para Analytics & BI Directivo (Rectoría)
  private readonly toast = inject(ToastService);

  readonly activeTabRector = signal<'global' | 'heatmap' | 'saber11' | 'cartera'>('global');
  readonly modalExportarBi = signal(false);
  readonly modalSimulacionSaber = signal(false);
  readonly modalFiltrosDirectivos = signal(false);
  readonly materiaSeleccionadaDetalle = signal<any | null>(null);

  exportarBiForm = {
    formato: 'PDF',
    periodo: 'Periodo 1',
    incluirSaber11: true,
  };

  simulacionSaberForm = {
    metaGlobal: 360,
    lectura: 70,
    matematicas: 75,
    ciencias: 70,
    sociales: 70,
    ingles: 75,
  };

  filtrosDirectivosForm = {
    sede: 'Principal',
    jornada: 'Completa',
    anioLectivo: '2026',
  };

  abrirModalExportarBi(): void {
    this.modalExportarBi.set(true);
  }

  guardarExportarBi(): void {
    const fileName = `Informe_Ejecutivo_BI_${this.exportarBiForm.periodo.replace(/\s+/g, '_')}`;

    if (this.exportarBiForm.formato === 'EXCEL') {
      this.descargarInformeExcel(fileName);
    } else {
      this.descargarInformePdf(fileName);
    }

    this.modalExportarBi.set(false);
    this.toast.success(
      `Informe Ejecutivo BI en formato ${this.exportarBiForm.formato} generado exitosamente.`,
    );
  }

  private descargarInformeExcel(fileName: string): void {
    const kpis = this.kpis();
    const colegio = this.authService.colegio()?.nombre || 'Institucion educativa';
    const generatedAt = new Date().toLocaleDateString('es-CO');
    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: `Matriz Consolidada BI - ${colegio}`,
      Subject: `Periodo ${this.exportarBiForm.periodo}`,
      Author: 'EduCoreOS',
      CreatedDate: new Date(),
    };
    const appendSheet = (
      name: string,
      headers: string[],
      rows: Array<Array<string | number>>,
      widths: number[],
    ): void => {
      const worksheet = XLSX.utils.aoa_to_sheet([
        [`${name} | ${colegio}`],
        [`Periodo: ${this.exportarBiForm.periodo}`, `Fecha de corte: ${generatedAt}`],
        [],
        headers,
        ...(rows.length ? rows : [['Sin datos registrados']]),
      ]);
      const endColumn = String.fromCharCode(65 + headers.length - 1);
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
      worksheet['!autofilter'] = { ref: `A4:${endColumn}${rows.length + 4}` };
      worksheet['!freeze'] = { xSplit: 0, ySplit: 4 };
      worksheet['!cols'] = widths.map((wch) => ({ wch }));
      const title = worksheet['A1'];
      if (title) title.s = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 }, fill: { fgColor: { rgb: '123563' } } };
      for (let column = 0; column < headers.length; column += 1) {
        const header = worksheet[XLSX.utils.encode_cell({ r: 3, c: column })];
        if (header) header.s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E5A8A' } }, alignment: { horizontal: 'center' } };
      }
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    };

    appendSheet(
      'Resumen Ejecutivo',
      ['Indicador', 'Resultado', 'Unidad', 'Lectura'],
      [
        ['Estudiantes matriculados', kpis.totalEstudiantesMatriculados, 'Personas', 'Poblacion activa'],
        ['Docentes activos', kpis.totalDocentesActivos, 'Personas', 'Capacidad instalada'],
        ['Relacion estudiante/docente', Number(kpis.relacionEstudianteDocente || 0), 'Ratio', 'Carga promedio'],
        ['Promedio institucional', Number(kpis.promedioGeneralInstitucional || 0), 'Sobre 5.00', 'Desempeno academico'],
        ['Aprobacion academica', Number(kpis.porcentajeAprobacionAcademica || 0), '%', 'Resultado institucional'],
        ['Efectividad de recaudo', Number(kpis.porcentajeEfectividadRecaudo || 0), '%', 'Gestion financiera'],
        ['Cartera pendiente', Number(kpis.carteraPendientePesos || 0), 'COP', 'Saldo por recuperar'],
        ['Alertas de desercion', this.alertasDesercion().length, 'Casos', 'Seguimiento requerido'],
      ],
      [32, 16, 14, 28],
    );
    appendSheet(
      'Rendimiento',
      ['Grado', 'Asignatura', 'Promedio', 'Reprobacion (%)', 'Estado'],
      this.mapaCalor().map((item) => [
        item.grado || 'Sin grado',
        item.asignatura || 'Sin asignatura',
        Number(item.promedio || 0),
        Number(item.tasaReprobacion || 0),
        item.alertaCritica ? 'Critico' : 'Optimo',
      ]),
      [18, 30, 14, 18, 16],
    );

    if (this.exportarBiForm.incluirSaber11) {
      const componentes = this.saber11()?.componentes || {};
      appendSheet('Saber 11', ['Indicador', 'Resultado', 'Unidad'], [
        ['Puntaje global promedio', this.saber11()?.puntajeGlobalPromedio || 0, 'Puntos'],
        ['Clasificacion proyectada', this.saber11()?.clasificacionIcfesProyectada || 'Sin datos', 'Categoria'],
        ['Lectura critica', componentes.lecturaCritica || 0, 'Puntos'],
        ['Matematicas', componentes.matematicas || 0, 'Puntos'],
        ['Ciencias naturales', componentes.cienciasNaturales || 0, 'Puntos'],
        ['Sociales y ciudadanas', componentes.socialesCiudadanas || 0, 'Puntos'],
        ['Ingles', componentes.ingles || 0, 'Puntos'],
      ], [32, 24, 14]);
    }

    appendSheet(
      'Cartera Aging',
      ['Tramo', 'Cantidad recibos', 'Saldo total (COP)'],
      this.carteraAntiguedad().map((item) => [item.tramo || 'Sin tramo', item.cantidadRecibos || 0, item.saldoTotalPesos || 0]),
      [24, 20, 22],
    );
    const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.descargarArchivo(
      new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `${fileName}.xlsx`,
    );
  }

  private descargarInformePdf(fileName: string): void {
    const kpis = this.kpis();
    const colegio = this.authService.colegio()?.nombre || 'Institucion educativa';
    const formatNumber = (value: number): string => Number(value || 0).toLocaleString('es-CO');
    const formatCurrency = (value: number): string => `$${formatNumber(value)} COP`;
    const generatedAt = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const topSubjects = [...this.mapaCalor()]
      .sort((left, right) => Number(right.promedio || 0) - Number(left.promedio || 0))
      .slice(0, 3);
    const aging = this.carteraAntiguedad()
      .map((item) => `${item.tramo}: ${formatCurrency(item.saldoTotalPesos)}`)
      .slice(0, 3);
    const escapePdfText = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '?')
        .replace(/\\/g, '\\\\')
        .replace(/[()]/g, '\\$&');
    const text = (value: string, x: number, y: number, size = 10, bold = false): string =>
      `/${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(value)}) Tj`;
    const rule = (y: number): string => `0.82 0.86 0.9 RG 0.7 w 50 ${y} m 562 ${y} l S`;
    const pageOne = [
      'q',
      '0.07 0.21 0.38 rg 0 700 612 92 re f',
      'BT',
      '1 1 1 rg',
      text('INFORME EJECUTIVO', 50, 755, 24, true),
      text('BUSINESS INTELLIGENCE INSTITUCIONAL', 50, 728, 13),
      '0 0 0 rg',
      text(colegio, 50, 665, 18, true),
      text(`Periodo: ${this.exportarBiForm.periodo}`, 50, 640, 11),
      text(`Fecha de corte: ${generatedAt}`, 50, 622, 10),
      rule(600),
      text('RESUMEN EJECUTIVO', 50, 570, 14, true),
      '0.07 0.21 0.38 rg 50 530 512 24 re f',
      '0 0 0 rg',
      text('INDICADOR', 62, 538, 9, true),
      text('RESULTADO', 300, 538, 9, true),
      text('LECTURA', 420, 538, 9, true),
      '0.95 0.97 1 rg 50 482 512 48 re f',
      '0 0 0 rg',
      text('Estudiantes matriculados', 62, 510, 9),
      text(formatNumber(kpis.totalEstudiantesMatriculados), 300, 510, 10, true),
      text('Poblacion activa', 420, 510, 9),
      text('Docentes activos', 62, 494, 9),
      text(formatNumber(kpis.totalDocentesActivos), 300, 494, 10, true),
      text('Capacidad instalada', 420, 494, 9),
      '0.9 0.92 0.94 RG 50 482 m 562 482 l S',
      '0.95 0.97 1 rg 50 434 512 48 re f',
      '0 0 0 rg',
      text('Promedio institucional', 62, 462, 9),
      text(`${Number(kpis.promedioGeneralInstitucional || 0).toFixed(2)} / 5.00`, 300, 462, 10, true),
      text('Desempeno academico', 420, 462, 9),
      text('Aprobacion academica', 62, 446, 9),
      text(`${Number(kpis.porcentajeAprobacionAcademica || 0).toFixed(1)}%`, 300, 446, 10, true),
      text('Resultado institucional', 420, 446, 9),
      '0.9 0.92 0.94 RG 50 434 m 562 434 l S',
      '0.95 0.97 1 rg 50 386 512 48 re f',
      '0 0 0 rg',
      text('Efectividad de recaudo', 62, 414, 9),
      text(`${Number(kpis.porcentajeEfectividadRecaudo || 0).toFixed(1)}%`, 300, 414, 10, true),
      text('Gestion financiera', 420, 414, 9),
      text('Cartera pendiente', 62, 398, 9),
      text(formatCurrency(kpis.carteraPendientePesos), 300, 398, 9, true),
      text('Saldo por recuperar', 420, 398, 9),
      '0.9 0.92 0.94 RG 50 386 m 562 386 l S',
      text('INDICADORES DE DESEMPENO', 50, 325, 14, true),
      '0.88 0.9 0.93 rg 190 285 330 12 re f',
      `0.12 0.48 0.72 rg 190 285 ${Math.min(330, 330 * Number(kpis.porcentajeAprobacionAcademica || 0) / 100)} 12 re f`,
      '0.88 0.9 0.93 rg 190 255 330 12 re f',
      `0.1 0.6 0.42 rg 190 255 ${Math.min(330, 330 * Number(kpis.porcentajeEfectividadRecaudo || 0) / 100)} 12 re f`,
      '0.88 0.9 0.93 rg 190 225 330 12 re f',
      `0.85 0.35 0.18 rg 190 225 ${Math.min(330, 330 * Math.min(100, this.alertasDesercion().length * 10) / 100)} 12 re f`,
      text('Aprobacion academica', 50, 287, 10),
      text(`${Number(kpis.porcentajeAprobacionAcademica || 0).toFixed(1)}%`, 530, 287, 10, true),
      text('Efectividad de recaudo', 50, 257, 10),
      text(`${Number(kpis.porcentajeEfectividadRecaudo || 0).toFixed(1)}%`, 530, 257, 10, true),
      text('Alertas de desercion', 50, 227, 10),
      text(formatNumber(this.alertasDesercion().length), 530, 227, 10, true),
      rule(170),
      text('EduCoreOS | Informe BI institucional', 50, 140, 9),
      text('1 / 2', 530, 40, 9),
      'ET',
      'Q',
    ].join('\n');
    const pageTwo: string[] = [
      'BT',
      text('ANALISIS OPERATIVO', 50, 750, 18, true),
      text(`${colegio} | ${this.exportarBiForm.periodo}`, 50, 728, 10),
      rule(710),
      text('DESEMPENO ACADEMICO', 50, 680, 14, true),
      text(`Asignaturas analizadas: ${this.mapaCalor().length} | Optimas: ${this.contarMateriasOptimas()} | Criticas: ${this.contarMateriasCriticas()}`, 50, 658, 10),
      text('Asignatura / grado', 60, 630, 9, true),
      text('Promedio', 400, 630, 9, true),
      text('Estado', 480, 630, 9, true),
      rule(620),
    ];
    let tableY = 600;
    topSubjects.forEach((subject) => {
      const score = Math.min(200, 200 * Number(subject.promedio || 0) / 5);
      pageTwo.push(
        text(`${subject.asignatura || 'Asignatura'} - ${subject.grado || 'Sin grado'}`, 60, tableY, 9),
        `0.88 0.9 0.93 rg 180 ${tableY - 2} 200 10 re f`,
        `0.12 0.48 0.72 rg 180 ${tableY - 2} ${score} 10 re f`,
        text(Number(subject.promedio || 0).toFixed(2), 400, tableY, 9, true),
        text(subject.alertaCritica ? 'CRITICO' : 'DESTACADO', 480, tableY, 9, true),
        rule(tableY - 10),
      );
      tableY -= 26;
    });
    pageTwo.push(
      text('CARTERA Y RECAUDO', 50, 500, 14, true),
      text(`Saldo pendiente total: ${formatCurrency(kpis.carteraPendientePesos)}`, 50, 475, 10, true),
      text('Tramo', 60, 448, 9, true),
      text('Saldo', 400, 448, 9, true),
      rule(438),
    );
    tableY = 418;
    aging.forEach((item) => {
      const [tramo, saldo] = item.split(': ');
      pageTwo.push(text(tramo, 60, tableY, 9), text(saldo, 400, tableY, 9, true), rule(tableY - 10));
      tableY -= 24;
    });
    pageTwo.push(
      text('ALERTAS Y PRIORIDADES', 50, 300, 14, true),
      text(`Alertas de desercion: ${this.alertasDesercion().length}`, 60, 273, 10, true),
      text(`Materias criticas: ${this.contarMateriasCriticas()}`, 60, 250, 10, true),
      text('Seguimiento recomendado: cartera, riesgo estudiantil y refuerzo academico.', 60, 227, 10),
    );
    if (this.exportarBiForm.incluirSaber11) {
      pageTwo.push(text('SABER 11 Y PROYECCION', 50, 185, 14, true), text(`Puntaje global promedio: ${Number(this.saber11()?.puntajeGlobalPromedio || 0).toFixed(1)}`, 60, 158, 10), text(`Clasificacion proyectada: ${this.saber11()?.clasificacionIcfesProyectada || 'Sin datos'}`, 60, 137, 10));
    }
    pageTwo.push(text('Documento generado por EduCoreOS | 2 / 2', 420, 40, 9), 'ET');
    const contents = [pageOne, pageTwo.join('\n')];
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
      ...contents.map((content) => `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`),
    ];
    const encoder = new TextEncoder();
    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];
    objects.forEach((object, index) => {
     offsets.push(encoder.encode(pdf).length);
     pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = encoder.encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    this.descargarArchivo(new Blob([encoder.encode(pdf)], { type: 'application/pdf' }), `${fileName}.pdf`);
  }

  private descargarArchivo(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  abrirModalSimulacionSaber(): void {
    this.modalSimulacionSaber.set(true);
  }

  guardarSimulacionSaber(): void {
    this.modalSimulacionSaber.set(false);
    this.toast.success(
      `Metas Saber 11° actualizadas (Meta Global: ${this.simulacionSaberForm.metaGlobal} pts).`,
    );
  }

  abrirModalFiltrosDirectivos(): void {
    this.modalFiltrosDirectivos.set(true);
  }

  guardarFiltrosDirectivos(): void {
    this.modalFiltrosDirectivos.set(false);
    this.toast.info(`Filtros directivos aplicados para Sede ${this.filtrosDirectivosForm.sede}.`);
  }

  verDetalleMateria(m: any): void {
    this.materiaSeleccionadaDetalle.set(m);
  }

  contarMateriasCriticas(): number {
    return this.mapaCalor().filter(
      (m) => m.alertaCritica || (m.tasaReprobacion && m.tasaReprobacion > 25),
    ).length;
  }

  contarMateriasOptimas(): number {
    return this.mapaCalor().filter((m) => !m.alertaCritica && m.promedio >= 3.8).length;
  }

  formatearTramo(tramo: string): string {
    const dict: Record<string, string> = {
      AL_DIA: '0 a 30 Días (Corriente)',
      MORA_1_30: '1 a 30 Días de Mora',
      MORA_31_60: '31 a 60 Días de Mora',
      MORA_61_90: '61 a 90 Días de Mora',
      MORA_MAS_90: 'Más de 90 Días (Crítica)',
    };
    return dict[tramo] || tramo.replace(/_/g, ' ');
  }

  obtenerSaldoTramo(tramo: string): string {
    const item = this.carteraAntiguedad().find((i) => i.tramo === tramo);
    const val = item?.saldoTotalPesos || 0;
    return val >= 1000000
      ? `${(val / 1000000).toFixed(1)}M`
      : Math.round(val).toLocaleString('es-CO');
  }

  obtenerSaldoMoraCritica(): string {
    const suma = this.carteraAntiguedad()
      .filter((i) => i.tramo !== 'AL_DIA')
      .reduce((acc, i) => acc + (i.saldoTotalPesos || 0), 0);
    return suma >= 1000000
      ? `${(suma / 1000000).toFixed(1)}M`
      : Math.round(suma).toLocaleString('es-CO');
  }
}
