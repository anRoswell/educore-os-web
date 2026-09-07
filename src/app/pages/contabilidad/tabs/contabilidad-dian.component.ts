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
  template: `
    <div class="tab-content space-y-4" data-testid="tab-content-dian">
      <!-- Status Banner & Config Bar -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4" data-testid="dian-status-banner">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
            🏛️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-slate-800 text-base" data-testid="dian-header-title">
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
            <p class="text-xs text-slate-500 mt-0.5">
              @if (configurado()) {
                <span>NIT: <strong>{{ configDian()?.nitEmisor }}-{{ configDian()?.dvEmisor }}</strong> ({{ configDian()?.razonSocialEmisor }}) | Prefijo: <strong>{{ configDian()?.prefijoFactura }}</strong> | Rango: {{ configDian()?.rangoDesde }} - {{ configDian()?.rangoHasta }}</span>
              } @else {
                <span>El colegio no ha configurado sus credenciales de firma digital ni rangos de numeración DIAN.</span>
              }
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="btn-secondary btn-sm flex items-center gap-1.5"
            data-testid="btn-abrir-config-dian"
            (click)="abrirModalConfig()"
          >
            ⚙️ Configurar DIAN
          </button>
          <button
            type="button"
            class="btn-primary btn-sm flex items-center gap-1.5"
            data-testid="btn-nuevo-doc-soporte"
            [disabled]="!configurado()"
            (click)="abrirModalDs()"
          >
            📋 Nuevo Doc. Soporte
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

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="dian-kpi-cards">
        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">Total Documentos</div>
          <div class="text-xl font-bold text-slate-800 mt-1" data-testid="kpi-total-documentos">{{ totalEmitidos() }}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">Emitidos en el sistema</div>
        </div>
        <div class="bg-white border border-emerald-100 rounded-xl p-3 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
          <div class="text-xs text-emerald-700 font-medium">Aceptados DIAN</div>
          <div class="text-xl font-bold text-emerald-700 mt-1" data-testid="kpi-total-aceptados">{{ totalAceptados() }}</div>
          <div class="text-[10px] text-emerald-600 mt-0.5">Validados con éxito</div>
        </div>
        <div class="bg-white border border-amber-100 rounded-xl p-3 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
          <div class="text-xs text-amber-700 font-medium">En Proceso / Pendientes</div>
          <div class="text-xl font-bold text-amber-700 mt-1" data-testid="kpi-total-pendientes">{{ totalPendientes() }}</div>
          <div class="text-[10px] text-amber-600 mt-0.5">En transmisión o cola</div>
        </div>
        <div class="bg-white border border-red-100 rounded-xl p-3 shadow-sm bg-gradient-to-br from-red-50/40 to-white">
          <div class="text-xs text-red-700 font-medium">Rechazados / Errores</div>
          <div class="text-xl font-bold text-red-700 mt-1" data-testid="kpi-total-rechazados">{{ totalRechazados() }}</div>
          <div class="text-[10px] text-red-600 mt-0.5">Requieren corrección</div>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-3" data-testid="dian-filters-bar">
        <div class="form-group-inline">
          <label class="form-label-sm font-semibold">Tipo Documento</label>
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

        <div class="form-group-inline">
          <label class="form-label-sm font-semibold">Estado DIAN</label>
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

        <div class="form-group-inline flex-1 min-w-[200px]">
          <label class="form-label-sm font-semibold">Búsqueda</label>
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

        <div class="flex items-center gap-2 pt-4">
          <button
            type="button"
            class="btn-secondary btn-sm"
            data-testid="btn-buscar-dian"
            (click)="buscar()"
          >
            🔍 Buscar
          </button>
          <button
            type="button"
            class="btn-secondary btn-sm"
            data-testid="btn-limpiar-filtros-dian"
            (click)="limpiarFiltros()"
          >
            ✕ Limpiar
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
