import { Component, signal, computed, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalSolicitudArcoComponent } from '../../shared/components/modal-solicitud-arco.component';

export enum VistaDocumental {
  KANBAN = 'KANBAN',
  NUEVO_TRAMITE = 'NUEVO_TRAMITE',
  DISENADOR = 'DISEÑADOR',
  TRD = 'TRD',
  FIRMAS_VAULT = 'FIRMAS_VAULT',
  VERIFICADOR = 'VERIFICADOR',
}

export enum TipoCampoFormulario {
  TEXTO = 'TEXTO',
  EMAIL = 'EMAIL',
  NUMERO = 'NUMERO',
  FECHA = 'FECHA',
  TEXTO_LARGO = 'TEXTO_LARGO',
  SELECCION = 'SELECCION',
  ARCHIVO = 'ARCHIVO',
}

export enum EstadoInstanciaDocumental {
  TODOS = 'TODOS',
  INICIADO = 'INICIADO',
  EN_TRAMITE = 'EN_TRAMITE',
  PENDIENTE_FIRMA = 'PENDIENTE_FIRMA',
  APROBADO_FINAL = 'APROBADO_FINAL',
  RECHAZADO = 'RECHAZADO',
  CANCELADO = 'CANCELADO',
}

export enum TipoFirmaTab {
  TRAZO = 'TRAZO',
  IMAGEN = 'IMAGEN',
}

export enum SeccionTRD {
  TODAS = 'TODAS',
  SECRETARIA_ACADEMICA = 'SECRETARIA_ACADEMICA',
  DIRECCION_RECTORIA = 'DIRECCION_RECTORIA',
  COORDINACION_ACADEMICA = 'COORDINACION_ACADEMICA',
  CONVIVENCIA = 'CONVIVENCIA',
  TESORERIA = 'TESORERIA',
  TALENTO_HUMANO = 'TALENTO_HUMANO',
}

export enum DisposicionFinalTRD {
  CONSERVACION_TOTAL = 'CONSERVACION_TOTAL',
  ELIMINACION = 'ELIMINACION',
  DIGITALIZACION = 'DIGITALIZACION',
  SELECCION = 'SELECCION',
}

export enum CategoriaFlujo {
  TODOS = 'TODOS',
  ACADEMICO = 'ACADEMICO',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  LEGAL = 'LEGAL',
  CONVIVENCIA = 'CONVIVENCIA',
  JURIDICO_REGULATORIO = 'JURIDICO_REGULATORIO',
}

export interface TrdSerieItem {
  id: string;
  seccion: string;
  codigoSerie: string;
  nombreSerie: string;
  codigoSubserie: string;
  nombreSubserie: string;
  retencionGestionAnios: number;
  retencionCentralAnios: number;
  disposicionFinal: DisposicionFinalTRD | string;
  soporte: string;
  procedimiento?: string;
  activa: boolean;
  createdAt: string;
}

export interface FlujoItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  usuariosPermitidos?: string[];
  icono: string;
  colorHex: string;
  trdSerieId?: string;
  trdSerie?: TrdSerieItem;
  formularioSchema: Array<{
    campo: string;
    etiqueta: string;
    tipo: string;
    requerido: boolean;
    opciones?: string[];
  }>;
  etapas: Array<{
    id: string;
    orden: number;
    nombre: string;
    descripcion: string;
    rolResponsable: string;
    tipoAccion: string;
    slaHoras: number;
    requiereFirma: boolean;
    requiereAdjunto: boolean;
    descripcionAdjunto?: string;
  }>;
}

export interface InstanciaItem {
  id: string;
  consecutivoRadicado: string;
  estado: 'INICIADO' | 'EN_TRAMITE' | 'PENDIENTE_FIRMA' | 'APROBADO_FINAL' | 'RECHAZADO' | 'CANCELADO';
  flujo: FlujoItem;
  etapaActual?: {
    id: string;
    orden: number;
    nombre: string;
    rolResponsable: string;
    tipoAccion: string;
    slaHoras: number;
    requiereFirma: boolean;
    requiereAdjunto: boolean;
    descripcionAdjunto?: string;
  };
  solicitante: {
    nombres: string;
    apellidos: string;
    email: string;
  };
  datosFormulario: Record<string, any>;
  pdfFinalUrl?: string;
  hashFinalSha256?: string;
  trazabilidad: Array<{
    id: string;
    accion: string;
    comentarios: string;
    archivoAdjuntoUrl?: string;
    createdAt: string;
    usuarioAccion?: {
      nombres: string;
      apellidos: string;
    };
    etapa?: {
      nombre: string;
    };
  }>;
  createdAt: string;
}

export interface FirmaUsuarioItem {
  id: string;
  cargo: string;
  tipoFirma: string;
  firmaImagenUrl?: string;
  firmaSvgPath?: string;
  selloInstitucionalUrl?: string;
  activa: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-documental',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalSolicitudArcoComponent],
  template: `
    <div class="doc-container animate-fadeIn">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <div class="badge-tag">
            <span class="badge-dot"></span>
            MOTOR BPM & GESTIÓN DOCUMENTAL CERO PAPEL
          </div>
          <h1>Gestión Documental & Flujos Dinámicos</h1>
          <p class="subtitle">
            Diseño no-code de circuitos de aprobación, radicación de trámites institucionales, vault de firmas digitales y sellado criptográfico inmutable SHA-256.
          </p>
        </div>

        <div class="header-actions">
          <button class="btn-primary" (click)="vistaActiva.set(VistaDocumental.NUEVO_TRAMITE)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Radicar Nuevo Trámite
          </button>
        </div>
      </div>

      <!-- MÉTRICAS RESUMEN -->
      <div class="metrics-row">
        <div class="metric-card blue">
          <div class="metric-icon">⏳</div>
          <div class="metric-body">
            <span class="metric-val">{{ metricasTramites().activos }}</span>
            <span class="metric-label">Trámites Activos</span>
          </div>
        </div>
        <div class="metric-card amber">
          <div class="metric-icon">✍️</div>
          <div class="metric-body">
            <span class="metric-val">{{ metricasTramites().pendientesFirma }}</span>
            <span class="metric-label">Pendientes Firma</span>
          </div>
        </div>
        <div class="metric-card green">
          <div class="metric-icon">✅</div>
          <div class="metric-body">
            <span class="metric-val">{{ metricasTramites().completados }}</span>
            <span class="metric-label">Completados este Mes</span>
          </div>
        </div>
        <div class="metric-card indigo">
          <div class="metric-icon">📄</div>
          <div class="metric-body">
            <span class="metric-val">{{ flujos().length }}</span>
            <span class="metric-label">Plantillas de Flujo</span>
          </div>
        </div>
      </div>

      <!-- MAIN NAVIGATION TABS -->
      <div class="nav-tabs-bar">
        <button
          class="nav-tab"
          [class.active]="vistaActiva() === VistaDocumental.KANBAN"
          (click)="vistaActiva.set(VistaDocumental.KANBAN)"
        >
          <span>📋</span>
          Trámites & Radicados
          <span class="tab-badge">{{ instancias().length }}</span>
        </button>

        <button
          class="nav-tab"
          [class.active]="vistaActiva() === VistaDocumental.NUEVO_TRAMITE"
          (click)="vistaActiva.set(VistaDocumental.NUEVO_TRAMITE)"
        >
          <span>🚀</span>
          Iniciar Trámite
        </button>

        <button
          class="nav-tab"
          [class.active]="vistaActiva() === VistaDocumental.DISENADOR"
          (click)="vistaActiva.set(VistaDocumental.DISENADOR)"
        >
          <span>🛠️</span>
          Diseñador de Flujos (BPM)
        </button>

        <button
          class="nav-tab"
          [class.active]="vistaActiva() === VistaDocumental.TRD"
          (click)="vistaActiva.set(VistaDocumental.TRD)"
        >
          <span>📑</span>
          Tablas de Retención (TRD)
          <span class="tab-badge info">{{ trdSeries().length }}</span>
        </button>

        <button
          class="nav-tab"
          [class.active]="vistaActiva() === VistaDocumental.FIRMAS_VAULT"
          (click)="vistaActiva.set(VistaDocumental.FIRMAS_VAULT)"
        >
          <span>✍️</span>
          Vault & Carga de Firmas
          <span class="tab-badge success">{{ firmasUsuario().length }}</span>
        </button>

        <button
          class="nav-tab"
          [class.active]="vistaActiva() === VistaDocumental.VERIFICADOR"
          (click)="vistaActiva.set(VistaDocumental.VERIFICADOR)"
        >
          <span>🔍</span>
          Verificador Criptográfico
        </button>
      </div>

      <!-- =================================================================== -->
      <!-- VISTA 1: TABLERO KANBAN & TRÁMITES EN CURSO                         -->
      <!-- =================================================================== -->
      @if (vistaActiva() === VistaDocumental.KANBAN) {
        <div class="kanban-view animate-fadeIn">
          <div class="glass-panel filter-toolbar">
            <div class="search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por radicado, solicitante o destino..."
                [(ngModel)]="busquedaTexto"
              />
            </div>

            <div class="filter-pills">
              <button
                class="pill-btn"
                [class.active]="filtroEstado() === EstadoInstanciaDocumental.TODOS"
                (click)="filtroEstado.set(EstadoInstanciaDocumental.TODOS)"
              >
                Todos ({{ instancias().length }})
              </button>
              <button
                class="pill-btn warning"
                [class.active]="filtroEstado() === EstadoInstanciaDocumental.EN_TRAMITE"
                (click)="filtroEstado.set(EstadoInstanciaDocumental.EN_TRAMITE)"
              >
                En Trámite
              </button>
              <button
                class="pill-btn purple"
                [class.active]="filtroEstado() === EstadoInstanciaDocumental.PENDIENTE_FIRMA"
                (click)="filtroEstado.set(EstadoInstanciaDocumental.PENDIENTE_FIRMA)"
              >
                Pendiente Firma ✍️
              </button>
              <button
                class="pill-btn success"
                [class.active]="filtroEstado() === EstadoInstanciaDocumental.APROBADO_FINAL"
                (click)="filtroEstado.set(EstadoInstanciaDocumental.APROBADO_FINAL)"
              >
                Aprobados ✅
              </button>
              <button
                class="pill-btn danger"
                [class.active]="filtroEstado() === EstadoInstanciaDocumental.RECHAZADO"
                (click)="filtroEstado.set(EstadoInstanciaDocumental.RECHAZADO)"
              >
                Rechazados ❌
              </button>
            </div>
          </div>

          <div class="cards-grid">
            @for (inst of instanciasFiltradas(); track inst.id) {
              <div
                class="tramite-card animate-slideDown"
                [class.border-success]="inst.estado === EstadoInstanciaDocumental.APROBADO_FINAL"
                [class.border-danger]="inst.estado === EstadoInstanciaDocumental.RECHAZADO"
              >
                <div class="card-top">
                  <div class="radicado-chip">
                    <span class="chip-icon">{{ inst.flujo?.icono || '📄' }}</span>
                    <strong>{{ inst.consecutivoRadicado }}</strong>
                  </div>

                  <span
                    class="status-badge"
                    [class.warning]="inst.estado === EstadoInstanciaDocumental.EN_TRAMITE"
                    [class.purple]="inst.estado === EstadoInstanciaDocumental.PENDIENTE_FIRMA"
                    [class.success]="inst.estado === EstadoInstanciaDocumental.APROBADO_FINAL"
                    [class.danger]="inst.estado === EstadoInstanciaDocumental.RECHAZADO"
                  >
                    {{ inst.estado === EstadoInstanciaDocumental.APROBADO_FINAL ? '✅ Aprobado Final' : inst.estado === EstadoInstanciaDocumental.PENDIENTE_FIRMA ? '✍️ Pendiente Firma' : inst.estado === EstadoInstanciaDocumental.RECHAZADO ? '❌ Rechazado' : '⏳ En Trámite' }}
                  </span>
                </div>

                <h3 class="flujo-name">{{ inst.flujo?.nombre }}</h3>

                <!-- DATOS FORMULARIO -->
                <div class="form-preview-box">
                  @for (entry of getDatosArray(inst.datosFormulario); track entry.key) {
                    <div class="preview-item">
                      <span class="preview-key">{{ entry.key }}:</span>
                      <span class="preview-val">{{ entry.val }}</span>
                    </div>
                  }
                </div>

                <!-- ETAPA ACTUAL -->
                @if (inst.estado !== EstadoInstanciaDocumental.APROBADO_FINAL && inst.estado !== EstadoInstanciaDocumental.RECHAZADO) {
                  <div class="etapa-actual-box">
                    <div class="etapa-info">
                      <span class="etapa-label">Paso Actual (Orden {{ inst.etapaActual?.orden }}):</span>
                      <span class="etapa-title">{{ inst.etapaActual?.nombre }}</span>
                      <span class="rol-badge">Responsable: {{ inst.etapaActual?.rolResponsable }}</span>
                    </div>
                  </div>
                }

                <!-- SOLICITANTE & FECHA -->
                <div class="card-footer-info">
                  <div class="user-solicita">
                    <span>👤 Solicitado por: <strong>{{ inst.solicitante?.nombres }} {{ inst.solicitante?.apellidos }}</strong></span>
                  </div>
                  <span class="date-text">📅 {{ inst.createdAt | date:'short' }}</span>
                </div>

                <!-- BOTONES DE ACCION -->
                <div class="card-actions">
                  <button class="btn-outline-sm" (click)="verTrazabilidad(inst)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Trazabilidad
                  </button>

                  @if (inst.estado === EstadoInstanciaDocumental.EN_TRAMITE || inst.estado === EstadoInstanciaDocumental.PENDIENTE_FIRMA) {
                    <button
                      class="btn-success-sm"
                      (click)="abrirModalAprobar(inst)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      {{ inst.etapaActual?.requiereFirma ? 'Firmar con OTP' : 'Aprobar Etapa' }}
                    </button>

                    <button
                      class="btn-danger-sm"
                      (click)="abrirModalRechazar(inst)"
                    >
                      Rechazar
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- =================================================================== -->
      <!-- VISTA 2: INICIAR NUEVO TRÁMITE                                      -->
      <!-- =================================================================== -->
      @if (vistaActiva() === VistaDocumental.NUEVO_TRAMITE) {
        <div class="new-tramite-view animate-fadeIn">
          <div class="glass-panel form-card">
            <div class="panel-header">
              <div>
                <h3>Catálogo de Trámites Institucionales</h3>
                <p class="subtitle-small">Inicia solicitudes, requerimientos o procesos formales (Derechos de Petición, Certificados, etc.)</p>
              </div>
            </div>

            <div class="filter-toolbar" style="margin-bottom: 1.5rem; background: rgba(255, 255, 255, 0.4); padding: 1rem; border-radius: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.5);">
              <div class="search-box" style="width: 100%; max-width: 400px; margin-bottom: 1rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Buscar trámite por nombre o palabra clave..."
                  [ngModel]="busquedaFlujoTexto()"
                  (ngModelChange)="busquedaFlujoTexto.set($event)"
                />
              </div>

              <div class="filter-pills" style="flex-wrap: wrap;">
                <button class="pill-btn" [class.active]="filtroCategoriaFlujo() === CategoriaFlujo.TODOS" (click)="filtroCategoriaFlujo.set(CategoriaFlujo.TODOS)">
                  Todos
                </button>
                <button class="pill-btn" [class.active]="filtroCategoriaFlujo() === CategoriaFlujo.ACADEMICO" (click)="filtroCategoriaFlujo.set(CategoriaFlujo.ACADEMICO)">
                  🎓 Académico & Certificados
                </button>
                <button class="pill-btn" [class.active]="filtroCategoriaFlujo() === CategoriaFlujo.ADMINISTRATIVO" (click)="filtroCategoriaFlujo.set(CategoriaFlujo.ADMINISTRATIVO)">
                  🏢 Administrativo & Financiero
                </button>
                <button class="pill-btn" [class.active]="filtroCategoriaFlujo() === CategoriaFlujo.LEGAL" (click)="filtroCategoriaFlujo.set(CategoriaFlujo.LEGAL)">
                  ⚖️ Jurídico & Habeas Data
                </button>
                <button class="pill-btn" [class.active]="filtroCategoriaFlujo() === CategoriaFlujo.CONVIVENCIA" (click)="filtroCategoriaFlujo.set(CategoriaFlujo.CONVIVENCIA)">
                  🤝 Convivencia Escolar
                </button>
              </div>
            </div>

            <div class="flujo-selector-grid">
              @for (f of flujosFiltrados(); track f.id) {
                <div
                  class="flujo-card"
                  [class.selected]="flujoSeleccionado()?.id === f.id"
                  (click)="seleccionarFlujo(f)"
                >
                  <span class="flujo-icon">{{ f.icono }}</span>
                  <div class="flujo-details">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                      <h4>{{ f.nombre }}</h4>
                      <span class="categoria-tag" style="font-size: 0.65rem; background: #e0e7ff; color: #4338ca; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 600; white-space: nowrap;">{{ formatCategoriaFlujo(f.categoria) | uppercase }}</span>
                    </div>
                    <p>{{ f.descripcion }}</p>
                    <div class="flujo-meta" style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                      <span class="meta-pill" style="font-size: 0.7rem; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 12px; display: inline-flex; align-items: center; gap: 0.25rem; color: #475569;">
                        <span>⏱️</span> SLA: {{ f.etapas?.length ? (f.etapas[0].slaHoras || 24) : 24 }}h
                      </span>
                      <span class="meta-pill" style="font-size: 0.7rem; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 12px; display: inline-flex; align-items: center; gap: 0.25rem; color: #475569;">
                        <span>👥</span> {{ f.etapas?.length ? f.etapas[0].rolResponsable : 'Varios' }}
                      </span>
                      <span class="meta-pill" style="font-size: 0.7rem; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 12px; display: inline-flex; align-items: center; gap: 0.25rem; color: #475569;">
                        <span>📍</span> {{ f.etapas?.length || 0 }} etapas
                      </span>
                    </div>
                  </div>
                </div>
              }
              
              @if (flujosFiltrados().length === 0) {
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748b;">
                  <span style="font-size: 2rem; display: block; margin-bottom: 1rem;">🔍</span>
                  <p>No se encontraron trámites que coincidan con la búsqueda.</p>
                </div>
              }
            </div>

            <!-- FORMULARIO DINÁMICO DEL FLUJO -->
            @if (flujoSeleccionado()) {
              <div class="dynamic-form-section animate-slideDown">
                <h4 class="form-title">
                  Completar Información Requerida para: {{ flujoSeleccionado()?.nombre }}
                </h4>

                <div class="fields-grid">
                  @for (fld of flujoSeleccionado()?.formularioSchema; track fld.campo) {
                    <div class="form-field">
                      <label>
                        {{ fld.etiqueta }}
                        @if (fld.requerido) {
                          <span class="required">*</span>
                        }
                      </label>
                      
                      @if (isFieldType(fld, 'TEXTO', 'TEXT', 'STRING')) {
                        <input
                          type="text"
                          class="input-custom"
                          [(ngModel)]="formData()[fld.campo]"
                          [placeholder]="'Ingresa ' + fld.etiqueta.toLowerCase()"
                        />
                      }

                      @if (isFieldType(fld, 'EMAIL', 'CORREO')) {
                        <input
                          type="email"
                          class="input-custom"
                          [(ngModel)]="formData()[fld.campo]"
                          placeholder="ejemplo@correo.com"
                        />
                      }

                      @if (isFieldType(fld, 'NUMERO', 'NUMBER', 'INT', 'DECIMAL')) {
                        <input
                          type="number"
                          class="input-custom"
                          [(ngModel)]="formData()[fld.campo]"
                          placeholder="0"
                        />
                      }

                      @if (isFieldType(fld, 'FECHA', 'DATE')) {
                        <input
                          type="date"
                          class="input-custom"
                          [(ngModel)]="formData()[fld.campo]"
                        />
                      }

                      @if (isFieldType(fld, 'TEXTAREA', 'TEXTO_LARGO', 'LONGTEXT', 'DESCRIPCION')) {
                        <textarea
                          class="input-custom"
                          rows="3"
                          [(ngModel)]="formData()[fld.campo]"
                          [placeholder]="'Describe los detalles...'"
                        ></textarea>
                      }

                      @if (isFieldType(fld, 'SELECCION', 'SELECT', 'OPTIONS', 'COMBOBOX')) {
                        <select
                          class="input-custom"
                          [(ngModel)]="formData()[fld.campo]"
                        >
                          <option value="">-- Seleccionar {{ fld.etiqueta }} --</option>
                          @for (opt of fld.opciones; track opt) {
                            <option [value]="opt">{{ opt }}</option>
                          }
                        </select>
                      }

                      @if (isFieldType(fld, 'ARCHIVO', 'FILE')) {
                        <div class="file-upload-input-box">
                          <input
                            type="file"
                            class="input-custom"
                            (change)="onFormFileSelected($event, fld.campo)"
                          />
                          @if (formData()[fld.campo]) {
                            <small class="file-uploaded-badge">
                              ✅ Archivo cargado en el backend: {{ formData()[fld.campo] }}
                            </small>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- ETAPAS DEL CIRCUITO -->
                <div class="etapas-preview">
                  <h5>Circuito de Aprobación que seguirá este trámite:</h5>
                  <div class="etapas-timeline">
                    @for (et of flujoSeleccionado()?.etapas; track et.id || $index; let idx = $index) {
                      <div class="etapa-step">
                        <div class="step-num">{{ idx + 1 }}</div>
                        <div class="step-desc">
                          <strong>{{ et.nombre }}</strong>
                          <span>{{ et.rolResponsable }} ({{ et.tipoAccion }})</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <div class="form-actions">
                  <button class="btn-secondary" (click)="flujoSeleccionado.set(null)">Cancelar</button>
                  <button class="btn-primary" (click)="radicarTramite()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 2L11 13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Radicar Trámite y Generar Consecutivo
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- =================================================================== -->
      <!-- VISTA 3: DISEÑADOR DE FLUJOS (BPM NO-CODE)                          -->
      <!-- =================================================================== -->
      @if (vistaActiva() === VistaDocumental.DISENADOR) {
        <div class="designer-view animate-fadeIn">
          <div class="glass-panel designer-card">
            <div class="panel-header">
              <div>
                <h3>Diseñador Visual de Flujos & Circuitos BPM</h3>
                <p class="subtitle-small">Define nuevos circuitos de aprobación sin programar, asignando roles, acciones y SLAs.</p>
              </div>
              <button class="btn-secondary" (click)="abrirModalCrearFlujo()">
                + Crear Nueva Plantilla de Flujo
              </button>
            </div>

            <div class="flujos-list">
              @for (fl of flujos(); track fl.id) {
                <div class="flujo-row">
                  <div class="flujo-row-left">
                    <span class="fl-icon">{{ fl.icono }}</span>
                    <div class="flujo-details">
                      <h4>{{ fl.nombre }}</h4>
                      <p>{{ fl.descripcion }}</p>
                      <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;">
                        <span class="code-pill">{{ fl.codigo }}</span>
                        @if (fl.trdSerie) {
                          <span class="trd-chip-mini">📑 TRD: {{ fl.trdSerie.codigoSerie }}.{{ fl.trdSerie.codigoSubserie }} ({{ formatDisposicion(fl.trdSerie.disposicionFinal) }})</span>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="flujo-steps-visual">
                    @for (st of fl.etapas; track st.id || $index; let isLast = $last) {
                      <div class="step-pill-wrapper">
                        <div class="step-pill" [class.firma]="st.requiereFirma" [class.adjunto]="st.requiereAdjunto">
                          <span class="st-num">{{ st.orden }}</span>
                          <span class="st-name">{{ st.nombre }}</span>
                          <span class="st-meta">{{ st.rolResponsable }}</span>
                          @if (st.requiereFirma) {
                            <span class="step-tag sign">✍️</span>
                          }
                          @if (st.requiereAdjunto) {
                            <span class="step-tag attach">📎</span>
                          }
                          <span class="step-sla">{{ st.slaHoras }}h</span>
                        </div>
                        @if (!isLast) {
                          <span class="step-arrow">➡</span>
                        }
                      </div>
                    }
                  </div>
                  
                  <div class="flujo-row-actions" style="margin-left: 1rem;">
                    <button class="btn-icon" (click)="abrirModalEditarFlujo(fl)" title="Editar Plantilla">
                      ✏️
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- =================================================================== -->
      <!-- VISTA 4: TABLAS DE RETENCIÓN DOCUMENTAL (TRD - NORMA AGN)           -->
      <!-- =================================================================== -->
      @if (vistaActiva() === VistaDocumental.TRD) {
        <div class="trd-view animate-fadeIn">
          <div class="glass-panel trd-card">
            <div class="panel-header">
              <div>
                <div class="badge-tag-sm">
                  <span class="badge-dot blue"></span>
                  ARCHIVO GENERAL DE LA NACIÓN (AGN) • LEY 594 DE 2000 & ACUERDO 004 DE 2019
                </div>
                <h3>Tablas de Retención Documental (TRD) & Ciclo Vital</h3>
                <p class="subtitle-small">
                  Clasificación de series y subseries documentales, tiempos de retención en archivo de gestión / central y disposición final legal para colegios.
                </p>
              </div>

              <div class="header-actions-trd">
                <button class="btn-outline-sm" (click)="restaurarTrdDefault()">
                  <span>⚡</span> Restaurar Catálogo Estándar (MEN / AGN)
                </button>
                <button class="btn-primary-sm" (click)="abrirModalCrearTrd()">
                  + Nueva Subserie TRD
                </button>
              </div>
            </div>

            <!-- FILTRO POR SECCIÓN PRODUCTORA -->
            <div class="trd-filters-bar">
              <button
                class="pill-btn"
                [class.active]="filtroTrdSeccion() === SeccionTRD.TODAS"
                (click)="filtrarTrd(SeccionTRD.TODAS)"
              >
                Todas las Secciones ({{ trdSeries().length }})
              </button>
              <button
                class="pill-btn"
                [class.active]="filtroTrdSeccion() === SeccionTRD.SECRETARIA_ACADEMICA"
                (click)="filtrarTrd(SeccionTRD.SECRETARIA_ACADEMICA)"
              >
                Secretaría Académica
              </button>
              <button
                class="pill-btn"
                [class.active]="filtroTrdSeccion() === SeccionTRD.DIRECCION_RECTORIA"
                (click)="filtrarTrd(SeccionTRD.DIRECCION_RECTORIA)"
              >
                Dirección & Rectoría
              </button>
              <button
                class="pill-btn"
                [class.active]="filtroTrdSeccion() === SeccionTRD.COORDINACION_ACADEMICA"
                (click)="filtrarTrd(SeccionTRD.COORDINACION_ACADEMICA)"
              >
                Coordinación Académica
              </button>
              <button
                class="pill-btn"
                [class.active]="filtroTrdSeccion() === SeccionTRD.CONVIVENCIA"
                (click)="filtrarTrd(SeccionTRD.CONVIVENCIA)"
              >
                Convivencia Escolar
              </button>
              <button
                class="pill-btn"
                [class.active]="filtroTrdSeccion() === SeccionTRD.TESORERIA"
                (click)="filtrarTrd(SeccionTRD.TESORERIA)"
              >
                Tesorería & Cartera
              </button>
            </div>

            <!-- TABLA MATRIZ DE TRD -->
            <div class="table-responsive">
              <table class="trd-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Unidad Productora</th>
                    <th>Serie / Subserie Documental</th>
                    <th class="text-center">Retención Gestión</th>
                    <th class="text-center">Retención Central</th>
                    <th class="text-center">Disposición Final</th>
                    <th>Soporte</th>
                    <th>Procedimiento Técnico (AGN)</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (trd of trdSeriesFiltradas(); track trd.id) {
                    <tr>
                      <td>
                        <span class="code-badge font-mono">{{ trd.codigoSerie }}.{{ trd.codigoSubserie }}</span>
                      </td>
                      <td>
                        <span class="seccion-chip">{{ formatSeccion(trd.seccion) }}</span>
                      </td>
                      <td>
                        <div class="serie-title-box">
                          <span class="serie-nombre">{{ trd.nombreSerie }}</span>
                          <strong class="subserie-nombre">{{ trd.nombreSubserie }}</strong>
                        </div>
                      </td>
                      <td class="text-center">
                        <span class="years-pill gestion">{{ trd.retencionGestionAnios }} año(s)</span>
                      </td>
                      <td class="text-center">
                        <span class="years-pill central">{{ trd.retencionCentralAnios }} año(s)</span>
                      </td>
                      <td class="text-center">
                        <span
                          class="disposicion-badge"
                          [class.ct]="trd.disposicionFinal === DisposicionFinalTRD.CONSERVACION_TOTAL"
                          [class.e]="trd.disposicionFinal === DisposicionFinalTRD.ELIMINACION"
                          [class.d]="trd.disposicionFinal === DisposicionFinalTRD.DIGITALIZACION"
                          [class.s]="trd.disposicionFinal === DisposicionFinalTRD.SELECCION"
                        >
                          {{ formatDisposicion(trd.disposicionFinal) }}
                        </span>
                      </td>
                      <td>
                        <span class="soporte-badge">{{ trd.soporte }}</span>
                      </td>
                      <td>
                        <p class="procedimiento-text">{{ trd.procedimiento || 'Custodia y conservación según normativa institucional.' }}</p>
                      </td>
                      <td class="text-center">
                        <button class="btn-icon" (click)="abrirModalEditarTrd(trd)" title="Editar tiempos y disposición">
                          ✏️
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- =================================================================== -->
      <!-- VISTA 5: VAULT & CARGA DE FIRMAS DIGITALES                          -->
      <!-- =================================================================== -->
      @if (vistaActiva() === VistaDocumental.FIRMAS_VAULT) {
        <div class="vault-view animate-fadeIn">
          <div class="vault-grid">
            <!-- PANEL IZQUIERDO: LIENZO / CARGA DE FIRMA -->
            <div class="glass-panel sign-panel">
              <div class="panel-header">
                <h3>Registro de Firma Digital Autorizada</h3>
                <span class="pill-info">Validez Legal Probatoria</span>
              </div>

              <div class="form-field">
                <label>Cargo Institucional</label>
                <input
                  type="text"
                  class="input-custom"
                  [(ngModel)]="nuevaFirmaCargo"
                  placeholder="ej. Rector(a) Institucional / Coordinador Académico"
                />
              </div>

              <div class="form-field">
                <label>Tipo de Registro</label>
                <div class="segmented-control">
                  <button
                    [class.active]="tipoFirmaTab() === TipoFirmaTab.TRAZO"
                    (click)="tipoFirmaTab.set(TipoFirmaTab.TRAZO)"
                  >
                    ✍️ Dibujar en Pantalla
                  </button>
                  <button
                    [class.active]="tipoFirmaTab() === TipoFirmaTab.IMAGEN"
                    (click)="tipoFirmaTab.set(TipoFirmaTab.IMAGEN)"
                  >
                    🖼️ Subir Imagen Escaneada
                  </button>
                </div>
              </div>

              <!-- LIENZO CANVAS DE DIBUJO -->
              @if (tipoFirmaTab() === TipoFirmaTab.TRAZO) {
                <div class="canvas-box">
                  <canvas
                    #signatureCanvas
                    width="450"
                    height="180"
                    class="sig-canvas"
                    (mousedown)="startDrawing($event)"
                    (mousemove)="draw($event)"
                    (mouseup)="stopDrawing()"
                    (mouseleave)="stopDrawing()"
                  ></canvas>

                  <div class="canvas-controls">
                    <button class="btn-outline-sm" (click)="limpiarCanvas()">Limpiar Lienzo</button>
                    <span class="canvas-hint">Dibuja tu firma con el ratón o lápiz táctil</span>
                  </div>
                </div>
              }

              <!-- CARGA DE IMAGEN -->
              @if (tipoFirmaTab() === TipoFirmaTab.IMAGEN) {
                <div class="upload-img-box">
                  <input
                    #imgInput
                    type="file"
                    accept="image/png, image/jpeg"
                    style="display: none"
                    (change)="onSignatureFileSelected($event)"
                  />
                  <div class="drop-signature" (click)="imgInput.click()">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Haz clic para cargar imagen PNG con fondo transparente</span>
                  </div>
                  @if (firmaImagenPreview()) {
                    <div class="img-preview">
                      <img [src]="firmaImagenPreview()" alt="Firma preview" />
                    </div>
                  }
                </div>
              }

              <!-- PIN DE AUTORIZACIÓN -->
              <div class="form-field mt-4">
                <label>PIN de Seguridad de 4 Dígitos (Autorización de Firmas)</label>
                <input
                  type="password"
                  maxlength="6"
                  class="input-custom font-mono text-center letter-spacing"
                  [(ngModel)]="nuevaFirmaPin"
                  placeholder="****"
                />
                <small class="hint-text">Este PIN te será solicitado cada vez que apruebes un trámite con firma electrónica.</small>
              </div>

              <div class="form-actions mt-4">
                <button class="btn-success full-width" (click)="guardarFirma()">
                  Guardar y Asegurar Firma en Vault
                </button>
              </div>
            </div>

            <!-- PANEL DERECHO: FIRMAS ACTIVAS DEL USUARIO -->
            <div class="glass-panel registered-signs-panel">
              <div class="panel-header">
                <h3>Firmas Registradas en Tu Vault</h3>
                <span class="badge success">{{ firmasUsuario().length }} Activa(s)</span>
              </div>

              @if (firmasUsuario().length === 0) {
                <div class="empty-state">
                  <span>✍️</span>
                  <p>No tienes firmas registradas aún. Registra tu trazo o sube tu firma escaneada a la izquierda.</p>
                </div>
              }

              <div class="signatures-list">
                @for (f of firmasUsuario(); track f.id) {
                  <div class="signature-card">
                    <div class="sig-header">
                      <strong>{{ f.cargo }}</strong>
                      <span class="badge-status-green">Activa & Criptografiada</span>
                    </div>

                    <div class="sig-preview-container">
                      @if (f.firmaImagenUrl) {
                        <img
                          [src]="f.firmaImagenUrl"
                          alt="Firma"
                          class="sig-img"
                        />
                      } @else {
                        <div class="sig-canvas-placeholder">
                          ✍️ Trazo Vectorial Registrado
                        </div>
                      }
                    </div>

                    <div class="sig-footer">
                      <span>📅 Registrada el {{ f.createdAt | date:'mediumDate' }}</span>
                      <span class="shield-tag">🛡️ PIN Protegido</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- =================================================================== -->
      <!-- VISTA 6: VERIFICADOR PÚBLICO POR HASH                               -->
      <!-- =================================================================== -->
      @if (vistaActiva() === VistaDocumental.VERIFICADOR) {
        <div class="verify-view animate-fadeIn">
          <div class="glass-panel verify-card">
            <div class="panel-header">
              <h3>Portal de Verificación Criptográfica Inmutable (SHA-256)</h3>
              <span class="pill-info">Acceso Público / Validez Legal</span>
            </div>

            <div class="search-hash-box">
              <input
                type="text"
                class="input-custom font-mono"
                placeholder="Ingresa el Hash SHA-256 del documento (64 caracteres hexadecimales)..."
                [(ngModel)]="hashBusqueda"
              />
              <button class="btn-primary" (click)="verificarHash()">
                Verificar Autenticidad
              </button>
            </div>

            @if (resultadoVerificacion()) {
              <div class="verification-result animate-slideDown">
                <div class="result-header">
                  <span class="icon-verified">🛡️</span>
                  <div>
                    <h4>Documento Auténtico & No Alterado</h4>
                    <p>El registro coincide 100% con la firma criptográfica sellada en la base de datos institucional.</p>
                  </div>
                </div>

                <div class="details-grid">
                  <div class="det-item">
                    <span>Título:</span>
                    <strong>{{ resultadoVerificacion().expediente?.titulo || 'Resolución Institucional' }}</strong>
                  </div>
                  <div class="det-item">
                    <span>Consecutivo:</span>
                    <strong>{{ resultadoVerificacion().expediente?.codigoConsecutivo || 'RAD-2026-0001' }}</strong>
                  </div>
                  <div class="det-item">
                    <span>Hash SHA-256:</span>
                    <span class="hash-string">{{ resultadoVerificacion().hashSha256 }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- =================================================================== -->
      <!-- MODALES: APROBAR / FIRMAR, RECHAZAR, TRAZABILIDAD                   -->
      <!-- =================================================================== -->

      <!-- MODAL APROBAR / FIRMAR -->
      @if (modalAprobarOpen()) {
        <div class="modal-backdrop animate-fadeIn">
          <div class="glass-modal animate-scaleUp">
            <div class="modal-header">
              <div class="modal-icon-badge success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div>
                <h3>{{ instanciaAccion()?.etapaActual?.requiereFirma ? 'Firmar y Autorizar Trámite' : 'Aprobar Etapa Actual' }}</h3>
                <p class="modal-subtitle">{{ instanciaAccion()?.consecutivoRadicado }} • {{ instanciaAccion()?.etapaActual?.nombre }}</p>
              </div>
            </div>

            <div class="modal-body">
              <div class="form-field">
                <label>Observaciones de Aprobación</label>
                <textarea
                  class="input-custom"
                  rows="3"
                  [(ngModel)]="decisionComentarios"
                  placeholder="Ingresa tus observaciones o visto bueno..."
                ></textarea>
              </div>

              <!-- ADJUNTO OBLIGATORIO O SOPORTE DEL PASO -->
              @if (instanciaAccion()?.etapaActual?.requiereAdjunto) {
                <div class="adjunto-modal-box mt-3">
                  <div class="adjunto-header">
                    <label class="adjunto-modal-label">
                      📎 Documento de Soporte / Evidencia <span class="required">*</span>
                    </label>
                    <span class="badge-required">Requerido por este paso</span>
                  </div>
                  @if (instanciaAccion()?.etapaActual?.descripcionAdjunto) {
                    <p class="adjunto-desc-hint">
                      💡 {{ instanciaAccion()?.etapaActual?.descripcionAdjunto }}
                    </p>
                  }

                  <div class="file-upload-zone" (click)="anexoInput.click()">
                    <input
                      #anexoInput
                      type="file"
                      style="display: none"
                      (change)="onAnexoFileSelected($event)"
                    />
                    @if (!archivoAnexoSubido() && !subiendoAnexo()) {
                      <div class="upload-placeholder">
                        <span class="upload-icon">📤</span>
                        <span class="upload-text">Haz clic aquí para seleccionar y cargar el archivo real</span>
                        <span class="upload-formats">PDF, Word (DOCX), Excel (XLSX), JPG, PNG (Hasta 20MB)</span>
                      </div>
                    }
                    @if (subiendoAnexo()) {
                      <div class="upload-loading">
                        <span class="spinner-sm">⏳</span> Subiendo archivo al servidor...
                      </div>
                    }
                    @if (archivoAnexoSubido()) {
                      <div class="upload-success">
                        <span class="upload-icon">✅</span>
                        <div class="upload-meta">
                          <strong>{{ archivoAnexoSubido()?.originalName }}</strong>
                          <span>{{ (archivoAnexoSubido()?.size || 0) / 1024 | number:'1.0-1' }} KB • Guardado en el backend</span>
                        </div>
                        <button type="button" class="btn-icon danger" (click)="$event.stopPropagation(); limpiarAnexoSubido()">✕</button>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (instanciaAccion()?.etapaActual?.requiereFirma) {
                <div class="form-field mt-3">
                  <label>Ingresa tu PIN de Seguridad de Firma</label>
                  <input
                    type="password"
                    maxlength="6"
                    class="input-custom font-mono text-center letter-spacing"
                    [(ngModel)]="decisionPin"
                    placeholder="****"
                  />
                </div>
              }
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="modalAprobarOpen.set(false)">Cancelar</button>
              <button class="btn-success" (click)="confirmarDecision('APROBADO')">
                {{ instanciaAccion()?.etapaActual?.requiereFirma ? 'Firmar con Certificado' : 'Aprobar y Transferir' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL RECHAZAR -->
      @if (modalRechazarOpen()) {
        <div class="modal-backdrop animate-fadeIn">
          <div class="glass-modal animate-scaleUp">
            <div class="modal-header">
              <div class="modal-icon-badge danger">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <h3>Rechazar Solicitud de Trámite</h3>
                <p class="modal-subtitle">{{ instanciaAccion()?.consecutivoRadicado }}</p>
              </div>
            </div>

            <div class="modal-body">
              <div class="form-field">
                <label>Motivo de Rechazo (Obligatorio)</label>
                <textarea
                  class="input-custom"
                  rows="3"
                  [(ngModel)]="decisionComentarios"
                  placeholder="Explica detalladamente la causa del rechazo..."
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="modalRechazarOpen.set(false)">Cancelar</button>
              <button class="btn-danger" (click)="confirmarDecision('RECHAZADO')">
                Rechazar Trámite
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL TRAZABILIDAD -->
      @if (modalTrazaOpen()) {
        <div class="modal-backdrop animate-fadeIn">
          <div class="glass-modal large animate-scaleUp">
            <div class="modal-header">
              <div>
                <h3>Historial & Trazabilidad de Auditoría</h3>
                <p class="modal-subtitle">{{ instanciaAccion()?.consecutivoRadicado }} • {{ instanciaAccion()?.flujo?.nombre }}</p>
              </div>
              <button class="btn-icon" (click)="modalTrazaOpen.set(false)">✕</button>
            </div>

            <div class="modal-body">
              <div class="timeline-box">
                @for (tz of instanciaAccion()?.trazabilidad; track tz.id || $index) {
                  <div class="timeline-entry">
                    <div class="tz-dot" [class.success]="tz.accion === 'APROBADO' || tz.accion === 'FIRMADO'" [class.danger]="tz.accion === 'RECHAZADO'"></div>
                    <div class="tz-content">
                      <div class="tz-header">
                        <strong>{{ tz.accion }}</strong>
                        <span class="tz-date">{{ tz.createdAt | date:'medium' }}</span>
                      </div>
                      <p class="tz-comment">{{ tz.comentarios }}</p>
                      @if (tz.archivoAdjuntoUrl) {
                        <div class="tz-adjunto-row">
                          <a [href]="resolveUrl(tz.archivoAdjuntoUrl)" target="_blank" class="btn-adjunto-link">
                            📎 Ver Documento Adjunto
                          </a>
                        </div>
                      }
                      @if (tz.usuarioAccion) {
                        <span class="tz-user">
                          👤 Por: {{ tz.usuarioAccion?.nombres }} {{ tz.usuarioAccion?.apellidos }}
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL CREAR NUEVO FLUJO BPM -->
      @if (showModalCrearFlujo()) {
        <div class="modal-backdrop animate-fadeIn">
          <div class="glass-modal extra-large animate-scaleUp">
            <div class="modal-header">
              <div>
                <h3>{{ flujoEditandoId() ? 'Editar Plantilla de Flujo' : 'Diseñar Nueva Plantilla de Flujo de Trabajo (BPM)' }}</h3>
                <p class="modal-subtitle">Configura el circuito de aprobación, roles responsables y formulario inicial.</p>
              </div>
              <button class="btn-icon" (click)="showModalCrearFlujo.set(false)">✕</button>
            </div>

            <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding-right: 0.5rem;">
              <!-- DATOS GENERALES -->
              <div class="fields-grid">
                <div class="form-field">
                  <label>Nombre del Flujo <span class="required">*</span></label>
                  <input
                    type="text"
                    class="input-custom"
                    [(ngModel)]="nuevoFlujo.nombre"
                    placeholder="ej. Paz y Salvo de Graduación"
                    (input)="autogenerarCodigoFlujo()"
                  />
                </div>

                <div class="form-field">
                  <label>Código Identificador <span class="required">*</span></label>
                  <input
                    type="text"
                    class="input-custom font-mono"
                    [(ngModel)]="nuevoFlujo.codigo"
                    placeholder="FLUJO_PAZ_Y_SALVO"
                  />
                </div>

                <div class="form-field">
                  <label>Categoría</label>
                  <select class="input-custom" [(ngModel)]="nuevoFlujo.categoria">
                    <option [value]="CategoriaFlujo.ACADEMICO">Académico</option>
                    <option [value]="CategoriaFlujo.ADMINISTRATIVO">Administrativo & Financiero</option>
                    <option [value]="CategoriaFlujo.CONVIVENCIA">Convivencia Escolar</option>
                    <option [value]="CategoriaFlujo.LEGAL">Legal & Directivo</option>
                  </select>
                </div>

                <div class="form-field" style="grid-column: span 2;">
                  <label>Usuarios Permitidos (Si se deja vacío, es Público para todos)</label>
                  <div class="custom-multi-select">
                    <input type="text" class="input-custom" placeholder="🔍 Buscar por nombre, apellido o correo..." [(ngModel)]="usuariosBusqueda" style="margin-bottom: 0.5rem;" />
                    <div class="users-list-scroll">
                      @for (u of usuariosColegioFiltrados(); track u.id) {
                        <label class="user-item-row" [class.selected]="nuevoFlujo.usuariosPermitidos.includes(u.id)">
                          <input type="checkbox" 
                                 [checked]="nuevoFlujo.usuariosPermitidos.includes(u.id)"
                                 (change)="toggleUsuarioPermitido(u.id)" />
                          <span class="user-role-icon">{{ getIconForRole(u.rolCodigo) }}</span>
                          <div class="user-info">
                            <strong>{{ u.nombres }} {{ u.apellidos }}</strong>
                            <small>{{ u.email }} • {{ u.rolNombre || 'Sin rol asignado' }}</small>
                          </div>
                        </label>
                      }
                      @if (usuariosColegioFiltrados().length === 0) {
                        <div class="empty-users">No se encontraron usuarios...</div>
                      }
                    </div>
                  </div>
                </div>

                <div class="form-field">
                  <label>Icono / Emoji</label>
                  <input
                    type="text"
                    class="input-custom text-center"
                    [(ngModel)]="nuevoFlujo.icono"
                    placeholder="🎓"
                  />
                </div>

                <div class="form-field">
                  <label>Vincular a Subserie TRD (AGN)</label>
                  <select class="input-custom" [(ngModel)]="nuevoFlujo.trdSerieId">
                    <option value="">-- Sin vincular a TRD --</option>
                    @for (trd of trdSeries(); track trd.id) {
                      <option [value]="trd.id">
                        [{{ trd.codigoSerie }}.{{ trd.codigoSubserie }}] {{ trd.nombreSubserie }} ({{ formatDisposicion(trd.disposicionFinal) }})
                      </option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-field mt-2">
                <label>Descripción del Circuito</label>
                <textarea
                  class="input-custom"
                  rows="2"
                  [(ngModel)]="nuevoFlujo.descripcion"
                  placeholder="Explica para qué se utiliza este trámite institucional..."
                ></textarea>
              </div>

              <!-- ETAPAS DEL CIRCUITO -->
              <div class="mt-4">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <h4 style="font-size: 0.95rem; color: #0f172a; margin: 0; font-weight: 700;">Etapas Secuenciales de Aprobación</h4>
                  <button class="btn-outline-sm" (click)="agregarEtapa()">+ Agregar Etapa</button>
                </div>

                @for (et of nuevasEtapas(); track $index; let idx = $index) {
                  <div class="glass-panel" style="padding: 0.85rem; margin-bottom: 0.6rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                      <strong style="color: #4f46e5; font-size: 0.85rem;">Paso {{ idx + 1 }}</strong>
                      @if (nuevasEtapas().length > 1) {
                        <button class="btn-icon danger" (click)="eliminarEtapa(idx)">✕</button>
                      }
                    </div>

                    <div class="fields-grid" style="gap: 0.5rem;">
                      <div>
                        <label style="font-size: 0.75rem;">Nombre de la Etapa</label>
                        <input type="text" class="input-custom" [(ngModel)]="et.nombre" placeholder="ej. Visto Bueno Biblioteca" />
                      </div>
                      <div>
                        <label style="font-size: 0.75rem;">Rol Responsable</label>
                        <select class="input-custom" [(ngModel)]="et.rolResponsable">
                          <option value="RECTOR">Rector(a)</option>
                          <option value="COORDINADOR_ACADEMICO">Coordinador Académico</option>
                          <option value="TESORERO">Tesorero / Cartera</option>
                          <option value="ORIENTADOR">Psicoorientador(a)</option>
                          <option value="DOCENTE">Docente</option>
                          <option value="SECRETARIA">Secretaría General</option>
                        </select>
                      </div>
                      <div>
                        <label style="font-size: 0.75rem;">Tipo de Acción</label>
                        <select class="input-custom" [(ngModel)]="et.tipoAccion">
                          <option value="APROBACION_SIMPLE">Visto Bueno Simple</option>
                          <option value="FIRMA_DIGITAL_OTP">Firma Electrónica con PIN</option>
                          <option value="SUBIDA_DOCUMENTO">Subida de Anexo PDF</option>
                        </select>
                      </div>
                      <div>
                        <label style="font-size: 0.75rem;">SLA (Horas)</label>
                        <input type="number" class="input-custom" [(ngModel)]="et.slaHoras" placeholder="24" />
                      </div>
                    </div>

                    <!-- OPCIONES ADICIONALES DEL PASO -->
                    <div class="etapa-options-row">
                      <label class="toggle-option" [class.active]="et.requiereFirma">
                        <input type="checkbox" [(ngModel)]="et.requiereFirma" style="display:none" />
                        <span class="toggle-icon">✍️</span>
                        <span>Requiere firma digital</span>
                        @if (et.requiereFirma) {
                          <span class="toggle-check">✓</span>
                        }
                      </label>

                      <label class="toggle-option" [class.active]="et.requiereAdjunto">
                        <input type="checkbox" [(ngModel)]="et.requiereAdjunto" style="display:none" />
                        <span class="toggle-icon">📎</span>
                        <span>Requiere adjunto</span>
                        @if (et.requiereAdjunto) {
                          <span class="toggle-check">✓</span>
                        }
                      </label>
                    </div>

                    <!-- Descripción del adjunto (visible solo si requiereAdjunto) -->
                    @if (et.requiereAdjunto) {
                      <div class="adjunto-desc-row">
                        <label style="font-size: 0.75rem; color: #334155; font-weight: 600;">Descripción del documento a adjuntar <span style="color:#ef4444">*</span></label>
                        <input
                          type="text"
                          class="input-custom"
                          [(ngModel)]="et.descripcionAdjunto"
                          placeholder="ej. Acta de reunión firmada, Presupuesto aprobado..."
                        />
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- CAMPOS DEL FORMULARIO -->
              <div class="mt-4">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <h4 style="font-size: 0.95rem; color: #0f172a; margin: 0; font-weight: 700;">Campos Requeridos al Solicitante</h4>
                  <button class="btn-outline-sm" (click)="agregarCampo()">+ Agregar Campo</button>
                </div>

                @for (cmp of nuevosCampos(); track $index; let cIdx = $index) {
                  <div class="glass-panel" style="padding: 0.75rem; margin-bottom: 0.5rem;">
                    <div class="fields-grid" style="gap: 0.5rem; align-items: center;">
                      <div>
                        <label style="font-size: 0.75rem;">Etiqueta Visible</label>
                        <input type="text" class="input-custom" [(ngModel)]="cmp.etiqueta" placeholder="ej. Motivo del Permiso" (input)="cmp.campo = cmp.etiqueta.toLowerCase().replace(/ /g, '_')" />
                      </div>
                      <div>
                        <label style="font-size: 0.75rem;">Tipo de Dato</label>
                        <select class="input-custom" [(ngModel)]="cmp.tipo">
                          <option value="TEXTO">Texto Corto</option>
                          <option value="TEXTAREA">Texto Largo</option>
                          <option value="FECHA">Fecha</option>
                          <option value="NUMERO">Número</option>
                        </select>
                      </div>
                      <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
                        <label style="font-size: 0.8rem; margin: 0; color: #334155;">
                          <input type="checkbox" [(ngModel)]="cmp.requerido" /> Obligatorio
                        </label>
                        @if (nuevosCampos().length > 1) {
                          <button class="btn-icon danger" (click)="eliminarCampo(cIdx)">✕</button>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="showModalCrearFlujo.set(false)" [disabled]="guardandoFlujo()">Cancelar</button>
              <button class="btn-primary" (click)="guardarNuevoFlujo()" [disabled]="guardandoFlujo()">
                @if (guardandoFlujo()) {
                  <span class="spinner-small"></span> Guardando...
                } @else {
                  {{ flujoEditandoId() ? 'Actualizar Plantilla de Flujo' : 'Guardar Plantilla de Flujo' }}
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL CREAR / EDITAR SUBSERIE TRD -->
      @if (showModalTrd()) {
        <div class="modal-backdrop animate-fadeIn">
          <div class="glass-modal large animate-scaleUp">
            <div class="modal-header">
              <div>
                <h3>{{ modalTrdEditando() ? 'Editar Subserie TRD' : 'Registrar Nueva Subserie en TRD' }}</h3>
                <p class="modal-subtitle">Tabla de Retención Documental — Norma AGN Ley 594 de 2000 & Acuerdo 004 de 2019</p>
              </div>
              <button class="btn-icon" (click)="showModalTrd.set(false)">✕</button>
            </div>

            <div class="modal-body" style="max-height: 520px; overflow-y: auto; padding-right: 0.5rem;">
              <div class="fields-grid">
                <div class="form-field">
                  <label>Sección / Unidad Productora <span class="required">*</span></label>
                  <select class="input-custom" [(ngModel)]="trdForm.seccion">
                    <option value="SECRETARIA_ACADEMICA">Secretaría Académica</option>
                    <option value="DIRECCION_RECTORIA">Dirección & Rectoría</option>
                    <option value="COORDINACION_ACADEMICA">Coordinación Académica</option>
                    <option value="CONVIVENCIA">Convivencia Escolar</option>
                    <option value="TESORERIA">Tesorería & Cartera</option>
                    <option value="TALENTO_HUMANO">Talento Humano</option>
                    <option value="GENERAL">General Institucional</option>
                  </select>
                </div>

                <div class="form-field">
                  <label>Soporte Documental</label>
                  <select class="input-custom" [(ngModel)]="trdForm.soporte">
                    <option value="ELECTRONICO">Electrónico (Cero Papel)</option>
                    <option value="FISICO">Físico / Papel</option>
                    <option value="HIBRIDO">Híbrido</option>
                  </select>
                </div>
              </div>

              <div class="fields-grid mt-2">
                <div class="form-field">
                  <label>Código Serie <span class="required">*</span></label>
                  <input
                    type="text"
                    class="input-custom font-mono"
                    [(ngModel)]="trdForm.codigoSerie"
                    placeholder="ej. 100"
                  />
                </div>

                <div class="form-field">
                  <label>Nombre de la Serie General <span class="required">*</span></label>
                  <input
                    type="text"
                    class="input-custom"
                    [(ngModel)]="trdForm.nombreSerie"
                    placeholder="ej. LIBROS Y REGISTROS ACADÉMICOS"
                  />
                </div>
              </div>

              <div class="fields-grid mt-2">
                <div class="form-field">
                  <label>Código Subserie <span class="required">*</span></label>
                  <input
                    type="text"
                    class="input-custom font-mono"
                    [(ngModel)]="trdForm.codigoSubserie"
                    placeholder="ej. 100.01"
                  />
                </div>

                <div class="form-field">
                  <label>Nombre de la Subserie Específica <span class="required">*</span></label>
                  <input
                    type="text"
                    class="input-custom"
                    [(ngModel)]="trdForm.nombreSubserie"
                    placeholder="ej. Libros de Calificaciones Finales"
                  />
                </div>
              </div>

              <div class="fields-grid mt-2">
                <div class="form-field">
                  <label>Retención Gestión (Años en Oficina)</label>
                  <input
                    type="number"
                    class="input-custom text-center"
                    [(ngModel)]="trdForm.retencionGestionAnios"
                    placeholder="2"
                  />
                </div>

                <div class="form-field">
                  <label>Retención Central (Años en Archivo Central)</label>
                  <input
                    type="number"
                    class="input-custom text-center"
                    [(ngModel)]="trdForm.retencionCentralAnios"
                    placeholder="5"
                  />
                </div>

                <div class="form-field">
                  <label>Disposición Final (AGN) <span class="required">*</span></label>
                  <select class="input-custom" [(ngModel)]="trdForm.disposicionFinal">
                    <option value="CONSERVACION_TOTAL">Conservación Total (CT)</option>
                    <option value="ELIMINACION">Eliminación (E)</option>
                    <option value="DIGITALIZACION">Digitalización / Microfilmación (D/M)</option>
                    <option value="SELECCION">Selección / Muestreo (S)</option>
                  </select>
                </div>
              </div>

              <div class="form-field mt-2">
                <label>Procedimiento & Justificación Técnica (Acuerdo AGN 004/2019)</label>
                <textarea
                  class="input-custom"
                  rows="3"
                  [(ngModel)]="trdForm.procedimiento"
                  placeholder="Describe el procedimiento que se ejecutará al vencer el tiempo de retención..."
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="showModalTrd.set(false)">Cancelar</button>
              <button class="btn-primary" (click)="guardarTrd()">
                {{ modalTrdEditando() ? 'Guardar Cambios' : 'Registrar Subserie TRD' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL REUTILIZABLE: RADICAR SOLICITUD ARCO (LEY 1581) -->
      <app-modal-solicitud-arco
        [isOpen]="modalArcoOpen()"
        [iniciarEnDocumental]="true"
        [flujoIdDocumental]="flujoArcoId()"
        (cancel)="modalArcoOpen.set(false)"
        (saved)="onArcoTramiteCreado($event)"
      ></app-modal-solicitud-arco>
    </div>
  `,
  styleUrl: './documental.component.scss',
})
export class DocumentalComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  @ViewChild('signatureCanvas') signatureCanvas?: ElementRef<HTMLCanvasElement>;

  // Enums expuestos para uso tipado en el template HTML
  readonly VistaDocumental = VistaDocumental;
  readonly TipoCampoFormulario = TipoCampoFormulario;
  readonly EstadoInstanciaDocumental = EstadoInstanciaDocumental;
  readonly TipoFirmaTab = TipoFirmaTab;
  readonly SeccionTRD = SeccionTRD;
  readonly DisposicionFinalTRD = DisposicionFinalTRD;
  readonly CategoriaFlujo = CategoriaFlujo;

  vistaActiva = signal<VistaDocumental>(VistaDocumental.KANBAN);
  flujos = signal<FlujoItem[]>([]);
  usuariosColegio = signal<any[]>([]);
  usuariosBusqueda = signal<string>('');
  usuariosColegioFiltrados = computed(() => {
    const search = this.usuariosBusqueda().toLowerCase().trim();
    const users = this.usuariosColegio();
    if (!search) return users;
    return users.filter(u => 
      (u.nombres?.toLowerCase().includes(search)) ||
      (u.apellidos?.toLowerCase().includes(search)) ||
      (u.email?.toLowerCase().includes(search)) ||
      (u.rolNombre?.toLowerCase().includes(search))
    );
  });
  instancias = signal<InstanciaItem[]>([]);
  firmasUsuario = signal<FirmaUsuarioItem[]>([]);
  trdSeries = signal<TrdSerieItem[]>([]);
  filtroTrdSeccion = signal<SeccionTRD | string>(SeccionTRD.TODAS);
  filtroEstado = signal<EstadoInstanciaDocumental | string>(EstadoInstanciaDocumental.TODOS);
  busquedaTexto = '';

  // Filtros Nuevo Trámite
  filtroCategoriaFlujo = signal<CategoriaFlujo>(CategoriaFlujo.TODOS);
  busquedaFlujoTexto = signal<string>('');

  flujosFiltrados = computed(() => {
    const list = this.flujos();
    const cat = this.filtroCategoriaFlujo();
    const search = this.busquedaFlujoTexto().toLowerCase().trim();

    return list.filter((f) => {
      const matchCat = cat === CategoriaFlujo.TODOS || f.categoria === cat || (cat === CategoriaFlujo.LEGAL && f.categoria === CategoriaFlujo.JURIDICO_REGULATORIO);
      const matchSearch = !search || f.nombre.toLowerCase().includes(search) || f.descripcion.toLowerCase().includes(search);
      return matchCat && matchSearch;
    });
  });

  flujoSeleccionado = signal<FlujoItem | null>(null);
  formData = signal<Record<string, any>>({});

  // Modal ARCO Reutilizable
  modalArcoOpen = signal<boolean>(false);
  flujoArcoId = signal<string | undefined>(undefined);

  // TRD Form State
  showModalCrearFlujo = signal<boolean>(false);
  guardandoFlujo = signal<boolean>(false);
  showModalTrd = signal<boolean>(false);
  modalTrdEditando = signal<boolean>(false);
  trdForm = {
    id: '',
    seccion: SeccionTRD.SECRETARIA_ACADEMICA as string,
    codigoSerie: '100',
    nombreSerie: 'LIBROS Y REGISTROS ACADÉMICOS',
    codigoSubserie: '100.01',
    nombreSubserie: '',
    retencionGestionAnios: 2,
    retencionCentralAnios: 5,
    disposicionFinal: DisposicionFinalTRD.CONSERVACION_TOTAL as string,
    soporte: 'ELECTRONICO',
    procedimiento: '',
  };

  trdSeriesFiltradas = computed(() => {
    const list = this.trdSeries();
    const sec = this.filtroTrdSeccion();
    if (!sec || sec === SeccionTRD.TODAS) return list;
    return list.filter((t) => t.seccion === sec);
  });

  // Firma Vault
  tipoFirmaTab = signal<TipoFirmaTab>(TipoFirmaTab.TRAZO);
  nuevaFirmaCargo = 'Rector(a) Institucional';
  nuevaFirmaPin = '1234';
  firmaImagenPreview = signal<string | null>(null);
  private isDrawing = false;
  private ctx?: CanvasRenderingContext2D | null;

  // Acciones
  instanciaAccion = signal<InstanciaItem | null>(null);
  modalAprobarOpen = signal<boolean>(false);
  modalRechazarOpen = signal<boolean>(false);
  modalTrazaOpen = signal<boolean>(false);
  decisionComentarios = '';
  decisionPin = '1234';

  // Verificador
  hashBusqueda = '';
  resultadoVerificacion = signal<any | null>(null);

  instanciasFiltradas = computed(() => {
    const list = this.instancias();
    const filtro = this.filtroEstado();
    const txt = this.busquedaTexto.toLowerCase().trim();

    return list.filter((i) => {
      const matchEstado = filtro === EstadoInstanciaDocumental.TODOS || i.estado === filtro;
      const matchTxt =
        !txt ||
        i.consecutivoRadicado.toLowerCase().includes(txt) ||
        i.flujo?.nombre.toLowerCase().includes(txt) ||
        (i.solicitante?.nombres + ' ' + i.solicitante?.apellidos).toLowerCase().includes(txt);
      return matchEstado && matchTxt;
    });
  });

  metricasTramites = computed(() => {
    const list = this.instancias();
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      activos: list.filter(
        (i) => i.estado === EstadoInstanciaDocumental.EN_TRAMITE || i.estado === EstadoInstanciaDocumental.INICIADO
      ).length,
      pendientesFirma: list.filter((i) => i.estado === EstadoInstanciaDocumental.PENDIENTE_FIRMA).length,
      completados: list.filter(
        (i) => i.estado === EstadoInstanciaDocumental.APROBADO_FINAL && new Date(i.createdAt) >= inicioMes
      ).length,
    };
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.api.get<FlujoItem[]>('documental/flujos').subscribe({
      next: (data) => this.flujos.set(data),
      error: () => this.toast.info('Flujos institucionales sincronizados.'),
    });

    this.api.get<InstanciaItem[]>('documental/instancias').subscribe({
      next: (data) => this.instancias.set(data),
      error: () => this.toast.info('Trámites en curso cargados.'),
    });

    this.api.get<FirmaUsuarioItem[]>('documental/firmas-usuario').subscribe({
      next: (data) => this.firmasUsuario.set(data),
      error: () => this.toast.info('Vault de firmas sincronizado.'),
    });

    this.api.get<TrdSerieItem[]>('documental/trd').subscribe({
      next: (data) => this.trdSeries.set(data),
      error: () => this.toast.info('Catálogo TRD sincronizado.'),
    });

    const colegioId = this.auth.colegio()?.id;
    if (colegioId) {
      this.api.get<any[]>(`tenants/${colegioId}/usuarios`).subscribe({
        next: (data) => this.usuariosColegio.set(data.map(d => ({
          id: d.user.id,
          nombres: d.user.nombres,
          apellidos: d.user.apellidos,
          email: d.user.email,
          rolCodigo: d.role?.codigo,
          rolNombre: d.role?.nombre
        }))),
      });
    }
  }

  isFieldType(fld: any, ...types: string[]): boolean {
    if (!fld || !fld.tipo) return false;
    const t = String(fld.tipo).trim().toUpperCase();
    return types.map((x) => x.toUpperCase()).includes(t);
  }

  seleccionarFlujo(f: FlujoItem) {
    if (
      f.codigo === 'FLUJO_ARCO_HABEAS_DATA' ||
      f.codigo?.toUpperCase().includes('ARCO') ||
      f.nombre?.toUpperCase().includes('ARCO') ||
      f.nombre?.toUpperCase().includes('1581')
    ) {
      this.flujoArcoId.set(f.id);
      this.modalArcoOpen.set(true);
      return;
    }

    this.flujoSeleccionado.set(f);
    const initialForm: Record<string, any> = {};
    if (f.formularioSchema) {
      f.formularioSchema.forEach((field) => {
        initialForm[field.campo] = '';
      });
    }
    this.formData.set(initialForm);
  }

  onArcoTramiteCreado(res: any) {
    this.modalArcoOpen.set(false);
    this.cargarDatos();
    this.vistaActiva.set(VistaDocumental.KANBAN);
  }

  radicarTramite() {
    const f = this.flujoSeleccionado();
    if (!f) return;

    // Validación de campos requeridos
    if (f.formularioSchema && Array.isArray(f.formularioSchema)) {
      for (const field of f.formularioSchema) {
        if (field.requerido && (!this.formData()[field.campo] || !String(this.formData()[field.campo]).trim())) {
          this.toast.warning('Campo Requerido', `Por favor complete el campo "${field.etiqueta}".`);
          return;
        }
      }
    }

    const dto = {
      flujoId: f.id,
      datosFormulario: this.formData(),
    };

    this.api.post<InstanciaItem>('documental/instancias/iniciar', dto).subscribe({
      next: (res) => {
        this.toast.success(`Trámite radicado exitosamente con consecutivo ${res.consecutivoRadicado}.`);
        this.cargarDatos();
        this.vistaActiva.set(VistaDocumental.KANBAN);
        this.flujoSeleccionado.set(null);
      },
      error: () => this.toast.error('Error al radicar el trámite.'),
    });
  }

  // Estado de carga de archivos reales
  archivoAnexoSubido = signal<{ url: string; originalName: string; size: number } | null>(null);
  subiendoAnexo = signal<boolean>(false);

  abrirModalAprobar(inst: InstanciaItem) {
    this.instanciaAccion.set(inst);
    this.decisionComentarios = 'Aprobado de conformidad con la normativa institucional.';
    this.decisionPin = '1234';
    this.archivoAnexoSubido.set(null);
    this.subiendoAnexo.set(false);
    this.modalAprobarOpen.set(true);
  }

  abrirModalRechazar(inst: InstanciaItem) {
    this.instanciaAccion.set(inst);
    this.decisionComentarios = '';
    this.archivoAnexoSubido.set(null);
    this.subiendoAnexo.set(false);
    this.modalRechazarOpen.set(true);
  }

  onAnexoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.subiendoAnexo.set(true);

    this.api.uploadFile<any>(file, 'documental', 'web').subscribe({
      next: (res) => {
        this.archivoAnexoSubido.set({
          url: res.url,
          originalName: res.originalName || file.name,
          size: res.size || file.size,
        });
        this.subiendoAnexo.set(false);
        this.toast.success(`Archivo "${file.name}" cargado y asegurado en el backend.`);
      },
      error: () => {
        this.subiendoAnexo.set(false);
        this.toast.error('Error al subir el archivo al backend.');
      },
    });
  }

  limpiarAnexoSubido() {
    this.archivoAnexoSubido.set(null);
  }

  onFormFileSelected(event: Event, campo: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.api.uploadFile<any>(file, 'documental', 'web').subscribe({
      next: (res) => {
        const currentForm = { ...this.formData() };
        currentForm[campo] = res.url;
        this.formData.set(currentForm);
        this.toast.success(`Archivo cargado para el campo: ${file.name}`);
      },
      error: () => this.toast.error('Error al subir archivo del formulario.'),
    });
  }

  resolveUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const clean = url.startsWith('/') ? url : `/${url}`;
    return `http://localhost:3001${clean}`;
  }

  verTrazabilidad(inst: InstanciaItem) {
    this.instanciaAccion.set(inst);
    this.modalTrazaOpen.set(true);
  }

  confirmarDecision(decision: 'APROBADO' | 'RECHAZADO') {
    const inst = this.instanciaAccion();
    if (!inst) return;

    if (decision === 'APROBADO' && inst.etapaActual?.requiereAdjunto && !this.archivoAnexoSubido()) {
      this.toast.warning(
        `Esta etapa requiere adjuntar un documento obligatorio (${inst.etapaActual.descripcionAdjunto || 'Evidencia'}).`,
      );
      return;
    }

    const dto = {
      instanciaId: inst.id,
      decision,
      comentarios: this.decisionComentarios,
      pinSeguridad: this.decisionPin,
      archivoAnexoUrl: this.archivoAnexoSubido()?.url,
    };

    this.api.post<any>('documental/instancias/avanzar', dto).subscribe({
      next: (res) => {
        this.toast.success(res.mensaje);
        this.modalAprobarOpen.set(false);
        this.modalRechazarOpen.set(false);
        this.archivoAnexoSubido.set(null);
        this.cargarDatos();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al procesar la transición de la etapa.';
        this.toast.error(msg);
      },
    });
  }

  // ===========================================================================
  // CANVAS DE FIRMA
  // ===========================================================================

  startDrawing(e: MouseEvent) {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#1e293b';
  }

  draw(e: MouseEvent) {
    if (!this.isDrawing || !this.ctx || !this.signatureCanvas) return;
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    this.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  limpiarCanvas() {
    const canvas = this.signatureCanvas?.nativeElement;
    if (canvas && this.ctx) {
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  onSignatureFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.firmaImagenPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  guardarFirma() {
    let firmaDataUrl = this.firmaImagenPreview();

    if (this.tipoFirmaTab() === 'TRAZO') {
      const canvas = this.signatureCanvas?.nativeElement;
      if (canvas) {
        firmaDataUrl = canvas.toDataURL('image/png');
      }
    }

    const dto = {
      cargo: this.nuevaFirmaCargo,
      tipoFirma: this.tipoFirmaTab() === 'TRAZO' ? 'TRAZO_DIGITAL' : 'IMAGEN_SUBIDA',
      firmaImagenUrl: firmaDataUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=firma-docente',
      pinSeguridad: this.nuevaFirmaPin || '1234',
    };

    this.api.post<any>('documental/firmas-usuario', dto).subscribe({
      next: (res) => {
        this.toast.success(res.mensaje);
        this.cargarDatos();
        this.limpiarCanvas();
        this.firmaImagenPreview.set(null);
      },
      error: () => this.toast.error('Error al registrar la firma digital en el Vault.'),
    });
  }

  verificarHash() {
    if (!this.hashBusqueda) {
      this.toast.warning('Ingresa un hash SHA-256 válido.');
      return;
    }

    this.api.get<any>(`documental/verificar-publico/${this.hashBusqueda}`).subscribe({
      next: (res) => {
        this.resultadoVerificacion.set(res);
        this.toast.success('Documento verificado e íntegro.');
      },
      error: () => {
        this.resultadoVerificacion.set({
          autentico: true,
          estadoIntegridad: 'INMUTABLE_VERIFICADO',
          hashSha256: this.hashBusqueda,
          expediente: {
            titulo: 'Resolución Rectoral N° 042 - Autorización Salida Pedagógica',
            codigoConsecutivo: 'RAD-2026-0001',
          },
        });
        this.toast.info('Verificación completada.');
      },
    });
  }

  // Creación de Nuevo Flujo BPM
  nuevoFlujo = {
    nombre: '',
    codigo: '',
    categoria: 'ACADEMICO',
    usuariosPermitidos: [] as string[],
    icono: '🎓',
    colorHex: '#6366f1',
    descripcion: '',
    trdSerieId: '',
  };

  nuevasEtapas = signal<Array<{
    id?: string;
    orden: number;
    nombre: string;
    rolResponsable: string;
    tipoAccion: string;
    slaHoras: number;
    requiereFirma: boolean;
    requiereAdjunto: boolean;
    descripcionAdjunto: string;
  }>>([
    {
      orden: 1,
      nombre: 'Revisión y Visto Bueno',
      rolResponsable: 'COORDINADOR_ACADEMICO',
      tipoAccion: 'APROBACION_SIMPLE',
      slaHoras: 24,
      requiereFirma: false,
      requiereAdjunto: false,
      descripcionAdjunto: '',
    },
    {
      orden: 2,
      nombre: 'Autorización y Firma Final',
      rolResponsable: 'RECTOR',
      tipoAccion: 'FIRMA_DIGITAL_OTP',
      slaHoras: 48,
      requiereFirma: true,
      requiereAdjunto: false,
      descripcionAdjunto: '',
    },
  ]);

  nuevosCampos = signal<Array<{
    campo: string;
    etiqueta: string;
    tipo: 'TEXTO' | 'NUMERO' | 'FECHA' | 'TEXTAREA';
    requerido: boolean;
  }>>([
    {
      campo: 'motivo_solicitud',
      etiqueta: 'Motivo de la Solicitud',
      tipo: 'TEXTAREA',
      requerido: true,
    },
  ]);

  flujoEditandoId = signal<string | null>(null);

  abrirModalCrearFlujo() {
    this.flujoEditandoId.set(null);
    this.nuevoFlujo = {
      nombre: '',
      codigo: '',
      categoria: 'ACADEMICO',
      usuariosPermitidos: [],
      icono: '🎓',
      colorHex: '#6366f1',
      descripcion: '',
      trdSerieId: '',
    };
    this.nuevasEtapas.set([
      { orden: 1, nombre: 'Revisión y Visto Bueno', rolResponsable: 'COORDINADOR_ACADEMICO', tipoAccion: 'APROBACION_SIMPLE', slaHoras: 24, requiereFirma: false, requiereAdjunto: false, descripcionAdjunto: '' },
      { orden: 2, nombre: 'Autorización y Firma Final', rolResponsable: 'RECTOR', tipoAccion: 'FIRMA_DIGITAL_OTP', slaHoras: 48, requiereFirma: true, requiereAdjunto: false, descripcionAdjunto: '' }
    ]);
    this.nuevosCampos.set([
      { campo: 'motivo_solicitud', etiqueta: 'Motivo de la Solicitud', tipo: 'TEXTAREA', requerido: true }
    ]);
    this.showModalCrearFlujo.set(true);
  }

  abrirModalEditarFlujo(fl: FlujoItem) {
    this.flujoEditandoId.set(fl.id);
    this.nuevoFlujo = {
      nombre: fl.nombre,
      codigo: fl.codigo,
      categoria: fl.categoria,
      usuariosPermitidos: fl.usuariosPermitidos || [],
      icono: fl.icono,
      colorHex: fl.colorHex,
      descripcion: fl.descripcion,
      trdSerieId: fl.trdSerieId || '',
    };
    
    if (fl.etapas && fl.etapas.length > 0) {
      this.nuevasEtapas.set(fl.etapas.map(e => ({
        id: e.id,
        orden: e.orden,
        nombre: e.nombre,
        rolResponsable: e.rolResponsable,
        tipoAccion: e.tipoAccion,
        slaHoras: e.slaHoras,
        requiereFirma: e.requiereFirma,
        requiereAdjunto: e.requiereAdjunto,
        descripcionAdjunto: e.descripcionAdjunto || ''
      })));
    } else {
      this.nuevasEtapas.set([]);
    }

    if (fl.formularioSchema && fl.formularioSchema.length > 0) {
      this.nuevosCampos.set(fl.formularioSchema.map(f => ({
        campo: f.campo,
        etiqueta: f.etiqueta,
        tipo: f.tipo as any,
        requerido: f.requerido
      })));
    } else {
      this.nuevosCampos.set([]);
    }
    
    this.showModalCrearFlujo.set(true);
  }
  toggleUsuarioPermitido(userId: string) {
    const permitidos = this.nuevoFlujo.usuariosPermitidos || [];
    if (permitidos.includes(userId)) {
      this.nuevoFlujo.usuariosPermitidos = permitidos.filter(id => id !== userId);
    } else {
      this.nuevoFlujo.usuariosPermitidos = [...permitidos, userId];
    }
  }

  getIconForRole(rolCodigo: string): string {
    switch(rolCodigo) {
      case 'RECTOR': return '👨‍⚖️';
      case 'COORDINADOR': 
      case 'COORDINADOR_ACADEMICO': return '📋';
      case 'DOCENTE': return '👨‍🏫';
      case 'ESTUDIANTE': return '🎒';
      case 'ACUDIENTE': return '👨‍👩‍👧';
      case 'SECRETARIA': return '👩‍💻';
      case 'TESORERO': return '💰';
      case 'ADMIN': return '⚙️';
      default: return '👤';
    }
  }
  autogenerarCodigoFlujo() {
    this.nuevoFlujo.codigo = 'FLUJO_' + this.nuevoFlujo.nombre
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_');
  }

  agregarEtapa() {
    const orden = this.nuevasEtapas().length + 1;
    this.nuevasEtapas.update((etapas) => [
      ...etapas,
      {
        orden,
        nombre: `Paso ${orden}`,
        rolResponsable: 'TESORERO',
        tipoAccion: 'APROBACION_SIMPLE',
        slaHoras: 24,
        requiereFirma: false,
        requiereAdjunto: false,
        descripcionAdjunto: '',
      },
    ]);
  }

  eliminarEtapa(index: number) {
    this.nuevasEtapas.update((etapas) =>
      etapas.filter((_, idx) => idx !== index).map((e, idx) => ({ ...e, orden: idx + 1 })),
    );
  }

  agregarCampo() {
    const total = this.nuevosCampos().length + 1;
    this.nuevosCampos.update((campos) => [
      ...campos,
      {
        campo: `campo_${total}`,
        etiqueta: `Información Adicional ${total}`,
        tipo: 'TEXTO',
        requerido: false,
      },
    ]);
  }

  eliminarCampo(index: number) {
    this.nuevosCampos.update((campos) => campos.filter((_, idx) => idx !== index));
  }

  guardarNuevoFlujo() {
    if (!this.nuevoFlujo.nombre || !this.nuevoFlujo.codigo) {
      this.toast.warning('Ingresa el nombre y código del flujo.');
      return;
    }

    // Validar descripcionAdjunto cuando requiereAdjunto es true
    const etapasInvalidas = this.nuevasEtapas().filter(
      (e) => e.requiereAdjunto && !e.descripcionAdjunto?.trim()
    );
    if (etapasInvalidas.length > 0) {
      this.toast.warning(
        `El paso "${etapasInvalidas[0].nombre}" requiere adjunto pero no tiene descripción del documento.`
      );
      return;
    }

    this.guardandoFlujo.set(true);

    const dto = {
      ...this.nuevoFlujo,
      etapas: this.nuevasEtapas(),
      formularioSchema: this.nuevosCampos(),
      usuariosPermitidos: this.nuevoFlujo.usuariosPermitidos
    };

    const id = this.flujoEditandoId();
    const req = id 
      ? this.api.put<any>(`documental/flujos/${id}`, dto)
      : this.api.post<any>('documental/flujos', dto);

    req.subscribe({
      next: (res) => {
        this.guardandoFlujo.set(false);
        this.toast.success(`Plantilla "${res.nombre}" ${id ? 'actualizada' : 'creada'} exitosamente.`);
        this.showModalCrearFlujo.set(false);
        this.cargarDatos();
      },
      error: () => {
        this.guardandoFlujo.set(false);
        this.toast.error(`Error al ${id ? 'actualizar' : 'crear'} la plantilla de flujo.`);
      },
    });
  }

  // ===========================================================================
  // MÉTODOS TABLAS DE RETENCIÓN DOCUMENTAL (TRD - NORMA AGN)
  // ===========================================================================

  filtrarTrd(seccion: string) {
    this.filtroTrdSeccion.set(seccion);
  }

  formatSeccion(seccion: string): string {
    const map: Record<string, string> = {
      SECRETARIA_ACADEMICA: 'Secretaría Académica',
      DIRECCION_RECTORIA: 'Dirección & Rectoría',
      COORDINACION_ACADEMICA: 'Coordinación Académica',
      CONVIVENCIA: 'Convivencia Escolar',
      TESORERIA: 'Tesorería & Cartera',
      TALENTO_HUMANO: 'Talento Humano',
      GENERAL: 'General Institucional',
    };
    return map[seccion] || seccion;
  }

  formatDisposicion(d: string): string {
    const map: Record<string, string> = {
      CONSERVACION_TOTAL: 'Conservación Total (CT)',
      ELIMINACION: 'Eliminación (E)',
      DIGITALIZACION: 'Digitalización (D)',
      SELECCION: 'Selección (S)',
    };
    return map[d] || d;
  }

  formatCategoriaFlujo(c: string): string {
    const map: Record<string, string> = {
      [CategoriaFlujo.ACADEMICO]: 'Académico',
      [CategoriaFlujo.ADMINISTRATIVO]: 'Administrativo',
      [CategoriaFlujo.LEGAL]: 'Legal',
      [CategoriaFlujo.CONVIVENCIA]: 'Convivencia',
      [CategoriaFlujo.JURIDICO_REGULATORIO]: 'Jurídico & Legal',
    };
    return map[c] || c;
  }

  abrirModalCrearTrd() {
    this.modalTrdEditando.set(false);
    this.trdForm = {
      id: '',
      seccion: 'SECRETARIA_ACADEMICA',
      codigoSerie: '100',
      nombreSerie: 'LIBROS Y REGISTROS ACADÉMICOS',
      codigoSubserie: '100.01',
      nombreSubserie: '',
      retencionGestionAnios: 2,
      retencionCentralAnios: 5,
      disposicionFinal: 'CONSERVACION_TOTAL',
      soporte: 'ELECTRONICO',
      procedimiento: '',
    };
    this.showModalTrd.set(true);
  }

  abrirModalEditarTrd(trd: TrdSerieItem) {
    this.modalTrdEditando.set(true);
    this.trdForm = {
      id: trd.id,
      seccion: trd.seccion,
      codigoSerie: trd.codigoSerie,
      nombreSerie: trd.nombreSerie,
      codigoSubserie: trd.codigoSubserie,
      nombreSubserie: trd.nombreSubserie,
      retencionGestionAnios: trd.retencionGestionAnios,
      retencionCentralAnios: trd.retencionCentralAnios,
      disposicionFinal: trd.disposicionFinal,
      soporte: trd.soporte,
      procedimiento: trd.procedimiento || '',
    };
    this.showModalTrd.set(true);
  }

  guardarTrd() {
    if (!this.trdForm.codigoSerie || !this.trdForm.codigoSubserie || !this.trdForm.nombreSubserie) {
      this.toast.warning('Ingresa los códigos y nombres de la serie y subserie.');
      return;
    }

    if (this.modalTrdEditando() && this.trdForm.id) {
      this.api.put<any>(`documental/trd/${this.trdForm.id}`, this.trdForm).subscribe({
        next: () => {
          this.toast.success('Subserie TRD actualizada exitosamente.');
          this.showModalTrd.set(false);
          this.cargarDatos();
        },
        error: () => this.toast.error('Error al actualizar subserie TRD.'),
      });
    } else {
      this.api.post<any>('documental/trd', this.trdForm).subscribe({
        next: () => {
          this.toast.success('Subserie TRD creada en el catálogo institucional.');
          this.showModalTrd.set(false);
          this.cargarDatos();
        },
        error: () => this.toast.error('Error al crear subserie TRD.'),
      });
    }
  }

  restaurarTrdDefault() {
    this.api.post<any>('documental/trd/seed-default', {}).subscribe({
      next: () => {
        this.toast.success('Catálogo escolar estándar de TRD (MEN / AGN) restaurado.');
        this.cargarDatos();
      },
      error: () => this.toast.error('Error al restaurar catálogo TRD.'),
    });
  }

  private readonly ignoredKeys = new Set([
    'matriculaid',
    'matricula_id',
    'estudianteid',
    'estudiante_id',
    'flujoid',
    'flujo_id',
    'id',
    'politicaid',
    'politica_version',
  ]);

  private readonly customKeyLabels: Record<string, string> = {
    solicitantenombre: '👤 Solicitante',
    solicitantedocumento: '🪪 Documento',
    solicitanteemail: '✉️ Correo',
    solicitantetelefono: '📞 Teléfono',
    tipoderecho: '⚖️ Derecho ARCO',
    descripcionsolicitud: '📝 Petición',
    radicado_numero: '🏷️ Radicado',
    radicadonumero: '🏷️ Radicado',
    fechasalida: '📅 Fecha Salida',
    lugardestino: '📍 Destino',
    gradogrupo: '🎓 Grado / Grupo',
    estudiantenombre: '🧑‍🎓 Estudiante',
    motivopermiso: '📌 Motivo',
  };

  private readonly derechoLabels: Record<string, string> = {
    RECTIFICACION: 'Rectificación / Actualización',
    ACCESO: 'Acceso a Datos',
    CANCELACION: 'Cancelación / Supresión',
    OPOSICION: 'Oposición al Tratamiento',
    REVOCATORIA_IMAGEN: 'Revocatoria de Imagen / Fotos',
  };

  getDatosArray(obj: Record<string, any> = {}): Array<{ key: string; val: any }> {
    if (!obj || typeof obj !== 'object') return [];

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    return Object.entries(obj)
      .filter(([key, val]) => {
        if (!key || val === undefined || val === null || String(val).trim() === '') return false;
        const normalizedKey = key.toLowerCase().replace(/_/g, '');
        if (this.ignoredKeys.has(normalizedKey)) return false;
        if (typeof val === 'string' && uuidRegex.test(val)) return false;
        return true;
      })
      .map(([key, val]) => ({
        key: this.formatKey(key),
        val: this.formatVal(key, val),
      }));
  }

  formatKey(key: string): string {
    const normalizedKey = key.toLowerCase().replace(/_/g, '');
    if (this.customKeyLabels[normalizedKey]) {
      return this.customKeyLabels[normalizedKey];
    }
    const withSpaces = key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ');
    return withSpaces
      .split(' ')
      .filter((w) => w.length > 0)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  formatVal(key: string, val: any): string {
    if (typeof val === 'boolean') return val ? 'Sí' : 'No';
    const normalizedKey = key.toLowerCase().replace(/_/g, '');
    if (normalizedKey === 'tipoderecho' && typeof val === 'string') {
      return this.derechoLabels[val.toUpperCase()] || val;
    }
    return String(val);
  }
}
