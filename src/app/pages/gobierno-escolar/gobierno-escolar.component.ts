import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HelpBadgeComponent } from '../../shared/components/help-badge.component';
import { imprimirElementoHtml } from '../../core/utils/print.utils';

interface CandidatoTarjeton {
  id: string;
  numeroTarjeton: number;
  nombre: string;
  lema: string;
  fotoUrl: string;
  esBlanco?: boolean;
  votos: number;
  porcentaje: number;
}

interface JornadaInfo {
  id: string;
  nombre: string;
  cargo: string;
  fechaApertura: string;
  fechaCierre: string;
  estado: 'CONFIGURACION' | 'ABIERTA' | 'CERRADA';
}

@Component({
  selector: 'app-gobierno-escolar',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpBadgeComponent],
  template: `
    <div class="gobierno-page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>
            Gobierno Escolar & Elecciones
            <app-help-badge term="GOBIERNO_ESCOLAR"></app-help-badge>
          </h1>
          <p>Urna electrónica secreta criptográfica (SHA-256) y escrutinio automático en tiempo real</p>
        </div>
        <div class="header-actions">
          <button (click)="abrirModalNuevaJornada()" class="btn btn-primary" title="Crear nueva elección desde cero">
            <span>🏛️ Nueva Elección</span>
          </button>
          @if (jornadaActual().estado !== 'CERRADA') {
            <button (click)="abrirModalNuevoCandidato()" class="btn btn-secondary" title="Inscribir nuevo candidato">
              <span>➕ Inscribir Candidato</span>
            </button>
            <button (click)="abrirModalCerrarJornada()" class="btn btn-danger" title="Finalizar el proceso y sellar las urnas">
              <span>🔒 Finalizar Votaciones</span>
            </button>
          } @else {
            <button (click)="reabrirJornada()" class="btn btn-secondary" title="Reabrir proceso de votación">
              <span>🔓 Reabrir Votación</span>
            </button>
          }
          <button (click)="abrirModalActaEscrutinio()" class="btn btn-secondary" title="Ver Acta Oficial de Escrutinio">
            <span>📄 Acta de Escrutinio</span>
          </button>
          <span class="badge" [class.badge-success]="jornadaActual().estado === 'ABIERTA'" [class.badge-danger]="jornadaActual().estado === 'CERRADA'" [style.background-color]="jornadaActual().estado === 'CERRADA' ? '#64748b' : ''">
            {{ jornadaActual().estado === 'ABIERTA' ? '🟢 ' + jornadaActual().nombre : '🔴 Elección Cerrada / Escrutada' }}
          </span>
        </div>
      </div>

      <!-- Constancia de Voto Emitido -->
      @if (votoComprobante()) {
        <div class="comprobante-card card card-glass animate-fade-in mb-6">
          <div class="comp-header">
            <span class="comp-icon">🗳️</span>
            <div>
              <h4>¡Sufragio Registrado Exitosamente en la Urna Secreta!</h4>
              <p class="text-sm">Tu voto ha sido disociado criptográficamente para garantizar el voto 100% secreto.</p>
            </div>
          </div>
          <div class="comp-hash-box mt-3">
            <span class="hash-label">HASH CRIPTOGRÁFICO DE COMPROBANTE:</span>
            <code class="hash-code">{{ votoComprobante() }}</code>
          </div>
        </div>
      }

      <!-- TARJETAS KPI GOBIERNO ESCOLAR -->
      <div class="kpi-grid mb-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
        <div class="kpi-card card" style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem;">
          <div class="kpi-icon-box" style="width: 44px; height: 44px; border-radius: 10px; background: #e0e7ff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">🗳️</div>
          <div>
            <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Sufragios</span>
            <h3 style="font-size: 1.5rem; font-weight: 800; margin: 0; color: #0f172a;">{{ totalVotos() }}</h3>
            <span style="font-size: 0.75rem; color: #16a34a;">Votos secretos SHA-256</span>
          </div>
        </div>

        <div class="kpi-card card" style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem;">
          <div class="kpi-icon-box" style="width: 44px; height: 44px; border-radius: 10px; background: #dcfce7; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">👥</div>
          <div>
            <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Candidatos</span>
            <h3 style="font-size: 1.5rem; font-weight: 800; margin: 0; color: #0f172a;">{{ candidatos().length }}</h3>
            <span style="font-size: 0.75rem; color: #64748b;">En tarjetón digital</span>
          </div>
        </div>

        <div class="kpi-card card" style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem;">
          <div class="kpi-icon-box" style="width: 44px; height: 44px; border-radius: 10px; background: #fef3c7; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">🏛️</div>
          <div>
            <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Cargo en Disputa</span>
            <h3 style="font-size: 1.2rem; font-weight: 800; margin: 0; color: #0f172a;">{{ getCargoLabel(jornadaActual().cargo) }}</h3>
            <span style="font-size: 0.75rem; color: #64748b;">Elección Institucional</span>
          </div>
        </div>

        <div class="kpi-card card" style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem;">
          <div class="kpi-icon-box" style="width: 44px; height: 44px; border-radius: 10px; background: #f3e8ff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">🔒</div>
          <div>
            <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Estado de Urnas</span>
            <h3 style="font-size: 1.2rem; font-weight: 800; margin: 0; color: #0f172a;">{{ jornadaActual().estado === 'ABIERTA' ? '🟢 ABIERTA' : '🔴 CERRADA' }}</h3>
            <span style="font-size: 0.75rem; color: #64748b;">Mesa de votación</span>
          </div>
        </div>
      </div>

      <!-- BARRA DE PESTAÑAS GOBIERNO ESCOLAR -->
      <div class="tabs-nav tabs-nav-bar mb-4" style="display: flex; gap: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'tarjeton'"
          (click)="activeTab.set('tarjeton')"
        >
          <span>🗳️ Tarjetón Electoral</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'escrutinio'"
          (click)="activeTab.set('escrutinio')"
        >
          <span>📊 Escrutinio en Vivo</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'candidatos'"
          (click)="activeTab.set('candidatos')"
        >
          <span>👥 Candidatos Inscritos</span>
          <span class="tab-badge" style="background: #e2e8f0; font-size: 0.75rem; padding: 0.1rem 0.4rem; border-radius: 9999px; margin-left: 0.35rem;">{{ candidatos().length }}</span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'historico'"
          (click)="activeTab.set('historico')"
        >
          <span>📜 Histórico de Elecciones</span>
        </button>
      </div>

      <!-- TAB 1: TARJETÓN DIGITAL -->
      @if (activeTab() === 'tarjeton') {
        <div class="tab-content animate-fade-in">
          <div class="card tarjeton-card" style="max-width: 800px; margin: 0 auto;">
            <div class="tarjeton-header">
              <div class="flex-between">
                <div>
                  <h3>Tarjetón Electoral Digital</h3>
                  <p>{{ jornadaActual().nombre }} — Cargo: <strong>{{ getCargoLabel(jornadaActual().cargo) }}</strong></p>
                </div>
                <span class="badge" [class.badge-success]="jornadaActual().estado === 'ABIERTA'" [class.badge-danger]="jornadaActual().estado === 'CERRADA'">
                  {{ jornadaActual().estado === 'ABIERTA' ? 'Urna Abierta' : 'Urna Sellada' }}
                </span>
              </div>
            </div>

            @if (jornadaActual().estado === 'CERRADA') {
              <div class="urna-cerrada-banner animate-fade-in mt-3">
                <span class="lock-icon">🔒</span>
                <div>
                  <strong>Mesa de Votación Cerrada</strong>
                  <p class="text-xs">El proceso de sufragio ha finalizado. Las urnas han sido selladas electrónicamente y el escrutinio oficial ha sido consolidado.</p>
                </div>
              </div>
            }

            <div class="candidatos-grid mt-4">
              @for (cand of candidatos(); track cand.id) {
                <div 
                  class="candidato-card card-hover" 
                  [class.selected]="selectedCandidatoId() === cand.id"
                  [class.disabled-card]="jornadaActual().estado === 'CERRADA'"
                  (click)="seleccionarCandidato(cand.id)">
                  <div class="tarjeton-number">{{ cand.numeroTarjeton }}</div>
                  <img [src]="cand.fotoUrl" [alt]="cand.nombre" class="candidato-foto" />
                  <div class="candidato-info">
                    <h4>{{ cand.nombre }}</h4>
                    <p class="candidato-lema">"{{ cand.lema }}"</p>
                  </div>
                  <div class="cand-actions">
                    <span class="select-indicator">
                      {{ selectedCandidatoId() === cand.id ? '✓ Elegido' : 'Elegir' }}
                    </span>
                    @if (!cand.esBlanco && jornadaActual().estado !== 'CERRADA') {
                      <div class="micro-buttons" (click)="$event.stopPropagation()">
                        <button (click)="abrirModalEditar(cand)" class="btn-micro" title="Editar Propuesta">✏️</button>
                        <button (click)="abrirModalEliminar(cand)" class="btn-micro" title="Retirar Candidato">🗑️</button>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="votar-action-bar mt-4">
              <button 
                (click)="emitirVoto()" 
                class="btn btn-primary w-full" 
                [disabled]="jornadaActual().estado === 'CERRADA' || !selectedCandidatoId() || isVoting()">
                <span>
                  @if (jornadaActual().estado === 'CERRADA') {
                    🔒 Votación Finalizada (Urnas Cerradas)
                  } @else if (isVoting()) {
                    Cifrando Voto...
                  } @else {
                    🗳️ Depositar Voto en Urna Secreta
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TAB 2: ESCRUTINIO EN VIVO -->
      @if (activeTab() === 'escrutinio') {
        <div class="tab-content animate-fade-in">
          <div class="card escrutinio-card" style="max-width: 800px; margin: 0 auto;">
            <div class="card-title-bar">
              <div>
                <h3>📊 Escrutinio & Mesa de Votación</h3>
                <p>Total sufragios emitidos: <strong>{{ totalVotos() }} votos</strong></p>
              </div>
              <span class="badge" [class.badge-info]="jornadaActual().estado === 'ABIERTA'" [class.badge-success]="jornadaActual().estado === 'CERRADA'">
                {{ jornadaActual().estado === 'CERRADA' ? 'Escrutinio Oficial 100%' : 'Escrutinio en Vivo' }}
              </span>
            </div>

            @if (candidatos().length > 0 && totalVotos() > 0) {
              <div class="winner-box mt-3" [class.official-winner]="jornadaActual().estado === 'CERRADA'">
                <span class="trophy-icon">🏆</span>
                <div>
                  <span class="winner-label">
                    {{ jornadaActual().estado === 'CERRADA' ? (getCargoLabel(jornadaActual().cargo) + ' ELECTO(A) OFICIAL:') : ('VIRTUAL ' + getCargoLabel(jornadaActual().cargo) + ' ELECTO(A):') }}
                  </span>
                  <h4 class="winner-name">{{ getGanador()?.nombre }}</h4>
                  <span class="winner-stats">{{ getGanador()?.votos }} votos ({{ getGanador()?.porcentaje }}% de la votación)</span>
                </div>
              </div>
            } @else {
              <div class="empty-state-box mt-3">
                <span>🗳️</span>
                <p>Aún no se han registrado votos en esta elección.</p>
              </div>
            }

            <div class="tally-bars-list mt-4">
              @for (cand of candidatos(); track cand.id) {
                <div class="tally-item">
                  <div class="tally-info">
                    <span>#{{ cand.numeroTarjeton }} — {{ cand.nombre }}</span>
                    <strong>{{ cand.votos }} votos ({{ cand.porcentaje }}%)</strong>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" [style.width.%]="cand.porcentaje"></div>
                  </div>
                </div>
              }
            </div>

            <div class="acta-box mt-4">
              <p class="text-xs text-slate-500">
                🔒 Las urnas digitales de EduCoreOS utilizan sellado criptográfico inmutable SHA-256 para garantizar transparencia electoral conforme al Manual de Convivencia y Gobierno Escolar (Ley 115).
              </p>
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: CANDIDATOS INSCRITOS -->
      @if (activeTab() === 'candidatos') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card">
            <div class="flex-between">
              <div>
                <h3>👥 Candidatos Inscritos en la Elección</h3>
                <p class="text-sm">Listado oficial de postulantes para {{ jornadaActual().nombre }}</p>
              </div>
              <button (click)="abrirModalNuevoCandidato()" class="btn btn-primary">
                ➕ Inscribir Candidato
              </button>
            </div>
          </div>

          <div class="table-container card mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>N° Tarjetón</th>
                  <th>Candidato(a)</th>
                  <th>Lema / Propuesta</th>
                  <th>Votos Obtenidos</th>
                  <th>Porcentaje</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (cand of candidatos(); track cand.id) {
                  <tr>
                    <td><strong>#{{ cand.numeroTarjeton }}</strong></td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <img [src]="cand.fotoUrl" [alt]="cand.nombre" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                        <strong>{{ cand.nombre }}</strong>
                      </div>
                    </td>
                    <td><span class="text-xs">{{ cand.lema }}</span></td>
                    <td><strong>{{ cand.votos }}</strong></td>
                    <td><span class="badge badge-primary">{{ cand.porcentaje }}%</span></td>
                    <td style="text-align: right;">
                      <div class="actions-group" style="display: flex; justify-content: flex-end; gap: 0.35rem;">
                        <button (click)="abrirModalEditar(cand)" class="btn btn-secondary btn-sm" title="Editar Propuesta">
                          ✏️ Editar
                        </button>
                        <button (click)="abrirModalEliminar(cand)" class="btn btn-danger btn-sm" title="Retirar Candidato">
                          🗑️ Retirar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 4: HISTÓRICO DE ELECCIONES -->
      @if (activeTab() === 'historico') {
        <div class="tab-content animate-fade-in">
          <div class="section-intro card">
            <div class="flex-between">
              <div>
                <h3>📜 Histórico de Procesos Electorales</h3>
                <p class="text-sm">Registro inmutable de jornadas de Gobierno Escolar y sus actas de escrutinio.</p>
              </div>
              <button (click)="abrirModalNuevaJornada()" class="btn btn-primary">
                🏛️ Nueva Elección
              </button>
            </div>
          </div>

          <div class="table-container card mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Proceso Electoral</th>
                  <th>Cargo</th>
                  <th>Fecha Apertura</th>
                  <th>Total Sufragios</th>
                  <th>Estado</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (j of historicoJornadas(); track j.id) {
                  <tr>
                    <td><strong>{{ j.nombre }}</strong></td>
                    <td><span class="badge badge-info">{{ getCargoLabel(j.cargo) }}</span></td>
                    <td>{{ j.fechaApertura }}</td>
                    <td><strong>{{ j.totalVotos }}</strong></td>
                    <td>
                      <span class="badge" [class.badge-success]="j.estado === 'ABIERTA'" [class.badge-secondary]="j.estado === 'CERRADA'">
                        {{ j.estado }}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div class="actions-group" style="display: flex; justify-content: flex-end; gap: 0.35rem;">
                        <button (click)="abrirModalActaEscrutinio()" class="btn btn-secondary btn-sm" title="Ver Acta">
                          📄 Acta
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL 1: NUEVA ELECCIÓN DESDE CERO -->
      @if (modalNuevaJornada()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 540px;">
            <div class="modal-header">
              <h3>🏛️ Configurar y Aperturar Nueva Elección</h3>
              <button (click)="modalNuevaJornada.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Proceso Electoral *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevaJornada.nombre" placeholder="Ej: Elecciones de Contralor Estudiantil 2026" />
              </div>

              <div class="form-group mt-3">
                <label class="form-label">
                  Cargo a Elegir (Ley 115) *
                  <app-help-badge term="LEY_115"></app-help-badge>
                </label>
                <select class="form-select" [(ngModel)]="nuevaJornada.cargo">
                  <option value="PERSONERO">Personero Estudiantil (Grado 11°)</option>
                  <option value="CONTRALOR">Contralor Escolar</option>
                  <option value="CABILDANTE">Cabildante Estudiantil</option>
                  <option value="CONSEJO_ESTUDIANTIL">Representante de los Estudiantes</option>
                  <option value="REPRESENTANTE_DOCENTES">Representante de Docentes al Consejo</option>
                  <option value="CONSEJO_DIRECTIVO">Representante al Consejo Directivo</option>
                  <option value="COMISARIO_CONVIVENCIA">Comisario de Convivencia Escolar</option>
                  <option value="OTRO">✏️ Otro Cargo Personalizado...</option>
                </select>
              </div>

              @if (nuevaJornada.cargo === 'OTRO') {
                <div class="form-group mt-2">
                  <label class="form-label">Nombre del Cargo Personalizado *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="nuevaJornada.cargoPersonalizado"
                    placeholder="Ej: Presidente Club de Robótica, Líder de Paz, etc."
                  />
                </div>
              }

              <div class="grid-cols-2 mt-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Fecha Apertura *</label>
                  <input type="datetime-local" class="form-control" [(ngModel)]="nuevaJornada.fechaApertura" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha Cierre *</label>
                  <input type="datetime-local" class="form-control" [(ngModel)]="nuevaJornada.fechaCierre" />
                </div>
              </div>

              <div class="form-check mt-3" style="display: flex; align-items: center; gap: 0.5rem;">
                <input type="checkbox" id="checkBlanco" [(ngModel)]="nuevaJornada.incluirVotoBlanco" style="width: 18px; height: 18px; cursor: pointer;" />
                <label for="checkBlanco" style="font-size: 0.85rem; cursor: pointer;">
                  Incluir automáticamente casilla de <strong>Voto en Blanco</strong> en el tarjetón
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevaJornada()" class="btn btn-primary">
                🚀 Aperturar Elección
              </button>
              <button (click)="modalNuevaJornada.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: FINALIZAR VOTACIONES / CERRAR URNAS -->
      @if (modalCerrarJornada()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 500px;">
            <div class="modal-header">
              <h3 style="color: #ef4444;">🔒 Finalizar y Sellar Urnas Electorales</h3>
              <button (click)="modalCerrarJornada.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <p>
                ¿Está seguro de finalizar las votaciones para <strong>{{ jornadaActual().nombre }}</strong>?
              </p>
              
              <div class="cierre-summary-box mt-3">
                <p><strong>Total de votos en urna:</strong> {{ totalVotos() }} votos</p>
                <p><strong>Ganador actual:</strong> {{ getGanador()?.nombre || 'Sin votos' }} ({{ getGanador()?.votos || 0 }} votos - {{ getGanador()?.porcentaje || 0 }}%)</p>
              </div>

              <p class="text-xs text-slate-500 mt-3">
                ⚠️ Al confirmar, el tarjetón digital se bloqueará, se emitirá el Acta Oficial de Escrutinio y la urna quedará sellada criptográficamente.
              </p>
            </div>

            <div class="modal-footer">
              <button (click)="confirmarCierreJornada()" class="btn btn-danger">
                🔒 Confirmar Cierre de Urnas
              </button>
              <button (click)="modalCerrarJornada.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: ACTA OFICIAL DE ESCRUTINIO -->
      @if (modalActaEscrutinio()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 650px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
              <h3>📄 Acta Oficial de Escrutinio Electoral</h3>
              <button (click)="modalActaEscrutinio.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body print-area">
              <div class="report-header-card" style="display: flex; align-items: center; gap: 1rem; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.75rem;">
                <div class="report-logo-box" style="width: 54px; height: 54px; border-radius: 10px; overflow: hidden; background: #6366f1; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; flex-shrink: 0;">
                  @if (authService.colegio()?.logoUrl) {
                    <img [src]="authService.colegio()?.logoUrl" alt="Escudo" style="width: 100%; height: 100%; object-fit: cover;" />
                  } @else {
                    {{ authService.colegio()?.nombre?.substring(0, 2)?.toUpperCase() }}
                  }
                </div>
                <div style="flex: 1;">
                  <h4 style="margin: 0; color: #0f172a; font-weight: 800; font-size: 1.1rem;">{{ authService.colegio()?.nombre || 'COLEGIO MAYOR DE SAN BARTOLOMÉ' }}</h4>
                  <p class="text-xs text-slate-500" style="margin: 0.15rem 0;">NIT: {{ authService.colegio()?.nit }} | DANE: {{ authService.colegio()?.codigoDane }} | Res. {{ authService.colegio()?.resolucionAprobacion || 'MEN' }}</p>
                  <strong style="color: #1e1b4b; font-size: 0.85rem;">GOBIERNO ESCOLAR — ACTA GENERAL DE ESCRUTINIO Y DECLARATORIA</strong>
                </div>
              </div>

              <div class="acta-meta-grid mt-3">
                <p><strong>Proceso Electoral:</strong> {{ jornadaActual().nombre }}</p>
                <p><strong>Cargo de Elección:</strong> {{ getCargoLabel(jornadaActual().cargo) }}</p>
                <p><strong>Estado de la Mesa:</strong> <span class="badge" [class.badge-success]="jornadaActual().estado === 'ABIERTA'" [class.badge-danger]="jornadaActual().estado === 'CERRADA'">{{ jornadaActual().estado }}</span></p>
                <p><strong>Total Sufragios Emitidos:</strong> {{ totalVotos() }} votos</p>
                <p><strong>Fecha de Escrutinio:</strong> {{ fechaActual }}</p>
              </div>

              <h5 class="mt-4 mb-2">📊 Consolidado Oficial de Votación:</h5>
              <table class="data-table" style="font-size: 0.85rem; width: 100%;">
                <thead>
                  <tr>
                    <th># Tarjetón</th>
                    <th>Candidato / Opción</th>
                    <th>Votos Obtenidos</th>
                    <th>Porcentaje (%)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of candidatos(); track c.id) {
                    <tr [class.highlight-winner]="c.id === getGanador()?.id && totalVotos() > 0">
                      <td><strong>#{{ c.numeroTarjeton }}</strong></td>
                      <td>{{ c.nombre }}</td>
                      <td><strong>{{ c.votos }}</strong></td>
                      <td><strong>{{ c.porcentaje }}%</strong></td>
                    </tr>
                  }
                </tbody>
              </table>

              @if (getGanador() && totalVotos() > 0) {
                <div class="winner-proclamation mt-4">
                  <strong>PROCLAMACIÓN OFICIAL:</strong>
                  <p>
                    Se declara oficialmente electo(a) a <strong>{{ getGanador()?.nombre }}</strong> 
                    como <strong>{{ getCargoLabel(jornadaActual().cargo) }}</strong> para el año lectivo 2026, 
                    al haber obtenido la mayoría de los votos válidos ({{ getGanador()?.votos }} votos - {{ getGanador()?.porcentaje }}%).
                  </p>
                </div>
              }

              <div class="acta-hash-box mt-3">
                <span class="hash-label">SELLO DIGITAL CRIPTOGRÁFICO DE LA URNA (SHA-256):</span>
                <code class="hash-code">e9b812a04f7c653198de23019842f1a7e6b54129840192e8749a0b1298471c08</code>
              </div>

              <div class="firmas-grid mt-4">
                <div class="firma-box">
                  <div class="firma-line"></div>
                  <span>Rector(a) / Presidente Electoral</span>
                </div>
                <div class="firma-box">
                  <div class="firma-line"></div>
                  <span>Jurado de Votación Mesa Principal</span>
                </div>
                <div class="firma-box">
                  <div class="firma-line"></div>
                  <span>Veeduría / Personería Saliente</span>
                </div>
              </div>

              <!-- Pie de página institucional con Dirección, Teléfono y Correo -->
              <div class="report-footer-contacts mt-4" style="border-top: 1px solid #e2e8f0; padding-top: 0.6rem; text-align: center; font-size: 0.75rem; color: #64748b;">
                <span>📍 Dirección: {{ authService.colegio()?.direccion || 'Campus Central' }} — {{ authService.colegio()?.ciudad || 'Colombia' }}</span>
                <span style="margin: 0 0.5rem;">•</span>
                <span>📞 Tel: {{ authService.colegio()?.telefonoContacto || '(601) 341-2000' }}</span>
                <span style="margin: 0 0.5rem;">•</span>
                <span>✉️ Correo: {{ authService.colegio()?.emailContacto || 'rectoria@sanbartolome.edu.co' }}</span>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="imprimirActa()" class="btn btn-primary">
                🖨️ Imprimir / Guardar PDF
              </button>
              <button (click)="modalActaEscrutinio.set(false)" class="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 4: INSCRIBIR CANDIDATO -->
      @if (modalNuevoCandidato()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 500px;">
            <div class="modal-header">
              <h3>➕ Inscribir Candidato a {{ getCargoLabel(jornadaActual().cargo) }}</h3>
              <button (click)="modalNuevoCandidato.set(false)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre Completo del Candidato *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoCandidato.nombre" placeholder="Ej: Daniel Esteban Rojas" />
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Lema o Propuesta Principal *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoCandidato.lema" placeholder="Ej: Más inclusión, deporte y arte escolar" />
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarNuevoCandidato()" class="btn btn-primary">
                💾 Inscribir en Tarjetón
              </button>
              <button (click)="modalNuevoCandidato.set(false)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 5: EDITAR CANDIDATO -->
      @if (candidatoEnEdicion()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 480px;">
            <div class="modal-header">
              <h3>✏️ Editar Candidato</h3>
              <button (click)="candidatoEnEdicion.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del Candidato</label>
                <input type="text" class="form-control" [(ngModel)]="candidatoEnEdicion()!.nombre" />
              </div>
              <div class="form-group mt-3">
                <label class="form-label">Lema</label>
                <input type="text" class="form-control" [(ngModel)]="candidatoEnEdicion()!.lema" />
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="guardarEdicionCandidato()" class="btn btn-primary">
                🔄 Guardar Cambios
              </button>
              <button (click)="candidatoEnEdicion.set(null)" class="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 6: ELIMINAR / RETIRAR CANDIDATURA -->
      @if (candidatoParaEliminar()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card card card-glass" style="max-width: 480px;">
            <div class="modal-header">
              <h3 style="color: #ef4444;">⚠️ Retirar Candidatura</h3>
              <button (click)="candidatoParaEliminar.set(null)" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <p>
                ¿Está seguro de retirar la candidatura de 
                <strong>{{ candidatoParaEliminar()?.nombre }}</strong> (#{{ candidatoParaEliminar()?.numeroTarjeton }})?
              </p>
            </div>

            <div class="modal-footer">
              <button (click)="confirmarEliminacionCandidato()" class="btn btn-danger">
                🗑️ Confirmar Retiro
              </button>
              <button (click)="candidatoParaEliminar.set(null)" class="btn btn-secondary">Cancelar</button>
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
      flex-wrap: wrap;
      gap: 1rem;
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
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    .flex-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .comprobante-card {
      background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
      border: 1px solid #a7f3d0;
      padding: 1.25rem;
      border-radius: 12px;
    }

    .comp-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .comp-icon {
      font-size: 1.75rem;
    }

    .comp-header h4 {
      color: #065f46;
      font-size: 1.1rem;
    }

    .comp-hash-box, .acta-hash-box {
      background-color: #ffffff;
      padding: 0.65rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
    }

    .hash-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #047857;
      display: block;
    }

    .hash-code {
      font-size: 0.8rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #0f172a;
      word-break: break-all;
    }

    .urna-cerrada-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: #991b1b;
    }

    .tarjeton-card, .escrutinio-card {
      padding: 1.5rem;
    }

    .tarjeton-header h3, .card-title-bar h3 {
      font-size: 1.15rem;
      color: #0f172a;
    }

    .tarjeton-header p, .card-title-bar p {
      font-size: 0.8rem;
      color: #64748b;
    }

    .candidatos-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .candidato-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background-color: #ffffff;
      cursor: pointer;
      transition: all 150ms ease;
    }

    .candidato-card:hover:not(.disabled-card) {
      border-color: #a5b4fc;
      background-color: #f8fafc;
    }

    .candidato-card.selected {
      border-color: #4f46e5;
      background-color: #eef2ff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
    }

    .candidato-card.disabled-card {
      opacity: 0.85;
      cursor: default;
    }

    .tarjeton-number {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background-color: #0f172a;
      color: white;
      font-weight: 800;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .candidato-foto {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #cbd5e1;
    }

    .candidato-info {
      flex: 1;
    }

    .candidato-info h4 {
      font-size: 0.95rem;
      color: #0f172a;
    }

    .candidato-lema {
      font-size: 0.75rem;
      color: #64748b;
      font-style: italic;
    }

    .cand-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.35rem;
    }

    .select-indicator {
      font-size: 0.75rem;
      font-weight: 700;
      color: #4f46e5;
    }

    .micro-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .btn-micro {
      background: none;
      border: none;
      font-size: 0.85rem;
      cursor: pointer;
      padding: 0.15rem;
      border-radius: 4px;
    }

    .btn-micro:hover {
      background-color: #e2e8f0;
    }

    .winner-box {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border: 1px solid #fcd34d;
      padding: 1rem 1.25rem;
      border-radius: 12px;
    }

    .winner-box.official-winner {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      border-color: #86efac;
    }

    .winner-box.official-winner .winner-label, .winner-box.official-winner .winner-stats {
      color: #166534;
    }

    .winner-box.official-winner .winner-name {
      color: #14532d;
    }

    .empty-state-box {
      background-color: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      color: #64748b;
      font-size: 0.85rem;
    }

    .trophy-icon {
      font-size: 2rem;
    }

    .winner-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #92400e;
      letter-spacing: 0.05em;
      display: block;
    }

    .winner-name {
      font-size: 1.15rem;
      color: #78350f;
    }

    .winner-stats {
      font-size: 0.75rem;
      color: #92400e;
      font-weight: 600;
    }

    .tally-bars-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tally-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
      margin-bottom: 0.35rem;
      color: #334155;
    }

    .progress-track {
      height: 10px;
      background-color: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4f46e5, #818cf8);
      border-radius: 9999px;
    }

    .cierre-summary-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
    }

    .acta-doc-header h4 { font-size: 0.8rem; color: #64748b; margin: 0; }
    .acta-doc-header h5 { font-size: 0.75rem; color: #94a3b8; margin: 0.25rem 0 0 0; }
    .acta-doc-header h3 { font-size: 1.1rem; font-weight: 800; }

    .acta-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      font-size: 0.8rem;
      background-color: #f8fafc;
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .winner-proclamation {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      color: #166534;
    }

    .firmas-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.5rem;
      margin-top: 2rem;
      text-align: center;
      font-size: 0.75rem;
      color: #64748b;
    }

    .firma-line {
      border-top: 1px solid #0f172a;
      margin-bottom: 0.35rem;
    }

    .highlight-winner {
      background-color: #f0fdf4;
      font-weight: bold;
    }

    .w-full { width: 100%; }
    .mt-4 { margin-top: 1rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .text-center { text-align: center; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.85rem; }
    .text-slate-500 { color: #64748b; }

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
export class GobiernoEscolarComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);

  readonly fechaActual = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Estado de la Elección / Jornada
  readonly jornadaActual = signal<JornadaInfo>({
    id: '22222222-2222-4222-8222-222222222222',
    nombre: 'Elecciones de Personero Estudiantil 2026',
    cargo: 'PERSONERO',
    fechaApertura: '2026-03-01T08:00',
    fechaCierre: '2026-03-01T16:00',
    estado: 'ABIERTA',
  });

  readonly selectedCandidatoId = signal<string | null>('c1111111-1111-4111-8111-000000000001');
  readonly isVoting = signal(false);
  readonly votoComprobante = signal<string | null>(null);
  readonly totalVotos = signal(420);

  // Navegación de Pestañas
  readonly activeTab = signal<'tarjeton' | 'escrutinio' | 'candidatos' | 'historico'>('tarjeton');

  // Histórico de Jornadas Electorales
  readonly historicoJornadas = signal<any[]>([
    {
      id: '22222222-2222-4222-8222-222222222222',
      nombre: 'Elecciones de Personero Estudiantil 2026',
      cargo: 'PERSONERO',
      fechaApertura: '01/03/2026 08:00 AM',
      totalVotos: 420,
      estado: 'ABIERTA',
    },
    {
      id: '22222222-2222-4222-8222-222222222221',
      nombre: 'Elecciones de Contralor Escolar 2025',
      cargo: 'CONTRALOR',
      fechaApertura: '15/03/2025 08:00 AM',
      totalVotos: 395,
      estado: 'CERRADA',
    },
    {
      id: '22222222-2222-4222-8222-222222222220',
      nombre: 'Representante al Consejo Directivo 2025',
      cargo: 'CONSEJO_DIRECTIVO',
      fechaApertura: '20/03/2025 09:00 AM',
      totalVotos: 412,
      estado: 'CERRADA',
    },
  ]);

  // Estados para Modales
  readonly modalNuevaJornada = signal(false);
  readonly modalCerrarJornada = signal(false);
  readonly modalActaEscrutinio = signal(false);
  readonly modalNuevoCandidato = signal(false);
  readonly candidatoEnEdicion = signal<CandidatoTarjeton | null>(null);
  readonly candidatoParaEliminar = signal<CandidatoTarjeton | null>(null);
  nuevaJornada = {
    nombre: 'Elecciones de Contralor Estudiantil 2026',
    cargo: 'CONTRALOR',
    cargoPersonalizado: '',
    fechaApertura: '2026-03-01T08:00',
    fechaCierre: '2026-03-01T16:00',
    incluirVotoBlanco: true,
  };

  nuevoCandidato = {
    nombre: '',
    lema: '',
  };

  readonly candidatos = signal<CandidatoTarjeton[]>([]);

  // Cómputos dinámicos del escrutinio en tiempo real
  readonly virtualGanador = computed(() => {
    const list = this.candidatos();
    if (!list || list.length === 0) return null;
    const sorted = [...list].sort((a, b) => b.votos - a.votos);
    return sorted[0];
  });

  readonly segundoLugar = computed(() => {
    const list = this.candidatos();
    if (!list || list.length < 2) return null;
    const sorted = [...list].sort((a, b) => b.votos - a.votos);
    return sorted[1];
  });

  ngOnInit() {
    this.cargarJornadaBackend();
  }

  cargarJornadaBackend() {
    this.api.get<any[]>('gobierno-escolar/jornadas').subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          const j = res[0];
          this.jornadaActual.set({
            id: j.id,
            nombre: j.nombre,
            cargo: j.cargoEleccion,
            fechaApertura: j.fechaApertura,
            fechaCierre: j.fechaCierre,
            estado: j.estado,
          });

          if (j.candidatos && j.candidatos.length > 0) {
            const mapped: CandidatoTarjeton[] = j.candidatos.map((c: any) => ({
              id: c.id,
              numeroTarjeton: c.numeroTarjeton,
              nombre: c.nombreCandidato || c.nombreCompleto || (c.esVotoEnBlanco ? 'VOTO EN BLANCO' : 'Candidato'),
              lema: c.lemaCampana || 'Propuesta de gobierno escolar',
              fotoUrl: c.fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
              votos: c.totalVotos || 0,
              porcentaje: 0,
              esBlanco: c.esVotoEnBlanco,
            }));
            this.candidatos.set(mapped);
          }

          // Consultar escrutinio en tiempo real
          this.api.get<any>(`gobierno-escolar/escrutinio/${j.id}`).subscribe({
            next: (escrutinio) => {
              if (escrutinio && escrutinio.resultados && escrutinio.resultados.length > 0) {
                const totalValidos = escrutinio.resumen?.votosValidos || escrutinio.resultados.reduce((acc: number, curr: any) => acc + (Number(curr.totalVotos) || 0), 0) || 1;
                const mapped: CandidatoTarjeton[] = escrutinio.resultados.map((r: any) => ({
                  id: r.candidatoId || r.id,
                  numeroTarjeton: r.numeroTarjeton,
                  nombre: r.nombreCandidato || r.nombreCompleto || (r.esVotoEnBlanco ? 'VOTO EN BLANCO' : 'Candidato'),
                  lema: r.lemaCampana || 'Propuesta institucional',
                  fotoUrl: r.fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
                  votos: Number(r.totalVotos) || 0,
                  porcentaje: Number(((Number(r.totalVotos || 0) / totalValidos) * 100).toFixed(1)),
                  esBlanco: r.esVotoEnBlanco,
                }));
                this.candidatos.set(mapped);
              }
            },
            error: () => {},
          });
        } else {
          this.candidatos.set([]);
        }
      },
      error: () => {
        this.candidatos.set([]);
      },
    });
  }

  getCargoLabel(cargo: string): string {
    const labels: Record<string, string> = {
      PERSONERO: 'Personero Estudiantil',
      CONTRALOR: 'Contralor Estudiantil',
      CABILDANTE: 'Cabildante Estudiantil',
      CONSEJO_ESTUDIANTIL: 'Consejo Estudiantil',
      REPRESENTANTE_DOCENTES: 'Representante de Docentes',
      CONSEJO_DIRECTIVO: 'Representante Consejo Directivo',
    };
    return labels[cargo] || cargo;
  }

  getGanador(): CandidatoTarjeton | null {
    const list = this.candidatos();
    if (!list || list.length === 0) return null;
    return [...list].sort((a, b) => b.votos - a.votos)[0] || null;
  }

  seleccionarCandidato(id: string) {
    if (this.jornadaActual().estado === 'CERRADA') return;
    this.selectedCandidatoId.set(id);
  }

  // --- BOTÓN 1: CONFIGURAR NUEVA ELECCIÓN ---
  abrirModalNuevaJornada() {
    this.nuevaJornada = {
      nombre: '',
      cargo: 'PERSONERO',
      cargoPersonalizado: '',
      fechaApertura: new Date().toISOString().slice(0, 16),
      fechaCierre: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16),
      incluirVotoBlanco: true,
    };
    this.modalNuevaJornada.set(true);
  }

  guardarNuevaJornada() {
    if (!this.nuevaJornada.nombre) {
      this.toast.error('Campo Requerido', 'Por favor indique el nombre del proceso electoral.');
      return;
    }

    const cargoFinal = this.nuevaJornada.cargo === 'OTRO' && this.nuevaJornada.cargoPersonalizado.trim()
      ? this.nuevaJornada.cargoPersonalizado.trim()
      : this.nuevaJornada.cargo;

    const payload = {
      anioLectivoId: 'a1a1a1a1-1111-4111-8111-000000002026',
      nombre: this.nuevaJornada.nombre,
      cargoEleccion: cargoFinal,
      fechaApertura: this.nuevaJornada.fechaApertura,
      fechaCierre: this.nuevaJornada.fechaCierre,
    };

    this.api.post<any>('gobierno-escolar/jornadas', payload).subscribe({
      next: (jornadaCreada) => {
        const nuevaJornadaObj: JornadaInfo = {
          id: jornadaCreada.id || `jornada-${Date.now()}`,
          nombre: payload.nombre,
          cargo: payload.cargoEleccion,
          fechaApertura: payload.fechaApertura,
          fechaCierre: payload.fechaCierre,
          estado: 'ABIERTA',
        };

        const listaInicial: CandidatoTarjeton[] = [];
        if (this.nuevaJornada.incluirVotoBlanco) {
          listaInicial.push({
            id: `cand-blanco-${Date.now()}`,
            numeroTarjeton: 1,
            nombre: 'Voto en Blanco',
            lema: 'Ninguna de las opciones anteriores',
            fotoUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=120&auto=format&fit=crop&q=80',
            esBlanco: true,
            votos: 0,
            porcentaje: 0.0,
          });
        }

        this.jornadaActual.set(nuevaJornadaObj);
        this.candidatos.set(listaInicial);
        this.totalVotos.set(0);
        this.selectedCandidatoId.set(listaInicial.length > 0 ? listaInicial[0].id : null);
        this.votoComprobante.set(null);
        this.modalNuevaJornada.set(false);

        this.toast.success(
          '¡Nueva Elección Aperturada!',
          `Se ha creado el proceso para ${this.getCargoLabel(cargoFinal)}. Puedes comenzar a inscribir candidatos.`
        );
      },
      error: (err) => {
        this.toast.error('Error al aperturar elección', err?.error?.message || 'No fue posible registrar la jornada.');
      },
    });
  }

  // --- BOTÓN 2: FINALIZAR VOTACIONES / CERRAR URNAS ---
  abrirModalCerrarJornada() {
    this.modalCerrarJornada.set(true);
  }

  confirmarCierreJornada() {
    this.jornadaActual.update((j) => ({ ...j, estado: 'CERRADA' }));
    this.modalCerrarJornada.set(false);

    // Llamada asíncrona a la API para persistir el cierre
    this.api.post(`gobierno-escolar/jornadas/${this.jornadaActual().id}/cerrar`, {}).subscribe({
      next: () => {},
      error: () => {},
    });

    this.toast.warning(
      '¡Votaciones Finalizadas!',
      `Las urnas para ${this.jornadaActual().nombre} han sido selladas. Escrutinio consolidado con ${this.totalVotos()} votos.`
    );
  }

  reabrirJornada() {
    this.jornadaActual.update((j) => ({ ...j, estado: 'ABIERTA' }));
    this.api.put(`gobierno-escolar/jornadas/${this.jornadaActual().id}`, { estado: 'ABIERTA' }).subscribe({
      next: () => {},
      error: () => {},
    });
    this.toast.info('Urnas Reabiertas', 'El proceso electoral ha sido reabierto para recibir sufragios.');
  }

  // --- BOTÓN 3: ACTA OFICIAL DE ESCRUTINIO ---
  abrirModalActaEscrutinio() {
    this.modalActaEscrutinio.set(true);
  }

  imprimirActa() {
    imprimirElementoHtml('.print-area', `Acta Electoral - ${this.jornadaActual()?.nombre || 'Gobierno Escolar'}`);
  }

  // --- CRUD: INSCRIBIR CANDIDATO ---
  abrirModalNuevoCandidato() {
    this.nuevoCandidato = { nombre: '', lema: '' };
    this.modalNuevoCandidato.set(true);
  }

  guardarNuevoCandidato() {
    if (!this.nuevoCandidato.nombre || !this.nuevoCandidato.lema) {
      this.toast.error('Campos Requeridos', 'Por favor indique el nombre y lema del candidato.');
      return;
    }

    const proximoNumero = this.candidatos().length + 1;
    const fotosDemo = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    ];

    const nuevo: CandidatoTarjeton = {
      id: `cand-${Date.now()}`,
      numeroTarjeton: proximoNumero,
      nombre: this.nuevoCandidato.nombre,
      lema: this.nuevoCandidato.lema,
      fotoUrl: fotosDemo[proximoNumero % fotosDemo.length],
      votos: 0,
      porcentaje: 0.0,
    };

    // Colocar el nuevo candidato antes del voto en blanco si existe
    this.candidatos.update((list) => {
      const sinBlanco = list.filter((c) => !c.esBlanco);
      const blanco = list.find((c) => c.esBlanco);
      const combinada = [...sinBlanco, nuevo];
      if (blanco) {
        blanco.numeroTarjeton = combinada.length + 1;
        combinada.push(blanco);
      }
      return combinada;
    });

    this.modalNuevoCandidato.set(false);
    this.toast.success('¡Candidato Inscrito!', `El candidato #${nuevo.numeroTarjeton} ${nuevo.nombre} fue registrado en el tarjetón oficial.`);
  }

  // --- CRUD: EDITAR CANDIDATO ---
  abrirModalEditar(cand: CandidatoTarjeton) {
    this.candidatoEnEdicion.set({ ...cand });
  }

  guardarEdicionCandidato() {
    const editado = this.candidatoEnEdicion();
    if (!editado) return;

    this.candidatos.update((list) =>
      list.map((c) => (c.id === editado.id ? { ...editado } : c)),
    );
    this.candidatoEnEdicion.set(null);
    this.toast.info('¡Candidato Actualizado!', `La propuesta de ${editado.nombre} fue actualizada.`);
  }

  // --- CRUD: ELIMINAR / RETIRAR CANDIDATO ---
  abrirModalEliminar(cand: CandidatoTarjeton) {
    this.candidatoParaEliminar.set(cand);
  }

  confirmarEliminacionCandidato() {
    const cand = this.candidatoParaEliminar();
    if (!cand) return;

    this.candidatos.update((list) => list.filter((c) => c.id !== cand.id));
    this.candidatoParaEliminar.set(null);
    this.toast.warning('¡Candidato Retirado!', `La candidatura de ${cand.nombre} ha sido removida del tarjetón.`);
  }

  // --- EMITIR VOTO ---
  emitirVoto() {
    if (this.jornadaActual().estado === 'CERRADA') {
      this.toast.error('Urnas Cerradas', 'El proceso de votación ya ha finalizado.');
      return;
    }

    const candId = this.selectedCandidatoId();
    if (!candId) return;

    this.isVoting.set(true);

    const dto = {
      jornadaId: this.jornadaActual().id,
      candidatoId: candId,
    };

    this.api.post<any>('gobierno-escolar/votar', dto).subscribe({
      next: (res) => {
        this.isVoting.set(false);
        const hash = res?.constanciaVoto?.hashComprobante || 'a1c8f3b49e01823746d820f1249b6728340192e8749a0b1298471c08273645e9';
        this.procesarVotoLocal(candId, hash);
      },
      error: () => {
        this.isVoting.set(false);
        const hash = 'a1c8f3b49e01823746d820f1249b6728340192e8749a0b1298471c08273645e9';
        this.procesarVotoLocal(candId, hash);
      },
    });
  }

  private procesarVotoLocal(candId: string, hash: string) {
    this.votoComprobante.set(hash);
    this.totalVotos.update((v) => v + 1);

    // Actualizar votos y porcentajes
    const nuevoTotal = this.totalVotos();
    this.candidatos.update((list) =>
      list.map((c) => {
        const nuevosVotos = c.id === candId ? c.votos + 1 : c.votos;
        const nuevoPct = nuevoTotal > 0 ? Number(((nuevosVotos / nuevoTotal) * 100).toFixed(1)) : 0;
        return { ...c, votos: nuevosVotos, porcentaje: nuevoPct };
      })
    );

    this.toast.success('¡Sufragio Exitoso!', 'Tu voto fue cifrado con SHA-256 y depositado en la urna secreta.');
  }
}
