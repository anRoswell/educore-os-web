import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DianService } from '../services/dian.service';
import {
  DocumentoElectronicoModel,
  DianConfigModel,
  TipoDocumentoElectronico,
  EstadoDianDocumento,
} from '../models/contabilidad.models';
import { ModalConfigDianComponent } from '../modals/modal-config-dian.component';
import { ModalNotaCreditoDianComponent } from '../modals/modal-nota-credito-dian.component';
import { ModalDocumentoSoporteComponent } from '../modals/modal-documento-soporte.component';

@Component({
  selector: 'app-contabilidad-dian',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalConfigDianComponent,
    ModalNotaCreditoDianComponent,
    ModalDocumentoSoporteComponent,
  ],
  styles: [`
    .dian-header-banner {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      border: 1.5px solid #e2e8f0;
      border-left: 5px solid #4f46e5;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.03);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .dian-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .dian-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #eef2ff;
      border: 1.5px solid #c7d2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }
    .dian-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .dian-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .dian-title-text {
      font-size: 1.125rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .dian-subtitle-text {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .dian-actions-wrap {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }

    /* KPI Cards Grid & Widgets Estilo NIIF 15 */
    .dian-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .dian-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .dian-kpis-grid {
        grid-template-columns: 1fr;
      }
    }

    .kpi-widget-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
    }
    .kpi-widget-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
      border-color: #cbd5e1;
    }
    .kpi-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }
    .kpi-widget-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    .kpi-widget-value {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: var(--font-mono);
      line-height: 1.2;
    }
    .kpi-widget-footer {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.35rem;
    }
  `],
  template: `
    <div class="tab-content space-y-4" data-testid="tab-content-dian">
      <!-- Status Banner & Config Bar -->
      <div class="dian-header-banner" data-testid="dian-status-banner">
        <div class="dian-header-main">
          <div class="dian-icon-wrap">🏛️</div>
          <div class="dian-texts-wrap">
            <div class="dian-title-row">
              <h3 class="dian-title-text" data-testid="dian-header-title">
                Facturación Electrónica DIAN & Documentos Electrónicos
              </h3>
              @if (configurado()) {
                <span
                  class="badge-mini"
                  [ngClass]="{
                    'bg-emerald-100 text-emerald-800 border-emerald-200': configDian()?.ambiente === 'PRODUCCION',
                    'bg-amber-100 text-amber-800 border-amber-200': configDian()?.ambiente === 'HABILITACION'
                  }"
                  data-testid="badge-ambiente-dian"
                >
                  {{ configDian()?.ambiente }}
                </span>
              } @else {
                <span class="badge-mini bg-red-100 text-red-700 border-red-200" data-testid="badge-no-configurado">
                  NO CONFIGURADO
                </span>
              }
            </div>
            <p class="dian-subtitle-text">
              @if (configurado()) {
                <span>NIT: <strong>{{ configDian()?.nitEmisor }}-{{ configDian()?.dvEmisor }}</strong> ({{ configDian()?.razonSocialEmisor }}) | Prefijo: <strong>{{ configDian()?.prefijoFactura }}</strong> | Rango: {{ configDian()?.rangoDesde }} - {{ configDian()?.rangoHasta }}</span>
              } @else {
                <span>El colegio no ha configurado sus credenciales de firma digital ni rangos de numeración DIAN.</span>
              }
            </p>
          </div>
        </div>

        <div class="dian-actions-wrap flex items-center gap-2.5">
          <button
            type="button"
            class="btn btn-secondary btn-sm flex items-center gap-1.5 font-medium"
            data-testid="btn-abrir-config-dian"
            (click)="abrirModalConfig()"
          >
            <span>⚙️</span>
            <span>Configurar DIAN</span>
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold shadow-sm"
            data-testid="btn-nuevo-doc-soporte"
            (click)="abrirModalDs()"
          >
            <span>📋</span>
            <span>Nuevo Doc. Soporte</span>
          </button>
        </div>
      </div>

      <!-- Feedback Alerts -->
      @if (mensajeExito()) {
        <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center justify-between" data-testid="alert-dian-success">
          <span>✅ {{ mensajeExito() }}</span>
          <button type="button" class="text-emerald-700 font-bold ml-2" (click)="mensajeExito.set(null)">✕</button>
        </div>
      }
      @if (errorMensaje()) {
        <div class="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3 flex items-center justify-between" data-testid="alert-dian-error">
          <span>⚠️ {{ errorMensaje() }}</span>
          <button type="button" class="text-red-700 font-bold ml-2" (click)="errorMensaje.set(null)">✕</button>
        </div>
      }

      <!-- KPI Summary Cards (Grid de 4 Columnas estilo NIIF 15) -->
      <div class="dian-kpis-grid" data-testid="dian-kpi-cards">
        <!-- KPI 1: Total Documentos -->
        <div class="kpi-widget-card" data-testid="kpi-total-documentos-card">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title">Total Documentos</span>
            <span class="text-sm">📑</span>
          </div>
          <div class="kpi-widget-value text-slate-800" data-testid="kpi-total-documentos">
            {{ totalEmitidos() }}
          </div>
          <div class="kpi-widget-footer">Emitidos en el sistema</div>
        </div>

        <!-- KPI 2: Aceptados DIAN -->
        <div class="kpi-widget-card" style="border-color: #d1fae5; background: linear-gradient(135deg, rgba(209, 250, 229, 0.25) 0%, #ffffff 100%);">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #047857;">Aceptados DIAN</span>
            <span class="text-sm">✅</span>
          </div>
          <div class="kpi-widget-value" style="color: #047857;" data-testid="kpi-total-aceptados">
            {{ totalAceptados() }}
          </div>
          <div class="kpi-widget-footer" style="color: #059669;">Validados con éxito</div>
        </div>

        <!-- KPI 3: En Proceso / Pendientes -->
        <div class="kpi-widget-card" style="border-color: #fef3c7; background: linear-gradient(135deg, rgba(254, 243, 199, 0.25) 0%, #ffffff 100%);">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #b45309;">En Proceso / Pendientes</span>
            <span class="text-sm">⏳</span>
          </div>
          <div class="kpi-widget-value" style="color: #b45309;" data-testid="kpi-total-pendientes">
            {{ totalPendientes() }}
          </div>
          <div class="kpi-widget-footer" style="color: #d97706;">En transmisión o cola</div>
        </div>

        <!-- KPI 4: Rechazados / Errores -->
        <div class="kpi-widget-card" style="border-color: #fee2e2; background: linear-gradient(135deg, rgba(254, 226, 226, 0.25) 0%, #ffffff 100%);">
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #be123c;">Rechazados / Errores</span>
            <span class="text-sm">⚠️</span>
          </div>
          <div class="kpi-widget-value" style="color: #be123c;" data-testid="kpi-total-rechazados">
            {{ totalRechazados() }}
          </div>
          <div class="kpi-widget-footer" style="color: #e11d48;">Requieren corrección</div>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-wrap items-end gap-3.5" data-testid="dian-filters-bar">
        <div class="form-group-inline flex flex-col gap-1">
          <label class="text-xs font-bold text-slate-700">Tipo Documento</label>
          <select
            class="input-base input-sm text-xs"
            data-testid="select-filtro-tipo-dian"
            [ngModel]="filtroTipo()"
            (ngModelChange)="filtroTipo.set($event); buscar()"
          >
            <option value="">Todos los Tipos</option>
            <option value="FACTURA_VENTA_01">Factura de Venta (01)</option>
            <option value="NOTA_CREDITO_91">Nota Crédito (91)</option>
            <option value="NOTA_DEBITO_92">Nota Débito (92)</option>
            <option value="DOCUMENTO_SOPORTE_05">Documento Soporte (05)</option>
          </select>
        </div>

        <div class="form-group-inline flex flex-col gap-1">
          <label class="text-xs font-bold text-slate-700">Estado DIAN</label>
          <select
            class="input-base input-sm text-xs"
            data-testid="select-filtro-estado-dian"
            [ngModel]="filtroEstado()"
            (ngModelChange)="filtroEstado.set($event); buscar()"
          >
            <option value="">Todos los Estados</option>
            <option value="ACEPTADO">ACEPTADO (Exitoso)</option>
            <option value="ENVIADO">ENVIADO (En validación)</option>
            <option value="FIRMADO">FIRMADO</option>
            <option value="BORRADOR">BORRADOR</option>
            <option value="RECHAZADO">RECHAZADO</option>
          </select>
        </div>

        <div class="form-group-inline flex-1 min-w-[220px] flex flex-col gap-1">
          <label class="text-xs font-bold text-slate-700">Búsqueda</label>
          <input
            type="text"
            class="input-base input-sm text-xs w-full"
            data-testid="input-buscar-dian"
            placeholder="Buscar por número, CUFE, tercero..."
            [ngModel]="filtroBusqueda()"
            (ngModelChange)="filtroBusqueda.set($event)"
            (keyup.enter)="buscar()"
          />
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-secondary btn-sm flex items-center gap-1.5 font-medium"
            data-testid="btn-buscar-dian"
            (click)="buscar()"
          >
            <span>🔍</span>
            <span>Buscar</span>
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-sm flex items-center gap-1.5 font-medium"
            data-testid="btn-limpiar-filtros-dian"
            (click)="limpiarFiltros()"
          >
            <span>✕</span>
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" data-testid="dian-table-container">
        @if (cargando()) {
          <div class="flex justify-center py-12" data-testid="dian-loading-spinner">
            <div class="spinner"></div>
          </div>
        } @else {
          <table class="data-table w-full text-left text-xs" data-testid="table-documentos-dian">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th class="p-3">Documento</th>
                <th class="p-3">Tipo</th>
                <th class="p-3">Adquiriente / Tercero</th>
                <th class="p-3">Fecha Emisión</th>
                <th class="p-3 text-right">Total (COP)</th>
                <th class="p-3 text-center">Estado DIAN</th>
                <th class="p-3">CUFE / CUDE</th>
                <th class="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (documentos().length === 0) {
                <tr>
                  <td colspan="8" class="p-8 text-center text-slate-400" data-testid="row-no-data-dian">
                    No se encontraron documentos electrónicos con los filtros especificados.
                  </td>
                </tr>
              }
              @for (doc of documentos(); track doc.id) {
                <tr class="hover:bg-slate-50/80 transition-colors" [attr.data-testid]="'row-doc-' + doc.id">
                  <td class="p-3 font-mono font-bold text-slate-800">
                    {{ doc.prefijo }}-{{ doc.numero }}
                  </td>
                  <td class="p-3">
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-semibold"
                      [ngClass]="{
                        'bg-blue-50 text-blue-700 border border-blue-200': doc.tipoDocumento === 'FACTURA_VENTA_01',
                        'bg-amber-50 text-amber-700 border border-amber-200': doc.tipoDocumento === 'NOTA_CREDITO_91',
                        'bg-purple-50 text-purple-700 border border-purple-200': doc.tipoDocumento === 'NOTA_DEBITO_92',
                        'bg-indigo-50 text-indigo-700 border border-indigo-200': doc.tipoDocumento === 'DOCUMENTO_SOPORTE_05'
                      }"
                    >
                      {{ doc.tipoDocumento }}
                    </span>
                  </td>
                  <td class="p-3">
                    @if (doc.tercero) {
                      <div class="font-medium text-slate-700">{{ doc.tercero.nombreCompleto || doc.tercero.razonSocial }}</div>
                      <div class="text-[10px] text-slate-400">Doc: {{ doc.tercero.numeroIdentificacion || 'N/A' }}</div>
                    } @else if (doc.cuentaCobro) {
                      <div class="font-medium text-slate-700">{{ doc.cuentaCobro.estudianteNombre || 'Estudiante' }}</div>
                      <div class="text-[10px] text-slate-400">Ref: {{ doc.cuentaCobro.numeroFactura || doc.cuentaCobro.id }}</div>
                    } @else {
                      <span class="text-slate-400 italic">No asociado</span>
                    }
                  </td>
                  <td class="p-3 text-slate-600">
                    {{ doc.fechaEmision | date:'yyyy-MM-dd HH:mm' }}
                  </td>
                  <td class="p-3 text-right font-mono font-semibold text-slate-800">
                    \${{ doc.total | number:'1.0-0' }}
                  </td>
                  <td class="p-3 text-center">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold inline-block"
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-800': doc.estadoDian === 'ACEPTADO',
                        'bg-amber-100 text-amber-800': doc.estadoDian === 'ENVIADO' || doc.estadoDian === 'BORRADOR' || doc.estadoDian === 'FIRMADO',
                        'bg-red-100 text-red-800': doc.estadoDian === 'RECHAZADO'
                      }"
                      [attr.data-testid]="'badge-estado-' + doc.id"
                      [title]="doc.mensajeRespuestaDian || ''"
                    >
                      {{ doc.estadoDian }}
                    </span>
                  </td>
                  <td class="p-3">
                    @if (doc.cufeCude) {
                      <div class="font-mono text-[10px] text-slate-500 max-w-[130px] truncate" [title]="doc.cufeCude">
                        {{ doc.cufeCude }}
                      </div>
                    } @else {
                      <span class="text-slate-300 text-[10px] italic">Sin generar</span>
                    }
                  </td>
                  <td class="p-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <!-- XML Download -->
                      <button
                        type="button"
                        class="btn-secondary btn-xs p-1"
                        title="Descargar XML firmado UBL 2.1"
                        [attr.data-testid]="'btn-xml-' + doc.id"
                        (click)="descargarXml(doc)"
                      >
                        📥 XML
                      </button>

                      <!-- PDF Graphic Representation -->
                      <button
                        type="button"
                        class="btn-secondary btn-xs p-1"
                        title="Descargar Representación Gráfica PDF"
                        [attr.data-testid]="'btn-pdf-' + doc.id"
                        (click)="descargarPdf(doc)"
                      >
                        📄 PDF
                      </button>

                      <!-- Reconsult Status -->
                      <button
                        type="button"
                        class="btn-secondary btn-xs p-1"
                        title="Reconsultar Estado en DIAN (GetStatusZip)"
                        [attr.data-testid]="'btn-reconsultar-' + doc.id"
                        (click)="reconsultar(doc)"
                      >
                        🔄
                      </button>

                      <!-- Emit Nota Credito (if Factura and Aceptado) -->
                      @if (doc.tipoDocumento === 'FACTURA_VENTA_01' && doc.estadoDian === 'ACEPTADO') {
                        <button
                          type="button"
                          class="btn-secondary btn-xs p-1 text-amber-700 hover:bg-amber-50"
                          title="Emitir Nota Crédito referente a esta Factura"
                          [attr.data-testid]="'btn-nc-' + doc.id"
                          (click)="abrirModalNc(doc)"
                        >
                          🧾 NC
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination Bar -->
          <div class="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50" data-testid="dian-pagination-bar">
            <div>
              Total: <strong>{{ total() }}</strong> documentos registrados
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn-secondary btn-xs"
                [disabled]="page() <= 1"
                (click)="cambiarPagina(page() - 1)"
                data-testid="btn-prev-page-dian"
              >
                ◀️ Anterior
              </button>
              <span class="font-semibold text-slate-700">Pág. {{ page() }} de {{ totalPaginas() }}</span>
              <button
                type="button"
                class="btn-secondary btn-xs"
                [disabled]="page() >= totalPaginas()"
                (click)="cambiarPagina(page() + 1)"
                data-testid="btn-next-page-dian"
              >
                Siguiente ▶️
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Modals -->
      <app-modal-config-dian
        [visible]="modalConfigVisible()"
        [configInicial]="configDian()"
        (cerrar)="cerrarModalConfig()"
        (guardado)="onConfigGuardada($event)"
      />

      <app-modal-nota-credito-dian
        [visible]="modalNcVisible()"
        [documento]="documentoSeleccionadoParaNc()"
        (cerrar)="cerrarModalNc()"
        (emitido)="onDocumentoEmitido($event)"
      />

      <app-modal-documento-soporte
        [visible]="modalDsVisible()"
        (cerrar)="cerrarModalDs()"
        (emitido)="onDocumentoEmitido($event)"
      />
    </div>
  `,
})
export class ContabilidadDianComponent implements OnInit {
  private readonly dianService = inject(DianService);

  // States
  readonly documentos = signal<DocumentoElectronicoModel[]>([]);
  readonly total = signal<number>(0);
  readonly page = signal<number>(1);
  readonly limit = signal<number>(15);
  readonly cargando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  // Filters
  readonly filtroTipo = signal<string>('');
  readonly filtroEstado = signal<string>('');
  readonly filtroBusqueda = signal<string>('');

  // DIAN Config status
  readonly configDian = signal<DianConfigModel | null>(null);
  readonly configurado = signal<boolean>(false);
  readonly tieneCertificado = signal<boolean>(false);

  // Modal controls
  readonly modalConfigVisible = signal<boolean>(false);
  readonly modalNcVisible = signal<boolean>(false);
  readonly modalDsVisible = signal<boolean>(false);
  readonly documentoSeleccionadoParaNc = signal<DocumentoElectronicoModel | null>(null);

  // Computed KPIs
  readonly totalEmitidos = computed(() => this.total());
  readonly totalAceptados = computed(() => this.documentos().filter(d => d.estadoDian === 'ACEPTADO').length);
  readonly totalPendientes = computed(() => this.documentos().filter(d => d.estadoDian === 'ENVIADO' || d.estadoDian === 'BORRADOR' || d.estadoDian === 'FIRMADO').length);
  readonly totalRechazados = computed(() => this.documentos().filter(d => d.estadoDian === 'RECHAZADO').length);
  readonly totalPaginas = computed(() => Math.ceil(this.total() / this.limit()) || 1);

  ngOnInit(): void {
    this.cargarConfiguracion();
    this.cargarDocumentos();
  }

  cargarConfiguracion(): void {
    this.dianService.getConfig().subscribe({
      next: (res) => {
        this.configDian.set(res.config);
        this.configurado.set(res.configurado);
        this.tieneCertificado.set(res.tieneCertificado);
      },
      error: () => {
        this.configurado.set(false);
      },
    });
  }

  cargarDocumentos(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.dianService.getDocumentos({
      tipoDocumento: this.filtroTipo() || undefined,
      estadoDian: this.filtroEstado() || undefined,
      search: this.filtroBusqueda().trim() || undefined,
      page: this.page(),
      limit: this.limit(),
    }).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.documentos.set(res.items || []);
        this.total.set(res.total || 0);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err.error?.message || err.message || 'Error cargando documentos electrónicos');
      },
    });
  }

  buscar(): void {
    this.page.set(1);
    this.cargarDocumentos();
  }

  limpiarFiltros(): void {
    this.filtroTipo.set('');
    this.filtroEstado.set('');
    this.filtroBusqueda.set('');
    this.page.set(1);
    this.cargarDocumentos();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas()) {
      this.page.set(nuevaPagina);
      this.cargarDocumentos();
    }
  }

  // Modal Handlers
  abrirModalConfig(): void {
    this.modalConfigVisible.set(true);
  }

  cerrarModalConfig(): void {
    this.modalConfigVisible.set(false);
  }

  onConfigGuardada(config: DianConfigModel): void {
    this.configDian.set(config);
    this.configurado.set(true);
    this.mensajeExito.set('Configuración DIAN actualizada exitosamente.');
    this.cargarConfiguracion();
  }

  abrirModalNc(doc: DocumentoElectronicoModel): void {
    this.documentoSeleccionadoParaNc.set(doc);
    this.modalNcVisible.set(true);
  }

  cerrarModalNc(): void {
    this.modalNcVisible.set(false);
    this.documentoSeleccionadoParaNc.set(null);
  }

  abrirModalDs(): void {
    this.modalDsVisible.set(true);
  }

  cerrarModalDs(): void {
    this.modalDsVisible.set(false);
  }

  onDocumentoEmitido(doc: DocumentoElectronicoModel): void {
    this.mensajeExito.set(`Documento ${doc.prefijo}-${doc.numero} emitido exitosamente (Estado: ${doc.estadoDian}).`);
    this.cargarDocumentos();
  }

  // File downloads
  descargarXml(doc: DocumentoElectronicoModel): void {
    this.dianService.descargarXml(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.prefijo || 'DOC'}_${doc.numero}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMensaje.set(`No se pudo descargar el XML para ${doc.prefijo}-${doc.numero}`);
      },
    });
  }

  descargarPdf(doc: DocumentoElectronicoModel): void {
    this.dianService.descargarPdf(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.prefijo || 'DOC'}_${doc.numero}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMensaje.set(`No se pudo descargar el PDF para ${doc.prefijo}-${doc.numero}`);
      },
    });
  }

  reconsultar(doc: DocumentoElectronicoModel): void {
    this.dianService.reconsultar(doc.id).subscribe({
      next: (res) => {
        this.mensajeExito.set(`Reconsulta DIAN: ${res.estadoDian} - ${res.mensajeRespuesta || 'Actualizado'}`);
        this.cargarDocumentos();
      },
      error: (err) => {
        this.errorMensaje.set(err.error?.message || err.message || 'Error reconsultando estado DIAN');
      },
    });
  }
}
