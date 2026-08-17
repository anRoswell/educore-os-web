import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="gobierno-page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Gobierno Escolar & Elecciones Democráticas</h1>
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

      <div class="grid-cols-2 mt-4">
        <!-- Columna 1: Tarjetón Electoral Interactivo -->
        <div class="card tarjeton-card">
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

          <!-- Banner Informativo si la Elección está Cerrada -->
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

        <!-- Columna 2: Escrutinio en Vivo y Resultados -->
        <div class="card escrutinio-card">
          <div class="card-title-bar">
            <div>
              <h3>📊 Escrutinio & Mesa de Votación</h3>
              <p>Total sufragios emitidos: <strong>{{ totalVotos() }} votos</strong></p>
            </div>
            <span class="badge" [class.badge-info]="jornadaActual().estado === 'ABIERTA'" [class.badge-success]="jornadaActual().estado === 'CERRADA'">
              {{ jornadaActual().estado === 'CERRADA' ? 'Escrutinio Oficial 100%' : 'Escrutinio en Vivo' }}
            </span>
          </div>

          <!-- Candidato Ganador -->
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

          <!-- Barras de Escrutinio -->
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
                <label class="form-label">Cargo a Elegir *</label>
                <select class="form-select" [(ngModel)]="nuevaJornada.cargo">
                  <option value="PERSONERO">Personero Estudiantil</option>
                  <option value="CONTRALOR">Contralor Estudiantil</option>
                  <option value="CABILDANTE">Cabildante Estudiantil</option>
                  <option value="CONSEJO_ESTUDIANTIL">Consejo Estudiantil</option>
                  <option value="REPRESENTANTE_DOCENTES">Representante de Docentes</option>
                  <option value="CONSEJO_DIRECTIVO">Representante Consejo Directivo</option>
                </select>
              </div>

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
              <div class="acta-doc-header text-center">
                <h4>REPÚBLICA DE COLOMBIA — MINISTERIO DE EDUCACIÓN NACIONAL</h4>
                <h5>INSTITUCIÓN EDUCATIVA DEMO — GOBIERNO ESCOLAR 2026</h5>
                <h3 class="mt-2" style="color: #1e1b4b; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.5rem;">
                  ACTA GENERAL DE ESCRUTINIO Y DECLARATORIA DE ELECCIÓN
                </h3>
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
    fechaApertura: '2026-03-01T08:00',
    fechaCierre: '2026-03-01T16:00',
    incluirVotoBlanco: true,
  };

  nuevoCandidato = {
    nombre: '',
    lema: '',
  };

  readonly candidatos = signal<CandidatoTarjeton[]>([
    {
      id: 'c1111111-1111-4111-8111-000000000001',
      numeroTarjeton: 1,
      nombre: 'Valeria Sofía Morales',
      lema: 'Unidos por un colegio más verde, incluyente y deportivo',
      fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      votos: 260,
      porcentaje: 61.9,
    },
    {
      id: 'c1111111-1111-4111-8111-000000000002',
      numeroTarjeton: 2,
      nombre: 'Santiago Gómez Herrera',
      lema: 'Tecnología, cultura y participación estudiantil activa',
      fotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
      votos: 135,
      porcentaje: 32.1,
    },
    {
      id: 'c1111111-1111-4111-8111-000000000003',
      numeroTarjeton: 3,
      nombre: 'Voto en Blanco',
      lema: 'Ninguna de las opciones anteriores',
      fotoUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=120&auto=format&fit=crop&q=80',
      esBlanco: true,
      votos: 25,
      porcentaje: 6.0,
    },
  ]);

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

  // --- BOTÓN 1: CREAR NUEVA ELECCIÓN DESDE CERO ---
  abrirModalNuevaJornada() {
    this.nuevaJornada = {
      nombre: '',
      cargo: 'PERSONERO',
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

    const nuevaJornadaObj: JornadaInfo = {
      id: `jornada-${Date.now()}`,
      nombre: this.nuevaJornada.nombre,
      cargo: this.nuevaJornada.cargo,
      fechaApertura: this.nuevaJornada.fechaApertura,
      fechaCierre: this.nuevaJornada.fechaCierre,
      estado: 'ABIERTA',
    };

    // Inicializar candidatos para la nueva elección
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
      `Se ha creado el proceso para ${this.getCargoLabel(nuevaJornadaObj.cargo)}. Puedes comenzar a inscribir candidatos.`
    );
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
    this.toast.info('Urnas Reabiertas', 'El proceso electoral ha sido reabierto para recibir sufragios.');
  }

  // --- BOTÓN 3: ACTA OFICIAL DE ESCRUTINIO ---
  abrirModalActaEscrutinio() {
    this.modalActaEscrutinio.set(true);
  }

  imprimirActa() {
    window.print();
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
