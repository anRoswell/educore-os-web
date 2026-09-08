import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';
import { CurrencyMaskDirective } from '../../shared/directives/currency-mask.directive';
import { FlatpickrDirective } from '../../shared/directives/flatpickr.directive';
import { QuillModule } from 'ngx-quill';

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
  clausulas?: string;
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
  imports: [CommonModule, FormsModule, CurrencyMaskDirective, FlatpickrDirective, QuillModule],
  template: `
    <div class="talento-page animate-fade-in">
      <!-- HEADER PRINCIPAL -->
      <div class="page-header">
        <div>
          <div class="header-badge">
            <span>👔 CÓDIGO SUSTANTIVO DEL TRABAJO & DIAN</span>
            <span class="badge-tag">GESTIÓN DEL TALENTO HUMANO</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin: 0.5rem 0 0.25rem 0;">
            <div class="header-icon-box" style="width: 44px; height: 44px; font-size: 1.5rem;">
              👥
            </div>
            <div>
              <h1 style="margin: 0;">Talento Humano & Nómina Docente</h1>
            </div>
          </div>
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
      <div class="tabs-nav" data-testid="talento-tabs-nav">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'colaboradores'"
          (click)="setTab('colaboradores')"
          data-testid="tab-colaboradores"
        >
          <span>👥 Planta Docente & Colaboradores</span>
          <span class="tab-badge">{{ colaboradores().length }}</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'contratos'"
          (click)="setTab('contratos')"
          data-testid="tab-contratos"
        >
          <span>📑 Contratos Laborales</span>
          <span class="tab-badge">{{ contratos().length }}</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'nomina'"
          (click)="setTab('nomina')"
          data-testid="tab-nomina"
        >
          <span>💵 Liquidación de Nómina</span>
          <span class="tab-badge">{{ nominas().length }}</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'dian'"
          (click)="setTab('dian')"
          data-testid="tab-dian"
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
        <div class="tab-content animate-fade-in" data-testid="tab-content-contratos">
          <!-- Toolbar y Filtros de Contratos -->
          <div class="card mb-3 p-3">
            <div class="flex-between flex-wrap gap-3">
              <div style="flex: 1; min-width: 260px; max-width: 450px;">
                <input
                  type="text"
                  class="form-control"
                  placeholder="🔍 Buscar por No. de Contrato o Colaborador..."
                  [(ngModel)]="filtroContratoTexto"
                  data-testid="input-filtro-contrato"
                />
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <select
                  class="form-select"
                  style="width: auto; min-width: 170px;"
                  [(ngModel)]="filtroContratoEstado"
                  data-testid="select-filtro-estado-contrato"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="VIGENTE">VIGENTE</option>
                  <option value="TERMINADO">TERMINADO</option>
                  <option value="SUSPENDIDO">SUSPENDIDO</option>
                </select>
                <button
                  (click)="abrirModalNuevoContrato()"
                  class="btn btn-primary"
                  data-testid="btn-nuevo-contrato-toolbar"
                >
                  <span>📝 Radicar Nuevo Contrato</span>
                </button>
              </div>
            </div>
          </div>

          <div class="table-container card">
            @if (contratosFiltrados().length === 0) {
              <div class="empty-state" data-testid="empty-contratos">
                <span class="empty-icon">📑</span>
                <h3>No hay contratos laborales registrados</h3>
                <p>Radique contratos con asignación salarial y términos de vigencia o ajuste sus criterios de búsqueda.</p>
                <button (click)="abrirModalNuevoContrato()" class="btn btn-primary mt-3" data-testid="btn-nuevo-contrato-empty">
                  Crear Nuevo Contrato
                </button>
              </div>
            } @else {
              <table class="data-table" data-testid="tabla-contratos">
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
                  @for (ctr of contratosFiltrados(); track ctr.id) {
                    <tr [attr.data-testid]="'row-contrato-' + ctr.id">
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
                        <span
                          class="status-pill"
                          [class.status-activo]="ctr.estado === 'VIGENTE'"
                          [class.status-inactivo]="ctr.estado === 'TERMINADO'"
                          [class.status-pendiente]="ctr.estado === 'SUSPENDIDO'"
                        >
                          {{ ctr.estado }}
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <div class="actions-group">
                          <button
                            (click)="verDetalleContrato(ctr)"
                            class="btn-icon"
                            title="Ver Detalle y Minuta del Contrato"
                            [attr.data-testid]="'btn-ver-contrato-' + ctr.id"
                          >
                            👁️
                          </button>
                          <button
                            (click)="descargarContratoPdf(ctr)"
                            class="btn-icon btn-pdf"
                            title="Descargar Contrato PDF"
                            [attr.data-testid]="'btn-pdf-contrato-' + ctr.id"
                          >
                            📄 PDF
                          </button>
                          <button
                            (click)="abrirModalEditarContrato(ctr)"
                            class="btn-icon"
                            title="Editar Términos del Contrato"
                            [attr.data-testid]="'btn-editar-contrato-' + ctr.id"
                          >
                            ✏️
                          </button>
                          <button
                            (click)="confirmarTerminarContrato(ctr)"
                            class="btn-icon btn-danger"
                            [disabled]="ctr.estado === 'TERMINADO'"
                            title="Terminar / Inactivar Contrato"
                            [attr.data-testid]="'btn-terminar-contrato-' + ctr.id"
                          >
                            🛑
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
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="header-icon-box" style="background: #f0fdf4; border-color: #bbf7d0;">💵</div>
                <div>
                  <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;">Libro de Liquidaciones de Nómina Legal</h3>
                  <p class="text-sm" style="margin: 0.2rem 0 0 0;">Cálculos automáticos con deducciones estatutarias: Salud (4%), Pensión (4%) y Auxilio de Transporte legal vigente.</p>
                </div>
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
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <div class="header-icon-box" style="width: 36px; height: 36px; font-size: 1.25rem;">🏛️</div>
                <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #0f172a;">Transmisión DIAN Nómina Electrónica</h4>
              </div>
              <p>Generación de archivos XML con firma digital XAdES-BES y código CUNE conforme a la Resolución 000013 de la DIAN.</p>
              <div class="dian-status">
                <span class="status-dot"></span>
                <span>Canal Habilitado & Validado</span>
              </div>
            </div>

            <div class="dian-box card">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <div class="header-icon-box" style="width: 36px; height: 36px; font-size: 1.25rem;">🔐</div>
                <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #0f172a;">Certificado Digital Institucional</h4>
              </div>
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
              <div class="modal-title-wrap">
                <div class="header-icon-box">👔</div>
                <div>
                  <h3>Registrar Perfil de Colaborador</h3>
                  <p class="modal-subtitle">Vinculación laboral de personal docente y administrativo en planta institucional</p>
                </div>
              </div>
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
                  <label class="form-label">Salario Base Mensual (COP):</label>
                  <input
                    type="text"
                    appCurrencyMask
                    class="form-control"
                    [(ngModel)]="nuevoColab.salarioBase"
                    data-testid="input-nuevo-colab-salario"
                    placeholder="$ 3.800.000"
                  />
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
                  <input
                    type="text"
                    appFlatpickr
                    class="form-control"
                    [(ngModel)]="nuevoColab.fechaIngreso"
                    placeholder="dd/mm/aaaa"
                  />
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
        <div class="modal-backdrop animate-fade-in" data-testid="modal-nuevo-contrato">
          <div class="modal-card modal-card-xl">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <div class="header-icon-box">📑</div>
                <div>
                  <h3>Radicar Contrato Laboral Docente</h3>
                  <p class="modal-subtitle">Registro formal C.S.T. con estipulaciones y cláusulas editables</p>
                </div>
              </div>
              <button (click)="modalNuevoContrato.set(false)" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div class="contract-form-grid">
                <div class="form-group col-span-2">
                  <label class="form-label">Colaborador:</label>
                  <select class="form-select" [(ngModel)]="nuevoContrato.colaboradorId">
                    <option value="">Seleccione un colaborador...</option>
                    @for (c of colaboradores(); track c.id) {
                      <option [value]="c.id">{{ getNombreCompleto(c) }} ({{ formatCargo(c.cargo) }})</option>
                    }
                  </select>
                </div>
                <div class="form-group col-span-1">
                  <label class="form-label">Número de Contrato:</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoContrato.numeroContrato" placeholder="CTR-DOC-2026-001" />
                </div>
                <div class="form-group col-span-1">
                  <label class="form-label">Salario Mensual Pactado (COP):</label>
                  <input
                    type="text"
                    appCurrencyMask
                    class="form-control"
                    [(ngModel)]="nuevoContrato.salarioPactado"
                    data-testid="input-nuevo-contrato-salario"
                    placeholder="$ 3.800.000"
                  />
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Fecha de Inicio:</label>
                  <input
                    type="text"
                    appFlatpickr
                    class="form-control"
                    [(ngModel)]="nuevoContrato.fechaInicio"
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Fecha de Finalización:</label>
                  <input
                    type="text"
                    appFlatpickr
                    [minDate]="nuevoContrato.fechaInicio"
                    class="form-control"
                    [(ngModel)]="nuevoContrato.fechaFin"
                    placeholder="dd/mm/aaaa"
                  />
                </div>

                <!-- SECCIÓN WYSIWYG PARA ESTIPULACIONES Y CLÁUSULAS -->
                <div class="form-group col-span-4" style="margin-top: 0.5rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                    <div style="display: flex; align-items: center; gap: 0.55rem;">
                      <div class="section-icon-box">📜</div>
                      <label class="form-label" style="font-weight: 700; color: #1e3a8a; margin: 0; font-size: 0.88rem;">
                        II. ESTIPULACIONES Y CLÁUSULAS CONTRACTUALES GENERALES (C.S.T.)
                      </label>
                    </div>
                    <button
                      type="button"
                      (click)="restablecerClausulasDefault()"
                      class="btn btn-sm btn-secondary"
                      style="font-size: 0.72rem; padding: 0.25rem 0.6rem;"
                      title="Restablecer cláusulas estándar de ley"
                    >
                      🔄 Cargar Cláusulas Estándar
                    </button>
                  </div>
                  <p style="font-size: 0.75rem; color: #64748b; margin: 0 0 0.5rem 0;">
                    Editor enriquecido (WYSIWYG): ajuste o redacte las estipulaciones particulares, funciones pedagógicas o cláusulas de ley que se imprimirán en la Minuta Oficial en PDF.
                  </p>
                  <quill-editor
                    [(ngModel)]="nuevoContrato.clausulas"
                    data-testid="editor-clausulas-contrato"
                    placeholder="Redacte o ajuste las cláusulas y estipulaciones contractuales..."
                    [styles]="{ height: '340px', backgroundColor: '#ffffff' }"
                  ></quill-editor>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button (click)="modalNuevoContrato.set(false)" class="btn btn-secondary">Cancelar</button>
              <button (click)="guardarNuevoContrato()" class="btn btn-primary shadow-glow">Guardar Contrato</button>
            </div>
          </div>
        </div>
      }

      <!-- 3. MODAL LIQUIDAR NÓMINA -->
      @if (modalLiquidarNomina()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <div class="header-icon-box" style="background: #fef3c7; border-color: #fde68a;">⚡</div>
                <div>
                  <h3>Liquidación Masiva de Nómina Mensual</h3>
                  <p class="modal-subtitle">Cálculo de deducciones de ley (Salud 4%, Pensión 4%) y auxilio de transporte</p>
                </div>
              </div>
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
              <div class="modal-title-wrap">
                <div class="header-icon-box">📄</div>
                <div>
                  <h3>Desprendible Oficial de Pago (Colilla)</h3>
                  <p class="modal-subtitle">Comprobante individual de liquidación salarial con deducciones de ley</p>
                </div>
              </div>
              <button (click)="modalVerColilla.set(false)" class="close-btn">&times;</button>
            </div>
            @if (colillaSeleccionada(); as colilla) {
              <div class="modal-body">
                <div class="colilla-header card mb-3">
                  <div class="flex-between">
                    <div>
                      <h4 class="font-bold text-slate-800">{{ getNombreNominaColaborador(colilla) }}</h4>
                      <span class="text-xs text-slate-500">Periodo: {{ colilla.mes }}/{{ colilla.anio }}</span>
                    </div>
                    <span class="badge badge-purple">{{ colilla.estado }}</span>
                  </div>
                </div>

                <div class="colilla-breakdown card">
                  <table class="w-full text-sm">
                    <tbody>
                      <tr class="border-b">
                        <td class="py-2 text-slate-600">Salario Básico:</td>
                        <td class="py-2 text-right font-mono font-semibold">\${{ colilla.salarioBasico | number:'1.0-0' }}</td>
                      </tr>
                      <tr class="border-b">
                        <td class="py-2 text-emerald-600">(+) Auxilio de Transporte:</td>
                        <td class="py-2 text-right font-mono font-semibold text-emerald-600">+\${{ colilla.auxilioTransporte | number:'1.0-0' }}</td>
                      </tr>
                      <tr class="border-b">
                        <td class="py-2 text-rose-600">(-) Deducción Salud (4%):</td>
                        <td class="py-2 text-right font-mono font-semibold text-rose-600">-\${{ colilla.deduccionSalud | number:'1.0-0' }}</td>
                      </tr>
                      <tr class="border-b">
                        <td class="py-2 text-rose-600">(-) Deducción Pensión (4%):</td>
                        <td class="py-2 text-right font-mono font-semibold text-rose-600">-\${{ colilla.deduccionPension | number:'1.0-0' }}</td>
                      </tr>
                      <tr class="border-t-2 font-bold text-base">
                        <td class="py-3 text-slate-900">Total Neto a Pagar:</td>
                        <td class="py-3 text-right font-mono text-indigo-700">\${{ colilla.netoAPagar | number:'1.0-0' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            }
            <div class="modal-footer">
              <button (click)="modalVerColilla.set(false)" class="btn btn-primary">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- 5. MODAL VER CONTRATO -->
      @if (modalVerContrato()) {
        <div class="modal-backdrop animate-fade-in" data-testid="modal-ver-contrato">
          <div class="modal-card" style="max-width: 700px;">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <div class="header-icon-box">📑</div>
                <div>
                  <h3>Minuta de Contrato Individual de Trabajo</h3>
                  <p class="modal-subtitle">Especificaciones particulares, asignación salarial y estipulaciones de ley</p>
                </div>
              </div>
              <button (click)="modalVerContrato.set(false)" class="close-btn">&times;</button>
            </div>
            @if (contratoSeleccionado(); as ctr) {
              <div class="modal-body">
                <!-- Header Card -->
                <div class="card mb-3" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 10px;">
                  <div class="flex-between">
                    <div>
                      <span class="text-xs font-bold text-indigo-600 font-mono">{{ ctr.numeroContrato }}</span>
                      <h4 class="font-bold text-slate-900 text-base" style="margin: 0.2rem 0;">{{ getNombreContratoColaborador(ctr) }}</h4>
                      <span class="text-xs text-slate-500">
                        {{ ctr.colaborador ? formatCargo(ctr.colaborador.cargo) : 'Docente Titular' }} &bull; {{ ctr.colaborador?.escalafonDocente || 'Docente Escalafonado' }}
                      </span>
                    </div>
                    <span class="status-pill status-activo">{{ ctr.estado }}</span>
                  </div>
                </div>

                <!-- Detalle Clave en Grid -->
                <div class="form-grid mb-3">
                  <div class="card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem;">
                    <span class="text-xs text-slate-500 font-semibold" style="display: block;">Vigencia del Contrato:</span>
                    <span class="font-semibold text-slate-800 text-sm">
                      {{ ctr.fechaInicio | date:'dd/MM/yyyy' }} &rarr; {{ ctr.fechaFin ? (ctr.fechaFin | date:'dd/MM/yyyy') : 'Término Indefinido' }}
                    </span>
                  </div>

                  <div class="card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem;">
                    <span class="text-xs text-slate-500 font-semibold" style="display: block;">Asignación Salarial Mensual:</span>
                    <span class="font-bold text-indigo-700 font-mono text-base">
                      \${{ ctr.salarioPactado | number:'1.0-0' }} COP
                    </span>
                  </div>

                  <div class="card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem;">
                    <span class="text-xs text-slate-500 font-semibold" style="display: block;">Tipo de Vinculación:</span>
                    <span class="font-semibold text-slate-800 text-sm">
                      {{ ctr.colaborador?.tipoVinculacion || 'TÉRMINO FIJO (AÑO LECTIVO)' }}
                    </span>
                  </div>

                  <div class="card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem;">
                    <span class="text-xs text-slate-500 font-semibold" style="display: block;">Dispersión Bancaria:</span>
                    <span class="font-mono text-xs text-slate-800">
                      {{ ctr.colaborador?.bancoNombre || 'Bancolombia' }} &bull; {{ ctr.colaborador?.numeroCuentaBanco || '102-948576-33' }}
                    </span>
                  </div>
                </div>

                <!-- Cláusulas Estatutarias / Estipulaciones del Contrato -->
                <div class="card" style="background: #f1f5f9; border-radius: 8px; padding: 0.85rem; font-size: 0.78rem; color: #334155; line-height: 1.5; max-height: 220px; overflow-y: auto;">
                  <div style="display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.4rem;">
                    <div class="section-icon-box">📜</div>
                    <h5 class="font-bold text-slate-800" style="margin: 0; font-size: 0.85rem;">
                      II. Estipulaciones y Cláusulas Contractuales (C.S.T.):
                    </h5>
                  </div>
                  @if (ctr.clausulas) {
                    <div [innerHTML]="ctr.clausulas" style="font-size: 0.78rem;"></div>
                  } @else {
                    <p style="margin: 0 0 0.35rem 0;"><strong>PRIMERA. Objeto:</strong> El TRABAJADOR prestará sus servicios como Docente conforme al PEI y la legislación educativa.</p>
                    <p style="margin: 0 0 0.35rem 0;"><strong>SEGUNDA. Remuneración:</strong> El EMPLEADOR pagará la asignación básica mensual pactada con las deducciones estatutarias (Salud 4%, Pensión 4%).</p>
                    <p style="margin: 0;"><strong>TERCERA. Afiliación:</strong> El EMPLEADOR garantiza la afiliación oportuna a Seguridad Social Integral (EPS, AFP, ARL) y Caja de Compensación.</p>
                  }
                </div>
              </div>
            }
            <div class="modal-footer">
              <button
                (click)="descargarContratoPdf(contratoSeleccionado()!)"
                class="btn btn-emerald"
                data-testid="btn-descargar-pdf-modal"
              >
                📄 Descargar Contrato en PDF
              </button>
              <button
                (click)="modalVerContrato.set(false)"
                class="btn btn-secondary"
                data-testid="btn-cerrar-ver-modal"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 6. MODAL EDITAR CONTRATO -->
      @if (modalEditarContrato()) {
        <div class="modal-backdrop animate-fade-in" data-testid="modal-editar-contrato">
          <div class="modal-card modal-card-xl">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <div class="header-icon-box">✏️</div>
                <div>
                  <h3>Modificar Términos de Contrato</h3>
                  <p class="modal-subtitle">Actualización de remuneración, vigencia y estipulaciones contractuales</p>
                </div>
              </div>
              <button (click)="modalEditarContrato.set(false)" class="close-btn">&times;</button>
            </div>
            @if (contratoEnEdicion(); as ctr) {
              <div class="modal-body">
                <div class="card mb-3" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.85rem; border-radius: 8px;">
                  <span class="font-mono text-xs font-bold text-indigo-600">{{ ctr.numeroContrato }}</span>
                  <h4 class="font-bold text-slate-800 text-sm" style="margin: 0.2rem 0;">{{ getNombreContratoColaborador(ctr) }}</h4>
                  <span class="text-xs text-slate-500">{{ ctr.colaborador ? formatCargo(ctr.colaborador.cargo) : 'Docente Titular' }}</span>
                </div>
                <div class="contract-form-grid">
                  <div class="form-group col-span-1">
                    <label class="form-label">Salario Mensual Pactado (COP):</label>
                    <input
                      type="text"
                      appCurrencyMask
                      class="form-control"
                      [(ngModel)]="formEditarContrato.salarioPactado"
                      data-testid="input-editar-salario"
                      placeholder="$ 3.800.000"
                    />
                  </div>
                  <div class="form-group col-span-1">
                    <label class="form-label">Estado del Contrato:</label>
                    <select
                      class="form-select"
                      [(ngModel)]="formEditarContrato.estado"
                      data-testid="select-editar-estado"
                    >
                      <option value="VIGENTE">VIGENTE</option>
                      <option value="SUSPENDIDO">SUSPENDIDO</option>
                      <option value="TERMINADO">TERMINADO</option>
                    </select>
                  </div>
                  <div class="form-group col-span-1">
                    <label class="form-label">Fecha de Inicio:</label>
                    <input
                      type="text"
                      appFlatpickr
                      class="form-control"
                      [(ngModel)]="formEditarContrato.fechaInicio"
                      data-testid="input-editar-fecha-inicio"
                      placeholder="dd/mm/aaaa"
                    />
                  </div>
                  <div class="form-group col-span-1">
                    <label class="form-label">Fecha de Finalización (opcional):</label>
                    <input
                      type="text"
                      appFlatpickr
                      [minDate]="formEditarContrato.fechaInicio"
                      class="form-control"
                      [(ngModel)]="formEditarContrato.fechaFin"
                      data-testid="input-editar-fecha-fin"
                      placeholder="dd/mm/aaaa"
                    />
                  </div>

                  <!-- SECCIÓN WYSIWYG PARA ESTIPULACIONES Y CLÁUSULAS EN EDICIÓN -->
                  <div class="form-group col-span-4" style="margin-top: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                      <div style="display: flex; align-items: center; gap: 0.55rem;">
                        <div class="section-icon-box">📜</div>
                        <label class="form-label" style="font-weight: 700; color: #1e3a8a; margin: 0; font-size: 0.88rem;">
                          II. ESTIPULACIONES Y CLÁUSULAS CONTRACTUALES GENERALES (C.S.T.)
                        </label>
                      </div>
                      <button
                        type="button"
                        (click)="restablecerClausulasEdicionDefault()"
                        class="btn btn-sm btn-secondary"
                        style="font-size: 0.72rem; padding: 0.25rem 0.6rem;"
                        title="Restablecer cláusulas estándar de ley"
                      >
                        🔄 Cargar Cláusulas Estándar
                      </button>
                    </div>
                    <p style="font-size: 0.75rem; color: #64748b; margin: 0 0 0.5rem 0;">
                      Editor enriquecido (WYSIWYG): ajuste o redacte las estipulaciones particulares que se imprimirán en la Minuta Oficial en PDF.
                    </p>
                    <quill-editor
                      [(ngModel)]="formEditarContrato.clausulas"
                      data-testid="editor-clausulas-editar-contrato"
                      placeholder="Redacte o ajuste las cláusulas y estipulaciones contractuales..."
                      [styles]="{ height: '340px', backgroundColor: '#ffffff' }"
                    ></quill-editor>
                  </div>
                </div>
              </div>
            }
            <div class="modal-footer">
              <button (click)="modalEditarContrato.set(false)" class="btn btn-secondary">Cancelar</button>
              <button
                (click)="guardarEdicionContrato()"
                class="btn btn-primary"
                data-testid="btn-guardar-edicion-contrato"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 7. MODAL TERMINAR CONTRATO -->
      @if (modalTerminarContrato()) {
        <div class="modal-backdrop animate-fade-in" data-testid="modal-terminar-contrato">
          <div class="modal-card" style="max-width: 480px;">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <div class="header-icon-box" style="background: #fef2f2; border-color: #fecaca; color: #dc2626;">🛑</div>
                <div>
                  <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #b91c1c;">Terminar Contrato Laboral</h3>
                  <p class="modal-subtitle">Cese de actividades o finalización de periodo lectivo</p>
                </div>
              </div>
              <button (click)="modalTerminarContrato.set(false)" class="close-btn">&times;</button>
            </div>
            @if (contratoATerminar(); as ctr) {
              <div class="modal-body">
                <p class="text-sm text-slate-700 mb-3">
                  ¿Está seguro de terminar el contrato laboral <strong class="font-mono text-indigo-700">{{ ctr.numeroContrato }}</strong> correspondiente a <strong>{{ getNombreContratoColaborador(ctr) }}</strong>?
                </p>
                <div class="card p-3 mb-3" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
                  <span class="text-xs text-red-700">
                    El estado del contrato cambiará a <strong>TERMINADO</strong>.
                  </span>
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">Motivo de Finalización:</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="motivoTerminacion"
                    placeholder="Vencimiento de términos pactados"
                    data-testid="input-motivo-terminacion"
                  />
                </div>
              </div>
            }
            <div class="modal-footer">
              <button (click)="modalTerminarContrato.set(false)" class="btn btn-secondary">Cancelar</button>
              <button
                (click)="ejecutarTerminarContrato()"
                class="btn btn-danger"
                data-testid="btn-confirmar-terminar-contrato"
              >
                Confirmar Terminación
              </button>
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
      align-items: center;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding: 0 0.25rem 0.5rem 0.25rem;
      margin-bottom: 1.25rem;
      overflow-x: auto;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.15rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      user-select: none;
    }

    .tab-btn:hover:not(:disabled) {
      color: #6366f1;
      background-color: #f8fafc;
    }

    .tab-btn.active {
      color: #6366f1;
      background-color: rgba(99, 102, 241, 0.08);
      border-bottom: 3px solid #6366f1;
      font-weight: 700;
    }

    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 0.45rem;
      background: #e2e8f0;
      color: #334155;
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 999px;
      line-height: 1;
      transition: all 0.2s ease;
    }

    .tab-btn.active .tab-badge {
      background: #6366f1;
      color: #ffffff;
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

    .btn-icon.btn-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border-color: rgba(239, 68, 68, 0.25);
    }

    .btn-icon.btn-danger:hover:not(:disabled) {
      background: #dc2626;
      color: #ffffff;
    }

    .btn-icon:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-danger {
      background: #dc2626;
      color: #ffffff;
      border: 1px solid #b91c1c;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    .status-pendiente {
      background: rgba(245, 158, 11, 0.15);
      color: #d97706;
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

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #eef2ff;
      border: 1px solid #e0e7ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .modal-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
    }

    .section-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
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

    .modal-card-xl {
      max-width: 1140px !important;
      width: 95% !important;
      max-height: 94vh;
    }

    .modal-card-xl .modal-body {
      max-height: 82vh;
    }

    .contract-form-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .col-span-1 { grid-column: span 1; }
    .col-span-2 { grid-column: span 2; }
    .col-span-4 { grid-column: span 4; }

    @media (max-width: 860px) {
      .contract-form-grid {
        grid-template-columns: 1fr 1fr;
      }
      .col-span-1 { grid-column: span 1; }
      .col-span-2 { grid-column: span 2; }
      .col-span-4 { grid-column: span 2; }
    }

    @media (max-width: 560px) {
      .contract-form-grid {
        grid-template-columns: 1fr;
      }
      .col-span-1, .col-span-2, .col-span-4 { grid-column: span 1; }
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
  readonly modalVerContrato = signal<boolean>(false);
  readonly contratoSeleccionado = signal<ContratoItem | null>(null);
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

  readonly CLAUSULAS_DEFAULT_TEMPLATE = `<p><strong>CLÁUSULA PRIMERA. OBJETO CONTRACTUAL:</strong> El EMPLEADOR contrata los servicios personales del TRABAJADOR para desempeñarse en el cargo asignado, comprometiéndose a cumplir con las actividades pedagógicas, curriculares, formativas y evaluativas conforme al Proyecto Educativo Institucional (PEI) y las directrices de Rectoría.</p>
<p><strong>CLÁUSULA SEGUNDA. OBLIGACIONES ESPECIALES DEL DOCENTE:</strong> El TRABAJADOR se compromete especialmente a: a) Planear, orientar y evaluar los procesos formativos y de aula según el Sistema Institucional de Evaluación de Estudiantes (SIEE - Decreto 1290 de 2009); b) Cumplir estrictamente el horario, jornadas pedagógicas y calendario escolar fijado por la Institución; c) Registrar de manera continua, oportuna y fidedigna calificaciones y asistencias en la plataforma EduCoreOS; d) Participar con diligencia en claustros, consejos académicos, comisiones de evaluación y proyectos transversales; e) Atender respetuosamente a padres de familia y acudientes en los horarios asignados; f) Custodiar adecuadamente los recursos educativos, herramientas didácticas y tecnológicas institucionales; g) Promover ambientes de sana convivencia escolar y aplicar la Ruta de Atención Integral (Ley 1620 de 2013).</p>
<p><strong>CLÁUSULA TERCERA. REMUNERACIÓN Y FORMA DE PAGO:</strong> El EMPLEADOR pagará al TRABAJADOR como contraprestación mensual directa por sus servicios la suma estipulada en las especificaciones particulares, mediante transferencia o consignación bancaria mensual en la cuenta registrada. De dicha suma el EMPLEADOR efectuará las deducciones legales obligatorias para los aportes a Seguridad Social Integral (Salud 4% y Pensión 4%, conforme a la Ley 100 de 1993) y demás retenciones tributarias o judiciales procedentes.</p>
<p><strong>CLÁUSULA CUARTA. SEGURIDAD SOCIAL INTEGRAL & PRESTACIONES:</strong> El EMPLEADOR garantizará la oportuna afiliación del TRABAJADOR al Sistema de Seguridad Social en Salud (EPS), Pensiones (AFP), Riesgos Laborales (ARL en nivel docente) y Caja de Compensación Familiar. Asimismo, liquidará y pagará las prestaciones sociales de ley (Cesantías, Intereses a las Cesantías, Prima de Servicios y Vacaciones reglamentarias del personal docente conforme a los Artículos 196 y subsiguientes del C.S.T.).</p>
<p><strong>CLÁUSULA QUINTA. JORNADA LABORAL Y LUGAR DE TRABAJO:</strong> El TRABAJADOR ejecutará sus labores en las sedes e instalaciones del EMPLEADOR, dentro de la jornada institucional ordinaria señalada en el Reglamento Interno de Trabajo y los horarios pedagógicos asignados por la Coordinación Académica.</p>
<p><strong>CLÁUSULA SEXTA. PERÍODO DE PRUEBA:</strong> Las partes acuerdan fijar como período de prueba el término de dos (2) meses (sin exceder la quinta parte del término pactado), según el Art. 78 del Código Sustantivo del Trabajo. Durante este lapso cualquiera de las partes podrá dar por terminado el contrato en cualquier momento, sin previo aviso y sin que cause pago de indemnización alguna.</p>
<p><strong>CLÁUSULA SÉPTIMA. DERECHOS DE AUTOR Y PROPIEDAD INTELECTUAL:</strong> Los planes de estudio, proyectos pedagógicos transversales, módulos didácticos, guías de trabajo y herramientas curriculares producidas por el TRABAJADOR en desarrollo y ejecución del presente contrato pertenecen patrimonialmente a la Institución Educativa conforme a la Ley 23 de 1982 y el Art. 28 de la Ley 1450 de 2011, respetando los derechos morales de autor.</p>
<p><strong>CLÁUSULA OCTAVA. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS (LEY 1581 DE 2012):</strong> El TRABAJADOR se compromete formalmente a salvaguardar bajo estricta reserva profesional toda la información personal, sensible, médica y académica de los estudiantes menores de edad, directivos y padres de familia a la que tenga acceso, en estricto acatamiento del Régimen General de Protección de Datos Personales (Ley 1581 de 2012 / SIC) y las políticas institucionales de Habeas Data.</p>
<p><strong>CLÁUSULA NOVENA. TERMINACIÓN DEL CONTRATO Y JUSTAS CAUSAS:</strong> El presente contrato terminará: a) Por la expiración del plazo pactado, mediando aviso escrito con una antelación no inferior a treinta (30) días calendario; b) Por mutuo consentimiento; c) Por las justas causas contempladas en el Artículo 62 del Código Sustantivo del Trabajo; d) Por falta gravísima calificada en el Manual de Convivencia Escolar o el Reglamento Interno de Trabajo.</p>
<p><strong>CLÁUSULA DÉCIMA. DOMICILIO Y MÉRITO EJECUTIVO:</strong> Para todos los efectos legales, procesales y de jurisdicción laboral ordinaria, las partes señalan como domicilio contractual la sede de la Institución Educativa. El presente contrato presta mérito ejecutivo para la exigibilidad de las obligaciones pecuniarias en él contenidas.</p>`;

  nuevoContrato = {
    colaboradorId: '',
    numeroContrato: '',
    fechaInicio: '2026-01-15',
    fechaFin: '2026-11-30',
    salarioPactado: 3800000,
    clausulas: ''
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

  // Modales y filtros adicionales de Contratos Laborales
  readonly modalEditarContrato = signal<boolean>(false);
  readonly modalTerminarContrato = signal<boolean>(false);
  readonly contratoEnEdicion = signal<ContratoItem | null>(null);
  readonly contratoATerminar = signal<ContratoItem | null>(null);

  filtroContratoTexto = '';
  filtroContratoEstado = 'TODOS';
  motivoTerminacion = 'Vencimiento de términos pactados (año lectivo)';

  formEditarContrato = {
    salarioPactado: 3800000,
    fechaInicio: '',
    fechaFin: '',
    estado: 'VIGENTE',
    clausulas: ''
  };

  // Contratos filtrados
  readonly contratosFiltrados = computed(() => {
    let list = this.contratos();
    const query = this.filtroContratoTexto.toLowerCase().trim();

    if (query) {
      list = list.filter(c => {
        const num = (c.numeroContrato || '').toLowerCase();
        const doc = this.getNombreContratoColaborador(c).toLowerCase();
        return num.includes(query) || doc.includes(query);
      });
    }

    if (this.filtroContratoEstado !== 'TODOS') {
      list = list.filter(c => c.estado === this.filtroContratoEstado);
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

  restablecerClausulasDefault() {
    this.nuevoContrato.clausulas = this.CLAUSULAS_DEFAULT_TEMPLATE;
    this.toast.info('Cláusulas estándar de ley cargadas en el editor');
  }

  restablecerClausulasEdicionDefault() {
    this.formEditarContrato.clausulas = this.CLAUSULAS_DEFAULT_TEMPLATE;
    this.toast.info('Cláusulas estándar de ley cargadas en el editor');
  }

  abrirModalNuevoContrato() {
    this.nuevoContrato.numeroContrato = `CTR-DOC-2026-${Date.now().toString().slice(-4)}`;
    if (this.colaboradores().length > 0) {
      this.nuevoContrato.colaboradorId = this.colaboradores()[0].id;
    }
    if (!this.nuevoContrato.clausulas) {
      this.nuevoContrato.clausulas = this.CLAUSULAS_DEFAULT_TEMPLATE;
    }
    this.modalNuevoContrato.set(true);
  }

  abrirModalNuevoContratoPara(col: ColaboradorItem) {
    this.nuevoContrato.colaboradorId = col.id;
    this.nuevoContrato.numeroContrato = `CTR-DOC-2026-${Date.now().toString().slice(-4)}`;
    if (!this.nuevoContrato.clausulas) {
      this.nuevoContrato.clausulas = this.CLAUSULAS_DEFAULT_TEMPLATE;
    }
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
    this.toast.info(`Ficha de ${this.getNombreCompleto(col)} (${this.formatCargo(col.cargo)})`);
  }

  verColillasColaborador(col: ColaboradorItem) {
    this.activeTab.set('nomina');
  }

  verDetalleContrato(ctr: ContratoItem) {
    this.contratoSeleccionado.set(ctr);
    this.modalVerContrato.set(true);
  }

  descargarContratoPdf(ctr: ContratoItem) {
    if (ctr.urlContratoPdf && !ctr.urlContratoPdf.includes('storage.educoreos.com')) {
      window.open(ctr.urlContratoPdf, '_blank');
    } else {
      const url = this.api.getPdfUrl(`contrato-laboral/${ctr.id}`);
      window.open(url, '_blank');
    }
    this.toast.success(`Descargando Contrato ${ctr.numeroContrato} en PDF`);
  }

  abrirModalEditarContrato(ctr: ContratoItem) {
    this.contratoEnEdicion.set(ctr);
    this.formEditarContrato = {
      salarioPactado: Number(ctr.salarioPactado),
      fechaInicio: ctr.fechaInicio,
      fechaFin: ctr.fechaFin || '',
      estado: ctr.estado,
      clausulas: ctr.clausulas || this.CLAUSULAS_DEFAULT_TEMPLATE
    };
    this.modalEditarContrato.set(true);
  }

  guardarEdicionContrato() {
    const ctr = this.contratoEnEdicion();
    if (!ctr) return;
    this.api.put<ContratoItem>(`rrhh/contratos/${ctr.id}`, this.formEditarContrato).subscribe({
      next: () => {
        this.toast.success(`Contrato ${ctr.numeroContrato} actualizado exitosamente`);
        this.modalEditarContrato.set(false);
        this.contratoEnEdicion.set(null);
        this.cargarContratos();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al actualizar contrato')
    });
  }

  confirmarTerminarContrato(ctr: ContratoItem) {
    if (ctr.estado === 'TERMINADO') {
      this.toast.info('Este contrato ya se encuentra finalizado/terminado.');
      return;
    }
    this.contratoATerminar.set(ctr);
    this.motivoTerminacion = 'Vencimiento de términos pactados (año lectivo)';
    this.modalTerminarContrato.set(true);
  }

  ejecutarTerminarContrato() {
    const ctr = this.contratoATerminar();
    if (!ctr) return;
    this.api.delete(`rrhh/contratos/${ctr.id}`).subscribe({
      next: () => {
        this.toast.success(`Contrato ${ctr.numeroContrato} terminado exitosamente`);
        this.modalTerminarContrato.set(false);
        this.contratoATerminar.set(null);
        this.cargarContratos();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al terminar contrato')
    });
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

  setTab(tab: 'colaboradores' | 'contratos' | 'nomina' | 'dian') {
    this.activeTab.set(tab);
  }

  formatCargo(cargo: string): string {
    return getFormattedCargo(cargo);
  }
}

function getFormattedCargo(cargo: string): string {
  switch (cargo) {
    case 'DOCENTE_TITULAR': return 'Docente Titular';
    case 'DOCENTE_CATEDRA': return 'Docente Cátedra';
    case 'COORDINADOR': return 'Coordinador Académico';
    case 'ORIENTADOR': return 'Orientador Escolar';
    case 'ADMINISTRATIVO': return 'Personal Administrativo';
    default: return cargo || 'Colaborador';
  }
}
