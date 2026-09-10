import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, switchMap, catchError, finalize } from 'rxjs/operators';
import { ContabilidadService } from '../services/contabilidad.service';
import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';
import {
  DispersionLoteModel,
  DispersionItemModel,
  CrearDispersionLoteModel,
  ConfirmarDispersionLoteModel,
  TipoDispersionModel,
  FormatoBancoDispersionModel,
  EstadoDispersionLoteModel,
  Tercero,
} from '../models/contabilidad.models';

@Component({
  selector: 'app-contabilidad-dispersion',
  standalone: true,
  imports: [CommonModule, FormsModule, FlatpickrDirective],
  template: `
    <div class="dispersion-container" data-testid="dispersion-container">
      <!-- Header Banner -->
      <div class="disp-header-banner">
        <div class="disp-header-main">
          <div class="disp-icon-wrap">🏦</div>
          <div class="disp-texts-wrap">
            <div class="disp-title-row">
              <h2 class="disp-title-text" data-testid="title-dispersion">Dispersión Masiva de Pagos Bancarios H2H</h2>
              <span class="badge-enterprise">Enterprise Host-to-Host</span>
            </div>
            <p class="disp-subtitle-text">
              Generación de archivos planos estándar (Asobancaria 2001, Bancolombia PAB, Davivienda ACH, SAP MT940) y contabilización automática de egresos.
            </p>
          </div>
        </div>
        <div class="disp-actions-row">
          <button
            type="button"
            class="btn-primary"
            (click)="abrirModalNuevoLote()"
            data-testid="btn-nuevo-lote"
          >
            ➕ Nuevo Lote de Pago
          </button>
        </div>
      </div>

      <!-- KPIs Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" data-testid="kpi-total-lotes">
          <span class="kpi-title">Lotes Totales</span>
          <span class="kpi-value">{{ lotes().length }}</span>
          <span class="kpi-subtext">Histórico generado</span>
        </div>
        <div class="kpi-card" data-testid="kpi-monto-total">
          <span class="kpi-title">Monto Total Dispersado</span>
          <span class="kpi-value">{{ totalMontoDispersado() | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
          <span class="kpi-subtext">Fondos transferidos</span>
        </div>
        <div class="kpi-card" data-testid="kpi-lotes-aplicados">
          <span class="kpi-title">Lotes Contabilizados (EGR)</span>
          <span class="kpi-value text-emerald-600">{{ totalLotesAplicados() }}</span>
          <span class="kpi-subtext">Egresos confirmados</span>
        </div>
        <div class="kpi-card" data-testid="kpi-bancos-conectados">
          <span class="kpi-title">Estándares Soportados</span>
          <span class="kpi-value text-indigo-600">4 Bancos</span>
          <span class="kpi-subtext">Asobancaria, PAB, ACH, MT940</span>
        </div>
      </div>

      <!-- Filtros y Controles -->
      <div class="filter-card mb-4">
        <div class="filter-row">
          <div class="filter-item">
            <label class="filter-label">Tipo de Dispersión</label>
            <select
              class="form-select"
              [(ngModel)]="filtroTipo"
              (change)="cargarLotes()"
              data-testid="select-filtro-tipo"
            >
              <option value="">Todos los tipos</option>
              <option value="PROVEEDORES">Proveedores</option>
              <option value="NOMINA">Nómina / Colaboradores</option>
              <option value="SERVICIOS">Servicios</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">Estado</label>
            <select
              class="form-select"
              [(ngModel)]="filtroEstado"
              (change)="cargarLotes()"
              data-testid="select-filtro-estado"
            >
              <option value="">Todos los estados</option>
              <option value="GENERADO">Generado</option>
              <option value="APLICADO">Aplicado / Pagado</option>
              <option value="BORRADOR">Borrador</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>

          <div class="filter-item filter-actions">
            <button
              type="button"
              class="btn-secondary"
              (click)="cargarLotes()"
              data-testid="btn-refrescar"
            >
              🔄 Refrescar
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla Principal de Lotes -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="table-custom" data-testid="tabla-lotes-dispersion">
            <thead>
              <tr>
                <th>Código Lote</th>
                <th>Tipo</th>
                <th>Formato Bancario</th>
                <th>Banco Emisor</th>
                <th>Cuenta Débito</th>
                <th>Fecha Aplicación</th>
                <th class="text-center">Beneficiarios</th>
                <th class="text-right">Monto Total</th>
                <th>Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="cargando()">
                <td colspan="10" class="text-center py-6 text-slate-500">
                  <div class="spinner-inline"></div> Cargando lotes de dispersión bancaria...
                </td>
              </tr>
              <tr *ngIf="!cargando() && lotes().length === 0">
                <td colspan="10" class="text-center py-8 text-slate-500">
                  No se encontraron lotes de dispersión registrados. Haz clic en <strong>Nuevo Lote de Pago</strong> para crear uno.
                </td>
              </tr>
              <tr *ngFor="let lote of lotes()" [attr.data-testid]="'fila-lote-' + lote.codigoLote">
                <td class="font-bold text-indigo-700">{{ lote.codigoLote }}</td>
                <td>
                  <span class="badge-tag" [ngClass]="getTipoBadgeClass(lote.tipo)">
                    {{ lote.tipo }}
                  </span>
                </td>
                <td>
                  <span class="font-mono text-xs font-semibold text-slate-700">{{ lote.formatoBanco }}</span>
                </td>
                <td>{{ lote.bancoOrigen }}</td>
                <td class="font-mono text-xs">{{ lote.numeroCuentaOrigen }}</td>
                <td>{{ lote.fechaAplicacion }}</td>
                <td class="text-center font-bold">{{ lote.totalRegistros }}</td>
                <td class="text-right font-bold text-slate-900">
                  {{ lote.montoTotal | currency:'COP':'symbol-narrow':'1.0-0' }}
                </td>
                <td>
                  <span class="badge-status" [ngClass]="getEstadoBadgeClass(lote.estado)">
                    {{ lote.estado }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      class="btn-icon"
                      title="Ver Detalle y Archivo Plano"
                      (click)="verDetalleLote(lote)"
                      [attr.data-testid]="'btn-ver-' + lote.id"
                    >
                      👁️
                    </button>
                    <button
                      type="button"
                      class="btn-icon text-indigo-600"
                      title="Descargar Archivo Plano Bancario"
                      (click)="descargarArchivo(lote)"
                      [attr.data-testid]="'btn-descargar-' + lote.id"
                    >
                      ⬇️
                    </button>
                    <button
                      *ngIf="lote.estado !== 'APLICADO'"
                      type="button"
                      class="btn-icon text-emerald-600 font-bold"
                      title="Confirmar y Contabilizar Egreso (EGR)"
                      (click)="abrirModalConfirmar(lote)"
                      [attr.data-testid]="'btn-confirmar-' + lote.id"
                    >
                      ✅
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: NUEVO LOTE DE DISPERSIÓN -->
      <div class="modal-backdrop" *ngIf="mostrarModalNuevo()" data-testid="modal-nuevo-lote">
        <div class="modal-content modal-xl">
          <div class="modal-header">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🏦</span>
              <div>
                <h3 class="modal-title">Generar Lote de Dispersión Bancaria</h3>
                <p class="modal-subtitle">Genera el archivo plano bancario para transmisión Host-to-Host o portal empresarial.</p>
              </div>
            </div>
            <button type="button" class="btn-close" (click)="cerrarModalNuevo()">✕</button>
          </div>

          <div class="modal-body">
            <!-- Parámetros del Lote -->
            <div class="form-grid-4 mb-4">
              <div class="form-group">
                <label class="form-label">Tipo de Dispersión</label>
                <select class="form-select" [(ngModel)]="nuevoLote.tipo" data-testid="input-nuevo-tipo">
                  <option value="PROVEEDORES">Proveedores / Facturas</option>
                  <option value="NOMINA">Nómina de Empleados</option>
                  <option value="SERVICIOS">Servicios Generales</option>
                  <option value="MIXTO">Mixto</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Formato Bancario</label>
                <select class="form-select" [(ngModel)]="nuevoLote.formatoBanco" data-testid="input-nuevo-formato">
                  <option value="ASOBANCARIA_2001">Asobancaria 2001 (Estándar Colombia)</option>
                  <option value="BANCOLOMBIA_PAB">Bancolombia PAB (Pagos Automáticos)</option>
                  <option value="DAVIVIENDA_ACH">Davivienda ACH Empresarial</option>
                  <option value="BANCO_BOGOTA">Banco de Bogotá ACH</option>
                  <option value="SAP_MT940">SAP / SWIFT MT940</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Banco Emisor del Colegio</label>
                <select
                  class="form-select"
                  [(ngModel)]="nuevoLote.bancoOrigen"
                  data-testid="select-nuevo-banco-origen"
                >
                  <option value="" disabled>Seleccione el banco emisor...</option>
                  @for (banco of bancosDisponibles; track banco.codigo) {
                    <option [value]="banco.nombre">{{ banco.nombre }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Cuenta Origen Débito</label>
                <input
                  type="text"
                  class="form-input font-mono"
                  [(ngModel)]="nuevoLote.numeroCuentaOrigen"
                  placeholder="Ej. 12345678901"
                  data-testid="input-nuevo-cuenta-origen"
                />
              </div>
            </div>

            <div class="form-grid-2 mb-3">
              <div class="form-group">
                <label class="form-label">Tipo Cuenta Origen</label>
                <select class="form-select" [(ngModel)]="nuevoLote.tipoCuentaOrigen">
                  <option value="CORRIENTE">Cuenta Corriente</option>
                  <option value="AHORROS">Cuenta de Ahorros</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Fecha de Aplicación</label>
                <input
                  type="text"
                  appFlatpickr
                  class="form-input"
                  [(ngModel)]="nuevoLote.fechaAplicacion"
                  data-testid="input-nuevo-fecha"
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </div>

            <!-- Fila Completa de Observaciones -->
            <div class="form-group w-full mb-4">
              <label class="form-label">Observaciones / Concepto General del Lote</label>
              <input
                type="text"
                class="form-input w-full"
                [(ngModel)]="nuevoLote.observaciones"
                placeholder="Ej. Pago quincena 1 septiembre / Liquidación facturas proveedores ciclo actual"
                data-testid="input-nuevo-observaciones"
              />
            </div>

            <!-- Botones de Acción de Beneficiarios -->
            <div class="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-slate-800 text-sm">Beneficiarios del Lote ({{ nuevoLote.items.length }})</h4>
                <span class="badge-info text-xs">
                  Total: {{ calcularTotalNuevoLote() | currency:'COP':'symbol-narrow':'1.0-0' }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  (click)="cargarPendientesAuto()"
                  data-testid="btn-cargar-pendientes"
                >
                  ⚡ Cargar Obligaciones Pendientes
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  (click)="agregarFilaItem()"
                  data-testid="btn-agregar-fila"
                >
                  ➕ Agregar Fila
                </button>
              </div>
            </div>

            <!-- Tabla de Beneficiarios -->
            <div class="table-responsive border border-slate-200 rounded-lg min-h-[280px]" style="overflow-x: auto; overflow-y: visible;">
              <table class="table-custom text-xs">
                <thead>
                  <tr>
                    <th style="min-width: 270px;">Beneficiario (Empleado / Proveedor)</th>
                    <th style="width: 120px;">Doc / NIT</th>
                    <th style="width: 130px;">Banco Destino</th>
                    <th style="width: 110px;">Tipo Cta</th>
                    <th style="width: 130px;">Núm Cuenta</th>
                    <th style="width: 120px;" class="text-right">Monto COP</th>
                    <th style="width: 110px;">Referencia</th>
                    <th style="min-width: 160px;">Email</th>
                    <th style="width: 44px;" class="text-center">✕</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="nuevoLote.items.length === 0">
                    <td colspan="9" class="text-center py-6 text-slate-500 bg-slate-50/50">
                      No hay beneficiarios en este lote. Haz clic en <strong>➕ Agregar Fila</strong> o en <strong>⚡ Cargar Obligaciones Pendientes</strong>.
                    </td>
                  </tr>
                  @for (item of nuevoLote.items; track $index; let i = $index) {
                    <tr>
                      <td style="min-width: 270px; position: relative;">
                        <div class="autocomplete-wrapper">
                          <input
                            type="text"
                            class="table-input font-medium text-slate-800"
                            [(ngModel)]="item.nombreBeneficiario"
                            (input)="alEscribirBeneficiario(item, i, $event)"
                            (focus)="alEnfocarBeneficiario(item, i)"
                            (blur)="alDesenfocarBeneficiario()"
                            placeholder="Escribe mínimo 3 caracteres..."
                            autocomplete="off"
                            data-testid="input-beneficiario-autocomplete"
                          />

                          <!-- Ícono Spinner de Carga mientras realiza la búsqueda -->
                          <div *ngIf="buscandoTerceros() && filaActivaIndex === i" class="input-spinner-wrap">
                            <div class="spinner-svg"></div>
                          </div>

                          <!-- Dropdown de Autocompletado con Consulta a la Base de Datos -->
                          <div
                            *ngIf="filaActivaIndex === i && (item.nombreBeneficiario?.trim()?.length || 0) >= 3"
                            class="autocomplete-dropdown"
                          >
                            <!-- Estado 1: Consultando en tiempo real -->
                            <div *ngIf="buscandoTerceros()" class="autocomplete-loading">
                              <div class="spinner-svg inline-block mr-2 align-middle"></div>
                              <span class="align-middle">Buscando en base de datos...</span>
                            </div>

                            <!-- Estado 2: Sin resultados en la BD -->
                            <div
                              *ngIf="!buscandoTerceros() && sugerenciasTerceros().length === 0"
                              class="autocomplete-empty-state"
                            >
                              <div class="empty-icon">🔎</div>
                              <div class="empty-title">0 resultados encontrados</div>
                              <div class="empty-desc">
                                No hay coincidencias en la BD para "<strong>{{ item.nombreBeneficiario }}</strong>". Puedes continuar escribiendo el nombre manualmente.
                              </div>
                            </div>

                            <!-- Estado 3: Lista de Resultados -->
                            <ng-container *ngIf="!buscandoTerceros() && sugerenciasTerceros().length > 0">
                              <div class="autocomplete-header-info">
                                <span>{{ sugerenciasTerceros().length }} resultado{{ sugerenciasTerceros().length > 1 ? 's' : '' }} en base de datos</span>
                              </div>
                              <div
                                *ngFor="let t of sugerenciasTerceros()"
                                class="autocomplete-option"
                                (mousedown)="seleccionarTercero(item, t)"
                              >
                                <div class="flex items-center justify-between gap-2">
                                  <span class="font-bold text-slate-900 text-xs truncate">{{ t.nombreCompleto || t.razonSocial }}</span>
                                  <span class="badge-role-tag" [ngClass]="getBadgeRolClass(t)">
                                    {{ getRolLabel(t) }}
                                  </span>
                                </div>
                                <div class="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                                  <span>{{ t.tipoDocumento || 'CC' }}: {{ t.numeroDocumento }}</span>
                                  <span *ngIf="t.bancoNombre" class="text-indigo-600 font-medium">
                                    🏦 {{ t.bancoNombre }} {{ t.numeroCuenta ? '• ' + t.numeroCuenta : '' }}
                                  </span>
                                </div>
                              </div>
                            </ng-container>
                          </div>
                        </div>
                      </td>
                      <td>
                        <input type="text" class="table-input font-mono" [(ngModel)]="item.numeroDocumento" placeholder="NIT/CC" />
                      </td>
                      <td>
                        <select
                          class="table-input"
                          [(ngModel)]="item.bancoDestinoNombre"
                          (ngModelChange)="alCambiarBancoDestino(item)"
                        >
                          @for (banco of bancosDisponibles; track banco.codigo) {
                            <option [value]="banco.nombre">{{ banco.nombre }}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="table-input" [(ngModel)]="item.tipoCuentaDestinatario">
                          <option value="AHORROS">Ahorros</option>
                          <option value="CORRIENTE">Corriente</option>
                        </select>
                      </td>
                      <td>
                        <input type="text" class="table-input font-mono" [(ngModel)]="item.numeroCuentaDestinatario" placeholder="Cuenta" />
                      </td>
                      <td>
                        <input type="number" class="table-input text-right font-bold" [(ngModel)]="item.monto" />
                      </td>
                      <td>
                        <input type="text" class="table-input" [(ngModel)]="item.referenciaPago" placeholder="Ref" />
                      </td>
                      <td>
                        <input type="email" class="table-input" [(ngModel)]="item.emailNotificacion" placeholder="Email" />
                      </td>
                      <td class="text-center">
                        <button type="button" class="btn-delete-row" (click)="eliminarFilaItem(i)" title="Eliminar fila">✕</button>
                      </td>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="cerrarModalNuevo()">Cancelar</button>
            <button
              type="button"
              class="btn-primary"
              [disabled]="guardando() || nuevoLote.items.length === 0"
              (click)="guardarNuevoLote()"
              data-testid="btn-guardar-lote"
            >
              {{ guardando() ? 'Generando...' : '💾 Generar Archivo y Guardar Lote' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: CONFIRMAR Y CONTABILIZAR EGRESO -->
      <div class="modal-backdrop" *ngIf="mostrarModalConfirmar()" data-testid="modal-confirmar-lote">
        <div class="modal-content modal-md">
          <div class="modal-header">
            <h3 class="modal-title">Confirmar Dispersión y Contabilizar Egreso</h3>
            <button type="button" class="btn-close" (click)="cerrarModalConfirmar()">✕</button>
          </div>
          <div class="modal-body" *ngIf="loteSeleccionado()">
            <div class="alert-info-box mb-4">
              <p class="text-xs">
                Se generará un <strong>Comprobante de Egreso (EGR)</strong> con cancelación de obligaciones a
                <strong>{{ loteSeleccionado()?.totalRegistros }} beneficiarios</strong> por valor total de
                <strong>{{ loteSeleccionado()?.montoTotal | currency:'COP':'symbol-narrow':'1.0-0' }}</strong>.
              </p>
            </div>

            <div class="form-group mb-3">
              <label class="form-label">Cuenta Contable Bancaria (Crédito)</label>
              <input
                type="text"
                class="form-input font-mono"
                [(ngModel)]="confirmarDto.cuentaPucBanco"
                placeholder="111005 (Bancos Nacionales)"
                data-testid="input-cuenta-banco-confirmar"
              />
            </div>

            <div class="form-group mb-3">
              <label class="form-label">Fecha Contable</label>
              <input
                type="text"
                appFlatpickr
                class="form-input"
                [(ngModel)]="confirmarDto.fechaContable"
                placeholder="dd/mm/aaaa"
                data-testid="input-confirmar-fecha"
              />
            </div>

            <div class="form-group mb-3">
              <label class="form-label">Detalle del Egreso</label>
              <input
                type="text"
                class="form-input"
                [(ngModel)]="confirmarDto.detalleEgreso"
                placeholder="Dispersión bancaria masiva lote..."
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="cerrarModalConfirmar()">Cancelar</button>
            <button
              type="button"
              class="btn-success"
              [disabled]="guardando()"
              (click)="ejecutarConfirmacion()"
              data-testid="btn-ejecutar-confirmacion"
            >
              {{ guardando() ? 'Contabilizando...' : '✅ Confirmar y Generar Egreso' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: DETALLE Y VISOR DE ARCHIVO PLANO -->
      <div class="modal-backdrop" *ngIf="mostrarModalDetalle()" data-testid="modal-detalle-lote">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Detalle del Lote {{ loteSeleccionado()?.codigoLote }}</h3>
            <button type="button" class="btn-close" (click)="cerrarModalDetalle()">✕</button>
          </div>
          <div class="modal-body" *ngIf="loteSeleccionado()">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-xs text-slate-500">
                Formato: <strong>{{ loteSeleccionado()?.formatoBanco }}</strong> | Beneficiarios: <strong>{{ loteSeleccionado()?.totalRegistros }}</strong>
              </span>
              <button
                type="button"
                class="btn-secondary btn-sm"
                (click)="descargarArchivo(loteSeleccionado()!)"
              >
                ⬇️ Descargar {{ loteSeleccionado()?.archivoNombre }}
              </button>
            </div>

            <div class="form-group mb-3">
              <label class="form-label">Estructura del Archivo Plano Generado</label>
              <textarea
                class="form-textarea font-mono text-xs bg-slate-900 text-emerald-400 p-3 rounded"
                rows="8"
                readonly
                [value]="loteSeleccionado()?.contenidoArchivo || 'Cargando contenido...'"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-primary" (click)="cerrarModalDetalle()">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dispersion-container {
      padding: 0.5rem;
    }
    .disp-header-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .disp-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .disp-icon-wrap {
      font-size: 2rem;
      line-height: 1;
    }
    .disp-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .disp-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .disp-title-text {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .disp-subtitle-text {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }
    .badge-enterprise {
      background: rgba(99, 102, 241, 0.15);
      color: #4f46e5;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .kpi-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .kpi-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    .kpi-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin-top: 0.25rem;
    }
    .kpi-subtext {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }
    .filter-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
    }
    .filter-row {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    .table-custom {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.825rem;
    }
    .table-custom th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    .table-custom td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
      font-weight: 600;
      font-size: 0.825rem;
      height: 38px;
      min-height: 38px;
      padding: 0 1rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      box-sizing: border-box;
      transition: all 0.2s;
    }
    .btn-primary:hover {
      background: #4338ca;
    }
    .btn-secondary {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      font-size: 0.825rem;
      height: 38px;
      min-height: 38px;
      padding: 0 0.875rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      box-sizing: border-box;
    }
    .btn-sm {
      height: 32px !important;
      min-height: 32px !important;
      padding: 0 0.75rem !important;
      font-size: 0.75rem !important;
      border-radius: 0.375rem !important;
    }
    .btn-success {
      background: #059669;
      color: #ffffff;
      font-weight: 600;
      font-size: 0.825rem;
      height: 38px;
      min-height: 38px;
      padding: 0 1rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
    .btn-icon {
      background: transparent;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .badge-tag {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: 0.375rem;
    }
    .badge-tag-prov {
      background: #e0e7ff;
      color: #3730a3;
    }
    .badge-tag-nom {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-status {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }
    .badge-gen {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge-app {
      background: #d1fae5;
      color: #065f46;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 1rem;
    }
    .modal-content {
      background: #ffffff;
      border-radius: 0.75rem;
      width: 100%;
      max-height: 94vh;
      min-height: 720px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    }
    .modal-md { max-width: 540px; }
    .modal-lg { max-width: 850px; }
    .modal-xl { max-width: 1380px; width: 95vw; }
    .modal-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .modal-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
    }
    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
      flex: 1;
    }
    .modal-footer {
      padding: 0.875rem 1.25rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      background: #f8fafc;
    }
    .form-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.875rem;
      align-items: start;
    }
    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.875rem;
      align-items: start;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.875rem;
      align-items: start;
    }
    @media (max-width: 900px) {
      .form-grid-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .form-grid-3, .form-grid-2 {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 600px) {
      .form-grid-4 {
        grid-template-columns: 1fr;
      }
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      width: 100%;
    }
    .form-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      height: 1.1rem;
      line-height: 1.1rem;
      margin: 0;
      display: flex;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .form-input, .form-select {
      height: 38px;
      min-height: 38px;
      max-height: 38px;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0 0.75rem;
      font-size: 0.825rem;
      line-height: 38px;
      color: #1e293b;
      background-color: #ffffff;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-input:focus, .form-select:focus, .table-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
    :host ::ng-deep .flatpickr-wrapper {
      width: 100% !important;
      display: block !important;
      position: relative !important;
    }
    :host ::ng-deep input.flatpickr-enhanced-input,
    :host ::ng-deep input.flatpickr-input,
    :host ::ng-deep .form-input.flatpickr-enhanced-input {
      height: 38px !important;
      min-height: 38px !important;
      max-height: 38px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 0.5rem !important;
      padding: 0 2.5rem 0 0.75rem !important;
      font-size: 0.825rem !important;
      line-height: 38px !important;
      color: #1e293b !important;
      background-color: #ffffff !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 0.75rem center !important;
      background-size: 1.1rem 1.1rem !important;
      cursor: pointer !important;
      outline: none !important;
      display: block !important;
      transition: border-color 0.2s, box-shadow 0.2s !important;
    }
    :host ::ng-deep input.flatpickr-enhanced-input:focus,
    :host ::ng-deep input.flatpickr-input:focus {
      border-color: #6366f1 !important;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
    }
    .table-input {
      height: 32px;
      min-height: 32px;
      max-height: 32px;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #cbd5e1;
      border-radius: 0.375rem;
      padding: 0 0.5rem;
      font-size: 0.75rem;
      line-height: 32px;
      color: #1e293b;
      background-color: #ffffff;
      outline: none;
    }
    .btn-delete-row {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      width: 32px;
      min-height: 32px;
      min-width: 32px;
      border-radius: 0.375rem;
      border: 1px solid #fecaca;
      background: #fee2e2;
      color: #ef4444;
      font-weight: bold;
      font-size: 0.8rem;
      cursor: pointer;
      padding: 0;
      transition: background 0.15s;
    }
    .btn-delete-row:hover {
      background: #fecaca;
      color: #b91c1c;
    }
    .alert-info-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.5rem;
      padding: 0.75rem;
      color: #1e40af;
    }
    .autocomplete-wrapper {
      position: relative;
      width: 100%;
    }
    .autocomplete-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      min-width: 320px;
      max-width: 420px;
      max-height: 220px;
      overflow-y: auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      z-index: 1000;
    }
    .autocomplete-option {
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      border-bottom: 1px solid #f1f5f9;
      transition: background-color 0.15s;
    }
    .autocomplete-option:last-child {
      border-bottom: none;
    }
    .autocomplete-option:hover {
      background-color: #f1f5f9;
    }
    .autocomplete-loading {
      padding: 0.5rem 0.75rem;
      color: #64748b;
      font-size: 0.75rem;
      text-align: center;
    }
    .autocomplete-header-info {
      padding: 0.35rem 0.75rem;
      font-size: 0.68rem;
      font-weight: 600;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .autocomplete-empty-state {
      padding: 1.15rem 0.875rem;
      text-align: center;
      background: #ffffff;
    }
    .autocomplete-empty-state .empty-icon {
      font-size: 1.35rem;
      margin-bottom: 0.25rem;
    }
    .autocomplete-empty-state .empty-title {
      font-weight: 700;
      font-size: 0.8rem;
      color: #334155;
    }
    .autocomplete-empty-state .empty-desc {
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 0.25rem;
      line-height: 1.35;
    }
    .input-spinner-wrap {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .spinner-svg {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(99, 102, 241, 0.25);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin-loading 0.6s linear infinite;
    }
    @keyframes spin-loading {
      to { transform: rotate(360deg); }
    }
    .badge-role-tag {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 0.25rem;
      text-transform: uppercase;
    }
  `]
})
export class ContabilidadDispersionComponent implements OnInit {
  private readonly contabilidadService = inject(ContabilidadService);

  cargando = signal<boolean>(false);
  guardando = signal<boolean>(false);
  lotes = signal<DispersionLoteModel[]>([]);
  loteSeleccionado = signal<DispersionLoteModel | null>(null);

  mostrarModalNuevo = signal<boolean>(false);
  mostrarModalConfirmar = signal<boolean>(false);
  mostrarModalDetalle = signal<boolean>(false);

  filtroTipo: string = '';
  filtroEstado: string = '';

  terceros = signal<Tercero[]>([]);
  sugerenciasTerceros = signal<Tercero[]>([]);
  buscandoTerceros = signal<boolean>(false);
  filaActivaIndex: number | null = null;
  private searchSubject = new Subject<{ term: string; rowIndex: number }>();

  readonly bancosDisponibles = [
    { codigo: '007', nombre: 'Bancolombia' },
    { codigo: '051', nombre: 'Davivienda' },
    { codigo: '001', nombre: 'Banco de Bogotá' },
    { codigo: '023', nombre: 'Banco de Occidente' },
    { codigo: '013', nombre: 'BBVA Colombia' },
    { codigo: '052', nombre: 'Banco AV Villas' },
    { codigo: '002', nombre: 'Banco Popular' },
    { codigo: '032', nombre: 'Banco Caja Social' },
    { codigo: '019', nombre: 'Scotiabank Colpatria' },
    { codigo: '040', nombre: 'Banco Agrario' },
    { codigo: '065', nombre: 'Banco Santander' },
    { codigo: '006', nombre: 'Banco Itaú' },
    { codigo: '009', nombre: 'Citibank' },
    { codigo: '060', nombre: 'Banco Pichincha' },
    { codigo: '059', nombre: 'Bancamía' },
    { codigo: '507', nombre: 'Nequi' },
    { codigo: '551', nombre: 'Daviplata' },
    { codigo: '099', nombre: 'Otro Banco / Entidad' },
  ];

  // Modelo para nuevo lote
  nuevoLote: CrearDispersionLoteModel = {
    tipo: 'PROVEEDORES',
    formatoBanco: 'ASOBANCARIA_2001',
    bancoOrigen: 'Bancolombia',
    numeroCuentaOrigen: '12345678901',
    tipoCuentaOrigen: 'CORRIENTE',
    fechaAplicacion: new Date().toISOString().split('T')[0],
    observaciones: '',
    items: [],
  };

  // Terceros filtrados según el tipo de dispersión
  tercerosFiltrados = computed(() => {
    const list = this.terceros();
    const tipo = this.nuevoLote.tipo;
    if (tipo === 'NOMINA') {
      const soloNomina = list.filter((t) => t.esDocente || t.esColaborador);
      return soloNomina.length > 0 ? soloNomina : list.filter((t) => t.tipoPersona === 'NATURAL');
    }
    if (tipo === 'PROVEEDORES') {
      const soloProv = list.filter((t) => t.esProveedor || t.tipoPersona === 'JURIDICA');
      return soloProv.length > 0 ? soloProv : list;
    }
    return list;
  });

  // Modelo para confirmación
  confirmarDto: ConfirmarDispersionLoteModel = {
    cuentaPucBanco: '111005',
    fechaContable: new Date().toISOString().split('T')[0],
    detalleEgreso: '',
  };

  // KPIs Computados
  totalMontoDispersado = computed(() => {
    return this.lotes().reduce((acc, curr) => acc + Number(curr.montoTotal || 0), 0);
  });

  totalLotesAplicados = computed(() => {
    return this.lotes().filter((l) => l.estado === 'APLICADO').length;
  });

  ngOnInit(): void {
    this.cargarLotes();
    this.cargarTercerosDirectorio();

    // Pipeline de búsqueda reactiva en tiempo real contra la base de datos (mínimo 3 caracteres)
    this.searchSubject
      .pipe(
        debounceTime(250),
        switchMap(({ term }) => {
          const clean = term?.trim() || '';
          if (clean.length < 3) {
            this.buscandoTerceros.set(false);
            return of([]);
          }
          this.buscandoTerceros.set(true);
          return this.contabilidadService.getTerceros(clean, 20).pipe(
            catchError(() => of([])),
            finalize(() => this.buscandoTerceros.set(false))
          );
        })
      )
      .subscribe((resultados) => {
        this.sugerenciasTerceros.set(resultados || []);
      });
  }

  cargarTercerosDirectorio(): void {
    this.contabilidadService.getTerceros('', 500).subscribe({
      next: (data) => {
        this.terceros.set(data || []);
      },
    });
  }

  cargarLotes(): void {
    this.cargando.set(true);
    const filtros: any = {};
    if (this.filtroTipo) filtros.tipo = this.filtroTipo;
    if (this.filtroEstado) filtros.estado = this.filtroEstado;

    this.contabilidadService.listarLotesDispersion(filtros).subscribe({
      next: (data) => {
        this.lotes.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  abrirModalNuevoLote(): void {
    this.nuevoLote = {
      tipo: 'PROVEEDORES',
      formatoBanco: 'ASOBANCARIA_2001',
      bancoOrigen: 'Bancolombia',
      numeroCuentaOrigen: '12345678901',
      tipoCuentaOrigen: 'CORRIENTE',
      fechaAplicacion: new Date().toISOString().split('T')[0],
      observaciones: '',
      items: [],
    };
    this.cargarTercerosDirectorio();
    this.mostrarModalNuevo.set(true);
  }

  cerrarModalNuevo(): void {
    this.mostrarModalNuevo.set(false);
    this.filaActivaIndex = null;
    this.sugerenciasTerceros.set([]);
  }

  cargarPendientesAuto(): void {
    this.contabilidadService.obtenerPendientesDispersion(this.nuevoLote.tipo).subscribe({
      next: (items) => {
        this.nuevoLote.items = items && Array.isArray(items) ? [...items] : [];
      },
      error: () => {
        // En caso de error o sin datos pendientes, no inyectar registros ficticios
      },
    });
  }

  agregarFilaItem(): void {
    this.nuevoLote.items.push({
      nombreBeneficiario: '',
      tipoDocumento: 'CC',
      numeroDocumento: '',
      bancoDestinoCodigo: '007',
      bancoDestinoNombre: 'Bancolombia',
      tipoCuentaDestinatario: 'AHORROS',
      numeroCuentaDestinatario: '',
      monto: 0,
      referenciaPago: '',
      emailNotificacion: '',
    });
  }

  alEscribirBeneficiario(item: DispersionItemModel, rowIndex: number, event: Event): void {
    const val = (event.target as HTMLInputElement)?.value || '';
    item.nombreBeneficiario = val;
    this.filaActivaIndex = rowIndex;
    if (val.trim().length < 3) {
      this.sugerenciasTerceros.set([]);
      this.buscandoTerceros.set(false);
    }
    this.searchSubject.next({ term: val, rowIndex });
  }

  alEnfocarBeneficiario(item: DispersionItemModel, rowIndex: number): void {
    this.filaActivaIndex = rowIndex;
    const term = item.nombreBeneficiario?.trim() || '';
    if (term.length >= 3) {
      this.searchSubject.next({ term, rowIndex });
    } else {
      this.sugerenciasTerceros.set([]);
      this.buscandoTerceros.set(false);
    }
  }

  alDesenfocarBeneficiario(): void {
    setTimeout(() => {
      if (this.filaActivaIndex !== null) {
        this.filaActivaIndex = null;
      }
    }, 250);
  }

  seleccionarTercero(item: DispersionItemModel, t: Tercero): void {
    this.asignarDatosTercero(item, t);
    this.filaActivaIndex = null;
    this.sugerenciasTerceros.set([]);
  }

  asignarDatosTercero(item: DispersionItemModel, t: Tercero): void {
    item.terceroId = t.id;
    item.nombreBeneficiario = t.nombreCompleto || t.razonSocial || `${t.primerNombre || ''} ${t.primerApellido || ''}`.trim();
    item.tipoDocumento = (t.tipoDocumento || t.tipoIdentificacion || 'CC') as string;
    item.numeroDocumento = t.numeroDocumento || t.numeroIdentificacion || '';
    if (t.bancoNombre) {
      item.bancoDestinoNombre = t.bancoNombre;
      item.bancoDestinoCodigo = t.bancoCodigo || this.getBancoCodigo(t.bancoNombre);
    }
    if (t.tipoCuenta) {
      item.tipoCuentaDestinatario = t.tipoCuenta === 'CORRIENTE' ? 'CORRIENTE' : 'AHORROS';
    }
    if (t.numeroCuenta) {
      item.numeroCuentaDestinatario = t.numeroCuenta;
    }
    if (t.email) {
      item.emailNotificacion = t.email;
    }
  }

  getBancoCodigo(nombre?: string): string {
    if (!nombre) return '007';
    const found = this.bancosDisponibles.find((b) => b.nombre.toLowerCase() === nombre.toLowerCase());
    return found ? found.codigo : '007';
  }

  getRolLabel(t: Tercero): string {
    if (t.esDocente) return 'Docente';
    if (t.esColaborador) return 'Colaborador';
    if (t.esProveedor) return 'Proveedor';
    if (t.esAcudiente) return 'Acudiente';
    if (t.esEstudiante) return 'Estudiante';
    return 'Tercero';
  }

  getBadgeRolClass(t: Tercero): string {
    if (t.esDocente) return 'bg-amber-100 text-amber-800';
    if (t.esColaborador) return 'bg-blue-100 text-blue-800';
    if (t.esProveedor) return 'bg-purple-100 text-purple-800';
    if (t.esAcudiente) return 'bg-emerald-100 text-emerald-800';
    if (t.esEstudiante) return 'bg-slate-100 text-slate-800';
    return 'bg-gray-100 text-gray-800';
  }

  eliminarFilaItem(index: number): void {
    this.nuevoLote.items.splice(index, 1);
  }

  alCambiarBancoDestino(item: any): void {
    const encontrado = this.bancosDisponibles.find((b) => b.nombre === item.bancoDestinoNombre);
    if (encontrado) {
      item.bancoDestinoCodigo = encontrado.codigo;
    }
  }

  calcularTotalNuevoLote(): number {
    return this.nuevoLote.items.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
  }

  guardarNuevoLote(): void {
    if (this.nuevoLote.items.length === 0) return;
    this.guardando.set(true);

    this.contabilidadService.crearLoteDispersion(this.nuevoLote).subscribe({
      next: (loteCreado) => {
        this.guardando.set(false);
        this.cerrarModalNuevo();
        this.cargarLotes();
      },
      error: () => {
        this.guardando.set(false);
      },
    });
  }

  verDetalleLote(lote: DispersionLoteModel): void {
    this.contabilidadService.obtenerLoteDispersion(lote.id).subscribe({
      next: (detalle) => {
        this.loteSeleccionado.set(detalle);
        this.mostrarModalDetalle.set(true);
      },
    });
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle.set(false);
    this.loteSeleccionado.set(null);
  }

  descargarArchivo(lote: DispersionLoteModel): void {
    this.contabilidadService.descargarArchivoDispersion(lote.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = lote.archivoNombre || `${lote.codigoLote}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
    });
  }

  abrirModalConfirmar(lote: DispersionLoteModel): void {
    this.loteSeleccionado.set(lote);
    this.confirmarDto = {
      cuentaPucBanco: '111005',
      fechaContable: lote.fechaAplicacion || new Date().toISOString().split('T')[0],
      detalleEgreso: `Dispersión bancaria masiva ${lote.codigoLote} - ${lote.bancoOrigen}`,
    };
    this.mostrarModalConfirmar.set(true);
  }

  cerrarModalConfirmar(): void {
    this.mostrarModalConfirmar.set(false);
    this.loteSeleccionado.set(null);
  }

  ejecutarConfirmacion(): void {
    const lote = this.loteSeleccionado();
    if (!lote) return;
    this.guardando.set(true);

    this.contabilidadService.confirmarLoteDispersion(lote.id, this.confirmarDto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModalConfirmar();
        this.cargarLotes();
      },
      error: () => {
        this.guardando.set(false);
      },
    });
  }

  getTipoBadgeClass(tipo: string): string {
    return tipo === 'NOMINA' ? 'badge-tag-nom' : 'badge-tag-prov';
  }

  getEstadoBadgeClass(estado: string): string {
    return estado === 'APLICADO' ? 'badge-app' : 'badge-gen';
  }
}
