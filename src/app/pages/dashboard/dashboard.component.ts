import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { KpiRectoria } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      
      <!-- =================================================== -->
      <!-- VISTA 1: DASHBOARD PARA DOCENTE (PEDAGÓGICO)        -->
      <!-- =================================================== -->
      @if (authService.user()?.role === 'DOCENTE') {
        <!-- Header Docente -->
        <div class="dashboard-header">
          <div>
            <h1>Dashboard Pedagógico & Gestión de Aula</h1>
            <p>
              Bienvenida(o), <strong>Prof. {{ authService.user()?.primerNombre }} {{ authService.user()?.primerApellido }}</strong> 
              — Periodo Académico 1 | {{ authService.colegio()?.nombre }}
            </p>
          </div>
          <div class="header-actions">
            <a routerLink="/academico" class="btn btn-primary">
              <span>📝 Mis Planillas (1290)</span>
            </a>
            <a routerLink="/educore-ai" class="btn btn-secondary">
              <span>✨ EduCore AI Planeador</span>
            </a>
          </div>
        </div>

        <!-- KPIs Pedagógicos (0% Información Financiera) -->
        <div class="grid-cols-4 kpi-cards-grid">
          <div class="card kpi-card">
            <div class="kpi-icon-box blue">
              <span class="icon">👥</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">ESTUDIANTES A CARGO</span>
              <div class="kpi-value">145</div>
              <span class="kpi-sub positive">4 grupos asignados</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box green">
              <span class="icon">📋</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">PLANILLAS DE CALIFICACIÓN</span>
              <div class="kpi-value">3 / 4</div>
              <span class="kpi-sub positive">75% avance de periodo</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box emerald">
              <span class="icon">🎓</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">PROMEDIO DE MIS GRUPOS</span>
              <div class="kpi-value">4.18</div>
              <span class="kpi-sub positive">Desempeño Alto (Dec. 1290)</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box amber">
              <span class="icon">⚠️</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">EN RIESGO ACADÉMICO</span>
              <div class="kpi-value">6</div>
              <span class="kpi-sub text-amber-600">Nota < 3.0 para recuperación</span>
            </div>
          </div>
        </div>

        <!-- Fila 2: Mis Asignaturas + Horario del Día -->
        <div class="grid-cols-2 mt-6">
          <!-- Mis Asignaturas y Planillas -->
          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>📚 Mis Asignaturas & Planillas Digitales</h3>
                <p>Planilla de registro de calificaciones conforme al Decreto 1290</p>
              </div>
              <span class="badge badge-info">Periodo 1</span>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th>Asignatura</th>
                    <th>Alumnos</th>
                    <th>Promedio</th>
                    <th>Planilla</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  @for (curso of cursosDocente; track curso.grupo) {
                    <tr>
                      <td><strong>{{ curso.grupo }}</strong></td>
                      <td>{{ curso.asignatura }}</td>
                      <td>{{ curso.alumnos }} estudiantes</td>
                      <td><strong>{{ curso.promedio }}</strong> / 5.0</td>
                      <td>
                        @if (curso.estado === 'COMPLETADA') {
                          <span class="badge badge-success">Completada</span>
                        } @else {
                          <span class="badge badge-warning">En Proceso</span>
                        }
                      </td>
                      <td>
                        <a routerLink="/academico" class="btn btn-secondary btn-sm">
                          ✏️ Calificar
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Horario de Hoy & Asistencia Rápida -->
          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>⏰ Mi Horario de Clases de Hoy</h3>
                <p>Control de asistencia y seguimiento de aula</p>
              </div>
              <span class="badge badge-purple">Hoy: Martes</span>
            </div>

            <div class="schedule-list">
              @for (bloque of horarioHoy; track bloque.hora) {
                <div class="schedule-item">
                  <div class="schedule-time">
                    <strong>{{ bloque.hora }}</strong>
                    <span>{{ bloque.aula }}</span>
                  </div>
                  <div class="schedule-detail">
                    <h4>{{ bloque.asignatura }} — {{ bloque.grupo }}</h4>
                    <p>{{ bloque.tema }}</p>
                  </div>
                  <button class="btn btn-primary btn-sm" title="Tomar lista de asistencia">
                    📋 Asistencia
                  </button>
                </div>
              }
            </div>

            <div class="ai-box mt-4">
              <div class="ai-box-header">
                <span class="ai-icon">✨</span>
                <strong>EduCore AI — Asistente de Planeación Pedagógica</strong>
              </div>
              <p class="ai-text">
                ¿Necesitas diseñar una rúbrica de evaluación formativa o una adaptación curricular <strong>PIAR (Decreto 1421)</strong>?
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
            <h1>Dashboard Financiero & Tesorería Escolar</h1>
            <p>Facturación masiva de pensiones, recaudo en línea Wompi / PSE y semáforo de cobranza</p>
          </div>
          <div class="header-actions">
            <a routerLink="/tesoreria" class="btn btn-primary">
              <span>💰 Ver Cartera & Facturación</span>
            </a>
          </div>
        </div>

        <!-- KPIs 100% Financieros -->
        <div class="grid-cols-4 kpi-cards-grid">
          <div class="card kpi-card">
            <div class="kpi-icon-box emerald">
              <span class="icon">💵</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">TOTAL RECAUDADO (MES)</span>
              <div class="kpi-value">\$353.2M</div>
              <span class="kpi-sub positive">92.4% meta mensual</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box amber">
              <span class="icon">⚠️</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">CARTERA POR COBRAR</span>
              <div class="kpi-value">\$18.5M</div>
              <span class="kpi-sub text-amber-600">23 familias en mora</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box blue">
              <span class="icon">💳</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">PAGOS ONLINE (WOMPI/PSE)</span>
              <div class="kpi-value">742</div>
              <span class="kpi-sub positive">87.3% vía digital</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box green">
              <span class="icon">📄</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">A PAZ Y SALVO</span>
              <div class="kpi-value">785</div>
              <span class="kpi-sub positive">92.4% de los estudiantes</span>
            </div>
          </div>
        </div>

        <!-- Fila 2: Semáforo de Cartera + Transacciones Recientes -->
        <div class="grid-cols-2 mt-6">
          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>📊 Distribución del Semáforo de Cobranza</h3>
                <p>Estado de cuenta global de los 850 estudiantes matriculados</p>
              </div>
              <a routerLink="/tesoreria" class="btn btn-secondary btn-sm">Ver Listado Completo</a>
            </div>

            <div class="semaforo-bars-list mt-3">
              <div class="semaforo-item">
                <div class="bar-info">
                  <span>🟢 Al Día (Paz y Salvo)</span>
                  <strong>785 estudiantes (92.4%)</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill green" style="width: 92.4%"></div>
                </div>
              </div>

              <div class="semaforo-item mt-3">
                <div class="bar-info">
                  <span>🟡 Por Vencer (Próximos 5 días)</span>
                  <strong>42 estudiantes (4.9%)</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill amber" style="width: 4.9%"></div>
                </div>
              </div>

              <div class="semaforo-item mt-3">
                <div class="bar-info">
                  <span>🔴 En Mora (>30 días)</span>
                  <strong>23 estudiantes (2.7%)</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill red" style="width: 2.7%"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>⚡ Últimas Transacciones Wompi / PSE</h3>
                <p>Recaudos procesados con firma criptográfica en tiempo real</p>
              </div>
              <span class="badge badge-success">Pasarela Activa</span>
            </div>

            <table class="data-table" style="font-size: 0.825rem;">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Estudiante</th>
                  <th>Medio</th>
                  <th>Valor</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>FACT-08-001</code></td>
                  <td>García Torres Mariana</td>
                  <td>PSE Bancolombia</td>
                  <td><strong>\$450.000</strong></td>
                  <td><span class="badge badge-success">Aprobado</span></td>
                </tr>
                <tr>
                  <td><code>FACT-08-015</code></td>
                  <td>Morales Castro Sofía</td>
                  <td>Nequi QR</td>
                  <td><strong>\$450.000</strong></td>
                  <td><span class="badge badge-success">Aprobado</span></td>
                </tr>
                <tr>
                  <td><code>FACT-08-032</code></td>
                  <td>Ramírez David</td>
                  <td>Tarjeta Crédito</td>
                  <td><strong>\$450.000</strong></td>
                  <td><span class="badge badge-success">Aprobado</span></td>
                </tr>
              </tbody>
            </table>
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
            <h1>Dashboard de Coordinación & Calidad Educativa</h1>
            <p>Supervisión pedagógica, observador de convivencia (Ley 1620) y consolidación académica</p>
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

        <!-- KPIs Coordinación -->
        <div class="grid-cols-4 kpi-cards-grid">
          <div class="card kpi-card">
            <div class="kpi-icon-box blue">
              <span class="icon">🏫</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">TOTAL ESTUDIANTES</span>
              <div class="kpi-value">850</div>
              <span class="kpi-sub positive">24 grupos activos</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box amber">
              <span class="icon">⚖️</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">CASOS DE CONVIVENCIA</span>
              <div class="kpi-value">5</div>
              <span class="kpi-sub text-amber-600">4 Tipo I, 1 Tipo II (Ley 1620)</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box green">
              <span class="icon">📝</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">ENTREGA DE NOTAS DOCENTES</span>
              <div class="kpi-value">38 / 42</div>
              <span class="kpi-sub positive">90.5% docentes al día</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box purple">
              <span class="icon">🚨</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">ALERTAS INASISTENCIA</span>
              <div class="kpi-value">8</div>
              <span class="kpi-sub">Fallas acumuladas >15%</span>
            </div>
          </div>
        </div>

        <!-- Fila 2: Rendimiento por Grados + Alertas Convivencia -->
        <div class="grid-cols-2 mt-6">
          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>📈 Rendimiento Académico por Grados</h3>
                <p>Tasa de aprobación del periodo 1</p>
              </div>
              <span class="badge badge-info">Periodo 1</span>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>Grado</th>
                  <th>Grupos</th>
                  <th>Estudiantes</th>
                  <th>% Aprobación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Sexto (6°)</strong></td><td>4</td><td>150</td><td><strong>96.2%</strong></td><td><span class="badge badge-success">Óptimo</span></td></tr>
                <tr><td><strong>Noveno (9°)</strong></td><td>4</td><td>145</td><td><strong>89.4%</strong></td><td><span class="badge badge-warning">Atención</span></td></tr>
                <tr><td><strong>Décimo (10°)</strong></td><td>4</td><td>140</td><td><strong>88.1%</strong></td><td><span class="badge badge-danger">Crítico Física</span></td></tr>
                <tr><td><strong>Undécimo (11°)</strong></td><td>4</td><td>135</td><td><strong>97.5%</strong></td><td><span class="badge badge-success">Óptimo</span></td></tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-title-bar">
              <div>
                <h3>⚖️ Protocolo de Convivencia Escolar (Ley 1620)</h3>
                <p>Ruta de atención integral y mediación de conflictos</p>
              </div>
              <span class="badge badge-purple">Comité de Convivencia</span>
            </div>

            <div class="ai-box">
              <div class="ai-box-header">
                <span class="ai-icon">📋</span>
                <strong>Caso en Seguimiento — Grado 9°B (Tipo II)</strong>
              </div>
              <p class="ai-text">
                Se activó mediación pedagógica y citación a acudientes por conflicto reiterado en aula. Compromisos firmados en acta digital.
              </p>
            </div>
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
            <h1>Dashboard Ejecutivo & Analytics BI</h1>
            <p>Visión 360° directiva e institucional para Rectoría — {{ authService.colegio()?.nombre }}</p>
          </div>
          <div class="header-actions">
            <a routerLink="/academico" class="btn btn-secondary">
              <span>📝 Calificaciones</span>
            </a>
            <a routerLink="/tesoreria" class="btn btn-primary">
              <span>💰 Cartera & Pagos</span>
            </a>
          </div>
        </div>

        <!-- Tarjetas de KPIs Principales Rector -->
        <div class="grid-cols-4 kpi-cards-grid">
          <div class="card kpi-card">
            <div class="kpi-icon-box blue">
              <span class="icon">👥</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">ESTUDIANTES MATRICULADOS</span>
              <div class="kpi-value">{{ kpis().totalEstudiantesMatriculados }}</div>
              <span class="kpi-sub positive">↑ 98.5% cupos ocupados</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box green">
              <span class="icon">🎓</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">APROBACIÓN ACADÉMICA</span>
              <div class="kpi-value">{{ kpis().porcentajeAprobacionAcademica }}%</div>
              <span class="kpi-sub positive">Promedio: {{ kpis().promedioGeneralInstitucional }} / 5.0</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box emerald">
              <span class="icon">💵</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">EFECTIVIDAD DE RECAUDO</span>
              <div class="kpi-value">{{ kpis().porcentajeEfectividadRecaudo }}%</div>
              <span class="kpi-sub">Wompi / PSE / Efectivo</span>
            </div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-icon-box amber">
              <span class="icon">⚠️</span>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">CARTERA POR COBRAR</span>
              <div class="kpi-value">\${{ (kpis().carteraPendientePesos / 1000000).toFixed(1) }}M</div>
              <span class="kpi-sub text-amber-600">Semáforo de cobranza activo</span>
            </div>
          </div>
        </div>

        <!-- Fila 2: Mapa Térmico de Asignaturas & Alertas de Deserción AI -->
        <div class="grid-cols-2 mt-6">
          <!-- Mapa Térmico de Asignaturas -->
          <div class="card heatmap-card">
            <div class="card-title-bar">
              <div>
                <h3>🌡️ Mapa de Calor: Rendimiento por Asignatura</h3>
                <p>Detección temprana de materias críticas y cuellos de botella académicos</p>
              </div>
              <span class="badge badge-info">Periodo 1</span>
            </div>

            <div class="heatmap-table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Grado</th>
                    <th>Asignatura</th>
                    <th>Promedio</th>
                    <th>Reprobados</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (materia of mapaCalor(); track materia.asignatura) {
                    <tr>
                      <td><strong>{{ materia.grado }}</strong></td>
                      <td>{{ materia.asignatura }}</td>
                      <td><strong>{{ materia.promedio }}</strong> / 5.0</td>
                      <td>{{ materia.reprobados }} estudiantes</td>
                      <td>
                        @if (materia.alertaTermica === 'ROJO') {
                          <span class="badge badge-danger">Crítico</span>
                        } @else if (materia.alertaTermica === 'AMARILLO') {
                          <span class="badge badge-warning">Precaución</span>
                        } @else {
                          <span class="badge badge-success">Óptimo</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Proyecciones Saber 11° & IA Deserción -->
          <div class="card ai-analytics-card">
            <div class="card-title-bar">
              <div>
                <h3>📈 Proyecciones Pruebas Saber 11°</h3>
                <p>Meta institucional: 360 pts | Clasificación ICFES: A+ (Muy Superior)</p>
              </div>
              <span class="badge badge-purple">342 pts Global</span>
            </div>

            <div class="saber-bars-list">
              <div class="saber-bar-item">
                <div class="bar-info">
                  <span>Lectura Crítica</span>
                  <strong>72 pts (Percentil 88)</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: 72%"></div>
                </div>
              </div>

              <div class="saber-bar-item">
                <div class="bar-info">
                  <span>Matemáticas</span>
                  <strong>74 pts (Percentil 91)</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill green" style="width: 74%"></div>
                </div>
              </div>

              <div class="saber-bar-item">
                <div class="bar-info">
                  <span>Ciencias Naturales</span>
                  <strong>68 pts (Percentil 82)</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill purple" style="width: 68%"></div>
                </div>
              </div>

              <div class="saber-bar-item">
                <div class="bar-info">
                  <span>Inglés (Bilingüismo)</span>
                  <strong>76 pts (Percentil 93)</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill indigo" style="width: 76%"></div>
                </div>
              </div>
            </div>

            <div class="ai-box mt-4">
              <div class="ai-box-header">
                <span class="ai-icon">✨</span>
                <strong>EduCore AI — Alerta de Deserción</strong>
              </div>
              <p class="ai-text">
                Se detectaron <strong>3 estudiantes</strong> con riesgo crítico de abandono por cruce de 
                inasistencias injustificadas (>15%) y bajo rendimiento en matemáticas.
              </p>
              <a routerLink="/educore-ai" class="btn btn-outline btn-sm mt-2">
                Ver Intervención Psicoorientación →
              </a>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
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

    .kpi-icon-box.blue { background-color: #e0e7ff; }
    .kpi-icon-box.green { background-color: #d1fae5; }
    .kpi-icon-box.emerald { background-color: #ecfdf5; }
    .kpi-icon-box.amber { background-color: #fef3c7; }
    .kpi-icon-box.purple { background-color: #f3e8ff; }

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

    .semaforo-bars-list, .saber-bars-list {
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

    .progress-fill.green { background: linear-gradient(90deg, #10b981, #059669); }
    .progress-fill.amber { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .progress-fill.red { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .progress-fill.purple { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
    .progress-fill.indigo { background: linear-gradient(90deg, #6366f1, #4f46e5); }

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

    .mt-6 { margin-top: 1.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-2 { margin-top: 0.5rem; }
  `]
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly kpis = signal<KpiRectoria>({
    totalEstudiantesMatriculados: 850,
    totalDocentesActivos: 42,
    relacionEstudianteDocente: 20.2,
    promedioGeneralInstitucional: 4.15,
    porcentajeAprobacionAcademica: 94.8,
    porcentajeEfectividadRecaudo: 92.4,
    carteraPendientePesos: 18450000,
  });

  readonly mapaCalor = signal([
    { grado: 'Décimo (10°)', asignatura: 'Física Clásica', promedio: 3.2, reprobados: 14, alertaTermica: 'ROJO' },
    { grado: 'Noveno (9°)', asignatura: 'Álgebra & Funciones', promedio: 3.6, reprobados: 9, alertaTermica: 'AMARILLO' },
    { grado: 'Undécimo (11°)', asignatura: 'Química Orgánica', promedio: 4.3, reprobados: 2, alertaTermica: 'VERDE' },
    { grado: 'Octavo (8°)', asignatura: 'Lengua Castellana', promedio: 4.5, reprobados: 1, alertaTermica: 'VERDE' },
  ]);

  // Datos contextuales para el Docente
  readonly cursosDocente = [
    { grupo: 'Noveno (9°A)', asignatura: 'Matemáticas & Álgebra', alumnos: 38, promedio: 4.1, estado: 'COMPLETADA' },
    { grupo: 'Noveno (9°B)', asignatura: 'Matemáticas & Álgebra', alumnos: 36, promedio: 3.8, estado: 'EN_PROCESO' },
    { grupo: 'Décimo (10°A)', asignatura: 'Física Clásica', alumnos: 35, promedio: 3.2, estado: 'EN_PROCESO' },
    { grupo: 'Octavo (8°A)', asignatura: 'Geometría Plana', alumnos: 36, promedio: 4.6, estado: 'COMPLETADA' },
  ];

  readonly horarioHoy = [
    { hora: '07:00 - 08:30', aula: 'Salón 201', grupo: '9°A', asignatura: 'Matemáticas', tema: 'Factorización de Polinomios' },
    { hora: '08:30 - 10:00', aula: 'Lab. Ciencias', grupo: '10°A', asignatura: 'Física', tema: 'Leyes de Newton y Dinámica' },
    { hora: '10:30 - 12:00', aula: 'Salón 202', grupo: '9°B', asignatura: 'Matemáticas', tema: 'Ecuaciones Cuadráticas' },
  ];

  ngOnInit() {
    // Si el usuario es Rector, intentar cargar KPIs reales de BI
    if (this.authService.user()?.role === 'RECTOR' || this.authService.user()?.role === 'SUPER_ADMIN') {
      this.api.get<any>('analytics/dashboard-rectoria').subscribe({
        next: (res) => {
          if (res?.kpisDirectivos) {
            this.kpis.set(res.kpisDirectivos);
          }
        },
        error: () => {},
      });
    }
  }
}
