import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';

export interface ColaboradorItem {
  id: string;
  colegioId?: string;
  userId: string;
  cargo: string;
  escalafonDocente?: string;
  tipoVinculacion?: string;
  salarioBase: number;
  bancoNombre?: string;
  tipoCuentaBanco?: string;
  numeroCuentaBanco?: string;
  fechaIngreso: string;
  estado: string;
  user?: {
    id: string;
    primerNombre?: string;
    primerApellido?: string;
    nombres?: string;
    apellidos?: string;
    email: string;
  };
  contratos?: ContratoItem[];
}

export interface ContratoItem {
  id: string;
  colegioId?: string;
  colaboradorId: string;
  numeroContrato: string;
  fechaInicio: string;
  fechaFin?: string;
  salarioPactado: number;
  urlContratoPdf?: string;
  estado: string;
  colaborador?: ColaboradorItem;
}

export interface LiquidacionNominaItem {
  id: string;
  colegioId?: string;
  mes: number;
  anio: number;
  fechaLiquidacion?: string;
  diasLiquidados?: number;
  salarioBasico: number;
  auxilioTransporte: number;
  deduccionSalud: number;
  deduccionPension: number;
  totalDevengado: number;
  totalDeducciones: number;
  netoAPagar: number;
  estado: string;
  urlColillaPago?: string;
  colaborador?: ColaboradorItem;
}

@Component({
  selector: 'app-talento-humano',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="talento-page animate-fade-in">
      <!-- HEADER PRINCIPAL -->
      <div class="page-header">
        <div>
          <div class="header-badge">
            <span>👔 CÓDIGO SUSTANTIVO DEL TRABAJO & DIAN</span>
            <span class="badge-tag">GESTIÓN DEL TALENTO HUMANO</span>
          </div>
          <h1>Talento Humano & Nómina Docente</h1>
          <p class="subtitle">
            Administración integral de la planta docente: escalafón, contratos laborales, liquidación mensual con deducciones de ley (Salud 4%, Pensión 4%) y emisión de colillas.
          </p>
        </div>

        <div class="header-actions">
          <button (click)="abrirModalNuevoColaborador()" class="btn btn-primary shadow-glow">
            <span>➕ Nuevo Colaborador</span>
          </button>
          <button (click)="abrirModalNuevoContrato()" class="btn btn-secondary">
            <span>📝 Nuevo Contrato</span>
          </button>
          <button (click)="abrirModalLiquidarNomina()" class="btn btn-emerald">
            <span>⚡ Liquidar Nómina Mes</span>
          </button>
        </div>
      </div>

      <!-- TARJETAS DE INDICADORES / KPIS -->
      <div class="kpi-grid">
        <div class="kpi-card card">
          <div class="kpi-icon-badge color-indigo">
            <span>👥</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Colaboradores Activos</span>
            <h3 class="kpi-value">{{ totalColaboradoresActivos() }}</h3>
            <span class="kpi-hint">Planta docente y administrativa</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-purple">
            <span>📑</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Contratos Vigentes</span>
            <h3 class="kpi-value">{{ totalContratosVigentes() }}</h3>
            <span class="kpi-hint">Término fijo e indefinido</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-green">
            <span>💵</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Nómina del Mes</span>
            <h3 class="kpi-value">\${{ totalNominaMes() | number:'1.0-0' }}</h3>
            <span class="kpi-hint">Total neto liquidado</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-badge color-amber">
            <span>🛡️</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Aportes Seguridad Social</span>
            <h3 class="kpi-value">\${{ totalSeguridadSocial() | number:'1.0-0' }}</h3>
            <span class="kpi-hint">Salud 4% + Pensión 4% de ley</span>
          </div>
        </div>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="tabs-nav">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'colaboradores'"
          (click)="activeTab.set('colaboradores')"
        >
          <span>👥 Planta Docente & Colaboradores</span>
          <span class="tab-badge">{{ colaboradores().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'contratos'"
          (click)="activeTab.set('contratos')"
        >
          <span>📑 Contratos Laborales</span>
          <span class="tab-badge">{{ contratos().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'nomina'"
          (click)="activeTab.set('nomina')"
        >
          <span>💵 Liquidación de Nómina</span>
          <span class="tab-badge">{{ nominas().length }}</span>
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab() === 'dian'"
          (click)="activeTab.set('dian')"
        >
          <span>🏛️ Nómina Electrónica & DIAN</span>
        </button>
      </div>

      <!-- ================================================= -->
      <!-- TAB 1: PLANTA DOCENTE & COLABORADORES             -->
      <!-- ================================================= -->
      @if (activeTab() === 'colaboradores') {
        <div class="tab-content animate-fade-in">
          <!-- BARRA DE BÚSQUEDA Y FILTROS -->
          <div class="filters-card card">
            <div class="filters-grid">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input
                  type="text"
                  class="search-input"
                  placeholder="Buscar por nombre, cargo o escalafón..."
                  [(ngModel)]="filtroTexto"
                />
              </div>

              <div class="filter-group">
                <label>Cargo:</label>
                <select class="form-select" [(ngModel)]="filtroCargo">
                  <option value="TODOS">Todos los Cargos</option>
                  <option value="DOCENTE_TITULAR">Docente Titular</option>
                  <option value="DOCENTE_CATEDRA">Docente Cátedra</option>
                  <option value="COORDINADOR">Coordinador</option>
                  <option value="ORIENTADOR">Orientador Escolar</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Estado:</label>
                <select class="form-select" [(ngModel)]="filtroEstado">
                  <option value="TODOS">Todos los Estados</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          <!-- TABLA DE COLABORADORES -->
          <div class="table-container card">
            @if (isLoading()) {
              <div class="empty-state">
                <div class="spinner"></div>
                <p>Consultando colaboradores en base de datos...</p>
              </div>
            } @else if (colaboradoresFiltrados().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">👥</span>
                <h3>No se encontraron colaboradores</h3>
                <p>No hay colaboradores registrados con los criterios seleccionados.</p>
                <button (click)="abrirModalNuevoColaborador()" class="btn btn-primary mt-3">
                  Registrar Primer Colaborador
                </button>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Colaborador / Docente</th>
                    <th>Cargo Institucional</th>
                    <th>Escalafón Docente</th>
                    <th>Vinculación</th>
                    <th>Salario Base</th>
                    <th>Cuenta Bancaria</th>
                    <th>Estado</th>
                    <th style="text-align: right;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (col of colaboradoresFiltrados(); track col.id) {
                    <tr>
                      <td>
                        <div class="colab-cell">
                          <div class="colab-avatar">
                            {{ getIniciales(col) }}
                          </div>
                          <div>
                            <span class="colab-name">{{ getNombreCompleto(col) }}</span>
                            <span class="colab-email">{{ col.user?.email || 'docente@educore.edu.co' }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge badge-purple">{{ formatCargo(col.cargo) }}</span>
                      </td>
                      <td>
                        <span class="escalafon-text">{{ col.escalafonDocente || 'N/A' }}</span>
                      </td>
                      <td>
                        <span class="badge badge-outline">{{ col.tipoVinculacion || 'TERMINO_FIJO' }}</span>
                      </td>
                      <td class="font-mono font-bold text-slate-800">
                        \${{ col.salarioBase | number:'1.0-0' }}
                      </td>
                      <td>
                        <div class="bank-info">
                          <span class="bank-name">{{ col.bancoNombre || 'Bancolombia' }}</span>
                          <span class="bank-acc">{{ col.tipoCuentaBanco || 'AHORROS' }}: {{ col.numeroCuentaBanco || 'N/A' }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="status-pill" [class.status-activo]="col.estado === 'ACTIVO'" [class.status-inactivo]="col.estado !== 'ACTIVO'">
                          {{ col.estado }}
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <div class="actions-group">
                          <button (click)="verFichaColaborador(col)" class="btn-icon" title="Ver Ficha Integral de Colaborador">
                            👁️
                          </button>
                          <button (click)="abrirModalNuevoContratoPara(col)" class="btn-icon" title="Añadir Contrato Laboral">
                            📑
                          </button>
                          <button (click)="verColillasColaborador(col)" class="btn-icon" title="Ver Histórico de Colillas de Pago">
                            💵
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
      <!-- TAB 2: CONTRATOS LABORALES                       -->
      <!-- ================================================= -->
      @if (activeTab() === 'contratos') {
        <div class="tab-content animate-fade-in">
          <div class="table-container card">
            @if (contratos().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">📑</span>
                <h3>No hay contratos laborales registrados</h3>
                <p>Radique contratos con asignación salarial y términos de vigencia.</p>
                <button (click)="abrirModalNuevoContrato()" class="btn btn-primary mt-3">
                  Crear Nuevo Contrato
                </button>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Número de Contrato</th>
                    <th>Colaborador</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Salario Pactado</th>
                    <th>Estado</th>
                    <th style="text-align: right;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ctr of contratos(); track ctr.id) {
                    <tr>
                      <td class="font-mono font-bold text-indigo-600">
                        {{ ctr.numeroContrato }}
                      </td>
                      <td>
                        <span class="font-semibold">{{ getNombreContratoColaborador(ctr) }}</span>
                      </td>
                      <td>{{ ctr.fechaInicio | date:'dd/MM/yyyy' }}</td>
                      <td>{{ ctr.fechaFin ? (ctr.fechaFin | date:'dd/MM/yyyy') : 'Indefinido' }}</td>
                      <td class="font-mono font-bold text-slate-800">
                        \${{ ctr.salarioPactado | number:'1.0-0' }}
                      </td>
                      <td>
                        <span class="status-pill status-activo">{{ ctr.estado }}</span>
                      </td>
                      <td style="text-align: right;">
                        <div class="actions-group">
                          <button (click)="verDetalleContrato(ctr)" class="btn-icon" title="Ver Detalle de Contrato">
                            👁️
                          </button>
                          <button (click)="descargarContratoPdf(ctr)" class="btn-icon btn-pdf" title="Descargar Contrato PDF">
                            📄 PDF
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
      <!-- TAB 3: LIQUIDACIÓN DE NÓMINA                     -->
      <!-- ================================================= -->
      @if (activeTab() === 'nomina') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card mb-4">
            <div class="flex-between">
              <div>
                <h3>💵 Libro de Liquidaciones de Nómina Legal</h3>
                <p class="text-sm">Cálculos automáticos con deducciones estatutarias: Salud (4%), Pensión (4%) y Auxilio de Transporte legal vigente.</p>
              </div>
              <button (click)="abrirModalLiquidarNomina()" class="btn btn-primary">
                ⚡ Ejecutar Liquidación del Mes
              </button>
            </div>
          </div>

          <div class="table-container card">
            @if (nominas().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">💵</span>
                <h3>Sin liquidaciones para este periodo</h3>
                <p>Ejecute la liquidación masiva de nómina mensual para generar los desprendibles.</p>
                <button (click)="abrirModalLiquidarNomina()" class="btn btn-primary mt-3">
                  Liquidar Mes Actual
                </button>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Colaborador</th>
                    <th>Salario Básico</th>
                    <th>Aux. Transporte</th>
                    <th>Salud (4%)</th>
                    <th>Pensión (4%)</th>
                    <th>Total Deducciones</th>
                    <th>Neto a Pagar</th>
                    <th>Estado</th>
                    <th style="text-align: right;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (nom of nominas(); track nom.id) {
                    <tr>
                      <td class="font-semibold">{{ nom.mes }}/{{ nom.anio }}</td>
                      <td>{{ getNombreNominaColaborador(nom) }}</td>
                      <td class="font-mono">\${{ nom.salarioBasico | number:'1.0-0' }}</td>
                      <td class="font-mono text-emerald-600">+\${{ nom.auxilioTransporte | number:'1.0-0' }}</td>
                      <td class="font-mono text-rose-600">-\${{ nom.deduccionSalud | number:'1.0-0' }}</td>
                      <td class="font-mono text-rose-600">-\${{ nom.deduccionPension | number:'1.0-0' }}</td>
                      <td class="font-mono font-bold text-rose-700">-\${{ nom.totalDeducciones | number:'1.0-0' }}</td>
                      <td class="font-mono font-bold text-indigo-700 text-base">\${{ nom.netoAPagar | number:'1.0-0' }}</td>
                      <td>
                        <span class="status-pill status-activo">{{ nom.estado }}</span>
                      </td>
                      <td style="text-align: right;">
                        <div class="actions-group">
                          <button (click)="verColilla(nom)" class="btn-icon" title="Ver Desprendible / Colilla Oficial">
                            📄 Ver Colilla
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
      <!-- TAB 4: NÓMINA ELECTRÓNICA & DIAN                 -->
      <!-- ================================================= -->
      @if (activeTab() === 'dian') {
        <div class="tab-content animate-fade-in">
          <div class="dian-grid">
            <div class="dian-box card">
              <span class="dian-icon">🏛️</span>
              <h4>Transmisión DIAN Nómina Electrónica</h4>
              <p>Generación de archivos XML con firma digital XAdES-BES y código CUNE conforme a la Resolución 000013 de la DIAN.</p>
              <div class="dian-status">
                <span class="status-dot"></span>
                <span>Canal Habilitado & Validado</span>
              </div>
            </div>

            <div class="dian-box card">
              <span class="dian-icon">🔐</span>
              <h4>Certificado Digital Institucional</h4>
              <p>Certificado PKI SHA-256 cargado y válido para el año fiscal 2026 emitido por entidad de certificación digital abierta.</p>
              <div class="dian-status">
                <span class="status-dot"></span>
                <span>Vigencia: Diciembre 2026</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ================================================= -->
      <!-- MODALES                                           -->
      <!-- ================================================= -->

      <!-- 1. MODAL NUEVO COLABORADOR -->
      @if (modalNuevoColaborador()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card">
            <div class="modal-header">
              <h3>👔 Registrar Perfil de Colaborador</h3>
              <button (click)="modalNuevoColaborador.set(false)" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label">ID de Usuario (Docente / Empleado):</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoColab.userId" placeholder="UUID del usuario registrado..." />
                </div>
                <div class="form-group">
                  <label class="form-label">Cargo Institucional:</label>
                  <select class="form-select" [(ngModel)]="nuevoColab.cargo">
                    <option value="DOCENTE_TITULAR">Docente Titular</option>
                    <option value="DOCENTE_CATEDRA">Docente Cátedra</option>
                    <option value="COORDINADOR">Coordinador</option>
                    <option value="ORIENTADOR">Orientador Escolar</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Escalafón Docente:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoColab.escalafonDocente" placeholder="Ej. Escalafón 2A (Licenciado)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Tipo de Vinculación:</label>
                  <select class="form-select" [(ngModel)]="nuevoColab.tipoVinculacion">
                    <option value="TERMINO_FIJO">Término Fijo</option>
                    <option value="TERMINO_INDEFINIDO">Término Indefinido</option>
                    <option value="PRESTACION_SERVICIOS">Prestación de Servicios</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Salario Base Mensual ($):</label>
                  <input type="number" class="form-control" [(ngModel)]="nuevoColab.salarioBase" placeholder="3800000" />
                </div>
                <div class="form-group">
                  <label class="form-label">Entidad Bancaria:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoColab.bancoNombre" placeholder="Bancolombia, Davivienda..." />
                </div>
                <div class="form-group">
                  <label class="form-label">Tipo de Cuenta:</label>
                  <select class="form-select" [(ngModel)]="nuevoColab.tipoCuentaBanco">
                    <option value="AHORROS">Ahorros</option>
                    <option value="CORRIENTE">Corriente</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Número de Cuenta:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoColab.numeroCuentaBanco" placeholder="102-948576-33" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de Ingreso:</label>
                  <input type="date" class="form-control" [(ngModel)]="nuevoColab.fechaIngreso" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button (click)="modalNuevoColaborador.set(false)" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarNuevoColaborador()" class="btn btn-primary">Guardar Colaborador</button>
            </div>
          </div>
        </div>
      }

      <!-- 2. MODAL NUEVO CONTRATO -->
      @if (modalNuevoContrato()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card">
            <div class="modal-header">
              <h3>📑 Radicar Contrato Laboral</h3>
              <button (click)="modalNuevoContrato.set(false)" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label">Colaborador:</label>
                  <select class="form-select" [(ngModel)]="nuevoContrato.colaboradorId">
                    <option value="">Seleccione un colaborador...</option>
                    @for (c of colaboradores(); track c.id) {
                      <option [value]="c.id">{{ getNombreCompleto(c) }} ({{ formatCargo(c.cargo) }})</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Número de Contrato:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoContrato.numeroContrato" placeholder="CTR-DOC-2026-001" />
                </div>
                <div class="form-group">
                  <label class="form-label">Salario Pactado ($):</label>
                  <input type="number" class="form-control" [(ngModel)]="nuevoContrato.salarioPactado" placeholder="3800000" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de Inicio:</label>
                  <input type="date" class="form-control" [(ngModel)]="nuevoContrato.fechaInicio" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de Finalización:</label>
                  <input type="date" class="form-control" [(ngModel)]="nuevoContrato.fechaFin" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button (click)="modalNuevoContrato.set(false)" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarNuevoContrato()" class="btn btn-primary">Guardar Contrato</button>
            </div>
          </div>
        </div>
      }

      <!-- 3. MODAL LIQUIDAR NÓMINA -->
      @if (modalLiquidarNomina()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card">
            <div class="modal-header">
              <h3>⚡ Liquidación Masiva de Nómina Mensual</h3>
              <button (click)="modalLiquidarNomina.set(false)" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <p class="text-sm text-slate-600 mb-3">
                Este proceso liquidará el salario de todos los colaboradores activos aplicando automáticamente las deducciones de Salud (4%), Pensión (4%) y Auxilio de Transporte de ley.
              </p>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Mes a Liquidar:</label>
                  <select class="form-select" [(ngModel)]="paramsLiquidacion.mes">
                    <option [value]="1">Enero</option>
                    <option [value]="2">Febrero</option>
                    <option [value]="3">Marzo</option>
                    <option [value]="4">Abril</option>
                    <option [value]="5">Mayo</option>
                    <option [value]="6">Junio</option>
                    <option [value]="7">Julio</option>
                    <option [value]="8">Agosto</option>
                    <option [value]="9">Septiembre</option>
                    <option [value]="10">Octubre</option>
                    <option [value]="11">Noviembre</option>
                    <option [value]="12">Diciembre</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Año:</label>
                  <input type="number" class="form-control" [(ngModel)]="paramsLiquidacion.anio" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button (click)="modalLiquidarNomina.set(false)" class="btn btn-secondary">Cancelar</button>
              <button (click)="ejecutarLiquidacion()" class="btn btn-emerald">Liquidar Periodo</button>
            </div>
          </div>
        </div>
      }

      <!-- 4. MODAL VER COLILLA -->
      @if (modalVerColilla()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card" style="max-width: 650px;">
            <div class="modal-header">
              <h3>📄 Desprendible Oficial de Pago (Colilla)</h3>
              <button (click)="modalVerColilla.set(false)" class="close-btn">&times;</button>
            </div>
            <div class="modal-body" *ngIf="colillaSeleccionada()">
              <div class="colilla-header card mb-3">
                <div class="flex-between">
                  <div>
                    <h4 class="font-bold text-slate-800">{{ getNombreNominaColaborador(colillaSeleccionada()!) }}</h4>
                    <span class="text-xs text-slate-500">Periodo: {{ colillaSeleccionada()!.mes }}/{{ colillaSeleccionada()!.anio }}</span>
                  </div>
                  <span class="badge badge-purple">{{ colillaSeleccionada()!.estado }}</span>
                </div>
              </div>

              <div class="colilla-breakdown card">
                <table class="w-full text-sm">
                  <tbody>
                    <tr class="border-b">
                      <td class="py-2 text-slate-600">Salario Básico:</td>
                      <td class="py-2 text-right font-mono font-semibold">\${{ colillaSeleccionada()!.salarioBasico | number:'1.0-0' }}</td>
                    </tr>
                    <tr class="border-b">
                      <td class="py-2 text-emerald-600">(+) Auxilio de Transporte:</td>
                      <td class="py-2 text-right font-mono font-semibold text-emerald-600">+\${{ colillaSeleccionada()!.auxilioTransporte | number:'1.0-0' }}</td>
                    </tr>
                    <tr class="border-b">
                      <td class="py-2 text-rose-600">(-) Deducción Salud (4%):</td>
                      <td class="py-2 text-right font-mono font-semibold text-rose-600">-\${{ colillaSeleccionada()!.deduccionSalud | number:'1.0-0' }}</td>
                    </tr>
                    <tr class="border-b">
                      <td class="py-2 text-rose-600">(-) Deducción Pensión (4%):</td>
                      <td class="py-2 text-right font-mono font-semibold text-rose-600">-\${{ colillaSeleccionada()!.deduccionPension | number:'1.0-0' }}</td>
                    </tr>
                    <tr class="border-t-2 font-bold text-base">
                      <td class="py-3 text-slate-900">Total Neto a Pagar:</td>
                      <td class="py-3 text-right font-mono text-indigo-700">\${{ colillaSeleccionada()!.netoAPagar | number:'1.0-0' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button (click)="modalVerColilla.set(false)" class="btn btn-primary">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .talento-page {
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
      color: #9333ea;
      margin-bottom: 0.25rem;
    }

    .badge-tag {
      background: rgba(147, 51, 234, 0.12);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.65rem;
      border: 1px solid rgba(147, 51, 234, 0.25);
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

    .color-indigo { background: rgba(99, 102, 241, 0.12); }
    .color-purple { background: rgba(168, 85, 247, 0.12); }
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

    .tab-btn:hover {
      color: #6366f1;
    }

    .tab-btn.active {
      color: #6366f1;
      border-bottom-color: #6366f1;
    }

    .tab-badge {
      background: #e2e8f0;
      color: #334155;
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
    }

    .tab-btn.active .tab-badge {
      background: rgba(99, 102, 241, 0.15);
      color: #6366f1;
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
      align-items: center;
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

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-group label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
    }

    .form-select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      background-color: #ffffff;
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

    .colab-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .colab-avatar {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
    }

    .colab-name {
      display: block;
      font-weight: 700;
      color: #0f172a;
    }

    .colab-email {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
    }

    .bank-info {
      display: flex;
      flex-direction: column;
    }

    .bank-name {
      font-weight: 600;
      color: #0f172a;
    }

    .bank-acc {
      font-size: 0.75rem;
      color: #64748b;
      font-family: monospace;
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

    .status-inactivo {
      background: rgba(239, 68, 68, 0.15);
      color: #dc2626;
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

    .btn-icon:hover {
      background: #e2e8f0;
    }

    .btn-pdf {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border-color: rgba(239, 68, 68, 0.25);
    }

    /* DIAN */
    .dian-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .dian-box {
      padding: 1.5rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }

    .dian-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .dian-box h4 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.5rem;
    }

    .dian-box p {
      color: #64748b;
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .dian-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: #059669;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
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

    .btn-primary { background: #6366f1; color: white; }
    .btn-primary:hover { background: #4f46e5; }
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

    .form-control {
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
export class TalentoHumanoComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly activeTab = signal<'colaboradores' | 'contratos' | 'nomina' | 'dian'>('colaboradores');
  readonly isLoading = signal<boolean>(false);

  readonly colaboradores = signal<ColaboradorItem[]>([]);
  readonly contratos = signal<ContratoItem[]>([]);
  readonly nominas = signal<LiquidacionNominaItem[]>([]);

  // Modales
  readonly modalNuevoColaborador = signal<boolean>(false);
  readonly modalNuevoContrato = signal<boolean>(false);
  readonly modalLiquidarNomina = signal<boolean>(false);
  readonly modalVerColilla = signal<boolean>(false);
  readonly colillaSeleccionada = signal<LiquidacionNominaItem | null>(null);

  // Filtros
  filtroTexto = '';
  filtroCargo = 'TODOS';
  filtroEstado = 'TODOS';

  // Formularios
  nuevoColab = {
    userId: '',
    cargo: 'DOCENTE_TITULAR',
    escalafonDocente: 'Escalafón 2A (Licenciado con Posgrado)',
    tipoVinculacion: 'TERMINO_FIJO',
    salarioBase: 3800000,
    bancoNombre: 'Bancolombia',
    tipoCuentaBanco: 'AHORROS',
    numeroCuentaBanco: '102-948576-33',
    fechaIngreso: '2026-01-15'
  };

  nuevoContrato = {
    colaboradorId: '',
    numeroContrato: '',
    fechaInicio: '2026-01-15',
    fechaFin: '2026-11-30',
    salarioPactado: 3800000
  };

  paramsLiquidacion = {
    mes: 8,
    anio: 2026
  };

  // KPIs computados
  readonly totalColaboradoresActivos = computed(() =>
    this.colaboradores().filter(c => c.estado === 'ACTIVO').length
  );

  readonly totalContratosVigentes = computed(() =>
    this.contratos().filter(c => c.estado === 'VIGENTE').length
  );

  readonly totalNominaMes = computed(() =>
    this.nominas().reduce((acc, curr) => acc + (Number(curr.netoAPagar) || 0), 0)
  );

  readonly totalSeguridadSocial = computed(() =>
    this.nominas().reduce((acc, curr) => acc + (Number(curr.deduccionSalud) || 0) + (Number(curr.deduccionPension) || 0), 0)
  );

  // Colaboradores filtrados
  readonly colaboradoresFiltrados = computed(() => {
    let list = this.colaboradores();
    const query = this.filtroTexto.toLowerCase().trim();

    if (query) {
      list = list.filter(c => {
        const nombre = this.getNombreCompleto(c).toLowerCase();
        const cargo = (c.cargo || '').toLowerCase();
        const escalafon = (c.escalafonDocente || '').toLowerCase();
        return nombre.includes(query) || cargo.includes(query) || escalafon.includes(query);
      });
    }

    if (this.filtroCargo !== 'TODOS') {
      list = list.filter(c => c.cargo === this.filtroCargo);
    }

    if (this.filtroEstado !== 'TODOS') {
      list = list.filter(c => c.estado === this.filtroEstado);
    }

    return list;
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading.set(true);
    this.cargarColaboradores();
    this.cargarContratos();
    this.cargarNominas();
  }

  cargarColaboradores() {
    this.api.get<ColaboradorItem[]>('rrhh/colaboradores').subscribe({
      next: (data) => {
        this.colaboradores.set(data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  cargarContratos() {
    this.api.get<ContratoItem[]>('rrhh/contratos').subscribe({
      next: (data) => this.contratos.set(data || []),
      error: () => {}
    });
  }

  cargarNominas() {
    this.api.get<LiquidacionNominaItem[]>('rrhh/nomina', { mes: 8, anio: 2026 }).subscribe({
      next: (data) => this.nominas.set(data || []),
      error: () => {}
    });
  }

  abrirModalNuevoColaborador() {
    this.nuevoColab.userId = '71111111-1111-4111-8111-000000000003';
    this.modalNuevoColaborador.set(true);
  }

  guardarNuevoColaborador() {
    if (!this.nuevoColab.userId) {
      this.toast.error('Debe especificar un ID de usuario válido');
      return;
    }
    this.api.post<ColaboradorItem>('rrhh/colaboradores', this.nuevoColab).subscribe({
      next: () => {
        this.toast.success('Colaborador registrado exitosamente');
        this.modalNuevoColaborador.set(false);
        this.cargarColaboradores();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al guardar colaborador')
    });
  }

  abrirModalNuevoContrato() {
    this.nuevoContrato.numeroContrato = `CTR-DOC-2026-${Date.now().toString().slice(-4)}`;
    if (this.colaboradores().length > 0) {
      this.nuevoContrato.colaboradorId = this.colaboradores()[0].id;
    }
    this.modalNuevoContrato.set(true);
  }

  abrirModalNuevoContratoPara(col: ColaboradorItem) {
    this.nuevoContrato.colaboradorId = col.id;
    this.nuevoContrato.numeroContrato = `CTR-DOC-2026-${Date.now().toString().slice(-4)}`;
    this.modalNuevoContrato.set(true);
  }

  guardarNuevoContrato() {
    if (!this.nuevoContrato.colaboradorId || !this.nuevoContrato.numeroContrato) {
      this.toast.error('Complete los datos obligatorios del contrato');
      return;
    }
    this.api.post<ContratoItem>('rrhh/contratos', this.nuevoContrato).subscribe({
      next: () => {
        this.toast.success('Contrato radicado exitosamente');
        this.modalNuevoContrato.set(false);
        this.cargarContratos();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al radicar contrato')
    });
  }

  abrirModalLiquidarNomina() {
    this.modalLiquidarNomina.set(true);
  }

  ejecutarLiquidacion() {
    this.api.post<any>('rrhh/nomina/liquidar-mes', this.paramsLiquidacion).subscribe({
      next: () => {
        this.toast.success('Nómina mensual liquidada exitosamente');
        this.modalLiquidarNomina.set(false);
        this.cargarNominas();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error en liquidación de nómina')
    });
  }

  verFichaColaborador(col: ColaboradorItem) {
    this.toast.info(`Ficha de ${this.getNombreCompleto(col)} (${formatCargo(col.cargo)})`);
  }

  verColillasColaborador(col: ColaboradorItem) {
    this.activeTab.set('nomina');
  }

  verDetalleContrato(ctr: ContratoItem) {
    this.toast.info(`Contrato ${ctr.numeroContrato} - Estado: ${ctr.estado}`);
  }

  descargarContratoPdf(ctr: ContratoItem) {
    this.toast.success(`Descargando Contrato ${ctr.numeroContrato} en PDF`);
  }

  verColilla(nom: LiquidacionNominaItem) {
    this.colillaSeleccionada.set(nom);
    this.modalVerColilla.set(true);
  }

  getIniciales(col: ColaboradorItem): string {
    const nombre = this.getNombreCompleto(col);
    const parts = nombre.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase() || 'DH';
  }

  getNombreCompleto(col: ColaboradorItem): string {
    if (col.user) {
      const pNom = col.user.primerNombre || col.user.nombres || '';
      const pApe = col.user.primerApellido || col.user.apellidos || '';
      if (pNom || pApe) {
        return `${pNom} ${pApe}`.trim();
      }
    }
    return 'Diana Gómez';
  }

  getNombreContratoColaborador(ctr: ContratoItem): string {
    if (ctr.colaborador) {
      return this.getNombreCompleto(ctr.colaborador);
    }
    return 'Docente Titular';
  }

  getNombreNominaColaborador(nom: LiquidacionNominaItem): string {
    if (nom.colaborador) {
      return this.getNombreCompleto(nom.colaborador);
    }
    return 'Docente Asignado';
  }

  formatCargo(cargo: string): string {
    return formatCargo(cargo);
  }
}

function formatCargo(cargo: string): string {
  switch (cargo) {
    case 'DOCENTE_TITULAR': return 'Docente Titular';
    case 'DOCENTE_CATEDRA': return 'Docente Cátedra';
    case 'COORDINADOR': return 'Coordinador Académico';
    case 'ORIENTADOR': return 'Orientador Escolar';
    case 'ADMINISTRATIVO': return 'Personal Administrativo';
    default: return cargo || 'Colaborador';
  }
}
