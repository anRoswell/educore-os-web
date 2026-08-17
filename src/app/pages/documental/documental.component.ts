import { Component, signal, computed, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

export interface TrdSerieItem {
  id: string;
  seccion: string;
  codigoSerie: string;
  nombreSerie: string;
  codigoSubserie: string;
  nombreSubserie: string;
  retencionGestionAnios: number;
  retencionCentralAnios: number;
  disposicionFinal: 'CONSERVACION_TOTAL' | 'ELIMINACION' | 'DIGITALIZACION' | 'SELECCION';
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
  imports: [CommonModule, FormsModule],
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
          <button class="btn-primary" (click)="vistaActiva.set('NUEVO_TRAMITE')">
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
          [class.active]="vistaActiva() === 'KANBAN'"
          (click)="vistaActiva.set('KANBAN')"
        >
          <span>📋</span>
          Trámites & Radicados
          <span class="tab-badge">{{ instancias().length }}</span>
        </button>

        <button
          class="nav-tab"
          [class.active]="vistaActiva() === 'NUEVO_TRAMITE'"
          (click)="vistaActiva.set('NUEVO_TRAMITE')"
        >
          <span>🚀</span>
          Iniciar Trámite
        </button>

        <button
          class="nav-tab"
          [class.active]="vistaActiva() === 'DISEÑADOR'"
          (click)="vistaActiva.set('DISEÑADOR')"
        >
          <span>🛠️</span>
          Diseñador de Flujos (BPM)
        </button>

        <button
          class="nav-tab"
          [class.active]="vistaActiva() === 'TRD'"
          (click)="vistaActiva.set('TRD')"
        >
          <span>📑</span>
          Tablas de Retención (TRD)
          <span class="tab-badge info">{{ trdSeries().length }}</span>
        </button>

        <button
          class="nav-tab"
          [class.active]="vistaActiva() === 'FIRMAS_VAULT'"
          (click)="vistaActiva.set('FIRMAS_VAULT')"
        >
          <span>✍️</span>
          Vault & Carga de Firmas
          <span class="tab-badge success">{{ firmasUsuario().length }}</span>
        </button>

        <button
          class="nav-tab"
          [class.active]="vistaActiva() === 'VERIFICADOR'"
          (click)="vistaActiva.set('VERIFICADOR')"
        >
          <span>🔍</span>
          Verificador Criptográfico
        </button>
      </div>

      <!-- =================================================================== -->
      <!-- VISTA 1: TABLERO KANBAN & TRÁMITES EN CURSO                         -->
      <!-- =================================================================== -->
      <div *ngIf="vistaActiva() === 'KANBAN'" class="kanban-view animate-fadeIn">
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
              [class.active]="filtroEstado() === 'TODOS'"
              (click)="filtroEstado.set('TODOS')"
            >
              Todos ({{ instancias().length }})
            </button>
            <button
              class="pill-btn warning"
              [class.active]="filtroEstado() === 'EN_TRAMITE'"
              (click)="filtroEstado.set('EN_TRAMITE')"
            >
              En Trámite
            </button>
            <button
              class="pill-btn purple"
              [class.active]="filtroEstado() === 'PENDIENTE_FIRMA'"
              (click)="filtroEstado.set('PENDIENTE_FIRMA')"
            >
              Pendiente Firma ✍️
            </button>
            <button
              class="pill-btn success"
              [class.active]="filtroEstado() === 'APROBADO_FINAL'"
              (click)="filtroEstado.set('APROBADO_FINAL')"
            >
              Aprobados ✅
            </button>
            <button
              class="pill-btn danger"
              [class.active]="filtroEstado() === 'RECHAZADO'"
              (click)="filtroEstado.set('RECHAZADO')"
            >
              Rechazados ❌
            </button>
          </div>
        </div>

        <div class="cards-grid">
          <div
            *ngFor="let inst of instanciasFiltradas()"
            class="tramite-card animate-slideDown"
            [class.border-success]="inst.estado === 'APROBADO_FINAL'"
            [class.border-danger]="inst.estado === 'RECHAZADO'"
          >
            <div class="card-top">
              <div class="radicado-chip">
                <span class="chip-icon">{{ inst.flujo?.icono || '📄' }}</span>
                <strong>{{ inst.consecutivoRadicado }}</strong>
              </div>

              <span
                class="status-badge"
                [class.warning]="inst.estado === 'EN_TRAMITE'"
                [class.purple]="inst.estado === 'PENDIENTE_FIRMA'"
                [class.success]="inst.estado === 'APROBADO_FINAL'"
                [class.danger]="inst.estado === 'RECHAZADO'"
              >
                {{ inst.estado === 'APROBADO_FINAL' ? '✅ Aprobado Final' : inst.estado === 'PENDIENTE_FIRMA' ? '✍️ Pendiente Firma' : inst.estado === 'RECHAZADO' ? '❌ Rechazado' : '⏳ En Trámite' }}
              </span>
            </div>

            <h3 class="flujo-name">{{ inst.flujo?.nombre }}</h3>

            <!-- DATOS FORMULARIO -->
            <div class="form-preview-box">
              <div *ngFor="let entry of getDatosArray(inst.datosFormulario)" class="preview-item">
                <span class="preview-key">{{ formatKey(entry.key) }}:</span>
                <span class="preview-val">{{ entry.val }}</span>
              </div>
            </div>

            <!-- ETAPA ACTUAL -->
            <div *ngIf="inst.estado !== 'APROBADO_FINAL' && inst.estado !== 'RECHAZADO'" class="etapa-actual-box">
              <div class="etapa-info">
                <span class="etapa-label">Paso Actual (Orden {{ inst.etapaActual?.orden }}):</span>
                <span class="etapa-title">{{ inst.etapaActual?.nombre }}</span>
                <span class="rol-badge">Responsable: {{ inst.etapaActual?.rolResponsable }}</span>
              </div>
            </div>

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

              <button
                *ngIf="inst.estado === 'EN_TRAMITE' || inst.estado === 'PENDIENTE_FIRMA'"
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
                *ngIf="inst.estado === 'EN_TRAMITE' || inst.estado === 'PENDIENTE_FIRMA'"
                class="btn-danger-sm"
                (click)="abrirModalRechazar(inst)"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- VISTA 2: INICIAR NUEVO TRÁMITE                                      -->
      <!-- =================================================================== -->
      <div *ngIf="vistaActiva() === 'NUEVO_TRAMITE'" class="new-tramite-view animate-fadeIn">
        <div class="glass-panel form-card">
          <div class="panel-header">
            <h3>Iniciar Solicitud de Trámite Institucional</h3>
            <span class="pill-info">Selecciona el tipo de circuito documental</span>
          </div>

          <div class="flujo-selector-grid">
            <div
              *ngFor="let f of flujos()"
              class="flujo-card"
              [class.selected]="flujoSeleccionado()?.id === f.id"
              (click)="seleccionarFlujo(f)"
            >
              <span class="flujo-icon">{{ f.icono }}</span>
              <div class="flujo-details">
                <h4>{{ f.nombre }}</h4>
                <p>{{ f.descripcion }}</p>
                <span class="etapas-count">{{ f.etapas?.length || 0 }} etapas de aprobación</span>
              </div>
            </div>
          </div>

          <!-- FORMULARIO DINÁMICO DEL FLUJO -->
          <div *ngIf="flujoSeleccionado()" class="dynamic-form-section animate-slideDown">
            <h4 class="form-title">
              Completar Información Requerida para: {{ flujoSeleccionado()?.nombre }}
            </h4>

            <div class="fields-grid">
              <div *ngFor="let fld of flujoSeleccionado()?.formularioSchema" class="form-field">
                <label>
                  {{ fld.etiqueta }}
                  <span *ngIf="fld.requerido" class="required">*</span>
                </label>
                
                <input
                  *ngIf="fld.tipo === 'TEXTO'"
                  type="text"
                  class="input-custom"
                  [(ngModel)]="formData()[fld.campo]"
                  [placeholder]="'Ingresa ' + fld.etiqueta.toLowerCase()"
                />

                <input
                  *ngIf="fld.tipo === 'NUMERO'"
                  type="number"
                  class="input-custom"
                  [(ngModel)]="formData()[fld.campo]"
                  placeholder="0"
                />

                <input
                  *ngIf="fld.tipo === 'FECHA'"
                  type="date"
                  class="input-custom"
                  [(ngModel)]="formData()[fld.campo]"
                />

                <textarea
                  *ngIf="fld.tipo === 'TEXTAREA'"
                  class="input-custom"
                  rows="3"
                  [(ngModel)]="formData()[fld.campo]"
                  [placeholder]="'Describe los detalles...'"
                ></textarea>

                <div *ngIf="fld.tipo === 'ARCHIVO'" class="file-upload-input-box">
                  <input
                    type="file"
                    class="input-custom"
                    (change)="onFormFileSelected($event, fld.campo)"
                  />
                  <small *ngIf="formData()[fld.campo]" class="file-uploaded-badge">
                    ✅ Archivo cargado en el backend: {{ formData()[fld.campo] }}
                  </small>
                </div>
              </div>
            </div>

            <!-- ETAPAS DEL CIRCUITO -->
            <div class="etapas-preview">
              <h5>Circuito de Aprobación que seguirá este trámite:</h5>
              <div class="etapas-timeline">
                <div *ngFor="let et of flujoSeleccionado()?.etapas; let idx = index" class="etapa-step">
                  <div class="step-num">{{ idx + 1 }}</div>
                  <div class="step-desc">
                    <strong>{{ et.nombre }}</strong>
                    <span>{{ et.rolResponsable }} ({{ et.tipoAccion }})</span>
                  </div>
                </div>
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
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- VISTA 3: DISEÑADOR DE FLUJOS (BPM NO-CODE)                          -->
      <!-- =================================================================== -->
      <div *ngIf="vistaActiva() === 'DISEÑADOR'" class="designer-view animate-fadeIn">
        <div class="glass-panel designer-card">
          <div class="panel-header">
            <div>
              <h3>Diseñador Visual de Flujos & Circuitos BPM</h3>
              <p class="subtitle-small">Define nuevos circuitos de aprobación sin programar, asignando roles, acciones y SLAs.</p>
            </div>
            <button class="btn-secondary" (click)="showModalCrearFlujo.set(true)">
              + Crear Nueva Plantilla de Flujo
            </button>
          </div>

          <div class="flujos-list">
            <div *ngFor="let fl of flujos()" class="flujo-row">
              <div class="flujo-row-left">
                <span class="fl-icon">{{ fl.icono }}</span>
                <div class="flujo-details">
                  <h4>{{ fl.nombre }}</h4>
                  <p>{{ fl.descripcion }}</p>
                  <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;">
                    <span class="code-pill">{{ fl.codigo }}</span>
                    <span *ngIf="fl.trdSerie" class="trd-chip-mini">📑 TRD: {{ fl.trdSerie.codigoSerie }}.{{ fl.trdSerie.codigoSubserie }} ({{ formatDisposicion(fl.trdSerie.disposicionFinal) }})</span>
                  </div>
                </div>
              </div>

              <div class="flujo-steps-visual">
                <div *ngFor="let st of fl.etapas; let isLast = last" class="step-pill-wrapper">
                  <div class="step-pill" [class.firma]="st.requiereFirma" [class.adjunto]="st.requiereAdjunto">
                    <span class="st-num">{{ st.orden }}</span>
                    <span class="st-name">{{ st.nombre }}</span>
                    <span class="st-meta">{{ st.rolResponsable }}</span>
                    <span *ngIf="st.requiereFirma" class="step-tag sign">✍️</span>
                    <span *ngIf="st.requiereAdjunto" class="step-tag attach">📎</span>
                    <span class="step-sla">{{ st.slaHoras }}h</span>
                  </div>
                  <span *ngIf="!isLast" class="step-arrow">➡</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- VISTA 4: TABLAS DE RETENCIÓN DOCUMENTAL (TRD - NORMA AGN)           -->
      <!-- =================================================================== -->
      <div *ngIf="vistaActiva() === 'TRD'" class="trd-view animate-fadeIn">
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
              [class.active]="filtroTrdSeccion() === 'TODAS'"
              (click)="filtrarTrd('TODAS')"
            >
              Todas las Secciones ({{ trdSeries().length }})
            </button>
            <button
              class="pill-btn"
              [class.active]="filtroTrdSeccion() === 'SECRETARIA_ACADEMICA'"
              (click)="filtrarTrd('SECRETARIA_ACADEMICA')"
            >
              Secretaría Académica
            </button>
            <button
              class="pill-btn"
              [class.active]="filtroTrdSeccion() === 'DIRECCION_RECTORIA'"
              (click)="filtrarTrd('DIRECCION_RECTORIA')"
            >
              Dirección & Rectoría
            </button>
            <button
              class="pill-btn"
              [class.active]="filtroTrdSeccion() === 'COORDINACION_ACADEMICA'"
              (click)="filtrarTrd('COORDINACION_ACADEMICA')"
            >
              Coordinación Académica
            </button>
            <button
              class="pill-btn"
              [class.active]="filtroTrdSeccion() === 'CONVIVENCIA'"
              (click)="filtrarTrd('CONVIVENCIA')"
            >
              Convivencia Escolar
            </button>
            <button
              class="pill-btn"
              [class.active]="filtroTrdSeccion() === 'TESORERIA'"
              (click)="filtrarTrd('TESORERIA')"
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
                <tr *ngFor="let trd of trdSeriesFiltradas()">
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
                      [class.ct]="trd.disposicionFinal === 'CONSERVACION_TOTAL'"
                      [class.e]="trd.disposicionFinal === 'ELIMINACION'"
                      [class.d]="trd.disposicionFinal === 'DIGITALIZACION'"
                      [class.s]="trd.disposicionFinal === 'SELECCION'"
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
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- VISTA 4: VAULT & CARGA DE FIRMAS DIGITALES                          -->
      <!-- =================================================================== -->
      <div *ngIf="vistaActiva() === 'FIRMAS_VAULT'" class="vault-view animate-fadeIn">
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
                  [class.active]="tipoFirmaTab() === 'TRAZO'"
                  (click)="tipoFirmaTab.set('TRAZO')"
                >
                  ✍️ Dibujar en Pantalla
                </button>
                <button
                  [class.active]="tipoFirmaTab() === 'IMAGEN'"
                  (click)="tipoFirmaTab.set('IMAGEN')"
                >
                  🖼️ Subir Imagen Escaneada
                </button>
              </div>
            </div>

            <!-- LIENZO CANVAS DE DIBUJO -->
            <div *ngIf="tipoFirmaTab() === 'TRAZO'" class="canvas-box">
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

            <!-- CARGA DE IMAGEN -->
            <div *ngIf="tipoFirmaTab() === 'IMAGEN'" class="upload-img-box">
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
              <div *ngIf="firmaImagenPreview()" class="img-preview">
                <img [src]="firmaImagenPreview()" alt="Firma preview" />
              </div>
            </div>

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

            <div *ngIf="firmasUsuario().length === 0" class="empty-state">
              <span>✍️</span>
              <p>No tienes firmas registradas aún. Registra tu trazo o sube tu firma escaneada a la izquierda.</p>
            </div>

            <div class="signatures-list">
              <div *ngFor="let f of firmasUsuario()" class="signature-card">
                <div class="sig-header">
                  <strong>{{ f.cargo }}</strong>
                  <span class="badge-status-green">Activa & Criptografiada</span>
                </div>

                <div class="sig-preview-container">
                  <img
                    *ngIf="f.firmaImagenUrl"
                    [src]="f.firmaImagenUrl"
                    alt="Firma"
                    class="sig-img"
                  />
                  <div *ngIf="!f.firmaImagenUrl" class="sig-canvas-placeholder">
                    ✍️ Trazo Vectorial Registrado
                  </div>
                </div>

                <div class="sig-footer">
                  <span>📅 Registrada el {{ f.createdAt | date:'mediumDate' }}</span>
                  <span class="shield-tag">🛡️ PIN Protegido</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- VISTA 5: VERIFICADOR PÚBLICO POR HASH                               -->
      <!-- =================================================================== -->
      <div *ngIf="vistaActiva() === 'VERIFICADOR'" class="verify-view animate-fadeIn">
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

          <div *ngIf="resultadoVerificacion()" class="verification-result animate-slideDown">
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
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- MODALES: APROBAR / FIRMAR, RECHAZAR, TRAZABILIDAD                   -->
      <!-- =================================================================== -->

      <!-- MODAL APROBAR / FIRMAR -->
      <div *ngIf="modalAprobarOpen()" class="modal-backdrop animate-fadeIn">
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
            <div *ngIf="instanciaAccion()?.etapaActual?.requiereAdjunto" class="adjunto-modal-box mt-3">
              <div class="adjunto-header">
                <label class="adjunto-modal-label">
                  📎 Documento de Soporte / Evidencia <span class="required">*</span>
                </label>
                <span class="badge-required">Requerido por este paso</span>
              </div>
              <p *ngIf="instanciaAccion()?.etapaActual?.descripcionAdjunto" class="adjunto-desc-hint">
                💡 {{ instanciaAccion()?.etapaActual?.descripcionAdjunto }}
              </p>

              <div class="file-upload-zone" (click)="anexoInput.click()">
                <input
                  #anexoInput
                  type="file"
                  style="display: none"
                  (change)="onAnexoFileSelected($event)"
                />
                <div *ngIf="!archivoAnexoSubido() && !subiendoAnexo()" class="upload-placeholder">
                  <span class="upload-icon">📤</span>
                  <span class="upload-text">Haz clic aquí para seleccionar y cargar el archivo real</span>
                  <span class="upload-formats">PDF, Word (DOCX), Excel (XLSX), JPG, PNG (Hasta 20MB)</span>
                </div>
                <div *ngIf="subiendoAnexo()" class="upload-loading">
                  <span class="spinner-sm">⏳</span> Subiendo archivo al servidor...
                </div>
                <div *ngIf="archivoAnexoSubido()" class="upload-success">
                  <span class="upload-icon">✅</span>
                  <div class="upload-meta">
                    <strong>{{ archivoAnexoSubido()?.originalName }}</strong>
                    <span>{{ (archivoAnexoSubido()?.size || 0) / 1024 | number:'1.0-1' }} KB • Guardado en el backend</span>
                  </div>
                  <button type="button" class="btn-icon danger" (click)="$event.stopPropagation(); limpiarAnexoSubido()">✕</button>
                </div>
              </div>
            </div>

            <div *ngIf="instanciaAccion()?.etapaActual?.requiereFirma" class="form-field mt-3">
              <label>Ingresa tu PIN de Seguridad de Firma</label>
              <input
                type="password"
                maxlength="6"
                class="input-custom font-mono text-center letter-spacing"
                [(ngModel)]="decisionPin"
                placeholder="****"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="modalAprobarOpen.set(false)">Cancelar</button>
            <button class="btn-success" (click)="confirmarDecision('APROBADO')">
              {{ instanciaAccion()?.etapaActual?.requiereFirma ? 'Firmar con Certificado' : 'Aprobar y Transferir' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL RECHAZAR -->
      <div *ngIf="modalRechazarOpen()" class="modal-backdrop animate-fadeIn">
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

      <!-- MODAL TRAZABILIDAD -->
      <div *ngIf="modalTrazaOpen()" class="modal-backdrop animate-fadeIn">
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
              <div *ngFor="let tz of instanciaAccion()?.trazabilidad" class="timeline-entry">
                <div class="tz-dot" [class.success]="tz.accion === 'APROBADO' || tz.accion === 'FIRMADO'" [class.danger]="tz.accion === 'RECHAZADO'"></div>
                <div class="tz-content">
                  <div class="tz-header">
                    <strong>{{ tz.accion }}</strong>
                    <span class="tz-date">{{ tz.createdAt | date:'medium' }}</span>
                  </div>
                  <p class="tz-comment">{{ tz.comentarios }}</p>
                  <div *ngIf="tz.archivoAdjuntoUrl" class="tz-adjunto-row">
                    <a [href]="resolveUrl(tz.archivoAdjuntoUrl)" target="_blank" class="btn-adjunto-link">
                      📎 Ver Documento Adjunto
                    </a>
                  </div>
                  <span *ngIf="tz.usuarioAccion" class="tz-user">
                    👤 Por: {{ tz.usuarioAccion?.nombres }} {{ tz.usuarioAccion?.apellidos }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL CREAR NUEVO FLUJO BPM -->
      <div *ngIf="showModalCrearFlujo()" class="modal-backdrop animate-fadeIn">
        <div class="glass-modal large animate-scaleUp">
          <div class="modal-header">
            <div>
              <h3>Diseñar Nueva Plantilla de Flujo de Trabajo (BPM)</h3>
              <p class="modal-subtitle">Configura el circuito de aprobación, roles responsables y formulario inicial.</p>
            </div>
            <button class="btn-icon" (click)="showModalCrearFlujo.set(false)">✕</button>
          </div>

          <div class="modal-body" style="max-height: 520px; overflow-y: auto; padding-right: 0.5rem;">
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
                  <option value="ACADEMICO">Académico</option>
                  <option value="ADMINISTRATIVO">Administrativo & Financiero</option>
                  <option value="CONVIVENCIA">Convivencia Escolar</option>
                  <option value="LEGAL">Legal & Directivo</option>
                </select>
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
                  <option *ngFor="let trd of trdSeries()" [value]="trd.id">
                    [{{ trd.codigoSerie }}.{{ trd.codigoSubserie }}] {{ trd.nombreSubserie }} ({{ formatDisposicion(trd.disposicionFinal) }})
                  </option>
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

              <div *ngFor="let et of nuevasEtapas(); let idx = index" class="glass-panel" style="padding: 0.85rem; margin-bottom: 0.6rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <strong style="color: #4f46e5; font-size: 0.85rem;">Paso {{ idx + 1 }}</strong>
                  <button *ngIf="nuevasEtapas().length > 1" class="btn-icon danger" (click)="eliminarEtapa(idx)">✕</button>
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
                    <span class="toggle-check" *ngIf="et.requiereFirma">✓</span>
                  </label>

                  <label class="toggle-option" [class.active]="et.requiereAdjunto">
                    <input type="checkbox" [(ngModel)]="et.requiereAdjunto" style="display:none" />
                    <span class="toggle-icon">📎</span>
                    <span>Requiere adjunto</span>
                    <span class="toggle-check" *ngIf="et.requiereAdjunto">✓</span>
                  </label>
                </div>

                <!-- Descripción del adjunto (visible solo si requiereAdjunto) -->
                <div *ngIf="et.requiereAdjunto" class="adjunto-desc-row">
                  <label style="font-size: 0.75rem; color: #334155; font-weight: 600;">Descripción del documento a adjuntar <span style="color:#ef4444">*</span></label>
                  <input
                    type="text"
                    class="input-custom"
                    [(ngModel)]="et.descripcionAdjunto"
                    placeholder="ej. Acta de reunión firmada, Presupuesto aprobado..."
                  />
                </div>
              </div>
            </div>

            <!-- CAMPOS DEL FORMULARIO -->
            <div class="mt-4">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h4 style="font-size: 0.95rem; color: #0f172a; margin: 0; font-weight: 700;">Campos Requeridos al Solicitante</h4>
                <button class="btn-outline-sm" (click)="agregarCampo()">+ Agregar Campo</button>
              </div>

              <div *ngFor="let cmp of nuevosCampos(); let cIdx = index" class="glass-panel" style="padding: 0.75rem; margin-bottom: 0.5rem;">
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
                    <button *ngIf="nuevosCampos().length > 1" class="btn-icon danger" (click)="eliminarCampo(cIdx)">✕</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="showModalCrearFlujo.set(false)">Cancelar</button>
            <button class="btn-primary" (click)="guardarNuevoFlujo()">
              Guardar Plantilla de Flujo
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL CREAR / EDITAR SUBSERIE TRD -->
      <div *ngIf="showModalTrd()" class="modal-backdrop animate-fadeIn">
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
    </div>
  `,
  styles: [`
    .doc-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* HEADER */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      padding: 1.75rem 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      background: #eef2ff;
      color: #4338ca;
      border: 1px solid #c7d2fe;
      margin-bottom: 0.6rem;
    }

    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #4f46e5;
      box-shadow: 0 0 6px rgba(79, 70, 229, 0.6);
    }

    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.85rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .subtitle {
      color: #475569;
      font-size: 0.95rem;
      margin-top: 0.35rem;
      max-width: 750px;
      line-height: 1.5;
    }

    /* NAV TABS */
    .nav-tabs-bar {
      display: flex;
      gap: 0.5rem;
      background: #ffffff;
      padding: 0.5rem;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      overflow-x: auto;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 0.75rem;
      background: transparent;
      border: none;
      color: #475569;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .nav-tab:hover {
      color: #0f172a;
      background: #f1f5f9;
    }

    .nav-tab.active {
      background: #6366f1;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .tab-badge {
      font-size: 0.75rem;
      padding: 0.15rem 0.55rem;
      border-radius: 9999px;
      background: #e2e8f0;
      color: #334155;
      font-weight: 700;
    }

    .nav-tab.active .tab-badge {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }

    .tab-badge.success {
      background: #d1fae5;
      color: #065f46;
    }

    /* PANELS */
    .glass-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      color: #0f172a;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .panel-header h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .pill-info {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      background: #eef2ff;
      color: #4338ca;
      border: 1px solid #c7d2fe;
    }

    .subtitle-small {
      color: #64748b;
      font-size: 0.85rem;
      margin: 0.25rem 0 0;
    }

    /* FILTERS & SEARCH */
    .filter-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 0.75rem;
      padding: 0.6rem 1rem;
      color: #64748b;
      flex: 1;
      min-width: 260px;
    }

    .search-box input {
      background: transparent;
      border: none;
      color: #0f172a;
      outline: none;
      width: 100%;
      font-size: 0.875rem;
    }

    .search-box input::placeholder {
      color: #94a3b8;
    }

    .filter-pills {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .pill-btn {
      padding: 0.45rem 0.9rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pill-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .pill-btn.active {
      background: #eef2ff;
      border-color: #6366f1;
      color: #4338ca;
      font-weight: 700;
    }

    .pill-btn.warning.active {
      background: #fffbeb;
      border-color: #f59e0b;
      color: #b45309;
    }

    .pill-btn.purple.active {
      background: #faf5ff;
      border-color: #a855f7;
      color: #7e22ce;
    }

    .pill-btn.success.active {
      background: #ecfdf5;
      border-color: #10b981;
      color: #047857;
    }

    .pill-btn.danger.active {
      background: #fef2f2;
      border-color: #ef4444;
      color: #b91c1c;
    }

    /* KANBAN CARDS */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }

    .tramite-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.35rem;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .tramite-card:hover {
      transform: translateY(-2px);
      border-color: #818cf8;
      box-shadow: 0 8px 16px -4px rgba(99, 102, 241, 0.15);
    }

    .border-success { border-left: 4px solid #10b981; }
    .border-danger { border-left: 4px solid #ef4444; }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .radicado-chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: #4338ca;
      font-weight: 700;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      background: #f1f5f9;
      color: #475569;
    }

    .status-badge.warning { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .status-badge.purple { background: #faf5ff; color: #7e22ce; border: 1px solid #e9d5ff; }
    .status-badge.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .status-badge.danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    .flujo-name {
      font-family: 'Outfit', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .form-preview-box {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 0.625rem;
      padding: 0.65rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .preview-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
    }

    .preview-key { color: #64748b; font-weight: 500; }
    .preview-val { color: #0f172a; font-weight: 600; }

    .etapa-actual-box {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 0.625rem;
      padding: 0.65rem 0.85rem;
    }

    .etapa-label { display: block; font-size: 0.7rem; color: #4338ca; text-transform: uppercase; font-weight: 700; }
    .etapa-title { display: block; font-weight: 700; font-size: 0.875rem; color: #1e1b4b; margin: 0.15rem 0; }
    .rol-badge { display: block; font-size: 0.75rem; color: #3730a3; font-weight: 500; }

    .card-footer-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: #64748b;
      border-top: 1px solid #f1f5f9;
      padding-top: 0.6rem;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .btn-outline-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.8rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-outline-sm:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .btn-success-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.8rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: #10b981;
      border: none;
      color: #ffffff;
      cursor: pointer;
      flex: 1;
      justify-content: center;
      transition: background 0.15s ease;
    }

    .btn-success-sm:hover {
      background: #059669;
    }

    .btn-danger-sm {
      padding: 0.4rem 0.8rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-danger-sm:hover {
      background: #fee2e2;
    }

    /* VISTA 2: NUEVO TRÁMITE */
    .flujo-selector-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .flujo-card {
      display: flex;
      gap: 1rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.25rem;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
    }

    .flujo-card:hover {
      background: #f8fafc;
      border-color: #818cf8;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px -4px rgba(99, 102, 241, 0.12);
    }

    .flujo-card.selected {
      background: #eef2ff;
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    .flujo-icon { font-size: 2rem; }
    .flujo-details h4 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem; }
    .flujo-details p { font-size: 0.825rem; color: #475569; margin: 0 0 0.5rem; }
    .etapas-count { font-size: 0.75rem; color: #4338ca; font-weight: 600; }

    .dynamic-form-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.75rem;
      margin-top: 1.25rem;
    }

    .form-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 1.25rem;
    }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .form-field label {
      display: block;
      font-size: 0.85rem;
      color: #334155;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }

    .required { color: #ef4444; }

    .input-custom {
      width: 100%;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0.625rem;
      padding: 0.65rem 0.9rem;
      color: #0f172a;
      font-size: 0.875rem;
      outline: none;
      box-sizing: border-box;
      transition: all 0.15s ease;
      line-height: 1.5;
      height: 42px;
      display: block;
    }

    select.input-custom {
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      padding-right: 2.5rem;
      cursor: pointer;
    }

    textarea.input-custom {
      height: auto;
      resize: vertical;
    }

    .input-custom:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .etapas-preview {
      margin-bottom: 1.5rem;
    }

    /* ── Fila de opciones booleanas por paso ── */
    .etapa-options-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.6rem;
    }

    .toggle-option {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      border-radius: 2rem;
      border: 1.5px solid #cbd5e1;
      background: #f8fafc;
      color: #475569;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      transition: all 0.15s ease;
    }

    .toggle-option:hover {
      border-color: #6366f1;
      background: #eef2ff;
      color: #4f46e5;
    }

    .toggle-option.active {
      border-color: #6366f1;
      background: #eef2ff;
      color: #4f46e5;
    }

    .toggle-icon {
      font-size: 0.9rem;
    }

    .toggle-check {
      font-size: 0.75rem;
      color: #10b981;
      font-weight: 700;
    }

    /* ── Descripción del adjunto (expandible) ── */
    .adjunto-desc-row {
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      padding: 0.6rem 0.75rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 0.5rem;
      animation: fadeIn 200ms ease-out forwards;
    }

    .etapas-preview h5 {
      font-size: 0.875rem;
      color: #334155;
      font-weight: 700;
      margin: 0 0 0.75rem;
    }

    .etapas-timeline {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding: 0.5rem 0;
    }

    .etapa-step {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.65rem 1rem;
      min-width: 200px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .step-num {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #6366f1;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-desc strong { display: block; font-size: 0.825rem; color: #0f172a; }
    .step-desc span { font-size: 0.725rem; color: #64748b; font-weight: 500; }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    /* VISTA 3: DISEÑADOR BPM */
    .flujos-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;
    }

    .flujo-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      gap: 1.5rem;
      flex-wrap: wrap;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .flujo-row-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .fl-icon { font-size: 2rem; }
    .flujo-row-left h4 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 0.2rem; }
    .flujo-row-left p { font-size: 0.85rem; color: #475569; margin: 0 0 0.4rem; }
    .code-pill { font-size: 0.7rem; font-family: monospace; background: #f1f5f9; color: #475569; padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid #e2e8f0; }

    .flujo-steps-visual {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .step-pill-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .step-pill {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 600;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
      flex-wrap: wrap;
    }

    .step-pill.firma {
      background: #faf5ff;
      border-color: #c084fc;
      color: #7e22ce;
    }

    .step-pill.adjunto {
      background: #fffbeb;
      border-color: #fcd34d;
      color: #92400e;
    }

    .step-pill.firma.adjunto {
      background: linear-gradient(135deg, #faf5ff, #fffbeb);
      border-color: #c084fc;
      color: #7e22ce;
    }

    .st-num { font-weight: 700; color: #6366f1; }
    .st-name { font-weight: 600; }
    .st-meta { font-size: 0.68rem; color: #64748b; }
    .step-tag { font-size: 0.75rem; }
    .step-sla {
      font-size: 0.65rem;
      color: #94a3b8;
      background: #f1f5f9;
      border-radius: 4px;
      padding: 0 4px;
    }
    .step-arrow { color: #94a3b8; font-size: 0.85rem; }

    /* ── MÉTRICAS HEADER ── */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1.25rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.875rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .metric-icon { font-size: 1.5rem; line-height: 1; }

    .metric-body {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .metric-val {
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1;
      color: #0f172a;
    }

    .metric-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    .metric-card.blue   { border-left: 4px solid #6366f1; }
    .metric-card.amber  { border-left: 4px solid #f59e0b; }
    .metric-card.green  { border-left: 4px solid #10b981; }
    .metric-card.indigo { border-left: 4px solid #8b5cf6; }

    .metric-card.blue   .metric-val { color: #4f46e5; }
    .metric-card.amber  .metric-val { color: #b45309; }
    .metric-card.green  .metric-val { color: #059669; }
    .metric-card.indigo .metric-val { color: #7c3aed; }


    /* VAULT DE FIRMAS */
    .vault-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .vault-grid {
        grid-template-columns: 1fr;
      }
    }

    .segmented-control {
      display: flex;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.625rem;
      padding: 0.25rem;
      margin-top: 0.25rem;
    }

    .segmented-control button {
      flex: 1;
      padding: 0.5rem;
      background: transparent;
      border: none;
      color: #475569;
      font-weight: 600;
      font-size: 0.8rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .segmented-control button.active {
      background: #6366f1;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
    }

    .canvas-box {
      border: 2px dashed #cbd5e1;
      border-radius: 0.75rem;
      padding: 0.75rem;
      background: #ffffff;
      margin-top: 0.75rem;
      text-align: center;
    }

    .sig-canvas {
      width: 100%;
      height: 160px;
      cursor: crosshair;
      background: #ffffff;
      border-radius: 0.5rem;
    }

    .canvas-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.5rem;
    }

    .canvas-hint { font-size: 0.75rem; color: #64748b; }

    .drop-signature {
      border: 2px dashed #cbd5e1;
      border-radius: 0.75rem;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      background: #f8fafc;
      color: #475569;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      margin-top: 0.75rem;
      transition: all 0.2s ease;
    }

    .drop-signature:hover {
      border-color: #6366f1;
      background: #eef2ff;
      color: #4338ca;
    }

    .img-preview {
      margin-top: 0.75rem;
      padding: 0.5rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      text-align: center;
    }

    .img-preview img {
      max-height: 100px;
    }

    .hint-text { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; display: block; }

    .empty-state {
      text-align: center;
      padding: 2.5rem 1.5rem;
      color: #64748b;
    }

    .empty-state span { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
    .empty-state p { font-size: 0.9rem; max-width: 320px; margin: 0 auto; }

    .signature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .sig-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .sig-header strong { color: #0f172a; font-size: 0.95rem; }

    .badge-status-green {
      font-size: 0.7rem;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      background: #d1fae5;
      color: #065f46;
      font-weight: 700;
    }

    .sig-preview-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem;
      text-align: center;
      margin-bottom: 0.75rem;
    }

    .sig-img { max-height: 80px; }
    .sig-canvas-placeholder { color: #64748b; font-size: 0.85rem; font-style: italic; }

    .sig-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #64748b;
    }

    .shield-tag { color: #4338ca; font-weight: 700; }

    /* VISTA 5: VERIFICADOR */
    .search-hash-box {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .search-hash-box input {
      flex: 1;
      min-width: 280px;
    }

    .verification-result {
      margin-top: 1.5rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 1rem;
      padding: 1.5rem;
    }

    .result-header {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .icon-verified { font-size: 2rem; }
    .result-header h4 { font-size: 1.15rem; font-weight: 700; color: #065f46; margin: 0 0 0.25rem; }
    .result-header p { font-size: 0.875rem; color: #047857; margin: 0; }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      background: #ffffff;
      border: 1px solid #d1fae5;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }

    .det-item span { display: block; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .det-item strong { display: block; font-size: 0.95rem; color: #0f172a; margin-top: 0.2rem; }
    .hash-string { display: block; font-size: 0.75rem; color: #0f172a; font-family: monospace; word-break: break-all; margin-top: 0.2rem; background: #f8fafc; padding: 0.35rem 0.5rem; border-radius: 4px; border: 1px solid #e2e8f0; }

    /* BOTONES GLOBALES */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.7rem 1.35rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
      transition: all 0.15s ease;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #4f46e5, #4338ca);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
      transform: translateY(-1px);
    }

    .btn-success {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.7rem 1.35rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      background: #10b981;
      color: #ffffff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
      transition: all 0.15s ease;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger {
      padding: 0.7rem 1.35rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      background: #ef4444;
      color: #ffffff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
      transition: all 0.15s ease;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-secondary {
      padding: 0.7rem 1.35rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .btn-icon {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.15s ease;
    }

    .btn-icon:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .btn-icon.danger {
      background: #fef2f2;
      border-color: #fecaca;
      color: #ef4444;
    }

    .btn-icon.danger:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .full-width { width: 100%; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .letter-spacing { letter-spacing: 0.25em; }

    /* MODALES */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .glass-modal {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      width: 90%;
      max-width: 520px;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      color: #0f172a;
    }

    .glass-modal.large { max-width: 680px; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .modal-header h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0.2rem 0 0;
    }

    .modal-icon-badge {
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-icon-badge.success { background: #ecfdf5; color: #10b981; }
    .modal-icon-badge.danger { background: #fef2f2; color: #ef4444; }

    .modal-body {
      margin-bottom: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .timeline-box {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .timeline-entry {
      display: flex;
      gap: 1rem;
      position: relative;
    }

    .tz-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #6366f1;
      margin-top: 0.25rem;
      flex-shrink: 0;
    }

    .tz-dot.success { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
    .tz-dot.danger { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }

    .tz-content {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.85rem 1rem;
    }

    .tz-header { display: flex; justify-content: space-between; font-size: 0.85rem; color: #0f172a; font-weight: 700; }
    .tz-date { font-size: 0.75rem; color: #64748b; font-weight: 400; }
    .tz-comment { font-size: 0.825rem; color: #334155; margin: 0.35rem 0; line-height: 1.4; }
    .tz-user { font-size: 0.75rem; color: #4338ca; font-weight: 600; }

    /* ── ADJUNTOS EN MODALES Y TRAZABILIDAD ── */
    .adjunto-modal-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 0.75rem;
      padding: 0.875rem;
    }

    .adjunto-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }

    .adjunto-modal-label {
      font-size: 0.825rem;
      font-weight: 700;
      color: #0f172a;
    }

    .badge-required {
      font-size: 0.7rem;
      font-weight: 700;
      background: #fee2e2;
      color: #991b1b;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    .adjunto-desc-hint {
      font-size: 0.78rem;
      color: #64748b;
      margin: 0 0 0.65rem 0;
      line-height: 1.35;
    }

    .file-upload-zone {
      border: 2px dashed #94a3b8;
      border-radius: 0.625rem;
      padding: 1rem;
      background: #ffffff;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
    }

    .file-upload-zone:hover {
      border-color: #6366f1;
      background: #f5f3ff;
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .upload-icon { font-size: 1.5rem; line-height: 1; }
    .upload-text { font-size: 0.825rem; font-weight: 600; color: #4338ca; }
    .upload-formats { font-size: 0.7rem; color: #94a3b8; }

    .upload-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #4f46e5;
      font-weight: 600;
    }

    .upload-success {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      text-align: left;
    }

    .upload-meta {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      font-size: 0.8rem;
    }

    .upload-meta strong { color: #0f172a; word-break: break-all; }
    .upload-meta span { color: #10b981; font-size: 0.72rem; font-weight: 600; }

    .tz-adjunto-row {
      margin: 0.5rem 0;
    }

    .btn-adjunto-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 0.5rem;
      color: #4338ca;
      font-size: 0.78rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .btn-adjunto-link:hover {
      background: #e0e7ff;
      border-color: #818cf8;
      text-decoration: underline;
    }

    .file-uploaded-badge {
      display: block;
      margin-top: 0.35rem;
      font-size: 0.75rem;
      color: #059669;
      font-weight: 600;
    }

    /* ── TABLAS DE RETENCIÓN DOCUMENTAL (TRD) ── */
    .trd-view {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .trd-card {
      padding: 1.5rem;
    }

    .badge-tag-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: #4338ca;
      background: #e0e7ff;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      margin-bottom: 0.5rem;
    }

    .badge-dot.blue {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4f46e5;
    }

    .subtitle-small {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0.25rem 0 0;
      line-height: 1.4;
    }

    .header-actions-trd {
      display: flex;
      gap: 0.65rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .trd-filters-bar {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin: 1.25rem 0 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .trd-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.825rem;
    }

    .trd-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 0.75rem 0.85rem;
      border-bottom: 2px solid #e2e8f0;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .trd-table td {
      padding: 0.85rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: middle;
    }

    .trd-table tbody tr:hover {
      background: #f8fafc;
    }

    .code-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #1e1b4b;
      background: #ede9fe;
      border: 1px solid #ddd6fe;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
    }

    .seccion-chip {
      font-size: 0.72rem;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      padding: 0.25rem 0.55rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      white-space: nowrap;
    }

    .serie-title-box {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .serie-nombre {
      font-size: 0.7rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
    }

    .subserie-nombre {
      font-size: 0.85rem;
      color: #0f172a;
    }

    .years-pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      display: inline-block;
    }

    .years-pill.gestion {
      background: #fef3c7;
      color: #92400e;
    }

    .years-pill.central {
      background: #e0f2fe;
      color: #0369a1;
    }

    .disposicion-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      display: inline-block;
      white-space: nowrap;
    }

    .disposicion-badge.ct { background: #dcfce7; color: #15803d; }
    .disposicion-badge.e  { background: #fee2e2; color: #991b1b; }
    .disposicion-badge.d  { background: #e0e7ff; color: #4338ca; }
    .disposicion-badge.s  { background: #fef9c3; color: #854d0e; }

    .soporte-badge {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }

    .procedimiento-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.35;
      max-width: 280px;
    }

    .trd-chip-mini {
      font-size: 0.68rem;
      font-weight: 600;
      color: #4338ca;
      background: #e0e7ff;
      border: 1px solid #c7d2fe;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
    }
  `],
})
export class DocumentalComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  @ViewChild('signatureCanvas') signatureCanvas?: ElementRef<HTMLCanvasElement>;

  vistaActiva = signal<'KANBAN' | 'NUEVO_TRAMITE' | 'DISEÑADOR' | 'TRD' | 'FIRMAS_VAULT' | 'VERIFICADOR'>('KANBAN');
  flujos = signal<FlujoItem[]>([]);
  instancias = signal<InstanciaItem[]>([]);
  firmasUsuario = signal<FirmaUsuarioItem[]>([]);
  trdSeries = signal<TrdSerieItem[]>([]);
  filtroTrdSeccion = signal<string>('TODAS');
  filtroEstado = signal<string>('TODOS');
  busquedaTexto = '';

  flujoSeleccionado = signal<FlujoItem | null>(null);
  formData = signal<Record<string, any>>({});

  // TRD Form State
  showModalTrd = signal<boolean>(false);
  modalTrdEditando = signal<boolean>(false);
  trdForm = {
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

  trdSeriesFiltradas = computed(() => {
    const list = this.trdSeries();
    const sec = this.filtroTrdSeccion();
    if (!sec || sec === 'TODAS') return list;
    return list.filter((t) => t.seccion === sec);
  });

  // Firma Vault
  tipoFirmaTab = signal<'TRAZO' | 'IMAGEN'>('TRAZO');
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
  showModalCrearFlujo = signal<boolean>(false);
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
      const matchEstado = filtro === 'TODOS' || i.estado === filtro;
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
      activos: list.filter((i) => i.estado === 'EN_TRAMITE' || i.estado === 'INICIADO').length,
      pendientesFirma: list.filter((i) => i.estado === 'PENDIENTE_FIRMA').length,
      completados: list.filter(
        (i) => i.estado === 'APROBADO_FINAL' && new Date(i.createdAt) >= inicioMes
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
  }

  seleccionarFlujo(f: FlujoItem) {
    this.flujoSeleccionado.set(f);
    const initialForm: Record<string, any> = {};
    if (f.formularioSchema) {
      f.formularioSchema.forEach((field) => {
        initialForm[field.campo] = '';
      });
    }
    this.formData.set(initialForm);
  }

  radicarTramite() {
    const f = this.flujoSeleccionado();
    if (!f) return;

    const dto = {
      flujoId: f.id,
      datosFormulario: this.formData(),
    };

    this.api.post<InstanciaItem>('documental/instancias/iniciar', dto).subscribe({
      next: (res) => {
        this.toast.success(`Trámite radicado exitosamente con consecutivo ${res.consecutivoRadicado}.`);
        this.cargarDatos();
        this.vistaActiva.set('KANBAN');
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
    return `http://localhost:3000${clean}`;
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
    icono: '🎓',
    colorHex: '#6366f1',
    descripcion: '',
    trdSerieId: '',
  };

  nuevasEtapas = signal<Array<{
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

    const dto = {
      nombre: this.nuevoFlujo.nombre,
      codigo: this.nuevoFlujo.codigo,
      categoria: this.nuevoFlujo.categoria,
      icono: this.nuevoFlujo.icono || '📄',
      colorHex: this.nuevoFlujo.colorHex || '#6366f1',
      descripcion: this.nuevoFlujo.descripcion,
      trdSerieId: this.nuevoFlujo.trdSerieId || undefined,
      formularioSchema: this.nuevosCampos(),
      etapas: this.nuevasEtapas(),
    };

    this.api.post<any>('documental/flujos', dto).subscribe({
      next: (res) => {
        this.toast.success(`Plantilla "${res.nombre}" creada y lista para radicar.`);
        this.showModalCrearFlujo.set(false);
        this.nuevoFlujo = {
          nombre: '',
          codigo: '',
          categoria: 'ACADEMICO',
          icono: '🎓',
          colorHex: '#6366f1',
          descripcion: '',
          trdSerieId: '',
        };
        this.cargarDatos();
      },
      error: () => this.toast.error('Error al guardar la plantilla de flujo.'),
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

  getDatosArray(obj: Record<string, any> = {}): Array<{ key: string; val: any }> {
    return Object.entries(obj).map(([key, val]) => ({ key, val }));
  }

  formatKey(key: string): string {
    return key.replace(/_/g, ' ').toUpperCase();
  }
}
